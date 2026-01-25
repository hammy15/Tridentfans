import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('comparison_analytics')
      .select('*')
      .order('count', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching popular comparisons:', error);
      return NextResponse.json({ comparisons: [] });
    }

    return NextResponse.json({ comparisons: data || [] });
  } catch (error) {
    console.error('Popular comparisons API error:', error);
    return NextResponse.json({ comparisons: [] });
  }
}
