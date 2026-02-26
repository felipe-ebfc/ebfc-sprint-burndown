export interface SprintState {
  started: boolean;
  itemsPlanned: number;
  selectedDays: number[]; // 0=Mon, 1=Tue, ..., 6=Sun
  dailyValues: (number | null)[];
  bufferValues: (number | null)[];
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
  started: false,
  itemsPlanned: 0,
  selectedDays: [],
  dailyValues: [],
  bufferValues: [],
  startDate: null,
  sprintGoal: '',
};
