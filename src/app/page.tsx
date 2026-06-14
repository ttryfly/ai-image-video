import Link from 'next/link';
import { Image, Video, Scissors, Sparkles } from 'lucide-react';

const features = [
  {
    title: '文生图',
    description: '通过文字描述生成图片',
    href: '/image/generate',
    icon: Image,
  },
  {
    title: '图生图',
    description: '基于参考图编辑和转换图片',
    href: '/image/edit',
    icon: Sparkles,
  },
  {
    title: '文生视频',
    description: '通过文字描述生成视频',
    href: '/video/generate',
    icon: Video,
  },
  {
    title: '图生视频',
    description: '让静态图片动起来',
    href: '/video/image-to-video',
    icon: Video,
  },
  {
    title: '视频拼接',
    description: '将多个片段拼接成更长的视频',
    href: '/video/stitch',
    icon: Scissors,
  },
];

export default function HomePage() {
  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">AI生成图片和视频</h1>
        <p className="text-muted-foreground text-lg mb-8">
          使用 AI 生成图片和视频。自定义参数，支持视频拼接延长。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.href}
                href={feature.href}
                className="group p-6 rounded-lg border bg-card hover:bg-accent transition-colors"
              >
                <Icon className="h-8 w-8 mb-3 text-primary group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 p-4 rounded-lg bg-muted/50">
          <h2 className="font-semibold mb-2">快速开始</h2>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>前往 <Link href="/settings" className="text-primary hover:underline">设置</Link> 添加你的 Agnes API Key</li>
            <li>从侧边栏或上方卡片选择一个功能</li>
            <li>输入提示词并调整参数</li>
            <li>点击生成按钮创建图片或视频</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
