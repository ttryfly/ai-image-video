'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, TestTube } from 'lucide-react';
import { getApiKeys, saveApiKey, deleteApiKey, type ApiKeyConfig } from '@/lib/storage/keys';

const providers = [
  { id: 'agnes', name: 'Agnes AI', baseUrl: 'https://apihub.agnes-ai.com/v1' },
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1' },
  { id: 'custom', name: '自定义 API', baseUrl: '' },
];

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('agnes');
  const [keyName, setKeyName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [testStatus, setTestStatus] = useState<Record<string, 'testing' | 'success' | 'error'>>({});

  useEffect(() => {
    setApiKeys(getApiKeys());
  }, []);

  const handleAddKey = () => {
    if (!apiKey.trim()) return;

    const provider = providers.find(p => p.id === selectedProvider);
    const newKey = saveApiKey({
      provider: selectedProvider,
      name: keyName || provider?.name || selectedProvider,
      key: apiKey.trim(),
      baseUrl: selectedProvider === 'custom' ? baseUrl : provider?.baseUrl,
    });

    setApiKeys([...apiKeys, newKey]);
    setKeyName('');
    setApiKey('');
    setBaseUrl('');
  };

  const handleDeleteKey = (id: string) => {
    deleteApiKey(id);
    setApiKeys(apiKeys.filter(k => k.id !== id));
  };

  const handleTestKey = async (keyConfig: ApiKeyConfig) => {
    setTestStatus(prev => ({ ...prev, [keyConfig.id]: 'testing' }));

    try {
      const response = await fetch(`${keyConfig.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${keyConfig.key}` },
      });

      if (response.ok) {
        setTestStatus(prev => ({ ...prev, [keyConfig.id]: 'success' }));
      } else {
        setTestStatus(prev => ({ ...prev, [keyConfig.id]: 'error' }));
      }
    } catch {
      setTestStatus(prev => ({ ...prev, [keyConfig.id]: 'error' }));
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">设置</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>添加 API Key</CardTitle>
          <CardDescription>添加你的 AI 服务 API Key 以开始使用</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>服务商</Label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
            >
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>名称（可选）</Label>
            <Input
              placeholder="我的 API Key"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          {selectedProvider === 'custom' && (
            <div className="space-y-2">
              <Label>Base URL</Label>
              <Input
                placeholder="https://api.example.com/v1"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
          )}

          <Button onClick={handleAddKey} disabled={!apiKey.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            添加
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>已配置的 Key</CardTitle>
          <CardDescription>管理你的 API Key</CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <p className="text-muted-foreground text-sm">暂未配置任何 API Key。</p>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{key.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {key.key.substring(0, 20)}...{key.key.substring(key.key.length - 4)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestKey(key)}
                      disabled={testStatus[key.id] === 'testing'}
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteKey(key.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
