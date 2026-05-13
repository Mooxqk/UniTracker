import { Subject, Week, Scores, Semester, Program } from './types';

export const INITIAL_SUBJECTS: Subject[] = [
  // SS 26
  { id: 'algo_ss26', name: 'Algo', threshold: 50, semesterId: 'ss26' },
  { id: 'dt_ss26', name: 'DT', threshold: 50, semesterId: 'ss26' },
  { id: 'swt_ss26', name: 'SWT', threshold: 50, semesterId: 'ss26' },
  { id: 'laii_ss26', name: 'LAII', threshold: 50, semesterId: 'ss26' },
  { id: 'hmii_ss26', name: 'HMII', threshold: 50, semesterId: 'ss26' },
  // WS 25/26
  { id: 'algo_ws2526', name: 'Algo', threshold: 50, semesterId: 'ws2526' },
  { id: 'dt_ws2526', name: 'DT', threshold: 50, semesterId: 'ws2526' },
  { id: 'swt_ws2526', name: 'SWT', threshold: 50, semesterId: 'ws2526' },
  { id: 'laii_ws2526', name: 'LAII', threshold: 50, semesterId: 'ws2526' },
  { id: 'hmii_ws2526', name: 'HMII', threshold: 50, semesterId: 'ws2526' },
];

export const INITIAL_WEEKS: Week[] = [
  { id: 'ss26_w1', name: 'Woche 1', date: '20.04.2026', semesterId: 'ss26' },
  { id: 'ss26_w2', name: 'Woche 2', date: '27.04.2026', semesterId: 'ss26' },
  { id: 'ss26_w3', name: 'Woche 3', date: '04.05.2026', semesterId: 'ss26' },
  { id: 'ss26_w4', name: 'Woche 4', date: '11.05.2026', semesterId: 'ss26' },
  { id: 'ss26_w5', name: 'Woche 5', date: '18.05.2026', semesterId: 'ss26' },
  { id: 'ss26_w6', name: 'Woche 6', date: '01.06.2026', semesterId: 'ss26' },
  { id: 'ss26_w7', name: 'Woche 7', date: '08.06.2026', semesterId: 'ss26' },
  { id: 'ss26_w8', name: 'Woche 8', date: '15.06.2026', semesterId: 'ss26' },
  { id: 'ss26_w9', name: 'Woche 9', date: '22.06.2026', semesterId: 'ss26' },
  { id: 'ss26_w10', name: 'Woche 10', date: '29.06.2026', semesterId: 'ss26' },
  { id: 'ss26_w11', name: 'Woche 11', date: '06.07.2026', semesterId: 'ss26' },
  { id: 'ss26_w12', name: 'Woche 12', date: '13.07.2026', semesterId: 'ss26' },
  { id: 'ss26_w13', name: 'Woche 13', date: '20.07.2026', semesterId: 'ss26' },
  { id: 'ss26_w14', name: 'Woche 14', date: '27.07.2026', semesterId: 'ss26' },
];

