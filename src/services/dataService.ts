import { Subject, Week, Scores } from '../types';

export interface AppData {
  subjects: Subject[];
  weeks: Week[];
  scores: Scores;
  selectedProgramId: string;
  selectedSemesterId: string;
}

const API_URL = '/api/data';

export const dataService = {
  async fetchData(): Promise<AppData | null> {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Server not available');
      const data = await response.json();
      if (Object.keys(data).length === 0) return null;
      return data;
    } catch (error) {
      console.warn('Server storage unavailable, falling back to local storage:', error);
      const saved = localStorage.getItem('uni_tracker_data_backup');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse local backup', e);
        }
      }
      return null;
    }
  },

  async saveData(data: AppData): Promise<void> {
    // Always save a local backup too
    localStorage.setItem('uni_tracker_data_backup', JSON.stringify(data));

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save to server');
    } catch (error) {
      // SILENT FAIL: We already saved to localStorage, so the user can continue working locally
      console.warn('Could not save to server, data persists in browser only.');
    }
  }
};
