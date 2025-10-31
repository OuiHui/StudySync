-- Create friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, friend_id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friendships
-- Users can view their own friendships and friendships where they are the friend
CREATE POLICY "users_view_own_friendships"
ON public.friendships FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id OR auth.uid() = friend_id
);

-- Users can create friend requests (sender)
CREATE POLICY "users_create_friend_requests"
ON public.friendships FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id AND status = 'pending'
);

-- Users can update friendships where they are involved
CREATE POLICY "users_update_friendships"
ON public.friendships FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id OR auth.uid() = friend_id
)
WITH CHECK (
    auth.uid() = user_id OR auth.uid() = friend_id
);

-- Users can delete their own friendships
CREATE POLICY "users_delete_friendships"
ON public.friendships FOR DELETE
TO authenticated
USING (
    auth.uid() = user_id OR auth.uid() = friend_id
);

-- Add function to search users by email or display name
CREATE OR REPLACE FUNCTION public.search_users(search_term TEXT, current_user_id UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    friendship_status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.raw_user_meta_data->>'display_name' as display_name,
        u.raw_user_meta_data->>'avatar_url' as avatar_url,
        COALESCE(
            (SELECT f.status 
             FROM public.friendships f 
             WHERE (f.user_id = current_user_id AND f.friend_id = u.id)
                OR (f.user_id = u.id AND f.friend_id = current_user_id)
             LIMIT 1),
            'none'
        ) as friendship_status
    FROM auth.users u
    WHERE u.id != current_user_id
    AND (
        u.email ILIKE '%' || search_term || '%'
        OR u.raw_user_meta_data->>'display_name' ILIKE '%' || search_term || '%'
    )
    LIMIT 20;
END;
$$;

-- Comments
COMMENT ON TABLE public.friendships IS 'Stores friendship relationships and friend requests between users';
COMMENT ON FUNCTION public.search_users IS 'Search for users by email or display name with friendship status';
