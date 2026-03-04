export interface SprintState {
  version?: string; // 'v2' = dailyValues are "tasks done today" (not remaining)
  started: boolean;
  itemsPlanned: number;
  selectedDays: number[]; // 0=Mon, 1=Tue, ..., 6=Sun
  dailyValues: (number | null)[]; // v2: tasks DONE on that specific day
  bufferValues: (number | null)[]; // scope added per day
  startDate: string | null; // ISO date string YYYY-MM-DD
  sprintGoal: string;
}

export interface SprintHistoryRecord {
  date: string;
  goal: string;
  planned: number;
  added: number;
  total: number;
  completed: number;
  velocity: number;
  ppc: number;
  days: number;
}

export const DEFAULT_STATE: SprintState = {
  version: 'v2',
  started: false,
  itemsPlanned: 0,
  selectedDays: [],
  dailyValues: [],
  bufferValues: [],
  startDate: null,
  sprintGoal: '',
};

export interface BoardMeta {
  id: number;
  name: string;
}
