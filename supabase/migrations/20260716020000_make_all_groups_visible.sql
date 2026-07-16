-- Make all study groups visible by updating RLS policies

-- 1. Enable RLS on study_groups explicitly (if not already enabled)
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups FORCE ROW LEVEL SECURITY;

-- 2. Drop existing SELECT policies on study_groups
DROP POLICY IF EXISTS "Anyone can read public groups" ON public.study_groups;
DROP POLICY IF EXISTS "Users can read groups they created" ON public.study_groups;
DROP POLICY IF EXISTS "Anyone can read study groups" ON public.study_groups;

-- 3. Create a new policy allowing any user to view all study groups
CREATE POLICY "Anyone can read study groups"
  ON public.study_groups FOR SELECT
  USING (true);

-- 4. Rebuild the INSERT policy on group_members to allow direct join only for public groups
-- (or by the creator of the group). Private groups must be joined via invitations.
DROP POLICY IF EXISTS "Users can insert own memberships" ON public.group_members;
CREATE POLICY "Users can insert own memberships" ON public.group_members
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND (
            public.group_is_public(group_id)
            OR public.is_group_creator(auth.uid(), group_id)
        )
    );
