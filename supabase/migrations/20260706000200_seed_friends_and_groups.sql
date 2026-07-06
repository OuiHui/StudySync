-- Seed friends, study groups, group memberships, study sessions, and session participants for mock users
-- Let's clean up existing mock relations first to prevent duplicate errors or messy states
DO $$
DECLARE
    -- Group IDs
    group_ml UUID := '30000000-0000-0000-0000-000000000001';
    group_bme UUID := '30000000-0000-0000-0000-000000000002';
    group_aero UUID := '30000000-0000-0000-0000-000000000003';
    group_cad UUID := '30000000-0000-0000-0000-000000000004';
    group_math UUID := '30000000-0000-0000-0000-000000000005';
    group_web UUID := '30000000-0000-0000-0000-000000000006';

    -- Session IDs
    session_ml1 UUID := '40000000-0000-0000-0000-000000000001';
    session_ml2 UUID := '40000000-0000-0000-0000-000000000002';
    session_bme1 UUID := '40000000-0000-0000-0000-000000000003';
    session_aero1 UUID := '40000000-0000-0000-0000-000000000004';
    session_math1 UUID := '40000000-0000-0000-0000-000000000005';
    session_web1 UUID := '40000000-0000-0000-0000-000000000006';
    session_web2 UUID := '40000000-0000-0000-0000-000000000007';

    -- Mock User IDs
    u1 UUID := '10000000-0000-0000-0000-000000000001'; -- Sarah Chen
    u2 UUID := '10000000-0000-0000-0000-000000000002'; -- Marcus Johnson
    u3 UUID := '10000000-0000-0000-0000-000000000003'; -- Priya Patel
    u4 UUID := '10000000-0000-0000-0000-000000000004'; -- Alex Rivera
    u5 UUID := '10000000-0000-0000-0000-000000000005'; -- Emily Nakamura
    u6 UUID := '10000000-0000-0000-0000-000000000006'; -- David Kim
    u7 UUID := '10000000-0000-0000-0000-000000000007'; -- Jordan Williams
    u8 UUID := '10000000-0000-0000-0000-000000000008'; -- Olivia Thompson
    u9 UUID := '10000000-0000-0000-0000-000000000009'; -- Ethan Morales
    u10 UUID := '10000000-0000-0000-0000-000000000010'; -- Aisha Rahman
