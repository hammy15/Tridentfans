'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { PlayerSearchResult } from '@/lib/player-stats';

interface PlayerSearchProps {
  onSelect: (player: PlayerSearchResult) => void;
  placeholder?: string;
  selectedPlayer?: PlayerSearchResult | null;
  className?: string;
  focusOnMarinersPlayers?: boolean;
}

const RECENT_SEARCHES_KEY = 'tridentfans-recent-player-searches';
const MAX_RECENT_SEARCHES = 5;

function getRecentSearches(): PlayerSearchResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(player: PlayerSearchResult): void {
  if (typeof window === 'undefined') return;
  try {
    const recent = getRecentSearches();
    // Remove if already exists
    const filtered = recent.filter((p) => p.id !== player.id);
    // Add to front
    const updated = [player, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

export function PlayerSearch({
  onSelect,
  placeholder = 'Search for a player...',
  selectedPlayer,
  className,
  focusOnMarinersPlayers = true,
}: PlayerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<PlayerSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search function
  const searchPlayers = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/players?search=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.players || []);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchPlayers(query);
      }, 300);
    } else {
      setResults([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchPlayers]);

  // Handle selection
  const handleSelect = (player: PlayerSearchResult) => {
    onSelect(player);
    saveRecentSearch(player);
    setRecentSearches(getRecentSearches());
    setQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = query.length >= 2 ? results : recentSearches;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0 && items[highlightedIndex]) {
      e.preventDefault();
      handleSelect(items[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const displayItems = query.length >= 2 ? results : recentSearches;
  const showDropdown = isOpen && (displayItems.length > 0 || isLoading);

  return (
    <div className={cn('relative', className)}>
      {/* Selected Player Display */}
      {selectedPlayer && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg mb-2">
          {/* Player Photo */}
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
            <img
              src={`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${selectedPlayer.id}/headshot/67/current`}
              alt={selectedPlayer.fullName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/generic/headshot/67/current';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{selectedPlayer.fullName}</p>
            <p className="text-sm text-muted-foreground">
              {selectedPlayer.currentTeam?.abbreviation || selectedPlayer.currentTeam?.name || 'Free Agent'}{' '}
              - {selectedPlayer.primaryPosition?.abbreviation || 'N/A'}
            </p>
          </div>
          <button
            onClick={() => onSelect(null as unknown as PlayerSearchResult)}
            className="p-1 hover:bg-muted rounded-full transition-colors"
            aria-label="Clear selection"
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Search Input */}
      {!selectedPlayer && (
        <>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
                setHighlightedIndex(-1);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="pl-10 pr-4"
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto"
            >
              {query.length < 2 && recentSearches.length > 0 && (
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                  Recent Searches
                </div>
              )}

              {displayItems.map((player, index) => {
                const isMariners = player.currentTeam?.id === 136;
                return (
                  <button
                    key={player.id}
                    onClick={() => handleSelect(player)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                      highlightedIndex === index
                        ? 'bg-muted'
                        : 'hover:bg-muted/50',
                      isMariners && focusOnMarinersPlayers && 'bg-mariners-navy/5'
                    )}
                  >
                    {/* Player Photo */}
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${player.id}/headshot/67/current`}
                        alt={player.fullName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/generic/headshot/67/current';
                        }}
                      />
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {player.fullName}
                        {isMariners && (
                          <span className="ml-2 text-xs text-mariners-teal font-semibold">SEA</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {!isMariners && (player.currentTeam?.abbreviation || player.currentTeam?.name || 'Free Agent')}
                        {!isMariners && ' - '}
                        {player.primaryPosition?.abbreviation || player.primaryPosition?.name || 'N/A'}
                        {player.primaryNumber && ` #${player.primaryNumber}`}
                      </p>
                    </div>
                  </button>
                );
              })}

              {isLoading && displayItems.length === 0 && (
                <div className="px-3 py-4 text-center text-muted-foreground">
                  Searching...
                </div>
              )}

              {!isLoading && query.length >= 2 && displayItems.length === 0 && (
                <div className="px-3 py-4 text-center text-muted-foreground">
                  No players found for &quot;{query}&quot;
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
