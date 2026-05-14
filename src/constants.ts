// src/constants.ts

export const INITIAL_PROGRAMS = [
    { id: "inf", name: "Informatik" },
    { id: "wi", name: "Wirtschaftsinformatik" }
];

export const INITIAL_SEMESTERS = [
    { id: "ws25", name: "Wintersemester 2025/26" },
    { id: "ss26", name: "Sommersemester 2026" }
];

export const SEMESTER_WEEKS: Record<string, { name: string; date: string }[]> = {
    ss26: [
        { name: "Woche 01", date: "2026-04-13" },
        { name: "Woche 02", date: "2026-04-20" },
        { name: "Woche 03", date: "2026-04-27" },
        { name: "Woche 04", date: "2026-05-04" },
        { name: "Woche 05", date: "2026-05-11" },
        { name: "Woche 06", date: "2026-05-18" },
        { name: "Woche 07", date: "2026-05-25" },
        { name: "Woche 08", date: "2026-06-01" },
        { name: "Woche 09", date: "2026-06-08" },
        { name: "Woche 10", date: "2026-06-15" },
        { name: "Woche 11", date: "2026-06-22" },
        { name: "Woche 12", date: "2026-06-29" },
        { name: "Woche 13", date: "2026-07-06" },
        { name: "Woche 14", date: "2026-07-13" },
        { name: "Woche 15", date: "2026-07-20" },
        { name: "Woche 16", date: "2026-07-27" }
    ],
    ws25: [
        { name: "Woche 01", date: "2025-10-13" },
        { name: "Woche 02", date: "2025-10-20" },
        { name: "Woche 03", date: "2025-10-27" },
        { name: "Woche 04", date: "2025-11-03" },
        { name: "Woche 05", date: "2025-11-10" },
        { name: "Woche 06", date: "2025-11-17" },
        { name: "Woche 07", date: "2025-11-24" },
        { name: "Woche 08", date: "2025-12-01" },
        { name: "Woche 09", date: "2025-12-08" },
        { name: "Woche 10", date: "2025-12-15" },
        { name: "Woche 11", date: "2026-01-05" },
        { name: "Woche 12", date: "2026-01-12" },
        { name: "Woche 13", date: "2026-01-19" },
        { name: "Woche 14", date: "2026-01-26" },
        { name: "Woche 15", date: "2026-02-02" },
        { name: "Woche 16", date: "2026-02-09" }
    ]
};