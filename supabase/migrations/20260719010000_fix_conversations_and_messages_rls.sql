-- Migration: Fix Conversations and Messages RLS Policies
-- Restores RLS policies on public.conversations and public.messages that were dropped by CASCADE.

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 1. Conversations SELECT policy
DROP POLICY IF EXISTS "Users can view group conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view conversations" ON public.conversations;

CREATE POLICY "Users can view conversations" ON public.conversations
    FOR SELECT TO authenticated
    USING (
        auth.uid() = created_by
        OR (group_id IS NOT NULL AND (
            public.is_group_member(auth.uid(), group_id)
            OR public.is_group_creator(auth.uid(), group_id)
        ))
    );

-- 2. Conversations INSERT policy
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- 3. Messages SELECT policy
DROP POLICY IF EXISTS "Users can view messages" ON public.messages;

CREATE POLICY "Users can view messages" ON public.messages
    FOR SELECT TO authenticated
    USING (
        conversation_id IN (
            SELECT id FROM public.conversations
            WHERE auth.uid() = created_by
            OR (group_id IS NOT NULL AND (
                public.is_group_member(auth.uid(), group_id)
                OR public.is_group_creator(auth.uid(), group_id)
            ))
        )
    );

-- 4. Messages INSERT policy
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = sender_id
        AND conversation_id IN (
            SELECT id FROM public.conversations
            WHERE auth.uid() = created_by
            OR (group_id IS NOT NULL AND (
                public.is_group_member(auth.uid(), group_id)
                OR public.is_group_creator(auth.uid(), group_id)
            ))
        )
    );
