-- Fix recursive RLS on group_members by using security definer helper functions
-- and rebuilding all policies to avoid cross-table recursion

-- Helper function to check if a group is public without triggering RLS
CREATE OR REPLACE FUNCTION public.group_is_public(group_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.study_groups sg
        WHERE sg.id = group_uuid AND sg.is_public = true
    );
END;
$$;

-- Helper function to check if a user is the creator of a group without triggering RLS
CREATE OR REPLACE FUNCTION public.is_group_creator(user_uuid UUID, group_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.study_groups sg
        WHERE sg.id = group_uuid AND sg.created_by = user_uuid
    );
END;
$$;

-- Grant execute permissions on the helper functions
GRANT EXECUTE ON FUNCTION public.group_is_public(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_creator(UUID, UUID) TO authenticated;

-- Rebuild all policies on group_members using the helper functions to prevent recursion
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Disable RLS while rebuilding
    ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;

    -- Drop any existing policies (names might vary)
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'group_members'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.group_members', policy_record.policyname);
    END LOOP;

    -- Re-enable RLS after cleanup
    ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.group_members FORCE ROW LEVEL SECURITY;

    -- Users can view their own memberships or memberships for groups they created or public groups
    CREATE POLICY "Users can view group memberships" ON public.group_members
        FOR SELECT USING (
            auth.uid() = user_id
            OR public.is_group_creator(auth.uid(), group_id)
            OR public.group_is_public(group_id)
        );

    -- Users can join groups by inserting their own memberships
    CREATE POLICY "Users can insert own memberships" ON public.group_members
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    -- Users can leave groups by deleting their own memberships
    CREATE POLICY "Users can delete own memberships" ON public.group_members
        FOR DELETE USING (auth.uid() = user_id);

    -- Group creators can update/modify memberships for their groups
    CREATE POLICY "Group creators can manage memberships" ON public.group_members
        FOR UPDATE USING (public.is_group_creator(auth.uid(), group_id));
END;
$$;
