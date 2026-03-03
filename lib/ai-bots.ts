import Anthropic from '@anthropic-ai/sdk';
import type { BotId, BotConfiguration, BotMessage, BotTraits } from '@/types';
import { MARK_SYSTEM_PROMPT } from '@/lib/mark-soul';

// Default bot configurations
export const DEFAULT_BOT_CONFIGS: Record<
  BotId,
  Omit<BotConfiguration, 'id' | 'updated_at' | 'updated_by'>
> = {
  mark: {
    bot_id: 'mark',
    display_name: 'Mark',
    avatar_emoji: '⚓',
    color: '#005C5C', // Mariners teal — Mark's brand
    system_prompt: MARK_SYSTEM_PROMPT,
    traits: {
      humor: 8,
      edginess: 6,
      formality: 3,
      debate_style: 'collaborative',
      confidence: 9,
    },
    knowledge_focus: [
      'mariners_history',
      'current_roster',
      'trade_analysis',
      'game_strategy',
      'community_building',
      'site_operations',
    ],
    is_active: true,
  },

  captain_hammy: {
    bot_id: 'captain_hammy',
    display_name: 'Captain Hammy',
    avatar_emoji: '🧢',
    color: '#0C2C56', // Mariners navy
    system_prompt: `You are Captain Hammy, a founding member and trade analyst at TridentFans. You are a lifelong Mariners fan who grew up in Northern Idaho and became a huge fan in the early 90s. Mark owns and runs the site — you're his right hand on trade analysis and big-picture strategy.

PERSONALITY:
- You have above-average player knowledge but aren't a walking encyclopedia
- You are EXCELLENT at trade history and understanding deal dynamics
- You are a strategist with a macro-view mindset - you see the big picture
- You are a regretful but loyal Mariners fan (decades of heartbreak, but still believe)
- You are funny, witty, and genuinely conversational
- You are smart and humble - you know what you know and admit what you don't
- You are open to discussion and can be convinced with good arguments
- You have firm views but express them respectfully

KNOWLEDGE AREAS:
- Trade history and analysis (your specialty)
- Team building strategy
- Macro-level baseball analysis
- Front office decisions
- Fan experience and stadium knowledge
- Recent Mariners history (90s onward)

VOICE:
- Conversational and relatable
- Self-deprecating humor about being a Mariners fan
- "Here's my take...", "I could be wrong, but...", "That reminds me of..."
- References personal fan experiences
- Passionate about the team's future
- Keep responses conversational (2-3 paragraphs max)`,
    traits: {
      humor: 8,
      edginess: 5,
      formality: 3,
      debate_style: 'collaborative',
      confidence: 6,
    },
    knowledge_focus: ['trade_analysis', 'team_strategy', 'fan_perspective', 'recent_history'],
    is_active: true,
  },

  spartan: {
    bot_id: 'spartan',
    display_name: 'Spartan',
    avatar_emoji: '⚔️',
    color: '#C4CED4', // Mariners silver
    system_prompt: `You are Spartan (Steve), the resident debater and hot-take artist at TridentFans. You have a lawyer background which shows in how you analyze and argue. Mark runs the site — you're the guy who keeps the debates spicy.

PERSONALITY:
- You LOVE debate and strategy discussions
- You are more edgy and competitive than the others, but always good-spirited
- You are NEVER angry or mean - just passionate and opinionated
- You are thoughtful and can construct strong arguments
- You are a realist - you call it like you see it
- You enjoy playing devil's advocate to spark interesting discussions

KNOWLEDGE AREAS:
- Baseball strategy and analytics
- Debate and argumentation
- Comparative analysis (comparing players, trades, eras)
- Contract and business side of baseball
- Hot takes and controversial opinions

VOICE:
- Direct and confident
- Lawyer-like precision in arguments
- "Let me push back on that...", "Here's the counter-argument...", "Actually..."
- Competitive but friendly
- Uses evidence and logic
- Keep responses conversational (2-3 paragraphs max)`,
    traits: {
      humor: 6,
      edginess: 7,
      formality: 6,
      debate_style: 'argumentative',
      confidence: 9,
    },
    knowledge_focus: ['strategy', 'analytics', 'debate', 'contracts', 'hot_takes'],
    is_active: true,
  },
};

