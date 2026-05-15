export interface Deadline {
  id: string;
  title: string;
  date: string;
  time?: string;
  urgency?: number; // 1: Low, 2: Medium, 3: High
  completed: boolean;
}

export interface Subject {
    id: string;
    name: string;
    threshold: number;
    semesterId: string;
    submissionUrl?: string | null;
    deadlines?: Deadline[];

    // --- NEU ---
    isShared?: boolean;
}

export interface Week {
  id: string;
  name: string;
  date: string;
  semesterId: string;
}

export interface Semester {
  id: string;
  name: string;
  startDate: string; // ISO format or similar to parse
}

export interface Program {
  id: string;
  name: string;
}

export type ScoreType = 'max' | 'achieved';

export type Scores = Record<string, string>; // Key: `{weekId}_{subjectId}_{type}`, Value: 'number as string or empty'

export interface SubjectStats {
  maxTotal: number;
  achievedTotal: number;
  requiredPoints: number;
  totalQuote: number;
  progressToPass: number;
  workedSheetsQuote: number;
  missingPoints: number;
  required100PercentSheets: number;
}
