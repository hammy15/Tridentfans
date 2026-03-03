'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Bot,
  Trophy,
  MessageSquare,
  BarChart2,
  History,
  Users,
  Mail,
  Bell,
  UserCircle,
  Settings,
  Menu,
  X,
  ChevronLeft,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export type AdminSection =
  | 'dashboard'
  | 'bots'
  | 'predictions'
  | 'forum'
  | 'polls'
  | 'history'
  | 'prospects'
  | 'reddit'
  | 'email'
  | 'notifications'
  | 'players'
  | 'settings';

interface NavItem {
  id: AdminSection;
  label: string;
  icon: typeof LayoutDashboard;
  description?: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview stats' },
  { id: 'bots', label: 'Bots', icon: Bot, description: 'AI bot configuration' },
  { id: 'predictions', label: 'Predictions', icon: Trophy, description: 'Manage prediction games' },
  { id: 'forum', label: 'Forum', icon: MessageSquare, description: 'Content moderation' },
  { id: 'polls', label: 'Polls', icon: BarChart2, description: 'Community polls' },
  { id: 'history', label: 'History', icon: History, description: 'Mariners history data' },
  { id: 'prospects', label: 'Prospects', icon: Users, description: 'Prospect tracker' },
  { id: 'reddit', label: 'Reddit', icon: ExternalLink, description: 'Reddit engagement tracking' },
  { id: 'email', label: 'Email', icon: Mail, description: 'Email templates & campaigns' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Push & in-app alerts' },
  { id: 'players', label: 'Players', icon: UserCircle, description: 'Player comparison tool' },
  { id: 'settings', label: 'Settings', icon: Settings, description: 'Site configuration' },
];

interface AdminLayoutProps {
  children: ReactNode;
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
}

export function AdminLayout({
  children,
  activeSection,
  onSectionChange,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-mariners-navy text-white h-14 flex items-center justify-between px-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-mariners-teal" />
            <span className="font-semibold">Admin Panel</span>
          </div>
        </div>
        <Link href="/" className="text-sm text-white/70 hover:text-white">
          Back to Site
        </Link>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-mariners-navy text-white transition-all duration-300',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'lg:w-16' : 'lg:w-64',
          'w-64 lg:mt-0 mt-14'
        )}
      >
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between h-14 px-4 border-b border-white/10">
          <div className={cn('flex items-center gap-2', collapsed && 'justify-center w-full')}>
            <Shield className="h-6 w-6 text-mariners-teal shrink-0" />
            {!collapsed && <span className="font-bold text-lg">Admin</span>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn('text-white/70 hover:bg-white/10 hover:text-white', collapsed && 'hidden')}
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div className="hidden lg:flex justify-center py-2 border-b border-white/10">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => setCollapsed(false)}
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              const Icon = item.icon;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onSectionChange(item.id);
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left',
                      isActive
                        ? 'bg-mariners-teal text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white',
                      collapsed && 'justify-center px-2'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-white')} />
                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{item.label}</span>
                        {item.description && (
                          <p className="text-xs text-white/50 truncate">{item.description}</p>
                        )}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className={cn('p-4 border-t border-white/10', collapsed && 'px-2')}>
          <Link
            href="/"
            className={cn(
              'flex items-center gap-2 text-white/70 hover:text-white transition-colors',
              collapsed && 'justify-center'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            {!collapsed && <span className="text-sm">Back to Site</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'transition-all duration-300 min-h-screen',
          'pt-14 lg:pt-0', // Account for mobile header
          collapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        {/* Desktop Header Bar */}
        <div className="hidden lg:flex items-center justify-between h-14 bg-white dark:bg-background border-b px-6">
          <div>
            <h1 className="text-lg font-semibold">
              {navItems.find((item) => item.id === activeSection)?.label || 'Admin'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {navItems.find((item) => item.id === activeSection)?.description}
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">
              View Site
            </Button>
          </Link>
        </div>

        {/* Page Content */}
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

// Placeholder components for new admin sections
export function AdminPlaceholder({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: typeof LayoutDashboard;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md">{description}</p>
      <p className="text-sm text-muted-foreground mt-4">
        This section is coming soon. Check back later!
      </p>
    </div>
  );
}
