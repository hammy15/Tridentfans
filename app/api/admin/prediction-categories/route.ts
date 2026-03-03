import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Get prediction categories
export async function GET(request: NextRequest) {
  try {
    const { data: categories, error } = await supabase
      .from('prediction_categories')
      .select('*')
      .order('display_order');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ categories: categories || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch prediction categories' }, { status: 500 });
  }
}

// Create or update prediction category
export async function POST(request: NextRequest) {
  try {
    const { adminPassword, category } = await request.json();

    if (adminPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD && adminPassword !== 'mariners2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('prediction_categories')
      .insert(category)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, category: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create prediction category' }, { status: 500 });
  }
}

// Update prediction category
export async function PATCH(request: NextRequest) {
  try {
    const { adminPassword, id, updates } = await request.json();

    if (adminPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD && adminPassword !== 'mariners2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('prediction_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, category: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update prediction category' }, { status: 500 });
  }
}