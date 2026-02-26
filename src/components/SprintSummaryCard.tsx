'use client';

import { SprintState } from '@/lib/types';
import { computeMetrics, getAdjustedTotal, getTotalBuffer } from '@/lib/utils';

interface Props {
  state: SprintState;
  onUpdateGoal: (goal: string) => void;
}

function StatItem({
  label,
  value,
  sub,
  className = '',
  fullWidth = false,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`p-2 rounded-lg transition-colors hover:bg-gray-100 ${
        fullWidth ? 'col-span-2' : ''
      }`}
      style={{ background: '#f7f8fa' }}
    >
      <div className="text-[0.65rem] text-gray-400 uppercase tracking-wide">{label}</div>
      <div className={`text-[1.1rem] font-bold mt-0.5 ${className}`}>{value}</div>
      {sub && <div className="text-[0.65rem] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function SprintSummaryCard({ state, onUpdateGoal }: Props) {
  const metrics = computeMetrics(state);
  const totalBuffer = getTotalBuffer(state);
  const adjustedTotal = getAdjustedTotal(state);

  const planDisplay =
    totalBuffer > 0
      ? `${state.itemsPlanned} + ${totalBuffer} = ${adjustedTotal}`
      : `${state.itemsPlanned}`;

  return (
    <div
      className="bg-white rounded-[10px] shadow-sm fade-in"
      style={{ borderLeft: '4px solid #FF6F00' }}
    >
      <div className="p-4">
        <h2 className="font-semibold text-sm mb-3" style={{ color: '#1A237E' }}>
          Sprint Summary
        </h2>

        {/* Sprint Goal */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Sprint Goal — What's the one thing your team commits to this sprint?"
            value={state.sprintGoal}
            onChange={e => onUpdateGoal(e.target.value)}
            className="w-full px-2.5 py-2 border rounded-md text-sm outline-none transition-colors font-[inherit] text-gray-700"
            style={{ borderColor: '#e8e8e8', fontFamily: 'inherit' }}
            onFocus={e => (e.target.style.borderColor = '#FF6F00')}
            onBlur={e => (e.target.style.borderColor = '#e8e8e8')}
          />
          <p className="text-[0.7rem] text-gray-400 mt-1">
            Sprint Goal — What&apos;s the one thing your team commits to this sprint?
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <StatItem
            label="Planned"
            value={planDisplay}
            sub={totalBuffer > 0 ? `${state.itemsPlanned} original + ${totalBuffer} added` : undefined}
          />
          <StatItem
            label="Completed"
            value={metrics.lastVal !== null ? metrics.completed : '—'}
          />
          <StatItem
            label="Velocity"
            value={
              <>
                {metrics.velocity}
                {metrics.velocity !== '—' && (
                  <span className="text-[0.6rem] text-gray-400"> /day</span>
                )}
              </>
            }
          />
          <StatItem
            label="PPC"
            value={metrics.lastVal !== null ? `${metrics.ppc}%` : '—'}
          />
          <StatItem
            label="Status"
            value={`${metrics.statusEmoji} ${metrics.status}`}
            className={metrics.statusClass}
            fullWidth
          />
        </div>

        {/* Celebration */}
        {metrics.lastVal === 0 && (
          <div
            className="mt-3 text-center text-sm font-semibold p-3 rounded-[10px]"
            style={{
              background: 'linear-gradient(135deg, #E8F5E9, #F1F8E9)',
              color: '#2E7D32',
            }}
          >
            🎉🎉🎉 Sprint Complete! Great work, team! 🎉🎉🎉
          </div>
        )}
      </div>
    </div>
  );
}
