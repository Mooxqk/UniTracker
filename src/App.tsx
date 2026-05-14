import React, { useState, useEffect } from 'react';
import { generateWeeksForSemester, INITIAL_PROGRAMS, INITIAL_SEMESTERS } from './constants';
import { Scores, Subject, Week } from './types';
import { calculateSummary } from './utils';
import { Dashboard } from './components/Dashboard';
import { CourseDetail } from './components/CourseDetail';
import { dataService } from './services/dataService';
import { Loader2, RefreshCcw } from 'lucide-react';

export default function App() {
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [weeks, setWeeks] = useState<Week[]>([]);
    const [scores, setScores] = useState<Scores>({});
    const [selectedProgramId, setSelectedProgramId] = useState<string>(INITIAL_PROGRAMS[0].id);
    const [selectedSemesterId, setSelectedSemesterId] = useState<string>(INITIAL_SEMESTERS[1].id);

    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

    // Daten beim Start vom Server laden
    useEffect(() => {
        async function initData() {
            try {
                const serverData = await dataService.fetchData();
                if (serverData) {
                    setSubjects(serverData.subjects || []);
                    setWeeks(serverData.weeks || []);
                    setScores(serverData.scores || {});
                    setSelectedProgramId(serverData.selectedProgramId || INITIAL_PROGRAMS[0].id);
                    setSelectedSemesterId(serverData.selectedSemesterId || INITIAL_SEMESTERS[1].id);
                }
            } catch (error) {
                console.error("Initialisierung fehlgeschlagen:", error);
            } finally {
                setLoading(false);
            }
        }
        initData();
    }, []);

    // Automatische Speicherung bei Änderungen
    useEffect(() => {
        if (loading) return;

        const saveData = async () => {
            await dataService.saveData({
                subjects,
                weeks,
                scores,
                selectedProgramId,
                selectedSemesterId,
            });
        };

        const timeout = setTimeout(saveData, 500); // Debounce, um den Server nicht zu fluten
        return () => clearTimeout(timeout);
    }, [subjects, weeks, scores, selectedProgramId, selectedSemesterId, loading]);

    // Handler für Änderungen (stark vereinfacht)
    const handleScoreChange = (weekId: string, subjectId: string, type: 'max' | 'achieved', value: string) => {
        setScores(prev => ({
            ...prev,
            [`${weekId}_${subjectId}_${type}`]: value
        }));
    };

    const handleAddCourse = (name: string, threshold: number) => {
        const newCourse: Subject = {
            id: `${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
            name,
            threshold,
            semesterId: selectedSemesterId,
            deadlines: []
        };
        setSubjects(prev => [...prev, newCourse]);
    };

    const handleDeleteCourse = (id: string) => {
        setSubjects(prev => prev.filter(s => s.id !== id));
        if (selectedSubjectId === id) setSelectedSubjectId(null);
    };

    const handleToggleDeadline = (subjectId: string, deadlineId: string) => {
        setSubjects(prev => prev.map(s => {
            if (s.id !== subjectId) return s;
            return {
                ...s,
                deadlines: s.deadlines?.map(d => d.id === deadlineId ? { ...d, completed: !d.completed } : d)
            };
        }));
    };

    // Hilfsvariablen für die Anzeige
    const currentSemesterSubjects = subjects.filter(s => s.semesterId === selectedSemesterId);
    const currentSemesterWeeks = weeks.filter(w => w.semesterId === selectedSemesterId);
    const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
    const stats = calculateSummary(subjects, weeks, scores);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-8">

                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                            Uni Tracker <span className="text-indigo-600 text-sm font-bold bg-indigo-50 px-2 py-1 rounded-lg">PRO</span>
                        </h1>
                        <p className="text-slate-500 font-medium">Verwalte deine Übungsblätter lokal auf dem Server</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={selectedSemesterId}
                            onChange={(e) => setSelectedSemesterId(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {INITIAL_SEMESTERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </header>

                {selectedSubject ? (
                    <CourseDetail
                        subject={selectedSubject}
                        weeks={currentSemesterWeeks}
                        scores={scores}
                        stats={stats[selectedSubject.id] || {
                            maxTotal: 0, achievedTotal: 0, requiredPoints: 0, totalQuote: 0,
                            progressToPass: 0, workedSheetsQuote: 0, missingPoints: 0, required100PercentSheets: 0
                        }}
                        onBack={() => setSelectedSubjectId(null)}
                        onScoreChange={(weekId, type, value) => handleScoreChange(weekId, selectedSubject.id, type, value)}
                        onThresholdChange={(v) => setSubjects(prev => prev.map(s => s.id === selectedSubject.id ? {...s, threshold: parseFloat(v)} : s))}
                        onUrlChange={(v) => setSubjects(prev => prev.map(s => s.id === selectedSubject.id ? {...s, submissionUrl: v} : s))}
                        onAddWeek={(name, date) => setWeeks(prev => [...prev, { id: `w_${Date.now()}`, name, date, semesterId: selectedSemesterId }])}
                        onAddDeadline={(sId, title, date) => setSubjects(prev => prev.map(s => s.id === sId ? {...s, deadlines: [...(s.deadlines || []), {id: `d_${Date.now()}`, title, date, completed: false}]} : s))}
                        onDeleteDeadline={(sId, dId) => setSubjects(prev => prev.map(s => s.id === sId ? {...s, deadlines: s.deadlines?.filter(d => d.id !== dId)} : s))}
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

                <footer className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 pb-8 mt-4 flex items-center justify-center gap-2">
                    <RefreshCcw className="w-3 h-3" /> Daten werden live auf dem Server gespeichert
                </footer>
            </div>
        </div>
    );
}