-- Fix RLS recursion by updating policies to use the existing security definer function
-- This migration fixes the infinite recursion in RLS policies

-- The is_group_member function already exists, so we just need to update the problematic policies
-- to use it instead of direct queries to group_members

-- Fix conversations policies to use the security definer function
DROP POLICY IF EXISTS "Users can view group conversations" ON public.conversations;
CREATE POLICY "Users can view group conversations" ON public.conversations
    FOR SELECT USING (
        auth.uid() = created_by OR
        (group_id IS NOT NULL AND public.is_group_member(auth.uid(), group_id))
    );

-- Fix messages policies to use the security definer function
DROP POLICY IF EXISTS "Users can view messages" ON public.messages;
CREATE POLICY "Users can view messages" ON public.messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM public.conversations
            WHERE auth.uid() = created_by OR
            (group_id IS NOT NULL AND public.is_group_member(auth.uid(), group_id))
        )
    );

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        conversation_id IN (
            SELECT id FROM public.conversations
            WHERE auth.uid() = created_by OR
            (group_id IS NOT NULL AND public.is_group_member(auth.uid(), group_id))
        )
    );

-- Fix notes policies to use the security definer function
DROP POLICY IF EXISTS "Users can view notes" ON public.notes;
CREATE POLICY "Users can view notes" ON public.notes
    FOR SELECT USING (
        auth.uid() = created_by OR
        permission_level = 'public' OR
        (permission_level = 'group' AND group_id IS NOT NULL AND public.is_group_member(auth.uid(), group_id))
    );

DROP POLICY IF EXISTS "Users can update notes" ON public.notes;
CREATE POLICY "Users can update notes" ON public.notes
    FOR UPDATE USING (
        auth.uid() = created_by OR
        (is_collaborative = true AND permission_level = 'group' AND group_id IS NOT NULL AND public.is_group_member(auth.uid(), group_id))
    );