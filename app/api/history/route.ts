import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getMomentsForDate,
  getRandomMoment,
  getAllMoments,
  getMomentsByCategory,
} from '@/lib/mariners-history-moments';
import type { HistoricalCategory, HistoricalMoment } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Fetch historical moments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const day = searchParams.get('day');
    const category = searchParams.get('category') as HistoricalCategory | null;
    const random = searchParams.get('random');
    const all = searchParams.get('all');

    // Try to fetch from database first
    let dbMoments: HistoricalMoment[] = [];
    let dbError = false;

    try {
      let query = supabase.from('historical_moments').select('*');

      if (month && day) {
        query = query.eq('date_month', parseInt(month)).eq('date_day', parseInt(day));
      }
      if (category) {
        query = query.eq('category', category);
      }
      if (!all) {
        query = query.order('year', { ascending: false }).limit(50);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Database error:', error);
        dbError = true;
      } else {
        dbMoments = data || [];
      }
    } catch (e) {
      console.error('Database connection error:', e);
      dbError = true;
    }

    // If database has data, use it
    if (dbMoments.length > 0) {
      if (random === 'true') {
        const randomIndex = Math.floor(Math.random() * dbMoments.length);
        return NextResponse.json({ moment: dbMoments[randomIndex] });
      }
      return NextResponse.json({ moments: dbMoments, source: 'database' });
    }

    // Fall back to seed data
    if (random === 'true') {
      return NextResponse.json({ moment: getRandomMoment(), source: 'seed' });
    }

    if (month && day) {
      const moments = getMomentsForDate(parseInt(month), parseInt(day));
      if (moments.length > 0) {
        return NextResponse.json({ moments, source: 'seed' });
      }
      // If no moments for today, return a random one as fallback
      return NextResponse.json({
        moments: [],
        randomMoment: getRandomMoment(),
        source: 'seed',
      });
    }

    if (category) {
      return NextResponse.json({
        moments: getMomentsByCategory(category),
        source: 'seed',
      });
    }

    // Return all seed data if all=true or no specific query
    return NextResponse.json({
      moments: getAllMoments(),
      source: 'seed',
      dbError,
    });
  } catch (error) {
    console.error('History GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

// POST - Add new historical moment (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, ...momentData } = body;

    // Simple password check
    if (password !== 'mariners2026' && password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate required fields
    if (
      !momentData.date_month ||
      !momentData.date_day ||
      !momentData.year ||
      !momentData.title ||
      !momentData.description ||
      !momentData.category
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('historical_moments')
      .insert({
        date_month: momentData.date_month,
        date_day: momentData.date_day,
        year: momentData.year,
        title: momentData.title,
        description: momentData.description,
        category: momentData.category,
        player_names: momentData.player_names || [],
        image_url: momentData.image_url || null,
        source_url: momentData.source_url || null,
        is_featured: momentData.is_featured || false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ moment: data, success: true });
  } catch (error) {
    console.error('History POST error:', error);
    return NextResponse.json({ error: 'Failed to create moment' }, { status: 500 });
  }
}

// PUT - Update historical moment (admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, id, ...updates } = body;

    // Simple password check
    if (password !== 'mariners2026' && password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing moment ID' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('historical_moments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ moment: data, success: true });
  } catch (error) {
    console.error('History PUT error:', error);
    return NextResponse.json({ error: 'Failed to update moment' }, { status: 500 });
  }
}

// DELETE - Remove historical moment (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const password = searchParams.get('password');

    // Simple password check
    if (password !== 'mariners2026' && password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing moment ID' }, { status: 400 });
    }

    const { error } = await supabase.from('historical_moments').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('History DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete moment' }, { status: 500 });
  }
}
