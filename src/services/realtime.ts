import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeMessage {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  message_type: string;
  reply_to_id?: string;
  file_url?: string;
  edited_at?: string;
  profiles?: {
    display_name: string;
    avatar_url?: string;
  };
}

export interface RealtimeNote {
  id: string;
  title: string;
  content: string;
  subject: string;
  group_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_collaborative?: boolean;
  permission_level: string;
  session_id?: string;
  tags?: string[];
  profiles?: {
    display_name: string;
    avatar_url?: string;
  };
}

export class RealtimeService {
  private static channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe to real-time messages for a specific conversation
   */
  static subscribeToMessages(
    conversationId: string,
    onMessageReceived: (message: RealtimeMessage) => void,
    onMessageUpdated?: (message: RealtimeMessage) => void,
    onMessageDeleted?: (messageId: string) => void
  ): RealtimeChannel {
    const channelName = `messages:${conversationId}`;
    
    // Remove existing channel if any
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          console.log('New message received:', payload);
          
          // Fetch the sender's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, user_id')
            .eq('user_id', payload.new.sender_id)
            .single();

          const messageWithProfile = {
            ...payload.new,
            profiles: profile || null
          } as unknown as RealtimeMessage;

          onMessageReceived(messageWithProfile);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          console.log('Message updated:', payload);
          
          if (onMessageUpdated) {
            // Fetch the sender's profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url, user_id')
              .eq('user_id', payload.new.sender_id)
              .single();

            const messageWithProfile = {
              ...payload.new,
              profiles: profile || null
            } as unknown as RealtimeMessage;

            onMessageUpdated(messageWithProfile);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('Message deleted:', payload);
          
          if (onMessageDeleted) {
            onMessageDeleted(payload.old.id);
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to real-time notes for a specific group or user
   */
  static subscribeToNotes(
    params: { groupId?: string; userId?: string },
    onNoteReceived: (note: RealtimeNote) => void,
    onNoteUpdated?: (note: RealtimeNote) => void,
    onNoteDeleted?: (noteId: string) => void
  ): RealtimeChannel {
    const channelName = params.groupId 
      ? `group_notes:${params.groupId}` 
      : `user_notes:${params.userId}`;
    
    // Remove existing channel if any
    this.unsubscribe(channelName);

    let filter = '';
    if (params.groupId) {
      filter = `group_id=eq.${params.groupId}`;
    } else if (params.userId) {
      filter = `user_id=eq.${params.userId}`;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notes',
          filter,
        },
        async (payload) => {
          console.log('New note received:', payload);
          
          // Fetch the complete note with profile data
          const { data: noteWithProfile } = await supabase
            .from('notes')
            .select(`
              *,
              profiles:user_id (
                display_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (noteWithProfile) {
            onNoteReceived(noteWithProfile as unknown as RealtimeNote);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notes',
          filter,
        },
        async (payload) => {
          console.log('Note updated:', payload);
          
          if (onNoteUpdated) {
            const { data: noteWithProfile } = await supabase
              .from('notes')
              .select(`
                *,
                profiles:user_id (
                  display_name,
                  avatar_url
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (noteWithProfile) {
              onNoteUpdated(noteWithProfile as unknown as RealtimeNote);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notes',
          filter,
        },
        (payload) => {
          console.log('Note deleted:', payload);
          
          if (onNoteDeleted) {
            onNoteDeleted(payload.old.id);
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to presence updates for a group (who's online)
   */
  static subscribeToPresence(
    groupId: string,
    onPresenceUpdate: (presences: Record<string, any[]>) => void
  ): RealtimeChannel {
    const channelName = `presence:${groupId}`;
    
    // Remove existing channel if any
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        onPresenceUpdate(newState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        const newState = channel.presenceState();
        onPresenceUpdate(newState);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        const newState = channel.presenceState();
        onPresenceUpdate(newState);
      })
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Track user presence in a group
   */
  static async trackPresence(
    groupId: string,
    user: { id: string; name: string; avatar?: string }
  ): Promise<void> {
    const channelName = `presence:${groupId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      await channel.track({
        user_id: user.id,
        user_name: user.name,
        user_avatar: user.avatar,
        online_at: new Date().toISOString(),
      });
    }
  }

  /**
   * Stop tracking user presence
   */
  static async untrackPresence(groupId: string): Promise<void> {
    const channelName = `presence:${groupId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      await channel.untrack();
    }
  }

  /**
   * Send a broadcast message to all users in a channel
   */
  static async broadcast(
    channelName: string,
    event: string,
    payload: any
  ): Promise<void> {
    const channel = this.channels.get(channelName);
    
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event,
        payload,
      });
    }
  }

  /**
   * Subscribe to broadcast events
   */
  static subscribeToBroadcast(
    channelName: string,
    event: string,
    callback: (payload: any) => void
  ): RealtimeChannel {
    // Remove existing channel if any
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event }, ({ payload }) => {
        console.log('Broadcast received:', event, payload);
        callback(payload);
      })
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Unsubscribe from a specific channel
   */
  static unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  static unsubscribeAll(): void {
    this.channels.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }

  /**
   * Get current channel status
   */
  static getChannelStatus(channelName: string): string | null {
    const channel = this.channels.get(channelName);
    return channel ? channel.state : null;
  }
}