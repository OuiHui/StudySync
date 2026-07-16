-- Ensure is_group_member is defined as SECURITY DEFINER to prevent RLS recursion
DROP FUNCTION IF EXISTS public.is_group_member(uuid,uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.is_group_member(user_uuid UUID, group_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = group_uuid AND gm.user_id = user_uuid
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_group_member(UUID, UUID) TO authenticated;

-- Enable realtime publication for group_members
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'group_members'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
    END IF;
END;
$$;

-- Set replica identity to FULL for group_members so delete updates replicate group_id to subscribers
ALTER TABLE public.group_members REPLICA IDENTITY FULL;

-- Rebuild SELECT policy on group_members to allow group members to read memberships (needed for realtime notifications)
DROP POLICY IF EXISTS "Users can view group memberships" ON public.group_members;

CREATE POLICY "Users can view group memberships" ON public.group_members
    FOR SELECT USING (
        auth.uid() = user_id
        OR public.is_group_creator(auth.uid(), group_id)
        OR public.group_is_public(group_id)
        OR public.is_group_member(auth.uid(), group_id)
    );
