import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Helper function to check authentication
export const checkAuth = async () => {
  try {
    // First try to get the current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth check error:', error);
      return null;
    }

    // If no session, return null
    if (!session) {
      console.log('No active session found');
      return null;
    }

    // Check if the token is expired (with some buffer time)
    const now = Math.floor(Date.now() / 1000);
    const tokenExp = session.expires_at || 0;
    
    // If token is expired or about to expire (within 300 seconds), try to refresh
    if (tokenExp - now < 300) {
      console.log('Token expired or expiring soon, attempting refresh...');
      
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Failed to refresh session:', refreshError);
        console.log('Session refresh failed, user needs to log in again');
        
        // Clear the session and redirect to login
        await supabase.auth.signOut();
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
        
        return null;
      }
      
      if (refreshData?.session) {
        console.log('Session refreshed successfully');
        return refreshData.session;
      } else {
        console.log('Session refresh returned no session, redirecting to login');
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
        return null;
      }
    }

    return session;
  } catch (error) {
    console.error('Unexpected error in checkAuth:', error);
    
    // On any unexpected error, clear session and redirect to login
    try {
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
    } catch (signOutError) {
      console.error('Error signing out:', signOutError);
    }
    
    return null;
  }
};

// Helper function to handle database errors
export const handleDbError = (error: any, operation: string) => {
  console.error(`Database error in ${operation}:`, error);
  
  if (error.code === 'PGRST116') {
    throw new Error(`No data found for ${operation}`);
  } else if (error.code === 'PGRST301') {
    // Check if it's a JWT expiration
    if (error.message?.includes('JWT expired') || error.message?.includes('JWT')) {
      // Redirect to auth page for re-authentication
      console.log('JWT expired, redirecting to auth...');
      setTimeout(() => {
        window.location.href = '/auth';
      }, 1000);
      throw new Error(`Session expired. Please log in again.`);
    }
    throw new Error(`Authentication required for ${operation}`);
  } else if (error.message?.includes('RLS')) {
    throw new Error(`Access denied for ${operation}. Please ensure you're logged in.`);
  } else if (error.message?.includes('JWT expired')) {
    // Handle direct JWT expired messages
    console.log('Direct JWT expiration detected, redirecting to auth...');
    setTimeout(() => {
      window.location.href = '/auth';
    }, 1000);
    throw new Error(`Session expired. Please log in again.`);
  } else {
    throw new Error(`Failed to ${operation}: ${error.message || 'Unknown error'}`);
  }
};

// Type aliases for cleaner code
export type StudyGroup = Database['public']['Tables']['study_groups']['Row'];
export type StudySession = Database['public']['Tables']['study_sessions']['Row'];
export type Note = Database['public']['Tables']['notes']['Row'];
export type User = Database['public']['Tables']['profiles']['Row'];
export type GroupMember = Database['public']['Tables']['group_members']['Row'];
export type SessionParticipant = Database['public']['Tables']['session_participants']['Row'];
export type Friendship = Database['public']['Tables']['friendships']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];

// Study Events Service (using study_sessions for calendar events)