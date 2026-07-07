-- Create storage bucket for note files (PDFs, documents, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('note-files', 'note-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own files
-- Files are organized by user ID in folders
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'note-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow all users to read public files
-- This enables sharing of notes and viewing uploaded materials
DROP POLICY IF EXISTS "Public files are accessible to all" ON storage.objects;
CREATE POLICY "Public files are accessible to all"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'note-files');

-- Allow users to update their own files
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'note-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'note-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'note-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add file_url and file_name columns to notes table if they don't exist
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Add index on file_url for faster queries
CREATE INDEX IF NOT EXISTS idx_notes_file_url ON notes(file_url) WHERE file_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN notes.file_url IS 'Public URL of the uploaded file (PDF, image, etc.) stored in Supabase Storage';
COMMENT ON COLUMN notes.file_name IS 'Original filename of the uploaded file for display purposes';
