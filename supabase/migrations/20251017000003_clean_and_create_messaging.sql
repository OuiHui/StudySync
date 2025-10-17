-- Clean up and create messaging infrastructure
-- This migration cleans up any existing conflicting policies and creates the needed tables

-- Fix syntax issues in existing policies by using proper PostgreSQL syntax
-- Drop and recreate policies with proper syntax

-- Clean up any existing problematic policies on group_members
DO $$ BEGIN
    -- Clean up group_members policies
    ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
    
    -- Drop all existing policies
    DROP POLICY IF EXISTS "Users can view their own group memberships" ON group_members;
    DROP POLICY IF EXISTS "Users can join groups" ON group_members;
    DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
    DROP POLICY IF EXISTS "Group admins can manage all memberships" ON group_members;
    DROP POLICY IF EXISTS "Users can view members of public groups" ON group_members;
    DROP POLICY IF EXISTS "Users can read own memberships only" ON group_members;
    DROP POLICY IF EXISTS "Users can insert own memberships only" ON group_members;
    DROP POLICY IF EXISTS "Users can delete own memberships only" ON group_members;
    
    -- Re-enable RLS and create simple policies
    ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
    
    -- Simple policies that won't cause recursion
    CREATE POLICY "Users can view their own group memberships"
      ON group_members FOR SELECT
      USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can join groups"
      ON group_members FOR INSERT
      WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can leave groups"
      ON group_members FOR DELETE
      USING (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN
    -- Continue if there are any errors
    NULL;
END $$;

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
    name TEXT,
    is_group_chat BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' NOT NULL,
    reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    file_url TEXT,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create notes table
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    subject TEXT,
    group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_collaborative BOOLEAN DEFAULT false,
    permission_level TEXT DEFAULT 'private' NOT NULL CHECK (permission_level IN ('private', 'group', 'public')),
    session_id TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies for conversations
DROP POLICY IF EXISTS "Users can view group conversations" ON public.conversations;
CREATE POLICY "Users can view group conversations" ON public.conversations
    FOR SELECT USING (
        auth.uid() = created_by OR
        (group_id IS NOT NULL AND auth.uid() IN (
            SELECT user_id FROM public.group_members 
            WHERE group_id = conversations.group_id
        ))
    );

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Simple RLS policies for messages  
DROP POLICY IF EXISTS "Users can view messages" ON public.messages;
CREATE POLICY "Users can view messages" ON public.messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM public.conversations
            WHERE auth.uid() = created_by OR
            (group_id IS NOT NULL AND auth.uid() IN (
                SELECT user_id FROM public.group_members 
                WHERE group_id = conversations.group_id
            ))
        )
    );

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        conversation_id IN (
            SELECT id FROM public.conversations
            WHERE auth.uid() = created_by OR
            (group_id IS NOT NULL AND auth.uid() IN (
                SELECT user_id FROM public.group_members 
                WHERE group_id = conversations.group_id
            ))
        )
    );

-- Simple RLS policies for notes
DROP POLICY IF EXISTS "Users can view notes" ON public.notes;
CREATE POLICY "Users can view notes" ON public.notes
    FOR SELECT USING (
        auth.uid() = created_by OR
        permission_level = 'public' OR
        (permission_level = 'group' AND group_id IS NOT NULL AND auth.uid() IN (
            SELECT user_id FROM public.group_members 
            WHERE group_id = notes.group_id
        ))
    );

DROP POLICY IF EXISTS "Users can create notes" ON public.notes;
CREATE POLICY "Users can create notes" ON public.notes
    FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update notes" ON public.notes;
CREATE POLICY "Users can update notes" ON public.notes
    FOR UPDATE USING (
        auth.uid() = created_by OR
        (is_collaborative = true AND permission_level = 'group' AND group_id IS NOT NULL AND auth.uid() IN (
            SELECT user_id FROM public.group_members 
            WHERE group_id = notes.group_id
        ))
    );

-- Enable realtime
DO $$ BEGIN
    -- Try to add tables to realtime publication, ignore if already exists
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_group_id ON public.conversations(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notes_group_id ON public.notes(group_id);

-- Create updated_at function and triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language plpgsql;

DROP TRIGGER IF EXISTS handle_updated_at ON public.conversations;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.messages;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.notes;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();