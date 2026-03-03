import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Check if bot mode is enabled for a personality
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  // Only captain_hammy and spartan can have bot mode toggled
  if (id !== 'captain_hammy' && id !== 'spartan') {
    return NextResponse.json({ botModeEnabled: true }); // Mark is always AI
  }

  try {
    const { data, error } = await supabase
      .from('bot_configurations')
      .select('is_active')
      .eq('bot_id', id)
      .single();

    if (error) {
      // Default to bot mode enabled if not found
      return NextResponse.json({ botModeEnabled: true });
    }

    // is_active = true means bot mode is ON (AI responds)
    // is_active = false means bot mode is OFF (real person responds)
    return NextResponse.json({ botModeEnabled: data.is_active });
  } catch {
    return NextResponse.json({ botModeEnabled: true });
  }
}

// POST - Toggle bot mode for a personality (admin only)
export async function POST(request: NextRequest) {
  try {
    const { id, enabled, password } = await request.json();

    // Simple password check (in production, use proper auth)
    if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id || enabled === undefined) {
      return NextResponse.json({ error: 'Missing id or enabled parameter' }, { status: 400 });
    }

    // Only captain_hammy and spartan can have bot mode toggled
    if (id !== 'captain_hammy' && id !== 'spartan') {
      return NextResponse.json(
        { error: 'Cannot toggle bot mode for this personality' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('bot_configurations')
      .update({ is_active: enabled, updated_at: new Date().toISOString() })
      .eq('bot_id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update bot mode' }, { status: 500 });
    }

    return NextResponse.json({ success: true, botModeEnabled: enabled });
  } catch {
    return NextResponse.json({ error: 'Failed to update bot mode' }, { status: 500 });
  }
}
