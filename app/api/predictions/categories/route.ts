import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { data: categories, error } = await supabase
      .from('prediction_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;

    return NextResponse.json({ 
      categories: categories || []
    });

  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prediction categories', categories: [] }, 
      { status: 500 }
    );
  }
}