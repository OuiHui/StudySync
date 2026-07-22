-- Clean up any existing study groups with 0 members
DELETE FROM public.study_groups
WHERE id NOT IN (
  SELECT DISTINCT group_id FROM public.group_members
);

-- Create a SECURITY DEFINER RPC function so empty groups can be cleaned up from client scripts bypassing RLS
CREATE OR REPLACE FUNCTION public.clean_empty_groups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.study_groups
  WHERE id NOT IN (
    SELECT DISTINCT group_id FROM public.group_members
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.clean_empty_groups() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clean_empty_groups() TO anon;
