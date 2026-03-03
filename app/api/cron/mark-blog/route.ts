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

// Blog content cron — Mark writes 1-2 blog posts per week
// Topics: analysis, player profiles, history, fan guides, trade rumors
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if we posted a blog in the last 3 days
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentBlogs } = await supabase
      .from('blog_posts')
      .select('id')
      .gte('created_at', threeDaysAgo)
      .limit(1);

    if (recentBlogs && recentBlogs.length > 0) {
      return NextResponse.json({ message: 'Blog posted recently, skipping' });
    }

    // Get context
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'long' });
    const isOffseason = now.getMonth() >= 10 || now.getMonth() <= 2;

    // Get recent games for context
    const { data: recentGames } = await supabase
      .from('prediction_games')
      .select('opponent, game_date, result, mariners_score, opponent_score')
      .eq('status', 'final')
      .order('game_date', { ascending: false })
      .limit(5);

    // Get existing blog post titles to avoid repeats
    const { data: existingPosts } = await supabase
      .from('blog_posts')
      .select('title')
      .order('created_at', { ascending: false })
      .limit(10);

    const topics = [
      'a player profile or analysis piece',
      'a Mariners history deep dive',
      'a trade analysis or deadline preview',
      'a fan guide to T-Mobile Park',
      'a season analysis or projection piece',
      'a matchup preview or series breakdown',
      'a piece about what makes the Mariners community special',
      'a look at the farm system and future',
    ];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `${MARK_SYSTEM_PROMPT}\n\n${MARK_CONTENT_VOICE.blog_post}\n\nYou are writing a blog post for TridentFans.com. This is for SEO so make it substantive but keep the voice real and human.\n\nRespond with ONLY a JSON object:\n{"title": "blog title", "slug": "url-friendly-slug", "content": "full blog post (use ## for headers, keep paragraphs short)", "excerpt": "1-2 sentence excerpt for previews", "tags": ["tag1", "tag2"]}\n\nDo NOT include markdown code fences. Just raw JSON.`,
      messages: [
        {
          role: 'user',
          content: `Write ${randomTopic} for TridentFans blog. It's ${month} ${now.getFullYear()}. ${isOffseason ? 'Off-season.' : 'In-season.'}\n\nRecent games: ${recentGames?.map((g) => `${g.result === 'win' ? 'W' : 'L'} vs ${g.opponent} ${g.mariners_score}-${g.opponent_score}`).join(', ') || 'None yet'}\n\nDon't repeat these existing titles: ${existingPosts?.map((p) => p.title).join(', ') || 'None yet'}\n\nWrite as Mark. Sound HUMAN. No profanity. Keep paragraphs short. Use ## headers to break it up. Make it something a Mariners fan would actually want to read and share.`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock) {
      return NextResponse.json({ error: 'No content generated' }, { status: 500 });
    }

    let parsed;
    try {
      parsed = JSON.parse(textBlock.text.trim());
    } catch {
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Failed to parse blog post' }, { status: 500 });
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    const { error } = await supabase.from('blog_posts').insert({
      slug: parsed.slug || parsed.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title: parsed.title,
      content: parsed.content,
      excerpt: parsed.excerpt,
      tags: parsed.tags || [],
      author: 'mark',
      is_published: true,
      published_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to save blog post:', error);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    return NextResponse.json({ success: true, title: parsed.title });
  } catch (error) {
    console.error('Mark blog cron error:', error);
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
  }
}
