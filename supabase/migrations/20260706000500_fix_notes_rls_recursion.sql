-- Fix infinite RLS recursion between notes and note_group_shares tables.
-- Both sides of the relationship queried each other through RLS, causing a cycle.
-- Solution: wrap both lookups in SECURITY DEFINER functions that bypass RLS.

-- Function for note_group_shares policies to check note ownership without triggering notes RLS
CREATE OR REPLACE FUNCTION public.user_owns_note(p_note_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM public.notes WHERE id = p_note_id AND created_by = auth.uid());
$$;

GRANT EXECUTE ON FUNCTION public.user_owns_note(UUID) TO authenticated;

-- Function for the notes policy to check group shares without triggering note_group_shares RLS
CREATE OR REPLACE FUNCTION public.note_shared_with_user_groups(p_note_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.note_group_shares ngs
        JOIN public.group_members gm ON gm.group_id = ngs.group_id
        WHERE ngs.note_id = p_note_id AND gm.user_id = auth.uid()
    );
$$;

GRANT EXECUTE ON FUNCTION public.note_shared_with_user_groups(UUID) TO authenticated;

-- Drop ALL existing SELECT policies on notes (multiple migrations may have created duplicates)
DROP POLICY IF EXISTS "Users can view notes" ON public.notes;
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;

-- Single clean notes SELECT policy using SECURITY DEFINER functions to avoid recursion
CREATE POLICY "Users can view their own notes" ON public.notes
    FOR SELECT TO authenticated
    USING (
        auth.uid() = created_by
        OR public.note_shared_with_user_groups(id)
        OR permission_level = 'public'
    );

-- Fix note_group_shares INSERT/DELETE policies to use SECURITY DEFINER function
DROP POLICY IF EXISTS "Note owners can share notes" ON public.note_group_shares;
CREATE POLICY "Note owners can share notes"
ON public.note_group_shares FOR INSERT
TO authenticated
WITH CHECK (
    public.user_owns_note(note_id)
    AND group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Note owners can unshare notes" ON public.note_group_shares;
CREATE POLICY "Note owners can unshare notes"
ON public.note_group_shares FOR DELETE
TO authenticated
USING (public.user_owns_note(note_id));
