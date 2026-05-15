import React, { useState } from 'react';
import { Subject, SubjectStats } from '../types';
import { Plus, CheckCircle2, Trash2, ExternalLink, GraduationCap, ArrowRight } from 'lucide-react';
import { DeadlinesOverview } from './DeadlinesOverview';
import { motion } from 'motion/react';

interface DashboardProps {
    subjects: Subject[];
    stats: Record<string, SubjectStats>;
    pendingInvites: any[]; // NEU
    onSelectCourse: (id: string) => void;
    onAddCourse: (name: string, threshold: number, maxPoints?: number, rhythm?: number) => void;
    onDeleteCourse: (id: string) => void;
    onToggleDeadline: (subjectId: string, deadlineId: string) => void;
    onRespondInvite: (subjectId: string, accept: boolean) => void; // NEU
}

export function Dashboard({
                              subjects, stats, pendingInvites, onSelectCourse, onAddCourse, onDeleteCourse, onToggleDeadline, onRespondInvite
                          }: DashboardProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newThreshold, setNewThreshold] = useState('50');
    const [newMaxPoints, setNewMaxPoints] = useState('');
    const [newRhythm, setNewRhythm] = useState('1');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim()) {
            onAddCourse(newName.trim(), parseFloat(newThreshold) || 50, newMaxPoints ? parseFloat(newMaxPoints) : undefined, parseInt(newRhythm) || 1);
            setNewName(''); setNewThreshold('50'); setNewMaxPoints(''); setNewRhythm('1'); setIsAdding(false);
        }
    };

    let gMax = 0, gAchieved = 0, gRequired = 0;
    Object.values(stats).forEach(s => { gMax += s.maxTotal; gAchieved += s.achievedTotal; gRequired += s.requiredPoints; });

    const gProgress = gRequired > 0 ? (gAchieved / gRequired) * 100 : 0;
    const allPassed = subjects.length > 0 && subjects.every(sub => stats[sub.id]?.progressToPass >= 100);

    return (
        <div className="flex-1 flex flex-col gap-6">

            {/* --- NEU: EINLADUNGS-SECTION --- */}
            {pendingInvites && pendingInvites.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 rounded-3xl p-6 shadow-sm"
                >
                    <h3 className="text-amber-800 font-bold mb-4 tracking-tight flex items-center gap-2">
             <span className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
             </span>
                        Neue Kurseinladungen ({pendingInvites.length})
                    </h3>
                    <div className="flex flex-col gap-3">
                        {pendingInvites.map((invite: any) => (
                            <div key={invite.subjectId} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-amber-100 group hover:border-amber-300 transition-colors">
                                <div>
                                    <p className="font-black text-slate-800 text-sm">{invite.subjectName}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                        Von: <span className="text-indigo-500">{invite.ownerEmail}</span>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => onRespondInvite(invite.subjectId, false)} className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-colors">
                                        Ablehnen
                                    </button>
                                    <button onClick={() => onRespondInvite(invite.subjectId, true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-md">
                                        Akzeptieren
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* HEADER CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2 bg-indigo-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[200px]">
                    <div className="relative z-10 flex flex-col gap-6">
                        <div className="bg-white/10 p-4 rounded-2xl">
                            <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-2">Gesamtfortschritt</p>
                            <div className="flex items-end gap-3 mb-2">
                                <h3 className="text-4xl font-black">{Math.min(100, gProgress).toFixed(1)}%</h3>
                                <p className="text-[10px] font-bold text-indigo-100 opacity-75 mb-1">{gAchieved.toFixed(0)} / {gRequired.toFixed(0)} Pkt</p>
                            </div>
                            <div className="h-2 bg-indigo-400/50 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-700" style={{ width: `${Math.min(100, gProgress)}%` }}></div>
                            </div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl">
                            <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-2">Max. erreichbare Quote</p>
                            <div className="h-1.5 bg-indigo-400/30 rounded-full overflow-hidden">
                                <div className="h-full bg-white/40 transition-all" style={{ width: `${(gAchieved/gMax)*100 || 0}%` }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-500 rounded-full opacity-50 blur-2xl"></div>
                </div>

                <div className={`col-span-1 rounded-3xl border p-6 flex flex-col shadow-sm ${allPassed ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-inner ${allPassed ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h4 className={`font-bold ${allPassed ? 'text-emerald-900' : 'text-slate-800'}`}>Kurse ({subjects.length})</h4>
                    </div>
                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[160px] pr-2 custom-scrollbar">
                        {subjects.map(sub => {
                            const s = stats[sub.id]; if (!s) return null;
                            return (
                                <div key={sub.id} className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold uppercase">
                                        <span className="text-slate-600 truncate max-w-[110px]">{sub.name}</span>
                                        <span className={s.progressToPass >= 100 ? 'text-emerald-600' : 'text-slate-400'}>{s.achievedTotal.toFixed(0)}/{s.requiredPoints.toFixed(0)}</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full transition-all ${s.progressToPass >= 100 ? 'bg-emerald-500' : 'bg-indigo-400'}`} style={{ width: `${Math.min(100, s.totalQuote)}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* COURSE LIST */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Deine Kurse</h3>
                    <button onClick={() => setIsAdding(!isAdding)} className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors"><Plus className="w-5 h-5" /></button>
                </div>

                {isAdding && (
                    <form onSubmit={handleAdd} className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <input required value={newName} onChange={e => setNewName(e.target.value)} className="md:col-span-6 bg-white p-2 rounded-xl border border-slate-200 text-sm font-medium" placeholder="Kursname..." />
                            <input required value={newThreshold} onChange={e => setNewThreshold(e.target.value)} type="number" className="md:col-span-4 bg-white p-2 rounded-xl border border-slate-200 text-sm font-medium" placeholder="Zulassung (%)" />
                            <input value={newMaxPoints} onChange={e => setNewMaxPoints(e.target.value)} type="number" className="md:col-span-2 bg-white p-2 rounded-xl border border-slate-200 text-sm font-medium" placeholder="Max Pkt" />
                        </div>
                        <button type="submit" className="bg-indigo-600 text-white py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700">Hinzufügen</button>
                    </form>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjects.map(sub => {
                        const s = stats[sub.id]; const isPassed = s.progressToPass >= 100;
                        return (
                            <div key={sub.id} className="group relative p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col" onClick={() => onSelectCourse(sub.id)}>
                                {!sub.isShared && (
                                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(sub.id); }} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 md:opacity-0 group-hover:opacity-100 p-2"><Trash2 className="w-4 h-4" /></button>
                                )}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isPassed ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all'}`}><GraduationCap className="w-5 h-5" /></div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 truncate max-w-[140px]">{sub.name}</h4>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">{sub.isShared ? 'Geteilt' : `${sub.threshold}% Ziel`}</p>
                                    </div>
                                </div>
                                <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-end">
                                    <div className="flex-1 pr-3">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Nötig</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-lg font-black text-slate-700">{s.progressToPass.toFixed(0)}%</p>
                                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${isPassed ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, s.progressToPass)}%` }}></div></div>
                                        </div>
                                    </div>
                                    {isPassed ? <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> OK</span> : <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg uppercase">Offen</span>}
                                </div>
                                {deleteConfirmId === sub.id && (
                                    <div className="absolute inset-0 bg-white/95 rounded-2xl border-2 border-red-500 z-10 flex flex-col items-center justify-center p-4" onClick={e => e.stopPropagation()}>
                                        <p className="text-red-700 font-bold text-xs mb-3">"{sub.name}" löschen?</p>
                                        <div className="flex gap-2 w-full"><button className="flex-1 bg-red-600 text-white py-2 rounded-xl font-bold text-[10px]" onClick={() => onDeleteCourse(sub.id)}>LÖSCHEN</button><button className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-xl font-bold text-[10px]" onClick={() => setDeleteConfirmId(null)}>STOP</button></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <DeadlinesOverview subjects={subjects} onToggleDeadline={onToggleDeadline} />
        </div>
    );
}