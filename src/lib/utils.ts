import { SprintState } from './types';
import { DAY_NAMES } from './constants';

export function getTotalBuffer(state: SprintState): number {
  return (state.bufferValues || []).reduce((s: number, v) => s + (v || 0), 0);
}

export function getAdjustedTotal(state: SprintState): number {
  return state.itemsPlanned + getTotalBuffer(state);
}

export function getSprintDayDate(state: SprintState, positionIndex: number): Date {
  const start = new Date((state.startDate || new Date().toISOString().slice(0, 10)) + 'T00:00:00');
  const targetDow = state.selectedDays[positionIndex];
  let diff = targetDow - state.selectedDays[0];
  if (diff < 0) diff += 7;
  const date = new Date(start);
  date.setDate(date.getDate() + diff);
  return date;
}

export interface SprintMetrics {
  completed: number;
  daysElapsed: number;
  velocity: string;
  ppc: number;
  lastVal: number | null;
  lastIdx: number;
  status: string;
  statusClass: string;
  statusEmoji: string;
}

export function computeMetrics(state: SprintState): SprintMetrics {
  const adjustedTotal = getAdjustedTotal(state);
  const n = state.selectedDays.length;

  let lastVal: number | null = null;
  let lastIdx = -1;
  for (let i = state.dailyValues.length - 1; i >= 0; i--) {
    if (state.dailyValues[i] !== null) {
      lastVal = state.dailyValues[i];
      lastIdx = i;
      break;
    }
  }

  // Fix (Critical): Only count scope that existed UP TO the last day with data.
  // If buffer was entered on Day 5 and we only have data through Day 3,
  // the Day 5 buffer should NOT inflate "completed" — no work has happened there yet.
  const bufferThroughLastDay = lastIdx >= 0
    ? (state.bufferValues || []).slice(0, lastIdx + 1).reduce((s: number, v) => s + (v || 0), 0)
    : 0;
  const scopeAtLastDay = state.itemsPlanned + bufferThroughLastDay;
  const completed = lastVal !== null ? scopeAtLastDay - lastVal : 0;
  const daysElapsed = lastIdx + 1;
  const velocity = daysElapsed > 0 && lastVal !== null ? (completed / daysElapsed).toFixed(1) : '—';
  const ppc = scopeAtLastDay > 0 && lastVal !== null ? Math.round((completed / scopeAtLastDay) * 100) : 0;

  let status = '—', statusClass = '', statusEmoji = '';
  if (lastVal !== null) {
    const idealAtLast = adjustedTotal - ((lastIdx + 1) / n) * adjustedTotal;
    const diff = lastVal - idealAtLast;
    const threshold = adjustedTotal * 0.1;

    if (lastVal === 0) {
      status = 'Sprint Complete'; statusEmoji = '✅'; statusClass = 'text-green-700';
    } else if (diff < -threshold) {
      status = 'Ahead'; statusEmoji = '🟢'; statusClass = 'text-green-600';
    } else if (diff <= threshold) {
      status = 'On Track'; statusEmoji = '🔵'; statusClass = 'text-blue-700';
    } else if (diff <= threshold * 2) {
      status = 'Behind'; statusEmoji = '🟡'; statusClass = 'text-yellow-600';
    } else {
      status = 'At Risk'; statusEmoji = '🔴'; statusClass = 'text-red-600';
    }
  }

  return { completed, daysElapsed, velocity, ppc, lastVal, lastIdx, status, statusClass, statusEmoji };
}

export function getDayLabel(dayIndex: number): string {
  return DAY_NAMES[dayIndex];
}
