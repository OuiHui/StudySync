-- Create RPC function to get a user's public study sessions (created by them or where they participate)
CREATE OR REPLACE FUNCTION public.get_user_public_sessions(
    target_user_id UUID
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    subject TEXT,
    status TEXT,
    group_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        ss.id,
        ss.title::TEXT,
        ss.description::TEXT,
        ss.scheduled_start,
        ss.scheduled_end,
        ss.subject::TEXT,
        ss.status::TEXT,
        sg.name::TEXT AS group_name
    FROM public.study_sessions ss
    LEFT JOIN public.study_groups sg ON sg.id = ss.group_id
    LEFT JOIN public.session_participants sp ON sp.session_id = ss.id
    WHERE (ss.created_by = target_user_id OR sp.user_id = target_user_id)
      AND (ss.group_id IS NULL OR sg.is_public = true)
    ORDER BY ss.scheduled_start DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_public_sessions(UUID) TO authenticated;
