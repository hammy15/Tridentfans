'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Target, Calendar, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface PredictionCategory {
  id: string;
  name: string;
  description: string;
  type: string;
  points_base: number;
  difficulty_tier: string;
  options: string[];
}

interface PredictionGame {
  id: string;
  title: string;
  description: string;
  game_date: string;
  game_time: string;
  status: string;
  categories: PredictionCategory[];
}

interface UserPrediction {
  category_id: string;
  prediction_value: string;
}

export function SpringPredictionMarkets() {
  const [games, setGames] = useState<PredictionGame[]>([]);
  const [categories, setCategories] = useState<PredictionCategory[]>([]);
  const [userPredictions, setUserPredictions] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch prediction categories
      const categoriesRes = await fetch('/api/predictions/categories');
      if (!categoriesRes.ok) throw new Error('Failed to fetch categories');
      const categoriesData = await categoriesRes.json();
      
      // Fetch upcoming games  
      const gamesRes = await fetch('/api/predictions?type=games');
      if (!gamesRes.ok) throw new Error('Failed to fetch games');
      const gamesData = await gamesRes.json();
      
      setCategories(categoriesData.categories || []);
      setGames(gamesData.games || []);
      
    } catch (err) {
      console.error('Failed to fetch prediction data:', err);
      setError('Failed to load prediction markets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrediction = async (categoryId: string, gameId: string, value: string) => {
    const key = `${gameId}-${categoryId}`;
    
    try {
      setSubmitting(prev => ({ ...prev, [key]: true }));
      
      // For now, we'll store locally since user auth isn't implemented
      setUserPredictions(prev => ({
        ...prev,
        [key]: value
      }));
      
      // TODO: Send to API when user auth is implemented
      /*
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'temp-user', // Replace with actual user ID
          gameId: gameId,
          predictions: {
            [categoryId]: value
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit prediction');
      }
      */
      
    } catch (err) {
      console.error('Failed to submit prediction:', err);
      // Revert the prediction on error
      setUserPredictions(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    } finally {
      setSubmitting(prev => ({ ...prev, [key]: false }));
    }
  };

  const getDifficultyColor = (tier: string) => {
    switch (tier) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-orange-500';
      case 'expert': return 'bg-red-500';
      case 'bonus': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyLabel = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-white to-gray-50">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-mariners-teal" />
            <p className="text-muted-foreground">Loading prediction markets...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-white to-gray-50">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (games.length === 0 && categories.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-white to-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Target className="h-6 w-6 text-mariners-teal" />
            Prediction Markets Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-mariners-teal opacity-50" />
            <p className="text-muted-foreground mb-4">
              Prediction markets will be available when spring training games begin.
            </p>
            <p className="text-sm text-muted-foreground">
              Check back soon for opportunities to test your Mariners knowledge!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Target className="h-6 w-6 text-mariners-teal" />
          Test Your Mariners Knowledge
        </CardTitle>
        <CardDescription className="text-base">
          Make predictions and compete with the community
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Show general prediction categories if no specific games */}
        {games.length === 0 && categories.length > 0 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-mariners-navy mb-2">
                Prediction Categories
              </h3>
              <p className="text-sm text-muted-foreground">
                These prediction types will be available for upcoming games
              </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {categories.slice(0, 8).map((category) => (
                <div key={category.id} className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <Badge 
                      className={`${getDifficultyColor(category.difficulty_tier)} text-white text-xs`}
                    >
                      {getDifficultyLabel(category.difficulty_tier)} • {category.points_base} pts
                    </Badge>
                  </div>
                  
                  <h4 className="font-semibold text-mariners-navy mb-2">
                    {category.name}
                  </h4>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {category.description}
                  </p>
                  
                  {category.options && category.options.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Options: {category.options.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show actual games with predictions */}
        {games.length > 0 && (
          <div className="space-y-6">
            {games.map((game) => {
              const gameDate = new Date(`${game.game_date}T${game.game_time}`);
              const isLocked = new Date() >= gameDate;
              
              return (
                <div key={game.id} className="rounded-xl border bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-mariners-navy mb-1">
                        {game.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {game.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {gameDate.toLocaleDateString()} at {gameDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    
                    <Badge variant={isLocked ? 'secondary' : 'default'}>
                      {isLocked ? 'Locked' : 'Open'}
                    </Badge>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    {game.categories && game.categories.map((category) => {
                      const key = `${game.id}-${category.id}`;
                      const userPrediction = userPredictions[key];
                      const isSubmitting = submitting[key];
                      
                      return (
                        <div key={category.id} className="rounded-lg border p-4">
                          <div className="flex items-start justify-between mb-3">
                            <Badge 
                              className={`${getDifficultyColor(category.difficulty_tier)} text-white text-xs`}
                            >
                              {category.points_base} pts
                            </Badge>
                          </div>
                          
                          <h4 className="font-medium text-sm mb-2">
                            {category.name}
                          </h4>
                          
                          {category.options && category.options.length > 0 ? (
                            <div className="space-y-2">
                              {category.options.map((option) => (
                                <button
                                  key={option}
                                  onClick={() => handlePrediction(category.id, game.id, option)}
                                  disabled={isLocked || isSubmitting}
                                  className={`w-full rounded p-2 text-left text-sm transition-all ${
                                    userPrediction === option
                                      ? 'bg-mariners-teal text-white'
                                      : 'bg-gray-100 hover:bg-gray-200'
                                  } ${
                                    isLocked || isSubmitting 
                                      ? 'opacity-50 cursor-not-allowed' 
                                      : 'cursor-pointer'
                                  }`}
                                >
                                  {isSubmitting && userPrediction === option ? (
                                    <div className="flex items-center gap-2">
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      {option}
                                    </div>
                                  ) : (
                                    option
                                  )}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              Prediction input will be available
                            </div>
                          )}
                          
                          {userPrediction && (
                            <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
                              ✅ Predicted: {userPrediction}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="mt-8 text-center">
          <Link href="/predictions">
            <Button size="lg" className="bg-mariners-navy hover:bg-mariners-navy/90">
              <Trophy className="mr-2 h-5 w-5" />
              View Full Prediction Center
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}