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
    
    // Fallback mock categories for today's Rangers game
    const mockCategories = [
      {
        id: 'winner',
        name: 'Winner',
        description: 'Who will win the game?',
        options: ['Seattle Mariners', 'Texas Rangers'],
        points: 10,
        is_active: true,
        display_order: 1
      },
      {
        id: 'total-runs', 
        name: 'Total Runs',
        description: 'How many total runs will be scored?',
        options: ['Under 7.5', 'Over 7.5'],
        points: 5,
        is_active: true,
        display_order: 2
      },
      {
        id: 'first-to-score',
        name: 'First to Score',
        description: 'Which team will score first?',
        options: ['Seattle Mariners', 'Texas Rangers'],
        points: 5,
        is_active: true,
        display_order: 3
      },
      {
        id: 'mariners-hits',
        name: 'Mariners Hits',
        description: 'How many hits will the Mariners get?',
        options: ['Under 6.5', 'Over 6.5'],
        points: 3,
        is_active: true,
        display_order: 4
      }
    ];
    
    return NextResponse.json({
      categories: mockCategories
    });
  }
}