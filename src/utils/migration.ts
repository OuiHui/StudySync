import { supabase } from '@/integrations/supabase/client';

/**
 * Apply database migration to add icon and color fields to study_groups table
 * This is a one-time migration that will be run manually.
 */
export async function applyGroupAppearanceMigration() {
  try {
    console.log('Applying group appearance migration...');
    
    // Check if columns already exist by trying to select them
    const { data: testData, error: testError } = await supabase
      .from('study_groups')
      .select('icon, color')
      .limit(1);
    
    if (!testError) {
      console.log('Migration already applied - icon and color columns exist');
      return { success: true, message: 'Migration already applied' };
    }
    
    // Apply the migration using RPC (if available) or manual SQL
    const migrationSQL = `
      ALTER TABLE study_groups 
      ADD COLUMN IF NOT EXISTS icon text DEFAULT 'Users',
      ADD COLUMN IF NOT EXISTS color text DEFAULT 'from-blue-500 to-blue-600';
    `;
    
    // Try to execute the migration using rpc if available
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('Migration failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Migration applied successfully');
    return { success: true, message: 'Migration applied successfully' };
    
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Export for console usage
(window as any).applyGroupAppearanceMigration = applyGroupAppearanceMigration;
