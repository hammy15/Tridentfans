'use client';

import { useState } from 'react';
import { Share2, Twitter, Facebook, Copy, Check, Trophy, Target, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShareData,
  buildTwitterShareUrl,
  buildFacebookShareUrl,
  buildRedditShareUrl,
  copyToClipboard,
  nativeShare,
  isNativeShareSupported,
  openShareWindow,
} from '@/lib/share';

interface Prediction {
  pick: string;
  result: 'correct' | 'incorrect' | 'pending';
  points?: number;
}

interface GameInfo {
  opponent: string;
  date: string;
  marinersScore?: number;
  opponentScore?: number;
  gameResult?: 'win' | 'loss' | 'pending';
}

interface PredictionShareCardProps {
  username: string;
  predictions: Prediction[];
  score: number;
  gameInfo: GameInfo;
  accuracy: number;
}

export function PredictionShareCard({
  username,
  predictions,
  score,
  gameInfo,
  accuracy,
}: PredictionShareCardProps) {
  const [copied, setCopied] = useState(false);

  const shareData: ShareData = {
    title: `${username}'s Mariners Prediction on TridentFans`,
    text: `I scored ${score} points predicting the Mariners vs ${gameInfo.opponent} game with ${accuracy}% accuracy! Can you beat me?`,
    url: 'https://tridentfans.com/predictions',
    hashtags: ['Mariners', 'SeaUsRise', 'TridentFans', 'MLB'],
  };

  const handleNativeShare = async () => {
    await nativeShare(shareData);
  };

  const handleTwitterShare = () => {
    openShareWindow(buildTwitterShareUrl(shareData), 'twitter-share');
  };

  const handleFacebookShare = () => {
    openShareWindow(buildFacebookShareUrl(shareData), 'facebook-share');
  };

  const handleRedditShare = () => {
    openShareWindow(buildRedditShareUrl(shareData), 'reddit-share');
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareData.url || 'https://tridentfans.com');
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const correctPicks = predictions.filter(p => p.result === 'correct').length;
  const totalPicks = predictions.length;

  return (
    <Card className="overflow-hidden">
      {/* Mariners branded header with gradient */}
      <div className="bg-gradient-to-r from-[#0C2C56] to-[#005C5C] p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <span className="font-bold text-lg">Prediction Results</span>
          </div>
          <Badge className="bg-white/20 text-white border-white/30">
            TridentFans
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* User info */}
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <p className="font-semibold text-lg">{username}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>vs {gameInfo.opponent} - {gameInfo.date}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-mariners-teal">{score}</p>
            <p className="text-xs text-muted-foreground">points</p>
          </div>
        </div>

        {/* Game result */}
        {gameInfo.marinersScore !== undefined && gameInfo.opponentScore !== undefined && (
          <div className="flex items-center justify-center gap-4 py-2 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-sm font-medium">Mariners</p>
              <p className="text-2xl font-bold">{gameInfo.marinersScore}</p>
            </div>
            <div className="text-muted-foreground">-</div>
            <div className="text-center">
              <p className="text-sm font-medium">{gameInfo.opponent}</p>
              <p className="text-2xl font-bold">{gameInfo.opponentScore}</p>
            </div>
            {gameInfo.gameResult && (
              <Badge
                variant={gameInfo.gameResult === 'win' ? 'success' : gameInfo.gameResult === 'loss' ? 'destructive' : 'secondary'}
                className="ml-2"
              >
                {gameInfo.gameResult === 'win' ? 'W' : gameInfo.gameResult === 'loss' ? 'L' : '-'}
              </Badge>
            )}
          </div>
        )}

        {/* Predictions breakdown */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-mariners-teal" />
            <span className="font-medium">My Picks</span>
            <span className="text-sm text-muted-foreground">
              ({correctPicks}/{totalPicks} correct)
            </span>
          </div>
          <div className="grid gap-2">
            {predictions.map((prediction, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                  prediction.result === 'correct'
                    ? 'bg-green-500/10 border border-green-500/30'
                    : prediction.result === 'incorrect'
                      ? 'bg-red-500/10 border border-red-500/30'
                      : 'bg-muted/50 border border-muted'
                }`}
              >
                <span>{prediction.pick}</span>
                <div className="flex items-center gap-2">
                  {prediction.points !== undefined && prediction.points > 0 && (
                    <span className="text-green-600 font-medium">+{prediction.points}</span>
                  )}
                  {prediction.result === 'correct' && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                  {prediction.result === 'incorrect' && (
                    <span className="text-red-500 text-xs">X</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accuracy stat */}
        <div className="flex items-center justify-between text-sm border-t pt-3">
          <span className="text-muted-foreground">Prediction Accuracy</span>
          <span className="font-bold text-mariners-teal">{accuracy}%</span>
        </div>

        {/* Share buttons */}
        <div className="flex items-center justify-center gap-2 pt-2 border-t">
          {isNativeShareSupported() ? (
            <Button
              onClick={handleNativeShare}
              variant="mariners"
              className="flex-1"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Result
            </Button>
          ) : (
            <>
              <Button
                onClick={handleTwitterShare}
                variant="outline"
                size="icon"
                className="hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500"
              >
                <Twitter className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleFacebookShare}
                variant="outline"
                size="icon"
                className="hover:bg-blue-600/10 hover:text-blue-600 hover:border-blue-600"
              >
                <Facebook className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleRedditShare}
                variant="outline"
                size="icon"
                className="hover:bg-orange-500/10 hover:text-orange-500 hover:border-orange-500"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                </svg>
              </Button>
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="icon"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
