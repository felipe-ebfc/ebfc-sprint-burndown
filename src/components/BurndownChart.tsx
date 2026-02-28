'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { SprintState } from '@/lib/types';
import { DAY_NAMES } from '@/lib/constants';
import { getTotalBuffer, getAdjustedTotal, getSprintDayDate } from '@/lib/utils';

interface Props {
  state: SprintState;
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

  // Grid lines
  const yTicks = Math.min(displayMax, 10);
  for (let i = 0; i <= yTicks; i++) {
    const y = pad.top + (i / yTicks) * ch;
    const rawVal = displayMax - (i / yTicks) * displayMax;
    // In completed mode, labels go 0 at bottom → displayMax at top
    const labelVal = showCompleted ? displayMax - rawVal : rawVal;
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

  function px(dayPos: number, displayVal: number): Point {
    return {
      x: pad.left + (dayPos / n) * cw,
      y: pad.top + (1 - displayVal / displayMax) * ch,
    };
  }

  const totalBuffer = getTotalBuffer(state);

  if (!showCompleted) {
    // ── REMAINING mode: lines go from top-left → bottom-right ──
    const ois = px(0, originalMax), oie = px(n, 0);
    html += `<line x1="${ois.x}" y1="${ois.y}" x2="${oie.x}" y2="${oie.y}" stroke="#ccc" stroke-width="2" stroke-dasharray="6,4"/>`;

    if (totalBuffer > 0) {
      const ais = px(0, adjustedMax), aie = px(n, 0);
      html += `<line x1="${ais.x}" y1="${ais.y}" x2="${aie.x}" y2="${aie.y}" stroke="#E0E0E0" stroke-width="2" stroke-dasharray="6,4"/>`;
      html += `<text x="${W - pad.right - 5}" y="${ois.y - 8}" text-anchor="end" fill="#ccc" font-size="10">original</text>`;
      html += `<text x="${W - pad.right - 5}" y="${px(0, adjustedMax).y - 8}" text-anchor="end" fill="#bbb" font-size="10">adjusted</text>`;
    }
  } else {
    // ── COMPLETED mode: ideal lines go from bottom-left → top-right ──
    const ois = px(0, 0), oie = px(n, originalMax);
    html += `<line x1="${ois.x}" y1="${ois.y}" x2="${oie.x}" y2="${oie.y}" stroke="#ccc" stroke-width="2" stroke-dasharray="6,4"/>`;

    if (totalBuffer > 0) {
      const ais = px(0, 0), aie = px(n, adjustedMax);
      html += `<line x1="${ais.x}" y1="${ais.y}" x2="${aie.x}" y2="${aie.y}" stroke="#E0E0E0" stroke-width="2" stroke-dasharray="6,4"/>`;
      html += `<text x="${W - pad.right - 5}" y="${oie.y - 8}" text-anchor="end" fill="#ccc" font-size="10">original</text>`;
      html += `<text x="${W - pad.right - 5}" y="${px(n, adjustedMax).y - 8}" text-anchor="end" fill="#bbb" font-size="10">adjusted</text>`;
    }
  }

  // Actual line — build points
  const points: { pos: number; val: number }[] = [];
  // Start point
  points.push({ pos: 0, val: showCompleted ? 0 : adjustedMax });
  // Daily entries
  state.dailyValues.forEach((v, i) => {
    if (v !== null) {
      points.push({ pos: i + 1, val: showCompleted ? adjustedMax - v : v });
    }
  });

  if (points.length > 1) {
    const lastPt = points[points.length - 1];

    // Color: green = on/ahead of pace
    let color: string;
    if (!showCompleted) {
      const idealAtLast = adjustedMax - (lastPt.pos / n) * adjustedMax;
      color = lastPt.val <= idealAtLast ? '#4CAF50' : '#FF5722';
    } else {
      const idealCompletedAtLast = (lastPt.pos / n) * adjustedMax;
      color = lastPt.val >= idealCompletedAtLast ? '#4CAF50' : '#FF5722';
    }

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
      const projEndClamped = showCompleted
        ? Math.min(displayMax, Math.max(0, projEnd))
        : Math.max(0, projEnd);
      const projStart = px(lastActual.pos, lastActual.val);
      const projEndPt = px(n, projEndClamped);

      html += `<line x1="${projStart.x}" y1="${projStart.y}" x2="${projEndPt.x}" y2="${projEndPt.y}" stroke="#1565C0" stroke-width="2" stroke-dasharray="4,4" opacity="0.7"/>`;

      const projected = Math.round(projEnd);
      if (!showCompleted) {
        // Remaining mode
        if (projected <= 0) {
          const zeroDay = slope !== 0 ? -intercept / slope : n;
          projection = zeroDay < n
            ? '📈 On track to finish early'
            : '📈 On track to finish by sprint end';
        } else {
          projection = `📉 At this pace, ${projected} item${projected === 1 ? '' : 's'} will remain`;
        }
      } else {
        // Completed mode
        const remaining = adjustedMax - projected;
        if (remaining <= 0) {
          projection = '📈 On track to complete the sprint!';
        } else {
          const r = Math.round(remaining);
          projection = `📉 At this pace, ${r} item${r === 1 ? '' : 's'} will remain`;
        }
      }
    }
  }

  return { html, projection };
}

export default function BurndownChart({ state }: Props) {
  const [showCompleted, setShowCompleted] = useState(false);

  // ── Confetti: fire once when sprint hits 0 remaining ──
  const confettiFiredRef = useRef(false);

  useEffect(() => {
    if (!state.started) return;

    // Build a localStorage key unique to this sprint
    const storageKey = `confetti-fired-${state.startDate}-${state.itemsPlanned}`;

    // Check if already fired (persists across page reloads)
    if (localStorage.getItem(storageKey) === '1') {
      confettiFiredRef.current = true;
      return;
    }
    if (confettiFiredRef.current) return;

    // Condition: at least one daily value entered AND last entered value is 0
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
            Tasks Remaining
          </span>
          <button
            onClick={() => setShowCompleted(v => !v)}
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
            Tasks Completed
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
