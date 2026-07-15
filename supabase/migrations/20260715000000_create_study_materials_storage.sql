-- Create storage bucket for study materials (PDFs, documents, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('study_materials', 'study_materials', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS policies for storage.objects on the new bucket

-- 1. SELECT Policy: Allow authenticated users to read files if they are a member of the group.
-- File path format: group_id/user_id/filename
-- Folder 1 (storage.foldername(name))[1] is group_id
DROP POLICY IF EXISTS "Allow members to read study materials" ON storage.objects;
CREATE POLICY "Allow members to read study materials"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'study_materials'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = (storage.foldername(name))[1]::uuid
      AND group_members.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.study_groups
      WHERE study_groups.id = (storage.foldername(name))[1]::uuid
      AND study_groups.created_by = auth.uid()
    )
  )
);

-- 2. INSERT Policy: Allow group members to upload study materials with constraints.
-- Requires authenticated user, group membership, matching folder 2 (user_id), and valid file extensions.
DROP POLICY IF EXISTS "Allow members to upload study materials" ON storage.objects;
CREATE POLICY "Allow members to upload study materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'study_materials'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND (storage.foldername(name))[2] IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = (storage.foldername(name))[1]::uuid
      AND group_members.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.study_groups
      WHERE study_groups.id = (storage.foldername(name))[1]::uuid
      AND study_groups.created_by = auth.uid()
    )
  )
  AND lower(storage.extension(name)) IN ('pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'png', 'jpg', 'jpeg')
);

-- 3. UPDATE Policy: Allow users to update their own study materials
DROP POLICY IF EXISTS "Allow users to update their own study materials" ON storage.objects;
CREATE POLICY "Allow users to update their own study materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'study_materials'
  AND (storage.foldername(name))[2] IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[2]
)
WITH CHECK (
  bucket_id = 'study_materials'
  AND (storage.foldername(name))[2] IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- 4. DELETE Policy: Allow users to delete their own study materials
DROP POLICY IF EXISTS "Allow users to delete their own study materials" ON storage.objects;
CREATE POLICY "Allow users to delete their own study materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'study_materials'
  AND (storage.foldername(name))[2] IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[2]
);
