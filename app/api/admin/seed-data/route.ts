import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Sample usernames
const SAMPLE_USERNAMES = [
  'SeattleSogKing',
  'JulioFan2024',
  'TrueToTheBlue',
  'RefuseToLose',
  'MarinersForLife',
  'BigDumperCal',
  'GardenLevel247',
  'KingsDome_Kid',
  'EdgarsFan42',
  'SafecoNights',
];

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
  {
    title: 'Castillo is our ace and its not even close',
    content: `Since coming to Seattle, Luis Castillo has been absolutely dominant. The stuff, the confidence, the big game moments.

This is the guy we've been waiting for since Felix left. Lets appreciate what we have!`,
    category_slug: 'roster',
  },
  {
    title: 'Pre-game meetup spots near T-Mobile?',
    content: `Looking for recommendations for bars/restaurants near the stadium for pre-game hangs.

Preferably somewhere with good food, not too crowded, and fellow Ms fans. SoDo or Pioneer Square area preferred.`,
    category_slug: 'stadium',
  },
  {
    title: 'Dipoto deserves more credit',
    content: `Unpopular opinion maybe, but Jerry has actually built a solid team here.

- Drafted J-Rod, Kirby, Gilbert
- Traded for Castillo
- Built the best farm system in the AL West

Yeah some moves havent worked but show me a GM who bats 1.000. Thoughts?`,
    category_slug: 'trade-talk',
  },
];

// Sample comments
const SAMPLE_COMMENTS = [
  "Couldn't agree more! This is our year!",
  'Great analysis. I think you\'re onto something here.',
  'The garlic fries are a must. Trust me on this one.',
  'J-Rod is generational. We need to build around him.',
  'I was at game 116. Best sports moment of my life.',
  "Let's gooo! True to the Blue! 🔱",
  "This is the content I'm here for.",
  'Finally someone with some optimism around here!',
  'Subscribe! This is the way.',
  'Big if true. Hope youre right!',
  'Been saying this for months. Glad others see it too.',
  'Idk man, weve been burned before...',
  'REFUSE TO LOSE!!!',
  'This team is different. I can feel it.',
  'Great post OP. Quality content as always.',
];

