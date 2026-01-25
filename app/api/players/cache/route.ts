import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE() {
  try {
    // Clear player stats cache
    const { error: statsError } = await supabase
      .from('player_stats_cache')
      .delete()
      .neq('player_id', 0); // Delete all rows

    if (statsError) {
      console.error('Error clearing player stats cache:', statsError);
    }

    // Clear search cache
    const { error: searchError } = await supabase
      .from('player_search_cache')
      .delete()
      .neq('query', ''); // Delete all rows

    if (searchError) {
      console.error('Error clearing player search cache:', searchError);
    }

    return NextResponse.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Cache DELETE error:', error);
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}
