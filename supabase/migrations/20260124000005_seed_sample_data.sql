-- Seed Sample Data for TridentFans
-- This creates prediction games and bot predictions for demo purposes
-- Note: User profiles require auth.users entries, so those are handled by the API seed endpoint

-- Create prediction games (past games with results)
INSERT INTO prediction_games (id, game_date, game_time, opponent, opponent_abbr, is_home, status, actual_result) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - 5, '19:10', 'Los Angeles Angels', 'LAA', true, 'final',
   '{"mariners_score": 6, "opponent_score": 3, "winner": "mariners"}'::jsonb),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE - 4, '18:40', 'Texas Rangers', 'TEX', false, 'final',
   '{"mariners_score": 4, "opponent_score": 7, "winner": "opponent"}'::jsonb),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', CURRENT_DATE - 3, '19:10', 'Houston Astros', 'HOU', true, 'final',
   '{"mariners_score": 5, "opponent_score": 2, "winner": "mariners"}'::jsonb),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', CURRENT_DATE - 2, '18:40', 'Oakland Athletics', 'OAK', false, 'final',
   '{"mariners_score": 8, "opponent_score": 4, "winner": "mariners"}'::jsonb),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_DATE - 1, '19:10', 'New York Yankees', 'NYY', true, 'final',
   '{"mariners_score": 3, "opponent_score": 5, "winner": "opponent"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Create upcoming prediction games
INSERT INTO prediction_games (id, game_date, game_time, opponent, opponent_abbr, is_home, status) VALUES
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', CURRENT_DATE + 1, '19:10', 'Boston Red Sox', 'BOS', true, 'scheduled'),
  ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE + 2, '18:40', 'Chicago White Sox', 'CWS', false, 'scheduled'),
  ('22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE + 3, '19:10', 'Minnesota Twins', 'MIN', true, 'scheduled'),
  ('33333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE + 4, '18:40', 'Cleveland Guardians', 'CLE', false, 'scheduled'),
  ('44444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE + 5, '19:10', 'Detroit Tigers', 'DET', true, 'scheduled')
ON CONFLICT (id) DO NOTHING;

-- Create bot predictions for completed games
INSERT INTO bot_predictions (bot_id, game_id, predictions, reasoning, score) VALUES
  -- Moose predictions
  ('moose', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '{"winner": "mariners", "mariners_runs": 5, "opponent_runs": 2}'::jsonb,
   'Based on the Mariners'' strong pitching matchup against the Angels and our historical home performance, I''m predicting a comfortable 5-2 victory.', 17),
  ('moose', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   '{"winner": "opponent", "mariners_runs": 3, "opponent_runs": 5}'::jsonb,
   'The Rangers have been hot lately. Looking at the numbers, I think they take this one 5-3.', 16),
  ('moose', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
   '{"winner": "mariners", "mariners_runs": 4, "opponent_runs": 3}'::jsonb,
   'Big division matchup. Our pitching gives us the edge. Mariners 4-3.', 16),
  ('moose', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
   '{"winner": "mariners", "mariners_runs": 6, "opponent_runs": 3}'::jsonb,
   'We should handle Oakland. Predicting a solid 6-3 win.', 16),
  ('moose', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
   '{"winner": "mariners", "mariners_runs": 4, "opponent_runs": 3}'::jsonb,
   'Tough matchup but I believe in our boys. Mariners 4-3.', 6),
  -- Captain Hammy predictions
  ('captain_hammy', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '{"winner": "mariners", "mariners_runs": 6, "opponent_runs": 4}'::jsonb,
   'I''ve got a good feeling about this one. The boys are due for a breakout game. Mariners win 6-4!', 17),
  ('captain_hammy', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   '{"winner": "mariners", "mariners_runs": 5, "opponent_runs": 4}'::jsonb,
   'Call me optimistic but I think we pull this one out. Mariners 5-4.', 6),
  ('captain_hammy', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
   '{"winner": "mariners", "mariners_runs": 5, "opponent_runs": 2}'::jsonb,
   'We always step up against Houston. 5-2 Mariners, book it!', 20),
  ('captain_hammy', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
   '{"winner": "mariners", "mariners_runs": 7, "opponent_runs": 4}'::jsonb,
   'Oakland doesn''t stand a chance. Big offensive day incoming. 7-4 Ms.', 18),
  ('captain_hammy', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
   '{"winner": "opponent", "mariners_runs": 3, "opponent_runs": 4}'::jsonb,
   'As much as it pains me, the Yankees are tough. 4-3 loss but we''ll bounce back.', 18),
  -- Spartan predictions
  ('spartan', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '{"winner": "mariners", "mariners_runs": 7, "opponent_runs": 2}'::jsonb,
   'Everyone''s sleeping on us but we''re going to crush them. 7-2 Mariners.', 15),
  ('spartan', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   '{"winner": "opponent", "mariners_runs": 2, "opponent_runs": 6}'::jsonb,
   'I''m being real here - Rangers take this one 6-2. We need to bounce back.', 14),
  ('spartan', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
   '{"winner": "mariners", "mariners_runs": 6, "opponent_runs": 1}'::jsonb,
   'We''re going to embarrass Houston. 6-1 blowout incoming.', 16),
  ('spartan', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
   '{"winner": "mariners", "mariners_runs": 9, "opponent_runs": 2}'::jsonb,
   'Oakland is bad. Really bad. We drop 9 on them.', 15),
  ('spartan', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
   '{"winner": "mariners", "mariners_runs": 5, "opponent_runs": 4}'::jsonb,
   'Yankees are overrated. We take this one 5-4.', 5)
ON CONFLICT DO NOTHING;

-- Update bot leaderboard
INSERT INTO bot_leaderboard (bot_id, total_points, total_predictions, accuracy, correct_winners)
SELECT
  bot_id,
  SUM(score) as total_points,
  COUNT(*) as total_predictions,
  ROUND((COUNT(*) FILTER (WHERE score >= 10)::numeric / COUNT(*)::numeric) * 100) as accuracy,
  COUNT(*) FILTER (WHERE score >= 10) as correct_winners
FROM bot_predictions
WHERE score IS NOT NULL
GROUP BY bot_id
ON CONFLICT (bot_id)
DO UPDATE SET
  total_points = EXCLUDED.total_points,
  total_predictions = EXCLUDED.total_predictions,
  accuracy = EXCLUDED.accuracy,
  correct_winners = EXCLUDED.correct_winners;
