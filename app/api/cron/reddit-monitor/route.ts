import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { findEngagementOpportunities, monitorMentions, getTrendingTopics } from '@/lib/reddit-monitor';
import Anthropic from '@anthropic-ai/sdk';
import { MARK_SYSTEM_PROMPT, MARK_CONTENT_VOICE } from '@/lib/mark-soul';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Reddit monitoring cron - runs every 30 minutes
// Finds engagement opportunities and creates response suggestions
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Starting Reddit monitoring sweep...');

    const results = {
      opportunities: 0,
      mentions: 0,
      trending: 0,
      posts_queued: 0,
    };

    // 1. Find engagement opportunities
    const opportunities = await findEngagementOpportunities();
    console.log(`Found ${opportunities.length} engagement opportunities`);
    
    // Store top opportunities in database for review
    for (const opp of opportunities.slice(0, 10)) { // Top 10 only
      try {
        await supabase.from('reddit_opportunities').insert({
          reddit_id: opp.id,
          type: opp.type,
          subreddit: opp.subreddit,
          title: opp.title,
          content: opp.content,
          url: opp.url,
          relevance_score: opp.relevanceScore,
          suggested_persona: opp.suggestedPersona,
          suggested_response: opp.suggestedResponse,
          keywords: opp.keywords,
          status: 'pending', // pending, approved, posted, skipped
          created_at: new Date().toISOString(),
        });
        results.opportunities++;
      } catch (error) {
        // Likely duplicate - skip
        console.log(`Skipping duplicate opportunity: ${opp.id}`);
      }
    }

    // 2. Monitor for mentions of TridentFans
    const mentions = await monitorMentions();
    console.log(`Found ${mentions.length} mentions`);
    
    for (const mention of mentions) {
      try {
        await supabase.from('reddit_opportunities').insert({
          reddit_id: mention.id,
          type: 'mention',
          subreddit: mention.subreddit,
          title: mention.title,
          content: mention.content,
          url: mention.url,
          relevance_score: mention.relevanceScore,
          suggested_persona: 'mark',
          suggested_response: mention.suggestedResponse,
          keywords: mention.keywords,
          status: 'high_priority', // Auto-prioritize mentions
          created_at: new Date().toISOString(),
        });
        results.mentions++;
      } catch (error) {
        console.log(`Skipping duplicate mention: ${mention.id}`);
      }
    }

    // 3. Get trending topics for content ideas
    const trending = await getTrendingTopics();
    console.log(`Found ${trending.length} trending topics`);
    
    // Store trending topics for Mark's content creation
    for (const topic of trending.slice(0, 5)) { // Top 5 trending
      try {
        await supabase.from('content_ideas').insert({
          source: 'reddit_trending',
          topic: topic.topic,
          frequency: topic.count,
          sample_posts: topic.posts.map(p => ({ title: p.title, url: p.permalink })),
          created_at: new Date().toISOString(),
          status: 'new',
        });
        results.trending++;
      } catch (error) {
        console.log(`Topic already tracked: ${topic.topic}`);
      }
    }

    // 4. Generate natural TridentFans content based on trending topics
    if (trending.length > 0) {
      const topTrending = trending[0];
      
      try {
        const contentResponse = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          system: `${MARK_SYSTEM_PROMPT}

${MARK_CONTENT_VOICE.marketing}

You're creating Reddit-ready content that naturally promotes TridentFans without being salesy. 

Create a JSON response:
{"reddit_post": "Natural Reddit post/comment that mentions TridentFans organically", "forum_topic": "Discussion topic for TridentFans forum based on this trend"}

Make it sound like a real fan excited to share, not marketing. Use the trending topic as inspiration.`,
          messages: [
            {
              role: 'user',
              content: `The hottest Mariners topic on Reddit right now is "${topTrending.topic}" with ${topTrending.count} mentions. Sample posts: ${topTrending.posts.map(p => p.title).join(', ')}. Create natural content that could drive organic traffic to TridentFans.`,
            },
          ],
        });

        const textBlock = contentResponse.content.find(b => b.type === 'text');
        if (textBlock) {
          let parsed;
          try {
            parsed = JSON.parse(textBlock.text.trim());
          } catch {
            const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              parsed = JSON.parse(jsonMatch[0]);
            }
          }

          if (parsed) {
            // Store the generated content for review/posting
            await supabase.from('generated_content').insert({
              type: 'reddit_organic',
              title: `Trending: ${topTrending.topic}`,
              content: parsed.reddit_post,
              metadata: {
                forum_topic: parsed.forum_topic,
                trending_data: topTrending,
              },
              created_by: 'mark',
              status: 'draft',
              created_at: new Date().toISOString(),
            });
            results.posts_queued++;
          }
        }
      } catch (error) {
        console.error('Failed to generate content from trending topic:', error);
      }
    }

    console.log('✅ Reddit monitoring complete:', results);

    return NextResponse.json({
      success: true,
      message: 'Reddit monitoring sweep complete',
      results,
    });

  } catch (error) {
    console.error('Reddit monitoring cron error:', error);
    return NextResponse.json({ 
      error: 'Reddit monitoring failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Manual trigger for testing
export async function POST(request: NextRequest) {
  const { password } = await request.json();
  
  if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD && password !== 'mariners2026') {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  // Run the same logic as GET but return more detailed results
  try {
    const opportunities = await findEngagementOpportunities();
    const mentions = await monitorMentions();
    const trending = await getTrendingTopics();

    return NextResponse.json({
      success: true,
      opportunities: opportunities.slice(0, 5), // Top 5 for preview
      mentions,
      trending: trending.slice(0, 3), // Top 3 for preview
      summary: {
        total_opportunities: opportunities.length,
        high_relevance: opportunities.filter(o => o.relevanceScore > 15).length,
        mentions_found: mentions.length,
        trending_topics: trending.length,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Manual Reddit monitoring failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}