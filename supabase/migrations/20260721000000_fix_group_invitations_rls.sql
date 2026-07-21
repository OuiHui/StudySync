-- Migration: Fix Group Invitations RLS Policies
-- Ensures users can invite friends or submit join requests to study groups without encountering 403 Forbidden / 42501 RLS policy errors.

ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- 1. Drop existing policies on group_invitations
DROP POLICY IF EXISTS "Users can view own group invitations" ON public.group_invitations;
DROP POLICY IF EXISTS "Users can view group invitations" ON public.group_invitations;

DROP POLICY IF EXISTS "Group members can insert group invitations" ON public.group_invitations;
DROP POLICY IF EXISTS "Users can insert group join requests" ON public.group_invitations;
DROP POLICY IF EXISTS "Users can insert group invitations" ON public.group_invitations;

DROP POLICY IF EXISTS "Invited users can update their own group invitations" ON public.group_invitations;
DROP POLICY IF EXISTS "Users can update group invitations" ON public.group_invitations;

DROP POLICY IF EXISTS "Users can delete own group invitations" ON public.group_invitations;
DROP POLICY IF EXISTS "Users can delete group invitations" ON public.group_invitations;

-- 2. CREATE SELECT policy
-- Users can view invitations if they are the recipient, the sender, or a member/creator of the target group.
CREATE POLICY "Users can view group invitations"
ON public.group_invitations FOR SELECT
TO authenticated
USING (
    auth.uid() = invited_user_id 
    OR auth.uid() = invited_by_id
    OR public.is_group_creator(auth.uid(), group_id)
    OR public.is_group_member(auth.uid(), group_id)
);

-- 3. CREATE INSERT policy
-- Authenticated users can insert an invitation or join request as long as they are the sender (invited_by_id).
CREATE POLICY "Users can insert group invitations"
ON public.group_invitations FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = invited_by_id
);

-- 4. CREATE UPDATE policy
-- Invited users, senders, or group creators/members can update invitation status (e.g. accepting/declining).
CREATE POLICY "Users can update group invitations"
ON public.group_invitations FOR UPDATE
TO authenticated
USING (
    auth.uid() = invited_user_id 
    OR auth.uid() = invited_by_id
    OR public.is_group_creator(auth.uid(), group_id)
    OR public.is_group_member(auth.uid(), group_id)
);

-- 5. CREATE DELETE policy
-- Senders, recipients, or group creators can remove invitations.
CREATE POLICY "Users can delete group invitations"
ON public.group_invitations FOR DELETE
TO authenticated
USING (
    auth.uid() = invited_user_id 
    OR auth.uid() = invited_by_id
    OR public.is_group_creator(auth.uid(), group_id)
);
