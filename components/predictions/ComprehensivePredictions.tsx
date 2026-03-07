'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  Target,
  Flame,
  Brain,
  Zap,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Gift,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PredictionCategory {
  id: string;
  name: string;
  description: string;
  type: 'exact_number' | 'range' | 'boolean' | 'choice' | 'player_pick';
  points_base: number;
  difficulty_tier: 'easy' | 'medium' | 'hard' | 'expert' | 'bonus';
  display_order: number;
  options: string[];
}

interface UserPrediction {
  category_id: string;
  prediction_value: string;
  prediction_data?: any;
}

interface AIPrediction {
  category_id: string;
  prediction_value: string;
  reasoning: string;
  confidence_level: number;
  points_earned: number;
  is_correct?: boolean;
}

interface Game {
  id: string;
  opponent: string;
  game_date: string;
  is_home: boolean;
  game_status: string;
}

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  total_points: number;
  accuracy_percentage: number;
  rank_position: number;
  subscription_tier: string;
}

interface ComprehensivePredictionsProps {
  game: Game;
}

export function ComprehensivePredictions({ game }: ComprehensivePredictionsProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<PredictionCategory[]>([]);
  const [userPredictions, setUserPredictions] = useState<Map<string, UserPrediction>>(new Map());
  const [aiPredictions, setAiPredictions] = useState<{
    mark: AIPrediction[];
    hammy: AIPrediction[];
    spartan: AIPrediction[];
  }>({ mark: [], hammy: [], spartan: [] });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('predictions');

  useEffect(() => {
    fetchPredictionData();
  }, [game.id, user?.id]);

  const fetchPredictionData = async () => {
    try {
      const params = new URLSearchParams({
        gameId: game.id,
        ...(user?.id && { userId: user.id }),
      });

      const response = await fetch(`/api/predictions/comprehensive?${params}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setCategories(data.categories);
      setAiPredictions(data.aiPredictions);
      setLeaderboard(data.leaderboard);

      // Convert user predictions to Map
      const predMap = new Map();
      data.userPredictions.forEach((pred: any) => {
        predMap.set(pred.category_id, pred);
      });
      setUserPredictions(predMap);

    } catch (error) {
      console.error('Error fetching prediction data:', error);
      toast.error('Failed to load prediction data');
    }
    setLoading(false);
  };

  const handlePredictionChange = (categoryId: string, value: string, data?: any) => {
    const newPredictions = new Map(userPredictions);
    newPredictions.set(categoryId, {
      category_id: categoryId,
      prediction_value: value,
      prediction_data: data,
    });
    setUserPredictions(newPredictions);
  };

  const submitPredictions = async () => {
    if (!user) {
      toast.error('Please sign in to make predictions');
      return;
    }

    setSubmitting(true);
    try {
      const predictions = Array.from(userPredictions.values()).map(pred => ({
        categoryId: pred.category_id,
        value: pred.prediction_value,
        data: pred.prediction_data,
      }));

      const response = await fetch('/api/predictions/comprehensive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          userId: user.id,
          predictions,
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      toast.success(`🎯 ${predictions.length} predictions saved!`);
      
      // Show affiliate opportunities based on predictions
      showAffiliateOpportunities();

    } catch (error: any) {
      console.error('Error submitting predictions:', error);
      toast.error(error.message || 'Failed to save predictions');
    }
    setSubmitting(false);
  };

  const showAffiliateOpportunities = () => {
    // Natural affiliate integration based on predictions
    const highConfidencePredictions = Array.from(userPredictions.values()).length;
    
    if (highConfidencePredictions >= 5) {
      toast.info('💰 Feeling confident? Check out DraftKings for real money betting!', {
        action: {
          label: 'See Odds',
          onClick: () => window.open('https://draftkings.com', '_blank')
        }
      });
    }
  };

  const getDifficultyColor = (tier: string) => {
    switch (tier) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-purple-100 text-purple-800';
      case 'bonus': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyIcon = (tier: string) => {
    switch (tier) {
      case 'easy': return <Target className="h-4 w-4" />;
      case 'medium': return <TrendingUp className="h-4 w-4" />;
      case 'hard': return <Brain className="h-4 w-4" />;
      case 'expert': return <Flame className="h-4 w-4" />;
      case 'bonus': return <Zap className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getPersonaEmoji = (persona: string) => {
    switch (persona) {
      case 'mark': return '⚓';
      case 'hammy': return '🧢';
      case 'spartan': return '⚔️';
      default: return '🤖';
    }
  };

  const renderPredictionInput = (category: PredictionCategory) => {
    const existingPrediction = userPredictions.get(category.id);
    const currentValue = existingPrediction?.prediction_value || '';

    switch (category.type) {
      case 'boolean':
        return (
          <Select
            value={currentValue}
            onValueChange={(value) => handlePredictionChange(category.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'choice':
        return (
          <Select
            value={currentValue}
            onValueChange={(value) => handlePredictionChange(category.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose..." />
            </SelectTrigger>
            <SelectContent>
              {category.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'exact_number':
        return (
          <Input
            type="number"
            placeholder="Enter number"
            value={currentValue}
            onChange={(e) => handlePredictionChange(category.id, e.target.value)}
            min="0"
            max="50"
          />
        );

      case 'player_pick':
        return (
          <Input
            placeholder="Enter player name"
            value={currentValue}
            onChange={(e) => handlePredictionChange(category.id, e.target.value)}
          />
        );

      default:
        return (
          <Input
            placeholder="Enter prediction"
            value={currentValue}
            onChange={(e) => handlePredictionChange(category.id, e.target.value)}
          />
        );
    }
  };

  const PredictionCard = ({ category }: { category: PredictionCategory }) => {
    const userPred = userPredictions.get(category.id);
    const markPred = aiPredictions.mark.find(p => p.category_id === category.id);
    const hammyPred = aiPredictions.hammy.find(p => p.category_id === category.id);
    const spartanPred = aiPredictions.spartan.find(p => p.category_id === category.id);

    return (
      <Card className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getDifficultyColor(category.difficulty_tier)}>
                  {getDifficultyIcon(category.difficulty_tier)}
                  {category.difficulty_tier}
                </Badge>
                <Badge variant="outline">
                  {category.points_base} pts
                </Badge>
              </div>
              <CardTitle className="text-lg leading-tight">{category.name}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Prediction Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Prediction:</label>
            {renderPredictionInput(category)}
            {userPred && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="h-3 w-3" />
                Saved
              </div>
            )}
          </div>

          {/* AI Predictions */}
          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground">Compete against:</p>
            
            {markPred && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span>⚓ Mark:</span>
                  <Badge variant="outline">{markPred.prediction_value}</Badge>
                </span>
                <Badge variant="secondary" className="text-xs">
                  {markPred.confidence_level}/10
                </Badge>
              </div>
            )}

            {hammyPred && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span>🧢 Hammy:</span>
                  <Badge variant="outline">{hammyPred.prediction_value}</Badge>
                </span>
                <Badge variant="secondary" className="text-xs">
                  {hammyPred.confidence_level}/10
                </Badge>
              </div>
            )}

            {spartanPred && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span>⚔️ Spartan:</span>
                  <Badge variant="outline">{spartanPred.prediction_value}</Badge>
                </span>
                <Badge variant="secondary" className="text-xs">
                  {spartanPred.confidence_level}/10
                </Badge>
              </div>
            )}
          </div>

          {/* Reasoning */}
          {markPred?.reasoning && (
            <div className="bg-muted/30 p-3 rounded-lg text-sm">
              <p className="font-medium text-mariners-teal mb-1">⚓ Mark&apos;s take:</p>
              <p className="text-muted-foreground">{markPred.reasoning}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mariners-teal mx-auto mb-4"></div>
          <p>Loading predictions...</p>
        </div>
      </div>
    );
  }

  const predictionsByTier = categories.reduce((acc, cat) => {
    if (!acc[cat.difficulty_tier]) acc[cat.difficulty_tier] = [];
    acc[cat.difficulty_tier].push(cat);
    return acc;
  }, {} as Record<string, PredictionCategory[]>);

  const completedPredictions = userPredictions.size;
  const totalPredictions = categories.length;
  const completionPercentage = totalPredictions > 0 ? (completedPredictions / totalPredictions) * 100 : 0;

  const gameStart = new Date(game.game_date);
  const now = new Date();
  const isLocked = now >= gameStart;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-mariners-teal" />
                Game Predictions
              </CardTitle>
              <CardDescription>
                Mariners vs {game.opponent} • {new Date(game.game_date).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="text-right">
              {!isLocked && (
                <Button
                  onClick={submitPredictions}
                  disabled={submitting || completedPredictions === 0 || !user}
                  className="mb-2"
                >
                  {submitting ? 'Saving...' : `Save ${completedPredictions} Predictions`}
                </Button>
              )}
              <div className="text-sm text-muted-foreground">
                {isLocked ? (
                  <div className="flex items-center gap-1 text-red-600">
                    <Clock className="h-4 w-4" />
                    Predictions Locked
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {completedPredictions} of {totalPredictions} complete
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Completion Progress</span>
              <span>{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Warning if not signed in */}
      {!user && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">Sign in to save predictions and compete on the leaderboard!</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="predictions">Make Predictions</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="support">Support Site</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-6">
          {/* Easy Predictions */}
          {predictionsByTier.easy && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Easy Predictions (10-15 points)
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {predictionsByTier.easy.map((category) => (
                  <PredictionCard key={category.id} category={category} />
                ))}
              </div>
            </div>
          )}

          {/* Medium Predictions */}
          {predictionsByTier.medium && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Medium Predictions (20-35 points)
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {predictionsByTier.medium.map((category) => (
                  <PredictionCard key={category.id} category={category} />
                ))}
              </div>
            </div>
          )}

          {/* Hard Predictions */}
          {predictionsByTier.hard && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-orange-600" />
                Hard Predictions (40-60 points)
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {predictionsByTier.hard.map((category) => (
                  <PredictionCard key={category.id} category={category} />
                ))}
              </div>
            </div>
          )}

          {/* Expert Predictions */}
          {predictionsByTier.expert && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Flame className="h-5 w-5 text-purple-600" />
                Expert Predictions (75-100 points)
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {predictionsByTier.expert.map((category) => (
                  <PredictionCard key={category.id} category={category} />
                ))}
              </div>
            </div>
          )}

          {/* Bonus Predictions */}
          {predictionsByTier.bonus && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-red-600" />
                Bonus Predictions (125-200 points)
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {predictionsByTier.bonus.map((category) => (
                  <PredictionCard key={category.id} category={category} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Season Leaderboard
              </CardTitle>
              <CardDescription>Top predictors competing for bragging rights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((entry, index) => (
                  <div key={entry.user_id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-lg w-8">
                        #{entry.rank_position}
                      </div>
                      <div>
                        <p className="font-medium">{entry.display_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.accuracy_percentage}% accuracy
                        </p>
                      </div>
                      {entry.subscription_tier !== 'free' && (
                        <Badge variant="secondary">{entry.subscription_tier}</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{entry.total_points} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Donations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-mariners-teal" />
                  Support TridentFans
                </CardTitle>
                <CardDescription>
                  Help keep the lights on and the predictions flowing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  TridentFans is fan-funded. Your support helps us provide the best Mariners prediction experience.
                </p>
                <div className="grid gap-2">
                  <Button variant="outline" className="justify-start">
                    <DollarSign className="h-4 w-4 mr-2" />
                    $5 - Buy Mark a coffee ☕
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <DollarSign className="h-4 w-4 mr-2" />
                    $15 - Monthly supporter 🎯
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <DollarSign className="h-4 w-4 mr-2" />
                    $25 - Superfan status 🏆
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Affiliate Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-blue-500" />
                  Prediction Resources
                </CardTitle>
                <CardDescription>
                  Tools to enhance your prediction game
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Real money betting:</span>
                    <Button variant="outline" size="sm">
                      DraftKings
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Game tickets:</span>
                    <Button variant="outline" size="sm">
                      StubHub
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mariners gear:</span>
                    <Button variant="outline" size="sm">
                      MLB Shop
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}