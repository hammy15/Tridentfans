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

// Mark's social media content cron
// Generates shareable social posts that Mark can auto-publish or queue
// Runs daily — creates Twitter-ready content and Reddit post drafts
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recent forum activity for content ideas
    const { data: recentPosts } = await supabase
      .from('forum_posts')
      .select('title, content, is_game_thread')
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: recentBlogs } = await supabase
      .from('blog_posts')
      .select('title, excerpt')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(3);

    const context = {
      recentTopics: recentPosts?.map(p => p.title) || [],
      recentBlogs: recentBlogs?.map(b => ({ title: b.title, excerpt: b.excerpt })) || [],
    };

    // Generate Twitter-style posts
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: `${MARK_SYSTEM_PROMPT}

${MARK_CONTENT_VOICE.marketing}

You're creating social media posts to promote TridentFans. These need to be shareable, engaging, and drive traffic to tridentfans.com.

Create 3 posts:
1. A Twitter/X post (max 280 chars) — promote the site or a discussion
2. A Reddit-style post title + short body — for r/Mariners or r/baseball
3. A community engagement post — ask a question that sparks debate

Respond with ONLY a JSON object:
{"twitter": "the tweet text with link", "reddit_title": "reddit post title", "reddit_body": "reddit post body (2-3 sentences)", "engagement": "the engagement question"}

Include https://tridentfans.com in the Twitter post. No profanity. Sound human. Be genuine, not salesy.
Do NOT include markdown code fences.`,
      messages: [
        {
          role: 'user',
          content: `Create today's social posts. Recent forum topics: ${context.recentTopics.join(', ')}. Recent blogs: ${context.recentBlogs.map(b => b.title).join(', ')}. Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`,
        },
      ],
    });

    const textBlock = response.content.find(b => b.type === 'text');
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

    // Store social posts for review/auto-publishing
    await supabase.from('blog_posts').insert({
      slug: `social-${new Date().toISOString().split('T')[0]}`,
      title: `Social Posts — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      content: JSON.stringify(parsed, null, 2),
      excerpt: parsed.twitter,
      tags: ['social', 'marketing'],
      author: 'mark',
      is_published: false, // Queue for review
    });

    // If Twitter API is configured, auto-post
    if (process.env.TWITTER_BEARER_TOKEN) {
      try {
        await fetch('https://api.twitter.com/2/tweets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: parsed.twitter }),
        });
      } catch (twitterError) {
        console.error('Twitter post failed:', twitterError);
      }
    }

    return NextResponse.json({
      success: true,
      twitter: parsed.twitter,
      reddit: { title: parsed.reddit_title, body: parsed.reddit_body },
      engagement: parsed.engagement,
    });
  } catch (error) {
    console.error('Mark social cron error:', error);
    return NextResponse.json({ error: 'Social content failed' }, { status: 500 });
  }
}
