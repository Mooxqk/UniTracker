import React, { useState } from 'react';
import { Subject, SubjectStats } from '../types';
import { Plus, CheckCircle2, Trash2, ExternalLink, GraduationCap, ArrowRight } from 'lucide-react';
import { DeadlinesOverview } from './DeadlinesOverview';

interface DashboardProps {
  subjects: Subject[];
  stats: Record<string, SubjectStats>;
  onSelectCourse: (id: string) => void;
  onAddCourse: (name: string, threshold: number, maxPoints?: number, rhythm?: number) => void;
  onDeleteCourse: (id: string) => void;
  onToggleDeadline: (subjectId: string, deadlineId: string) => void;
}

export function Dashboard({ subjects, stats, onSelectCourse, onAddCourse, onDeleteCourse, onToggleDeadline }: DashboardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newThreshold, setNewThreshold] = useState('50');
  const [newMaxPoints, setNewMaxPoints] = useState('');
  const [newRhythm, setNewRhythm] = useState('1');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddCourse(
        newName.trim(), 
        parseFloat(newThreshold) || 50,
        newMaxPoints ? parseFloat(newMaxPoints) : undefined,
        parseInt(newRhythm) || 1
      );
      setNewName('');
      setNewThreshold('50');
      setNewMaxPoints('');
      setNewRhythm('1');
      setIsAdding(false);
    }
  };

  let globalMax = 0;
  let globalAchieved = 0;
  let globalRequired = 0;
  Object.values(stats).forEach(s => {
    globalMax += s.maxTotal;
    globalAchieved += s.achievedTotal;
    globalRequired += s.requiredPoints;
  });
  
  const globalQuote = globalMax > 0 ? (globalAchieved / globalMax) * 100 : 0;
  const globalProgressToPass = globalRequired > 0 ? (globalAchieved / globalRequired) * 100 : 0;
  const allPassed = subjects.length > 0 && subjects.every(sub => stats[sub.id]?.progressToPass >= 100);

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 bg-indigo-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[200px]">
          <div className="relative z-10">
             <div className="flex flex-col gap-6">
               <div className="bg-white/10 p-4 rounded-2xl">
                 <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-2">Fortschritt nötig (50%)</p>
                 <div className="flex items-end gap-3 mb-2">
                   <h3 className="text-4xl font-black leading-none">{Math.min(100, globalProgressToPass).toFixed(1)}%</h3>
                   <p className="text-[10px] font-bold text-indigo-100 uppercase opacity-75 mb-1">
                     {globalAchieved.toFixed(1)} / {globalRequired.toFixed(1)} Pkt
                   </p>
                 </div>
                 <div className="h-2 bg-indigo-400/50 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-400 transition-all shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{ width: `${Math.min(100, globalProgressToPass)}%` }}></div>
                 </div>
               </div>

               <div className="bg-white/5 p-4 rounded-2xl">
                 <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-2">Fortschritt möglich (Max)</p>
                 <div className="flex items-end gap-3 mb-2">
                   <h3 className="text-3xl font-black leading-none opacity-90">{globalQuote.toFixed(1)}%</h3>
                   <p className="text-[10px] font-bold text-indigo-100 uppercase opacity-75 mb-0.5">
                     {globalAchieved.toFixed(1)} / {globalMax.toFixed(1)} Pkt
                   </p>
                 </div>
                 <div className="h-1.5 bg-indigo-400/30 rounded-full overflow-hidden">
                   <div className="h-full bg-white transition-all shadow-[0_0_8px_rgba(255,255,255,0.4)]" style={{ width: `${Math.min(100, globalQuote)}%` }}></div>
                 </div>
               </div>
             </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-500 rounded-full opacity-50 blur-2xl"></div>
        </div>

        <div className={`col-span-1 rounded-3xl border p-6 flex flex-col shadow-sm transition-colors duration-500 ${allPassed ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-200'}`}>
           <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-inner ${allPassed ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className={`font-bold ${allPassed ? 'text-emerald-900' : 'text-slate-800'}`}>Semester Status</h4>
           </div>
           
           <div className={`space-y-3 flex-1 overflow-y-auto max-h-[160px] pr-2 scrollbar-thin ${allPassed ? 'scrollbar-thumb-emerald-200' : 'scrollbar-thumb-slate-200'}`}>
              {subjects.map(sub => {
                const stat = stats[sub.id];
                if (!stat) return null;
                const isPassed = stat.progressToPass >= 100;
                return (
                  <div key={sub.id} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                       <span className={`${allPassed ? 'text-emerald-800' : 'text-slate-600'} truncate max-w-[120px]`}>{sub.name}</span>
                       <span className={isPassed ? 'text-emerald-600' : 'text-slate-400'}>{stat.achievedTotal.toFixed(0)}/{stat.requiredPoints.toFixed(0)}</span>
                    </div>
                    <div className={`h-1.5 rounded-full relative overflow-hidden ring-1 ${allPassed ? 'bg-white ring-emerald-100' : 'bg-slate-100 ring-slate-200/50'}`}>
                       <div className={`absolute left-1/2 top-0 bottom-0 w-0.5 z-10 ${allPassed ? 'bg-emerald-200/50' : 'bg-slate-300/30'}`}></div>
                       <div 
                         className={`h-full transition-all duration-500 ${isPassed ? 'bg-emerald-500' : 'bg-red-400'}`}
                         style={{ width: `${Math.min(100, stat.totalQuote)}%` }}
                       ></div>
                    </div>
                  </div>
                );
              })}
           </div>

           <p className={`text-[10px] mt-4 font-bold uppercase tracking-wider text-center pt-3 border-t ${allPassed ? 'text-emerald-700/80 border-emerald-100' : 'text-slate-400 border-slate-100'}`}>
             {Object.values(stats).filter(s => s.progressToPass >= 100).length} von {subjects.length} Kurse zugelassen
           </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold tracking-tight text-slate-800">Deine Kurse</h3>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
         </div>

         {isAdding && (
           <form onSubmit={handleAdd} className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
               <div className="md:col-span-6">
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kursname</label>
                 <input autoFocus required value={newName} onChange={e => setNewName(e.target.value)} type="text" className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="z.B. IT-Sicherheit" />
               </div>
               <div className="md:col-span-4">
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Zulassung (%)</label>
                 <input required value={newThreshold} onChange={e => setNewThreshold(e.target.value)} type="number" min="1" max="100" className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium tabular-nums" />
               </div>
               <div className="md:col-span-2">
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Max Pkt / Blatt</label>
                 <input value={newMaxPoints} onChange={e => setNewMaxPoints(e.target.value)} type="number" min="0" step="0.5" className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium tabular-nums" placeholder="(Optional)" />
               </div>
             </div>
             <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rhythmus</label>
                 <div className="flex gap-2">
                   <button type="button" onClick={() => setNewRhythm('1')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors border ${newRhythm === '1' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>Wöchentlich</button>
                   <button type="button" onClick={() => setNewRhythm('2')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors border ${newRhythm === '2' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>2-Wöchentlich</button>
                 </div>
               </div>
               <div className="flex justify-end">
                 <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors h-[42px] w-full md:w-auto">Hinzufügen</button>
               </div>
             </div>
           </form>
         )}

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
           {subjects.map(sub => {
             const stat = stats[sub.id];
             const isPassed = stat.progressToPass >= 100;
             const isDeleting = deleteConfirmId === sub.id;

             return (
               <div key={sub.id} className="group relative p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col" onClick={() => !isDeleting && onSelectCourse(sub.id)}>
                 {isDeleting ? (
                   <div className="absolute inset-0 bg-white/95 rounded-2xl border-2 border-red-500 z-10 flex flex-col items-center justify-center shadow-lg p-2" onClick={e => e.stopPropagation()}>
                     <p className="text-red-700 font-bold mb-3 text-sm">Kurs "{sub.name}" löschen?</p>
                     <div className="flex gap-2 w-full px-2">
                       <button className="flex-1 bg-red-600 text-white py-1.5 rounded-lg font-bold text-xs" onClick={() => onDeleteCourse(sub.id)}>Löschen</button>
                       <button className="flex-1 bg-slate-200 text-slate-700 py-1.5 rounded-lg font-bold text-xs" onClick={() => setDeleteConfirmId(null)}>Abbrechen</button>
                     </div>
                   </div>
                 ) : (
                   <>
                     <button 
                       onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(sub.id); }}
                       className="absolute top-4 right-4 text-slate-300 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition-opacity p-2 -mr-2 -mt-2"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                     <div className="flex items-center gap-3 mb-3 pr-6">
                       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isPassed ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300'}`}>
                         <GraduationCap className="w-5 h-5" />
                       </div>
                       <div>
                         <h4 className="font-bold text-slate-800 truncate max-w-[150px]">{sub.name}</h4>
                         <p className="text-[10px] text-slate-400 font-bold uppercase">{sub.threshold}% Ziel</p>
                       </div>
                     </div>
                   </>
                 )}

                 <div className="flex justify-between items-end mt-auto pt-4 border-t border-slate-50">
                    <div className="flex-1 pr-4">
                      <div className="space-y-2">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Nötig</p>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-black text-slate-700 tabular-nums">{stat.progressToPass.toFixed(0)}%</p>
                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${isPassed ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, stat.progressToPass)}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                   <div className="flex flex-col items-end gap-2 text-right">
                       <div className="flex items-center gap-1">
                          {sub.submissionUrl && (
                              <a 
                                  href={sub.submissionUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                              >
                                  <ExternalLink className="w-4 h-4" />
                              </a>
                          )}
                          <div className="p-1.5 text-slate-300 group-hover:text-indigo-600 transition-colors">
                             <ArrowRight className="w-4 h-4" />
                          </div>
                       </div>
                       {isPassed ? (
                         <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg flex items-center gap-1 uppercase">
                           <CheckCircle2 className="w-3 h-3" /> OK
                         </span>
                       ) : (
                         <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg uppercase">
                           {stat.missingPoints > 0 
                              ? `Noch ${stat.missingPoints.toFixed(0)} Pkt (${stat.required100PercentSheets} Blätter)` 
                              : 'Offen'}
                         </span>
                       )}
                   </div>
                 </div>
               </div>
             );
           })}
           {subjects.length === 0 && (
             <div className="col-span-full py-10 text-center text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-2xl">
               Noch keine Kurse vorhanden. Klicke auf + um einen hinzuzufügen.
             </div>
           )}
         </div>
      </div>

      <DeadlinesOverview subjects={subjects} onToggleDeadline={onToggleDeadline} />
    </div>
  );
}
