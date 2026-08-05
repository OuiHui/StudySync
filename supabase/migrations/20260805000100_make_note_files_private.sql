-- Make personal note attachment uploads private.
-- The note-files bucket was previously public, allowing anyone with a URL to read
-- any user's personal note attachments without authentication.
-- This migration locks the bucket to owner-only reads and uses signed URL access.

-- 1. Set the bucket to private
UPDATE storage.buckets
SET public = false
WHERE id = 'note-files';

-- 2. Drop the open public SELECT policy
DROP POLICY IF EXISTS "Public files are accessible to all" ON storage.objects;

-- 3. Replace with an authenticated owner-only SELECT policy
CREATE POLICY "Users can read their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'note-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
);
