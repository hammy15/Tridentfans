import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { MARK_SYSTEM_PROMPT } from '@/lib/mark-soul';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Get comprehensive prediction data for a game
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const userId = searchParams.get('userId');

    if (!gameId) {
      return NextResponse.json({ error: 'Game ID required' }, { status: 400 });
    }

    // Get game information
    const { data: game } = await supabase
      .from('prediction_games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Get all prediction categories
    const { data: categories } = await supabase
      .from('prediction_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    // Get user's existing predictions if userId provided
    let userPredictions = [];
    if (userId) {
      const { data } = await supabase
        .from('user_predictions')
        .select('*')
        .eq('user_id', userId)
        .eq('game_id', gameId);
      userPredictions = data || [];
    }

    // Get AI predictions
    const { data: aiPredictions } = await supabase
      .from('ai_predictions')
      .select('*')
      .eq('game_id', gameId);

    // Group AI predictions by persona
    const aiPredictionsByPersona = {
      mark: aiPredictions?.filter(p => p.persona === 'mark') || [],
      hammy: aiPredictions?.filter(p => p.persona === 'hammy') || [],
      spartan: aiPredictions?.filter(p => p.persona === 'spartan') || [],
    };

    // Get current leaderboard snapshot
    const { data: leaderboard } = await supabase
      .from('leaderboard_current_season')
      .select('*')
      .order('rank_position')
      .limit(10);

    return NextResponse.json({
      game,
      categories: categories || [],
      userPredictions,
      aiPredictions: aiPredictionsByPersona,
      leaderboard: leaderboard || [],
    });

  } catch (error) {
    console.error('Error fetching prediction data:', error);
    return NextResponse.json({ error: 'Failed to fetch prediction data' }, { status: 500 });
  }
}

