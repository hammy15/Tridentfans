/**
 * Cleanup fake seed users
 * Run when you have 25+ real users: npx tsx scripts/cleanup-fake-users.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('Finding seed users...\n');

  // Find all users with @tridentfans-seed.local email
  const { data: allUsers } = await supabase.auth.admin.listUsers({ perPage: 100 });

  const seedUsers = allUsers?.users?.filter(
    u => u.email?.endsWith('@tridentfans-seed.local') ||
         u.user_metadata?.is_seed_user === true
  ) || [];

  console.log(`Found ${seedUsers.length} seed users\n`);

  for (const user of seedUsers) {
    // Delete forum comments by this user
    await supabase.from('forum_comments').delete().eq('user_id', user.id);

    // Delete forum posts by this user
    await supabase.from('forum_posts').delete().eq('user_id', user.id);

    // Delete predictions
    await supabase.from('user_predictions').delete().eq('user_id', user.id);

    // Delete profile
    await supabase.from('profiles').delete().eq('id', user.id);

    // Delete auth user
    const { error } = await supabase.auth.admin.deleteUser(user.id);

    if (error) {
      console.error(`  [error] ${user.email}: ${error.message}`);
    } else {
      console.log(`  [deleted] ${user.email}`);
    }
  }

  console.log('\nCleanup complete!');
}

main().catch(console.error);
