-- Add icon and color fields to study_groups table for appearance customization
DO $$
BEGIN
    -- Add icon column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'study_groups' AND column_name = 'icon') THEN
        ALTER TABLE study_groups ADD COLUMN icon text DEFAULT 'Users';
    END IF;
    
    -- Add color column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'study_groups' AND column_name = 'color') THEN
        ALTER TABLE study_groups ADD COLUMN color text DEFAULT 'from-blue-500 to-blue-600';
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN study_groups.icon IS 'Icon name for the group (lucide-react icon names)';
COMMENT ON COLUMN study_groups.color IS 'CSS gradient classes for group appearance';
