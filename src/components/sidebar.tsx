'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Image, Video, Settings, History, Scissors } from 'lucide-react';

const navItems = [
  { href: '/image/generate', label: '文生图', icon: Image },
  { href: '/image/edit', label: '图生图', icon: Image },
  { href: '/video/generate', label: '文生视频', icon: Video },
  { href: '/video/image-to-video', label: '图生视频', icon: Video },
  { href: '/video/stitch', label: '视频拼接', icon: Scissors },
];

const bottomItems = [
  { href: '/history', label: '历史记录', icon: History },
  { href: '/settings', label: '设置', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-card flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">AI生成图片和视频</h1>
        <p className="text-sm text-muted-foreground">图片与视频生成</p>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
