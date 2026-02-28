'use client';

import { useState } from 'react';
import { useSprintState } from '@/lib/useSprintState';
import SprintSetupCard from '@/components/SprintSetupCard';
import BurndownChart from '@/components/BurndownChart';
import DailyInputs from '@/components/DailyInputs';
import SprintSummaryCard from '@/components/SprintSummaryCard';
import SprintHistoryCard from '@/components/SprintHistoryCard';

export default function Home() {
  const {
    state,
    history,
    hydrated,
    startSprint,
    newSprint,
    updateDailyValue,
    updateBufferValue,
    updateSprintGoal,
    clearHistory,
  } = useSprintState();

  // Burn-up (tasks completed) = true  |  Burndown (tasks remaining) = false
  // Default to burn-up mode
  const [showCompleted, setShowCompleted] = useState(true);

  // Don't render until hydrated (avoid SSR mismatch)
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f8fa' }}>
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f7f8fa', minHeight: '100vh', padding: '0.5rem 0.75rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between mb-2 py-1 flex-wrap gap-2">
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold whitespace-nowrap" style={{ color: '#1A237E' }}>
              🔥 EBFC Sprint Burndown
            </h1>
            <span className="text-xs text-gray-400 italic whitespace-nowrap">
              Track your sprint. Tell your story.
            </span>
          </div>
          <div className="flex gap-2 items-center no-print">
            {state.started && (
              <button
                onClick={() => {
                  if (confirm('Save this sprint and start fresh?')) newSprint();
                }}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-all duration-200"
                style={{ background: '#FF6F00' }}
              >
                + New Sprint
              </button>
            )}
          </div>
        </div>

        {/* ── SETUP PANEL ── */}
        {!state.started ? (
          <SprintSetupCard onStart={startSprint} />
        ) : (
          <SprintSetupCard onStart={startSprint} collapsed={true} />
        )}

        {/* ── EMPTY STATE ── */}
        {!state.started && (
          <div className="text-center text-gray-300 text-sm py-8">
            <div className="text-4xl mb-2">📊</div>
            Ready to track your sprint? Set up above to get started.
          </div>
        )}

        {/* ── ACTIVE SPRINT ── */}
        {state.started && (
          <div className="flex gap-3 items-start flex-col lg:flex-row fade-in">
            {/* Chart column */}
            <div className="flex-1 min-w-0">
              <div
                className="bg-white rounded-[10px] p-4 shadow-sm mb-2"
                style={{ borderLeft: '4px solid #FF6F00' }}
              >
                <BurndownChart
                  state={state}
                  showCompleted={showCompleted}
                  onToggleMode={() => setShowCompleted(v => !v)}
                />
                <DailyInputs
                  state={state}
                  onUpdateDaily={updateDailyValue}
                  onUpdateBuffer={updateBufferValue}
                  showCompleted={showCompleted}
                />

                {/* ── Chart Definition Tile ── */}
                <div
                  className="mt-4 rounded-lg px-4 py-3"
                  style={{ background: '#F0F4FF', borderLeft: '3px solid #1A237E' }}
                >
                  <p className="text-xs font-bold mb-1" style={{ color: '#1A237E' }}>
                    {showCompleted ? 'What is a Burn-up Chart?' : 'What is a Burndown Chart?'}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: '#444' }}>
                    {showCompleted
                      ? 'A burn-up chart tracks completed work against total scope. Two lines show progress (green) and scope (red). When they meet, your sprint is done. Scope changes are visible as steps in the red line — making scope creep impossible to hide.'
                      : 'A burndown chart tracks remaining work over time. The line starts at total planned items and descends toward zero. The ideal line shows the pace needed to finish on time. Below the line means ahead of schedule.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary column */}
            <div className="w-full lg:w-[300px] lg:min-w-[250px] flex flex-col gap-2">
              <SprintSummaryCard state={state} onUpdateGoal={updateSprintGoal} />

              {/* QR Community Card */}
              <div
                className="bg-white rounded-[10px] p-3 shadow-sm text-center"
                style={{ borderLeft: '4px solid #FF6F00' }}
              >
                <div className="flex items-center justify-center gap-3">
                  {/* Real QR Code */}
                  <div
                    className="flex-shrink-0 rounded-md overflow-hidden border-2"
                    style={{ borderColor: '#1A237E', width: 80, height: 80 }}
                  >
                    <img src="/qr-code.png" alt="EBFC Scrum Community QR Code" width={80} height={80} style={{ display: 'block' }} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold" style={{ color: '#1A237E' }}>
                      🔥 Join the EBFC<br />Scrum Community
                    </div>
                    <div className="text-[0.65rem] text-gray-400 mt-1">
                      Scan to learn, connect,<br />and level up your Scrum
                    </div>
                    <a
                      href="https://store.theebfcshow.com/the-ebfc-show-community"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[0.6rem] font-semibold mt-1 inline-block"
                      style={{ color: '#FF6F00' }}
                    >
                      theebfcshow.com →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SPRINT HISTORY ── */}
        <SprintHistoryCard history={history} onClearHistory={clearHistory} />

        {/* ── FOOTER ── */}
        <div
          className="flex items-center justify-between text-[0.7rem] text-gray-400 mt-3 pt-2 flex-wrap gap-2"
          style={{ borderTop: '1px solid #eee' }}
        >
          <div>
            Built with ❤️ by the EBFC Scrum Community ·{' '}
            <a
              href="https://store.theebfcshow.com/the-ebfc-show-community"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#FF6F00' }}
              className="hover:underline"
            >
              Join the Community
            </a>
          </div>
          <div className="text-gray-300">EBFC Sprint Burndown v2.0</div>
        </div>

      </div>
    </div>
  );
}
