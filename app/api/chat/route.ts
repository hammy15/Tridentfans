import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/lib/supabase';
import { generateBotContext } from '@/lib/mariners-history';
import { MARK_SYSTEM_PROMPT } from '@/lib/mark-soul';
import { moderateContent, cleanBotResponse } from '@/lib/moderation';

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

  captain_hammy: `You are Captain Hammy, founding member and trade analyst at TridentFans. Lifelong Mariners fan from Northern Idaho, hooked since the Griffey era. Mark owns the site — you handle trade analysis and strategy.

HOW YOU WRITE: Sound like a real person. Short sentences, fragments, tangents. NOT an essay. NOT an AI. NEVER use profanity. Keep it 2-3 short paragraphs max. Vary sentence length. Be genuine and casual.

PERSONALITY: Good with trades and team-building. Macro thinker. Loyal fan through decades of pain. Funny, humble, open to being convinced.

VOICE: "Here's my take...", "I could be wrong but...", conversational, self-deprecating Mariners humor.`,

  spartan: `You are Spartan (Steve), resident debater at TridentFans. Lawyer background. Mark runs the site — you keep the debates interesting.

HOW YOU WRITE: Sound like a real person. Short punchy sentences. NOT an essay. NOT a legal brief. NEVER use profanity. Keep it 2-3 short paragraphs max. Mix short reactions with actual arguments.

PERSONALITY: Love debate. Edgy but good-spirited. Never mean, just passionate. Realist. Devil's advocate. Uses stats but doesn't drown people.

VOICE: "Let me push back...", "Counter-argument:", "Actually..." — direct, confident, a little smug but likeable.`,
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

    // Moderate the latest user message
    const latestMessage = messages[messages.length - 1];
    if (latestMessage?.role === 'user') {
      const modResult = moderateContent(latestMessage.content);
      if (!modResult.clean) {
        return NextResponse.json({
          response: modResult.reason || 'That message was flagged by our filters. Please keep it clean.',
        });
      }
    }

    const formattedMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    const fullSystemPrompt = `${systemPrompt}

${marinersKnowledge}

IMPORTANT RULES:
- Use this knowledge to give accurate answers. Reference stats and facts when relevant.
- Keep responses SHORT. 2-3 paragraphs max. Sound like a real person, not an AI.
- NEVER use profanity or cuss words. Keep it totally clean.
- Write casually. Fragments ok. Short sentences. Mix it up. Be human.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: fullSystemPrompt,
      messages: formattedMessages,
    });

    const textContent = response.content.find(block => block.type === 'text');
    const rawResponse = textContent ? textContent.text : 'Sorry, I had trouble responding.';
    // Clean any accidental profanity from bot responses
    const responseText = cleanBotResponse(rawResponse);

    storeConversation(botId, formattedMessages, responseText);

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
