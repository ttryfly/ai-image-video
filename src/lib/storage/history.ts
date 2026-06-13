const HISTORY_STORAGE = 'ai-img-vid-history';

export type GenerationType = 'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video' | 'video-stitch';

export interface HistoryItem {
  id: string;
  type: GenerationType;
  prompt: string;
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  parameters: Record<string, unknown>;
  createdAt: number;
}

export function getHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(HISTORY_STORAGE);
  return stored ? JSON.parse(stored) : [];
}

export function addToHistory(item: Omit<HistoryItem, 'id' | 'createdAt'>): HistoryItem {
  const history = getHistory();
  const newItem: HistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  history.unshift(newItem);
  if (history.length > 100) history.pop();
  localStorage.setItem(HISTORY_STORAGE, JSON.stringify(history));
  return newItem;
}

export function deleteHistoryItem(id: string): void {
  const history = getHistory().filter(item => item.id !== id);
  localStorage.setItem(HISTORY_STORAGE, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_STORAGE);
}

export function getHistoryByType(type: GenerationType): HistoryItem[] {
  return getHistory().filter(item => item.type === type);
}

export function searchHistory(query: string): HistoryItem[] {
  const lowerQuery = query.toLowerCase();
  return getHistory().filter(item =>
    item.prompt.toLowerCase().includes(lowerQuery)
  );
}
