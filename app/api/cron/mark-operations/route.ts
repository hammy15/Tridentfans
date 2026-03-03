import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { monitorMarinersNews, storeNewsItem, createCommunityPostFromNews } from '@/lib/news-aggregator';
import { findEngagementOpportunities, monitorMentions } from '@/lib/reddit-monitor';
import { getDashboardData, generateGameContent } from '@/lib/live-data-scraper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Mark's comprehensive daily operations cron
// Runs every 30 minutes during active hours (6 AM - 11 PM PT)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const hour = now.getHours();
    
    // Only run during Mark's active hours (6 AM - 11 PM PT)
    if (hour < 6 || hour > 23) {
      return NextResponse.json({ 
        success: true, 
        message: 'Outside active hours - Mark is sleeping',
        skipped: true 
      });
    }

    console.log('🚀 Mark\'s operations starting...');

    const results = {
      site_health: 'ok',
      news_monitored: 0,
      posts_created: 0,
      reddit_opportunities: 0,
      community_engagement: 0,
      system_maintenance: 'completed',
      errors: []
    };

    // 1. Site Health Check
    await performSiteHealthCheck(results);
    
    // 2. News Monitoring & Content Creation
    await monitorAndCreateNewsContent(results);
    
    // 3. Community Engagement Check
    await performCommunityEngagement(results);
    
    // 4. Reddit Monitoring (every 2nd run)
    if (hour % 2 === 0) {
      await performRedditMonitoring(results);
    }
    
    // 5. Game Day Operations (if applicable)
    await performGameDayOperations(results);
    
    // 6. Business Metrics Update
    await updateBusinessMetrics(results);
    
    // 7. System Maintenance
    await performSystemMaintenance(results);

    console.log('✅ Mark\'s operations complete:', results);

    return NextResponse.json({
      success: true,
      message: `Mark's operations completed - ${hour}:${now.getMinutes().toString().padStart(2, '0')} PT`,
      results,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('Mark\'s operations failed:', error);
    return NextResponse.json({ 
      error: 'Mark operations failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Site Health & Performance Check
 */
async function performSiteHealthCheck(results: any): Promise<void> {
  try {
    // Check database connectivity
    const { data: healthCheck } = await supabase
      .from('forum_posts')
      .select('id')
      .limit(1);
    
    if (!healthCheck) {
      results.site_health = 'database_issue';
      results.errors.push('Database connectivity issue');
    }
    
    // Check for new member registrations in last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { count: newMembers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .gte('created_at', thirtyMinutesAgo);
    
    // Welcome new members personally
    if (newMembers && newMembers > 0) {
      await welcomeNewMembers(thirtyMinutesAgo);
      results.community_engagement += newMembers;
    }
    
  } catch (error) {
    results.errors.push(`Health check failed: ${error}`);
  }
}

/**
 * Monitor Mariners News & Create Content
 */
async function monitorAndCreateNewsContent(results: any): Promise<void> {
  try {
    // Monitor for breaking Mariners news
    const news = await monitorMarinersNews();
    results.news_monitored = news.length;
    
    // Process high-impact news
    for (const newsItem of news.filter(n => n.impact_level === 'high')) {
      try {
        // Store news item
        await storeNewsItem(newsItem);
        
        // Create community post if warranted
        if (newsItem.requires_response) {
          const postId = await createCommunityPostFromNews(newsItem);
          if (postId) {
            results.posts_created++;
          }
        }
        
      } catch (error) {
        results.errors.push(`News processing failed: ${error}`);
      }
    }
    
  } catch (error) {
    results.errors.push(`News monitoring failed: ${error}`);
  }
}

/**
 * Community Engagement & Moderation
 */
async function performCommunityEngagement(results: any): Promise<void> {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    // Check for new comments needing responses
    const { data: recentComments } = await supabase
      .from('forum_comments')
      .select(`
        id, content, post_id, user_id,
        forum_posts(title, author_display_name)
      `)
      .gte('created_at', thirtyMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(20);
    
    // Respond to comments that mention Mark or ask questions
    for (const comment of recentComments || []) {
      if (needsMarkResponse(comment)) {
        await respondToComment(comment);
        results.community_engagement++;
      }
    }
    
    // Check for posts needing moderation
    const { data: flaggedContent } = await supabase
      .from('forum_posts')
      .select('id, title, content, reported_count')
      .gt('reported_count', 0)
      .is('moderation_status', null);
    
    for (const post of flaggedContent || []) {
      await moderateContent(post);
    }
    
  } catch (error) {
    results.errors.push(`Community engagement failed: ${error}`);
  }
}

/**
 * Reddit Monitoring for Organic Growth
 */
async function performRedditMonitoring(results: any): Promise<void> {
  try {
    // Find new Reddit engagement opportunities
    const opportunities = await findEngagementOpportunities();
    results.reddit_opportunities = opportunities.length;
    
    // Store top opportunities for review
    for (const opportunity of opportunities.slice(0, 5)) {
      await supabase
        .from('reddit_opportunities')
        .upsert({
          reddit_id: opportunity.id,
          type: opportunity.type,
          subreddit: opportunity.subreddit,
          title: opportunity.title,
          url: opportunity.url,
          relevance_score: opportunity.relevanceScore,
          suggested_persona: opportunity.suggestedPersona,
          suggested_response: opportunity.suggestedResponse,
          status: 'pending'
        }, { onConflict: 'reddit_id' });
    }
    
    // Check for TridentFans mentions
    const mentions = await monitorMentions();
    for (const mention of mentions) {
      await supabase
        .from('reddit_opportunities')
        .upsert({
          reddit_id: mention.id,
          type: 'mention',
          subreddit: mention.subreddit,
          title: mention.title,
          url: mention.url,
          relevance_score: mention.relevanceScore,
          suggested_persona: 'mark',
          suggested_response: mention.suggestedResponse,
          status: 'high_priority'
        }, { onConflict: 'reddit_id' });
    }
    
  } catch (error) {
    results.errors.push(`Reddit monitoring failed: ${error}`);
  }
}

/**
 * Game Day Operations
 */
async function performGameDayOperations(results: any): Promise<void> {
  try {
    // Check if Mariners are playing today
    const dashboardData = await getDashboardData();
    
    if (dashboardData?.liveGame) {
      const gameContent = await generateGameContent(dashboardData.liveGame.id);
      
      if (gameContent) {
        // Create social media ready content
        await supabase
          .from('generated_content')
          .insert({
            type: 'game_content',
            title: `Game Content: ${dashboardData.liveGame.opponent}`,
            content: JSON.stringify(gameContent),
            created_by: 'mark',
            status: 'ready_to_post'
          });
        
        results.posts_created++;
      }
    }
    
  } catch (error) {
    results.errors.push(`Game day operations failed: ${error}`);
  }
}

/**
 * Business Metrics & Revenue Tracking
 */
async function updateBusinessMetrics(results: any): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Track daily statistics
    const stats = {
      date: today,
      new_members: 0,
      active_users: 0,
      posts_created: results.posts_created,
      comments_count: 0,
      predictions_made: 0,
      affiliate_clicks: 0,
      revenue_earned: 0
    };
    
    // Get today's metrics
    const [
      { count: newMembers },
      { count: todayComments },
      { count: todayPredictions },
      { count: affiliateClicks }
    ] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .gte('created_at', today + 'T00:00:00Z'),
      
      supabase
        .from('forum_comments')
        .select('*', { count: 'exact' })
        .gte('created_at', today + 'T00:00:00Z'),
      
      supabase
        .from('user_predictions')
        .select('*', { count: 'exact' })
        .gte('submitted_at', today + 'T00:00:00Z'),
      
      supabase
        .from('affiliate_clicks')
        .select('*', { count: 'exact' })
        .gte('clicked_at', today + 'T00:00:00Z')
    ]);
    
    stats.new_members = newMembers || 0;
    stats.comments_count = todayComments || 0;
    stats.predictions_made = todayPredictions || 0;
    stats.affiliate_clicks = affiliateClicks || 0;
    
    // Store daily stats
    await supabase
      .from('daily_stats')
      .upsert({
        date: today,
        ...stats
      }, { onConflict: 'date' });
    
  } catch (error) {
    results.errors.push(`Metrics update failed: ${error}`);
  }
}

