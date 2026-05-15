import React from "react";
import { Subject, Deadline } from "../types";
import {
    Calendar,
    ExternalLink,
    CheckCircle2,
    Circle,
    Clock,
} from "lucide-react";
import { motion } from "motion/react";

interface DeadlinesOverviewProps {
    subjects: Subject[];
    onToggleDeadline?: (subjectId: string, deadlineId: string) => void;
}

export function DeadlinesOverview({
                                      subjects,
                                      onToggleDeadline,
                                  }: DeadlinesOverviewProps) {
    // Extract all deadlines and pair them with their subject name
    const allDeadlines = subjects
        .flatMap((sub) =>
            (sub.deadlines || []).map((d) => ({
                ...d,
                subjectName: sub.name,
                subjectId: sub.id,
            })),
        )
        .sort((a, b) => {
            // 1. Zuerst nach Datum sortieren
            const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
            if (dateDiff !== 0) return dateDiff;

            // 2. Bei gleichem Datum: Höchste Prio (3 = Rot) steht oben!
            return (b.urgency || 1) - (a.urgency || 1);
        });

    if (allDeadlines.length === 0) return null;

    const upcomingDeadlines = allDeadlines.filter((d) => !d.completed);
    const completedDeadlines = allDeadlines.filter((d) => d.completed);

    return (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight text-slate-800">
                        Terminübersicht
                    </h3>
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tabular-nums">
          {upcomingDeadlines.length} Offen
        </span>
            </div>

            <div className="space-y-6">
                {upcomingDeadlines.length > 0 ? (
                    <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                            Anstehend
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {upcomingDeadlines.map((deadline) => {
                                const currentUrgency = deadline.urgency || 1; // Sicherer Fallback auf 1 (Grün)

                                return (
                                    <motion.div
                                        key={deadline.id}
                                        layout
                                        className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3 hover:border-amber-200 transition-all hover:bg-white hover:shadow-sm"
                                    >
                                        <button
                                            onClick={() =>
                                                onToggleDeadline?.(deadline.subjectId, deadline.id)
                                            }
                                            className="mt-1 text-slate-300 hover:text-amber-500 transition-colors"
                                        >
                                            <Circle className="w-5 h-5" />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <p className="font-bold text-indigo-600 text-[15px] leading-tight truncate">
                                                    {deadline.subjectName}
                                                </p>
                                                {(() => {
                                                    const diff = new Date(deadline.date).getTime() - new Date().setHours(0, 0, 0, 0);
                                                    const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                                    let timeStr = "";
                                                    let timeColor = "text-slate-400";

                                                    if (diffDays === 0) { timeStr = "Heute"; timeColor = "text-red-500 font-black animate-pulse"; }
                                                    else if (diffDays === 1) { timeStr = "Morgen"; timeColor = "text-amber-500 font-bold"; }
                                                    else if (diffDays < 0) { timeStr = "Überfällig"; timeColor = "text-red-600 font-black"; }
                                                    else { timeStr = `In ${diffDays} Tagen`; timeColor = "text-indigo-500 font-bold"; }

                                                    return <span className={`text-[10px] uppercase tracking-wider ${timeColor}`}>{timeStr}</span>;
                                                })()}
                                            </div>
                                            <p className="font-medium text-slate-500 text-[15px] leading-tight mb-2 truncate">
                                                {deadline.title}
                                            </p>
                                            <div className="flex flex-col gap-1.5 mt-2">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white px-2 py-1.5 rounded-lg border border-slate-100 w-fit shadow-sm">
                                                    <Calendar className="w-3 h-3 text-indigo-500" />
                                                    <span>{new Date(deadline.date).toLocaleDateString("de-DE", { weekday: 'short' })}, {new Date(deadline.date).toLocaleDateString("de-DE")}</span>
                                                </div>

                                                <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border shadow-sm w-fit ${
                                                    currentUrgency === 1 ? 'bg-red-50 text-red-600 border-red-100' :
                                                        currentUrgency === 2 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                }`}>
                                                    Prio {currentUrgency}
                                                </div>

                                                {deadline.time && (
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 pl-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                                        Uhrzeit: {deadline.time} Uhr
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="py-4 text-center text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        Alle Aufgaben erledigt! 🎉
                    </div>
                )}

                {completedDeadlines.length > 0 && (
                    <div className="space-y-2 opacity-60">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                            Abgeschlossen
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {completedDeadlines.map((deadline) => (
                                <div
                                    key={deadline.id}
                                    className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-3 transition-all"
                                >
                                    <button
                                        onClick={() =>
                                            onToggleDeadline?.(deadline.subjectId, deadline.id)
                                        }
                                        className="mt-1 text-emerald-500 hover:text-emerald-600 transition-colors"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                            <p className="font-bold text-indigo-400 text-sm leading-tight truncate line-through">
                                                {deadline.subjectName}
                                            </p>
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Erledigt</span>
                                        </div>
                                        <p className="font-medium text-slate-400 text-sm leading-tight line-through truncate mb-2">
                                            {deadline.title}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                            <Calendar className="w-3 h-3" />
                                            <span>{new Date(deadline.date).toLocaleDateString("de-DE", { weekday: 'short' })}, {new Date(deadline.date).toLocaleDateString("de-DE")}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}