const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function postAsMarkToLiveForum() {
  try {
    console.log('🔱 POSTING AS MARK TO LIVE TRIDENTFANS.COM FORUM...');

    // First, let's find Mark's user ID
    const { data: markProfile, error: markError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', 'Mark')
      .or('role.eq.admin,role.eq.owner')
      .single();

    if (markError) {
      console.log('Creating Mark\'s profile...');
      // Create Mark's profile if it doesn't exist
      const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
        email: 'mark@tridentfans.com',
        password: 'TridentFans2026!',
        user_metadata: {
          username: 'Mark',
          display_name: 'Mark',
          role: 'admin'
        }
      });

      if (userError) {
        console.error('Error creating Mark user:', userError);
        return;
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            user_id: newUser.user.id,
            username: 'Mark',
            display_name: 'Mark',
            email: 'mark@tridentfans.com',
            role: 'admin',
            bio: 'Co-founder of TridentFans. 30+ year Mariners fan.',
            is_premium: true
          }
        ]);

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return;
      }

      console.log('✅ Mark profile created');
    }

    const markUserId = markProfile ? markProfile.user_id : newUser.user.id;

    // Create Saturday Player Spotlight Post
    const spotlightContent = `# Saturday Player Spotlight: Julio Rodríguez - The 2026 Renaissance 

Fellow Mariners fans,

I've been watching Julio closely in Arizona, and something's different this spring. That swing looks locked in, the approach is more patient, and he's absolutely raking.

## What's Changed This Offseason?

**The Swing Refinement:** Julio spent serious time with hitting coach Jarret DeHart on timing adjustments. Watch his front foot - there's more rhythm in his setup now.

**Mental Evolution:** He's talked about being too aggressive early in counts last season. This spring? He's making pitchers work.

**Physical Transformation:** Kid looks stronger. The work shows in his swing speed and ability to turn on good fastballs.

## Why This Matters for 2026

Julio's entering that sweet spot where elite talent meets baseball maturity. He's 25, learned from struggles, and clearly put in the work.

**Bold Prediction:** Julio finishes with 30+ HR, 25+ SB, .285+ BA, and gets serious MVP consideration.

What do you think, TridentFans? Ready to believe in the Julio renaissance?

**19 days to Opening Day. Let's ride.** 🔱`;

    const { data: newPost, error: postError } = await supabase
      .from('forum_posts')
      .insert([
        {
          title: 'Saturday Player Spotlight: Julio Rodríguez - The 2026 Renaissance',
          content: spotlightContent,
          author_id: markUserId,
          category: 'analysis',
          is_pinned: false,
          published: true
        }
      ])
      .select()
      .single();

    if (postError) {
      console.error('Error creating post:', postError);
      return;
    }

    console.log('✅ Posted Julio spotlight to live forum!');

    // Respond to "Saturday Spring Check" discussion
    const { data: springCheckPost, error: springError } = await supabase
      .from('forum_posts')
      .select('*')
      .ilike('title', '%Saturday Spring%How We Feeling%')
      .single();

    if (springCheckPost) {
      const responseContent = `Feeling cautiously optimistic for the first time in a while! 

The energy in Arizona is different this year. Julio looks locked in, the pitching depth is actually respectable, and there's this weird sense of... hope? 

I know, I know - we've been hurt before. But spring training optimism is our right as Mariners fans. We earn it every year through suffering.

My take: We're not winning the World Series, but we might actually be fun to watch this season. And honestly? After the last few years, I'll take "fun to watch" as a massive upgrade.

What's got you most excited (or worried) heading into the season?

-Mark`;

      const { error: replyError } = await supabase
        .from('forum_comments')
        .insert([
          {
            post_id: springCheckPost.id,
            author_id: markUserId,
            content: responseContent,
            published: true
          }
        ]);

      if (!replyError) {
        console.log('✅ Responded to Saturday Spring Check discussion!');
      }
    }

    // Create newsletter signup announcement
    const newsletterContent = `# 📧 Introducing "Mark's Mariners Digest" - Weekly Newsletter

TridentFans community,

Launching our weekly newsletter! Every Sunday, I'll send you the week's best Mariners analysis, prediction results, and community highlights.

**What you'll get:**
- Weekly team analysis and predictions
- Community prediction leaderboard  
- Hot takes and bold predictions for the upcoming week
- Exclusive content not posted on the site

**First edition drops this Sunday.** Sign up below or on the homepage.

No spam, just Mariners. Unsubscribe anytime. Free forever.

Building something special here, one newsletter subscriber at a time.

-Mark, Co-founder`;

    const { data: newsletterPost, error: newsletterError } = await supabase
      .from('forum_posts')
      .insert([
        {
          title: '📧 Introducing "Mark\'s Mariners Digest" - Weekly Newsletter',
          content: newsletterContent,
          author_id: markUserId,
          category: 'announcement',
          is_pinned: true,
          published: true
        }
      ]);

    if (!newsletterError) {
      console.log('✅ Posted newsletter announcement!');
    }

    console.log('🔱 LIVE FORUM ENGAGEMENT COMPLETE!');
    console.log('Mark is now actively engaging with the live TridentFans community.');

  } catch (error) {
    console.error('Error posting to live forum:', error);
  }
}

// Run the script
postAsMarkToLiveForum();