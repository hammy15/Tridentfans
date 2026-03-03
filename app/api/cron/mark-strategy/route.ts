import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { MARK_SYSTEM_PROMPT } from '@/lib/mark-soul';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Mark's weekly strategy meeting with himself
// Runs every Monday and Thursday — Mark thinks about new ideas, games, marketing, growth
// Goal: 5,000 real members by May 31, 2026
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Gather site metrics
    const [postsCount, usersCount, predictionsCount, recentActivity] = await Promise.all([
      supabase.from('forum_posts').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('user_predictions').select('id', { count: 'exact', head: true }),
      supabase
        .from('forum_posts')
        .select('title, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const metrics = {
      totalPosts: postsCount.count || 0,
      totalUsers: usersCount.count || 0,
      totalPredictions: predictionsCount.count || 0,
      recentPosts: recentActivity.data?.map((p) => p.title) || [],
    };

    const now = new Date();
    const daysUntilGoal = Math.ceil(
      (new Date('2026-05-31').getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Mark's strategy meeting
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      system: `${MARK_SYSTEM_PROMPT}

You are having your weekly strategy meeting with yourself. This is internal — you're thinking out loud about how to grow TridentFans.

GOAL: 5,000 real, unique members by May 31, 2026. That is ${daysUntilGoal} days away.

Think about:
1. NEW GAME/FEATURE IDEAS — fun things that would make people come back daily
2. MARKETING — free ways to get the word out. Reddit posts, Twitter engagement, baseball forums, SEO blog content
3. CONTENT IDEAS — what posts, polls, debates would drive engagement
4. WHAT'S WORKING — based on the metrics, what should you do more of
5. WHAT'S NOT WORKING — what needs to change

Be specific. Come up with actual actionable items, not vague goals. Think like a startup founder with zero budget.

Respond with a JSON object:
{"meeting_notes": "your internal meeting notes", "action_items": ["item 1", "item 2", ...], "new_game_idea": "one specific new game or feature idea", "marketing_plan": "one specific marketing action to take this week", "content_ideas": ["idea 1", "idea 2", "idea 3"]}

Do NOT include markdown code fences.`,
      messages: [
        {
          role: 'user',
          content: `Weekly strategy meeting. Current metrics:
- Total users: ${metrics.totalUsers}
- Total forum posts: ${metrics.totalPosts}
- Total predictions: ${metrics.totalPredictions}
- Days until 5,000 member goal: ${daysUntilGoal}
- Recent post topics: ${metrics.recentPosts.join(', ') || 'None'}

Date: ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}

What's the plan? Be honest with yourself. What needs to happen to hit 5,000 members?`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock) {
      return NextResponse.json({ error: 'No response' }, { status: 500 });
    }

    let parsed;
    try {
      parsed = JSON.parse(textBlock.text.trim());
    } catch {
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Parse error' }, { status: 500 });
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    // Save meeting notes to the database for Mark's reference
    await supabase.from('blog_posts').insert({
      slug: `mark-strategy-${now.toISOString().split('T')[0]}`,
      title: `Strategy Meeting Notes — ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      content: parsed.meeting_notes,
      excerpt: `Mark's internal strategy notes. Goal: 5,000 members by May 31.`,
      tags: ['strategy', 'internal'],
      author: 'mark',
      is_published: false, // Internal only — not public
    });

    // Execute the marketing plan — create a forum post if one of the action items involves community
    if (parsed.content_ideas && parsed.content_ideas.length > 0) {
      const { data: category } = await supabase
        .from('forum_categories')
        .select('id')
        .eq('slug', 'general')
        .single();

      if (category) {
        // Create the most interesting content idea as a post
        await supabase.from('forum_posts').insert({
          category_id: category.id,
          user_id: null,
          title: parsed.content_ideas[0],
          content: `This one's been on my mind.\n\nLet me know what you think. And hey, if you know any Mariners fans who'd dig this place, send them our way. We're building something real here.\n\n— Mark`,
          is_pinned: false,
          is_mark_content: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      metrics,
      daysUntilGoal,
      actionItems: parsed.action_items,
      newGameIdea: parsed.new_game_idea,
      marketingPlan: parsed.marketing_plan,
    });
  } catch (error) {
    console.error('Mark strategy cron error:', error);
    return NextResponse.json({ error: 'Strategy meeting failed' }, { status: 500 });
  }
}
