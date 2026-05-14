import React, { useState, useEffect } from 'react';
import { INITIAL_SEMESTERS, SEMESTER_WEEKS } from './constants';
import { Scores, Subject, Week } from './types';
import { calculateSummary } from './utils';
import { Loader2, Calendar } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { CourseDetail } from './components/CourseDetail';
import { Auth } from './components/Auth';
import { dataService } from './services/dataService';

export default function App() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ email: string } | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [scores, setScores] = useState<Scores>({});
    const [selectedSemesterId, setSelectedSemesterId] = useState<string>(INITIAL_SEMESTERS[1].id);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

    const currentSemesterWeeks: Week[] = (SEMESTER_WEEKS[selectedSemesterId] || []).map((w, index) => ({
        id: `w_${selectedSemesterId}_${index + 1}`,
        name: w.name,
        date: w.date,
        semesterId: selectedSemesterId
    }));

    // --- KEYBOARD SHORTCUTS ---
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // ESC -> Schließt Kurs-Details, außer man tippt gerade in einem Input-Feld
            if (event.key === 'Escape') {
                const isTyping = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
                if (selectedSubjectId && !isTyping) {
                    setSelectedSubjectId(null);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedSubjectId]);

    useEffect(() => {
        async function checkAuth() {
            try {
                const res = await fetch('/api/auth/me');
                const data = await res.json();
                if (data.loggedIn) {
                    setUser({ email: data.email });
                    const serverData = await dataService.fetchData();
                    if (serverData) {
                        setSubjects(serverData.subjects || []);
                        setScores(serverData.scores || {});
                        setSelectedSemesterId(serverData.selectedSemesterId || INITIAL_SEMESTERS[1].id);
                    }
                }
            } catch (err) { console.error(err); } finally { setLoading(false); }
        }
        checkAuth();
    }, []);

    useEffect(() => {
        if (user && !loading && (subjects.length > 0 || Object.keys(scores).length > 0)) {
            dataService.saveData({ subjects, weeks: [], scores, selectedProgramId: "inf", selectedSemesterId });
        }
    }, [subjects, scores, selectedSemesterId, user, loading]);

    const handleLogout = async () => {
        setSubjects([]);
        setScores({});
        setUser(null);
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.reload();
    };

    const stats = calculateSummary(subjects, currentSemesterWeeks, scores);
    const currentSemesterSubjects = subjects.filter(s => s.semesterId === selectedSemesterId);
    const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" /></div>;
    if (!user) return <Auth onAuthSuccess={() => window.location.reload()} />;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-10">
            <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-100">
                            <div className="w-3.5 h-3.5 bg-white rounded-sm rotate-45"></div>
                        </div>
                        <h1 className="text-xl font-black tracking-tight text-slate-800">Uni Tracker.</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        {!selectedSubjectId && (
                            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2" />
                                <select value={selectedSemesterId} onChange={(e) => setSelectedSemesterId(e.target.value)} className="bg-transparent font-bold text-[11px] text-slate-600 outline-none pr-3 cursor-pointer">
                                    {INITIAL_SEMESTERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        )}
                        <button onClick={handleLogout} className="text-[10px] font-bold uppercase text-slate-400 hover:text-red-500 transition-colors">Logout</button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 mt-8">
                {selectedSubject ? (
                    <CourseDetail
                        subject={selectedSubject} weeks={currentSemesterWeeks} scores={scores} stats={stats[selectedSubject.id]}
                        onBack={() => setSelectedSubjectId(null)}
                        onScoreChange={(weekId, type, value) => { setScores(prev => ({ ...prev, [`${weekId}_${selectedSubject.id}_${type}`]: value })); }}
                        onThresholdChange={(v) => { setSubjects(subjects.map(s => s.id === selectedSubject.id ? {...s, threshold: parseFloat(v) || 0} : s)); }}
                        onUrlChange={(v) => { setSubjects(subjects.map(s => s.id === selectedSubject.id ? {...s, submissionUrl: v} : s)); }}
                        onAddDeadline={(subId, title, date, time, urgency) => {
                            setSubjects(subjects.map(s => s.id === subId ? { ...s, deadlines: [...(s.deadlines || []), { id: `d${Date.now()}`, title, date, time, urgency, completed: false }] } : s));
                        }}
                        onDeleteDeadline={(subId, dId) => { setSubjects(subjects.map(s => s.id === subId ? { ...s, deadlines: s.deadlines?.filter(d => d.id !== dId) } : s)); }}
                        onToggleDeadline={(subId, dId) => { setSubjects(subjects.map(s => { if (s.id !== subId) return s; return { ...s, deadlines: s.deadlines?.map(d => d.id === dId ? { ...d, completed: !d.completed } : d) }; })); }}
                    />
                ) : (
                    <Dashboard
                        subjects={currentSemesterSubjects} stats={stats} onSelectCourse={setSelectedSubjectId}
                        onAddCourse={(name, threshold, maxPoints, rhythm) => {
                            const newSubjectId = `c${Date.now()}`;
                            const defaultMaxPoints = maxPoints ? String(maxPoints) : "0";
                            const newSubject: Subject = { id: newSubjectId, name, threshold: threshold || 50, semesterId: selectedSemesterId, deadlines: [] };
                            const newScoresForCourse: Scores = {};
                            currentSemesterWeeks.forEach((week, index) => {
                                const maxKey = `${week.id}_${newSubjectId}_max`;
                                if (rhythm === 2 && index % 2 !== 0) newScoresForCourse[maxKey] = "0";
                                else newScoresForCourse[maxKey] = defaultMaxPoints;
                            });
                            setSubjects(prev => [...prev, newSubject]);
                            setScores(prev => ({ ...prev, ...newScoresForCourse }));
                        }}
                        onDeleteCourse={(id) => {
                            setSubjects(prev => prev.filter(s => s.id !== id));
                            setScores(prev => {
                                const next = { ...prev };
                                Object.keys(next).forEach(k => { if (k.includes(`_${id}_`)) delete next[k]; });
                                return next;
                            });
                        }}
                        onToggleDeadline={(subId, dId) => { setSubjects(subjects.map(s => { if (s.id !== subId) return s; return { ...s, deadlines: s.deadlines?.map(d => d.id === dId ? { ...d, completed: !d.completed } : d) }; })); }}
                    />
                )}
            </main>
        </div>
    );
}