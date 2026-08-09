-- Update default value for notification_settings in public.profiles table
-- Removed 'weeklyDigest' and 'systemUpdates' from default JSONB structure
ALTER TABLE public.profiles
ALTER COLUMN notification_settings
SET DEFAULT '{"emailNotifications": true, "pushNotifications": true, "studyReminders": true, "groupMessages": true, "sessionInvites": true, "friendRequests": true}'::jsonb;

-- Update existing profiles to strip obsolete keys ('weeklyDigest' and 'systemUpdates') from notification_settings JSONB
UPDATE public.profiles
SET notification_settings = notification_settings - 'weeklyDigest' - 'systemUpdates'
WHERE notification_settings ? 'weeklyDigest' OR notification_settings ? 'systemUpdates';
