/**
 * Seed 25-30 fake users with forum activity
 * Makes the site look alive for new visitors
 *
 * Run with: npx tsx scripts/seed-fake-users.ts
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY to create auth users
 * All fake users have is_seed_user: true in metadata for easy cleanup
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Realistic Seattle-area Mariners fan names
const FAKE_USERS = [
  { username: 'seattlejer', display_name: 'Jeremy K', bio: "Been watching the M's since '01" },
  { username: 'tealtown_mike', display_name: 'Mike T', bio: 'Section 342 regular' },
  { username: 'juliosimp', display_name: 'Sarah L', bio: 'Julio Rodriguez fan account' },
  { username: 'garlic_fries_guy', display_name: 'Dave M', bio: 'T-Mobile Park garlic fries > everything' },
  { username: 'pacnw_ball', display_name: 'Chris R', bio: 'PNW baseball since day one' },
  { username: 'kirby_era', display_name: 'Katie W', bio: 'George Kirby is the future' },
  { username: 'mariners_til_i_die', display_name: 'Ryan B', bio: '1995 changed my life' },
  { username: 'ms_fan_tacoma', display_name: 'Jen P', bio: 'Tacoma to T-Mobile every weekend' },
  { username: 'griffey_kid', display_name: 'Marcus J', bio: 'Grew up watching The Kid' },
  { username: 'cal_rally_cap', display_name: 'Ashley N', bio: 'Cal Raleigh is my catcher' },
  { username: 'edgarsway', display_name: 'Tony V', bio: "Edgar Martinez Way is a real street and that's beautiful" },
  { username: 'buhner_buzz', display_name: 'Paul H', bio: 'Bone played RF the right way' },
  { username: 'rain_city_ball', display_name: 'Megan S', bio: 'Baseball in the rain, naturally' },
  { username: 'ms_since_95', display_name: 'Derek C', bio: 'Refuse to Lose generation' },
  { username: 'proton_therapy', display_name: 'Lisa A', bio: 'The proton treatment at T-Mobile hits different' },
  { username: 'bellingham_fan', display_name: 'Jake F', bio: 'Driving down from Bham for games' },
  { username: 'sodo_mojo', display_name: 'Anna K', bio: 'SoDo Mojo forever' },
  { username: 'felix_king', display_name: 'Carlos G', bio: "King Felix was the greatest. Don't @ me" },
  { username: 'future_is_now', display_name: 'Brittany D', bio: 'This roster is different' },
  { username: 'pnw_hardball', display_name: 'Nate W', bio: 'Mariners + rain + coffee = life' },
  { username: 'kingdome_memories', display_name: 'Linda R', bio: 'I was there for The Double' },
  { username: 'strike_zone_ump', display_name: 'Greg T', bio: 'Angel Hernandez is retired and the game is better' },
  { username: 'rally_fries', display_name: 'Samantha Q', bio: 'Rally fries work. Proven science.' },
  { username: 'al_west_best', display_name: 'Jordan M', bio: 'AL West or bust' },
  { username: 'safeco_kid', display_name: 'Tyler H', bio: "I still call it Safeco. Sorry not sorry." },
  { username: 'dipoto_tracker', display_name: 'Rachel E', bio: 'Tracking every Dipoto move since 2015' },
  { username: 'outfield_grass', display_name: 'Ben O', bio: 'Nothing beats outfield seats on a summer night' },
  { username: 'clutch_hits', display_name: 'Monica Y', bio: 'Live for the big moments' },
];

// Forum posts that fake users would write
const FAKE_POSTS = [
  { title: "This rotation is legit scary", content: "Gilbert, Kirby, and now this bullpen? I don't want to jinx it but this feels different. Actually feels like a playoff rotation for once.\n\nAnyone else cautiously optimistic or is that just me?" },
  { title: "Hot take: Cal Raleigh is a top 5 catcher in the league", content: "Power. Defense. Game-calling. He does it all. And he's only getting better.\n\nChange my mind." },
  { title: "Best food at T-Mobile Park?", content: "Going to my first game of the season next week. What's good this year?\n\nGarlic fries are a given. What else should I try?" },
  { title: "Julio contract watch", content: "Still thinking about that extension. If he stays healthy this could be one of the best deals in baseball.\n\nWho else is watching every at bat with that in mind?" },
  { title: "1995 memories thread", content: "My dad took me to Game 5 of the ALDS. I was 8. I didn't understand what was happening but I knew it mattered. The Kingdome was shaking.\n\nThe Double is the reason I'm a Mariners fan for life. What's your '95 story?" },
  { title: "Prediction game is actually addicting", content: "Just found this site and the prediction game got me hooked immediately. Already climbed to like 15th on the leaderboard lol.\n\nWho's at the top right now? Trying to catch up." },
  { title: "Trade deadline wishlist", content: "What do we realistically need? I think one more bat would put us over the top. The pitching is there.\n\nWho are you targeting?" },
  { title: "Underrated Mariners of all time", content: "Everyone talks about Griffey, Edgar, and Ichiro. But can we give some love to the guys who didn't get enough credit?\n\nI'll start: Jamie Moyer. That man was a wizard." },
  { title: "Game day thread energy is wild here", content: "First game thread I joined on this site and it's actually so much better than Reddit game threads. Less toxic, more actual baseball talk.\n\nShoutout to Mark for keeping it running." },
  { title: "This site > Reddit for Mariners talk", content: "No shade to r/Mariners but this actually feels like a community. People know each other's names here. The predictions add something Reddit doesn't have.\n\nTold 3 friends about it already." },
  { title: "Bold prediction: we win 90+ games this year", content: "Hear me out. The lineup is deeper than last year. The rotation is elite. The bullpen got fixed.\n\n92 wins. Book it." },
  { title: "Who's going to the home opener?", content: "Section 150 checking in. Been to every home opener since 2018.\n\nWhere's everyone sitting?" },
  { title: "The bullpen actually looks good?", content: "Am I dreaming or did we finally figure out the bullpen situation? That 7th-8th-9th combo is nasty.\n\nKnock on wood typing this." },
  { title: "Mark's blog posts are actually solid", content: "Not gonna lie, I came for the predictions but Mark's analysis pieces are keeping me here. The trade deadline breakdown was better than most beat writers.\n\nKeep it up Mark.", category: 'general' },
];

// Comments that feel natural
const FAKE_COMMENTS = [
  "100% agree with this. Been saying the same thing all week",
  "Man I hope you're right. This fan base deserves it",
  "Let's not get ahead of ourselves but... yeah. I feel it too",
  "The garlic fries alone are worth the price of admission lol",
  "Kirby is going to be a Cy Young candidate. Mark my words",
  "This is the content I come here for. Great write-up",
  "My buddy just signed up after I showed him the prediction game",
  "Bold but I love the energy. Go M's",
  "Couldn't agree more. This community is different",
  "That's a spicy take but I respect it",
  "Game threads here are way better than Twitter. Not even close",
  "Been a fan since '03 and this roster gives me hope",
  "Someone had to say it. Well said",
  "I'd add another point — the farm system is stacked too",
  "Same. Literally told my coworker about this place today",
  "Good call. The depth this year is unreal",
  "Real talk. This is the year. I can feel it",
  "Cal is so underrated it hurts. Top 3 catcher easy",
  "Love this community. Reddit could never",
  "Mark coming through with the content as always",
  "Facts. The prediction leaderboard keeps me coming back daily",
  "Went to a game last week and it just hits different this year",
  "Never thought about it that way. Good point",
  "Subscribe to this take. Lock it in",
  "This is why I bookmarked this site",
];

async function main() {
  console.log('Starting fake user seed...\n');

  const createdUserIds: string[] = [];

  // 1. Create auth users
  for (const fakeUser of FAKE_USERS) {
    const email = `${fakeUser.username}@tridentfans-seed.local`;

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: 'SeedUser2026!',
        email_confirm: true,
        user_metadata: {
          username: fakeUser.username,
          display_name: fakeUser.display_name,
          is_seed_user: true,
        },
      });

      if (error) {
        if (error.message?.includes('already been registered')) {
          // Find existing user
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existing = existingUsers?.users?.find(u => u.email === email);
          if (existing) {
            createdUserIds.push(existing.id);
            console.log(`  [exists] ${fakeUser.username}`);
          }
          continue;
        }
        console.error(`  [error] ${fakeUser.username}: ${error.message}`);
        continue;
      }

      if (data.user) {
        createdUserIds.push(data.user.id);

        // Update profile
        await supabase.from('profiles').upsert({
          id: data.user.id,
          username: fakeUser.username,
          display_name: fakeUser.display_name,
          bio: fakeUser.bio,
          role: 'user',
        });

        console.log(`  [created] ${fakeUser.username} (${data.user.id})`);
      }
    } catch (err) {
      console.error(`  [error] ${fakeUser.username}:`, err);
    }
  }

  console.log(`\nCreated ${createdUserIds.length} users\n`);

  if (createdUserIds.length === 0) {
    console.error('No users created. Check your env vars.');
    return;
  }

  // 2. Get forum categories
  const { data: categories } = await supabase
    .from('forum_categories')
    .select('id, slug');

  const generalCat = categories?.find(c => c.slug === 'general');
  if (!generalCat) {
    console.error('No "general" category found');
    return;
  }

  // 3. Create forum posts from random users
  const createdPostIds: string[] = [];

  for (const post of FAKE_POSTS) {
    const randomUser = createdUserIds[Math.floor(Math.random() * createdUserIds.length)];

    const { data: newPost, error } = await supabase
      .from('forum_posts')
      .insert({
        category_id: generalCat.id,
        user_id: randomUser,
        title: post.title,
        content: post.content,
        is_pinned: false,
        is_mark_content: false,
      })
      .select('id')
      .single();

    if (newPost) {
      createdPostIds.push(newPost.id);
      console.log(`  [post] "${post.title}"`);
    } else if (error) {
      console.error(`  [post error] ${post.title}: ${error.message}`);
    }
  }

  console.log(`\nCreated ${createdPostIds.length} posts\n`);

  // 4. Add comments to posts (2-5 per post)
  let commentCount = 0;

  for (const postId of createdPostIds) {
    const numComments = 2 + Math.floor(Math.random() * 4); // 2-5 comments

    for (let i = 0; i < numComments; i++) {
      const randomUser = createdUserIds[Math.floor(Math.random() * createdUserIds.length)];
      const randomComment = FAKE_COMMENTS[Math.floor(Math.random() * FAKE_COMMENTS.length)];

      const { error } = await supabase.from('forum_comments').insert({
        post_id: postId,
        user_id: randomUser,
        content: randomComment,
      });

      if (!error) commentCount++;
    }
  }

  console.log(`Added ${commentCount} comments\n`);

  // 5. Add some upvotes to posts
  for (const postId of createdPostIds) {
    const upvoteCount = 3 + Math.floor(Math.random() * 12); // 3-14 upvotes
    await supabase
      .from('forum_posts')
      .update({ upvotes: upvoteCount })
      .eq('id', postId);
  }

  console.log('Added upvotes to posts\n');

  // 6. Have some users make predictions (if games exist)
  const { data: games } = await supabase
    .from('prediction_games')
    .select('id')
    .eq('status', 'scheduled')
    .limit(3);

  if (games && games.length > 0) {
    let predCount = 0;
    for (const game of games) {
      // 8-15 users predict each game
      const numPredictors = 8 + Math.floor(Math.random() * 8);
      const shuffled = [...createdUserIds].sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(numPredictors, shuffled.length); i++) {
        const marinersWin = Math.random() > 0.35; // Fans are optimistic
        const marinersRuns = Math.floor(Math.random() * 8) + 1;
        const opponentRuns = marinersWin
          ? Math.floor(Math.random() * marinersRuns)
          : marinersRuns + 1 + Math.floor(Math.random() * 3);

        const { error } = await supabase.from('user_predictions').insert({
          user_id: shuffled[i],
          game_id: game.id,
          predictions: {
            winner: marinersWin ? 'mariners' : 'opponent',
            mariners_runs: marinersRuns,
            opponent_runs: opponentRuns,
          },
        });

        if (!error) predCount++;
      }
    }
    console.log(`Created ${predCount} predictions\n`);
  }

  console.log('Done! Site should look alive now.');
  console.log(`\nTo clean up later, run: npx tsx scripts/cleanup-fake-users.ts`);
}

main().catch(console.error);
