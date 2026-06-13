'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Download, RefreshCw, Upload } from 'lucide-react';
import { generateImage } from '@/lib/api/agnes';
import { addToHistory } from '@/lib/storage/history';
import { useSettingsStore } from '@/stores/settings';

const sizeOptions = [
  { value: '1024x1024', label: '1024×1024 (1:1)' },
  { value: '1024x768', label: '1024×768 (4:3)' },
  { value: '768x1024', label: '768×1024 (3:4)' },
  { value: '1280x720', label: '1280×720 (16:9)' },
  { value: '720x1280', label: '720×1280 (9:16)' },
  { value: '1536x1024', label: '1536×1024 (3:2)' },
  { value: '1024x1536', label: '1024×1536 (2:3)' },
];

export default function ImageEditPage() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { defaultImageSize, setImageSize } = useSettingsStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSourceImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !sourceImage) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await generateImage({
        prompt: prompt.trim(),
        image: sourceImage,
        size: defaultImageSize,
        negativePrompt: negativePrompt.trim() || undefined,
      });

      const imageUrl = response.data[0]?.url;
      if (imageUrl) {
        setResult(imageUrl);
        addToHistory({
          type: 'image-to-image',
          prompt: prompt.trim(),
          imageUrl,
          parameters: {
            size: defaultImageSize,
            ...(negativePrompt.trim() ? { negativePrompt: negativePrompt.trim() } : {}),
          },
        });
      } else {
        setError('未生成图片');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    const response = await fetch(result);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai编辑-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">图生图</h1>
      <p className="text-muted-foreground mb-6">上传参考图片，使用 AI 进行风格转换、局部优化或场景重塑</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>参数设置</CardTitle>
            <CardDescription>上传图片并描述编辑需求</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>参考图片</Label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-dashed"
              >
                {sourceImage ? (
                  <img src={sourceImage} alt="参考图片" className="max-h-full rounded" />
                ) : (
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <span className="text-muted-foreground">点击上传图片</span>
                  </div>
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>编辑提示词 <span className="text-muted-foreground text-xs">（说明要改变什么和保留什么）</span></Label>
              <Textarea
                placeholder="例如：将场景转换为雨夜赛博朋克风格，添加霓虹灯反射，同时保留原始构图和主体布局"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>负面提示词 <span className="text-muted-foreground text-xs">（可选）</span></Label>
              <Textarea
                placeholder="例如：模糊, 变形, 低质量"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>输出尺寸</Label>
              <select
                value={defaultImageSize}
                onChange={(e) => setImageSize(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                {sizeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim() || !sourceImage}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                '生成图片'
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
                <img
                  src={result}
                  alt="编辑后的图片"
                  className="w-full rounded-lg border"
                />
                <Button variant="outline" onClick={handleDownload} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  下载图片
                </Button>
              </div>
            ) : (
              <div className="aspect-square flex items-center justify-center border rounded-lg bg-muted/50">
                <p className="text-muted-foreground">编辑后的图片将显示在这里</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
