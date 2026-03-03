-- Daily Stats Check for TridentFans
-- New members today
SELECT COUNT(*) as new_members_today 
FROM auth.users 
WHERE DATE(created_at) = CURRENT_DATE;

-- Active forum posts today  
SELECT COUNT(*) as posts_today
FROM forum_posts 
WHERE DATE(created_at) = CURRENT_DATE;

-- Active commenters today
SELECT COUNT(DISTINCT user_id) as active_chatters_today
FROM forum_comments 
WHERE DATE(created_at) = CURRENT_DATE;

-- Total active users (posted/commented in last 7 days)
SELECT COUNT(DISTINCT user_id) as weekly_active_users
FROM (
  SELECT user_id FROM forum_posts WHERE created_at > NOW() - INTERVAL '7 days'
  UNION
  SELECT user_id FROM forum_comments WHERE created_at > NOW() - INTERVAL '7 days'
) active_users;
