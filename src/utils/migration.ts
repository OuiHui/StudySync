import { supabase } from '@/integrations/supabase/client';

/**
 * Check if database migration has been applied for icon and color fields in study_groups table
 * This checks if the migration has been applied and provides instructions if not.
 */
export async function applyGroupAppearanceMigration() {
  try {
    console.log('Checking group appearance migration status...');
    
    // Check if columns already exist by trying to select them
    const { data: testData, error: testError } = await supabase
      .from('study_groups')
      .select('icon, color')
      .limit(1);
    
    if (!testError) {
      console.log('Migration already applied - icon and color columns exist');
      return { success: true, message: 'Migration already applied' };
    }
    
    // If columns don't exist, provide instructions for manual migration
    const migrationInstructions = `
      Migration Required: The study_groups table needs icon and color columns.
      
      To apply this migration:
      1. Go to your Supabase dashboard
      2. Navigate to the SQL Editor
      3. Run the migration: supabase/migrations/20250627000000_add_group_appearance_fields.sql
      
      Or run via CLI: supabase db push
    `;
    
    console.log(migrationInstructions);
    
    return { 
      success: false, 
      error: 'Migration not applied - columns do not exist',
      instructions: migrationInstructions,
      migrationFile: 'supabase/migrations/20250627000000_add_group_appearance_fields.sql'
    };
    
  } catch (error) {
    console.error('Migration check error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Export for console usage
(window as any).applyGroupAppearanceMigration = applyGroupAppearanceMigration;
