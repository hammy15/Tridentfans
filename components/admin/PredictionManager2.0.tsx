'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Target,
  Flame,
  Brain,
  Zap,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Bot,
  Gift,
} from 'lucide-react';
import { toast } from 'sonner';

interface PredictionCategory {
  id: string;
  name: string;
  description: string;
  type: string;
  points_base: number;
  difficulty_tier: string;
  display_order: number;
  is_active: boolean;
  options: string[];
}

interface GameStats {
  total_games: number;
  games_with_predictions: number;
  total_predictions: number;
  total_points_awarded: number;
  average_predictions_per_game: number;
  top_scoring_game: any;
}

interface RevenueStats {
  total_affiliate_clicks: number;
  total_donations: number;
  premium_subscribers: number;
  estimated_monthly_revenue: number;
  top_affiliate_sources: any[];
}

interface PredictionManager2Props {
  adminPassword: string;
}

export function PredictionManager2({ adminPassword }: PredictionManager2Props) {
  const [categories, setCategories] = useState<PredictionCategory[]>([]);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // AI Generation
  const [generatingAI, setGeneratingAI] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState('');
  
  // Scoring
  const [scoringPredictions, setScoringPredictions] = useState(false);
  
  // Category Management
  const [editingCategory, setEditingCategory] = useState<PredictionCategory | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch prediction categories
      const categoriesRes = await fetch('/api/admin/prediction-categories');
      const categoriesData = await categoriesRes.json();
      setCategories(categoriesData.categories || []);

      // Fetch game statistics
      const statsRes = await fetch('/api/admin/prediction-stats');
      const statsData = await statsRes.json();
      setGameStats(statsData.gameStats);
      setRevenueStats(statsData.revenueStats);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    }
    setLoading(false);
  };

  const generateAIPredictions = async () => {
    if (!selectedGameId) {
      toast.error('Please select a game first');
      return;
    }

    setGeneratingAI(true);
    try {
      const response = await fetch('/api/predictions/comprehensive', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: selectedGameId,
          adminPassword,
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      toast.success('🤖 AI predictions generated for Mark, Hammy, and Spartan!');
      
    } catch (error: any) {
      console.error('Error generating AI predictions:', error);
      toast.error(error.message || 'Failed to generate AI predictions');
    }
    setGeneratingAI(false);
  };

  const scorePredictions = async () => {
    setScoringPredictions(true);
    try {
      const response = await fetch('/api/predictions/scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      toast.success(`🏆 Scored ${data.gamesScored} games, awarded ${data.pointsAwarded} points!`);
      await fetchData(); // Refresh stats
      
    } catch (error: any) {
      console.error('Error scoring predictions:', error);
      toast.error(error.message || 'Failed to score predictions');
    }
    setScoringPredictions(false);
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading prediction management data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-mariners-teal" />
            Prediction Games 2.0 Management
          </CardTitle>
          <CardDescription>
            Comprehensive prediction system with AI competition and revenue generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-mariners-teal">
                {gameStats?.total_predictions || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Predictions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {gameStats?.total_points_awarded || 0}
              </div>
              <div className="text-sm text-muted-foreground">Points Awarded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {revenueStats?.premium_subscribers || 0}
              </div>
              <div className="text-sm text-muted-foreground">Premium Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${revenueStats?.estimated_monthly_revenue?.toFixed(0) || '0'}
              </div>
              <div className="text-sm text-muted-foreground">Est. Monthly Revenue</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-predictions">AI Predictions</TabsTrigger>
          <TabsTrigger value="scoring">Scoring</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Game Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Prediction Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <Calendar className="h-8 w-8 mx-auto text-mariners-teal mb-2" />
                  <div className="text-2xl font-bold">{gameStats?.total_games || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Games</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {gameStats?.games_with_predictions || 0} with predictions
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                  <div className="text-2xl font-bold">
                    {gameStats?.average_predictions_per_game?.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Predictions/Game</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Trophy className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                  <div className="text-2xl font-bold">
                    {gameStats?.top_scoring_game?.points || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Highest Game Score</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {gameStats?.top_scoring_game?.date || 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={scorePredictions}
                  disabled={scoringPredictions}
                  className="w-full"
                >
                  {scoringPredictions ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Score Completed Games
                </Button>
                <Button variant="outline" className="w-full" onClick={fetchData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['easy', 'medium', 'hard', 'expert', 'bonus'].map(tier => {
                    const count = categories.filter(c => c.difficulty_tier === tier && c.is_active).length;
                    return (
                      <div key={tier} className="flex items-center justify-between">
                        <Badge className={getDifficultyColor(tier)}>
                          {getDifficultyIcon(tier)}
                          {tier}
                        </Badge>
                        <span className="text-sm">{count} categories</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Categories Active</span>
                    <Badge variant="outline">
                      {categories.filter(c => c.is_active).length}/{categories.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">AI Predictions</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Scoring System</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai-predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Prediction Generation
              </CardTitle>
              <CardDescription>
                Generate predictions for Mark, Hammy, and Spartan for upcoming games
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Game ID (get from prediction games table)"
                  value={selectedGameId}
                  onChange={(e) => setSelectedGameId(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={generateAIPredictions}
                  disabled={generatingAI || !selectedGameId}
                >
                  {generatingAI ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Bot className="h-4 w-4 mr-2" />
                  )}
                  Generate AI Predictions
                </Button>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium mb-2">How AI Predictions Work:</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>⚓ Mark:</strong> Gut feeling + years of watching, slightly optimistic</p>
                  <p><strong>🧢 Hammy:</strong> Analytical approach, matchups and roster knowledge</p>
                  <p><strong>⚔️ Spartan:</strong> Advanced metrics, contrarian takes, data-driven</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Prediction Scoring System
              </CardTitle>
              <CardDescription>
                Manage scoring for completed games and update leaderboards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">Scoring Actions</h4>
                  <Button
                    onClick={scorePredictions}
                    disabled={scoringPredictions}
                    className="w-full"
                  >
                    {scoringPredictions ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Score All Completed Games
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    This will score all predictions for completed games, award points, 
                    update achievements, and refresh leaderboards.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Scoring Rules</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Easy Predictions:</span>
                      <Badge variant="outline">10-15 points</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Medium Predictions:</span>
                      <Badge variant="outline">20-35 points</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Hard Predictions:</span>
                      <Badge variant="outline">40-60 points</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Expert Predictions:</span>
                      <Badge variant="outline">75-100 points</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Bonus Predictions:</span>
                      <Badge variant="outline">125-200 points</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Prediction Categories
              </CardTitle>
              <CardDescription>
                Manage available prediction categories and difficulty tiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className={getDifficultyColor(category.difficulty_tier)}>
                        {getDifficultyIcon(category.difficulty_tier)}
                        {category.difficulty_tier}
                      </Badge>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{category.points_base} pts</Badge>
                      <Badge variant={category.is_active ? "default" : "secondary"}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Revenue Analytics
              </CardTitle>
              <CardDescription>
                Track affiliate revenue and donation performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">Affiliate Performance</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Clicks:</span>
                      <Badge variant="outline">{revenueStats?.total_affiliate_clicks || 0}</Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      {revenueStats?.top_affiliate_sources?.map((source: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span>{source.partner}:</span>
                          <span>{source.clicks} clicks</span>
                        </div>
                      )) || <p className="text-muted-foreground">No affiliate data yet</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Community Support</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Donations:</span>
                      <Badge variant="outline">${revenueStats?.total_donations?.toFixed(2) || '0.00'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Premium Subscribers:</span>
                      <Badge variant="outline">{revenueStats?.premium_subscribers || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. Monthly Revenue:</span>
                      <Badge className="bg-green-100 text-green-800">
                        <Gift className="h-3 w-3 mr-1" />
                        ${revenueStats?.estimated_monthly_revenue?.toFixed(0) || '0'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}