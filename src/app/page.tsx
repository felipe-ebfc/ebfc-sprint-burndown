'use client';

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
                <BurndownChart state={state} />
                <DailyInputs
                  state={state}
                  onUpdateDaily={updateDailyValue}
                  onUpdateBuffer={updateBufferValue}
                />
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
                  {/* QR Code placeholder - uses inline SVG or image */}
                  <div
                    className="flex-shrink-0 rounded-md overflow-hidden border-2"
                    style={{ borderColor: '#1A237E', width: 80, height: 80 }}
                  >
                    {/* Inline QR SVG (simplified community QR look) */}
                    <svg viewBox="0 0 80 80" className="w-full h-full" style={{ background: '#fff' }}>
                      {/* QR border boxes */}
                      <rect x="4" y="4" width="24" height="24" fill="none" stroke="#1A237E" strokeWidth="3"/>
                      <rect x="9" y="9" width="14" height="14" fill="#1A237E"/>
                      <rect x="52" y="4" width="24" height="24" fill="none" stroke="#1A237E" strokeWidth="3"/>
                      <rect x="57" y="9" width="14" height="14" fill="#1A237E"/>
                      <rect x="4" y="52" width="24" height="24" fill="none" stroke="#1A237E" strokeWidth="3"/>
                      <rect x="9" y="57" width="14" height="14" fill="#1A237E"/>
                      {/* Center modules */}
                      <rect x="35" y="4" width="4" height="4" fill="#1A237E"/>
                      <rect x="42" y="4" width="4" height="4" fill="#1A237E"/>
                      <rect x="35" y="11" width="4" height="4" fill="#1A237E"/>
                      <rect x="35" y="18" width="4" height="4" fill="#1A237E"/>
                      <rect x="42" y="18" width="4" height="4" fill="#1A237E"/>
                      <rect x="4" y="35" width="4" height="4" fill="#1A237E"/>
                      <rect x="11" y="35" width="4" height="4" fill="#1A237E"/>
                      <rect x="18" y="35" width="4" height="4" fill="#1A237E"/>
                      <rect x="35" y="35" width="4" height="4" fill="#FF6F00"/>
                      <rect x="42" y="35" width="4" height="4" fill="#1A237E"/>
                      <rect x="52" y="35" width="4" height="4" fill="#1A237E"/>
                      <rect x="59" y="35" width="4" height="4" fill="#1A237E"/>
                      <rect x="35" y="42" width="4" height="4" fill="#1A237E"/>
                      <rect x="42" y="42" width="4" height="4" fill="#FF6F00"/>
                      <rect x="52" y="42" width="4" height="4" fill="#1A237E"/>
                      <rect x="52" y="52" width="4" height="4" fill="#1A237E"/>
                      <rect x="59" y="52" width="4" height="4" fill="#1A237E"/>
                      <rect x="66" y="52" width="4" height="4" fill="#1A237E"/>
                      <rect x="52" y="59" width="4" height="4" fill="#1A237E"/>
                      <rect x="66" y="59" width="4" height="4" fill="#1A237E"/>
                      <rect x="52" y="66" width="4" height="4" fill="#1A237E"/>
                      <rect x="59" y="66" width="4" height="4" fill="#1A237E"/>
                      <rect x="35" y="52" width="4" height="4" fill="#1A237E"/>
                      <rect x="35" y="59" width="4" height="4" fill="#1A237E"/>
                      <rect x="42" y="59" width="4" height="4" fill="#1A237E"/>
                      <rect x="35" y="66" width="4" height="4" fill="#1A237E"/>
                      <rect x="42" y="66" width="4" height="4" fill="#FF6F00"/>
                    </svg>
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
              href="https://www.theebfcshow.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#FF6F00' }}
              className="hover:underline"
            >
              theebfcshow.com
            </a>
          </div>
          <div className="text-gray-300">EBFC Sprint Burndown v2.0</div>
        </div>

      </div>
    </div>
  );
}
