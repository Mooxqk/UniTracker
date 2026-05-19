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
    collaborators?: { email: string; status: string }[];
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
    startDate: string;
}

export interface Program {
    id: string;
    name: string;
}

export type ScoreType = 'max' | 'achieved';

export type Scores = Record<string, string>;

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