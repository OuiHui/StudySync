-- Alter profiles table to add notification_settings and privacy_settings JSONB fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"emailNotifications": true, "pushNotifications": true, "studyReminders": true, "groupMessages": true, "sessionInvites": true, "weeklyDigest": false, "friendRequests": true, "systemUpdates": false}'::jsonb NOT NULL,
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"profileVisibility": "friends", "studyStatsVisible": true, "onlineStatus": true, "allowFriendRequests": true, "showStudyGroups": true, "showAchievements": true, "allowDirectMessages": true, "shareStudyActivity": false}'::jsonb NOT NULL;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('session', 'group', 'note', 'friend')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    actionable BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    friendship_id UUID REFERENCES public.friendships(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.study_sessions(id) ON DELETE CASCADE
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- Trigger function for friendships table events
CREATE OR REPLACE FUNCTION public.handle_friendship_notification()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
    receiver_name TEXT;
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        -- Get display name of sender
        SELECT COALESCE(display_name, split_part(email, '@', 1), 'Someone')
        INTO sender_name
        FROM public.profiles
        WHERE user_id = NEW.user_id;

        -- Create notification for receiver (friend_id)
        INSERT INTO public.notifications (user_id, sender_id, type, title, message, actionable, friendship_id)
        VALUES (
            NEW.friend_id,
            NEW.user_id,
            'friend',
            'New Friend Request',
            sender_name || ' sent you a friend request.',
            TRUE,
            NEW.id
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
        -- Friend request accepted!
        -- Get display name of receiver (who accepted it)
        SELECT COALESCE(display_name, split_part(email, '@', 1), 'Someone')
        INTO receiver_name
        FROM public.profiles
        WHERE user_id = NEW.friend_id;

        -- Create notification for initiator (user_id)
        INSERT INTO public.notifications (user_id, sender_id, type, title, message, actionable)
        VALUES (
            NEW.user_id,
            NEW.friend_id,
            'friend',
            'Friend Request Accepted',
            receiver_name || ' accepted your friend request.',
            FALSE
        );

        -- Mark the original friend request notification as read
        UPDATE public.notifications
        SET read = TRUE, actionable = FALSE
        WHERE friendship_id = NEW.id AND user_id = NEW.friend_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'pending' THEN
        -- If friend request is rejected/deleted, remove the notification
        DELETE FROM public.notifications
        WHERE friendship_id = OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on friendships
DROP TRIGGER IF EXISTS tr_friendship_notification ON public.friendships;
CREATE TRIGGER tr_friendship_notification
AFTER INSERT OR UPDATE OR DELETE ON public.friendships
FOR EACH ROW EXECUTE FUNCTION public.handle_friendship_notification();
