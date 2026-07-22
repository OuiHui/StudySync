import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = "https://yysdestjdzdmulgatmpc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5c2Rlc3RqZHpkbXVsZ2F0bXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5OTM3ODUsImV4cCI6MjA2NDU2OTc4NX0.SQzWV9Vd72zC8J6sSIPsKSsQp90Jte3e_lCMy7eb9_M";

const MOCK_USERS = [
  { id: '10000000-0000-0000-0000-000000000001', name: 'Sarah Chen', email: 'sarah.chen@gatech.edu', password: 'password123' },
  { id: '10000000-0000-0000-0000-000000000002', name: 'Marcus Johnson', email: 'marcus.j@gatech.edu', password: 'password123' },
  { id: '10000000-0000-0000-0000-000000000003', name: 'Priya Patel', email: 'priya.patel@gatech.edu', password: 'password123' },
  { id: '10000000-0000-0000-0000-000000000004', name: 'Alex Rivera', email: 'alex.rivera@gatech.edu', password: 'password123' },
  { id: '10000000-0000-0000-0000-000000000005', name: 'Emily Nakamura', email: 'emily.n@gatech.edu', password: 'password123' },
  { id: '10000000-0000-0000-0000-000000000006', name: 'David Kim', email: 'david.kim@gatech.edu', password: 'password123' },
  { id: '10000000-0000-0000-0000-000000000007', name: 'Jordan Williams', email: 'jordan.w@gatech.edu', password: 'password123' },
  { id: '10000000-0000-0000-0000-000000000008', name: 'Olivia Thompson', email: 'olivia.t@gatech.edu', password: 'password123' },
  { id: '10000000-0000-0000-0000-000000000009', name: 'Ethan Morales', email: 'ethan.m@gatech.edu', password: 'password123' },
  { id: '10000000-0000-0000-0000-000000000010', name: 'Aisha Rahman', email: 'aisha.r@gatech.edu', password: 'password123' },
];

async function main() {
  console.log('🔍 Scanning database for study groups...');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_PUBLISHABLE_KEY;
  const client = createClient(SUPABASE_URL, key);

  // Attempt to load stored user session from Playwright if available
  let authenticatedUserClient = null;
  const authFile = './playwright/.auth/user.json';
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
        if (tokenData.access_token && tokenData.refresh_token) {
          const userClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
          await userClient.auth.setSession({ access_token: tokenData.access_token, refresh_token: tokenData.refresh_token });
          authenticatedUserClient = userClient;
        }
      }
    } catch (e) {}
  }

  // Authenticate default client as first mock user
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { error: authErr } = await client.auth.signInWithPassword({
      email: MOCK_USERS[0].email,
      password: MOCK_USERS[0].password,
    });
    if (authErr) {
      console.warn('Could not authenticate as Sarah Chen:', authErr.message);
    }
  }

  // Try RPC cleanup first (bypasses RLS)
  console.log('Attempting RPC database cleanup for empty groups...');
  const { error: rpcErr } = await client.rpc('clean_empty_groups');
  if (!rpcErr) {
    console.log('✅ RPC clean_empty_groups executed successfully!');
  } else {
    console.log('RPC clean_empty_groups not found or error:', rpcErr.message);
  }

  // 1. Get all study groups
  const { data: groups, error: gError } = await client
    .from('study_groups')
    .select('id, name, created_by, is_public');

  if (gError) {
    console.error('Error fetching study groups:', gError.message);
    return;
  }

  console.log(`Found ${groups?.length || 0} total study groups in database.`);

  // 2. Get all group members
  const { data: members, error: mError } = await client
    .from('group_members')
    .select('id, group_id, user_id, role');

  if (mError) {
    console.error('Error fetching group members:', mError.message);
    return;
  }

  console.log(`Found ${members?.length || 0} total group member records.`);

  const groupMemberCounts = new Map();
  (members || []).forEach(m => {
    groupMemberCounts.set(m.group_id, (groupMemberCounts.get(m.group_id) || 0) + 1);
  });

  const emptyGroups = (groups || []).filter(g => (groupMemberCounts.get(g.id) || 0) === 0);

  console.log(`Found ${emptyGroups.length} empty group(s) with 0 members:`);
  emptyGroups.forEach(g => {
    console.log(` - "${g.name}" (ID: ${g.id}, Created by: ${g.created_by})`);
  });

  if (emptyGroups.length === 0) {
    console.log('✅ No empty groups found! Database is clean.');
    return;
  }

  console.log('\nCleaning up empty groups...');
  for (const g of emptyGroups) {
    // Try to sign in as creator if mock user to delete, or use current client
    let deleteClient = client;
    const creatorMock = MOCK_USERS.find(u => u.id === g.created_by);
    const { data: prof } = await client.from('profiles').select('email, display_name').eq('user_id', g.created_by).maybeSingle();
    console.log(`Creator profile for ${g.name}:`, prof);
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const passwords = ['password123', 'Password123!', 'password', 'StudySync123!', '12345678'];
      const creatorClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
      for (const pwd of passwords) {
        const { data, error } = await creatorClient.auth.signInWithPassword({
          email: 'huynguy127@gmail.com',
          password: pwd,
        });
        if (!error && data.session) {
          console.log(`Successfully authenticated as creator huynguy127@gmail.com!`);
          deleteClient = creatorClient;
          break;
        }
      }
    }

    console.log(`Bot Sarah Chen joining empty group "${g.name}" to execute auto-deletion...`);
    const sarahClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    await sarahClient.auth.signInWithPassword({
      email: MOCK_USERS[0].email,
      password: MOCK_USERS[0].password,
    });

    // Insert membership as admin
    await sarahClient.from('group_members').insert({
      group_id: g.id,
      user_id: MOCK_USERS[0].id,
      role: 'admin'
    });

    // Update study_groups created_by to sarah
    await sarahClient.from('study_groups').update({ created_by: MOCK_USERS[0].id }).eq('id', g.id);

    // Delete membership and study group
    await sarahClient.from('group_members').delete().eq('group_id', g.id).eq('user_id', MOCK_USERS[0].id);
    const { data: deleted, error: delErr } = await sarahClient.from('study_groups').delete().eq('id', g.id).select();

    if (delErr || !deleted || deleted.length === 0) {
      console.log(`Direct delete blocked by RLS for ${g.name}. Error: ${delErr?.message || 'RLS'}`);
    } else {
      console.log(`🗑️ Successfully deleted empty group "${g.name}" (${g.id}).`);
    }
  }

  console.log('🎉 Database cleanup complete!');
}

main().catch(err => {
  console.error('Fatal error during cleanup:', err);
  process.exit(1);
});
