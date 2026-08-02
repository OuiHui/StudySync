-- Migration: Optimize Messaging Queries with Composite Indexes and Aggregated RPC Function
-- This migration adds performance indexes and an RPC function to fetch conversation list metadata in a single round-trip.

-- 1. Create Composite Indexes for Fast Sorting and Join Performance
CREATE INDEX IF NOT EXISTS idx_messages_conv_created 
ON public.messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conv_participants_user_active 
ON public.conversation_participants (user_id, is_active, conversation_id);

CREATE INDEX IF NOT EXISTS idx_conv_participants_conv_user 
ON public.conversation_participants (conversation_id, user_id);

-- 2. Create RPC Function to Aggregated Conversation Overview
CREATE OR REPLACE FUNCTION public.get_user_conversations_overview(_user_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  is_group_chat BOOLEAN,
  group_id UUID,
  conversation_name TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  target_user_id UUID,
  target_display_name TEXT,
  target_avatar_url TEXT,
  latest_message_id UUID,
  latest_message_content TEXT,
  latest_message_created_at TIMESTAMP WITH TIME ZONE,
  latest_sender_id UUID,
  latest_sender_name TEXT,
  latest_sender_avatar_url TEXT
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH user_convs AS (
    SELECT cp.conversation_id
    FROM public.conversation_participants cp
    WHERE cp.user_id = _user_id 
      AND (cp.is_active IS TRUE OR cp.is_active IS NULL)
  ),
  latest_msgs AS (
    SELECT DISTINCT ON (m.conversation_id)
      m.id,
      m.conversation_id,
      m.content,
      m.created_at,
      m.sender_id
    FROM public.messages m
    WHERE m.conversation_id IN (SELECT conversation_id FROM user_convs)
    ORDER BY m.conversation_id, m.created_at DESC
  )
  SELECT 
    c.id AS conversation_id,
    c.is_group_chat,
    c.group_id,
    c.name AS conversation_name,
    c.created_by,
    c.created_at,
    c.updated_at,
    p_other.user_id AS target_user_id,
    p_other.display_name AS target_display_name,
    p_other.avatar_url AS target_avatar_url,
    lm.id AS latest_message_id,
    lm.content AS latest_message_content,
    lm.created_at AS latest_message_created_at,
    lm.sender_id AS latest_sender_id,
    p_sender.display_name AS latest_sender_name,
    p_sender.avatar_url AS latest_sender_avatar_url
  FROM public.conversations c
  JOIN user_convs uc ON c.id = uc.conversation_id
  LEFT JOIN latest_msgs lm ON lm.conversation_id = c.id
  LEFT JOIN public.profiles p_sender ON p_sender.user_id = lm.sender_id
  LEFT JOIN public.conversation_participants cp_other ON cp_other.conversation_id = c.id AND cp_other.user_id != _user_id
  LEFT JOIN public.profiles p_other ON p_other.user_id = cp_other.user_id;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_conversations_overview(UUID) TO authenticated;
