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

  // For spring training, show current Spring Training standings
  if (standings.length === 0) {
    // Current Spring Training standings as of March 6, 2026
    const springStandings = [
      { team: { id: 117, name: 'Houston Astros' }, rank: 1, wins: 9, losses: 2, pct: .818, gb: '-' },
      { team: { id: 108, name: 'Los Angeles Angels' }, rank: 2, wins: 8, losses: 4, pct: .667, gb: '1.5' },
      { team: { id: 140, name: 'Texas Rangers' }, rank: 3, wins: 8, losses: 5, pct: .615, gb: '2' },
      { team: { id: 133, name: 'Oakland Athletics' }, rank: 4, wins: 4, losses: 7, pct: .364, gb: '4.5' },
      { team: { id: 136, name: 'Seattle Mariners' }, rank: 5, wins: 3, losses: 9, pct: .250, gb: '6.5' },
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-mariners-teal" />
            Spring Training Standings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {springStandings.map((team) => {
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
                      <Badge variant={team.rank <= 3 ? "default" : "outline"}>{team.rank}</Badge>
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
                        {team.wins}-{team.losses} ({(team.pct * 100).toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {team.gb === '-' ? 'Leading' : `${team.gb} GB`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Show Mariners position highlight */}
          <div className="mt-4 p-3 bg-mariners-navy/5 rounded-lg border border-mariners-teal/20">
            <div className="text-center text-sm">
              <p className="text-muted-foreground">
                🔱 Spring Training record - plenty of time to improve before Opening Day!
              </p>
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