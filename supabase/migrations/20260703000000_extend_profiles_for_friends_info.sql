-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Cleanup existing leaked E2E test groups and sessions
DELETE FROM public.study_groups WHERE name = 'E2E Test Group';
DELETE FROM public.study_sessions WHERE title = 'E2E Session';

-- 1. Extend profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS major TEXT,
ADD COLUMN IF NOT EXISTS year TEXT,
ADD COLUMN IF NOT EXISTS top_subjects TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS gradient_from TEXT DEFAULT 'from-blue-400',
ADD COLUMN IF NOT EXISTS gradient_to TEXT DEFAULT 'to-blue-600',
ADD COLUMN IF NOT EXISTS study_hours INT DEFAULT 0;

-- Sync existing profiles with auth.users email
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND p.email IS NULL;

-- 2. Drop and recreate search_users function
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
    mutual_friends INT
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
        COALESCE(p.display_name, au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1))::TEXT as display_name,
        COALESCE(p.avatar_url, au.raw_user_meta_data->>'avatar_url')::TEXT as avatar_url,
        p.bio::TEXT,
        p.major::TEXT,
        p.year::TEXT,
        p.top_subjects,
        p.gradient_from::TEXT,
        p.gradient_to::TEXT,
        COALESCE(p.study_hours, 0)::INT as study_hours,
        COALESCE(f.status, 'none')::TEXT as friendship_status,
        f.id as friendship_id,
        (
            SELECT COALESCE(COUNT(*), 0)::INT
            FROM (
                SELECT CASE WHEN f1.user_id = current_user_id THEN f1.friend_id ELSE f1.user_id END as friend_id
                FROM public.friendships f1
                WHERE (f1.user_id = current_user_id OR f1.friend_id = current_user_id) AND f1.status = 'accepted'
            ) u1
            INNER JOIN (
                SELECT CASE WHEN f2.user_id = au.id THEN f2.friend_id ELSE f2.user_id END as friend_id
                FROM public.friendships f2
                WHERE (f2.user_id = au.id OR f2.friend_id = au.id) AND f2.status = 'accepted'
            ) u2 ON u1.friend_id = u2.friend_id
        )::INT as mutual_friends
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

-- 3. Seed mock users and profiles if they don't exist
DO $$
DECLARE
    password_hash TEXT;
