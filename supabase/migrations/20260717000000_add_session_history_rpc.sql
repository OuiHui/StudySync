-- RPC: get the authenticated user's finished/completed session history
-- Returns private sessions too (SECURITY DEFINER reads as superuser)
DROP FUNCTION IF EXISTS public.get_my_session_history(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.get_my_session_history(
    p_limit  INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id                UUID,
    title             TEXT,
    subject           TEXT,
    status            TEXT,
    scheduled_start   TIMESTAMPTZ,
    scheduled_end     TIMESTAMPTZ,
    group_id          UUID,
    group_name        TEXT,
    is_solo           BOOLEAN,
    participant_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    RETURN QUERY
    SELECT DISTINCT
        ss.id,
        ss.title::TEXT,
        ss.subject::TEXT,
        ss.status::TEXT,
        ss.scheduled_start,
        ss.scheduled_end,
        ss.group_id,
        sg.name::TEXT AS group_name,
        (ss.group_id IS NULL)::BOOLEAN AS is_solo,
        (
            SELECT COUNT(*)
            FROM public.session_participants sp2
            WHERE sp2.session_id = ss.id
        ) AS participant_count
    FROM public.study_sessions ss
    LEFT JOIN public.study_groups sg ON sg.id = ss.group_id
    LEFT JOIN public.session_participants sp ON sp.session_id = ss.id
    WHERE
        (ss.created_by = v_user_id OR sp.user_id = v_user_id)
        AND ss.status IN ('finished', 'completed', 'cancelled')
    ORDER BY ss.scheduled_start DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_session_history(INTEGER, INTEGER) TO authenticated;