/**
 * System Maintenance & Optimization
 */
async function performSystemMaintenance(results: any): Promise<void> {
  try {
    // Clean up old data
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Remove old skipped Reddit opportunities
    await supabase
      .from('reddit_opportunities')
      .delete()
      .eq('status', 'skipped')
      .lt('created_at', sevenDaysAgo);
    
    // Update game thread statuses
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    
    await supabase
      .from('forum_posts')
      .update({ is_locked: true })
      .eq('is_game_thread', true)
      .eq('is_locked', false)
      .lt('game_start_time', threeHoursAgo);
    
    results.system_maintenance = 'completed';
    
  } catch (error) {
    results.errors.push(`System maintenance failed: ${error}`);
  }
}

/**
 * Helper Functions
 */
async function welcomeNewMembers(since: string): Promise<void> {
  const { data: newMembers } = await supabase
    .from('user_profiles')
    .select('id, display_name, email')
    .gte('created_at', since);
  
  for (const member of newMembers || []) {
    // Send welcome message
    await supabase
      .from('direct_messages')
      .insert({
        to_user_id: member.id,
        from_user_id: 'system-mark-id',
        message: `Welcome to TridentFans, ${member.display_name}! 

I'm Mark, the owner of this community. Great to have another Mariners fan join us!

Check out our prediction games and jump into the discussions. Don't be shy - this is a place for all M's fans, from casual to obsessed.

**Go M's!** ⚓`,
        message_type: 'welcome'
      });
  }
}

function needsMarkResponse(comment: any): boolean {
  const content = comment.content.toLowerCase();
  const triggers = ['@mark', 'mark', '?', 'question', 'help', 'what do you think'];
  return triggers.some(trigger => content.includes(trigger));
}

async function respondToComment(comment: any): Promise<void> {
  // Generate contextual response based on comment content
  const response = generateMarkResponse(comment);
  
  await supabase
    .from('forum_comments')
    .insert({
      post_id: comment.post_id,
      content: response,
      author_display_name: 'Mark',
      author_emoji: '⚓',
      user_id: 'system-mark-id',
      reply_to_comment_id: comment.id
    });
}

function generateMarkResponse(comment: any): string {
  // In a real implementation, this would use AI to generate contextual responses
  const responses = [
    "Great point! That's exactly the kind of analysis that makes this community special.",
    "I hadn't thought about it that way - thanks for the perspective!",
    "Totally agree. That's been bugging me about this team too.",
    "Interesting take! What makes you see it that way?",
    "You might be onto something there. Keep an eye on that trend."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)] + "\n\n**Go M's!** ⚓";
}

async function moderateContent(post: any): Promise<void> {
  // Auto-moderate based on simple rules
  if (post.reported_count > 3) {
    await supabase
      .from('forum_posts')
      .update({ 
        moderation_status: 'under_review',
        is_visible: false 
      })
      .eq('id', post.id);
  }
}

export { performSiteHealthCheck, monitorAndCreateNewsContent, performCommunityEngagement };