// Breaking News: Historic 27-6 Loss + Today's Game Predictions
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_url',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key'
);

const breakingNewsPost = {
  title: "Historic Spring Training Disaster: Mariners Lose 27-6 to Padres in 'One for the Ages'",
  content: `Holy. Absolute. Hell. 

If you missed yesterday's Mariners spring training game against the Padres, consider yourself lucky. This wasn't just a loss—this was a historic embarrassment that had Lookout Landing calling it "one for the ages" and suggesting spring training needs a mercy rule.

**FINAL SCORE: Padres 27, Mariners 6**

Yes, you read that right. Twenty-seven to six. The Padres scored more points than most NFL games.

## How It Went This Wrong

**Luis Castillo started strong:** Worked out of a bases-loaded jam in the first inning with two strikeouts and a groundout. Classic Houdini act.

**Then the second inning happened:** 
- Castillo gave up hard contact, including a first-pitch solo homer
- Back-to-back doubles made it 2-0
- Sloppy defensive play (looking at you, Ryan Bliss) led to more runs
- By the time the smoke cleared: **12-0 after 2 innings**

**The lowlights reel:**
- Tyler Cleveland walked in a run
- Spencer Packard dropped a sun ball in left field  
- Luke Raley lost a ball in the sun in right field
- Stefan Raeth gave up a home run on his FIRST PITCH
- The scoreboard operator made a mistake and briefly showed 11-0 (it was already worse)

**The only bright spot:** Spencer Packard finally making a catch to end that nightmare second inning. The crowd went wild—not kidding.

## Today's Redemption Game: Rangers vs. Mariners

**Game Time:** 3:05 PM MT  
**Location:** Surprise Stadium, Surprise, Arizona  
**Radio Only** (probably for the best after yesterday)

**Starting Pitchers:**
- **Mariners:** Kade Anderson (looking to restore some dignity)
- **Rangers:** Jacob Latz

## Your Predictions for Today

After that historic disaster, how do you think today goes?

**Will the Mariners:**
- [ ] Bounce back with a dominant win (10+ runs)
- [ ] Play a respectable close game (within 3 runs)  
- [ ] Have another rough outing but keep it under 15 runs allowed
- [ ] I'm not mentally prepared for more pain

**Kade Anderson will:**
- [ ] Throw 5+ innings of quality ball
- [ ] Struggle early but settle in
- [ ] Get knocked out in the first 3 innings
- [ ] At least not give up 12 runs in the second inning

**The offense will:**
- [ ] Explode for 8+ runs (we're due)
- [ ] Put up 3-5 runs (respectable)
- [ ] Score 1-2 runs (concerning)
- [ ] Get no-hit (please no)

## The Silver Lining

Look, it's spring training. These games literally don't count. But holy hell, giving up 27 runs is something that sticks with you.

The good news? Nowhere to go but up. And if yesterday taught us anything, it's that we really need to work on playing defense in windy conditions.

**What's your take? Overreaction or legitimate concern? And what are your predictions for today's bounce-back attempt?**

**Go M's** ⚓ (even when they make us question everything)`,
  author_display_name: 'Mark',
  author_emoji: '⚓',
  category: 'Breaking News',
  tags: ['spring training', 'padres', 'rangers', 'breaking news', 'predictions', 'castillo'],
  is_pinned: true,
  created_at: new Date().toISOString()
};

