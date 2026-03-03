import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { MARK_SYSTEM_PROMPT, MARK_CONTENT_VOICE } from '@/lib/mark-soul';
import { sendBroadcastNotification } from '@/lib/push-notifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Post-game recap cron — runs after score-predictions
// Mark writes his raw reaction to the game
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find games that finished in the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: finishedGames } = await supabase
      .from('prediction_games')
      .select('id, opponent, game_date, is_home, mariners_score, opponent_score, result')
      .eq('status', 'final')
      .gte('game_date', yesterday.split('T')[0])
      .order('game_date', { ascending: false });

    if (!finishedGames || finishedGames.length === 0) {
      return NextResponse.json({ message: 'No finished games to recap', created: 0 });
    }

    let created = 0;

    for (const game of finishedGames) {
      // Check if we already recapped this game
      const { data: existing } = await supabase
        .from('forum_posts')
        .select('id')
        .eq('is_mark_content', true)
        .ilike('title', `%recap%${game.opponent}%`)
        .gte('created_at', yesterday)
        .limit(1);

      if (existing && existing.length > 0) continue;

      const marinersWon = game.result === 'win';
      const score = `${game.mariners_score}-${game.opponent_score}`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: `${MARK_SYSTEM_PROMPT}\n\n${MARK_CONTENT_VOICE.post_game}\n\nRespond with ONLY a JSON object: {"title": "post title", "content": "post body"}\nDo NOT include markdown code fences. Just raw JSON.`,
        messages: [
          {
            role: 'user',
            content: `The Mariners just ${marinersWon ? 'beat' : 'lost to'} the ${game.opponent} ${score}. ${game.is_home ? 'Home game.' : 'Road game.'} Write your post-game reaction as Mark. Keep it SHORT and raw. Sound human. No profanity.`,
          },
        ],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock) continue;

      let parsed;
      try {
        parsed = JSON.parse(textBlock.text.trim());
      } catch {
        const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) continue;
        parsed = JSON.parse(jsonMatch[0]);
      }

      const { data: category } = await supabase
        .from('forum_categories')
        .select('id')
        .eq('slug', 'game-day')
        .single();

      if (!category) continue;

      const { error } = await supabase.from('forum_posts').insert({
        category_id: category.id,
        user_id: null,
        title: parsed.title,
        content: parsed.content + '\n\n— Mark',
        is_pinned: false,
        is_mark_content: true,
      });

      if (!error) {
        created++;
        try {
          await sendBroadcastNotification({
            title: 'Post-Game Recap',
            body: parsed.title,
            icon: '/icons/icon-192x192.png',
            data: { url: '/forum' },
          });
        } catch {
          // Best effort
        }
      }
    }

    return NextResponse.json({ success: true, created });
  } catch (error) {
    console.error('Post-game recap cron error:', error);
    return NextResponse.json({ error: 'Failed to create recaps' }, { status: 500 });
  }
}
