import React from 'react';
import { Subject, Week, Scores, SubjectStats } from '../types';
import { ArrowLeft, CheckCircle2, Link as LinkIcon, ExternalLink, Trash2, Calculator, Clock } from 'lucide-react';

export function CourseDetail({
                                 subject, weeks, scores, stats, onBack, onScoreChange, onUrlChange, onAddDeadline, onDeleteDeadline, onToggleDeadline
                             }: any) {
    const isPassed = stats.progressToPass >= 100;
    const [newDeadlineTitle, setNewDeadlineTitle] = React.useState('');
    const [newDeadlineDate, setNewDeadlineDate] = React.useState('');
    const [newDeadlineTime, setNewDeadlineTime] = React.useState('');
    const [newDeadlineUrgency, setNewDeadlineUrgency] = React.useState<number>(1);

    const prioColors: Record<number, string> = { 1: 'bg-slate-300', 2: 'bg-amber-400', 3: 'bg-red-500' };
    const prioLabels: Record<number, string> = { 1: 'Prio 1', 2: 'Prio 2', 3: 'Prio 3' };

    const handleAddDeadline = (e: React.FormEvent) => {
        e.preventDefault();
        if (newDeadlineTitle && newDeadlineDate) {
            onAddDeadline(subject.id, newDeadlineTitle, newDeadlineDate, newDeadlineTime || undefined, newDeadlineUrgency);
            setNewDeadlineTitle('');
            setNewDeadlineDate('');
            setNewDeadlineTime('');
            setNewDeadlineUrgency(1);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

                {/* LEFT SIDEBAR */}
                <div className="md:col-span-1 flex flex-col gap-5 md:sticky md:top-24">

                    <div className="flex items-center gap-3 mb-2 px-1">
                        <button
                            onClick={onBack}
                            className="flex items-center justify-center min-w-[40px] h-10 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <h2 className="text-2xl font-black tracking-tight text-slate-800 truncate">{subject.name}</h2>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest">Status ({subject.threshold}%)</p>
                        <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-3xl font-black text-slate-800 tabular-nums">{stats.achievedTotal.toFixed(1)}</span>
                            <span className="text-xs font-bold text-slate-400">/ {stats.requiredPoints.toFixed(1)} Pkt</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                            <div className={`h-full ${isPassed ? 'bg-emerald-500' : 'bg-indigo-600'} transition-all duration-500`} style={{ width: `${Math.min(100, stats.progressToPass)}%` }}></div>
                        </div>
                        <p className={`text-[10px] font-black uppercase ${isPassed ? 'text-emerald-600' : 'text-indigo-600'}`}>{stats.progressToPass.toFixed(1)}% erreicht</p>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Portal & Termine</p>
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <input value={subject.submissionUrl || ''} onChange={e => onUrlChange(e.target.value)} placeholder="URL..." className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500" />
                                {subject.submissionUrl && <a href={subject.submissionUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all"><ExternalLink className="w-4 h-4" /></a>}
                            </div>

                            <hr className="border-slate-100" />

                            <form onSubmit={handleAddDeadline} className="space-y-3">
                                <input required value={newDeadlineTitle} onChange={e => setNewDeadlineTitle(e.target.value)} placeholder="Neuer Termin..." className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500" />
                                <div className="flex gap-2">
                                    <input required type="date" value={newDeadlineDate} onChange={e => setNewDeadlineDate(e.target.value)} className="w-[45%] text-xs bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 outline-none focus:ring-1 focus:ring-indigo-500" />
                                    <input type="time" value={newDeadlineTime} onChange={e => setNewDeadlineTime(e.target.value)} className="w-[25%] text-xs bg-slate-50 border border-slate-200 rounded-xl px-1 py-2 outline-none focus:ring-1 focus:ring-indigo-500 text-center" />
                                    <select value={newDeadlineUrgency} onChange={e => setNewDeadlineUrgency(Number(e.target.value))} className="w-[30%] text-[10px] bg-slate-50 border border-slate-200 rounded-xl px-1 py-2 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-bold text-slate-600">
                                        <option value={1}>Normal</option>
                                        <option value={2}>Hoch</option>
                                        <option value={3}>ASAP</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">Termin Speichern</button>
                            </form>

                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                                {(subject.deadlines || []).sort((a: any, b: any) => {
                                    // Zuerst nach Datum, dann nach Prio (höchste zuerst) sortieren
                                    const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
                                    if (dateDiff !== 0) return dateDiff;
                                    return (b.urgency || 1) - (a.urgency || 1);
                                }).map((d: any) => (
                                    <div key={d.id} className="group p-2.5 bg-slate-50 rounded-xl relative border border-transparent hover:border-slate-200">
                                        <button onClick={() => onDeleteDeadline(subject.id, d.id)} className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => onToggleDeadline(subject.id, d.id)} className={d.completed ? 'text-emerald-500' : 'text-slate-300'}>{d.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />}</button>
                                            <div className="flex flex-col min-w-0 gap-0.5">
                                                <span className={`text-[11px] font-bold truncate pr-3 ${d.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{d.title}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[9px] text-slate-400 font-bold">{new Date(d.date).toLocaleDateString("de-DE")}</span>
                                                    {d.time && <span className="flex items-center gap-0.5 text-[9px] text-slate-500 font-bold"><Clock className="w-2 h-2" />{d.time}</span>}
                                                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase text-white ${prioColors[d.urgency || 1]}`}>
                                                        {prioLabels[d.urgency || 1]}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: SCROLLABLE WEEKLY OVERVIEW */}
                <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[700px] overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <Calculator className="w-4 h-4 text-indigo-600" />
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Wochenübersicht</h3>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">Max: {stats.maxTotal.toFixed(1)}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-2 custom-scrollbar">
                        <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 px-4 text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">
                            <span>Woche / Datum</span>
                            <span className="text-center">Max Pkt</span>
                            <span className="text-center">Erreicht</span>
                        </div>

                        {weeks.map((week: any) => {
                            const maxKey = `${week.id}_${subject.id}_max`;
                            const achievedKey = `${week.id}_${subject.id}_achieved`;
                            return (
                                <div key={week.id} className="grid grid-cols-[2fr_1fr_1fr] items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/30 transition-all group">
                                    <div className="px-1 flex flex-col">
                                        <span className="font-bold text-slate-700 text-xs">{week.name}</span>
                                        <span className="text-[9px] text-slate-400 font-medium">{new Date(week.date).toLocaleDateString("de-DE")}</span>
                                    </div>
                                    <input type="number" value={scores[maxKey] || ''} onChange={e => onScoreChange(week.id, 'max', e.target.value)} placeholder="-" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2 py-1.5 text-center text-xs font-bold text-slate-400 outline-none focus:bg-white" />
                                    <input type="number" value={scores[achievedKey] || ''} onChange={e => onScoreChange(week.id, 'achieved', e.target.value)} placeholder="-" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2 py-1.5 text-center text-xs font-black text-indigo-700 shadow-inner outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500" />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}