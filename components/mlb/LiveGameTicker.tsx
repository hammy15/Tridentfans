'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { getMarinersSchedule, getTodaysGames, getTeamLogo, type Game } from '@/lib/mlb-api';

export function LiveGameTicker() {
  const [todaysGame, setTodaysGame] = useState<Game | null>(null);
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGameData() {
      try {
        const [todayGames, upcoming] = await Promise.all([
          getTodaysGames(),
          getMarinersSchedule(7)
        ]);

        setTodaysGame(todayGames[0] || null);
        setUpcomingGames(upcoming.slice(todayGames.length > 0 ? 1 : 0, 4));
      } catch (error) {
        console.error('Failed to fetch game data:', error);
      }
      setLoading(false);
    }

    fetchGameData();
    
    // Update every 30 seconds during games, every 5 minutes otherwise
    const interval = setInterval(fetchGameData, todaysGame ? 30000 : 300000);
    return () => clearInterval(interval);
  }, [todaysGame]);

  const formatGameTime = (gameDate: string) => {
    const date = new Date(gameDate);
    return {
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        timeZoneName: 'short'
      }),
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    };
  };

  const getGameStatus = (game: Game) => {
    const status = game.status.detailedState;
    const code = game.status.statusCode;
    
    if (code === 'F') return { text: 'Final', color: 'bg-gray-500' };
    if (code === 'I' || code === 'IR') return { text: 'Live', color: 'bg-red-500 animate-pulse' };
    if (code === 'S') return { text: 'Scheduled', color: 'bg-mariners-teal' };
    if (code === 'P') return { text: 'Pregame', color: 'bg-yellow-500' };
    return { text: status, color: 'bg-gray-400' };
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-mariners-navy to-mariners-teal text-white">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Game - If Active */}
      {todaysGame && (
        <Card className="bg-gradient-to-r from-mariners-navy to-mariners-teal text-white overflow-hidden relative">
          <div className="absolute right-4 top-4 text-6xl opacity-20">⚾</div>
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {todaysGame.gameType === 'S' ? 'Spring Training' : 'Today\'s Game'}
              </CardTitle>
              <Badge className={`${getGameStatus(todaysGame).color} text-white`}>
                {getGameStatus(todaysGame).text}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center justify-center space-x-8">
              {/* Away Team */}
              <div className="text-center">
                <img 
                  src={getTeamLogo(todaysGame.teams.away.team.id)} 
                  alt={todaysGame.teams.away.team.name}
                  className="w-16 h-16 mx-auto mb-2"
                />
                <div className="text-lg font-bold">{todaysGame.teams.away.team.abbreviation}</div>
                {todaysGame.teams.away.score !== undefined && (
                  <div className="text-3xl font-bold">{todaysGame.teams.away.score}</div>
                )}
              </div>

              {/* VS */}
              <div className="text-center">
                <div className="text-2xl font-bold">@</div>
              </div>

              {/* Home Team */}
              <div className="text-center">
                <img 
                  src={getTeamLogo(todaysGame.teams.home.team.id)} 
                  alt={todaysGame.teams.home.team.name}
                  className="w-16 h-16 mx-auto mb-2"
                />
                <div className="text-lg font-bold">{todaysGame.teams.home.team.abbreviation}</div>
                {todaysGame.teams.home.score !== undefined && (
                  <div className="text-3xl font-bold">{todaysGame.teams.home.score}</div>
                )}
              </div>
            </div>
            
            <div className="text-center mt-4 text-sm opacity-90">
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {todaysGame.venue.name}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatGameTime(todaysGame.gameDate).time}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Games */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-mariners-teal" />
            Upcoming Games
          </CardTitle>
          <CardDescription>Next Mariners games</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingGames.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No upcoming games scheduled</p>
                <p className="text-sm mt-2">Check back for spring training updates!</p>
              </div>
            ) : (
              upcomingGames.map((game) => {
                const gameTime = formatGameTime(game.gameDate);
                const isHome = game.teams.home.team.id === 136; // Mariners team ID
                const opponent = isHome ? game.teams.away.team : game.teams.home.team;
                
                return (
                  <div
                    key={game.gamePk}
                    className="flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-4">
                      <img 
                        src={getTeamLogo(opponent.id)} 
                        alt={opponent.name}
                        className="w-12 h-12"
                      />
                      <div>
                        <div className="font-semibold">
                          {isHome ? 'vs' : '@'} {opponent.name}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>{gameTime.date}</span>
                          <span>•</span>
                          <span>{gameTime.time}</span>
                          {game.gameType === 'S' && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs">
                                Spring Training
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right text-sm text-muted-foreground">
                      <div>{game.venue.name}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}