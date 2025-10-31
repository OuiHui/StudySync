-- Drop existing objects if they exist
DROP FUNCTION IF EXISTS public.search_users(TEXT, UUID);
DROP TABLE IF EXISTS public.friendships;

-- Create friendships table
CREATE TABLE public.friendships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_friendship UNIQUE(user_id, friend_id)
);

-- Create indexes
CREATE INDEX idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX idx_friendships_status ON public.friendships(status);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own friendships"
ON public.friendships FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests"
ON public.friendships FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Users can update their friendships"
ON public.friendships FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = friend_id)
WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships"
ON public.friendships FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Create search function
CREATE OR REPLACE FUNCTION public.search_users(
    search_term TEXT,
    current_user_id UUID
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    friendship_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email::TEXT,
        (au.raw_user_meta_data->>'display_name')::TEXT as display_name,
        (au.raw_user_meta_data->>'avatar_url')::TEXT as avatar_url,
        COALESCE(
            (
                SELECT f.status 
                FROM public.friendships f 
                WHERE (f.user_id = current_user_id AND f.friend_id = au.id)
                   OR (f.user_id = au.id AND f.friend_id = current_user_id)
                LIMIT 1
            ),
            'none'
        )::TEXT as friendship_status
    FROM auth.users au
    WHERE au.id != current_user_id
      AND (
          au.email ILIKE '%' || search_term || '%'
          OR (au.raw_user_meta_data->>'display_name') ILIKE '%' || search_term || '%'
      )
    ORDER BY au.email
    LIMIT 20;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.search_users(TEXT, UUID) TO authenticated;

-- Comments
COMMENT ON TABLE public.friendships IS 'Stores friendship relationships between users';
COMMENT ON COLUMN public.friendships.user_id IS 'The user who initiated the friendship/request';
COMMENT ON COLUMN public.friendships.friend_id IS 'The user receiving the friendship/request';
COMMENT ON COLUMN public.friendships.status IS 'Status: pending (request), accepted (friends), or blocked';
COMMENT ON FUNCTION public.search_users IS 'Search users by email or name with friendship status';
