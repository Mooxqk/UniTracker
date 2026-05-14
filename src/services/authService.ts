// src/services/authService.ts
const API_URL = '/api/auth';

export const authService = {
    async login(email: string, password: string) {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }) // Sicherstellen, dass hier 'password' steht!
        });
        if (!res.ok) throw new Error('Login fehlgeschlagen');
        return res.json();
    },

    async register(email: string, password: string) { // Sicherstellen, dass hier 'password' steht
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }) // Hier MÜSSEN 'email' und 'password' stehen
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Registrierung fehlgeschlagen');
        }
        return res.json();
    },

    async logout() {
        await fetch(`${API_URL}/logout`, { method: 'POST' });
        window.location.reload();
    }
};