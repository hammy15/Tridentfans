import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAllMarinersHistory } from '@/lib/mariners-history';

// POST - Seed the mariners_history table with comprehensive data
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // Simple password check
    if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD && password !== 'mariners2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const historyRecords = getAllMarinersHistory();

    // Clear existing history
    const { error: deleteError } = await supabase
      .from('mariners_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('Error clearing history:', deleteError);
    }

    // Insert all history records
    const { data, error } = await supabase
      .from('mariners_history')
      .insert(
        historyRecords.map(record => ({
          category: record.category,
          data: record.data,
        }))
      )
      .select();

    if (error) {
      console.error('Error seeding history:', error);
      return NextResponse.json({ error: 'Failed to seed history' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${data.length} history records`,
      categories: historyRecords.map(r => r.category),
    });
  } catch (error) {
    console.error('Seed history error:', error);
    return NextResponse.json({ error: 'Failed to seed history' }, { status: 500 });
  }
}

// GET - Check current history status
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('mariners_history')
      .select('category, created_at');

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    return NextResponse.json({
      count: data?.length || 0,
      categories: data?.map(d => d.category) || [],
      loaded: (data?.length || 0) > 0,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
