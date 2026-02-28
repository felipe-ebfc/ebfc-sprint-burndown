'use client';

import { useState, useEffect, useCallback } from 'react';
import { SprintState, SprintHistoryRecord, DEFAULT_STATE } from './types';
import { STORAGE_KEY, HISTORY_KEY, STORAGE_VERSION } from './constants';

function loadStateFromStorage(): SprintState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as SprintState;

    // Version guard: v1 data used "tasks remaining" semantics — incompatible.
    // Clear and start fresh if we detect old format.
    if (!parsed.version || parsed.version !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return DEFAULT_STATE;
    }

    if (!parsed.bufferValues) {
      parsed.bufferValues = new Array(parsed.selectedDays.length).fill(null);
    }
    if (!parsed.sprintGoal) parsed.sprintGoal = '';
    return parsed;
  } catch {
    return DEFAULT_STATE;
  }
}

function loadHistoryFromStorage(): SprintHistoryRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useSprintState() {
  const [state, setStateRaw] = useState<SprintState>(DEFAULT_STATE);
  const [history, setHistory] = useState<SprintHistoryRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setStateRaw(loadStateFromStorage());
    setHistory(loadHistoryFromStorage());
    setHydrated(true);
  }, []);

  const setState = useCallback((updater: SprintState | ((prev: SprintState) => SprintState)) => {
    setStateRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  /**
   * v2 saveToHistory: dailyValues are "tasks done today"
   * completed = cumulative sum of all dailyValues
   * remaining = itemsPlanned + cumScope - completed
   */
  const saveToHistory = useCallback((s: SprintState) => {
    const totalBuffer = (s.bufferValues || []).reduce((sum: number, v) => sum + (v || 0), 0);

    // Find last day with data
    let lastIdx = -1;
    for (let i = s.dailyValues.length - 1; i >= 0; i--) {
      if (s.dailyValues[i] !== null) {
        lastIdx = i;
        break;
      }
    }

    // Scope added through last day with data
    const cumScopeAtLastDay = lastIdx >= 0
      ? (s.bufferValues || []).slice(0, lastIdx + 1).reduce((sum: number, v) => sum + (v || 0), 0)
      : 0;

    // Cumulative tasks done through last day
    const completed = lastIdx >= 0
      ? s.dailyValues.slice(0, lastIdx + 1).reduce((sum: number, v) => sum + (v || 0), 0)
      : 0;

    const scopeAtLastDay = s.itemsPlanned + cumScopeAtLastDay;
    const adjustedTotal = s.itemsPlanned + totalBuffer;
    const daysWithData = s.dailyValues.filter(v => v !== null).length;
    const velocity = daysWithData > 0 ? parseFloat((completed / daysWithData).toFixed(1)) : 0;
    const ppc = scopeAtLastDay > 0 ? Math.round((completed / scopeAtLastDay) * 100) : 0;

    const record: SprintHistoryRecord = {
      date: s.startDate || new Date().toISOString().slice(0, 10),
      goal: s.sprintGoal || '',
      planned: s.itemsPlanned,
      added: totalBuffer,
      total: adjustedTotal,
      completed,
      velocity,
      ppc,
      days: s.selectedDays.length,
    };

    setHistory(prev => {
      const next = [record, ...prev].slice(0, 20);
      if (typeof window !== 'undefined') {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const startSprint = useCallback((itemsPlanned: number, selectedDays: number[]) => {
    setState({
      version: STORAGE_VERSION,
      started: true,
      itemsPlanned,
      selectedDays,
      dailyValues: new Array(selectedDays.length).fill(null),
      bufferValues: new Array(selectedDays.length).fill(null),
      startDate: new Date().toISOString().slice(0, 10),
      sprintGoal: '',
    });
  }, [setState]);

  const newSprint = useCallback(() => {
    saveToHistory(state);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setState(DEFAULT_STATE);
  }, [state, saveToHistory, setState]);

  const updateDailyValue = useCallback((idx: number, value: number | null) => {
    setState(prev => {
      const dailyValues = [...prev.dailyValues];
      dailyValues[idx] = value;
      return { ...prev, dailyValues };
    });
  }, [setState]);

  const updateBufferValue = useCallback((idx: number, value: number | null) => {
    setState(prev => {
      const bufferValues = [...(prev.bufferValues || [])];
      bufferValues[idx] = value;
      return { ...prev, bufferValues };
    });
  }, [setState]);

  const updateSprintGoal = useCallback((goal: string) => {
    setState(prev => ({ ...prev, sprintGoal: goal }));
  }, [setState]);

  const clearHistory = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(HISTORY_KEY);
    }
    setHistory([]);
  }, []);

  return {
    state,
    history,
    hydrated,
    startSprint,
    newSprint,
    updateDailyValue,
    updateBufferValue,
    updateSprintGoal,
    clearHistory,
  };
}
