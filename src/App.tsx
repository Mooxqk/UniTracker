import React, { useState, useEffect } from 'react';
import { INITIAL_SUBJECTS, INITIAL_WEEKS, INITIAL_SCORES, INITIAL_PROGRAMS, INITIAL_SEMESTERS, generateWeeksForSemester } from './constants';
import { Scores, Subject, Week, Program, Semester } from './types';
import { calculateSummary } from './utils';
import { Trash2, BookOpen, Calendar as CalendarIcon } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { CourseDetail } from './components/CourseDetail';

import { dataService, AppData } from './services/dataService';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [weeks, setWeeks] = useState<Week[]>(INITIAL_WEEKS);
  const [scores, setScores] = useState<Scores>(INITIAL_SCORES);
  const [selectedProgramId, setSelectedProgramId] = useState<string>(INITIAL_PROGRAMS[0].id);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>(INITIAL_SEMESTERS[1].id);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Load data from server or localStorage
  useEffect(() => {
    async function initData() {
      const serverData = await dataService.fetchData();
      
      if (serverData) {
        setSubjects(serverData.subjects);
        setWeeks(serverData.weeks);
        setScores(serverData.scores);
        setSelectedProgramId(serverData.selectedProgramId);
        setSelectedSemesterId(serverData.selectedSemesterId);
      } else {
        // Migration from localStorage
        const savedSubjects = localStorage.getItem('uni_tracker_subjects');
        const savedWeeks = localStorage.getItem('uni_tracker_weeks');
        const savedScores = localStorage.getItem('uni_tracker_scores');
        const savedProgram = localStorage.getItem('uni_tracker_program');
        const savedSemester = localStorage.getItem('uni_tracker_semester');

        if (savedSubjects || savedWeeks || savedScores) {
          try {
            const subjects = savedSubjects ? JSON.parse(savedSubjects) : INITIAL_SUBJECTS;
            const weeks = savedWeeks ? JSON.parse(savedWeeks) : INITIAL_WEEKS;
            const scores = savedScores ? JSON.parse(savedScores) : INITIAL_SCORES;
            const program = savedProgram || INITIAL_PROGRAMS[0].id;
            const semester = savedSemester || INITIAL_SEMESTERS[1].id;

            setSubjects(subjects);
            setWeeks(weeks);
            setScores(scores);
            setSelectedProgramId(program);
            setSelectedSemesterId(semester);

            // Save to server immediately to finish migration
            await dataService.saveData({
              subjects,
              weeks,
              scores,
              selectedProgramId: program,
              selectedSemesterId: semester
            });
          } catch (e) {
            console.error('Migration failed', e);
          }
        } else {
          // If neither server nor local has data, just stick with initial
          await dataService.saveData({
            subjects: INITIAL_SUBJECTS,
            weeks: INITIAL_WEEKS,
            scores: INITIAL_SCORES,
            selectedProgramId: INITIAL_PROGRAMS[0].id,
            selectedSemesterId: INITIAL_SEMESTERS[1].id
          });
        }
      }
      setLoading(false);
    }
    initData();
  }, []);

  // Save data to server on changes
  useEffect(() => {
    if (loading) return;
    const save = async () => {
      await dataService.saveData({
        subjects,
        weeks,
        scores,
        selectedProgramId,
        selectedSemesterId
      });
    };
    save();
  }, [subjects, weeks, scores, selectedProgramId, selectedSemesterId, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Lade Daten...</p>
        </div>
      </div>
    );
  }

  const handleSemesterChange = (semesterId: string) => {
    setSelectedSemesterId(semesterId);
    // Ensure weeks for this semester and program combination exist
    const hasWeeks = weeks.some(w => w.semesterId === semesterId);
    // We check if we need to regenerate or if they already match the program's schedule
    // To be simple, we can regenerate if the first week's date doesn't match the new program's start date
    const currentWeeksForSem = weeks.filter(w => w.semesterId === semesterId);
    if (!hasWeeks || currentWeeksForSem[0]?.date !== generateWeeksForSemester(semesterId, selectedProgramId)[0].date) {
      const newWeeks = generateWeeksForSemester(semesterId, selectedProgramId);
      setWeeks(prev => {
        const others = prev.filter(w => w.semesterId !== semesterId);
        return [...others, ...newWeeks];
      });
    }
    // Clear selection if subject doesn't belong to new semester
    setSelectedSubjectId(null);
  };

  const handleProgramChange = (programId: string) => {
    setSelectedProgramId(programId);
    // When program changes, we should update the weeks for the current semester
    const newWeeks = generateWeeksForSemester(selectedSemesterId, programId);
    setWeeks(prev => {
      const others = prev.filter(w => w.semesterId !== selectedSemesterId);
      return [...others, ...newWeeks];
    });
  };

  const handleScoreChange = (weekId: string, subjectId: string, type: 'max' | 'achieved', value: string) => {
    setScores((prev) => ({
      ...prev,
      [`${weekId}_${subjectId}_${type}`]: value,
    }));
  };

  const handleThresholdChange = (subjectId: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setSubjects((prev) =>
        prev.map((s) => (s.id === subjectId ? { ...s, threshold: num } : s))
      );
    }
  };

  const handleUrlChange = (subjectId: string, value: string) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...s, submissionUrl: value } : s))
    );
  };

  const handleAddWeek = (name: string, date: string) => {
    const newId = `w${Date.now()}`;
    setWeeks(prev => [...prev, { id: newId, name, date, semesterId: selectedSemesterId }]);
  };

  const handleAddCourse = (name: string, threshold: number, maxPoints?: number, rhythm?: number) => {
    const newId = `c${Date.now()}`;
    const semesterId = selectedSemesterId;
    setSubjects(prev => [...prev, { id: newId, name, threshold, semesterId }]);
    
    if (maxPoints !== undefined && rhythm) {
        setScores(prev => {
            const next = { ...prev };
            const semesterWeeks = weeks.filter(w => w.semesterId === semesterId);
            semesterWeeks.forEach((week, idx) => {
                if (idx % rhythm === 0) {
                    next[`${week.id}_${newId}_max`] = String(maxPoints);
                }
            });
            return next;
        });
    }
  };

  const handleDeleteCourse = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    if (selectedSubjectId === id) setSelectedSubjectId(null);
  };

  const handleToggleDeadline = (subjectId: string, deadlineId: string) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          deadlines: (s.deadlines || []).map(d => d.id === deadlineId ? { ...d, completed: !d.completed } : d)
        };
      }
      return s;
    }));
  };

  const handleAddDeadline = (subjectId: string, title: string, date: string, time?: string, urgency?: number) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        const newDeadline = { id: `d${Date.now()}`, title, date, time, urgency, completed: false };
        return {
          ...s,
          deadlines: [...(s.deadlines || []), newDeadline]
        };
      }
      return s;
    }));
  };

  const handleDeleteDeadline = (subjectId: string, deadlineId: string) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          deadlines: (s.deadlines || []).filter(d => d.id !== deadlineId)
        };
      }
      return s;
    }));
  };

  const currentSemesterSubjects = subjects.filter(s => s.semesterId === selectedSemesterId);
  const currentSemesterWeeks = weeks.filter(w => w.semesterId === selectedSemesterId);
  const stats = calculateSummary(currentSemesterSubjects, currentSemesterWeeks, scores);
  const selectedSubject = selectedSubjectId ? currentSemesterSubjects.find(s => s.id === selectedSubjectId) : null;

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 font-sans text-sm text-slate-900 flex flex-col">
      <div className="max-w-7xl mx-auto w-full space-y-6 flex-1 flex flex-col">
        {!selectedSubject && (
          <header className="flex flex-col gap-6 mb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800">Übungsblatt Tracker</h1>
                <p className="text-slate-500 font-medium mt-1">Verfolge deinen Fortschritt zur Klausurzulassung</p>
              </div>
              <div className="flex items-center gap-4 relative">
                {showResetConfirm ? (
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-red-200 shadow-sm">
                    <span className="text-sm font-bold text-red-600 mr-2">Wirklich zurücksetzen?</span>
                    <button onClick={() => setShowResetConfirm(false)} className="px-3 py-1 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Abbrechen</button>
                    <button onClick={() => {
                      setScores({});
                      setWeeks(INITIAL_WEEKS);
                      setSubjects(INITIAL_SUBJECTS);
                      setShowResetConfirm(false);
                    }} className="px-3 py-1 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700">Löschen</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 text-sm font-semibold text-red-600 hover:bg-slate-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Zurücksetzen</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <BookOpen className="w-3 h-3" />
                  Studiengang
                </div>
                <select 
                  value={selectedProgramId}
                  onChange={(e) => handleProgramChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                >
                  {INITIAL_PROGRAMS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <CalendarIcon className="w-3 h-3" />
                  Semester
                </div>
                <select 
                  value={selectedSemesterId}
                  onChange={(e) => handleSemesterChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                >
                  {INITIAL_SEMESTERS.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </header>
        )}

        {selectedSubject ? (
          <CourseDetail 
            subject={selectedSubject} 
            weeks={currentSemesterWeeks}
            scores={scores}
            stats={stats[selectedSubject.id] || { maxTotal: 0, achievedTotal: 0, requiredPoints: 0, totalQuote: 0, progressToPass: 0, workedSheetsQuote: 0, missingPoints: 0, required100PercentSheets: 0 }}
            onBack={() => setSelectedSubjectId(null)}
            onScoreChange={(weekId, type, value) => handleScoreChange(weekId, selectedSubject.id, type, value)}
            onThresholdChange={(v) => handleThresholdChange(selectedSubject.id, v)}
            onUrlChange={(v) => handleUrlChange(selectedSubject.id, v)}
            onAddWeek={handleAddWeek}
            onAddDeadline={handleAddDeadline}
            onDeleteDeadline={handleDeleteDeadline}
            onToggleDeadline={handleToggleDeadline}
          />
        ) : (
          <Dashboard 
            subjects={currentSemesterSubjects}
            stats={stats}
            onSelectCourse={setSelectedSubjectId}
            onAddCourse={handleAddCourse}
            onDeleteCourse={handleDeleteCourse}
            onToggleDeadline={handleToggleDeadline}
          />
        )}
        
        <footer className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 pb-8 mt-2">
            Daten werden sicher auf dem Server und lokal gespeichert
        </footer>
      </div>
    </div>
  );
}
