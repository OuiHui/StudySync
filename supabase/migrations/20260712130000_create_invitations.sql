-- Fix is_friends_with column mismatch
CREATE OR REPLACE FUNCTION public.is_friends_with(_user_id uuid, _friend_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.friendships 
    WHERE ((user_id = _user_id AND friend_id = _friend_id) 
           OR (user_id = _friend_id AND friend_id = _user_id))
    AND status = 'accepted'
  );
END;
$$;

-- Create group_invitations table
CREATE TABLE IF NOT EXISTS public.group_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
    invited_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_by_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_group_invite UNIQUE (group_id, invited_user_id)
);

-- Enable RLS
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for group_invitations
DROP POLICY IF EXISTS "Users can view own group invitations" ON public.group_invitations;
CREATE POLICY "Users can view own group invitations"
ON public.group_invitations FOR SELECT
USING (auth.uid() = invited_user_id OR auth.uid() = invited_by_id);

DROP POLICY IF EXISTS "Group members can insert group invitations" ON public.group_invitations;
CREATE POLICY "Group members can insert group invitations"
ON public.group_invitations FOR INSERT
WITH CHECK (
    auth.uid() = invited_by_id 
    AND (
        public.group_is_public(group_id)
        OR public.is_group_creator(auth.uid(), group_id)
        OR public.is_group_member(auth.uid(), group_id)
    )
);

DROP POLICY IF EXISTS "Invited users can update their own group invitations" ON public.group_invitations;
CREATE POLICY "Invited users can update their own group invitations"
ON public.group_invitations FOR UPDATE
USING (auth.uid() = invited_user_id);

DROP POLICY IF EXISTS "Users can delete own group invitations" ON public.group_invitations;
CREATE POLICY "Users can delete own group invitations"
ON public.group_invitations FOR DELETE
USING (auth.uid() = invited_user_id OR auth.uid() = invited_by_id);

-- Additional policy on session_participants to allow inviting others
DROP POLICY IF EXISTS "Users can invite others to sessions" ON public.session_participants;
CREATE POLICY "Users can invite others to sessions"
ON public.session_participants FOR INSERT
WITH CHECK (
    auth.uid() = user_id -- Can join themselves
    OR public.is_friends_with(auth.uid(), user_id) -- Can invite their friends
    OR EXISTS ( -- Or if it's a group session, group members can invite others
        SELECT 1 FROM public.study_sessions ss
        WHERE ss.id = session_id
        AND ss.group_id IS NOT NULL
        AND public.is_group_member(auth.uid(), ss.group_id)
    )
);

-- Trigger function for group invitations table events
CREATE OR REPLACE FUNCTION public.handle_group_invitation_notification()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
    target_group_name TEXT;
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        -- Get display name of inviter
        SELECT COALESCE(display_name, split_part(email, '@', 1), 'Someone')
        INTO sender_name
        FROM public.profiles
        WHERE user_id = NEW.invited_by_id;

        -- Get group name
        SELECT name INTO target_group_name
        FROM public.study_groups
        WHERE id = NEW.group_id;

        -- Create notification for invited user
        INSERT INTO public.notifications (user_id, sender_id, type, title, message, actionable, group_id)
        VALUES (
            NEW.invited_user_id,
            NEW.invited_by_id,
            'group',
            'Group Invitation',
            sender_name || ' invited you to join ' || target_group_name || '.',
            TRUE,
            NEW.group_id
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
        -- Add invited user to group_members
        IF NOT EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_id = NEW.group_id AND user_id = NEW.invited_user_id
        ) THEN
            INSERT INTO public.group_members (group_id, user_id, role)
            VALUES (NEW.group_id, NEW.invited_user_id, 'member');
        END IF;

        -- Mark associated notifications as read
        UPDATE public.notifications
        SET read = TRUE, actionable = FALSE
        WHERE group_id = NEW.group_id AND user_id = NEW.invited_user_id AND type = 'group';
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'declined' THEN
        -- Mark associated notifications as read
        UPDATE public.notifications
        SET read = TRUE, actionable = FALSE
        WHERE group_id = NEW.group_id AND user_id = NEW.invited_user_id AND type = 'group';
    ELSIF TG_OP = 'DELETE' THEN
        -- Remove associated notifications
        DELETE FROM public.notifications
        WHERE group_id = OLD.group_id AND user_id = OLD.invited_user_id AND type = 'group';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on group_invitations
DROP TRIGGER IF EXISTS tr_group_invitation_notification ON public.group_invitations;
CREATE TRIGGER tr_group_invitation_notification
AFTER INSERT OR UPDATE OR DELETE ON public.group_invitations
FOR EACH ROW EXECUTE FUNCTION public.handle_group_invitation_notification();

-- Trigger function for session participants table events
CREATE OR REPLACE FUNCTION public.handle_session_invitation_notification()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
    session_title TEXT;
    host_id UUID;
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
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'invited' AND NEW.status = 'active' THEN
        -- User accepted the session invitation
        -- Mark associated notifications as read
        UPDATE public.notifications
        SET read = TRUE, actionable = FALSE
        WHERE session_id = NEW.session_id AND user_id = NEW.user_id AND type = 'session';
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'invited' THEN
        -- User declined the session invitation
        -- Remove associated notifications
        DELETE FROM public.notifications
        WHERE session_id = OLD.session_id AND user_id = OLD.user_id AND type = 'session';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on session_participants
DROP TRIGGER IF EXISTS tr_session_invitation_notification ON public.session_participants;
CREATE TRIGGER tr_session_invitation_notification
AFTER INSERT OR UPDATE OR DELETE ON public.session_participants
FOR EACH ROW EXECUTE FUNCTION public.handle_session_invitation_notification();
