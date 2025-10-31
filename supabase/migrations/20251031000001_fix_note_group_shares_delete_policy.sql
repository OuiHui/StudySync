-- Fix the DELETE policy for note_group_shares to allow note owners to delete shares
DROP POLICY IF EXISTS "Note owners can unshare notes" ON public.note_group_shares;

CREATE POLICY "Note owners can delete shares"
ON public.note_group_shares FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.notes 
        WHERE notes.id = note_group_shares.note_id 
        AND notes.created_by = auth.uid()
    )
);
