'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Download, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { generateVideo, waitForVideoCompletion } from '@/lib/api/agnes';
import { addToHistory } from '@/lib/storage/history';

const VALID_FRAMES = [81, 121, 161, 201, 241, 281, 321, 361, 401, 441];

const durationMap: Record<number, string> = {
  81: '~3 秒', 121: '~5 秒', 161: '~7 秒', 201: '~8 秒',
  241: '~10 秒', 281: '~12 秒', 321: '~13 秒', 361: '~15 秒',
  401: '~17 秒', 441: '~18 秒',
};

interface Segment {
  id: string;
  prompt: string;
  videoUrl?: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  progress?: number;
  error?: string;
}

export default function VideoStitchPage() {
  const [segments, setSegments] = useState<Segment[]>([
    { id: '1', prompt: '', status: 'pending' },
  ]);
  const [numFrames, setNumFrames] = useState(121);
  const [frameRate, setFrameRate] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duration = (numFrames / frameRate).toFixed(1);

  const addSegment = () => {
    setSegments([
      ...segments,
      { id: String(segments.length + 1), prompt: '', status: 'pending' },
    ]);
  };

  const removeSegment = (id: string) => {
    if (segments.length <= 1) return;
    setSegments(segments.filter(s => s.id !== id));
  };

  const updateSegmentPrompt = (id: string, prompt: string) => {
    setSegments(segments.map(s => s.id === id ? { ...s, prompt } : s));
  };

  const handleGenerate = async () => {
    const validSegments = segments.filter(s => s.prompt.trim());
    if (validSegments.length === 0) return;

    setLoading(true);
    setError(null);

    let lastVideoUrl: string | undefined;

    for (let i = 0; i < validSegments.length; i++) {
      const segment = validSegments[i];

      setSegments(prev => prev.map(s =>
        s.id === segment.id ? { ...s, status: 'generating', progress: 0 } : s
      ));

      try {
        const response = await generateVideo({
          prompt: segment.prompt.trim(),
          numFrames,
          frameRate,
          ...(lastVideoUrl ? { image: lastVideoUrl } : {}),
        });

        const videoUrl = await waitForVideoCompletion(
          response.video_id,
          (status, progress) => {
            setSegments(prev => prev.map(s =>
              s.id === segment.id ? { ...s, progress } : s
            ));
          }
        );

        lastVideoUrl = videoUrl;

        setSegments(prev => prev.map(s =>
          s.id === segment.id ? { ...s, status: 'completed', videoUrl, progress: 100 } : s
        ));

        addToHistory({
          type: 'video-stitch',
          prompt: segment.prompt.trim(),
          videoUrl,
          parameters: { numFrames, frameRate, segmentIndex: i + 1 },
        });
      } catch (err) {
        setSegments(prev => prev.map(s =>
          s.id === segment.id ? {
            ...s,
            status: 'error',
            error: err instanceof Error ? err.message : '生成失败'
          } : s
        ));
      }
    }

    setLoading(false);
  };

  const handleDownload = async (videoUrl: string, index: number) => {
    const response = await fetch(videoUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai拼接-${index + 1}-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalDuration = segments.length * parseFloat(duration);
  const completedCount = segments.filter(s => s.status === 'completed').length;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">视频拼接</h1>
      <p className="text-muted-foreground mb-6">
        将多个视频片段拼接成更长的视频。每个片段使用前一个片段的最后一帧作为起始帧，实现无缝衔接。
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>视频片段</CardTitle>
              <CardDescription>
                {segments.length} 个片段，预计总时长 {totalDuration.toFixed(1)} 秒
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {segments.map((segment, index) => (
                <div key={segment.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">片段 {index + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${
                        segment.status === 'completed' ? 'text-green-500' :
                        segment.status === 'generating' ? 'text-blue-500' :
                        segment.status === 'error' ? 'text-red-500' :
                        'text-muted-foreground'
                      }`}>
                        {segment.status === 'generating' && segment.progress
                          ? `生成中 ${segment.progress}%`
                          : segment.status === 'pending' ? '待生成' :
                            segment.status === 'completed' ? '已完成' :
                            segment.status === 'error' ? '失败' : segment.status}
                      </span>
                      {segments.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSegment(segment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <Textarea
                    placeholder={`描述片段 ${index + 1} 的内容...`}
                    value={segment.prompt}
                    onChange={(e) => updateSegmentPrompt(segment.id, e.target.value)}
                    rows={2}
                  />

                  {segment.videoUrl && (
                    <video
                      src={segment.videoUrl}
                      controls
                      className="w-full rounded border"
                    />
                  )}

                  {segment.error && (
                    <div className="p-2 text-sm text-destructive bg-destructive/10 rounded">
                      {segment.error}
                    </div>
                  )}
                </div>
              ))}

              <Button variant="outline" onClick={addSegment} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                添加片段
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>每片段帧数</Label>
                <select
                  value={numFrames}
                  onChange={(e) => setNumFrames(Number(e.target.value))}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  {VALID_FRAMES.map(f => (
                    <option key={f} value={f}>{f} 帧 — {durationMap[f]}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>帧率 (FPS)</Label>
                <Input
                  type="number"
                  value={frameRate}
                  onChange={(e) => setFrameRate(Number(e.target.value))}
                  min={1}
                  max={60}
                />
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">单片段时长</div>
                <div className="text-xl font-bold text-primary">{duration} 秒</div>
              </div>

              <div className="pt-4 border-t space-y-1">
                <div className="text-sm text-muted-foreground">
                  片段数: {segments.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  已完成: {completedCount}/{segments.length}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  总时长: ~{totalDuration.toFixed(1)} 秒
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleGenerate}
            disabled={loading || segments.every(s => !s.prompt.trim())}
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              '生成所有片段'
            )}
          </Button>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          {completedCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>下载</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {segments.filter(s => s.videoUrl).map((segment, index) => (
                  <Button
                    key={segment.id}
                    variant="outline"
                    onClick={() => handleDownload(segment.videoUrl!, index + 1)}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    片段 {index + 1}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
