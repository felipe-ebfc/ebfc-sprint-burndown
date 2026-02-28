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
  completed: number;    // cumulative tasks done
  daysElapsed: number;
  velocity: string;
  ppc: number;
  lastVal: number | null; // remaining tasks at last entered day (null if no data)
  lastIdx: number;
  status: string;
  statusClass: string;
  statusEmoji: string;
}

/**
 * v2 formula: remaining = itemsPlanned + cumScopeAdded - cumTasksDone
 * dailyValues now stores "tasks done today" not "tasks remaining"
 */
export function computeMetrics(state: SprintState): SprintMetrics {
  const n = state.selectedDays.length;
  const totalScope = getAdjustedTotal(state); // itemsPlanned + all buffer

  // Find last day with data
  let lastIdx = -1;
  for (let i = state.dailyValues.length - 1; i >= 0; i--) {
    if (state.dailyValues[i] !== null) {
      lastIdx = i;
      break;
    }
  }

  if (lastIdx === -1) {
    return {
      completed: 0,
      daysElapsed: 0,
      velocity: '—',
      ppc: 0,
      lastVal: null,
      lastIdx: -1,
      status: '—',
      statusClass: '',
      statusEmoji: '',
    };
  }

  // Cumulative tasks done through lastIdx
  const cumDone = state.dailyValues
    .slice(0, lastIdx + 1)
    .reduce((s: number, v) => s + (v || 0), 0);

  // Cumulative scope added through lastIdx
  const cumScopeAtLastDay = (state.bufferValues || [])
    .slice(0, lastIdx + 1)
    .reduce((s: number, v) => s + (v || 0), 0);

  const scopeAtLastDay = state.itemsPlanned + cumScopeAtLastDay;
  const remaining = Math.max(0, scopeAtLastDay - cumDone);
  const completed = cumDone;

  const daysElapsed = lastIdx + 1;
  const velocity = daysElapsed > 0 ? (completed / daysElapsed).toFixed(1) : '—';
  const ppc = scopeAtLastDay > 0 ? Math.round((completed / scopeAtLastDay) * 100) : 0;

  // Status: compare remaining vs ideal remaining at lastIdx
  const idealRemaining = totalScope - ((lastIdx + 1) / n) * totalScope;
  const diff = remaining - idealRemaining;
  const threshold = Math.max(totalScope * 0.1, 1);

  let status = '—', statusClass = '', statusEmoji = '';
  if (remaining === 0) {
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

  return {
    completed,
    daysElapsed,
    velocity,
    ppc,
    lastVal: remaining, // remaining tasks (0 = sprint complete)
    lastIdx,
    status,
    statusClass,
    statusEmoji,
  };
}

export function getDayLabel(dayIndex: number): string {
  return DAY_NAMES[dayIndex];
}