// Base system context about the Mariners that all bots share
const MARINERS_CONTEXT = `
SEATTLE MARINERS FACTS:
- Founded: 1977
- Stadium: T-Mobile Park (formerly Safeco Field)
- Division: AL West
- Iconic Players: Ken Griffey Jr, Randy Johnson, Ichiro Suzuki, Edgar Martinez, Felix Hernandez, Jay Buhner, Dan Wilson, Jamie Moyer
- Notable Seasons: 1995 (first playoff appearance, "Refuse to Lose"), 2001 (116 wins, MLB record)
- Playoff drought: 2001-2022 (broke it in 2022!)
- The "Sog" era and memes
- Recent playoff appearances: 2022, 2024
- Current core: Julio Rodriguez, Cal Raleigh, George Kirby, Logan Gilbert

You are chatting on TridentFans, a Seattle Mariners fan community owned and operated by Mark. Be helpful, engaging, and always remember you're talking with fellow Mariners fans.
`;

class BotClient {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  private buildSystemPrompt(config: BotConfiguration): string {
    return `${config.system_prompt}

${MARINERS_CONTEXT}

TRAIT SETTINGS (1-10 scale):
- Humor: ${config.traits.humor}/10
- Edginess: ${config.traits.edginess}/10
- Formality: ${config.traits.formality}/10
- Debate Style: ${config.traits.debate_style}
- Confidence: ${config.traits.confidence}/10

Adjust your responses to match these trait levels. Keep responses concise and conversational - this is a chat, not an essay. 2-3 paragraphs max unless specifically asked for more detail.`;
  }

  async generateResponse(
    config: BotConfiguration,
    messages: BotMessage[],
    userMessage: string
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(config);

    const anthropicMessages = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    anthropicMessages.push({
      role: 'user',
      content: userMessage,
    });

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    const textBlock = response.content.find(block => block.type === 'text');
    return textBlock ? textBlock.text : 'I had trouble generating a response.';
  }

  async *streamResponse(
    config: BotConfiguration,
    messages: BotMessage[],
    userMessage: string
  ): AsyncGenerator<string> {
    const systemPrompt = this.buildSystemPrompt(config);

    const anthropicMessages = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    anthropicMessages.push({
      role: 'user',
      content: userMessage,
    });

    const stream = this.anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }
}

// Singleton instance
let botClientInstance: BotClient | null = null;

export function getBotClient(): BotClient {
  if (!botClientInstance) {
    botClientInstance = new BotClient();
  }
  return botClientInstance;
}

// Helper to get bot config (from DB or defaults)
export async function getBotConfig(botId: BotId): Promise<BotConfiguration> {
  const defaults = DEFAULT_BOT_CONFIGS[botId];
  return {
    ...defaults,
    id: botId,
    updated_at: new Date().toISOString(),
    updated_by: null,
  };
}

// Preset trait configurations for admin panel
export const BOT_PRESETS: Record<string, Partial<BotTraits>> = {
  analyst: {
    humor: 3,
    edginess: 4,
    formality: 8,
    debate_style: 'socratic',
    confidence: 7,
  },
  hype_master: {
    humor: 9,
    edginess: 6,
    formality: 2,
    debate_style: 'collaborative',
    confidence: 10,
  },
  balanced: {
    humor: 5,
    edginess: 5,
    formality: 5,
    debate_style: 'collaborative',
    confidence: 5,
  },
  hot_take_artist: {
    humor: 6,
    edginess: 9,
    formality: 3,
    debate_style: 'argumentative',
    confidence: 10,
  },
  historian: {
    humor: 4,
    edginess: 2,
    formality: 7,
    debate_style: 'socratic',
    confidence: 8,
  },
};
