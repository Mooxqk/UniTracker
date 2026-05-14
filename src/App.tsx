import React, { useState, useEffect } from 'react';
import { INITIAL_PROGRAMS, INITIAL_SEMESTERS } from './constants';
import { Scores, Subject, Week } from './types';
import { calculateSummary } from './utils';
import { Loader2 } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { CourseDetail } from './components/CourseDetail';
import { Auth } from './components/Auth';
import { dataService } from './services/dataService';

export default function App() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ email: string } | null>(null);

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [weeks, setWeeks] = useState<Week[]>([]);
    const [scores, setScores] = useState<Scores>({});

    const [selectedProgramId, setSelectedProgramId] = useState<string>(INITIAL_PROGRAMS[0].id);
    const [selectedSemesterId, setSelectedSemesterId] = useState<string>(INITIAL_SEMESTERS[1].id);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

    // 1. Prüfen ob der User eingeloggt ist
    useEffect(() => {
        async function checkAuth() {
            try {
                const res = await fetch('/api/auth/me');
                const data = await res.json();
                if (data.loggedIn) {
                    setUser({ email: data.email });
                    // Wenn eingeloggt, Daten laden
                    const serverData = await dataService.fetchData();
                    if (serverData) {
                        setSubjects(serverData.subjects || []);
                        setWeeks(serverData.weeks || []);
                        setScores(serverData.scores || {});
                        setSelectedProgramId(serverData.selectedProgramId || INITIAL_PROGRAMS[0].id);
                        setSelectedSemesterId(serverData.selectedSemesterId || INITIAL_SEMESTERS[1].id);
                    }
                }
            } catch (err) {
                console.error("Fehler beim Auth-Check", err);
            } finally {
                setLoading(false);
            }
        }
        checkAuth();
    }, []);

    // Automatisches Speichern, wenn sich Daten ändern
    useEffect(() => {
        if (user && !loading) {
            dataService.saveData({
                subjects,
                weeks,
                scores,
                selectedProgramId,
                selectedSemesterId
            });
        }
    }, [subjects, weeks, scores, selectedProgramId, selectedSemesterId, user, loading]);

    const stats = calculateSummary(subjects, weeks, scores);

    const handleAddCourse = (name: string, threshold: number) => {
        const newCourse: Subject = {
            id: `c${Date.now()}`,
            name,
            threshold,
            semesterId: selectedSemesterId,
            deadlines: []
        };
        setSubjects([...subjects, newCourse]);
    };

    const handleDeleteCourse = (id: string) => {
        setSubjects(subjects.filter(s => s.id !== id));
        const newScores = { ...scores };
        Object.keys(newScores).forEach(key => {
            if (key.includes(`_${id}_`)) delete newScores[key];
        });
        setScores(newScores);
    };

    const handleScoreChange = (weekId: string, subjectId: string, type: 'max' | 'achieved', value: string) => {
        setScores(prev => ({
            ...prev,
            [`${weekId}_${subjectId}_${type}`]: value
        }));
    };

    const handleToggleDeadline = (subjectId: string, deadlineId: string) => {
        setSubjects(subjects.map(s => {
            if (s.id !== subjectId) return s;
            return {
                ...s,
                deadlines: s.deadlines?.map(d => d.id === deadlineId ? { ...d, completed: !d.completed } : d)
            };
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    // Wenn kein User da ist -> Login Screen
    if (!user) {
        return <Auth onAuthSuccess={() => window.location.reload()} />;
    }

    const currentSemesterSubjects = subjects.filter(s => s.id.includes(selectedSemesterId) || s.semesterId === selectedSemesterId);
    const currentSemesterWeeks = weeks.filter(w => w.semesterId === selectedSemesterId);
    const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            <header className="max-w-5xl mx-auto px-6 pt-12 pb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-800">
                        Uni Tracker <span className="text-indigo-600">.</span>
                    </h1>
                    <p className="text-slate-500 font-medium">{user.email}</p>
                </div>
                <button
                    onClick={async () => {
                        await fetch('/api/auth/logout', { method: 'POST' });
                        window.location.reload();
                    }}
                    className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors"
                >
                    Abmelden
                </button>
            </header>

            <main className="max-w-5xl mx-auto px-6">
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
                        onThresholdChange={(v) => {
                            setSubjects(subjects.map(s => s.id === selectedSubject.id ? {...s, threshold: parseFloat(v) || 0} : s));
                        }}
                        onUrlChange={(v) => {
                            setSubjects(subjects.map(s => s.id === selectedSubject.id ? {...s, submissionUrl: v} : s));
                        }}
                        onAddWeek={(name, date) => {
                            setWeeks([...weeks, { id: `w${Date.now()}`, name, date, semesterId: selectedSemesterId }]);
                        }}
                        onAddDeadline={(subId, title, date, time, urgency) => {
                            setSubjects(subjects.map(s => s.id === subId ? {
                                ...s,
                                deadlines: [...(s.deadlines || []), { id: `d${Date.now()}`, title, date, time, urgency, completed: false }]
                            } : s));
                        }}
                        onDeleteDeadline={(subId, dId) => {
                            setSubjects(subjects.map(s => s.id === subId ? {
                                ...s, deadlines: s.deadlines?.filter(d => d.id !== dId)
                            } : s));
                        }}
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
            </main>

            <footer className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 pb-8 mt-12">
                Persönlicher Account: {user.email}
            </footer>
        </div>
    );
}