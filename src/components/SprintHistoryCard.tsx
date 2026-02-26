'use client';

import { useState, useMemo } from 'react';
import { SprintHistoryRecord } from '@/lib/types';

interface Props {
  history: SprintHistoryRecord[];
  onClearHistory: () => void;
}

function renderVelocityTrendSVG(history: SprintHistoryRecord[]): string {
  const sprints = [...history].reverse();
  const W = 600, H = 200;
  const pad = { top: 15, right: 15, bottom: 35, left: 45 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;
  const maxVel = Math.max(...sprints.map(s => s.velocity), 1);
  const barCount = sprints.length;
  const barGap = Math.min(15, (cw / barCount) * 0.3);
  const barW = Math.min(50, (cw - barGap * (barCount + 1)) / barCount);
  const totalBarsWidth = barCount * barW + (barCount + 1) * barGap;
  const offsetX = pad.left + (cw - totalBarsWidth) / 2;

  let html = '';

  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const y = pad.top + (i / yTicks) * ch;
    const val = maxVel * 1.1 * (1 - i / yTicks);
    html += `<line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" stroke="#eee" stroke-width="1"/>`;
    html += `<text x="${pad.left - 8}" y="${y + 4}" text-anchor="end" fill="#bbb" font-size="10">${val.toFixed(1)}</text>`;
  }

  sprints.forEach((s, i) => {
    const x = offsetX + barGap + i * (barW + barGap);
    const barH = (s.velocity / (maxVel * 1.1)) * ch;
    const y = pad.top + ch - barH;
    html += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="4" fill="#FF6F00" opacity="0.85"/>`;
    html += `<text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" fill="#FF6F00" font-size="10" font-weight="600">${s.velocity}</text>`;
    html += `<text x="${x + barW / 2}" y="${H - pad.bottom + 14}" text-anchor="middle" fill="#888" font-size="9">S${i + 1}</text>`;
  });

  html += `<line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${H - pad.bottom}" stroke="#ddd" stroke-width="1"/>`;
  html += `<line x1="${pad.left}" y1="${H - pad.bottom}" x2="${W - pad.right}" y2="${H - pad.bottom}" stroke="#ddd" stroke-width="1"/>`;
  html += `<text x="10" y="${pad.top + ch / 2}" text-anchor="middle" fill="#aaa" font-size="9" transform="rotate(-90,10,${pad.top + ch / 2})">items/day</text>`;

  return html;
}

export default function SprintHistoryCard({ history, onClearHistory }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const velocitySVG = useMemo(() => {
    if (history.length < 2) return '';
    return renderVelocityTrendSVG(history);
  }, [history]);

  if (history.length === 0) return null;

  return (
    <div
      className="bg-white rounded-[10px] mb-2 shadow-sm fade-in"
      style={{ borderLeft: '4px solid #FF6F00' }}
    >
      {/* Toggle header */}
      <div
        className="flex justify-between items-center cursor-pointer p-4 select-none"
        onClick={() => setIsOpen(o => !o)}
      >
        <h2 className="font-semibold text-sm" style={{ color: '#1A237E' }}>
          Past Sprints &amp; Velocity
        </h2>
        <span
          className="text-gray-400 text-lg transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        >
          ▼
        </span>
      </div>

      {isOpen && (
        <div className="px-4 pb-4">
          {/* History table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  {['Date', 'Goal', 'Planned', 'Done', 'Vel.', 'PPC%'].map(h => (
                    <th
                      key={h}
                      className="text-left p-1.5 border-b-2 border-gray-100 text-gray-400 uppercase tracking-wide text-[0.68rem]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((s, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-1.5 whitespace-nowrap">{s.date || '—'}</td>
                    <td className="p-1.5 max-w-[120px] truncate text-gray-500" title={s.goal}>
                      {s.goal || '—'}
                    </td>
                    <td className="p-1.5">
                      {s.added ? `${s.planned}+${s.added}` : s.planned}
                    </td>
                    <td className="p-1.5 font-semibold" style={{ color: '#2E7D32' }}>
                      {s.completed}
                    </td>
                    <td className="p-1.5">{s.velocity}</td>
                    <td
                      className="p-1.5 font-bold"
                      style={{ color: s.ppc >= 80 ? '#2E7D32' : s.ppc >= 60 ? '#F9A825' : '#D32F2F' }}
                    >
                      {s.ppc}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Velocity trend chart */}
          {velocitySVG && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Velocity Trend
              </h3>
              <svg
                viewBox="0 0 600 200"
                className="w-full max-w-lg block mx-auto"
                dangerouslySetInnerHTML={{ __html: velocitySVG }}
              />
            </div>
          )}

          {/* Clear history */}
          <button
            onClick={() => {
              if (confirm('Clear all sprint history?')) onClearHistory();
            }}
            className="mt-3 text-[0.7rem] text-gray-300 underline cursor-pointer hover:text-red-500 transition-colors"
          >
            Clear History
          </button>
        </div>
      )}
    </div>
  );
}
