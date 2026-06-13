'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Search, Image, Video, Scissors } from 'lucide-react';
import { getHistory, deleteHistoryItem, clearHistory, type HistoryItem } from '@/lib/storage/history';

const typeLabels: Record<string, string> = {
  'text-to-image': '文生图',
  'image-to-image': '图生图',
  'text-to-video': '文生视频',
  'image-to-video': '图生视频',
  'video-stitch': '视频拼接',
};

const typeIcons: Record<string, React.ElementType> = {
  'text-to-image': Image,
  'image-to-image': Image,
  'text-to-video': Video,
  'image-to-video': Video,
  'video-stitch': Scissors,
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = (id: string) => {
    deleteHistoryItem(id);
    setHistory(history.filter(item => item.id !== id));
  };

  const handleClearAll = () => {
    if (confirm('确定要清空所有历史记录吗？')) {
      clearHistory();
      setHistory([]);
    }
  };

  const handleView = (item: HistoryItem) => {
    if (item.imageUrl) {
      window.open(item.imageUrl, '_blank');
    } else if (item.videoUrl) {
      window.open(item.videoUrl, '_blank');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">历史记录</h1>
        <Button variant="destructive" onClick={handleClearAll} disabled={history.length === 0}>
          <Trash2 className="h-4 w-4 mr-2" />
          清空
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索提示词..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="p-2 border rounded-md bg-background"
        >
          <option value="all">全部类型</option>
          <option value="text-to-image">文生图</option>
          <option value="image-to-image">图生图</option>
          <option value="text-to-video">文生视频</option>
          <option value="image-to-video">图生视频</option>
          <option value="video-stitch">视频拼接</option>
        </select>
      </div>

      {filteredHistory.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {history.length === 0 ? '暂无记录，开始生成吧！' : '未找到匹配的结果。'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHistory.map((item) => {
            const Icon = typeIcons[item.type] || Image;
            return (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-video bg-muted relative">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.prompt}
                      className="w-full h-full object-cover"
                    />
                  ) : item.videoUrl ? (
                    <video
                      src={item.videoUrl}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 text-xs bg-background/80 rounded">
                      {typeLabels[item.type]}
                    </span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm line-clamp-2 mb-2">{item.prompt}</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    {new Date(item.createdAt).toLocaleString('zh-CN')}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(item)}
                      className="flex-1"
                    >
                      查看
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
