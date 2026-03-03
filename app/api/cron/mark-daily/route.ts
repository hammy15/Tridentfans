import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { MARK_SYSTEM_PROMPT, MARK_CONTENT_VOICE } from '@/lib/mark-soul';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Mark's daily content cron — runs every morning at 9 AM PT
// This is the heartbeat of the site. Mark never misses a day.
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      dailyPost: false,
      poll: false,
    };

    // 1. Create a daily discussion post
    const dailyPost = await createDailyPost();
    if (dailyPost) results.dailyPost = true;

    // 2. Create a poll every 2-3 days
    const shouldCreatePoll = await shouldPostPoll();
    if (shouldCreatePoll) {
      const poll = await createDailyPoll();
      if (poll) results.poll = true;
    }

    return NextResponse.json({
      success: true,
      message: `Mark's daily content created`,
      results,
    });
  } catch (error) {
    console.error('Mark daily cron error:', error);
    return NextResponse.json({ error: 'Failed to create daily content' }, { status: 500 });
  }
}

async function createDailyPost(): Promise<boolean> {
  try {
    // Check if we already posted today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingPost } = await supabase
      .from('forum_posts')
      .select('id')
      .gte('created_at', `${today}T00:00:00Z`)
      .eq('is_mark_content', true)
      .limit(1)
      .single();

    if (existingPost) return false; // Already posted today

    // Get context: current date, recent forum activity, upcoming games
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'long' });
    const dayOfWeek = now.toLocaleString('en-US', { weekday: 'long' });
    const isOffseason = now.getMonth() >= 10 || now.getMonth() <= 2; // Nov-Feb

    // Get upcoming games for context
    const { data: upcomingGames } = await supabase
      .from('prediction_games')
      .select('opponent, game_date, is_home')
      .gte('game_date', today)
      .order('game_date')
      .limit(3);

    // Get recent hot topics for context
    const { data: recentPosts } = await supabase
      .from('forum_posts')
      .select('title')
      .order('created_at', { ascending: false })
      .limit(5);

    const contextInfo = `
Current date: ${dayOfWeek}, ${month} ${now.getDate()}, ${now.getFullYear()}
Season status: ${isOffseason ? 'Off-season' : 'In-season'}
Upcoming games: ${upcomingGames?.map(g => `${g.is_home ? 'vs' : '@'} ${g.opponent} on ${g.game_date}`).join(', ') || 'None scheduled'}
Recent forum topics: ${recentPosts?.map(p => p.title).join(', ') || 'None yet'}
`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: `${MARK_SYSTEM_PROMPT}

${MARK_CONTENT_VOICE.forum_post}

You are creating today's daily discussion post for TridentFans. Respond with ONLY a JSON object in this exact format:
{"title": "the post title", "content": "the post body (2-4 paragraphs)", "category": "general"}

Category must be one of: game-day, general, trade-talk, roster, stadium, off-topic

Do NOT include markdown code fences. Just the raw JSON.`,
      messages: [
        {
          role: 'user',
          content: `Create today's daily discussion post. Context:\n${contextInfo}\n\nWrite as Mark — sound like a REAL PERSON, not an AI. Short sentences, fragments ok, casual grammar. Be opinionated. End with something that makes people want to reply. NEVER use profanity. 2-3 SHORT paragraphs max.`,
        },
      ],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock) return false;

    let parsed;
    try {
      parsed = JSON.parse(textBlock.text.trim());
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return false;
      parsed = JSON.parse(jsonMatch[0]);
    }

    // Get the category ID
    const { data: category } = await supabase
      .from('forum_categories')
      .select('id')
      .eq('slug', parsed.category || 'general')
      .single();

    if (!category) return false;

    // Create the post
    const { error } = await supabase.from('forum_posts').insert({
      category_id: category.id,
      user_id: null, // System post (Mark)
      title: parsed.title,
      content: parsed.content + '\n\n— Mark',
      is_pinned: false,
      is_mark_content: true,
    });

    return !error;
  } catch (error) {
    console.error('Failed to create daily post:', error);
    return false;
  }
}

async function shouldPostPoll(): Promise<boolean> {
  // Post a poll every 2-3 days
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentPolls } = await supabase
    .from('polls')
    .select('id')
    .gte('created_at', twoDaysAgo)
    .eq('created_by', 'mark')
    .limit(1);

  return !recentPolls || recentPolls.length === 0;
}

async function createDailyPoll(): Promise<boolean> {
  try {
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'long' });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: `${MARK_SYSTEM_PROMPT}

${MARK_CONTENT_VOICE.poll_intro}

Create a poll for TridentFans. Respond with ONLY a JSON object:
{"question": "poll question", "options": ["option 1", "option 2", "option 3", "option 4"], "category": "general"}

Category must be one of: game, trade, roster, general, fun
Provide 3-4 options. Make it engaging and relevant.
Do NOT include markdown code fences. Just the raw JSON.`,
      messages: [
        {
          role: 'user',
          content: `Create a Mariners poll for ${month} ${now.getFullYear()}. Mix it up — serious (trade proposals, lineup decisions) or fun (best walk-up song, greatest moment). Keep the question casual and human-sounding. NEVER use profanity.`,
        },
      ],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock) return false;

    let parsed;
    try {
      parsed = JSON.parse(textBlock.text.trim());
    } catch {
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return false;
      parsed = JSON.parse(jsonMatch[0]);
    }

    // Create the poll
    const endsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days

    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        question: parsed.question,
        category: parsed.category || 'general',
        created_by: 'mark',
        ends_at: endsAt,
        is_active: true,
        is_featured: true,
      })
      .select()
      .single();

    if (pollError || !poll) return false;

    // Create poll options
    const options = (parsed.options || []).slice(0, 4);
    for (const optionText of options) {
      await supabase.from('poll_options').insert({
        poll_id: poll.id,
        text: optionText,
      });
    }

    return true;
  } catch (error) {
    console.error('Failed to create poll:', error);
    return false;
  }
}
