'use client';

import { SprintState } from '@/lib/types';
import { DAY_NAMES } from '@/lib/constants';
import { getSprintDayDate } from '@/lib/utils';

interface Props {
  state: SprintState;
  onUpdateDaily: (idx: number, value: number | null) => void;
  onUpdateBuffer: (idx: number, value: number | null) => void;
}

function getDayClass(state: SprintState, idx: number): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const sprintDate = getSprintDayDate(state, idx);
  if (sprintDate < now) return 'past';
  if (sprintDate.getTime() === now.getTime()) return 'today';
  return '';
}

export default function DailyInputs({ state, onUpdateDaily, onUpdateBuffer }: Props) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return (
    <div className="mt-3">
      {/* Remaining row */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wide mr-1 whitespace-nowrap">
          Remaining
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {state.selectedDays.map((dayIndex, i) => {
            const dc = getDayClass(state, i);
            return (
              <div key={i} className="text-center">
                <label
                  className={`block text-[0.65rem] font-semibold mb-0.5 ${
                    dc === 'today'
                      ? 'font-bold'
                      : dc === 'past'
                      ? 'text-gray-300'
                      : 'text-gray-400'
                  }`}
                  style={{ color: dc === 'today' ? '#2E7D32' : undefined }}
                >
                  {DAY_NAMES[dayIndex]}
                </label>
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={state.dailyValues[i] !== null ? state.dailyValues[i]! : ''}
                  onChange={e => {
                    const val = e.target.value === '' ? null : Math.max(0, parseInt(e.target.value));
                    onUpdateDaily(i, val);
                  }}
                  className={`day-input ${dc}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Buffer row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wide mr-1 whitespace-nowrap">
          Buffer
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {state.selectedDays.map((dayIndex, i) => {
            const dc = getDayClass(state, i);
            return (
              <div key={i} className="text-center">
                <label
                  className={`block text-[0.65rem] font-semibold mb-0.5 ${
                    dc === 'today'
                      ? 'font-bold'
                      : dc === 'past'
                      ? 'text-gray-300'
                      : 'text-gray-400'
                  }`}
                  style={{ color: dc === 'today' ? '#1565C0' : undefined }}
                >
                  {DAY_NAMES[dayIndex]}
                </label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={
                    state.bufferValues?.[i] !== null && state.bufferValues?.[i] !== 0
                      ? state.bufferValues![i]!
                      : ''
                  }
                  onChange={e => {
                    const val = e.target.value === '' ? null : Math.max(0, parseInt(e.target.value));
                    onUpdateBuffer(i, val);
                  }}
                  className={`day-input buffer-input ${dc}`}
                  style={{ borderColor: dc === 'today' ? '#1565C0' : '#E3F2FD' }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
