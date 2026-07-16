-- Drop existing get_user_friends function
DROP FUNCTION IF EXISTS public.get_user_friends(UUID, UUID);

-- Recreate get_user_friends function without privacy visibility restrictions
CREATE OR REPLACE FUNCTION public.get_user_friends(
    target_user_id UUID,
    current_user_id UUID
)
RETURNS TABLE (
    friend_user_id UUID,
    display_name TEXT,
    email TEXT,
    major TEXT,
    gradient_from TEXT,
    gradient_to TEXT,
    avatar_url TEXT,
    is_mutual BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        fid AS friend_user_id,
        COALESCE(p.display_name, split_part(COALESCE(p.email, ''), '@', 1), 'User')::TEXT AS display_name,
        COALESCE(p.email, '')::TEXT AS email,
        COALESCE(p.major, '')::TEXT AS major,
        COALESCE(p.gradient_from, 'from-blue-400')::TEXT AS gradient_from,
        COALESCE(p.gradient_to, 'to-blue-600')::TEXT AS gradient_to,
        p.avatar_url::TEXT AS avatar_url,
        (fid = current_user_id OR EXISTS(
            SELECT 1 FROM public.friendships f2
            WHERE (
                (f2.user_id = current_user_id AND f2.friend_id = fid)
                OR (f2.friend_id = current_user_id AND f2.user_id = fid)
            ) AND f2.status = 'accepted'
        )) AS is_mutual
    FROM (
        SELECT CASE WHEN f.user_id = target_user_id THEN f.friend_id ELSE f.user_id END AS fid
        FROM public.friendships f
        WHERE (f.user_id = target_user_id OR f.friend_id = target_user_id)
          AND f.status = 'accepted'
    ) friends_cte
    LEFT JOIN public.profiles p ON p.user_id = fid
    ORDER BY COALESCE(p.display_name, p.email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_friends(UUID, UUID) TO authenticated;

-- Create get_mutual_friends function
DROP FUNCTION IF EXISTS public.get_mutual_friends(UUID, UUID);

CREATE OR REPLACE FUNCTION public.get_mutual_friends(
    target_user_id UUID,
    current_user_id UUID
)
RETURNS TABLE (
    friend_user_id UUID,
    display_name TEXT,
    email TEXT,
    major TEXT,
    gradient_from TEXT,
    gradient_to TEXT,
    avatar_url TEXT,
    is_mutual BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        fid AS friend_user_id,
        COALESCE(p.display_name, split_part(COALESCE(p.email, ''), '@', 1), 'User')::TEXT AS display_name,
        COALESCE(p.email, '')::TEXT AS email,
        COALESCE(p.major, '')::TEXT AS major,
        COALESCE(p.gradient_from, 'from-blue-400')::TEXT AS gradient_from,
        COALESCE(p.gradient_to, 'to-blue-600')::TEXT AS gradient_to,
        p.avatar_url::TEXT AS avatar_url,
        TRUE::BOOLEAN AS is_mutual
    FROM (
        SELECT u1.fid FROM (
            SELECT CASE WHEN f1.user_id = current_user_id THEN f1.friend_id ELSE f1.user_id END AS fid
            FROM public.friendships f1
            WHERE (f1.user_id = current_user_id OR f1.friend_id = current_user_id)
              AND f1.status = 'accepted'
        ) u1
        INNER JOIN (
            SELECT CASE WHEN f2.user_id = target_user_id THEN f2.friend_id ELSE f2.user_id END AS fid
            FROM public.friendships f2
            WHERE (f2.user_id = target_user_id OR f2.friend_id = target_user_id)
              AND f2.status = 'accepted'
        ) u2 ON u1.fid = u2.fid
    ) mutuals_cte
    LEFT JOIN public.profiles p ON p.user_id = fid
    WHERE fid != current_user_id
    ORDER BY COALESCE(p.display_name, p.email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_mutual_friends(UUID, UUID) TO authenticated;
