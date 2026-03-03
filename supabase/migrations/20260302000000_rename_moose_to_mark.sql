-- Migration: Replace 'moose' bot with 'mark' bot
-- Mark is the new site owner/operator

-- Step 1: Drop the CHECK constraints that reference 'moose'
ALTER TABLE bot_configurations DROP CONSTRAINT IF EXISTS bot_configurations_bot_id_check;
ALTER TABLE bot_conversations DROP CONSTRAINT IF EXISTS bot_conversations_bot_id_check;

-- Step 2: Update existing moose data to mark
UPDATE bot_configurations SET bot_id = 'mark', display_name = 'Mark', avatar_emoji = '⚓', color = '#005C5C' WHERE bot_id = 'moose';
UPDATE bot_conversations SET bot_id = 'mark' WHERE bot_id = 'moose';
UPDATE bot_predictions SET bot_id = 'mark' WHERE bot_id = 'moose';

-- Step 3: Re-add CHECK constraints with 'mark' instead of 'moose'
ALTER TABLE bot_configurations ADD CONSTRAINT bot_configurations_bot_id_check CHECK (bot_id IN ('mark', 'captain_hammy', 'spartan'));
ALTER TABLE bot_conversations ADD CONSTRAINT bot_conversations_bot_id_check CHECK (bot_id IN ('mark', 'captain_hammy', 'spartan'));

-- Step 4: Update the seed bot configuration for Mark
INSERT INTO bot_configurations (bot_id, display_name, avatar_emoji, color, system_prompt, traits, knowledge_focus, is_active)
VALUES (
  'mark',
  'Mark',
  '⚓',
  '#005C5C',
  'Owner and operator of TridentFans. Runs the site like his livelihood depends on it.',
  '{"humor": 8, "edginess": 6, "formality": 3, "debate_style": "collaborative", "confidence": 9}',
  ARRAY['mariners_history', 'current_roster', 'trade_analysis', 'game_strategy', 'community_building', 'site_operations'],
  true
)
ON CONFLICT (bot_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  avatar_emoji = EXCLUDED.avatar_emoji,
  color = EXCLUDED.color,
  system_prompt = EXCLUDED.system_prompt,
  traits = EXCLUDED.traits,
  knowledge_focus = EXCLUDED.knowledge_focus;
