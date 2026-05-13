import React from 'react';
import { Subject, Week, Scores, SubjectStats } from '../types';
import { ArrowLeft, Target, CheckCircle2, Link as LinkIcon, ExternalLink, Trash2 } from 'lucide-react';

interface CourseDetailProps {
  subject: Subject;
  weeks: Week[];
  scores: Scores;
  stats: SubjectStats;
  onBack: () => void;
  onScoreChange: (weekId: string, type: 'max' | 'achieved', value: string) => void;
  onThresholdChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onAddWeek: (name: string, date: string) => void;
  onAddDeadline: (subjectId: string, title: string, date: string, time?: string, urgency?: number) => void;
  onDeleteDeadline: (subjectId: string, deadlineId: string) => void;
  onToggleDeadline: (subjectId: string, deadlineId: string) => void;
}

export function CourseDetail({ 
  subject, 
  weeks, 
  scores, 
  stats, 
  onBack, 
  onScoreChange, 
  onThresholdChange, 
  onUrlChange, 
  onAddWeek,
  onAddDeadline,
  onDeleteDeadline,
  onToggleDeadline
}: CourseDetailProps) {
  const isPassed = stats.progressToPass >= 100;
  const [newDeadlineTitle, setNewDeadlineTitle] = React.useState('');
  const [newDeadlineDate, setNewDeadlineDate] = React.useState('');
  const [newDeadlineTime, setNewDeadlineTime] = React.useState('');
  const [newDeadlineUrgency, setNewDeadlineUrgency] = React.useState<number>(1);

  const handleAddDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDeadlineTitle && newDeadlineDate) {
      onAddDeadline(subject.id, newDeadlineTitle, newDeadlineDate, newDeadlineTime, newDeadlineUrgency);
      setNewDeadlineTitle('');
      setNewDeadlineDate('');
      setNewDeadlineTime('');
      setNewDeadlineUrgency(1);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex items-center gap-4 sticky top-0 z-30 py-3 bg-[#f8fafc]/80 backdrop-blur-md -mx-4 px-4 md:-mx-8 md:px-8 border-b border-slate-200/0 data-[scrolled=true]:border-slate-200 transition-all">
        <button onClick={onBack} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-3 truncate">
            <span className="w-2 md:w-3 h-6 md:h-8 bg-indigo-500 rounded-full inline-block shrink-0"></span>
            <span className="truncate">{subject.name}</span>
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Side: Stats */}
        <div className="md:col-span-1 flex flex-col gap-4 sticky top-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col relative overflow-hidden">
             <p className="text-xs font-bold text-slate-400 uppercase mb-4">Zulassungsgrenze</p>
             <div className="flex items-end gap-2 mb-4">
               <input 
                 type="number" 
                 value={subject.threshold} 
                 onChange={e => onThresholdChange(e.target.value)} 
                 className="w-20 text-3xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 tabular-nums"
               />
               <span className="text-xl font-bold text-slate-400 mb-1">%</span>
             </div>
             
             <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-500 uppercase tracking-tighter">Fortschritt nötig (50%)</span>
                    <span className={isPassed ? 'text-emerald-600' : 'text-indigo-600'}>{stats.progressToPass.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${isPassed ? 'bg-emerald-500' : 'bg-indigo-500'} transition-all`} style={{ width: `${Math.min(100, stats.progressToPass)}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-500 uppercase tracking-tighter">Fortschritt möglich (Max)</span>
                    <span className="text-slate-700">{stats.totalQuote.toFixed(1)}%</span>
                  </div>
                   <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-slate-300 transition-all" style={{ width: `${Math.min(100, stats.totalQuote)}%` }}></div>
                  </div>
                </div>
                {stats.missingPoints > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Target className="w-3 h-3 text-red-500"/> Es fehlen</p>
                    <p className="text-lg font-black text-red-600 tabular-nums">{stats.missingPoints.toFixed(1)} Pkt</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">({stats.required100PercentSheets} Blätter)</p>
                  </div>
                )}
                {isPassed && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-sm font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Zugelassen!</p>
                  </div>
                )}
             </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col">
            <p className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
              <LinkIcon className="w-3 h-3" /> Abgabe Link
            </p>
            <div className="space-y-3">
              <input 
                type="url" 
                value={subject.submissionUrl || ''} 
                onChange={e => onUrlChange(e.target.value)} 
                placeholder="https://..."
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              {subject.submissionUrl && (
                <a 
                  href={subject.submissionUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
                >
                  <ExternalLink className="w-3.0 h-3.5" /> Testen
                </a>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-3 leading-tight italic">
              Der Link erscheint auf dem Dashboard für den schnellen Zugriff.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col">
            <p className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
              <Target className="w-3 h-3" /> Termine & Abgaben
            </p>
            
            <form onSubmit={handleAddDeadline} className="space-y-2 mb-4">
               <input 
                 required 
                 value={newDeadlineTitle} 
                 onChange={e => setNewDeadlineTitle(e.target.value)} 
                 placeholder="Titel (z.B. Testat 1)" 
                 className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
               />
               <div className="flex flex-col gap-2">
                 <input 
                   required 
                   type="date"
                   value={newDeadlineDate} 
                   onChange={e => setNewDeadlineDate(e.target.value)} 
                   className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono"
                 />
                 <input 
                   type="time"
                   value={newDeadlineTime} 
                   onChange={e => setNewDeadlineTime(e.target.value)} 
                   className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono"
                 />
               </div>
               <div className="flex items-center gap-2">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Dringlichkeit:</p>
                 <div className="flex-1 flex gap-1">
                   {[1, 2, 3].map(u => (
                     <button
                       key={u}
                       type="button"
                       onClick={() => setNewDeadlineUrgency(u)}
                       className={`flex-1 py-1 rounded-md text-[10px] font-black border transition-all ${
                         newDeadlineUrgency === u 
                         ? (u === 1 ? 'bg-emerald-500 text-white border-emerald-500' : u === 2 ? 'bg-amber-500 text-white border-amber-500' : 'bg-red-500 text-white border-red-500')
                         : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                       }`}
                     >
                       {u}
                     </button>
                   ))}
                 </div>
               </div>
               <button 
                 type="submit" 
                 className="w-full py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-indigo-700 transition-colors"
               >
                 Hinzufügen
               </button>
            </form>

            <div className="space-y-2">
               {(subject.deadlines || [])
                 .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                 .map(deadline => (
                 <div key={deadline.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl relative group">
                    {deadline.urgency && (
                      <div className={`absolute top-2.5 right-8 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter text-white shadow-sm transition-opacity group-hover:opacity-30 ${
                        deadline.urgency === 1 ? 'bg-emerald-500' : deadline.urgency === 2 ? 'bg-amber-500' : 'bg-red-500'
                      }`}>
                        PRIO {deadline.urgency}
                      </div>
                    )}
                    <button 
                      onClick={() => onDeleteDeadline(subject.id, deadline.id)}
                      className="absolute top-1 right-1 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="flex items-center gap-2 mb-1">
                       <button onClick={() => onToggleDeadline(subject.id, deadline.id)} className={deadline.completed ? 'text-emerald-500' : 'text-slate-300'}>
                         {deadline.completed ? <CheckCircle2 className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                       </button>
                       <span className={`text-[11px] font-bold tracking-tight ${deadline.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{deadline.title}</span>
                    </div>
                    <div className="flex flex-col pl-6 gap-1.5 mt-2">
                       <div className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-2">
                         <span className="opacity-50">Datum:</span>
                         <span className="text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-100">{new Date(deadline.date).toLocaleDateString("de-DE")}</span>
                       </div>
                       {deadline.time && (
                         <div className="text-[10px] font-bold text-indigo-600 flex items-center gap-2">
                           <span className="opacity-50 uppercase text-[9px]">Uhrzeit:</span>
                           <span className="font-mono bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{deadline.time} Uhr</span>
                         </div>
                       )}
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Right Side: Weeks List */}
        <div className="md:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-5 md:p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Übungsblätter</h3>
          </div>
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 mb-2 px-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <span>Blatt / Datum</span>
              <span className="text-center">Max Pkt</span>
              <span className="text-center">Erreicht</span>
            </div>
            
            <div className="space-y-2">
              {weeks.map(week => {
                const maxKey = `${week.id}_${subject.id}_max`;
                const achievedKey = `${week.id}_${subject.id}_achieved`;
                const maxVal = scores[maxKey] || '';
                const achievedVal = scores[achievedKey] || '';
 
                return (
                  <div key={week.id} className="grid grid-cols-[2fr_1fr_1fr] items-center gap-4 bg-slate-50 p-2 md:p-3 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors">
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono font-bold text-slate-700 text-sm truncate">{week.name}</span>
                      <span className="text-[10px] font-medium text-slate-400">{week.date}</span>
                    </div>
                    <div>
                      <input 
                        type="number" 
                        min="0"
                        value={maxVal}
                        onChange={e => onScoreChange(week.id, 'max', e.target.value)}
                        placeholder="-"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-center text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600"
                      />
                    </div>
                    <div>
                      <input 
                        type="number" 
                        min="0"
                        value={achievedVal}
                        onChange={e => onScoreChange(week.id, 'achieved', e.target.value)}
                        placeholder="-"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-center text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-700"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