// GET - Check seed status
export async function GET() {
  try {
    const { count: postCount } = await supabase
      .from('forum_posts')
      .select('id', { count: 'exact', head: true });

    const { count: profileCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    const { count: predictionCount } = await supabase
      .from('prediction_games')
      .select('id', { count: 'exact', head: true });

    return NextResponse.json({
      profiles: profileCount || 0,
      posts: postCount || 0,
      predictions: predictionCount || 0,
      seeded: (postCount || 0) > 0 || (profileCount || 0) > 0,
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
      profiles: 0,
      posts: 0,
      comments: 0,
      predictions: 0,
      userPredictions: 0,
      botPredictions: 0,
      conversations: 0,
    };

    // Create sample profiles
    const profileIds: string[] = [];
    for (const username of SAMPLE_USERNAMES) {
      // Check if profile with this username exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .single();

      if (existing) {
        profileIds.push(existing.id);
        continue;
      }

      // Create new profile with random UUID
      const id = crypto.randomUUID();
      const { error } = await supabase.from('profiles').insert({
        id,
        username: username.toLowerCase(),
        display_name: username,
        role: 'member',
      });

      if (!error) {
        profileIds.push(id);
        results.profiles++;
      }
    }

    // Get categories
    const { data: categories } = await supabase.from('forum_categories').select('id, slug');
    const categoryMap = Object.fromEntries(categories?.map(c => [c.slug, c.id]) || []);

    // Create forum posts
    for (const post of SAMPLE_POSTS) {
      const categoryId = categoryMap[post.category_slug];
      if (!categoryId) continue;

      const randomUserId = profileIds[Math.floor(Math.random() * profileIds.length)];

      const { data: newPost, error } = await supabase
        .from('forum_posts')
        .insert({
          title: post.title,
          content: post.content,
          category_id: categoryId,
          user_id: randomUserId,
          upvotes: Math.floor(Math.random() * 80) + 10,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create post:', error.message);
        continue;
      }

      results.posts++;

      // Add comments
      const commentCount = Math.floor(Math.random() * 5) + 2;
      for (let i = 0; i < commentCount; i++) {
        const randomComment = SAMPLE_COMMENTS[Math.floor(Math.random() * SAMPLE_COMMENTS.length)];
        const commentUserId = profileIds[Math.floor(Math.random() * profileIds.length)];

        const { error: commentError } = await supabase.from('forum_comments').insert({
          post_id: newPost.id,
          user_id: commentUserId,
          content: randomComment,
          upvotes: Math.floor(Math.random() * 30),
        });

        if (!commentError) results.comments++;
      }
    }

    // Create prediction games
    const today = new Date();
    const opponents = [
      { name: 'Los Angeles Angels', abbr: 'LAA' },
      { name: 'Texas Rangers', abbr: 'TEX' },
      { name: 'Houston Astros', abbr: 'HOU' },
      { name: 'Oakland Athletics', abbr: 'OAK' },
      { name: 'New York Yankees', abbr: 'NYY' },
      { name: 'Boston Red Sox', abbr: 'BOS' },
      { name: 'Chicago White Sox', abbr: 'CWS' },
    ];

    const gameIds: string[] = [];
    for (let i = 0; i < 7; i++) {
      const gameDate = new Date(today.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
      const opponent = opponents[i % opponents.length];

      const { data: game, error } = await supabase
        .from('prediction_games')
        .insert({
          game_date: gameDate.toISOString().split('T')[0],
          game_time: i % 2 === 0 ? '19:10' : '18:40',
          opponent: opponent.name,
          opponent_abbr: opponent.abbr,
          is_home: i % 2 === 0,
          status: 'scheduled',
        })
        .select()
        .single();

      if (!error && game) {
        gameIds.push(game.id);
        results.predictions++;
      }
    }

    // Create some past games with results for leaderboard
    for (let i = 1; i <= 5; i++) {
      const gameDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const opponent = opponents[i % opponents.length];
      const marinersWon = Math.random() > 0.4; // 60% win rate
      const marinersScore = Math.floor(Math.random() * 6) + 2;
      const opponentScore = marinersWon
        ? Math.floor(Math.random() * marinersScore)
        : marinersScore + Math.floor(Math.random() * 4) + 1;

      const { data: game, error } = await supabase
        .from('prediction_games')
        .insert({
          game_date: gameDate.toISOString().split('T')[0],
          game_time: '19:10',
          opponent: opponent.name,
          opponent_abbr: opponent.abbr,
          is_home: i % 2 === 0,
          status: 'completed',
          actual_result: {
            mariners_score: marinersScore,
            opponent_score: opponentScore,
            winner: marinersWon ? 'mariners' : 'opponent',
          },
        })
        .select()
        .single();

      if (!error && game) {
        gameIds.push(game.id);
        results.predictions++;

        // Add user predictions for completed games
        for (const userId of profileIds.slice(0, 6)) {
          const userPredictedMariners = Math.random() > 0.3;
          const predMarinersRuns = Math.floor(Math.random() * 6) + 2;
          const predOpponentRuns = userPredictedMariners
            ? Math.floor(Math.random() * predMarinersRuns)
            : predMarinersRuns + Math.floor(Math.random() * 3) + 1;

          // Calculate score
          let score = 0;
          if ((userPredictedMariners && marinersWon) || (!userPredictedMariners && !marinersWon)) {
            score += 10;
          }
          score += Math.max(0, 5 - Math.abs(predMarinersRuns - marinersScore));
          score += Math.max(0, 5 - Math.abs(predOpponentRuns - opponentScore));

          const { error: predError } = await supabase.from('user_predictions').insert({
            user_id: userId,
            game_id: game.id,
            predictions: {
              winner: userPredictedMariners ? 'mariners' : 'opponent',
              mariners_runs: predMarinersRuns,
              opponent_runs: predOpponentRuns,
            },
            score,
          });

          if (!predError) results.userPredictions++;
        }

        // Add bot predictions for completed games
        for (const botId of ['moose', 'captain_hammy', 'spartan']) {
          const botPredictedMariners = botId === 'spartan' ? Math.random() > 0.5 : Math.random() > 0.35;
          const predMarinersRuns = Math.floor(Math.random() * 5) + 3;
          const predOpponentRuns = botPredictedMariners
            ? Math.floor(Math.random() * predMarinersRuns)
            : predMarinersRuns + Math.floor(Math.random() * 2) + 1;

          let score = 0;
          if ((botPredictedMariners && marinersWon) || (!botPredictedMariners && !marinersWon)) {
            score += 10;
          }
          score += Math.max(0, 5 - Math.abs(predMarinersRuns - marinersScore));
          score += Math.max(0, 5 - Math.abs(predOpponentRuns - opponentScore));

          const { error: botError } = await supabase.from('bot_predictions').insert({
            bot_id: botId,
            game_id: game.id,
            predictions: {
              winner: botPredictedMariners ? 'mariners' : 'opponent',
              mariners_runs: predMarinersRuns,
              opponent_runs: predOpponentRuns,
            },
            reasoning: `Based on my analysis of the matchup against ${opponent.name}.`,
            score,
          });

          if (!botError) results.botPredictions++;
        }
      }
    }

    // Create sample bot conversations
    for (let i = 0; i < 15; i++) {
      const userId = profileIds[Math.floor(Math.random() * profileIds.length)];
      const botId = ['moose', 'captain_hammy', 'spartan'][Math.floor(Math.random() * 3)];

      const { error } = await supabase.from('bot_conversations').insert({
        user_id: userId,
        bot_id: botId,
        messages: [
          { role: 'user', content: 'Hey, what do you think about this season?' },
          { role: 'assistant', content: 'I think we have a real shot this year! The pitching is elite.' },
        ],
      });

      if (!error) results.conversations++;
    }

    // Update leaderboard
    const { data: userScores } = await supabase
      .from('user_predictions')
      .select('user_id, score')
      .not('score', 'is', null);

    const userAggregates = new Map<string, { points: number; predictions: number; correct: number }>();
    userScores?.forEach(score => {
      if (!score.user_id) return;
      const current = userAggregates.get(score.user_id) || { points: 0, predictions: 0, correct: 0 };
      current.points += score.score || 0;
      current.predictions += 1;
      if ((score.score || 0) >= 10) current.correct += 1;
      userAggregates.set(score.user_id, current);
    });

    const sorted = Array.from(userAggregates.entries()).sort((a, b) => b[1].points - a[1].points);
    const season = new Date().getFullYear();

    for (let i = 0; i < sorted.length; i++) {
      const [userId, stats] = sorted[i];
      const accuracy = stats.predictions > 0 ? Math.round((stats.correct / stats.predictions) * 100) : 0;

      await supabase.from('prediction_leaderboard').upsert(
        {
          user_id: userId,
          season,
          total_points: stats.points,
          accuracy,
          rank: i + 1,
        },
        { onConflict: 'user_id,season' }
      );
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Created ${results.profiles} profiles, ${results.posts} posts, ${results.comments} comments, ${results.predictions} games, ${results.userPredictions} user predictions, ${results.botPredictions} bot predictions, ${results.conversations} conversations`,
    });
  } catch (error) {
    console.error('Seed data error:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}
