'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-5 w-5" />;
      case 'dark':
        return <Moon className="h-5 w-5" />;
      case 'system':
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light mode';
      case 'dark':
        return 'Dark mode';
      case 'system':
        return 'System theme';
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className="inline-flex items-center justify-center rounded-md p-2 text-mariners-silver hover:bg-mariners-navy/10 hover:text-mariners-navy dark:hover:bg-white/10 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-mariners-teal focus:ring-offset-2 dark:focus:ring-offset-mariners-navy"
      aria-label={`Current theme: ${getLabel()}. Click to change.`}
      title={getLabel()}
    >
      {getIcon()}
    </button>
  );
}
