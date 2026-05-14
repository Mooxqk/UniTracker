// src/components/Auth.tsx
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { LogIn, UserPlus, GraduationCap } from 'lucide-react';

export function Auth({ onAuthSuccess }: { onAuthSuccess: () => void }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); // Vorherigen Fehler löschen
        try {
            // In der handleSubmit Funktion:
            if (isLogin) {
                await authService.login(email, password);
            } else {
                await authService.register(email, password); // Hier müssen beide drinstehen!
            }
            onAuthSuccess();
        } catch (err: any) {
            console.error("Auth-Fehler im Frontend:", err);
            setError('Da lief was schief. Check mal die Konsole.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 bg-indigo-100 rounded-2xl mb-4">
                        <GraduationCap className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Uni Tracker</h1>
                    <p className="text-slate-500">Verwalte deine Übungsblätter</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        placeholder="E-Mail"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Passwort"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                        {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                        {isLogin ? 'Anmelden' : 'Registrieren'}
                    </button>
                </form>

                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="w-full mt-6 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                >
                    {isLogin ? 'Noch kein Konto? Registrieren' : 'Bereits ein Konto? Einloggen'}
                </button>
            </div>
        </div>
    );
}