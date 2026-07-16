-- Helper function to check if a user is an admin of a group without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_group_admin(user_uuid UUID, group_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = group_uuid 
          AND gm.user_id = user_uuid 
          AND gm.role = 'admin'
    ) OR EXISTS (
        SELECT 1 FROM public.study_groups sg
        WHERE sg.id = group_uuid 
          AND sg.created_by = user_uuid
    );
END;
$$;

-- Grant execute permissions on the helper function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_group_admin(UUID, UUID) TO authenticated;

-- Rebuild delete policy on group_members to allow group admins to delete memberships
DROP POLICY IF EXISTS "Users can delete own memberships" ON public.group_members;

CREATE POLICY "Users can delete memberships" ON public.group_members
    FOR DELETE USING (
        auth.uid() = user_id
        OR public.is_group_admin(auth.uid(), group_id)
    );
