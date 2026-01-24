import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Search users for mention autocomplete
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error('Mentions GET error:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}

// POST - Parse content and extract mentions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ mentions: [], parsedContent: '' });
    }

    // Find all @username patterns
    const mentionRegex = /@(\w+)/g;
    const matches = content.match(mentionRegex) || [];
    const usernames = matches.map((m: string) => m.slice(1));

    if (usernames.length === 0) {
      return NextResponse.json({ mentions: [], parsedContent: content });
    }

    // Look up user IDs
    const { data: users } = await supabase
      .from('profiles')
      .select('id, username')
      .in('username', usernames);

    const mentionIds = users?.map(u => u.id) || [];
    const usernameToId = Object.fromEntries(users?.map(u => [u.username, u.id]) || []);

    // Replace @username with linked version for display
    let parsedContent = content;
    users?.forEach(user => {
      parsedContent = parsedContent.replace(
        new RegExp(`@${user.username}\\b`, 'g'),
        `[@${user.username}](/profile/${user.id})`
      );
    });

    return NextResponse.json({
      mentions: mentionIds,
      parsedContent,
      usernameMap: usernameToId,
    });
  } catch (error) {
    console.error('Mentions POST error:', error);
    return NextResponse.json({ error: 'Failed to parse mentions' }, { status: 500 });
  }
}
