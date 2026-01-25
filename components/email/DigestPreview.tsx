'use client';

import { useState, useEffect } from 'react';
import type { DigestContent, Profile } from '@/types';

interface DigestPreviewProps {
  user: Pick<Profile, 'username' | 'display_name'>;
  content?: DigestContent;
  loading?: boolean;
}

export function DigestPreview({ user, content, loading = false }: DigestPreviewProps) {
  const username = user.display_name || user.username || 'Fan';

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-mariners-navy to-mariners-teal p-6 text-center">
          <div className="text-2xl font-bold text-white animate-pulse">Loading preview...</div>
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No digest content available. Make some predictions to see your weekly stats!
        </p>
      </div>
    );
  }

  const accuracy =
    content.predictionsThisWeek > 0
      ? Math.round((content.correctPredictions / content.predictionsThisWeek) * 100)
      : 0;

  const rankChangeText =
    content.rankChange > 0
      ? `+${content.rankChange}`
      : content.rankChange < 0
        ? `${content.rankChange}`
        : '0';
  const rankChangeColor =
    content.rankChange > 0
      ? 'text-green-600'
      : content.rankChange < 0
        ? 'text-red-600'
        : 'text-gray-500';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-mariners-navy to-mariners-teal p-6 text-center">
        <h2 className="text-2xl font-bold text-white">TridentFans</h2>
        <p className="text-mariners-silver text-sm mt-1">Seattle Mariners Fan Community</p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Welcome */}
        <div>
          <h3 className="text-xl font-bold text-mariners-navy dark:text-white">
            Your Weekly Digest
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Hey {username}, here&apos;s your week in review!
          </p>
        </div>

        {/* Prediction Stats */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h4 className="font-semibold text-mariners-navy dark:text-white mb-4">
            Your Prediction Stats This Week
          </h4>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-mariners-navy dark:text-white">
                {content.predictionsThisWeek}
              </div>
              <div className="text-xs text-gray-500 uppercase mt-1">Predictions</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-mariners-navy dark:text-white">
                {content.correctPredictions}
              </div>
              <div className="text-xs text-gray-500 uppercase mt-1">Correct</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-mariners-navy dark:text-white">
                {accuracy}%
              </div>
              <div className="text-xs text-gray-500 uppercase mt-1">Accuracy</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                +{content.pointsEarnedThisWeek}
              </div>
              <div className="text-xs text-gray-500 uppercase mt-1">Points</div>
            </div>
          </div>
        </div>

        {/* Leaderboard Position */}
        <div className="bg-gradient-to-r from-mariners-navy to-mariners-teal rounded-lg p-4">
          <h4 className="font-semibold text-white mb-4">Leaderboard Position</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-white">#{content.currentRank}</div>
              <div className="text-mariners-silver text-xs mt-1">Current Rank</div>
            </div>
            <div className="flex items-center justify-center">
              <span className={`font-semibold ${rankChangeColor}`}>
                {content.rankChange > 0 ? '\u2191' : content.rankChange < 0 ? '\u2193' : '\u2194'}{' '}
                {rankChangeText} spots
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {content.totalPoints.toLocaleString()}
              </div>
              <div className="text-mariners-silver text-xs mt-1">Total Points</div>
            </div>
          </div>
        </div>

        {/* Upcoming Games */}
        {content.upcomingGames.length > 0 && (
          <div>
            <h4 className="font-semibold text-mariners-navy dark:text-white mb-3">
              Upcoming Games
            </h4>
            <div className="space-y-2">
              {content.upcomingGames.map(game => (
                <div
                  key={game.id}
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-mariners-navy dark:text-white">
                      {game.isHome ? 'vs' : '@'} {game.opponent}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(game.gameDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      at {game.gameTime}
                    </div>
                  </div>
                  <span className="text-mariners-teal text-sm font-medium">Make Prediction</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hot Forum Topics */}
        {content.hotTopics.length > 0 && (
          <div>
            <h4 className="font-semibold text-mariners-navy dark:text-white mb-3">
              Hot Forum Topics
            </h4>
            <div className="space-y-2">
              {content.hotTopics.map(topic => (
                <div
                  key={topic.id}
                  className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border-l-4 border-mariners-teal"
                >
                  <div className="font-medium text-mariners-navy dark:text-white">
                    {topic.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    by {topic.author} - {topic.commentCount} comments
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* On This Day */}
        {content.onThisDay && (
          <div className="bg-mariners-navy/5 dark:bg-mariners-navy/20 rounded-lg p-4">
            <h4 className="font-semibold text-mariners-navy dark:text-white mb-2">
              On This Day in Mariners History
            </h4>
            <div className="text-mariners-teal text-sm font-bold">{content.onThisDay.year}</div>
            <div className="font-medium text-mariners-navy dark:text-white mt-1">
              {content.onThisDay.title}
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {content.onThisDay.description}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center pt-4">
          <button className="bg-mariners-teal hover:bg-mariners-teal/90 text-white font-bold py-3 px-8 rounded-lg transition-colors">
            Make Your Predictions
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 text-center border-t border-gray-200 dark:border-gray-700">
        <p className="font-bold text-mariners-navy dark:text-white">Go Mariners!</p>
        <p className="text-gray-500 text-sm mt-2">
          <span className="text-mariners-teal">tridentfans.com</span> |{' '}
          <span className="text-gray-400">Manage Preferences</span> |{' '}
          <span className="text-gray-400">Unsubscribe</span>
        </p>
      </div>
    </div>
  );
}

export default DigestPreview;
