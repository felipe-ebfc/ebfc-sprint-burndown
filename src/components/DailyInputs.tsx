'use client';

import { SprintState } from '@/lib/types';
import { DAY_NAMES } from '@/lib/constants';
import { getSprintDayDate, getTotalBuffer } from '@/lib/utils';

interface Props {
  state: SprintState;
  onUpdateDaily: (idx: number, value: number | null) => void;
  onUpdateBuffer: (idx: number, value: number | null) => void;
  showCompleted?: boolean;
}

function getDayClass(state: SprintState, idx: number): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const sprintDate = getSprintDayDate(state, idx);
  if (sprintDate < now) return 'past';
  if (sprintDate.getTime() === now.getTime()) return 'today';
  return '';
}

export default function DailyInputs({ state, onUpdateDaily, onUpdateBuffer, showCompleted = false }: Props) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  // Fix (Very Low): compute adjustedTotal for input guard — daily values shouldn't exceed scope
  const adjustedTotal = state.itemsPlanned + getTotalBuffer(state);

  return (
    <div className="mt-3">
      {/* Remaining / Done row */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wide mr-1 whitespace-nowrap">
          {showCompleted ? 'Tasks Done' : 'Remaining'}
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
                  max={adjustedTotal || 999}
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
        <span className="flex items-center gap-1 text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wide mr-1 whitespace-nowrap">
          Scope Added
          <span
            className="relative group cursor-default"
            aria-label="What is scope added?"
          >
            <span
              className="inline-flex items-center justify-center rounded-full text-[0.6rem] font-bold"
              style={{
                width: 13,
                height: 13,
                background: '#FFF3E0',
                color: '#FF6F00',
                lineHeight: 1,
              }}
            >
              i
            </span>
            {/* Tooltip */}
            <span
              className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 rounded-lg px-3 py-2 text-left text-[0.68rem] leading-snug opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100"
              style={{
                background: '#1A237E',
                color: '#fff',
                whiteSpace: 'normal',
                maxWidth: '300px',
                wordWrap: 'break-word',
              }}
            >
              Track scope changes during the sprint. When new work is added mid-sprint, enter it here to keep your chart honest. The burndown line will show a step up on the day scope was added — making it clear whether the team fell behind or scope grew.
              {/* Tooltip arrow */}
              <span
                className="absolute left-1/2 top-full -translate-x-1/2"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '5px solid #1A237E',
                }}
              />
            </span>
          </span>
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
                  style={{ color: dc === 'today' ? '#FF6F00' : undefined }}
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
                  style={{ borderColor: dc === 'today' ? '#FF6F00' : '#FFF3E0' }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
