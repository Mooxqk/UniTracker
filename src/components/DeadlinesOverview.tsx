import React, { useState, useEffect } from "react";
import { Subject, Deadline } from "../types";
import { Calendar, CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";

interface DeadlinesOverviewProps {
    subjects: Subject[];
    onToggleDeadline: (subjectId: string, deadlineId: string) => void;
}

export function DeadlinesOverview({ subjects, onToggleDeadline }: DeadlinesOverviewProps) {
    // Live-Timer: Aktualisiert die Anzeige jede Minute
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    // Intelligente Zeit-Berechnung
    const getRelativeTimeString = (dateStr: string, timeStr?: string | null) => {
        let targetDate = new Date(dateStr);
        if (timeStr) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            targetDate.setHours(hours, minutes, 0, 0);
        } else {
            targetDate.setHours(23, 59, 59, 999);
        }

        const diffMs = targetDate.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));

        // Berechne die reinen "Kalendertage" Unterschied
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const dayDiff = Math.round((targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffMs < 0) return "Überfällig";

        if (dayDiff === 0) {
            if (timeStr) {
                if (diffMins < 60) return diffMins <= 0 ? "Jetzt" : `In ${diffMins} min`;
                return `Heute, ${timeStr} Uhr`;
            }
            return "Heute";
        }

        if (dayDiff === 1) return timeStr ? `Morgen, ${timeStr} Uhr` : "Morgen";
        if (dayDiff === 2) return timeStr ? `Übermorgen, ${timeStr} Uhr` : "Übermorgen";
        if (dayDiff > 2 && dayDiff <= 7) return `In ${dayDiff} Tagen`;

        return targetDate.toLocaleDateString("de-DE");
    };

    const allDeadlines = subjects
        .flatMap((sub) =>
            (sub.deadlines || []).map((d) => ({
                ...d,
                subjectName: sub.name,
                subjectId: sub.id,
            })),
        )
        .sort((a, b) => {
            // Kombiniere Datum und Zeit für präzises Sortieren
            const dateA = new Date(a.date);
            if (a.time) { const [h,m] = a.time.split(':'); dateA.setHours(Number(h), Number(m)); }

            const dateB = new Date(b.date);
            if (b.time) { const [h,m] = b.time.split(':'); dateB.setHours(Number(h), Number(m)); }

            const dateDiff = dateA.getTime() - dateB.getTime();
            if (dateDiff !== 0) return dateDiff;

            // Bei absolut gleicher Zeit: Höchste Prio oben
            return (b.urgency || 1) - (a.urgency || 1);
        });

    if (allDeadlines.length === 0) return null;

    const pending = allDeadlines.filter(d => !d.completed);
    const completed = allDeadlines.filter(d => d.completed);
    const prioColors: Record<number, string> = { 1: 'bg-red-500', 2: 'bg-amber-400', 3: 'bg-emerald-500' };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" /> Alle Termine
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* --- OFFENE TERMINE --- */}
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
                        <Circle className="w-3 h-3"/> Zu Erledigen ({pending.length})
                    </h4>
                    <div className="space-y-3">
                        {pending.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">Alles erledigt!</p>
                        ) : pending.map(d => {
                            const relTime = getRelativeTimeString(d.date, d.time);
                            const isOverdue = relTime === "Überfällig";

                            return (
                                <div key={d.id} className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${isOverdue ? 'bg-red-50/50 border-red-100' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}>
                                    <button onClick={() => onToggleDeadline(d.subjectId, d.id)} className="mt-0.5 text-slate-300 hover:text-emerald-500 transition-colors">
                                        <Circle className="w-5 h-5" />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <p className="font-bold text-indigo-600 text-[10px] uppercase tracking-wider truncate">{d.subjectName}</p>
                                            <div className={`w-2 h-2 rounded-full ${prioColors[d.urgency || 3]}`}></div>
                                        </div>
                                        <p className="font-bold text-slate-700 text-sm leading-tight mb-1.5">{d.title}</p>
                                        <div className={`flex items-center gap-1.5 text-[11px] font-bold ${isOverdue ? 'text-red-500' : 'text-slate-500'}`}>
                                            {isOverdue ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                            <span>{relTime}</span>
                                        </div>
                                    </div>
                                </div>
                            )})}
                    </div>
                </div>

                {/* --- ERLEDIGTE TERMINE --- */}
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3"/> Abgeschlossen ({completed.length})
                    </h4>
                    <div className="space-y-3 opacity-60">
                        {completed.map(d => (
                            <div key={d.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                <button onClick={() => onToggleDeadline(d.subjectId, d.id)} className="mt-0.5 text-emerald-500 hover:text-slate-300 transition-colors">
                                    <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <p className="font-bold text-slate-400 text-[10px] uppercase tracking-wider truncate line-through">{d.subjectName}</p>
                                    </div>
                                    <p className="font-bold text-slate-500 text-sm leading-tight line-through mb-1.5">{d.title}</p>
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{new Date(d.date).toLocaleDateString("de-DE")}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}