BEGIN
    password_hash := crypt('password123', gen_salt('bf'));

    -- Sarah Chen
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '10000000-0000-0000-0000-000000000001' OR email = 'sarah.chen@gatech.edu') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'sarah.chen@gatech.edu', password_hash, now(), '{"provider": "email", "providers": ["email"]}', '{"display_name": "Sarah Chen"}', now(), now(), 'authenticated', 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '20000000-0000-0000-0000-000000000001' OR user_id = '10000000-0000-0000-0000-000000000001') THEN
        INSERT INTO public.profiles (id, user_id, display_name, email, avatar_url, bio, major, year, top_subjects, gradient_from, gradient_to, study_hours)
        VALUES ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Sarah Chen', 'sarah.chen@gatech.edu', NULL, 'ML enthusiast & coffee lover. Always down for a late-night study session.', 'Computer Science', '3rd Year', ARRAY['Machine Learning', 'Algorithms', 'Linear Algebra'], 'from-violet-400', 'to-purple-600', 142);
    END IF;

    -- Marcus Johnson
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '10000000-0000-0000-0000-000000000002' OR email = 'marcus.j@gatech.edu') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'marcus.j@gatech.edu', password_hash, now(), '{"provider": "email", "providers": ["email"]}', '{"display_name": "Marcus Johnson"}', now(), now(), 'authenticated', 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '20000000-0000-0000-0000-000000000002' OR user_id = '10000000-0000-0000-0000-000000000002') THEN
        INSERT INTO public.profiles (id, user_id, display_name, email, avatar_url, bio, major, year, top_subjects, gradient_from, gradient_to, study_hours)
        VALUES ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Marcus Johnson', 'marcus.j@gatech.edu', NULL, 'Signal processing nerd. I make circuits and bad puns.', 'Electrical Engineering', '2nd Year', ARRAY['Circuits', 'Signals & Systems', 'Physics'], 'from-sky-400', 'to-blue-600', 98);
    END IF;

    -- Priya Patel
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '10000000-0000-0000-0000-000000000003' OR email = 'priya.patel@gatech.edu') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'priya.patel@gatech.edu', password_hash, now(), '{"provider": "email", "providers": ["email"]}', '{"display_name": "Priya Patel"}', now(), now(), 'authenticated', 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '20000000-0000-0000-0000-000000000003' OR user_id = '10000000-0000-0000-0000-000000000003') THEN
        INSERT INTO public.profiles (id, user_id, display_name, email, avatar_url, bio, major, year, top_subjects, gradient_from, gradient_to, study_hours)
        VALUES ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Priya Patel', 'priya.patel@gatech.edu', NULL, 'Pre-med track, research assistant at the BME lab. Study group organizer.', 'Biomedical Engineering', '4th Year', ARRAY['Organic Chemistry', 'Biomechanics', 'Anatomy'], 'from-emerald-400', 'to-teal-600', 210);
    END IF;

    -- Alex Rivera
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '10000000-0000-0000-0000-000000000004' OR email = 'alex.r@gatech.edu') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'alex.r@gatech.edu', password_hash, now(), '{"provider": "email", "providers": ["email"]}', '{"display_name": "Alex Rivera"}', now(), now(), 'authenticated', 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '20000000-0000-0000-0000-000000000004' OR user_id = '10000000-0000-0000-0000-000000000004') THEN
        INSERT INTO public.profiles (id, user_id, display_name, email, avatar_url, bio, major, year, top_subjects, gradient_from, gradient_to, study_hours)
        VALUES ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'Alex Rivera', 'alex.r@gatech.edu', NULL, 'Optimization is my thing — both in coursework and in life.', 'Industrial Engineering', '3rd Year', ARRAY['Operations Research', 'Statistics', 'Supply Chain'], 'from-orange-400', 'to-amber-600', 76);
    END IF;

    -- Emily Nakamura
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '10000000-0000-0000-0000-000000000005' OR email = 'emily.n@gatech.edu') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'emily.n@gatech.edu', password_hash, now(), '{"provider": "email", "providers": ["email"]}', '{"display_name": "Emily Nakamura"}', now(), now(), 'authenticated', 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '20000000-0000-0000-0000-000000000005' OR user_id = '10000000-0000-0000-0000-000000000005') THEN
        INSERT INTO public.profiles (id, user_id, display_name, email, avatar_url, bio, major, year, top_subjects, gradient_from, gradient_to, study_hours)
        VALUES ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'Emily Nakamura', 'emily.n@gatech.edu', NULL, 'Freshman exploring CS! Looking for study partners in intro courses.', 'Computer Science', '1st Year', ARRAY['Intro to CS', 'Discrete Math', 'Calculus'], 'from-rose-400', 'to-pink-600', 45);
    END IF;

    -- David Kim
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '10000000-0000-0000-0000-000000000006' OR email = 'david.kim@gatech.edu') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'david.kim@gatech.edu', password_hash, now(), '{"provider": "email", "providers": ["email"]}', '{"display_name": "David Kim"}', now(), now(), 'authenticated', 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '20000000-0000-0000-0000-000000000006' OR user_id = '10000000-0000-0000-0000-000000000006') THEN
        INSERT INTO public.profiles (id, user_id, display_name, email, avatar_url, bio, major, year, top_subjects, gradient_from, gradient_to, study_hours)
        VALUES ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', 'David Kim', 'david.kim@gatech.edu', NULL, 'Space geek. Currently working on my senior design project for a satellite.', 'Aerospace Engineering', '4th Year', ARRAY['Orbital Mechanics', 'Fluid Dynamics', 'Thermodynamics'], 'from-indigo-400', 'to-indigo-700', 185);
    END IF;

    -- Jordan Williams
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '10000000-0000-0000-0000-000000000007' OR email = 'jordan.w@gatech.edu') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'jordan.w@gatech.edu', password_hash, now(), '{"provider": "email", "providers": ["email"]}', '{"display_name": "Jordan Williams"}', now(), now(), 'authenticated', 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '20000000-0000-0000-0000-000000000007' OR user_id = '10000000-0000-0000-0000-000000000007') THEN
        INSERT INTO public.profiles (id, user_id, display_name, email, avatar_url, bio, major, year, top_subjects, gradient_from, gradient_to, study_hours)
        VALUES ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', 'Jordan Williams', 'jordan.w@gatech.edu', NULL, 'Pure math is beautiful. Also TAing for linear algebra this semester.', 'Mathematics', '2nd Year', ARRAY['Abstract Algebra', 'Real Analysis', 'Topology'], 'from-cyan-400', 'to-cyan-700', 120);
    END IF;

    -- Olivia Thompson
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '10000000-0000-0000-0000-000000000008' OR email = 'olivia.t@gatech.edu') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'olivia.t@gatech.edu', password_hash, now(), '{"provider": "email", "providers": ["email"]}', '{"display_name": "Olivia Thompson"}', now(), now(), 'authenticated', 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '20000000-0000-0000-0000-000000000008' OR user_id = '10000000-0000-0000-0000-000000000008') THEN
        INSERT INTO public.profiles (id, user_id, display_name, email, avatar_url, bio, major, year, top_subjects, gradient_from, gradient_to, study_hours)
        VALUES ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000008', 'Olivia Thompson', 'olivia.t@gatech.edu', NULL, 'Full-stack dev who loves hackathons. Let''s build something together!', 'Computer Science', '3rd Year', ARRAY['Web Dev', 'Databases', 'Software Engineering'], 'from-fuchsia-400', 'to-fuchsia-700', 156);
    END IF;

    -- Ethan Morales
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '10000000-0000-0000-0000-000000000009' OR email = 'ethan.m@gatech.edu') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 'ethan.m@gatech.edu', password_hash, now(), '{"provider": "email", "providers": ["email"]}', '{"display_name": "Ethan Morales"}', now(), now(), 'authenticated', 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '20000000-0000-0000-0000-000000000009' OR user_id = '10000000-0000-0000-0000-000000000009') THEN
        INSERT INTO public.profiles (id, user_id, display_name, email, avatar_url, bio, major, year, top_subjects, gradient_from, gradient_to, study_hours)
        VALUES ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000009', 'Ethan Morales', 'ethan.m@gatech.edu', NULL, 'CAD wizard and 3D printing enthusiast. Robotics club member.', 'Mechanical Engineering', '2nd Year', ARRAY['Statics', 'Dynamics', 'Materials Science'], 'from-lime-400', 'to-green-600', 62);
    END IF;

    -- Aisha Rahman
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '10000000-0000-0000-0000-000000000010' OR email = 'aisha.r@gatech.edu') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
        VALUES ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'aisha.r@gatech.edu', password_hash, now(), '{"provider": "email", "providers": ["email"]}', '{"display_name": "Aisha Rahman"}', now(), now(), 'authenticated', 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '20000000-0000-0000-0000-000000000010' OR user_id = '10000000-0000-0000-0000-000000000010') THEN
        INSERT INTO public.profiles (id, user_id, display_name, email, avatar_url, bio, major, year, top_subjects, gradient_from, gradient_to, study_hours)
        VALUES ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000010', 'Aisha Rahman', 'aisha.r@gatech.edu', NULL, 'Research in sustainable energy. Passionate about green chemistry.', 'Chemical Engineering', '3rd Year', ARRAY['Thermodynamics', 'Reactor Design', 'Transport Phenomena'], 'from-amber-400', 'to-yellow-600', 130);
    END IF;
END $$;
