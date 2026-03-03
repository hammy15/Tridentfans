'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp } from 'lucide-react';
import { getALWestStandings, getTeamLogo, type Standing } from '@/lib/mlb-api';

export function ALWestStandings() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStandings() {
      try {
        const data = await getALWestStandings();
        setStandings(data);
      } catch (error) {
        console.error('Failed to fetch standings:', error);
      }
      setLoading(false);
    }

    fetchStandings();
    
    // Update standings every 5 minutes
    const interval = setInterval(fetchStandings, 300000);
    return () => clearInterval(interval);
  }, []);

  const getPositionColor = (rank: string) => {
    switch (rank) {
      case '1': return 'text-yellow-600 font-bold';
      case '2': return 'text-gray-600 font-semibold';
      case '3': return 'text-amber-700 font-semibold';
      default: return 'text-muted-foreground';
    }
  };

  const getPositionBadge = (rank: string) => {
    if (rank === '1') {
      return <Badge className="bg-yellow-500 text-white"><Trophy className="h-3 w-3 mr-1" />1st</Badge>;
    }
    return <Badge variant="outline">{rank}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-mariners-teal" />
            AL West Standings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-mariners-teal"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For spring training, show placeholder standings with encouraging message
  if (standings.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-mariners-navy to-mariners-teal text-white">
        <CardHeader>
          <CardTitle className="text-white">2026 AL West</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-6xl opacity-20">🏆</div>
            <div>
              <p className="text-lg font-semibold">Spring Training 2026</p>
              <p className="text-white/90 mt-2">
                Regular season standings will appear here when the season begins.
              </p>
              <p className="text-white/80 text-sm mt-3">
                This is our year. Again. But maybe this time...
              </p>
            </div>
            
            {/* Show projected/hopeful standings */}
            <div className="space-y-2 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white/90">2026 Projections</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Seattle Mariners</span>
                  <span className="font-semibold">1st Place Goal</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Houston Astros</span>
                  <span>Defending Champions</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Texas Rangers</span>
                  <span>World Series Champs</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Los Angeles Angels</span>
                  <span>Trout & Ohtani Era</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Oakland Athletics</span>
                  <span>Rebuilding</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-mariners-teal" />
          AL West Standings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {standings.map((team, index) => {
            const isMarinersTeam = team.team.id === 136;
            
            return (
              <div
                key={team.team.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  isMarinersTeam 
                    ? 'bg-mariners-teal/10 border border-mariners-teal/20' 
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getPositionBadge(team.divisionRank)}
                    <img 
                      src={getTeamLogo(team.team.id)} 
                      alt={team.team.name}
                      className="w-8 h-8"
                    />
                  </div>
                  <div>
                    <div className={`font-semibold ${isMarinersTeam ? 'text-mariners-navy' : ''}`}>
                      {team.team.name.replace('Seattle ', '').replace('Los Angeles ', '').replace('Houston ', '').replace('Texas ', '').replace('Oakland ', '')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {team.wins}-{team.losses} ({(team.winPercentage * 100).toFixed(1)}%)
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm font-semibold ${getPositionColor(team.divisionRank)}`}>
                    {team.gamesBack === '-' ? 'Leading' : `${team.gamesBack} GB`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Show Mariners position highlight */}
        {standings.length > 0 && (
          <div className="mt-4 p-3 bg-mariners-navy/5 rounded-lg border border-mariners-teal/20">
            <div className="text-center text-sm">
              {(() => {
                const marinersStanding = standings.find(team => team.team.id === 136);
                if (!marinersStanding) return null;
                
                const rank = parseInt(marinersStanding.divisionRank);
                if (rank === 1) {
                  return (
                    <p className="text-mariners-navy font-semibold">
                      🔱 Mariners leading the AL West! Keep the momentum going!
                    </p>
                  );
                } else if (rank <= 3) {
                  return (
                    <p className="text-mariners-navy">
                      🔱 Mariners in playoff contention - every game counts!
                    </p>
                  );
                } else {
                  return (
                    <p className="text-muted-foreground">
                      🔱 Long season ahead - plenty of time to climb the standings!
                    </p>
                  );
                }
              })()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}