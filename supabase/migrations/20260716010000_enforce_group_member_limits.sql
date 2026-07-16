-- Create trigger function to enforce group member limits
CREATE OR REPLACE FUNCTION public.check_group_member_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_limit INTEGER;
BEGIN
    -- Get the maximum member limit of the group
    SELECT max_members INTO max_limit
    FROM public.study_groups
    WHERE id = NEW.group_id;

    -- If max_members is set and is greater than 0, enforce the limit
    IF max_limit IS NOT NULL AND max_limit > 0 THEN
        -- Count current members
        SELECT COUNT(*) INTO current_count
        FROM public.group_members
        WHERE group_id = NEW.group_id;

        IF current_count >= max_limit THEN
            RAISE EXCEPTION 'Group member limit of % reached', max_limit;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to group_members table
DROP TRIGGER IF EXISTS tr_check_group_member_limit ON public.group_members;
CREATE TRIGGER tr_check_group_member_limit
BEFORE INSERT ON public.group_members
FOR EACH ROW EXECUTE FUNCTION public.check_group_member_limit();
