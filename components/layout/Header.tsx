'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Trophy,
  MessageSquare,
  MessageCircle,
  Newspaper,
  Users,
  Settings,
  Menu,
  X,
  LogIn,
  User,
  LogOut,
  Heart,
  Swords,
  Medal,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LiveScoreTicker } from '@/components/scores/LiveScoreTicker';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Chat', href: '/bots', icon: MessageCircle },
  { name: 'Predictions', href: '/predictions', icon: Trophy },
  { name: 'Tournaments', href: '/tournaments', icon: Award },
  { name: 'Challenges', href: '/challenges', icon: Swords },
  { name: 'Leaderboard', href: '/leaderboard', icon: Medal },
  { name: 'Forum', href: '/forum', icon: MessageSquare },
  { name: 'News', href: '/news', icon: Newspaper },
  { name: 'Roster', href: '/roster', icon: Users },
  { name: 'Donate', href: '/donate', icon: Heart },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Live Score Ticker */}
      <LiveScoreTicker />

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
            {profile?.role === 'admin' && (
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
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications - only for logged in users */}
            {!loading && user && <NotificationBell />}

            {/* Auth Section */}
            {!loading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="hidden md:flex items-center gap-2 text-white hover:bg-white/10"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mariners-teal text-sm font-bold">
                          {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                        </div>
                        <span className="max-w-[100px] truncate">
                          {profile?.username || user.email?.split('@')[0]}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          My Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/predictions?tab=my" className="flex items-center gap-2">
                          <Trophy className="h-4 w-4" />
                          My Predictions
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="flex items-center gap-2 text-red-600"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link href="/auth/login">
                    <Button
                      variant="ghost"
                      className="hidden md:flex items-center gap-2 text-white hover:bg-white/10"
                    >
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </Button>
                  </Link>
                )}
              </>
            )}

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

              {profile?.role === 'admin' && (
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
              )}

              {/* Theme Toggle in Mobile Menu */}
              <div className="border-t border-white/10 pt-2 mt-2">
                <div className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-white/80">
                  <span>Theme</span>
                  <ThemeToggle />
                </div>
              </div>

              <div className="border-t border-white/10 pt-2 mt-2">
                {user ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      <User className="h-4 w-4" />
                      My Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-400 hover:bg-white/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
