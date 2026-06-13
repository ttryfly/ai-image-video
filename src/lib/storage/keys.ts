const API_KEY_STORAGE = 'ai-img-vid-keys';

export interface ApiKeyConfig {
  id: string;
  provider: string;
  name: string;
  key: string;
  baseUrl?: string;
  createdAt: number;
}

export function getApiKeys(): ApiKeyConfig[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(API_KEY_STORAGE);
  return stored ? JSON.parse(stored) : [];
}

export function saveApiKey(config: Omit<ApiKeyConfig, 'id' | 'createdAt'>): ApiKeyConfig {
  const keys = getApiKeys();
  const newKey: ApiKeyConfig = {
    ...config,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  keys.push(newKey);
  localStorage.setItem(API_KEY_STORAGE, JSON.stringify(keys));
  return newKey;
}

export function updateApiKey(id: string, updates: Partial<ApiKeyConfig>): void {
  const keys = getApiKeys();
  const index = keys.findIndex(k => k.id === id);
  if (index !== -1) {
    keys[index] = { ...keys[index], ...updates };
    localStorage.setItem(API_KEY_STORAGE, JSON.stringify(keys));
  }
}

export function deleteApiKey(id: string): void {
  const keys = getApiKeys().filter(k => k.id !== id);
  localStorage.setItem(API_KEY_STORAGE, JSON.stringify(keys));
}

export function getApiKeyByProvider(provider: string): ApiKeyConfig | undefined {
  return getApiKeys().find(k => k.provider === provider);
}

export function getApiKeyById(id: string): ApiKeyConfig | undefined {
  return getApiKeys().find(k => k.id === id);
}
