-- Migration: Fix Conversation Creation RLS for Direct Messages
-- Allows authenticated creators to insert conversations and select them during RETURNING clause evaluation.

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
