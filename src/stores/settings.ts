import { create } from 'zustand';

interface SettingsState {
  defaultImageSize: string;
  defaultVideoFrames: number;
  defaultVideoFps: number;
  defaultVideoWidth: number;
  defaultVideoHeight: number;
  setImageSize: (size: string) => void;
  setVideoFrames: (frames: number) => void;
  setVideoFps: (fps: number) => void;
  setVideoWidth: (width: number) => void;
  setVideoHeight: (height: number) => void;
}

const STORAGE_KEY = 'ai-img-vid-settings';

function loadSettings() {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

function saveSettings(state: Omit<SettingsState, 'setImageSize' | 'setVideoFrames' | 'setVideoFps' | 'setVideoWidth' | 'setVideoHeight'>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const useSettingsStore = create<SettingsState>((set) => {
  const saved = loadSettings();
  return {
    defaultImageSize: saved?.defaultImageSize || '1024x1024',
    defaultVideoFrames: saved?.defaultVideoFrames || 121,
    defaultVideoFps: saved?.defaultVideoFps || 24,
    defaultVideoWidth: saved?.defaultVideoWidth || 1152,
    defaultVideoHeight: saved?.defaultVideoHeight || 768,
    setImageSize: (size) => set((state) => {
      const newState = { ...state, defaultImageSize: size };
      saveSettings(newState);
      return { defaultImageSize: size };
    }),
    setVideoFrames: (frames) => set((state) => {
      saveSettings({ ...state, defaultVideoFrames: frames });
      return { defaultVideoFrames: frames };
    }),
    setVideoFps: (fps) => set((state) => {
      saveSettings({ ...state, defaultVideoFps: fps });
      return { defaultVideoFps: fps };
    }),
    setVideoWidth: (width) => set((state) => {
      saveSettings({ ...state, defaultVideoWidth: width });
      return { defaultVideoWidth: width };
    }),
    setVideoHeight: (height) => set((state) => {
      saveSettings({ ...state, defaultVideoHeight: height });
      return { defaultVideoHeight: height };
    }),
  };
});
