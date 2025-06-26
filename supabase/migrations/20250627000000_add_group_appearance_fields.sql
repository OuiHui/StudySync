-- Add icon and color fields to study_groups table for appearance customization
ALTER TABLE study_groups 
ADD COLUMN icon text DEFAULT 'Users',
ADD COLUMN color text DEFAULT 'from-blue-500 to-blue-600';

-- Add comments for documentation
COMMENT ON COLUMN study_groups.icon IS 'Icon name for the group (lucide-react icon names)';
COMMENT ON COLUMN study_groups.color IS 'CSS gradient classes for group appearance';
