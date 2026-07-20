-- Migration: Fix Direct Messages (DM) RLS Infinite Recursion & Access Policies
-- Creates SECURITY DEFINER functions to break policy recursion between conversations and conversation_participants.

-- 1. Helper SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE user_id = _user_id
      AND conversation_id = _conversation_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_conversation(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = _conversation_id
      AND (
        c.created_by = _user_id
        OR public.is_conversation_participant(_user_id, _conversation_id)
        OR (c.group_id IS NOT NULL AND (
          public.is_group_member(_user_id, c.group_id)
          OR public.is_group_creator(_user_id, c.group_id)
        ))
      )
  );
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_conversation(uuid, uuid) TO authenticated;

-- 2. Ensure RLS is enabled on tables
ALTER TABLE IF EXISTS public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policy for conversation_participants
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
CREATE POLICY "Users can view conversation participants" ON public.conversation_participants
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR public.can_access_conversation(auth.uid(), conversation_id)
    );

DROP POLICY IF EXISTS "Users can insert conversation participants" ON public.conversation_participants;
CREATE POLICY "Users can insert conversation participants" ON public.conversation_participants
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- 4. RLS Policy for conversations
DROP POLICY IF EXISTS "Users can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view group conversations" ON public.conversations;

CREATE POLICY "Users can view conversations" ON public.conversations
    FOR SELECT TO authenticated
    USING (
        created_by = auth.uid()
        OR public.can_access_conversation(auth.uid(), id)
    );

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT TO authenticated
    WITH CHECK (
        created_by = auth.uid()
        OR auth.uid() IS NOT NULL
    );

-- 5. RLS Policies for messages
DROP POLICY IF EXISTS "Users can view messages" ON public.messages;
CREATE POLICY "Users can view messages" ON public.messages
    FOR SELECT TO authenticated
    USING (
        public.can_access_conversation(auth.uid(), conversation_id)
    );

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = sender_id
        AND public.can_access_conversation(auth.uid(), conversation_id)
    );
