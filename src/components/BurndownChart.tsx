'use client';

import { useMemo, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { SprintState } from '@/lib/types';
import { DAY_NAMES } from '@/lib/constants';
import { getTotalBuffer, getAdjustedTotal, getSprintDayDate } from '@/lib/utils';

interface Props {
  state: SprintState;
  showCompleted: boolean;
  onToggleMode: () => void;
  onProjectionChange?: (text: string) => void;
}

interface Point {
  x: number;
  y: number;
}

export function renderBurndownSVG(
  state: SprintState,
  showCompleted: boolean = false
): { html: string; projection: string } {
  const W = 700, H = 350;
  const pad = { top: 15, right: 25, bottom: 40, left: 45 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;
  const n = state.selectedDays.length;
  const originalMax = state.itemsPlanned;
  const adjustedMax = getAdjustedTotal(state);
  const displayMax = Math.max(originalMax, adjustedMax);

  let html = '';
  let projection = '';

  function px(dayPos: number, displayVal: number): Point {
    return {
      x: pad.left + (dayPos / n) * cw,
      y: pad.top + (1 - displayVal / displayMax) * ch,
    };
  }

  const totalBuffer = getTotalBuffer(state);

  // ══════════════════════════════════════════════════════════════════════
  // BURN-UP MODE  — proper two-line chart per Sarah's spec
  // ══════════════════════════════════════════════════════════════════════
  if (showCompleted) {
    const totalScope = adjustedMax; // itemsPlanned + all buffer

    // ── Grid + Y-axis labels (0 at bottom, totalScope at top) ──
    const yTicks = Math.min(totalScope, 10);
    for (let i = 0; i <= yTicks; i++) {
      const y = pad.top + (i / yTicks) * ch;
      const labelVal = Math.round((1 - i / yTicks) * totalScope);
      html += `<line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" stroke="#eee" stroke-width="1"/>`;
      html += `<text x="${pad.left - 8}" y="${y + 4}" text-anchor="end" fill="#bbb" font-size="11">${labelVal}</text>`;
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

    // ── 1. IDEAL LINE (gray dashed) — (0,0) → (n, totalScope) going UP-RIGHT ──
    const idealStart = px(0, 0);
    const idealEnd = px(n, totalScope);
    html += `<line x1="${idealStart.x}" y1="${idealStart.y}" x2="${idealEnd.x}" y2="${idealEnd.y}" stroke="#9E9E9E" stroke-width="2" stroke-dasharray="6,4"/>`;

    // ── 2. SCOPE LINE (red, step function) ──
    // scopeAtDay[i] = itemsPlanned + sum(bufferValues[0..i-1]) per spec
    // At pos=0: scope = itemsPlanned. At pos=i, scope steps up by bufferValues[i-1].
    {
      let currentScope = state.itemsPlanned;
      let scopePathParts: string[] = [];
      const startPt = px(0, currentScope);
      scopePathParts.push(`M${startPt.x},${startPt.y}`);

      for (let i = 0; i < n; i++) {
        const bufAdded = state.bufferValues[i] || 0;
        const newScope = currentScope + bufAdded;
        // Draw horizontal segment to pos i+1 at current scope
        const horizPt = px(i + 1, currentScope);
        scopePathParts.push(`L${horizPt.x},${horizPt.y}`);
        if (bufAdded > 0) {
          // Vertical step up to new scope at same x
          const stepPt = px(i + 1, newScope);
          scopePathParts.push(`L${stepPt.x},${stepPt.y}`);
          // Label the scope addition
          const labelX = horizPt.x + 4;
          const labelY = (horizPt.y + stepPt.y) / 2 + 4;
          html += `<text x="${labelX}" y="${labelY}" fill="#EF5350" font-size="9" opacity="0.8">+${bufAdded}</text>`;
        }
        currentScope = newScope;
      }

      html += `<path d="${scopePathParts.join(' ')}" fill="none" stroke="#EF5350" stroke-width="2.5"/>`;
    }

    // ── 3. COMPLETED WORK LINE (green, climbs from 0) ──
    // completedOnDay[i] = scopeAtDay[i] - dailyValues[i-1]
    // scopeAtDay[i] = itemsPlanned + sum(bufferValues[0..i-1]) (1-indexed day i)
    // In 0-indexed (idx): scope = itemsPlanned + sum(bufferValues[0..idx])
    const completedPoints: { pos: number; val: number }[] = [{ pos: 0, val: 0 }];
    for (let idx = 0; idx < state.dailyValues.length; idx++) {
      if (state.dailyValues[idx] !== null) {
        // scope at this day (1-indexed i = idx+1): sum(bufferValues[0..idx])
        const bufferSumAtDay = state.bufferValues
          .slice(0, idx + 1)
          .reduce((s: number, b) => s + (b || 0), 0);
        const scopeAtDay = state.itemsPlanned + (bufferSumAtDay as number);
        const completed = Math.max(0, scopeAtDay - state.dailyValues[idx]!);
        completedPoints.push({ pos: idx + 1, val: completed });
      }
    }

    if (completedPoints.length > 1) {
      const lastPt = completedPoints[completedPoints.length - 1];
      const idealCompletedAtLast = (lastPt.pos / n) * totalScope;
      const lineColor = lastPt.val >= idealCompletedAtLast ? '#4CAF50' : '#FF5722';

      // Draw completed line
      const pathD = completedPoints
        .map((p, idx) => {
          const pt = px(p.pos, p.val);
          return (idx === 0 ? 'M' : 'L') + `${pt.x},${pt.y}`;
        })
        .join(' ');
      html += `<path d="${pathD}" fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="line-animate"/>`;

      // Data point dots (on completed line only, not scope line)
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      completedPoints.forEach((p, idx) => {
        if (idx === 0) return;
        const pt = px(p.pos, p.val);
        const sprintDate = getSprintDayDate(state, p.pos - 1);
        const isToday = sprintDate.getTime() === now.getTime();
        html += `<circle cx="${pt.x}" cy="${pt.y}" r="5" fill="${lineColor}" ${isToday ? 'class="point-today"' : ''}/>`;
      });

      // ── 4. PROJECTION LINE (blue dashed) — regression intersects scope line ──
      const actualPoints = completedPoints.filter((_, i) => i > 0);
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

        // Intersection with scope line: y = totalScope → x = (totalScope - intercept) / slope
        const completionDay = slope > 0 ? (totalScope - intercept) / slope : Infinity;

        const lastActual = actualPoints[actualPoints.length - 1];
        // Clamp projection end to sprint end or completion day (whichever is first)
        const projEndDay = Math.min(completionDay, n);
        const projEndVal = Math.min(totalScope, slope * projEndDay + intercept);
        const projStart = px(lastActual.pos, lastActual.val);
        const projEndPt = px(projEndDay, Math.max(0, projEndVal));

        html += `<line x1="${projStart.x}" y1="${projStart.y}" x2="${projEndPt.x}" y2="${projEndPt.y}" stroke="#1565C0" stroke-width="2" stroke-dasharray="4,4" opacity="0.7"/>`;

        if (completionDay <= n) {
          projection = `📈 On track to complete sprint by day ${Math.ceil(completionDay)}`;
        } else {
          const remaining = totalScope - (slope * n + intercept);
          const r = Math.max(0, Math.round(remaining));
          projection = `📉 At this pace, ${r} item${r === 1 ? '' : 's'} will remain`;
        }
      }
    }

    // ── Legend ──
    const legendY = pad.top + 10;
    html += `<circle cx="${W - pad.right - 120}" cy="${legendY}" r="5" fill="#EF5350"/>`;
    html += `<text x="${W - pad.right - 112}" y="${legendY + 4}" fill="#EF5350" font-size="10">Scope</text>`;
    html += `<line x1="${W - pad.right - 70}" y1="${legendY}" x2="${W - pad.right - 50}" y2="${legendY}" stroke="#4CAF50" stroke-width="2"/>`;
    html += `<text x="${W - pad.right - 46}" y="${legendY + 4}" fill="#4CAF50" font-size="10">Completed</text>`;

    return { html, projection };
  }

  // ══════════════════════════════════════════════════════════════════════
  // BURNDOWN MODE  — original logic, unchanged
  // ══════════════════════════════════════════════════════════════════════

  // Grid lines
  const yTicks = Math.min(displayMax, 10);
  for (let i = 0; i <= yTicks; i++) {
    const y = pad.top + (i / yTicks) * ch;
    const rawVal = displayMax - (i / yTicks) * displayMax;
    const labelVal = rawVal;
    html += `<line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" stroke="#eee" stroke-width="1"/>`;
    html += `<text x="${pad.left - 8}" y="${y + 4}" text-anchor="end" fill="#bbb" font-size="11">${Math.round(labelVal)}</text>`;
  }

  // X axis labels
  for (let i = 0; i < n; i++) {
    const x = pad.left + ((i + 1) / n) * cw;
    html += `<text x="${x}" y="${H - pad.bottom + 16}" text-anchor="middle" fill="#888" font-size="11">${DAY_NAMES[state.selectedDays[i]]}</text>`;
  }
  html += `<text x="${pad.left}" y="${H - pad.bottom + 16}" text-anchor="middle" fill="#888" font-size="11">Start</text>`;

  // Axes
  html += `<line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${H - pad.bottom}" stroke="#ddd" stroke-width="1"/>`;
  html += `<line x1="${pad.left}" y1="${H - pad.bottom}" x2="${W - pad.right}" y2="${H - pad.bottom}" stroke="#ddd" stroke-width="1"/>`;

  // Burndown ideal lines (top-left → bottom-right)
  {
    const ois = px(0, originalMax), oie = px(n, 0);
    html += `<line x1="${ois.x}" y1="${ois.y}" x2="${oie.x}" y2="${oie.y}" stroke="#ccc" stroke-width="2" stroke-dasharray="6,4"/>`;

    if (totalBuffer > 0) {
      const ais = px(0, adjustedMax), aie = px(n, 0);
      html += `<line x1="${ais.x}" y1="${ais.y}" x2="${aie.x}" y2="${aie.y}" stroke="#E0E0E0" stroke-width="2" stroke-dasharray="6,4"/>`;
      html += `<text x="${W - pad.right - 5}" y="${ois.y - 8}" text-anchor="end" fill="#ccc" font-size="10">original</text>`;
      html += `<text x="${W - pad.right - 5}" y="${px(0, adjustedMax).y - 8}" text-anchor="end" fill="#bbb" font-size="10">adjusted</text>`;
    }
  }

  // Actual remaining line
  const points: { pos: number; val: number }[] = [];
  points.push({ pos: 0, val: adjustedMax });
  state.dailyValues.forEach((v, i) => {
    if (v !== null) {
      points.push({ pos: i + 1, val: v });
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

    // Data points
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    points.forEach((p, i) => {
      if (i === 0) return;
      const pt = px(p.pos, p.val);
      const sprintDate = getSprintDayDate(state, p.pos - 1);
      const isToday = sprintDate.getTime() === now.getTime();
      html += `<circle cx="${pt.x}" cy="${pt.y}" r="5" fill="${color}" ${isToday ? 'class="point-today"' : ''}/>`;
    });

    // Trend / projection (need >= 2 actual points)
    const actualPoints = points.filter((_, i) => i > 0);
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

export default function BurndownChart({ state, showCompleted, onToggleMode }: Props) {

  // ── Confetti: fire once when sprint hits 0 remaining ──
  const confettiFiredRef = useRef(false);

  useEffect(() => {
    if (!state.started) return;

    const storageKey = `confetti-fired-${state.startDate}-${state.itemsPlanned}`;

    if (localStorage.getItem(storageKey) === '1') {
      confettiFiredRef.current = true;
      return;
    }
    if (confettiFiredRef.current) return;

    const entered = state.dailyValues.filter(v => v !== null);
    if (entered.length === 0) return;
    const lastEntered = entered[entered.length - 1];
    if (lastEntered !== 0) return;

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
  }, [state.dailyValues, state.started, state.startDate, state.itemsPlanned]);

  const { html, projection } = useMemo(() => {
    if (!state.started) return { html: '', projection: '' };
    return renderBurndownSVG(state, showCompleted);
  }, [state, showCompleted]);

  return (
    <div>
      {/* ── Toggle ── */}
      {state.started && (
        <div className="flex items-center justify-end mb-2 gap-2 no-print">
          <span
            className="text-xs font-semibold"
            style={{ color: showCompleted ? '#999' : '#1A237E' }}
          >
            Burndown Chart (tasks remaining)
          </span>
          <button
            onClick={onToggleMode}
            role="switch"
            aria-checked={showCompleted}
            className="relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none"
            style={{
              width: 40,
              height: 22,
              background: showCompleted ? '#4CAF50' : '#CBD5E1',
              padding: 2,
            }}
          >
            <span
              className="block rounded-full bg-white shadow transition-transform duration-200"
              style={{
                width: 18,
                height: 18,
                transform: showCompleted ? 'translateX(18px)' : 'translateX(0px)',
              }}
            />
          </button>
          <span
            className="text-xs font-semibold"
            style={{ color: showCompleted ? '#4CAF50' : '#999' }}
          >
            Burn-up Chart (tasks completed)
          </span>
        </div>
      )}

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
