-- Update handle_session_invitation_notification function to notify host when invite accepted
CREATE OR REPLACE FUNCTION public.handle_session_invitation_notification()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
    session_title TEXT;
    host_id UUID;
    invitee_name TEXT;
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'invited' THEN
        -- Get session title and host (created_by)
        SELECT title, created_by INTO session_title, host_id
        FROM public.study_sessions
        WHERE id = NEW.session_id;

        -- Get display name of the host/sender
        SELECT COALESCE(display_name, split_part(email, '@', 1), 'Someone')
        INTO sender_name
        FROM public.profiles
        WHERE user_id = COALESCE(host_id, auth.uid());

        -- Create notification for invited user
        INSERT INTO public.notifications (user_id, sender_id, type, title, message, actionable, session_id)
        VALUES (
            NEW.user_id,
            COALESCE(host_id, auth.uid()),
            'session',
            'Study Session Invitation',
            sender_name || ' invited you to join the study session: ' || session_title || '.',
            TRUE,
            NEW.session_id
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'invited' AND NEW.status = 'accepted' THEN
        -- User accepted the session invitation (planning to attend)
        -- Get session title and host (created_by)
        SELECT title, created_by INTO session_title, host_id
        FROM public.study_sessions
        WHERE id = NEW.session_id;

        -- Get display name of the invitee (who is accepting)
        SELECT COALESCE(display_name, split_part(email, '@', 1), 'Someone')
        INTO invitee_name
        FROM public.profiles
        WHERE user_id = NEW.user_id;

        -- Mark associated notifications as read
        UPDATE public.notifications
        SET read = TRUE, actionable = FALSE
        WHERE session_id = NEW.session_id AND user_id = NEW.user_id AND type = 'session';

        -- Send notification to the host
        IF host_id IS NOT NULL AND host_id != NEW.user_id THEN
            INSERT INTO public.notifications (user_id, sender_id, type, title, message, actionable, session_id)
            VALUES (
                host_id,
                NEW.user_id,
                'session',
                'Session Invite Accepted',
                invitee_name || ' accepted your invitation to the study session: ' || session_title || '.',
                FALSE,
                NEW.session_id
            );
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'invited' THEN
        -- User declined the session invitation
        -- Remove associated notifications
        DELETE FROM public.notifications
        WHERE session_id = OLD.session_id AND user_id = OLD.user_id AND type = 'session';
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
