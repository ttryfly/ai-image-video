'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Download, RefreshCw } from 'lucide-react';
import { generateVideo, waitForVideoCompletion } from '@/lib/api/agnes';
import { addToHistory } from '@/lib/storage/history';
import { useSettingsStore } from '@/stores/settings';

const VALID_FRAMES = [81, 121, 161, 201, 241, 281, 321, 361, 401, 441];

const durationMap: Record<number, string> = {
  81: '~3 秒', 121: '~5 秒', 161: '~7 秒', 201: '~8 秒',
  241: '~10 秒', 281: '~12 秒', 321: '~13 秒', 361: '~15 秒',
  401: '~17 秒', 441: '~18 秒',
};

export default function TextToVideoPage() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const { defaultVideoFrames, defaultVideoFps, defaultVideoWidth, defaultVideoHeight, setVideoFrames, setVideoFps, setVideoWidth, setVideoHeight } = useSettingsStore();

  const duration = (defaultVideoFrames / defaultVideoFps).toFixed(1);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setStatus('创建任务中...');
    setProgress(0);

    try {
      const response = await generateVideo({
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        numFrames: defaultVideoFrames,
        frameRate: defaultVideoFps,
        width: defaultVideoWidth,
        height: defaultVideoHeight,
      });

      setStatus('视频生成中...');
      const videoUrl = await waitForVideoCompletion(
        response.video_id,
        (s, p) => {
          setStatus(s);
          setProgress(p);
        }
      );

      setResult(videoUrl);
      addToHistory({
        type: 'text-to-video',
        prompt: prompt.trim(),
        videoUrl,
        parameters: {
          numFrames: defaultVideoFrames,
          frameRate: defaultVideoFps,
          width: defaultVideoWidth,
          height: defaultVideoHeight,
          ...(negativePrompt.trim() ? { negativePrompt: negativePrompt.trim() } : {}),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    const response = await fetch(result);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai视频-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">文生视频</h1>
      <p className="text-muted-foreground mb-6">使用 Agnes Video V2.0 根据文本描述生成高质量视频</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>参数设置</CardTitle>
            <CardDescription>配置视频生成参数</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>提示词 <span className="text-muted-foreground text-xs">（主体 + 动作 + 场景 + 镜头 + 光照 + 风格）</span></Label>
              <Textarea
                placeholder="例如：一名年轻宇航员在红色沙漠星球上行走，风吹起尘埃，缓慢的电影跟拍镜头，戏剧性的日落光照，写实科幻风格"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>负面提示词 <span className="text-muted-foreground text-xs">（可选，描述不想出现的内容）</span></Label>
              <Textarea
                placeholder="例如：模糊, 抖动, 变形, 低质量"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>帧数（8n+1）</Label>
              <select
                value={defaultVideoFrames}
                onChange={(e) => setVideoFrames(Number(e.target.value))}
                className="w-full p-2 border rounded-md bg-background"
              >
                {VALID_FRAMES.map(f => (
                  <option key={f} value={f}>{f} 帧 — {durationMap[f]}</option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium">视频时长</div>
              <div className="text-2xl font-bold text-primary">{duration} 秒</div>
              <div className="text-xs text-muted-foreground mt-1">
                {defaultVideoFrames} 帧 ÷ {defaultVideoFps} FPS = {duration}s
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>帧率 (FPS)</Label>
                <Input
                  type="number"
                  value={defaultVideoFps}
                  onChange={(e) => setVideoFps(Number(e.target.value))}
                  min={1}
                  max={60}
                />
              </div>

              <div className="space-y-2">
                <Label>宽度</Label>
                <Input
                  type="number"
                  value={defaultVideoWidth}
                  onChange={(e) => setVideoWidth(Number(e.target.value))}
                  min={256}
                  max={2048}
                />
              </div>

              <div className="space-y-2">
                <Label>高度</Label>
                <Input
                  type="number"
                  value={defaultVideoHeight}
                  onChange={(e) => setVideoHeight(Number(e.target.value))}
                  min={256}
                  max={2048}
                />
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {status} {progress > 0 && `(${progress}%)`}
                </>
              ) : (
                '生成视频'
              )}
            </Button>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>结果</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <video
                  src={result}
                  controls
                  className="w-full rounded-lg border"
                />
                <Button variant="outline" onClick={handleDownload} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  下载视频
                </Button>
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center border rounded-lg bg-muted/50">
                <p className="text-muted-foreground">生成的视频将显示在这里</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
