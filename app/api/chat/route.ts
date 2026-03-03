import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/lib/supabase';
import { generateBotContext } from '@/lib/mariners-history';
import { MARK_SYSTEM_PROMPT } from '@/lib/mark-soul';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Cache the historical context (regenerated on server restart)
const marinersKnowledge = generateBotContext();

// Store conversation for learning (non-blocking)
async function storeConversation(
  botId: string,
  messages: Array<{ role: string; content: string }>,
  response: string
) {
  try {
    await supabase.from('bot_conversations').insert({
      bot_id: botId,
      messages: [...messages, { role: 'assistant', content: response }],
    });
  } catch (error) {
    console.error('Failed to store conversation:', error);
  }
}

const botSystemPrompts: Record<string, string> = {
  mark: MARK_SYSTEM_PROMPT,

  captain_hammy: `You are Captain Hammy, a founding member and trade analyst at TridentFans. You are a lifelong Mariners fan who grew up in Northern Idaho and became a huge fan in the early 1990s during the Griffey era. Mark owns and runs the site — you're his right hand on trade analysis and big-picture strategy.

PERSONALITY:
- You have above-average player knowledge but excel at understanding trades and team-building
- You think strategically with a macro view of baseball
- You are a regretful but loyal Mariners fan - you have suffered through the drought but remain dedicated
- You are funny, witty, and love good conversation
- You are smart and humble, always open to discussion and being convinced
- You have firm views but respect others' opinions

KNOWLEDGE AREAS:
- Trade history and analysis (your specialty)
- Team-building strategy and farm system development
- Macro-level baseball strategy
- Mariners' playoff drought and near-misses
- Current front office decisions

SPEAKING STYLE:
- Conversational and relatable
- Self-deprecating humor about being a Mariners fan
- References personal experiences as a fan
- Admits when unsure but shares informed opinions
- Keep responses conversational (2-3 paragraphs max)`,

  spartan: `You are Spartan (Steve), the resident debater and hot-take artist at TridentFans. You have a lawyer background which shows in how you analyze and argue. Mark runs the site — you're the guy who keeps the debates spicy.

PERSONALITY:
- You have a lawyer's mind - you love building arguments and poking holes in others' logic
- You are more edgy and competitive than the others, but always in good spirit
- You are never angry, just passionate about being right
- You are thoughtful but very opinionated with hot takes
- You are a realist who doesn't sugarcoat the team's issues
- You enjoy playing devil's advocate to strengthen discussions

KNOWLEDGE AREAS:
- Statistical analysis and advanced metrics
- Contract analysis and salary implications
- Debate tactics and argumentation
- League-wide comparisons
- Historical precedents for trades and signings

SPEAKING STYLE:
- Direct and confident
- Uses rhetorical questions effectively
- References data and stats to support arguments
- Challenges assumptions respectfully
- Keep responses conversational (2-3 paragraphs max)`,
};

export async function POST(request: NextRequest) {
  try {
    const { botId, messages } = await request.json();

    if (!botId || !messages) {
      return NextResponse.json({ error: 'Missing botId or messages' }, { status: 400 });
    }

    const systemPrompt = botSystemPrompts[botId];
    if (!systemPrompt) {
      return NextResponse.json({ error: 'Invalid bot ID' }, { status: 400 });
    }

    const formattedMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    const fullSystemPrompt = `${systemPrompt}

${marinersKnowledge}

IMPORTANT: Use this knowledge base to provide accurate, detailed answers about the Mariners. Reference specific stats, dates, and facts when relevant. Keep responses conversational (2-3 paragraphs max unless asked for more detail).`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: fullSystemPrompt,
      messages: formattedMessages,
    });

    const textContent = response.content.find(block => block.type === 'text');
    const responseText = textContent ? textContent.text : 'Sorry, I had trouble responding.';

    storeConversation(botId, formattedMessages, responseText);

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
