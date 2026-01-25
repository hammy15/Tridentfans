'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowRightLeft,
  Sparkles,
  Loader2,
  Send,
  ThumbsUp,
  ThumbsDown,
  Scale,
  TrendingUp,
  Users,
  DollarSign,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface TradeAnalysis {
  summary: string;
  pros: string[];
  cons: string[];
  playerComparisons: Array<{
    marinersPlayer: { name: string; stats: string };
    incomingPlayer: { name: string; stats: string };
    verdict: 'upgrade' | 'downgrade' | 'lateral';
  }>;
  financialImpact: {
    salarySaved: string;
    salaryAdded: string;
    netImpact: string;
    luxuryTaxImplication: string;
  };
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendation: 'do it' | 'pass' | 'depends';
}

interface RecentTradeRumor {
  id: string;
  title: string;
  description: string;
  source: string;
  date: string;
}

// Mock recent trade rumors
const mockRecentRumors: RecentTradeRumor[] = [
  {
    id: '1',
    title: 'Mariners eyeing veteran starter',
    description: 'Reports indicate Seattle is interested in acquiring a veteran starter to bolster their rotation for the playoff push.',
    source: 'MLB Trade Rumors',
    date: '2 hours ago',
  },
  {
    id: '2',
    title: 'Bullpen help on the radar',
    description: 'The Mariners are reportedly looking to add a left-handed reliever before the trade deadline.',
    source: 'The Athletic',
    date: '5 hours ago',
  },
  {
    id: '3',
    title: 'Prospect package discussions',
    description: 'Multiple teams have inquired about top Mariners prospects in potential blockbuster trade talks.',
    source: 'ESPN',
    date: '1 day ago',
  },
];

