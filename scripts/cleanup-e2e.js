import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://yysdestjdzdmulgatmpc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5c2Rlc3RqZHpkbXVsZ2F0bXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5OTM3ODUsImV4cCI6MjA2NDU2OTc4NX0.SQzWV9Vd72zC8J6sSIPsKSsQp90Jte3e_lCMy7eb9_M";

async function main() {
  // Use service role key if provided in environment variables (bypasses RLS completely)
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_PUBLISHABLE_KEY;
  const isServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(SUPABASE_URL, key);

  if (!isServiceRole) {
    // Attempt to load authenticated session from Playwright storage state
    const authFile = path.resolve(__dirname, '../playwright/.auth/user.json');
    if (fs.existsSync(authFile)) {
      try {
        const state = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
        const origin = state.origins?.find((o) =>
          o.localStorage?.some((item) => item.name.startsWith('sb-') && item.name.endsWith('-auth-token'))
        );
        if (origin) {
          const tokenItem = origin.localStorage.find((item) =>
            item.name.startsWith('sb-') && item.name.endsWith('-auth-token')
          );
          const tokenData = JSON.parse(tokenItem.value);
          const access_token = tokenData.access_token;
          const refresh_token = tokenData.refresh_token;
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
            console.log('Successfully authenticated using stored Playwright session.');
          }
        }
      } catch (e) {
        console.warn('Failed to authenticate using stored session:', e.message);
      }
    } else {
      console.log('No stored session found. Proceeding with anonymous client...');
    }
  } else {
    console.log('Using Supabase Service Role Key for cleanup.');
  }

  console.log('Attempting RPC database cleanup (bypasses RLS)...');
  const { error: rpcError } = await supabase.rpc('cleanup_e2e_data');
  
  if (rpcError) {
    console.log('RPC cleanup not available (function not found or error occurred):', rpcError.message);
    console.log('Falling back to direct table deletes (subject to Row Level Security)...');

    // Delete E2E groups
    const { data: groups, error: groupError } = await supabase
      .from('study_groups')
      .delete()
      .eq('name', 'E2E Test Group')
      .select();
    if (groupError) {
      console.error('Error cleaning up E2E study groups:', groupError.message);
    } else {
      console.log(`Deleted ${groups?.length || 0} E2E study group(s).`);
    }

    // Delete E2E sessions
    const { data: sessions, error: sessionError } = await supabase
      .from('study_sessions')
      .delete()
      .eq('title', 'E2E Session')
      .select();
    if (sessionError) {
      console.error('Error cleaning up E2E study sessions:', sessionError.message);
    } else {
      console.log(`Deleted ${sessions?.length || 0} E2E study session(s).`);
    }
    
    console.log('\nTIP: To make cleanups bypass Row Level Security (RLS) and delete older orphaned sessions,');
    console.log('run the SQL migration in: supabase/migrations/20260706000000_cleanup_e2e_rpc.sql');
    console.log('in your Supabase Dashboard SQL Editor.');
  } else {
    console.log('RPC database cleanup completed successfully (all E2E Test Groups and E2E Sessions deleted).');
  }
}

main().catch((err) => {
  console.error('Fatal error in cleanup script:', err);
  process.exit(1);
});
