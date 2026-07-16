import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { supabase as mainSupabase } from '@/integrations/supabase/client';

export interface SeededUser {
  id: string;
  name: string;
  email: string;
  password: string;
}

export const MOCK_USERS: SeededUser[] = [
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

const SUPABASE_URL = "https://yysdestjdzdmulgatmpc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5c2Rlc3RqZHpkbXVsZ2F0bXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5OTM3ODUsImV4cCI6MjA2NDU2OTc4NX0.SQzWV9Vd72zC8J6sSIPsKSsQp90Jte3e_lCMy7eb9_M";

export class SimulatedUserBot {
  user: SeededUser;
  client: SupabaseClient<Database>;
  private manager: SimulationManager;
  private authenticated = false;
  private isMainUser = false;

  constructor(user: SeededUser, manager: SimulationManager, isMainUser = false) {
    this.user = user;
    this.manager = manager;
    this.isMainUser = isMainUser;
    
    if (isMainUser) {
      this.client = mainSupabase;
      this.authenticated = true; // Main user is already logged in
    } else {
      this.client = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });
    }
  }

  async ensureAuth() {
    if (this.isMainUser) return;
    if (this.authenticated) return;
    
    this.manager.log(`Logging in bot ${this.user.name} (${this.user.email})...`);
    const { error } = await this.client.auth.signInWithPassword({
      email: this.user.email,
      password: this.user.password
    });

    if (error) {
      this.manager.log(`❌ Failed to login bot ${this.user.name}: ${error.message}`);
      throw error;
    }
    
    this.authenticated = true;
    this.manager.log(`✅ Bot ${this.user.name} logged in successfully.`);
  }

  // Resolve target name/email to User ID
  async resolveUserId(target: string): Promise<string> {
    // Check if it's already an ID
    if (target.match(/^[0-9a-fA-F-]{36}$/)) {
      return target;
    }

    // Try mock users configuration first
    const mock = MOCK_USERS.find(
      u => u.name.toLowerCase() === target.toLowerCase() || u.email.toLowerCase() === target.toLowerCase()
    );
    if (mock) return mock.id;

    // Search database
    const { data: profiles, error } = await this.client
      .from('profiles')
      .select('user_id')
      .or(`display_name.ilike.%${target}%,email.ilike.%${target}%`)
      .limit(1);

    if (error || !profiles || profiles.length === 0) {
      throw new Error(`Could not resolve user identifier: "${target}"`);
    }

    return profiles[0].user_id;
  }

  async sendFriendRequest(targetIdentifier: string) {
    await this.ensureAuth();
    const targetId = await this.resolveUserId(targetIdentifier);
    const targetName = MOCK_USERS.find(u => u.id === targetId)?.name || targetIdentifier;

    this.manager.log(`Bot ${this.user.name} is sending friend request to ${targetName}...`);

    // Insert friendship row
    const { error } = await this.client
      .from('friendships' as any)
      .insert({
        user_id: this.user.id,
        friend_id: targetId,
        status: 'pending'
      });

    if (error) {
      if (error.message.includes('unique')) {
        this.manager.log(`⚠️ Friendship/request between ${this.user.name} and ${targetName} already exists.`);
        return;
      }
      this.manager.log(`❌ Error sending request: ${error.message}`);
      throw error;
    }

    this.manager.log(`✅ Friend request sent from ${this.user.name} to ${targetName}.`);
  }

  async acceptFriendRequest(senderIdentifier: string) {
    await this.ensureAuth();
    const senderId = await this.resolveUserId(senderIdentifier);
    const senderName = MOCK_USERS.find(u => u.id === senderId)?.name || senderIdentifier;

    this.manager.log(`Bot ${this.user.name} is accepting friend request from ${senderName}...`);

    // Find the friendship first
    const { data: friendship, error: findError } = await this.client
      .from('friendships' as any)
      .select('id')
      .or(`and(user_id.eq.${senderId},friend_id.eq.${this.user.id}),and(user_id.eq.${this.user.id},friend_id.eq.${senderId})`)
      .maybeSingle();

    if (findError) {
      this.manager.log(`❌ Error finding friendship request: ${findError.message}`);
      throw findError;
    }

    if (!friendship) {
      this.manager.log(`⚠️ No pending friend request found between ${this.user.name} and ${senderName}.`);
      return;
    }

    const { error } = await this.client
      .from('friendships' as any)
      .update({ status: 'accepted' })
      .eq('id', friendship.id);

    if (error) {
      this.manager.log(`❌ Error accepting request: ${error.message}`);
      throw error;
    }

    this.manager.log(`✅ Friendship accepted between ${this.user.name} and ${senderName}.`);
  }

  async rejectFriendRequest(senderIdentifier: string) {
    await this.ensureAuth();
    const senderId = await this.resolveUserId(senderIdentifier);
    const senderName = MOCK_USERS.find(u => u.id === senderId)?.name || senderIdentifier;

    this.manager.log(`Bot ${this.user.name} is declining friend request from ${senderName}...`);

    // Find the friendship first
    const { data: friendship, error: findError } = await this.client
      .from('friendships' as any)
      .select('id')
      .or(`and(user_id.eq.${senderId},friend_id.eq.${this.user.id}),and(user_id.eq.${this.user.id},friend_id.eq.${senderId})`)
      .maybeSingle();

    if (findError) {
      this.manager.log(`❌ Error finding friendship request: ${findError.message}`);
      throw findError;
    }

    if (!friendship) {
      this.manager.log(`⚠️ No friend request/friendship found between ${this.user.name} and ${senderName}.`);
      return;
    }

    const { error } = await this.client
      .from('friendships' as any)
      .delete()
      .eq('id', friendship.id);

    if (error) {
      this.manager.log(`❌ Error rejecting request: ${error.message}`);
      throw error;
    }

    this.manager.log(`✅ Friend request from ${senderName} declined/removed by ${this.user.name}.`);
  }

  async createGroup(name: string, description: string, subject: string, maxMembers = 10, isPublic = true): Promise<string> {
    await this.ensureAuth();
    this.manager.log(`Bot ${this.user.name} is creating study group "${name}"...`);

    const { data: group, error: groupError } = await this.client
      .from('study_groups')
      .insert({
        name,
        description,
        subject,
        is_public: isPublic,
        created_by: this.user.id,
        max_members: maxMembers
      })
      .select()
      .single();

    if (groupError) {
      this.manager.log(`❌ Error creating group: ${groupError.message}`);
      throw groupError;
    }

    // Join group as admin
    const { error: memberError } = await this.client
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: this.user.id,
        role: 'admin'
      });

    if (memberError) {
      this.manager.log(`❌ Error adding creator to group: ${memberError.message}`);
    }

    this.manager.log(`✅ Group "${name}" (${isPublic ? 'Public' : 'Private'}) created successfully by ${this.user.name}. ID: ${group.id}`);
    return group.id;
  }

  async resolveGroupId(target: string): Promise<string> {
    if (target.match(/^[0-9a-fA-F-]{36}$/)) return target;

    const { data: group, error } = await this.client
      .from('study_groups')
      .select('id')
      .ilike('name', `%${target}%`)
      .limit(1);

    if (error || !group || group.length === 0) {
      throw new Error(`Could not resolve group name: "${target}"`);
    }

    return group[0].id;
  }

  async joinGroup(groupIdentifier: string) {
    await this.ensureAuth();
    const groupId = await this.resolveGroupId(groupIdentifier);

    this.manager.log(`Bot ${this.user.name} is joining group ID ${groupId}...`);

    const { error } = await this.client
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: this.user.id,
        role: 'member'
      });

    if (error) {
      if (error.message.includes('unique') || error.message.includes('duplicate')) {
        this.manager.log(`⚠️ ${this.user.name} is already a member of this group.`);
        return;
      }
      this.manager.log(`❌ Error joining group: ${error.message}`);
      throw error;
    }

    this.manager.log(`✅ Bot ${this.user.name} joined group successfully.`);
  }

  async leaveGroup(groupIdentifier: string) {
    await this.ensureAuth();
    const groupId = await this.resolveGroupId(groupIdentifier);

    this.manager.log(`Bot ${this.user.name} is leaving group ID ${groupId}...`);

    const { error } = await this.client
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', this.user.id);

    if (error) {
      this.manager.log(`❌ Error leaving group: ${error.message}`);
      throw error;
    }

    this.manager.log(`✅ Bot ${this.user.name} left the group.`);
  }

  async kickGroupMember(groupIdentifier: string, targetIdentifier: string) {
    await this.ensureAuth();
    const groupId = await this.resolveGroupId(groupIdentifier);
    const targetId = await this.resolveUserId(targetIdentifier);
    const targetName = MOCK_USERS.find(u => u.id === targetId)?.name || targetIdentifier;

    this.manager.log(`Bot ${this.user.name} is kicking ${targetName} from group ID ${groupId}...`);

    const { error } = await this.client
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', targetId);

    if (error) {
      this.manager.log(`❌ Error kicking member: ${error.message}`);
      throw error;
    }

    this.manager.log(`✅ Bot ${this.user.name} kicked ${targetName} from the group.`);
  }

  async sendMessage(targetUserIdentifier: string, content: string) {
    await this.ensureAuth();
    const targetId = await this.resolveUserId(targetUserIdentifier);
    const targetName = MOCK_USERS.find(u => u.id === targetId)?.name || targetUserIdentifier;

    this.manager.log(`Bot ${this.user.name} is sending direct message to ${targetName}...`);

    // 1. Find existing direct conversation between these two users
    const { data: participations, error: pError } = await this.client
      .from('conversation_participants')
      .select('conversation_id');

    if (pError) {
      this.manager.log(`❌ Error finding conversations: ${pError.message}`);
      throw pError;
    }

    const myConvIds = participations?.map(p => p.conversation_id) || [];
    let conversationId: string | null = null;

    if (myConvIds.length > 0) {
      // Find one where targetId is also active and is_group_chat = false
      const { data: matchedParticipants } = await this.client
        .from('conversation_participants')
        .select('conversation_id, conversations!inner(*)')
        .in('conversation_id', myConvIds)
        .eq('user_id', targetId)
        .eq('conversations.is_group_chat', false)
        .limit(1);

      if (matchedParticipants && matchedParticipants.length > 0) {
        conversationId = matchedParticipants[0].conversation_id;
      }
    }

    // 2. Create conversation if it doesn't exist
    if (!conversationId) {
      this.manager.log(`No existing conversation found. Creating new DM channel...`);
      const { data: conversation, error: cError } = await this.client
        .from('conversations')
        .insert({
          created_by: this.user.id,
          is_group_chat: false
        })
        .select()
        .single();

      if (cError) {
        this.manager.log(`❌ Error creating DM conversation: ${cError.message}`);
        throw cError;
      }

      conversationId = conversation.id;

      // Add participants
      await this.client
        .from('conversation_participants')
        .insert([
          { conversation_id: conversationId, user_id: this.user.id },
          { conversation_id: conversationId, user_id: targetId }
        ]);
    }

    // 3. Send message
    const { error: msgError } = await this.client
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: this.user.id,
        content
      });

    if (msgError) {
      this.manager.log(`❌ Error sending message: ${msgError.message}`);
      throw msgError;
    }

    this.manager.log(`✅ Message sent successfully from ${this.user.name} to ${targetName}.`);
  }

  async sendGroupMessage(groupIdentifier: string, content: string) {
    await this.ensureAuth();
    const groupId = await this.resolveGroupId(groupIdentifier);

    this.manager.log(`Bot ${this.user.name} is sending message to group ${groupIdentifier}...`);

    // 1. Get or create group conversation
    let conversationId: string | null = null;

    const { data: groupConversation } = await this.client
      .from('conversations')
      .select('*')
      .eq('group_id', groupId)
      .eq('is_group_chat', true)
      .single();

    if (groupConversation) {
      conversationId = groupConversation.id;
    } else {
      this.manager.log(`Creating new chat conversation for group ${groupId}...`);
      const { data: newConv, error: createError } = await this.client
        .from('conversations')
        .insert({
          created_by: this.user.id,
          group_id: groupId,
          is_group_chat: true
        })
        .select()
        .single();

      if (createError) {
        this.manager.log(`❌ Failed to create group conversation: ${createError.message}`);
        throw createError;
      }

      conversationId = newConv.id;

      // Add sender as participant
      await this.client
        .from('conversation_participants')
        .insert({
          conversation_id: conversationId,
          user_id: this.user.id
        });
    }

    // 2. Send message
    const { error } = await this.client
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: this.user.id,
        content
      });

    if (error) {
      this.manager.log(`❌ Error sending group message: ${error.message}`);
      throw error;
    }

    this.manager.log(`✅ Message sent to group chat by ${this.user.name}.`);
  }

  async createNote(title: string, content: string, subject: string, groupIdentifier?: string, permission: 'private' | 'group' | 'public' = 'private') {
    await this.ensureAuth();
    let groupId: string | null = null;
    if (groupIdentifier) {
      groupId = await this.resolveGroupId(groupIdentifier);
    }

    this.manager.log(`Bot ${this.user.name} is creating note "${title}"...`);

    const { error } = await this.client
      .from('notes')
      .insert({
        title,
        content,
        subject,
        group_id: groupId,
        created_by: this.user.id,
        permission_level: permission,
        is_collaborative: permission === 'group'
      });

    if (error) {
      this.manager.log(`❌ Error creating note: ${error.message}`);
      throw error;
    }

    this.manager.log(`✅ Note "${title}" created successfully.`);
  }

  async resolveSessionId(target: string): Promise<string> {
    if (target.match(/^[0-9a-fA-F-]{36}$/)) return target;

    const { data: session, error } = await this.client
      .from('study_sessions')
      .select('id')
      .ilike('title', `%${target}%`)
      .limit(1);

    if (error || !session || session.length === 0) {
      throw new Error(`Could not resolve study session title: "${target}"`);
    }

    return session[0].id;
  }

  async joinSession(sessionIdentifier: string) {
    await this.ensureAuth();
    const sessionId = await this.resolveSessionId(sessionIdentifier);

    this.manager.log(`Bot ${this.user.name} is joining study session ID ${sessionId}...`);

    // Check if participant row already exists (e.g. from an invitation)
    const { data: existing, error: fetchError } = await this.client
      .from('session_participants')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', this.user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching existing participant:', fetchError);
    }

    let dbError;
    if (existing) {
      const { error } = await this.client
        .from('session_participants')
        .update({
          status: 'active',
          is_attending: true
        })
        .eq('session_id', sessionId)
        .eq('user_id', this.user.id);
      dbError = error;
    } else {
      const { error } = await this.client
        .from('session_participants')
        .insert({
          session_id: sessionId,
          user_id: this.user.id,
          role: 'participant',
          status: 'active',
          is_attending: true
        });
      dbError = error;
    }

    if (dbError) {
      this.manager.log(`❌ Error joining session: ${dbError.message}`);
      throw dbError;
    }

    this.manager.log(`✅ Bot ${this.user.name} joined study session successfully.`);
  }

  async leaveSession(sessionIdentifier: string) {
    await this.ensureAuth();
    const sessionId = await this.resolveSessionId(sessionIdentifier);

    this.manager.log(`Bot ${this.user.name} is leaving study session ID ${sessionId}...`);

    const { error } = await this.client
      .from('session_participants')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', this.user.id);

    if (error) {
      this.manager.log(`❌ Error leaving session: ${error.message}`);
      throw error;
    }

    this.manager.log(`✅ Bot ${this.user.name} left study session.`);
  }

  async inviteUserToGroup(groupIdentifier: string, targetIdentifier: string) {
    await this.ensureAuth();
    const groupId = await this.resolveGroupId(groupIdentifier);
    const targetId = await this.resolveUserId(targetIdentifier);
    const targetName = MOCK_USERS.find(u => u.id === targetId)?.name || targetIdentifier;

    this.manager.log(`Bot ${this.user.name} is inviting ${targetName} to group ID ${groupId}...`);

    const { error } = await this.client
      .from('group_invitations' as any)
      .insert({
        group_id: groupId,
        invited_user_id: targetId,
        invited_by_id: this.user.id,
        status: 'pending'
      });

    if (error) {
      if (error.message.includes('unique')) {
        this.manager.log(`⚠️ Invitation for ${targetName} to group already exists.`);
        return;
      }
      this.manager.log(`❌ Error inviting to group: ${error.message}`);
      throw error;
    }

    this.manager.log(`✅ Invitation sent from ${this.user.name} to ${targetName} for group.`);
  }

  async inviteUserToSession(sessionIdentifier: string, targetIdentifier: string) {
    await this.ensureAuth();
    const sessionId = sessionIdentifier; // UUID
    const targetId = await this.resolveUserId(targetIdentifier);
    const targetName = MOCK_USERS.find(u => u.id === targetId)?.name || targetIdentifier;

    this.manager.log(`Bot ${this.user.name} is inviting ${targetName} to study session ID ${sessionId}...`);

    const { error } = await this.client
      .from('session_participants')
      .insert({
        session_id: sessionId,
        user_id: targetId,
        role: 'participant',
        status: 'invited',
        is_attending: false
      });

    if (error) {
      if (error.message.includes('unique')) {
        this.manager.log(`⚠️ Participant/Invitation for ${targetName} in session already exists.`);
        return;
      }
      this.manager.log(`❌ Error inviting to session: ${error.message}`);
      throw error;
    }

    this.manager.log(`✅ Invitation sent from ${this.user.name} to ${targetName} for session.`);
  }

  async acceptGroupInvitation(groupIdentifier: string) {
    await this.ensureAuth();
    const groupId = await this.resolveGroupId(groupIdentifier);
    this.manager.log(`Bot ${this.user.name} is accepting group invitation for group ID ${groupId}...`);
    const { error } = await this.client
      .from('group_invitations' as any)
      .update({ status: 'accepted' })
      .eq('group_id', groupId)
      .eq('invited_user_id', this.user.id);
    if (error) {
      this.manager.log(`❌ Error accepting group invitation: ${error.message}`);
      throw error;
    }
    this.manager.log(`✅ Bot ${this.user.name} accepted group invitation.`);
  }

  async declineGroupInvitation(groupIdentifier: string) {
    await this.ensureAuth();
    const groupId = await this.resolveGroupId(groupIdentifier);
    this.manager.log(`Bot ${this.user.name} is declining group invitation for group ID ${groupId}...`);
    const { error } = await this.client
      .from('group_invitations' as any)
      .update({ status: 'declined' })
      .eq('group_id', groupId)
      .eq('invited_user_id', this.user.id);
    if (error) {
      this.manager.log(`❌ Error declining group invitation: ${error.message}`);
      throw error;
    }
    this.manager.log(`✅ Bot ${this.user.name} declined group invitation.`);
  }

  async acceptSessionInvitation(sessionIdentifier: string) {
    await this.ensureAuth();
    const sessionId = sessionIdentifier;
    this.manager.log(`Bot ${this.user.name} is accepting session invitation for session ID ${sessionId}...`);
    const { error } = await this.client
      .from('session_participants')
      .update({ status: 'accepted', is_attending: false })
      .eq('session_id', sessionId)
      .eq('user_id', this.user.id);
    if (error) {
      this.manager.log(`❌ Error accepting session invitation: ${error.message}`);
      throw error;
    }
    this.manager.log(`✅ Bot ${this.user.name} accepted session invitation.`);
  }

  async declineSessionInvitation(sessionIdentifier: string) {
    await this.ensureAuth();
    const sessionId = sessionIdentifier;
    this.manager.log(`Bot ${this.user.name} is declining session invitation for session ID ${sessionId}...`);
    const { error } = await this.client
      .from('session_participants')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', this.user.id);
    if (error) {
      this.manager.log(`❌ Error declining session invitation: ${error.message}`);
      throw error;
    }
    this.manager.log(`✅ Bot ${this.user.name} declined session invitation.`);
  }
}

