import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Sample forum posts
const SAMPLE_POSTS = [
  {
    title: 'Bold Prediction: Mariners win 95+ games in 2026',
    content: `I know we've been hurt before, but hear me out...

The pitching staff is STACKED. If the bats can just be league average, we're looking at a serious playoff contender.

My predictions:
- Julio hits 35+ HR
- Castillo wins 18 games
- We finally beat Houston in a playoff series

Who's with me? 🔱`,
    category_slug: 'general',
  },
  {
    title: 'Trade Deadline Wishlist Thread',
    content: `With the deadline approaching, let's discuss what moves we NEED to make.

**Must haves:**
- Left-handed power bat
- Bullpen depth (can never have enough)

**Nice to have:**
- Veteran leadership
- Defensive upgrade at 2B

What's on your wishlist? Drop your dream trades below!`,
    category_slug: 'trade-talk',
  },
  {
    title: 'Julio Rodriguez Appreciation Post',
    content: `Can we just take a moment to appreciate what we have in J-Rod?

- 5-tool player
- Incredible work ethic
- Loves Seattle
- Only getting better

We're so lucky to have this guy. Future MVP, book it. 🌟`,
    category_slug: 'roster',
  },
  {
    title: 'Best food at T-Mobile Park?',
    content: `Heading to my first game of the season this weekend! What's everyone's go-to food spot at the park?

I've heard the garlic fries are legendary but want to try something new. Any hidden gems?`,
    category_slug: 'stadium',
  },
  {
    title: 'The 2001 team was magical',
    content: `Was watching old highlights of the 116-win season. Man, that team was special.

Ichiro's rookie year, Boone, Edgar in his prime, the Big Unit memories still fresh...

Any other fans here who watched that season? Share your favorite memories!`,
    category_slug: 'general',
  },
];

// Sample comments
const SAMPLE_COMMENTS = [
  "Couldn't agree more! This is our year!",
  "Great analysis. I think you're onto something here.",
  'The garlic fries are a must. Trust me on this one.',
  'J-Rod is generational. We need to build around him.',
  'I was at game 116. Best sports moment of my life.',
  "Let's gooo! True to the Blue! 🔱",
  "This is the content I'm here for.",
  'Finally someone with some optimism around here!',
];

// GET - Check seed status
export async function GET() {
  try {
    const { count: postCount } = await supabase
      .from('forum_posts')
      .select('id', { count: 'exact', head: true });

    const { count: predictionCount } = await supabase
      .from('prediction_games')
      .select('id', { count: 'exact', head: true });

    return NextResponse.json({
      posts: postCount || 0,
      predictions: predictionCount || 0,
      seeded: (postCount || 0) > 0,
    });
  } catch (error) {
    console.error('Seed status error:', error);
    return NextResponse.json({ error: 'Failed to check seed status' }, { status: 500 });
  }
}

// POST - Seed sample data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD && password !== 'mariners2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      posts: 0,
      comments: 0,
      predictions: 0,
    };

    // Get categories
    const { data: categories } = await supabase.from('forum_categories').select('id, slug');

    const categoryMap = Object.fromEntries(categories?.map(c => [c.slug, c.id]) || []);

    // Create sample forum posts
    for (const post of SAMPLE_POSTS) {
      const categoryId = categoryMap[post.category_slug];
      if (!categoryId) continue;

      const { data: newPost, error } = await supabase
        .from('forum_posts')
        .insert({
          title: post.title,
          content: post.content,
          category_id: categoryId,
          user_id: null, // Anonymous/system posts
          upvotes: Math.floor(Math.random() * 50) + 5,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create post:', error);
        continue;
      }

      results.posts++;

      // Add 2-4 random comments to each post
      const commentCount = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < commentCount; i++) {
        const randomComment = SAMPLE_COMMENTS[Math.floor(Math.random() * SAMPLE_COMMENTS.length)];

        const { error: commentError } = await supabase.from('forum_comments').insert({
          post_id: newPost.id,
          user_id: null,
          content: randomComment,
          upvotes: Math.floor(Math.random() * 20),
        });

        if (!commentError) results.comments++;
      }
    }

    // Create sample prediction games
    const today = new Date();
    const opponents = [
      { name: 'Los Angeles Angels', abbr: 'LAA' },
      { name: 'Texas Rangers', abbr: 'TEX' },
      { name: 'Houston Astros', abbr: 'HOU' },
      { name: 'Oakland Athletics', abbr: 'OAK' },
      { name: 'New York Yankees', abbr: 'NYY' },
    ];

    for (let i = 0; i < 5; i++) {
      const gameDate = new Date(today.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
      const opponent = opponents[i % opponents.length];

      const { error } = await supabase.from('prediction_games').insert({
        game_date: gameDate.toISOString().split('T')[0],
        game_time: '19:10',
        opponent: opponent.name,
        opponent_abbr: opponent.abbr,
        is_home: i % 2 === 0,
        status: 'scheduled',
      });

      if (!error) results.predictions++;
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Created ${results.posts} posts, ${results.comments} comments, ${results.predictions} prediction games`,
    });
  } catch (error) {
    console.error('Seed data error:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}