BEGIN
    -- 1. CLEANUP EXISTING MOCK SEED DATA TO PREVENT DUPLICATES
    DELETE FROM public.friendships WHERE user_id IN (u1,u2,u3,u4,u5,u6,u7,u8,u9,u10) OR friend_id IN (u1,u2,u3,u4,u5,u6,u7,u8,u9,u10);
    DELETE FROM public.group_members WHERE group_id IN (group_ml, group_bme, group_aero, group_cad, group_math, group_web);
    DELETE FROM public.study_sessions WHERE id IN (session_ml1, session_ml2, session_bme1, session_aero1, session_math1, session_web1, session_web2);
    DELETE FROM public.study_groups WHERE id IN (group_ml, group_bme, group_aero, group_cad, group_math, group_web);

    -- 2. SEED FRIENDSHIPS (All 'accepted')
    -- Sarah Chen's friends
    INSERT INTO public.friendships (user_id, friend_id, status) VALUES (u1, u2, 'accepted');
    INSERT INTO public.friendships (user_id, friend_id, status) VALUES (u1, u3, 'accepted');
    INSERT INTO public.friendships (user_id, friend_id, status) VALUES (u1, u7, 'accepted');
    INSERT INTO public.friendships (user_id, friend_id, status) VALUES (u1, u8, 'accepted');

    -- Marcus Johnson's friends
    INSERT INTO public.friendships (user_id, friend_id, status) VALUES (u2, u3, 'accepted');
    INSERT INTO public.friendships (user_id, friend_id, status) VALUES (u2, u4, 'accepted');
    INSERT INTO public.friendships (user_id, friend_id, status) VALUES (u2, u6, 'accepted');
    INSERT INTO public.friendships (user_id, friend_id, status) VALUES (u2, u5, 'accepted');

    -- Priya Patel's friends
    INSERT INTO public.friendships (user_id, friend_id, status) VALUES (u3, u4, 'accepted');
    INSERT INTO public.friendships (user_id, friend_id, status) VALUES (u3, u7, 'accepted');
    INSERT INTO public.friendships (user_id, friend_id, status) VALUES (u3, u10, 'accepted');

    -- David Kim's friends
    INSERT INTO public.friendships (user_id, friend_id, status) VALUES (u6, u8, 'accepted');
    INSERT INTO public.friendships (user_id, friend_id, status) VALUES (u6, u9, 'accepted');

    -- Emily Nakamura's friends
    INSERT INTO public.friendships (user_id, friend_id, status) VALUES (u5, u9, 'accepted');

    -- 3. SEED STUDY GROUPS
    INSERT INTO public.study_groups (id, name, description, subject, is_public, created_by, max_members)
    VALUES (group_ml, 'Machine Learning Study Group', 'A group dedicated to discussing neural networks, regression models, and core ML algorithms.', 'Computer Science', true, u1, 10);

    INSERT INTO public.study_groups (id, name, description, subject, is_public, created_by, max_members)
    VALUES (group_bme, 'BME Lab Partners', 'Organizing laboratory research, biomechanical simulations, and anatomography summaries.', 'Biomedical Engineering', true, u3, 8);

    INSERT INTO public.study_groups (id, name, description, subject, is_public, created_by, max_members)
    VALUES (group_aero, 'Aerospace Propulsion', 'Exploring fluid mechanics, aerodynamics, orbital decay, and scramjet rocket science.', 'Aerospace Engineering', true, u6, 6);

    INSERT INTO public.study_groups (id, name, description, subject, is_public, created_by, max_members)
    VALUES (group_cad, 'CAD and Robotics Guild', 'Designing solid models, 3D printing custom enclosures, and programming robot arms.', 'Mechanical Engineering', true, u9, 12);

    INSERT INTO public.study_groups (id, name, description, subject, is_public, created_by, max_members)
    VALUES (group_math, 'Linear Algebra Warriors', 'Proofs, vector spaces, eigenvalues, and computational geometry applications.', 'Mathematics', true, u7, 10);

    INSERT INTO public.study_groups (id, name, description, subject, is_public, created_by, max_members)
    VALUES (group_web, 'Web Dev Hackers', 'Modern full-stack web development. React, Tailwind, Supabase, and custom projects.', 'Computer Science', true, u8, 15);

    -- 4. SEED GROUP MEMBERS
    -- Machine Learning Study Group (Sarah, Priya, Marcus, Alex, Olivia)
    INSERT INTO public.group_members (group_id, user_id, role) VALUES (group_ml, u1, 'admin');
    INSERT INTO public.group_members (group_id, user_id, role) VALUES (group_ml, u3, 'member');
    INSERT INTO public.group_members (group_id, user_id, role) VALUES (group_ml, u2, 'member');
    INSERT INTO public.group_members (group_id, user_id, role) VALUES (group_ml, u4, 'member');
    INSERT INTO public.group_members (group_id, user_id, role) VALUES (group_ml, u8, 'member');

    -- BME Lab Partners (Priya, Sarah, David)
    INSERT INTO public.group_members (group_id, user_id, role) VALUES (group_bme, u3, 'admin');
    INSERT INTO public.group_members (group_id, user_id, role) VALUES (group_bme, u1, 'member');
    INSERT INTO public.group_members (group_id, user_id, role) VALUES (group_bme, u6, 'member');

    -- Aerospace Propulsion (David, Ethan, Marcus)
    INSERT INTO public.group_members (group_id, user_id, role) VALUES (group_aero, u6, 'admin');
    INSERT INTO public.group_members (group_id, user_id, role) VALUES (group_aero, u9, 'member');
    INSERT INTO public.group_members (group_id, user_id, role) VALUES (group_aero, u2, 'member');

    -- CAD and Robotics Guild (Ethan, Marcus, Emily)
    INSERT INTO public.group_members (group_id, user_id, role) VALUES (group_cad, u9, 'admin');
    INSERT INTO public.group_members (group_id, user_id, role) VALUES (group_cad, u2, 'member');
    INSERT INTO public.group_members (group_id, user_id, role) VALUES (group_cad, u5, 'member');

    -- Linear Algebra Warriors (Jordan, Sarah, Emily)
    INSERT INTO public.group_members (group_id, user_id, role) VALUES (group_math, u7, 'admin');
    INSERT INTO public.group_members (group_id, user_id, role) VALUES (group_math, u1, 'member');
    INSERT INTO public.group_members (group_id, user_id, role) VALUES (group_math, u5, 'member');

    -- Web Dev Hackers (Olivia, Sarah, Priya, Alex)
    INSERT INTO public.group_members (group_id, user_id, role) VALUES (group_web, u8, 'admin');
    INSERT INTO public.group_members (group_id, user_id, role) VALUES (group_web, u1, 'member');
    INSERT INTO public.group_members (group_id, user_id, role) VALUES (group_web, u3, 'member');
    INSERT INTO public.group_members (group_id, user_id, role) VALUES (group_web, u4, 'member');

    -- 5. SEED STUDY SESSIONS
    -- Neural Networks Deep Dive (ML Group, Created by Sarah)
    INSERT INTO public.study_sessions (id, title, description, scheduled_start, scheduled_end, created_by, status, group_id, subject)
    VALUES (session_ml1, 'Neural Networks Deep Dive', 'Going over backpropagation mathematical proofs and gradient descent optimizations.', now() + interval '2 hours', now() + interval '4 hours', u1, 'scheduled', group_ml, 'Machine Learning');

    -- ML Paper Review (ML Group, Created by Sarah)
    INSERT INTO public.study_sessions (id, title, description, scheduled_start, scheduled_end, created_by, status, group_id, subject)
    VALUES (session_ml2, 'Transformer Architectures Review', 'Reading the Attention Is All You Need paper and analyzing self-attention mechanisms.', now() - interval '1 day', now() - interval '22 hours', u1, 'completed', group_ml, 'Machine Learning');

    -- Lab 4 Report Prep (BME Group, Created by Priya)
    INSERT INTO public.study_sessions (id, title, description, scheduled_start, scheduled_end, created_by, status, group_id, subject)
    VALUES (session_bme1, 'BME Lab 4 Analysis', 'Reviewing viscoelastic materials testing data and writing up the lab report.', now() + interval '1 day', now() + interval '1 day 3 hours', u3, 'scheduled', group_bme, 'Biomedical Engineering');

    -- Fluid Mechanics Practice (Aero Group, Created by David)
    INSERT INTO public.study_sessions (id, title, description, scheduled_start, scheduled_end, created_by, status, group_id, subject)
    VALUES (session_aero1, 'Rocket Equation & Nozzle Flows', 'Deriving thrust coefficients and studying supersonic gas dynamics.', now() + interval '5 hours', now() + interval '7 hours', u6, 'scheduled', group_aero, 'Aerospace Engineering');

    -- Vector Spaces & Subspaces (Math Group, Created by Jordan)
    INSERT INTO public.study_sessions (id, title, description, scheduled_start, scheduled_end, created_by, status, group_id, subject)
    VALUES (session_math1, 'Eigenvalues Review Session', 'Solving exam problems on diagonalization and inner product spaces.', now() + interval '3 days', now() + interval '3 days 2 hours', u7, 'scheduled', group_math, 'Mathematics');

    -- Vite & React Workshop (Web Group, Created by Olivia)
    INSERT INTO public.study_sessions (id, title, description, scheduled_start, scheduled_end, created_by, status, group_id, subject)
    VALUES (session_web1, 'Vite + React Setup', 'Setting up build pipelines, configuring path aliases, and discussing state managers.', now() + interval '12 hours', now() + interval '14 hours', u8, 'scheduled', group_web, 'Web Dev');

    -- Database Schema Design (Web Group, Created by Olivia)
    INSERT INTO public.study_sessions (id, title, description, scheduled_start, scheduled_end, created_by, status, group_id, subject)
    VALUES (session_web2, 'Supabase RLS Policies', 'Writing secure Postgres row level security policies for collaborative note sharing.', now() - interval '2 days', now() - interval '2 days 2 hours', u8, 'completed', group_web, 'Database Systems');

    -- 6. ADD SESSION PARTICIPANTS
    -- Neural Networks (Sarah Chen host, Priya Patel participant)
    INSERT INTO public.session_participants (session_id, user_id, role, status, is_attending) VALUES (session_ml1, u1, 'host', 'active', true);
    INSERT INTO public.session_participants (session_id, user_id, role, status, is_attending) VALUES (session_ml1, u3, 'participant', 'active', true);

    -- Transformer Review (Sarah Chen host, Priya, Marcus, Alex participants)
    INSERT INTO public.session_participants (session_id, user_id, role, status, is_attending) VALUES (session_ml2, u1, 'host', 'active', true);
    INSERT INTO public.session_participants (session_id, user_id, role, status, is_attending) VALUES (session_ml2, u3, 'participant', 'active', true);
    INSERT INTO public.session_participants (session_id, user_id, role, status, is_attending) VALUES (session_ml2, u2, 'participant', 'active', true);
    INSERT INTO public.session_participants (session_id, user_id, role, status, is_attending) VALUES (session_ml2, u4, 'participant', 'active', true);

    -- Lab 4 Analysis (Priya host, Sarah participant)
    INSERT INTO public.session_participants (session_id, user_id, role, status, is_attending) VALUES (session_bme1, u3, 'host', 'active', true);
    INSERT INTO public.session_participants (session_id, user_id, role, status, is_attending) VALUES (session_bme1, u1, 'participant', 'active', true);

    -- Fluid Mechanics (David host, Ethan participant)
    INSERT INTO public.session_participants (session_id, user_id, role, status, is_attending) VALUES (session_aero1, u6, 'host', 'active', true);
    INSERT INTO public.session_participants (session_id, user_id, role, status, is_attending) VALUES (session_aero1, u9, 'participant', 'active', true);

    -- Vector Spaces (Jordan host, Sarah, Emily participants)
    INSERT INTO public.session_participants (session_id, user_id, role, status, is_attending) VALUES (session_math1, u7, 'host', 'active', true);
    INSERT INTO public.session_participants (session_id, user_id, role, status, is_attending) VALUES (session_math1, u1, 'participant', 'active', true);
    INSERT INTO public.session_participants (session_id, user_id, role, status, is_attending) VALUES (session_math1, u5, 'participant', 'active', true);

    -- Vite & React (Olivia host, Sarah, Priya participants)
    INSERT INTO public.session_participants (session_id, user_id, role, status, is_attending) VALUES (session_web1, u8, 'host', 'active', true);
    INSERT INTO public.session_participants (session_id, user_id, role, status, is_attending) VALUES (session_web1, u1, 'participant', 'active', true);
    INSERT INTO public.session_participants (session_id, user_id, role, status, is_attending) VALUES (session_web1, u3, 'participant', 'active', true);

END $$;