export const INITIAL_SCORES: Scores = {
  'ss26_w3_algo_ss26_max': '40',
  'ss26_w4_algo_ss26_max': '40',
  'ss26_w5_algo_ss26_max': '40',
  'ss26_w6_algo_ss26_max': '40',
  'ss26_w7_algo_ss26_max': '40',
  'ss26_w8_algo_ss26_max': '40',
  'ss26_w9_algo_ss26_max': '40',
  'ss26_w10_algo_ss26_max': '40',
  'ss26_w11_algo_ss26_max': '40',
  'ss26_w12_algo_ss26_max': '40',
  'ss26_w13_algo_ss26_max': '40',

  'ss26_w3_dt_ss26_max': '25',
  'ss26_w3_dt_ss26_achieved': '23',
  'ss26_w4_dt_ss26_max': '25',
  'ss26_w5_dt_ss26_max': '25',
  'ss26_w6_dt_ss26_max': '25',
  'ss26_w7_dt_ss26_max': '25',
  'ss26_w8_dt_ss26_max': '25',
  'ss26_w9_dt_ss26_max': '25',
  'ss26_w10_dt_ss26_max': '25',
  'ss26_w11_dt_ss26_max': '25',
  'ss26_w12_dt_ss26_max': '25',
  'ss26_w13_dt_ss26_max': '25',

  'ss26_w3_swt_ss26_max': '21',
  'ss26_w5_swt_ss26_max': '21',
  'ss26_w7_swt_ss26_max': '21',
  'ss26_w9_swt_ss26_max': '21',
  'ss26_w11_swt_ss26_max': '21',
  'ss26_w13_swt_ss26_max': '21',

  'ss26_w2_laii_ss26_max': '10', 'ss26_w2_laii_ss26_achieved': '8',
  'ss26_w3_laii_ss26_max': '10', 'ss26_w3_laii_ss26_achieved': '8',
  'ss26_w4_laii_ss26_max': '10',
  'ss26_w5_laii_ss26_max': '10',
  'ss26_w6_laii_ss26_max': '10',
  'ss26_w7_laii_ss26_max': '10',
  'ss26_w8_laii_ss26_max': '10',
  'ss26_w9_laii_ss26_max': '10',
  'ss26_w10_laii_ss26_max': '10',
  'ss26_w11_laii_ss26_max': '10',
  'ss26_w12_laii_ss26_max': '10',
  'ss26_w13_laii_ss26_max': '10',

  'ss26_w2_hmii_ss26_max': '15', 'ss26_w2_hmii_ss26_achieved': '13',
  'ss26_w3_hmii_ss26_max': '15',
  'ss26_w4_hmii_ss26_max': '15',
  'ss26_w5_hmii_ss26_max': '15',
  'ss26_w6_hmii_ss26_max': '15',
  'ss26_w7_hmii_ss26_max': '15',
  'ss26_w8_hmii_ss26_max': '15',
  'ss26_w9_hmii_ss26_max': '15',
  'ss26_w10_hmii_ss26_max': '15',
  'ss26_w11_hmii_ss26_max': '15',
  'ss26_w12_hmii_ss26_max': '15',
  'ss26_w13_hmii_ss26_max': '15',
};

export const INITIAL_SEMESTERS: Semester[] = [
  { id: 'ws2526', name: 'WS 25/26', startDate: '2025-10-13' },
  { id: 'ss26', name: 'SS 26', startDate: '2026-04-13' },
  { id: 'ws2627', name: 'WS 26/27', startDate: '2026-10-12' },
];

export const INITIAL_PROGRAMS: Program[] = [
  { id: 'inf', name: 'Informatik' },
  { id: 'wi', name: 'Wirtschaftsinformatik' },
  { id: 'mathe', name: 'Mathematik' },
  { id: 'physik', name: 'Physik' },
];

export const PROGRAM_START_DATES: Record<string, Record<string, string>> = {
  inf: {
    ws2526: '2025-10-13',
    ss26: '2026-04-20',
    ws2627: '2026-10-12',
  },
  wi: {
    ws2526: '2025-10-06',
    ss26: '2026-04-13',
    ws2627: '2026-10-05',
  },
  mathe: {
    ws2526: '2025-10-20',
    ss26: '2026-04-27',
    ws2627: '2026-10-19',
  },
  physik: {
    ws2526: '2025-10-13',
    ss26: '2026-04-20',
    ws2627: '2026-10-12',
  },
};

export const generateWeeksForSemester = (semesterId: string, programId: string): Week[] => {
  const startDateStr = PROGRAM_START_DATES[programId]?.[semesterId] || '2025-10-13';
  const start = new Date(startDateStr);
  const weeks: Week[] = [];
  
  for (let i = 0; i < 15; i++) {
    const weekDate = new Date(start);
    weekDate.setDate(start.getDate() + i * 7);
    
    // Formatting as DD.MM.YYYY
    const d = String(weekDate.getDate()).padStart(2, '0');
    const m = String(weekDate.getMonth() + 1).padStart(2, '0');
    const y = weekDate.getFullYear();
    
    weeks.push({
      id: `${semesterId}_w${i + 1}`,
      name: `Woche ${i + 1}`,
      date: `${d}.${m}.${y}`,
      semesterId: semesterId
    });
  }
  
  return weeks;
};
