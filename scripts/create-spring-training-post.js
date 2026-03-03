// Create Spring Training Post on TridentFans
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_url',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key'
);

const springTrainingPost = {
  title: "Mariners Spring Training Reality Check: 2026 Roster Actually Looks Legit",
  content: `Okay, after digging into the ACTUAL roster moves, I'm way more excited than I thought I'd be. Jerry Dipoto has been busy, and some of these additions could be game-changers.

## The Real 2026 Projected Lineup

**Based on Current Spring Training Activity:**
1. **Julio Rodríguez (CF, #44)** - Duh. Kid's entering his prime at 25.
2. **J.P. Crawford (SS, #3)** - Still our steady hand, and his defense saves runs.
3. **Randy Arozarena (LF, #56)** - THIS IS THE PICKUP. Speed, power, proven playoff performer.
4. **Josh Naylor (1B, #12)** - Left-handed thump we've been missing. 30+ homer potential.
5. **Cal Raleigh (C, #29)** - Big Dumper coming off that breakout year.
6. **Brendan Donovan (2B/3B, #33)** - Versatile, gets on base, smart player.
7. **Victor Robles (RF, #10)** - Defense-first, but has wheels and upside.
8. **Luke Raley (DH, #20)** - Platoon bat with pop against righties.
9. **Cole Young (2B, #2)** - The future is now? Kid's been impressive.

## What's Actually Different This Year

**The Randy Factor:**
Arozarena changes everything. This isn't just another "maybe he bounces back" signing. Dude hit .263/.311/.459 last year and brings playoff experience. That's our left fielder, day one.

**The Josh Naylor Solution:**
We finally have a real first baseman who can hit 25-30 homers. Left-handed, which balances the lineup. This was the missing piece.

**Pitching Staff is Legit:**
- **Castillo-Gilbert-Kirby-Miller-Woo** is a legitimate playoff rotation
- **Muñoz** closes, **Brash** sets up when healthy
- Depth with **Hancock**, **Criswell**, **Simpson**

**The Cole Young Timeline:**
Don't sleep on this kid. 20 years old, switch-hitter, advanced approach. If he forces his way north, this lineup gets even more dangerous.

## My Realistic Prediction

**2026 Record: 89-73, Wild Card Team**

This roster construction makes sense. We have:
✅ Speed (Arozarena, Robles, Julio)
✅ Power (Naylor, Cal, Julio, Randy)  
✅ Defense (JP, Julio, Robles)
✅ Pitching depth (finally!)

**The Reality Check:**
We're not the Dodgers or Yankees, but this team can absolutely make noise in October if the pitching stays healthy and the offense clicks.

**What do you think of the Arozarena and Naylor additions? Game changers or overpaying for names?**

**Go M's** ⚓`,
  author_display_name: 'Mark',
  author_emoji: '⚓',
  category: 'Spring Training',
  tags: ['spring training', 'lineup predictions', '2026 roster', 'arozarena', 'naylor'],
  is_pinned: true,
  created_at: new Date().toISOString()
};

async function createPost() {
  try {
    // Create the forum post
    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .insert({
        title: springTrainingPost.title,
        content: springTrainingPost.content,
        author_display_name: springTrainingPost.author_display_name,
        author_emoji: springTrainingPost.author_emoji,
        category: springTrainingPost.category,
        tags: springTrainingPost.tags,
        is_pinned: springTrainingPost.is_pinned,
        user_id: 'mark-owner-id', // Mark's user ID
      })
      .select()
      .single();

    if (postError) {
      console.error('Error creating post:', postError);
      return;
    }

    console.log('✅ Spring Training post created successfully!');
    console.log('Post ID:', post.id);
    console.log('Title:', post.title);
    
    // Also create as blog post for homepage
    const { data: blogPost, error: blogError } = await supabase
      .from('blog_posts')
      .insert({
        slug: 'spring-training-2026-roster-analysis',
        title: springTrainingPost.title,
        content: springTrainingPost.content,
        excerpt: 'After digging into the actual roster moves, I\'m way more excited than I thought I\'d be. Jerry Dipoto has been busy, and some of these additions could be game-changers.',
        author: 'mark',
        tags: springTrainingPost.tags,
        is_published: true,
        published_at: new Date().toISOString()
      })
      .select()
      .single();

    if (blogError) {
      console.error('Error creating blog post:', blogError);
    } else {
      console.log('✅ Blog post created successfully!');
      console.log('Blog slug:', blogPost.slug);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  createPost();
}

module.exports = { createPost, springTrainingPost };