type LogListener = (message: string) => void;

class SimulationManager {
  private bots = new Map<string, SimulatedUserBot>();
  private logListeners = new Set<LogListener>();
  public logs: string[] = [];

  constructor() {
    this.log('Simulation Manager initialized.');
  }

  addLogListener(listener: LogListener) {
    this.logListeners.add(listener);
    return () => this.logListeners.delete(listener);
  }

  log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `[${timestamp}] ${message}`;
    console.log(`[Simulation] ${message}`);
    this.logs.push(formatted);
    // Limit to 200 logs
    if (this.logs.length > 200) this.logs.shift();
    this.logListeners.forEach(listener => listener(formatted));
  }

  clearLogs() {
    this.logs = [];
    this.logListeners.forEach(listener => listener('__CLEAR__'));
  }

  // Get or initialize bot
  async bot(nameOrEmailOrId: string): Promise<SimulatedUserBot> {
    const { data: { session } } = await mainSupabase.auth.getSession();
    const mainUser = session?.user;
    
    const isMainUser = mainUser && (
      nameOrEmailOrId.toLowerCase() === mainUser.id.toLowerCase() ||
      nameOrEmailOrId.toLowerCase() === mainUser.email?.toLowerCase() ||
      nameOrEmailOrId.toLowerCase() === 'you' ||
      nameOrEmailOrId.toLowerCase() === 'mainuser'
    );

    if (isMainUser) {
      let mainBot = this.bots.get(mainUser.id);
      if (!mainBot) {
        mainBot = new SimulatedUserBot({
          id: mainUser.id,
          name: mainUser.user_metadata?.display_name || mainUser.email?.split('@')[0] || 'You',
          email: mainUser.email || '',
          password: ''
        }, this, true);
        this.bots.set(mainUser.id, mainBot);
      }
      return mainBot;
    }

    const search = nameOrEmailOrId.toLowerCase();
    const user = MOCK_USERS.find(
      u => u.name.toLowerCase() === search || 
           u.email.toLowerCase() === search || 
           u.id.toLowerCase() === search ||
           u.name.toLowerCase().startsWith(search)
    );

    if (!user) {
      throw new Error(`User "${nameOrEmailOrId}" is not a seeded mock user.`);
    }

    let bot = this.bots.get(user.id);
    if (!bot) {
      bot = new SimulatedUserBot(user, this);
      this.bots.set(user.id, bot);
    }
    return bot;
  }

  // Login main UI client as this user
  async loginAs(nameOrEmailOrId: string) {
    const search = nameOrEmailOrId.toLowerCase();
    const user = MOCK_USERS.find(
      u => u.name.toLowerCase() === search || 
           u.email.toLowerCase() === search || 
           u.id.toLowerCase() === search ||
           u.name.toLowerCase().startsWith(search)
    );

    if (!user) {
      this.log(`❌ Login failed: User "${nameOrEmailOrId}" not found in seed list.`);
      throw new Error(`User "${nameOrEmailOrId}" is not a seeded mock user.`);
    }

    this.log(`Attempting to sign in main app client as ${user.name}...`);
    const { error } = await mainSupabase.auth.signInWithPassword({
      email: user.email,
      password: user.password
    });

    if (error) {
      this.log(`❌ Main login failed: ${error.message}`);
      throw error;
    }

    this.log(`🎉 Main app client signed in successfully as ${user.name}!`);
  }

  // Preset Scenario: Friendship flow
  async runFriendshipScenario(senderName: string, receiverName: string) {
    this.log(`🚀 Starting Friendship Scenario: ${senderName} ➔ ${receiverName}`);
    try {
      const sender = await this.bot(senderName);
      const receiver = await this.bot(receiverName);

      await sender.sendFriendRequest(receiver.user.id);
      await receiver.acceptFriendRequest(sender.user.id);
      await sender.sendMessage(receiver.user.id, `Hey ${receiver.user.name}, thanks for accepting my friend request!`);
      await receiver.sendMessage(sender.user.id, `No problem ${sender.user.name}! Let's study together soon.`);
      
      this.log(`🏆 Friendship Scenario completed successfully!`);
    } catch (err: any) {
      this.log(`❌ Scenario failed: ${err.message}`);
    }
  }

  // Preset Scenario: Group study sync flow
  async runGroupStudyScenario(creatorName: string, helperNames: string[], groupName: string) {
    this.log(`🚀 Starting Group Study Scenario. Creator: ${creatorName}, Group: ${groupName}`);
    try {
      const creator = await this.bot(creatorName);
      const groupId = await creator.createGroup(
        groupName, 
        `Mock group created by ${creator.user.name} for testing live synchronization.`, 
        'Computer Science'
      );

      for (const name of helperNames) {
        const helper = await this.bot(name);
        await helper.joinGroup(groupId);
        await helper.sendGroupMessage(groupId, `Hey all, just joined the ${groupName} study group!`);
      }

      await creator.sendGroupMessage(groupId, `Awesome, welcome everyone! Let's get to work.`);
      
      this.log(`🏆 Group Study Scenario completed successfully!`);
    } catch (err: any) {
      this.log(`❌ Scenario failed: ${err.message}`);
    }
  }
}

export const simulationManager = new SimulationManager();

// Bind to window for console commands in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).simulation = simulationManager;
}
