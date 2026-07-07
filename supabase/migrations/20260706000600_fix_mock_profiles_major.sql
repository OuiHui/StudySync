-- Update mock profiles with their correct seeded values to resolve trigger conflict
UPDATE public.profiles
SET 
    major = 'Computer Science', 
    year = '3rd Year', 
    bio = 'ML enthusiast & coffee lover. Always down for a late-night study session.', 
    top_subjects = ARRAY['Machine Learning', 'Algorithms', 'Linear Algebra'], 
    gradient_from = 'from-violet-400', 
    gradient_to = 'to-purple-600', 
    study_hours = 142
WHERE user_id = '10000000-0000-0000-0000-000000000001';

UPDATE public.profiles
SET 
    major = 'Electrical Engineering', 
    year = '2nd Year', 
    bio = 'Signal processing nerd. I make circuits and bad puns.', 
    top_subjects = ARRAY['Circuits', 'Signals & Systems', 'Physics'], 
    gradient_from = 'from-sky-400', 
    gradient_to = 'to-blue-600', 
    study_hours = 98
WHERE user_id = '10000000-0000-0000-0000-000000000002';

UPDATE public.profiles
SET 
    major = 'Biomedical Engineering', 
    year = '4th Year', 
    bio = 'Pre-med track, research assistant at the BME lab. Study group organizer.', 
    top_subjects = ARRAY['Organic Chemistry', 'Biomechanics', 'Anatomy'], 
    gradient_from = 'from-emerald-400', 
    gradient_to = 'to-teal-600', 
    study_hours = 210
WHERE user_id = '10000000-0000-0000-0000-000000000003';

UPDATE public.profiles
SET 
    major = 'Industrial Engineering', 
    year = '3rd Year', 
    bio = 'Optimization is my thing — both in coursework and in life.', 
    top_subjects = ARRAY['Operations Research', 'Statistics', 'Supply Chain'], 
    gradient_from = 'from-orange-400', 
    gradient_to = 'to-amber-600', 
    study_hours = 76
WHERE user_id = '10000000-0000-0000-0000-000000000004';

UPDATE public.profiles
SET 
    major = 'Computer Science', 
    year = '1st Year', 
    bio = 'Freshman exploring CS! Looking for study partners in intro courses.', 
    top_subjects = ARRAY['Intro to CS', 'Discrete Math', 'Calculus'], 
    gradient_from = 'from-rose-400', 
    gradient_to = 'to-pink-600', 
    study_hours = 45
WHERE user_id = '10000000-0000-0000-0000-000000000005';

UPDATE public.profiles
SET 
    major = 'Aerospace Engineering', 
    year = '4th Year', 
    bio = 'Space geek. Currently working on my senior design project for a satellite.', 
    top_subjects = ARRAY['Orbital Mechanics', 'Fluid Dynamics', 'Thermodynamics'], 
    gradient_from = 'from-indigo-400', 
    gradient_to = 'to-indigo-700', 
    study_hours = 185
WHERE user_id = '10000000-0000-0000-0000-000000000006';

UPDATE public.profiles
SET 
    major = 'Mathematics', 
    year = '2nd Year', 
    bio = 'Pure math is beautiful. Also TAing for linear algebra this semester.', 
    top_subjects = ARRAY['Abstract Algebra', 'Real Analysis', 'Topology'], 
    gradient_from = 'from-cyan-400', 
    gradient_to = 'to-cyan-700', 
    study_hours = 120
WHERE user_id = '10000000-0000-0000-0000-000000000007';

UPDATE public.profiles
SET 
    major = 'Computer Science', 
    year = '3rd Year', 
    bio = 'Full-stack dev who loves hackathons. Let''s build something together!', 
    top_subjects = ARRAY['Web Dev', 'Databases', 'Software Engineering'], 
    gradient_from = 'from-fuchsia-400', 
    gradient_to = 'to-fuchsia-700', 
    study_hours = 156
WHERE user_id = '10000000-0000-0000-0000-000000000008';

UPDATE public.profiles
SET 
    major = 'Mechanical Engineering', 
    year = '2nd Year', 
    bio = 'CAD wizard and 3D printing enthusiast. Robotics club member.', 
    top_subjects = ARRAY['Statics', 'Dynamics', 'Materials Science'], 
    gradient_from = 'from-lime-400', 
    gradient_to = 'to-green-600', 
    study_hours = 62
WHERE user_id = '10000000-0000-0000-0000-000000000009';

UPDATE public.profiles
SET 
    major = 'Chemical Engineering', 
    year = '3rd Year', 
    bio = 'Research in sustainable energy. Passionate about green chemistry.', 
    top_subjects = ARRAY['Thermodynamics', 'Reactor Design', 'Transport Phenomena'], 
    gradient_from = 'from-amber-400', 
    gradient_to = 'to-yellow-600', 
    study_hours = 130
WHERE user_id = '10000000-0000-0000-0000-000000000010';
