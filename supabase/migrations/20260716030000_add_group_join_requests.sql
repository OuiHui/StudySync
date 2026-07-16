-- Add support for group join requests in group_invitations table

-- 1. Add is_request column
ALTER TABLE public.group_invitations ADD COLUMN IF NOT EXISTS is_request BOOLEAN DEFAULT false NOT NULL;

-- 2. Add INSERT policy for join requests
DROP POLICY IF EXISTS "Users can insert group join requests" ON public.group_invitations;
CREATE POLICY "Users can insert group join requests" ON public.group_invitations
    FOR INSERT WITH CHECK (
        auth.uid() = invited_by_id
        AND is_request = true
    );

-- 3. Update notification handle trigger function
CREATE OR REPLACE FUNCTION public.handle_group_invitation_notification()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
    target_group_name TEXT;
    notif_title TEXT;
    notif_msg TEXT;
    member_to_add UUID;
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        -- Get display name of sender (invited_by_id)
        SELECT COALESCE(display_name, split_part(email, '@', 1), 'Someone')
        INTO sender_name
        FROM public.profiles
        WHERE user_id = NEW.invited_by_id;

        -- Get group name
        SELECT name INTO target_group_name
        FROM public.study_groups
        WHERE id = NEW.group_id;

        IF NEW.is_request = TRUE THEN
            notif_title := 'Group Join Request';
            notif_msg := sender_name || ' requested to join ' || target_group_name || '.';
        ELSE
            notif_title := 'Group Invitation';
            notif_msg := sender_name || ' invited you to join ' || target_group_name || '.';
        END IF;

        -- Create notification for recipient (invited_user_id)
        INSERT INTO public.notifications (user_id, sender_id, type, title, message, actionable, group_id)
        VALUES (
            NEW.invited_user_id,
            NEW.invited_by_id,
            'group',
            notif_title,
            notif_msg,
            TRUE,
            NEW.group_id
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
        -- Determine who gets added to the group
        IF NEW.is_request = TRUE THEN
            member_to_add := NEW.invited_by_id; -- The requester
        ELSE
            member_to_add := NEW.invited_user_id; -- The invitee
        END IF;

        -- Add user to group_members
        IF NOT EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_id = NEW.group_id AND user_id = member_to_add
        ) THEN
            INSERT INTO public.group_members (group_id, user_id, role)
            VALUES (NEW.group_id, member_to_add, 'member');
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
