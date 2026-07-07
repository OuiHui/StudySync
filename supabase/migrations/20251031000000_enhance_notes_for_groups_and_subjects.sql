-- Add custom_subjects table to store user-created subjects
CREATE TABLE IF NOT EXISTS public.custom_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(name, created_by)
);

-- Enable RLS on custom_subjects
ALTER TABLE public.custom_subjects ENABLE ROW LEVEL SECURITY;

-- RLS policies for custom_subjects
DROP POLICY IF EXISTS "Users can view their own subjects" ON public.custom_subjects;
CREATE POLICY "Users can view their own subjects"
ON public.custom_subjects FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create their own subjects" ON public.custom_subjects;
CREATE POLICY "Users can create their own subjects"
ON public.custom_subjects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own subjects" ON public.custom_subjects;
CREATE POLICY "Users can update their own subjects"
ON public.custom_subjects FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own subjects" ON public.custom_subjects;
CREATE POLICY "Users can delete their own subjects"
ON public.custom_subjects FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Add shared_with_groups junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.note_group_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(note_id, group_id)
);

-- Enable RLS on note_group_shares
ALTER TABLE public.note_group_shares ENABLE ROW LEVEL SECURITY;

-- RLS policies for note_group_shares
DROP POLICY IF EXISTS "Users can view shares for their groups" ON public.note_group_shares;
CREATE POLICY "Users can view shares for their groups"
ON public.note_group_shares FOR SELECT
TO authenticated
USING (
    group_id IN (
        SELECT group_id FROM public.group_members 
        WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Note owners can share notes" ON public.note_group_shares;
CREATE POLICY "Note owners can share notes"
ON public.note_group_shares FOR INSERT
TO authenticated
WITH CHECK (
    -- Check ownership directly without going through notes RLS
    EXISTS (
        SELECT 1 FROM public.notes n
        WHERE n.id = note_id AND n.created_by = auth.uid()
    )
    AND group_id IN (
        SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Note owners can unshare notes" ON public.note_group_shares;
CREATE POLICY "Note owners can unshare notes"
ON public.note_group_shares FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.notes n
        WHERE n.id = note_id AND n.created_by = auth.uid()
    )
);

-- Update notes RLS policies to account for group sharing
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
CREATE POLICY "Users can view their own notes" ON public.notes
    FOR SELECT USING (
        -- User is the creator
        auth.uid() = created_by
        OR
        -- Note is shared with a group the user is in
        id IN (
            SELECT note_id FROM public.note_group_shares
            WHERE group_id IN (
                SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
            )
        )
        OR
        -- Note is public
        permission_level = 'public'
    );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_subjects_user ON public.custom_subjects(created_by);
CREATE INDEX IF NOT EXISTS idx_note_group_shares_note ON public.note_group_shares(note_id);
CREATE INDEX IF NOT EXISTS idx_note_group_shares_group ON public.note_group_shares(group_id);
CREATE INDEX IF NOT EXISTS idx_notes_subject ON public.notes(subject) WHERE subject IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE public.custom_subjects IS 'User-created custom subjects for organizing notes';
COMMENT ON TABLE public.note_group_shares IS 'Junction table for sharing notes with study groups';
