'use client';

import { useMemo, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { SprintState } from '@/lib/types';
import { DAY_NAMES } from '@/lib/constants';
import { getTotalBuffer, getAdjustedTotal, getSprintDayDate } from '@/lib/utils';

interface Props {
  state: SprintState;
}

interface Point {
  x: number;
  y: number;
}

export function renderBurndownSVG(state: SprintState): { html: string; projection: string } {
  const W = 700, H = 350;
  const pad = { top: 15, right: 25, bottom: 40, left: 45 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;
  const n = state.selectedDays.length;
  const originalMax = state.itemsPlanned;
  const totalBuffer = getTotalBuffer(state);
  const adjustedMax = getAdjustedTotal(state); // itemsPlanned + all scope
  const displayMax = Math.max(originalMax, adjustedMax, 1);

  let html = '';
  let projection = '';

  function px(dayPos: number, displayVal: number): Point {
    return {
      x: pad.left + (dayPos / n) * cw,
      y: pad.top + (1 - displayVal / displayMax) * ch,
    };
  }

  // ── Grid + Y-axis labels ──
  const yTicks = Math.min(displayMax, 10);
  for (let i = 0; i <= yTicks; i++) {
    const y = pad.top + (i / yTicks) * ch;
    const labelVal = displayMax - (i / yTicks) * displayMax;
    html += `<line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" stroke="#eee" stroke-width="1"/>`;
    html += `<text x="${pad.left - 8}" y="${y + 4}" text-anchor="end" fill="#bbb" font-size="11">${Math.round(labelVal)}</text>`;
  }

  // ── X-axis labels ──
  html += `<text x="${pad.left}" y="${H - pad.bottom + 16}" text-anchor="middle" fill="#888" font-size="11">Start</text>`;
  for (let i = 0; i < n; i++) {
    const x = pad.left + ((i + 1) / n) * cw;
    html += `<text x="${x}" y="${H - pad.bottom + 16}" text-anchor="middle" fill="#888" font-size="11">${DAY_NAMES[state.selectedDays[i]]}</text>`;
  }

  // ── Axes ──
  html += `<line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${H - pad.bottom}" stroke="#ddd" stroke-width="1"/>`;
  html += `<line x1="${pad.left}" y1="${H - pad.bottom}" x2="${W - pad.right}" y2="${H - pad.bottom}" stroke="#ddd" stroke-width="1"/>`;

  // ── Ideal lines ──
  // Primary: straight from originalMax (day 0) → 0 (last day)
  {
    const ois = px(0, originalMax);
    const oie = px(n, 0);
    html += `<line x1="${ois.x}" y1="${ois.y}" x2="${oie.x}" y2="${oie.y}" stroke="#ccc" stroke-width="2" stroke-dasharray="6,4"/>`;
  }

  // Adjusted ideal: rebase from FIRST day scope was added (per Sarah's fix)
  if (totalBuffer > 0) {
    const firstBufferDayIdx = (state.bufferValues || []).findIndex(v => v !== null && v > 0);
    if (firstBufferDayIdx >= 0) {
      const idealAtFirstBuffer = originalMax - (firstBufferDayIdx / n) * originalMax;
      const adjustedIdealStart = idealAtFirstBuffer + totalBuffer;
      const ais = px(firstBufferDayIdx, adjustedIdealStart);
      const aie = px(n, 0);
      html += `<line x1="${ais.x}" y1="${ais.y}" x2="${aie.x}" y2="${aie.y}" stroke="#E0E0E0" stroke-width="2" stroke-dasharray="6,4"/>`;
      html += `<text x="${W - pad.right - 5}" y="${px(0, originalMax).y - 8}" text-anchor="end" fill="#ccc" font-size="10">original</text>`;
      html += `<text x="${ais.x + 4}" y="${ais.y - 6}" fill="#bbb" font-size="10">adjusted</text>`;
    }
  }

  // ── Scope change markers (orange vertical lines) ──
  (state.bufferValues || []).forEach((v, i) => {
    if (v !== null && v > 0) {
      const markerX = pad.left + ((i + 1) / n) * cw;
      html += `<line x1="${markerX}" y1="${pad.top}" x2="${markerX}" y2="${H - pad.bottom}" stroke="#FF6F00" stroke-width="1" stroke-dasharray="3,3" opacity="0.45"/>`;
      html += `<text x="${markerX + 3}" y="${pad.top + 13}" fill="#FF6F00" font-size="9" font-weight="600">+${v} scope</text>`;
    }
  });

  // ── Burndown data points ──
  // v2 formula: remaining = itemsPlanned + cumScope - cumDone
  // When scope is added on a day with data, show a step-up before the work
  const points: { pos: number; val: number }[] = [];
  points.push({ pos: 0, val: originalMax });

  let cumDone = 0;
  let cumScope = 0;
  let lastRemaining = originalMax;

  state.dailyValues.forEach((v, i) => {
    const bufAdded = (state.bufferValues || [])[i] || 0;
    cumScope += bufAdded;

    if (v !== null) {
      // If scope was added this day, show visual step-up before work is counted
      if (bufAdded > 0) {
        const remainingAfterScope = lastRemaining + bufAdded;
        points.push({ pos: i + 1, val: remainingAfterScope });
      }

      cumDone += v;
      const remaining = Math.max(0, originalMax + cumScope - cumDone);
      points.push({ pos: i + 1, val: remaining });
      lastRemaining = remaining;
    }
  });

  if (points.length > 1) {
    const lastPt = points[points.length - 1];
    const idealAtLast = adjustedMax - (lastPt.pos / n) * adjustedMax;
    const color = lastPt.val <= idealAtLast ? '#4CAF50' : '#FF5722';

    const pathD = points
      .map((p, i) => {
        const pt = px(p.pos, p.val);
        return (i === 0 ? 'M' : 'L') + pt.x + ',' + pt.y;
      })
      .join(' ');
    html += `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="line-animate"/>`;

    // Data point dots (skip pos=0 start point and step-up duplicates)
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    // Only draw dots at actual daily positions (not step-up intermediates)
    const drawnPositions = new Set<number>();
    points.forEach((p, i) => {
      if (i === 0) return;
      if (drawnPositions.has(p.pos)) return; // skip step-up intermediate
      drawnPositions.add(p.pos);
      const pt = px(p.pos, p.val);
      const sprintDate = getSprintDayDate(state, p.pos - 1);
      const isToday = sprintDate.getTime() === now.getTime();
      html += `<circle cx="${pt.x}" cy="${pt.y}" r="5" fill="${color}" ${isToday ? 'class="point-today"' : ''}/>`;
    });

    // ── Projection (linear regression → when remaining hits 0) ──
    // Use actual daily remaining values (last point at each position)
    const actualPoints: { pos: number; val: number }[] = [];
    points.forEach((p, i) => {
      if (i === 0) return;
      // Keep last point at each position (the one after work, not the step-up)
      const existing = actualPoints.findIndex(a => a.pos === p.pos);
      if (existing >= 0) {
        actualPoints[existing] = p;
      } else {
        actualPoints.push(p);
      }
    });

    if (actualPoints.length >= 2) {
      const xVals = actualPoints.map(p => p.pos);
      const yVals = actualPoints.map(p => p.val);
      const xMean = xVals.reduce((a, b) => a + b, 0) / xVals.length;
      const yMean = yVals.reduce((a, b) => a + b, 0) / yVals.length;
      let num = 0, den = 0;
      for (let k = 0; k < xVals.length; k++) {
        num += (xVals[k] - xMean) * (yVals[k] - yMean);
        den += (xVals[k] - xMean) * (xVals[k] - xMean);
      }
      const slope = den === 0 ? 0 : num / den;
      const intercept = yMean - slope * xMean;

      const lastActual = actualPoints[actualPoints.length - 1];
      const projEnd = slope * n + intercept;
      const projEndClamped = Math.max(0, projEnd);
      const projStart = px(lastActual.pos, lastActual.val);
      const projEndPt = px(n, projEndClamped);

      html += `<line x1="${projStart.x}" y1="${projStart.y}" x2="${projEndPt.x}" y2="${projEndPt.y}" stroke="#1565C0" stroke-width="2" stroke-dasharray="4,4" opacity="0.7"/>`;

      const projected = Math.round(projEnd);
      if (projected <= 0) {
        const zeroDay = slope !== 0 ? -intercept / slope : n;
        projection = zeroDay < n
          ? '📈 On track to finish early'
          : '📈 On track to finish by sprint end';
      } else {
        projection = `📉 At this pace, ${projected} item${projected === 1 ? '' : 's'} will remain`;
      }
    }
  }

  return { html, projection };
}

export default function BurndownChart({ state }: Props) {

  // ── Confetti: fire once when remaining hits 0 ──
  const confettiFiredRef = useRef(false);

  useEffect(() => {
    if (!state.started) return;

    const storageKey = `confetti-fired-${state.startDate}-${state.itemsPlanned}`;

    if (localStorage.getItem(storageKey) === '1') {
      confettiFiredRef.current = true;
      return;
    }
    if (confettiFiredRef.current) return;

    // Compute current remaining
    const hasData = state.dailyValues.some(v => v !== null);
    if (!hasData) return;

    const cumDone = state.dailyValues.reduce((s: number, v) => s + (v || 0), 0);
    const cumScope = (state.bufferValues || []).reduce((s: number, v) => s + (v || 0), 0);
    const remaining = state.itemsPlanned + cumScope - cumDone;
    if (remaining !== 0) return;

    // 🎉 Fire confetti!
    confettiFiredRef.current = true;
    localStorage.setItem(storageKey, '1');

    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      if (Date.now() > end) return;

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        gravity: 0.6,
        ticks: 200,
        scalar: 0.9,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        gravity: 0.6,
        ticks: 200,
        scalar: 0.9,
      });

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  }, [state.dailyValues, state.bufferValues, state.started, state.startDate, state.itemsPlanned]);

  const { html, projection } = useMemo(() => {
    if (!state.started) return { html: '', projection: '' };
    return renderBurndownSVG(state);
  }, [state]);

  return (
    <div>
      {/* ── Chart ── */}
      <div
        className="rounded-lg p-2 mb-1"
        style={{ background: '#fafbfc' }}
      >
        <svg
          viewBox="0 0 700 350"
          className="w-full block"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      {projection && (
        <p
          className="text-sm font-medium min-h-[1em]"
          style={{ color: '#1565C0' }}
        >
          {projection}
        </p>
      )}
    </div>
  );
}