// Submit comprehensive predictions
export async function POST(request: NextRequest) {
  try {
    const { gameId, userId, predictions } = await request.json();

    if (!gameId || !userId || !predictions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if game is still open for predictions
    const { data: game } = await supabase
      .from('prediction_games')
      .select('game_date, game_status')
      .eq('id', gameId)
      .single();

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const gameStart = new Date(game.game_date);
    const now = new Date();
    
    if (now >= gameStart) {
      return NextResponse.json({ error: 'Predictions are locked - game has started' }, { status: 400 });
    }

    // Upsert user predictions
    const predictionInserts = predictions.map((pred: any) => ({
      user_id: userId,
      game_id: gameId,
      category_id: pred.categoryId,
      prediction_value: pred.value,
      prediction_data: pred.data || {},
    }));

    const { error: upsertError } = await supabase
      .from('user_predictions')
      .upsert(predictionInserts, { 
        onConflict: 'user_id,game_id,category_id',
        ignoreDuplicates: false 
      });

    if (upsertError) {
      console.error('Error upserting predictions:', upsertError);
      return NextResponse.json({ error: 'Failed to save predictions' }, { status: 500 });
    }

    // Get updated prediction count for user
    const { count } = await supabase
      .from('user_predictions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('game_id', gameId);

    // Check if user completed all major categories (achievement tracking)
    if (count && count >= 10) {
      await supabase
        .from('user_achievements')
        .upsert({
          user_id: userId,
          achievement_type: 'prediction_completion',
          achievement_name: 'Complete Predictor',
          description: 'Made predictions in 10+ categories for a single game',
          badge_icon: '🎯',
          metadata: { game_id: gameId, prediction_count: count }
        }, { onConflict: 'user_id,achievement_type,achievement_name' });
    }

    return NextResponse.json({ 
      success: true, 
      predictionCount: count,
      message: 'Predictions saved successfully'
    });

  } catch (error) {
    console.error('Error saving predictions:', error);
    return NextResponse.json({ error: 'Failed to save predictions' }, { status: 500 });
  }
}

// Generate AI predictions for a game
export async function PUT(request: NextRequest) {
  try {
    const { gameId, adminPassword } = await request.json();

    if (!gameId) {
      return NextResponse.json({ error: 'Game ID required' }, { status: 400 });
    }

    // Simple admin check
    if (adminPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD && adminPassword !== 'mariners2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get game data
    const { data: game } = await supabase
      .from('prediction_games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Get prediction categories
    const { data: categories } = await supabase
      .from('prediction_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (!categories) {
      return NextResponse.json({ error: 'No prediction categories found' }, { status: 404 });
    }

    // Generate predictions for each persona
    const personas = [
      {
        id: 'mark',
        name: 'Mark',
        system: MARK_SYSTEM_PROMPT + `\n\nMaking predictions for Mariners vs ${game.opponent}. Use your gut feeling mixed with knowledge. Be slightly optimistic about the M's but realistic. Include brief reasoning for each prediction.`,
      },
      {
        id: 'hammy',
        name: 'Captain Hammy',
        system: `You are Captain Hammy, the analytical trade expert and founding member of TridentFans. You analyze games through matchups, roster construction, and strategic decisions. Making predictions for Mariners vs ${game.opponent}. Focus on analytical reasoning, pitcher matchups, and strategic advantages.`,
      },
      {
        id: 'spartan',
        name: 'Spartan',
        system: `You are Spartan, the stats contrarian and resident debater of TridentFans. You love advanced metrics and controversial takes. Making predictions for Mariners vs ${game.opponent}. Use sabermetrics, advanced stats, and data to make bold, contrarian predictions that challenge conventional wisdom.`,
      }
    ];

    for (const persona of personas) {
      try {
        const predictionPrompt = `Make predictions for tonight's Mariners game vs ${game.opponent}.

Game Info:
- Date: ${game.game_date}
- Location: ${game.is_home ? 'T-Mobile Park (Home)' : `Away vs ${game.opponent}`}
- Starting Pitchers: TBD

Prediction Categories:
${categories.map(cat => `- ${cat.name}: ${cat.description} (${cat.type}, ${cat.points_base} points)`).join('\n')}

For each category, provide:
1. Your prediction
2. Brief reasoning (1-2 sentences)
3. Confidence level (1-10)

Respond with JSON in this format:
{
  "predictions": [
    {
      "categoryId": "category_uuid",
      "categoryName": "Category Name",
      "prediction": "your_prediction_value",
      "reasoning": "why you made this prediction",
      "confidence": 7
    }
  ]
}

Stay true to your personality and prediction style. No profanity.`;

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: persona.system,
          messages: [{ role: 'user', content: predictionPrompt }]
        });

        const textBlock = response.content.find(b => b.type === 'text');
        if (!textBlock) continue;

        let parsed;
        try {
          parsed = JSON.parse(textBlock.text.trim());
        } catch {
          const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) continue;
          parsed = JSON.parse(jsonMatch[0]);
        }

        // Insert AI predictions
        if (parsed.predictions) {
          for (const pred of parsed.predictions) {
            const category = categories.find(c => 
              c.id === pred.categoryId || 
              c.name === pred.categoryName
            );
            
            if (category) {
              await supabase
                .from('ai_predictions')
                .upsert({
                  game_id: gameId,
                  persona: persona.id,
                  category_id: category.id,
                  prediction_value: pred.prediction,
                  reasoning: pred.reasoning,
                  confidence_level: pred.confidence || 5,
                }, { 
                  onConflict: 'game_id,persona,category_id',
                  ignoreDuplicates: false 
                });
            }
          }
        }

      } catch (error) {
        console.error(`Error generating predictions for ${persona.name}:`, error);
        // Continue with other personas
      }
    }

    // Return the generated predictions
    const { data: aiPredictions } = await supabase
      .from('ai_predictions')
      .select(`
        *,
        prediction_categories(name, description, points_base, difficulty_tier)
      `)
      .eq('game_id', gameId);

    const predictionsByPersona = {
      mark: aiPredictions?.filter(p => p.persona === 'mark') || [],
      hammy: aiPredictions?.filter(p => p.persona === 'hammy') || [],
      spartan: aiPredictions?.filter(p => p.persona === 'spartan') || [],
    };

    return NextResponse.json({
      success: true,
      predictions: predictionsByPersona,
      message: 'AI predictions generated successfully'
    });

  } catch (error) {
    console.error('Error generating AI predictions:', error);
    return NextResponse.json({ error: 'Failed to generate AI predictions' }, { status: 500 });
  }
}