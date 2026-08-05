-- Add database-level RLS policies for UPDATE and DELETE on notes.
-- Previously, ownership was only enforced by the service-layer query filter (.eq('created_by', ...)).
-- Bypassing the service (e.g. via the Supabase dashboard or a direct DB connection) would allow
-- any authenticated user to modify or delete any note. These policies close that gap.

CREATE POLICY "Note owners can update their own notes" ON public.notes
    FOR UPDATE TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Note owners can delete their own notes" ON public.notes
    FOR DELETE TO authenticated
    USING (auth.uid() = created_by);
