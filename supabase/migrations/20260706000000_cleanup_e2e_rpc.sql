-- Cleanup existing orphaned E2E test groups and sessions
DELETE FROM public.study_groups WHERE name = 'E2E Test Group';
DELETE FROM public.study_sessions WHERE title = 'E2E Session';

-- Create a secure RPC function to allow E2E cleanup from client/test runners
-- SECURITY DEFINER runs the function with the privileges of the creator (postgres/admin), bypassing Row Level Security.
CREATE OR REPLACE FUNCTION public.cleanup_e2e_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.study_groups WHERE name = 'E2E Test Group';
  DELETE FROM public.study_sessions WHERE title = 'E2E Session';
END;
$$;

-- Grant execution permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.cleanup_e2e_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_e2e_data() TO anon;
