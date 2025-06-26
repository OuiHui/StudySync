// Simple test script to check if our services work without 400 errors
const { createClient } = require('@supabase/supabase-js')

// Read environment variables or use fallback
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

if (!supabaseUrl.startsWith('http') || !supabaseKey.startsWith('eyJ')) {
  console.log('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testQueries() {
  console.log('Testing basic Supabase queries...');
  
  try {
    // Test 1: Simple profiles query
    console.log('\n1. Testing profiles query...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('Profiles error:', profilesError);
    } else {
      console.log('Profiles query successful:', profiles?.length || 0, 'rows');
    }

    // Test 2: Study groups query
    console.log('\n2. Testing study_groups query...');
    const { data: groups, error: groupsError } = await supabase
      .from('study_groups')
      .select('*')
      .limit(1);
    
    if (groupsError) {
      console.error('Groups error:', groupsError);
    } else {
      console.log('Groups query successful:', groups?.length || 0, 'rows');
    }

    // Test 3: Group members with study_groups join
    console.log('\n3. Testing group_members with study_groups join...');
    const { data: memberships, error: membershipsError } = await supabase
      .from('group_members')
      .select(`
        role,
        study_groups (*)
      `)
      .limit(1);
    
    if (membershipsError) {
      console.error('Memberships error:', membershipsError);
    } else {
      console.log('Memberships query successful:', memberships?.length || 0, 'rows');
    }

    // Test 4: Study sessions query
    console.log('\n4. Testing study_sessions query...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('study_sessions')
      .select(`
        *,
        study_groups (
          id,
          name,
          subject
        )
      `)
      .limit(1);
    
    if (sessionsError) {
      console.error('Sessions error:', sessionsError);
    } else {
      console.log('Sessions query successful:', sessions?.length || 0, 'rows');
    }

    console.log('\nAll basic queries completed!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testQueries();
