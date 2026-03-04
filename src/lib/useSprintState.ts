'use client';

import { useState, useEffect, useCallback } from 'react';
import { SprintState, SprintHistoryRecord, DEFAULT_STATE, BoardMeta } from './types';
import { STORAGE_KEY, HISTORY_KEY, BOARDS_META_KEY, STORAGE_VERSION, MAX_BOARDS, DEFAULT_BOARD_NAMES } from './constants';

function storageKey(base: string, boardId: number): string {
  if (boardId === 0) return base; // backward compatible with existing data
  return `${base}-${boardId}`;
}

function loadStateFromStorage(boardId: number): SprintState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(storageKey(STORAGE_KEY, boardId));
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as SprintState;

    if (!parsed.version || parsed.version !== STORAGE_VERSION) {
      localStorage.removeItem(storageKey(STORAGE_KEY, boardId));
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

function loadHistoryFromStorage(boardId: number): SprintHistoryRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey(HISTORY_KEY, boardId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadBoardsMeta(): BoardMeta[] {
  if (typeof window === 'undefined') return DEFAULT_BOARD_NAMES.slice(0, 1).map((name, i) => ({ id: i, name }));
  try {
    const raw = localStorage.getItem(BOARDS_META_KEY);
    if (!raw) return [{ id: 0, name: DEFAULT_BOARD_NAMES[0] }];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [{ id: 0, name: DEFAULT_BOARD_NAMES[0] }];
  } catch {
    return [{ id: 0, name: DEFAULT_BOARD_NAMES[0] }];
  }
}

function saveBoardsMeta(boards: BoardMeta[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(BOARDS_META_KEY, JSON.stringify(boards));
  }
}

export function useSprintState() {
  const [activeBoardId, setActiveBoardId] = useState(0);
  const [boards, setBoardsRaw] = useState<BoardMeta[]>([{ id: 0, name: DEFAULT_BOARD_NAMES[0] }]);
  const [state, setStateRaw] = useState<SprintState>(DEFAULT_STATE);
  const [history, setHistory] = useState<SprintHistoryRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load boards meta and first board on mount
  useEffect(() => {
    const loadedBoards = loadBoardsMeta();
    setBoardsRaw(loadedBoards);
    const firstId = loadedBoards[0]?.id ?? 0;
    setActiveBoardId(firstId);
    setStateRaw(loadStateFromStorage(firstId));
    setHistory(loadHistoryFromStorage(firstId));
    setHydrated(true);
  }, []);

  // Switch board
  const switchBoard = useCallback((boardId: number) => {
    setActiveBoardId(boardId);
    setStateRaw(loadStateFromStorage(boardId));
    setHistory(loadHistoryFromStorage(boardId));
  }, []);

  // Add board
  const addBoard = useCallback(() => {
    setBoardsRaw(prev => {
      if (prev.length >= MAX_BOARDS) return prev;
      const nextId = Math.max(...prev.map(b => b.id), -1) + 1;
      const name = DEFAULT_BOARD_NAMES[nextId] || `Board ${nextId + 1}`;
      const next = [...prev, { id: nextId, name }];
      saveBoardsMeta(next);
      return next;
    });
  }, []);

  // Remove board
  const removeBoard = useCallback((boardId: number) => {
    setBoardsRaw(prev => {
      if (prev.length <= 1) return prev; // can't remove last board
      const next = prev.filter(b => b.id !== boardId);
      saveBoardsMeta(next);
      // Clean up localStorage for removed board
      if (typeof window !== 'undefined') {
        localStorage.removeItem(storageKey(STORAGE_KEY, boardId));
        localStorage.removeItem(storageKey(HISTORY_KEY, boardId));
      }
      // Switch to first remaining board if active was removed
      if (boardId === activeBoardId) {
        const newActive = next[0].id;
        setActiveBoardId(newActive);
        setStateRaw(loadStateFromStorage(newActive));
        setHistory(loadHistoryFromStorage(newActive));
      }
      return next;
    });
  }, [activeBoardId]);

  // Rename board
  const renameBoard = useCallback((boardId: number, name: string) => {
    setBoardsRaw(prev => {
      const next = prev.map(b => b.id === boardId ? { ...b, name } : b);
      saveBoardsMeta(next);
      return next;
    });
  }, []);

  const setState = useCallback((updater: SprintState | ((prev: SprintState) => SprintState)) => {
    setStateRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey(STORAGE_KEY, activeBoardId), JSON.stringify(next));
      }
      return next;
    });
  }, [activeBoardId]);

  const saveToHistory = useCallback((s: SprintState) => {
    const totalBuffer = (s.bufferValues || []).reduce((sum: number, v) => sum + (v || 0), 0);

    let lastIdx = -1;
    for (let i = s.dailyValues.length - 1; i >= 0; i--) {
      if (s.dailyValues[i] !== null) {
        lastIdx = i;
        break;
      }
    }

    const cumScopeAtLastDay = lastIdx >= 0
      ? (s.bufferValues || []).slice(0, lastIdx + 1).reduce((sum: number, v) => sum + (v || 0), 0)
      : 0;

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
        localStorage.setItem(storageKey(HISTORY_KEY, activeBoardId), JSON.stringify(next));
      }
      return next;
    });
  }, [activeBoardId]);

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
      localStorage.removeItem(storageKey(STORAGE_KEY, activeBoardId));
    }
    setState(DEFAULT_STATE);
  }, [state, saveToHistory, setState, activeBoardId]);

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
      localStorage.removeItem(storageKey(HISTORY_KEY, activeBoardId));
    }
    setHistory([]);
  }, [activeBoardId]);

  return {
    state,
    history,
    hydrated,
    // Board management
    boards,
    activeBoardId,
    switchBoard,
    addBoard,
    removeBoard,
    renameBoard,
    // Sprint management
    startSprint,
    newSprint,
    updateDailyValue,
    updateBufferValue,
    updateSprintGoal,
    clearHistory,
  };
}
