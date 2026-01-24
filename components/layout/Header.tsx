'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Trophy, MessageSquare, Newspaper, Users, Settings, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Predictions', href: '/predictions', icon: Trophy },
  { name: 'Forum', href: '/forum', icon: MessageSquare },
  { name: 'News', href: '/news', icon: Newspaper },
  { name: 'Roster', href: '/roster', icon: Users },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-mariners-navy text-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mariners-teal text-xl">
            🔱
          </div>
          <span className="text-xl font-bold tracking-tight">TridentFans</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navigation.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-mariners-teal text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right side - Admin & Auth */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className={cn(
              'hidden md:flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === '/admin'
                ? 'bg-mariners-teal text-white'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            )}
          >
            <Settings className="h-4 w-4" />
            Admin
          </Link>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-white/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10">
          <nav className="container mx-auto px-4 py-4 space-y-1">
            {navigation.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-mariners-teal text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === '/admin'
                  ? 'bg-mariners-teal text-white'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              )}
            >
              <Settings className="h-4 w-4" />
              Admin
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
