import { Subject, Week, Scores } from '../types';

export interface AppData {
    subjects: Subject[];
    weeks: Week[];
    scores: Scores;
    selectedProgramId: string;
    selectedSemesterId: string;
    pendingInvites?: any[];
}

const API_URL = '/api/data';

export const dataService = {
    async fetchData(): Promise<AppData | null> {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Server antwortet nicht mit OK');
            const data = await response.json();

            // Wenn das Objekt leer ist (z.B. frisch erstellte data.json), gib null zurück
            if (Object.keys(data).length === 0) return null;
            return data;
        } catch (error) {
            console.error('Fehler beim Laden der Daten vom Backend:', error);
            return null;
        }
    },

    async saveData(data: AppData): Promise<void> {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Speichern fehlgeschlagen');
        } catch (error) {
            console.error('Fehler beim Speichern der Daten ans Backend:', error);
            throw error; // Den Fehler werfen wir weiter, falls die App.tsx darauf reagieren soll
        }
    }
};