export function TradeAnalyzer() {
  const [tradeInput, setTradeInput] = useState('');
  const [analysis, setAnalysis] = useState<TradeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRumors, setShowRumors] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function analyzeTradeWithBot(tradeScenario: string): Promise<string> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botId: 'captain_hammy', // Captain Hammy specializes in trades
        messages: [
          {
            role: 'user',
            content: `Analyze this trade scenario for the Seattle Mariners. Provide your analysis in a structured format with pros, cons, and your overall recommendation. Be specific about player value, financial implications, and how it affects the team's competitiveness.

Trade scenario: ${tradeScenario}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get analysis from bot');
    }

    const data = await response.json();
    return data.response;
  }

  // Parse bot response into structured analysis (simplified mock parser)
  function parseAnalysis(botResponse: string): TradeAnalysis {
    // In production, you'd use a more sophisticated parser or structured output
    // For now, we'll generate mock structured data based on the response length/sentiment
    const isPositive = botResponse.toLowerCase().includes('good') ||
                       botResponse.toLowerCase().includes('great') ||
                       botResponse.toLowerCase().includes('upgrade');

    const isNegative = botResponse.toLowerCase().includes('bad') ||
                       botResponse.toLowerCase().includes('overpay') ||
                       botResponse.toLowerCase().includes('downgrade');

    return {
      summary: botResponse.slice(0, 300) + (botResponse.length > 300 ? '...' : ''),
      pros: [
        'Addresses a clear need for the team',
        'Player fits the clubhouse culture',
        'Contract is manageable for the budget',
      ],
      cons: [
        'Gives up significant prospect capital',
        'Player has injury history concerns',
        'May not be enough to compete this year',
      ],
      playerComparisons: [
        {
          marinersPlayer: { name: 'Prospect A', stats: '.280/.350/.420 in AAA' },
          incomingPlayer: { name: 'Veteran Player', stats: '.275/.340/.450 MLB' },
          verdict: isPositive ? 'upgrade' : isNegative ? 'downgrade' : 'lateral',
        },
      ],
      financialImpact: {
        salarySaved: '$2.5M',
        salaryAdded: '$8.5M',
        netImpact: '+$6M',
        luxuryTaxImplication: 'Still under threshold',
      },
      overallGrade: isPositive ? 'B' : isNegative ? 'D' : 'C',
      recommendation: isPositive ? 'do it' : isNegative ? 'pass' : 'depends',
    };
  }

  async function handleAnalyze() {
    if (!tradeInput.trim()) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const botResponse = await analyzeTradeWithBot(tradeInput);
      const parsedAnalysis = parseAnalysis(botResponse);
      // Store the full bot response in the summary
      parsedAnalysis.summary = botResponse;
      setAnalysis(parsedAnalysis);
    } catch (err) {
      console.error('Trade analysis error:', err);
      setError('Failed to analyze trade. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleQuickAnalysis(rumor: RecentTradeRumor) {
    setTradeInput(rumor.description);
    setShowRumors(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }

  function clearAnalysis() {
    setAnalysis(null);
    setTradeInput('');
    setShowRumors(true);
  }

  const gradeColors: Record<string, string> = {
    A: 'bg-green-500 text-white',
    B: 'bg-green-400 text-white',
    C: 'bg-yellow-500 text-white',
    D: 'bg-orange-500 text-white',
    F: 'bg-red-500 text-white',
  };

  return (
    <Card className="border-mariners-teal/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-mariners-teal" />
            <CardTitle className="text-base">Trade Analyzer</CardTitle>
          </div>
          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Powered by AI
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Describe a trade scenario and get AI-powered analysis from Captain Hammy
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Input Area */}
        <div className="space-y-2">
          <Textarea
            ref={textareaRef}
            placeholder="Describe a trade scenario... e.g., 'Mariners trade prospect X for veteran pitcher Y'"
            value={tradeInput}
            onChange={e => setTradeInput(e.target.value)}
            className="min-h-[100px] resize-none"
            disabled={loading}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Be specific about players involved for better analysis
            </p>
            <Button
              variant="mariners"
              size="sm"
              onClick={handleAnalyze}
              disabled={loading || !tradeInput.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Analyze Trade
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2">
            {/* Header with Grade */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-mariners-teal" />
                <span className="font-semibold">Analysis Results</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`text-lg px-3 py-1 ${gradeColors[analysis.overallGrade]}`}>
                  Grade: {analysis.overallGrade}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAnalysis}
                  className="h-8 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm whitespace-pre-wrap">{analysis.summary}</p>
            </div>

            {/* Recommendation Badge */}
            <div className="flex justify-center">
              <Badge
                className={`text-sm px-4 py-1 ${
                  analysis.recommendation === 'do it'
                    ? 'bg-green-500 text-white'
                    : analysis.recommendation === 'pass'
                    ? 'bg-red-500 text-white'
                    : 'bg-yellow-500 text-white'
                }`}
              >
                {analysis.recommendation === 'do it'
                  ? 'Recommendation: DO IT'
                  : analysis.recommendation === 'pass'
                  ? 'Recommendation: PASS'
                  : 'Recommendation: DEPENDS ON CIRCUMSTANCES'}
              </Badge>
            </div>

            {/* Pros and Cons */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsUp className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-sm text-green-600">Pros</span>
                </div>
                <ul className="space-y-1">
                  {analysis.pros.map((pro, index) => (
                    <li key={index} className="text-sm flex items-start gap-1">
                      <span className="text-green-500 mt-1">+</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsDown className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-sm text-red-600">Cons</span>
                </div>
                <ul className="space-y-1">
                  {analysis.cons.map((con, index) => (
                    <li key={index} className="text-sm flex items-start gap-1">
                      <span className="text-red-500 mt-1">-</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Player Comparisons */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-mariners-teal" />
                <span className="font-semibold text-sm">Player Comparisons</span>
              </div>
              {analysis.playerComparisons.map((comparison, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between"
                >
                  <div className="text-center flex-1">
                    <p className="font-medium text-sm">{comparison.marinersPlayer.name}</p>
                    <p className="text-xs text-muted-foreground">{comparison.marinersPlayer.stats}</p>
                    <Badge variant="outline" className="text-xs mt-1">Outgoing</Badge>
                  </div>
                  <div className="px-4">
                    <Badge
                      className={`${
                        comparison.verdict === 'upgrade'
                          ? 'bg-green-500 text-white'
                          : comparison.verdict === 'downgrade'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-500 text-white'
                      }`}
                    >
                      {comparison.verdict === 'upgrade'
                        ? 'UPGRADE'
                        : comparison.verdict === 'downgrade'
                        ? 'DOWNGRADE'
                        : 'LATERAL'}
                    </Badge>
                  </div>
                  <div className="text-center flex-1">
                    <p className="font-medium text-sm">{comparison.incomingPlayer.name}</p>
                    <p className="text-xs text-muted-foreground">{comparison.incomingPlayer.stats}</p>
                    <Badge variant="mariners" className="text-xs mt-1">Incoming</Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Impact */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-mariners-teal" />
                <span className="font-semibold text-sm">Financial Impact</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">Salary Saved</p>
                  <p className="font-semibold text-green-600">{analysis.financialImpact.salarySaved}</p>
                </div>
                <div className="p-2 rounded bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">Salary Added</p>
                  <p className="font-semibold text-red-600">{analysis.financialImpact.salaryAdded}</p>
                </div>
                <div className="p-2 rounded bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">Net Impact</p>
                  <p className="font-semibold">{analysis.financialImpact.netImpact}</p>
                </div>
                <div className="p-2 rounded bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">Luxury Tax</p>
                  <p className="font-semibold text-sm">{analysis.financialImpact.luxuryTaxImplication}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Trade Rumors */}
        {!analysis && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-mariners-teal" />
                <span className="font-semibold text-sm">Recent Trade Rumors</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRumors(!showRumors)}
                className="h-8 px-2"
              >
                {showRumors ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>

            {showRumors && (
              <div className="space-y-2">
                {mockRecentRumors.map(rumor => (
                  <button
                    key={rumor.id}
                    onClick={() => handleQuickAnalysis(rumor)}
                    className="w-full text-left p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm group-hover:text-mariners-teal transition-colors">
                          {rumor.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {rumor.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {rumor.source}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{rumor.date}</span>
                        </div>
                      </div>
                      <ArrowRightLeft className="h-4 w-4 text-muted-foreground group-hover:text-mariners-teal transition-colors ml-2 shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs text-center text-muted-foreground">
              Click a rumor to analyze it, or enter your own scenario above
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
