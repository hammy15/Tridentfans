import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Get user's conversation history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const botId = searchParams.get('botId');
    const conversationId = searchParams.get('id');

    // Get specific conversation
    if (conversationId) {
      const { data: conversation, error } = await supabase
        .from('bot_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      return NextResponse.json({ conversation });
    }

    // Get conversation list for user
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    let query = supabase
      .from('bot_conversations')
      .select('id, bot_id, created_at, ended_at, messages')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (botId) {
      query = query.eq('bot_id', botId);
    }

    const { data: conversations, error } = await query.limit(20);

    if (error) throw error;

    // Add preview to each conversation
    const withPreviews = conversations?.map(conv => {
      const messages = conv.messages as Array<{ role: string; content: string }>;
      const lastUserMessage = messages?.filter(m => m.role === 'user').pop();
      return {
        id: conv.id,
        botId: conv.bot_id,
        createdAt: conv.created_at,
        endedAt: conv.ended_at,
        messageCount: messages?.length || 0,
        preview: lastUserMessage?.content?.slice(0, 100) || 'New conversation',
      };
    });

    return NextResponse.json({ conversations: withPreviews || [] });
  } catch (error) {
    console.error('Conversations GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST - Create or update conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, botId, conversationId, messages } = body;

    if (!botId || !messages) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update existing conversation
    if (conversationId) {
      const { data, error } = await supabase
        .from('bot_conversations')
        .update({ messages })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ conversation: data });
    }

    // Create new conversation
    const { data, error } = await supabase
      .from('bot_conversations')
      .insert({
        user_id: userId || null,
        bot_id: botId,
        messages,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ conversation: data });
  } catch (error) {
    console.error('Conversations POST error:', error);
    return NextResponse.json({ error: 'Failed to save conversation' }, { status: 500 });
  }
}

// PATCH - End conversation
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('bot_conversations')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ conversation: data });
  } catch (error) {
    console.error('Conversations PATCH error:', error);
    return NextResponse.json({ error: 'Failed to end conversation' }, { status: 500 });
  }
}

// DELETE - Delete conversation
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, userId } = body;

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
    }

    // Only allow users to delete their own conversations
    const { error } = await supabase
      .from('bot_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Conversations DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}
