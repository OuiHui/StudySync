-- Update search_users to return friends_count, groups_count, and public_groups
DROP FUNCTION IF EXISTS public.search_users(TEXT, UUID);

CREATE OR REPLACE FUNCTION public.search_users(
    search_term TEXT,
    current_user_id UUID
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    major TEXT,
    year TEXT,
    top_subjects TEXT[],
    gradient_from TEXT,
    gradient_to TEXT,
    study_hours INT,
    friendship_status TEXT,
    friendship_id UUID,
    mutual_friends INT,
    friends_count INT,
    groups_count INT,
    public_groups TEXT[]
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
        COALESCE(p.display_name, au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1))::TEXT AS display_name,
        COALESCE(p.avatar_url, au.raw_user_meta_data->>'avatar_url')::TEXT AS avatar_url,
        p.bio::TEXT,
        p.major::TEXT,
        p.year::TEXT,
        p.top_subjects,
        COALESCE(p.gradient_from, 'from-blue-400')::TEXT,
        COALESCE(p.gradient_to, 'to-blue-600')::TEXT,
        COALESCE(p.study_hours, 0)::INT AS study_hours,
        COALESCE(f.status, 'none')::TEXT AS friendship_status,
        f.id AS friendship_id,
        -- mutual friends with current user
        (
            SELECT COALESCE(COUNT(*), 0)::INT
            FROM (
                SELECT CASE WHEN f1.user_id = current_user_id THEN f1.friend_id ELSE f1.user_id END AS fid
                FROM public.friendships f1
                WHERE (f1.user_id = current_user_id OR f1.friend_id = current_user_id)
                  AND f1.status = 'accepted'
            ) u1
            INNER JOIN (
                SELECT CASE WHEN f2.user_id = au.id THEN f2.friend_id ELSE f2.user_id END AS fid
                FROM public.friendships f2
                WHERE (f2.user_id = au.id OR f2.friend_id = au.id)
                  AND f2.status = 'accepted'
            ) u2 ON u1.fid = u2.fid
        )::INT AS mutual_friends,
        -- total accepted friends of this user
        (
            SELECT COUNT(*)::INT
            FROM public.friendships f3
            WHERE (f3.user_id = au.id OR f3.friend_id = au.id)
              AND f3.status = 'accepted'
        ) AS friends_count,
        -- count of public study groups the user belongs to
        (
            SELECT COUNT(*)::INT
            FROM public.group_members gm
            JOIN public.study_groups sg ON sg.id = gm.group_id
            WHERE gm.user_id = au.id AND sg.is_public = true
        ) AS groups_count,
        -- names of public study groups the user belongs to
        (
            SELECT COALESCE(ARRAY_AGG(sg.name ORDER BY sg.name), ARRAY[]::TEXT[])
            FROM public.group_members gm
            JOIN public.study_groups sg ON sg.id = gm.group_id
            WHERE gm.user_id = au.id AND sg.is_public = true
        ) AS public_groups
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.user_id
    LEFT JOIN public.friendships f ON
        (f.user_id = current_user_id AND f.friend_id = au.id)
     OR (f.user_id = au.id AND f.friend_id = current_user_id)
    WHERE au.id != current_user_id
      AND (
          au.email ILIKE '%' || search_term || '%'
          OR COALESCE(p.display_name, au.raw_user_meta_data->>'display_name') ILIKE '%' || search_term || '%'
          OR p.major ILIKE '%' || search_term || '%'
      )
    ORDER BY au.email
    LIMIT 20;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_users(TEXT, UUID) TO authenticated;

-- Returns the friends list of a target user, with a flag indicating if the current user is also friends with each person
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
        COALESCE(p.display_name, split_part(COALESCE(p.email, ''), '@', 1), 'User')::TEXT,
        COALESCE(p.email, '')::TEXT,
        COALESCE(p.major, '')::TEXT,
        COALESCE(p.gradient_from, 'from-blue-400')::TEXT,
        COALESCE(p.gradient_to, 'to-blue-600')::TEXT,
        p.avatar_url::TEXT,
        EXISTS(
            SELECT 1 FROM public.friendships f2
            WHERE (
                (f2.user_id = current_user_id AND f2.friend_id = fid)
                OR (f2.friend_id = current_user_id AND f2.user_id = fid)
            ) AND f2.status = 'accepted'
        ) AS is_mutual
    FROM (
        SELECT CASE WHEN f.user_id = target_user_id THEN f.friend_id ELSE f.user_id END AS fid
        FROM public.friendships f
        WHERE (f.user_id = target_user_id OR f.friend_id = target_user_id)
          AND f.status = 'accepted'
    ) friends_cte
    LEFT JOIN public.profiles p ON p.user_id = fid
    WHERE fid != current_user_id
    ORDER BY COALESCE(p.display_name, p.email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_friends(UUID, UUID) TO authenticated;
