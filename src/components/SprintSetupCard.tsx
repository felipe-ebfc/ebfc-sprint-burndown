'use client';

import { useState } from 'react';
import { DAY_NAMES } from '@/lib/constants';

interface Props {
  onStart: (itemsPlanned: number, selectedDays: number[]) => void;
  collapsed?: boolean;
}

export default function SprintSetupCard({ onStart, collapsed = false }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [itemsPlanned, setItemsPlanned] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const canStart = Number(itemsPlanned) > 0 && selectedDays.length > 0;

  function toggleDay(idx: number) {
    setSelectedDays(prev => {
      if (prev.includes(idx)) return prev.filter(d => d !== idx).sort((a, b) => a - b);
      return [...prev, idx].sort((a, b) => a - b);
    });
  }

  function handleStart() {
    if (!canStart) return;
    onStart(Number(itemsPlanned), selectedDays);
  }

  return (
    <div
      className="bg-white rounded-[10px] mb-2 shadow-sm fade-in"
      style={{ borderLeft: '4px solid #FF6F00' }}
    >
      {/* Header */}
      <div
        className="flex justify-between items-center cursor-pointer p-4"
        onClick={() => setIsCollapsed(c => !c)}
      >
        <h2 className="font-semibold text-sm" style={{ color: '#1A237E' }}>
          Sprint Setup
        </h2>
        <span
          className="text-gray-400 text-lg transition-transform duration-200"
          style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
        >
          ▼
        </span>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="px-4 pb-4 flex flex-wrap gap-6 items-end">
          {/* Items planned */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-500">
              Items planned
            </label>
            <input
              type="number"
              min={1}
              max={200}
              placeholder="e.g. 10"
              value={itemsPlanned}
              onChange={e => setItemsPlanned(e.target.value)}
              className="w-24 px-2 py-1.5 border border-gray-200 rounded-md text-sm outline-none transition-colors"
              style={{ borderColor: itemsPlanned ? '#FF6F00' : '' }}
            />
          </div>

          {/* Day pills */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-500">
              Sprint days
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {DAY_NAMES.map((name, i) => (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`day-pill ${selectedDays.includes(i) ? 'selected' : ''}`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: canStart ? '#FF6F00' : '#ccc',
            }}
          >
            Start Sprint
          </button>
        </div>
      )}
    </div>
  );
}
