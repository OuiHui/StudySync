-- Migration: Add Performance Indexes for High-Frequency Lookups
-- Accelerates session filtering, message history sorting, friendship status checks, and DM resolution.

-- 1. Index on study_sessions for scheduled start sorting, status filtering, and group lookups
CREATE INDEX IF NOT EXISTS idx_study_sessions_scheduled_start 
ON public.study_sessions (scheduled_start ASC);

CREATE INDEX IF NOT EXISTS idx_study_sessions_status 
ON public.study_sessions (status);

CREATE INDEX IF NOT EXISTS idx_study_sessions_group_id 
ON public.study_sessions (group_id) 
WHERE group_id IS NOT NULL;

-- 2. Composite index on messages for conversation message history lookups (sorted newest first)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON public.messages (conversation_id, created_at DESC);

-- 3. Composite indexes on friendships for status lookups
CREATE INDEX IF NOT EXISTS idx_friendships_user_status 
ON public.friendships (user_id, status);

CREATE INDEX IF NOT EXISTS idx_friendships_friend_status 
ON public.friendships (friend_id, status);

-- 4. Composite index on conversation_participants for DM user lookups
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conv_user 
ON public.conversation_participants (conversation_id, user_id);
