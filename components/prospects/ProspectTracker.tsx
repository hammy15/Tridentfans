'use client';

import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProspectCard } from './ProspectCard';
import { ProspectProfile } from './ProspectProfile';
import type { Prospect, ProspectLevel, ProspectUpdate } from '@/types';
import { Search, Filter, Loader2, Users, Grid3X3, List, SortAsc } from 'lucide-react';

interface ProspectTrackerProps {
  initialProspects?: Prospect[];
  showFilters?: boolean;
}

const levels: ProspectLevel[] = ['AAA', 'AA', 'A+', 'A', 'Rookie', 'DSL'];

const positions = [
  'All',
  'P',
  'C',
  '1B',
  '2B',
  '3B',
  'SS',
  'LF',
  'CF',
  'RF',
  'OF',
  'IF',
  'DH',
];

type SortOption = 'ranking' | 'name' | 'age' | 'eta';

export function ProspectTracker({
  initialProspects,
  showFilters = true,
}: ProspectTrackerProps) {
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects || []);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [prospectUpdates, setProspectUpdates] = useState<ProspectUpdate[]>([]);
  const [loading, setLoading] = useState(!initialProspects);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('ranking');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeLevel, setActiveLevel] = useState<ProspectLevel | 'All'>('All');

  // Fetch prospects
  useEffect(() => {
    if (!initialProspects) {
      fetchProspects();
    }
  }, [initialProspects]);

  async function fetchProspects() {
    setLoading(true);
    try {
      const res = await fetch('/api/prospects');
      const data = await res.json();
      if (data.prospects) {
        setProspects(data.prospects);
      }
    } catch (error) {
      console.error('Failed to fetch prospects:', error);
    }
    setLoading(false);
  }

  // Filter and sort prospects
  const filteredProspects = useMemo(() => {
    let result = [...prospects];

    // Filter by level
    if (activeLevel !== 'All') {
      result = result.filter((p) => p.level === activeLevel);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.team_name.toLowerCase().includes(query) ||
          p.position.toLowerCase().includes(query)
      );
    }

    // Filter by position
    if (positionFilter !== 'All') {
      result = result.filter((p) => {
        if (positionFilter === 'P') {
          return ['P', 'RHP', 'LHP'].includes(p.position);
        }
        if (positionFilter === 'OF') {
          return ['LF', 'CF', 'RF', 'OF'].includes(p.position);
        }
        if (positionFilter === 'IF') {
          return ['1B', '2B', '3B', 'SS', 'IF'].includes(p.position);
        }
        return p.position === positionFilter;
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'ranking':
          return (a.ranking || 999) - (b.ranking || 999);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'age':
          return a.age - b.age;
        case 'eta': {
          const etaA = a.eta ? parseInt(a.eta) : 9999;
          const etaB = b.eta ? parseInt(b.eta) : 9999;
          return etaA - etaB;
        }
        default:
          return 0;
      }
    });

    return result;
  }, [prospects, activeLevel, searchQuery, positionFilter, sortBy]);

  // Group by level for tab counts
  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { All: prospects.length };
    levels.forEach((level) => {
      counts[level] = prospects.filter((p) => p.level === level).length;
    });
    return counts;
  }, [prospects]);

  // Handle prospect click
  const handleProspectClick = async (prospect: Prospect) => {
    setSelectedProspect(prospect);
    // Fetch updates for this prospect
    try {
      const res = await fetch(`/api/prospects?id=${prospect.id}&updates=true`);
      const data = await res.json();
      if (data.updates) {
        setProspectUpdates(data.updates);
      }
    } catch (error) {
      console.error('Failed to fetch prospect updates:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-mariners-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search prospects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Position Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos === 'All' ? 'All Positions' : pos}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SortAsc className="w-4 h-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="ranking">By Ranking</option>
              <option value="name">By Name</option>
              <option value="age">By Age</option>
              <option value="eta">By ETA</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Level Tabs */}
      <Tabs
        value={activeLevel}
        onValueChange={(v) => setActiveLevel(v as ProspectLevel | 'All')}
      >
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="All" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            All
            <Badge variant="secondary" className="ml-1">
              {levelCounts.All}
            </Badge>
          </TabsTrigger>
          {levels.map((level) => (
            <TabsTrigger key={level} value={level} className="flex items-center gap-1">
              {level}
              <Badge variant="secondary" className="ml-1">
                {levelCounts[level]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Content - Same for all tabs since we filter in useMemo */}
        <TabsContent value={activeLevel} className="mt-6">
          {filteredProspects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No prospects found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProspects.map((prospect) => (
                <ProspectCard
                  key={prospect.id}
                  prospect={prospect}
                  onClick={() => handleProspectClick(prospect)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProspects.map((prospect) => (
                <div
                  key={prospect.id}
                  className="flex items-center gap-4 p-4 bg-card rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleProspectClick(prospect)}
                >
                  {prospect.ranking && (
                    <div className="w-8 h-8 rounded-full bg-mariners-gold text-mariners-navy flex items-center justify-center font-bold text-sm">
                      #{prospect.ranking}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{prospect.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {prospect.team_name}
                    </p>
                  </div>
                  <Badge>{prospect.position}</Badge>
                  <Badge variant="outline">{prospect.level}</Badge>
                  {prospect.eta && (
                    <span className="text-sm text-muted-foreground hidden sm:block">
                      ETA: {prospect.eta}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Add empty TabsContent for other levels to prevent React warnings */}
        {['All', ...levels]
          .filter((l) => l !== activeLevel)
          .map((level) => (
            <TabsContent key={level} value={level} />
          ))}
      </Tabs>

      {/* Prospect Profile Modal */}
      {selectedProspect && (
        <ProspectProfile
          prospect={selectedProspect}
          updates={prospectUpdates}
          onClose={() => {
            setSelectedProspect(null);
            setProspectUpdates([]);
          }}
        />
      )}
    </div>
  );
}
