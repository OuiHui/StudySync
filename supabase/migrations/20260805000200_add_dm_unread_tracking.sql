-- Add last_read_at tracking to conversation_participants for DM unread counts.
-- This enables computing per-conversation unread message counts without a dedicated counter table.

ALTER TABLE public.conversation_participants
    ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT NOW();

-- Index to accelerate the unread count subquery
CREATE INDEX IF NOT EXISTS idx_cp_last_read
    ON public.conversation_participants (conversation_id, user_id, last_read_at);

-- RPC to fetch unread counts for all of a user's conversations in a single query
CREATE OR REPLACE FUNCTION public.get_unread_counts(_user_id UUID)
RETURNS TABLE(conversation_id UUID, unread_count BIGINT)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT
        m.conversation_id,
        COUNT(*) AS unread_count
    FROM public.messages m
    JOIN public.conversation_participants cp
        ON cp.conversation_id = m.conversation_id
        AND cp.user_id = _user_id
    WHERE
        m.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamptz)
        AND m.sender_id != _user_id
    GROUP BY m.conversation_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_unread_counts(UUID) TO authenticated;