const todaysGamePost = {
  title: "Today's Game: Mariners vs Rangers (3:05 PM) - Bounce Back Time",
  content: `After yesterday's historic 27-6 embarrassment, the Mariners get an immediate chance to restore some dignity against the Texas Rangers.

## Game Details
**Time:** 3:05 PM MT (1:05 PM PT)  
**Location:** Surprise Stadium, Surprise, Arizona  
**Broadcast:** Radio Only

## Starting Matchup
**Kade Anderson (SEA)** vs **Jacob Latz (TEX)**

Anderson gets the ball with a chance to show that yesterday was an anomaly, not a trend. The bar is set pretty low after giving up 27 runs, so anything under double digits feels like a win.

## Pre-Game Prediction Poll

**Final Score Prediction:**
- Mariners 8, Rangers 4 (bounce-back blowout)
- Mariners 5, Rangers 3 (solid recovery)  
- Rangers 6, Mariners 4 (close loss)
- Rangers 9, Mariners 2 (more pain)

**Kade Anderson Performance:**
- 5+ innings, 2 ER or less (bounce back king)
- 4-5 innings, 3-4 ER (respectable)
- 3-4 innings, 5+ ER (struggling)
- Knocked out early (please no)

## What We're Watching For

1. **Can Anderson provide length?** After yesterday's bullpen decimation
2. **Will the offense respond?** Sometimes embarrassment fuels big days
3. **Defensive focus?** Sun balls and routine plays killed us yesterday
4. **Mental toughness?** How does this team bounce back from historic failure?

**Make your predictions below!** ⚓

Time to prove yesterday was a fluke, not a forecast.`,
  author_display_name: 'Mark',
  author_emoji: '⚓',
  category: 'Game Preview',
  tags: ['spring training', 'rangers', 'game preview', 'predictions', 'anderson'],
  is_pinned: false,
  created_at: new Date().toISOString()
};

async function createBreakingNews() {
  try {
    console.log('🚨 Creating breaking news content...');

    // Create the main breaking news post
    const { data: mainPost, error: mainError } = await supabase
      .from('forum_posts')
      .insert({
        title: breakingNewsPost.title,
        content: breakingNewsPost.content,
        author_display_name: breakingNewsPost.author_display_name,
        author_emoji: breakingNewsPost.author_emoji,
        category: breakingNewsPost.category,
        tags: breakingNewsPost.tags,
        is_pinned: breakingNewsPost.is_pinned,
        user_id: 'mark-owner-id',
      })
      .select()
      .single();

    if (mainError) {
      console.error('❌ Error creating main post:', mainError);
      return;
    }

    console.log('✅ Breaking news post created!');
    console.log('Post ID:', mainPost.id);

    // Create today's game preview post  
    const { data: gamePost, error: gameError } = await supabase
      .from('forum_posts')
      .insert({
        title: todaysGamePost.title,
        content: todaysGamePost.content,
        author_display_name: todaysGamePost.author_display_name,
        author_emoji: todaysGamePost.author_emoji,
        category: todaysGamePost.category,
        tags: todaysGamePost.tags,
        is_pinned: todaysGamePost.is_pinned,
        user_id: 'mark-owner-id',
      })
      .select()
      .single();

    if (gameError) {
      console.error('❌ Error creating game post:', gameError);
    } else {
      console.log('✅ Game preview post created!');
      console.log('Game Post ID:', gamePost.id);
    }

    // Create blog version for homepage
    const { data: blogPost, error: blogError } = await supabase
      .from('blog_posts')
      .insert({
        slug: 'historic-27-6-loss-spring-training-disaster',
        title: breakingNewsPost.title,
        content: breakingNewsPost.content,
        excerpt: 'The Mariners suffered a historic 27-6 spring training loss to the Padres yesterday. Today they face the Rangers in a must-bounce-back game.',
        author: 'mark',
        tags: breakingNewsPost.tags,
        is_published: true,
        published_at: new Date().toISOString()
      })
      .select()
      .single();

    if (blogError) {
      console.error('❌ Error creating blog post:', blogError);
    } else {
      console.log('✅ Homepage blog post created!');
      console.log('Blog slug:', blogPost.slug);
    }

    console.log('\n🎯 ALL CONTENT PUBLISHED SUCCESSFULLY!');
    console.log('- Breaking news about 27-6 loss ✅');
    console.log('- Today\'s Rangers game preview ✅');
    console.log('- Homepage blog post ✅');
    console.log('\nTridentFans is now updated with fresh content! 🔱');

  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  createBreakingNews();
}

module.exports = { createBreakingNews, breakingNewsPost, todaysGamePost };