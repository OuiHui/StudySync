import { useState, useEffect, useCallback } from 'react';
import { RealtimeService, RealtimeNote } from '@/services/realtime';
import { NotesService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CollaborativeNote {
  id: string;
  title: string;
  content: string;
  subject: string;
  group_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_collaborative: boolean;
  permission_level: string;
  profiles?: {
    display_name: string;
    avatar_url?: string;
  };
}

export const useCollaborativeNotes = (groupId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<CollaborativeNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineCollaborators, setOnlineCollaborators] = useState<Record<string, any[]>>({});

  // Load notes
  const loadNotes = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      let userNotes;
      if (groupId) {
        // Load group notes
        userNotes = await NotesService.getGroupNotes(groupId);
      } else {
        // Load user's personal notes
        userNotes = await NotesService.getNotes();
      }
      
      setNotes(userNotes as CollaborativeNote[]);
    } catch (err) {
      console.error('Error loading notes:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load notes';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, groupId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const params = groupId ? { groupId } : { userId: user.id };

    // Subscribe to note changes
    RealtimeService.subscribeToNotes(
      params,
      (newNote: RealtimeNote) => {
        const collaborativeNote = newNote as unknown as CollaborativeNote;
        setNotes(prev => [...prev, collaborativeNote]);
        
        // Show toast for notes from other users
        if (newNote.created_by !== user.id) {
          toast({
            title: "New note added",
            description: `${newNote.profiles?.display_name || 'Someone'} added "${newNote.title}"`,
          });
        }
      },
      (updatedNote: RealtimeNote) => {
        const collaborativeNote = updatedNote as unknown as CollaborativeNote;
        setNotes(prev =>
          prev.map(note =>
            note.id === updatedNote.id ? collaborativeNote : note
          )
        );
        
        // Show toast for updates from other users
        if (updatedNote.created_by !== user.id) {
          toast({
            title: "Note updated",
            description: `${updatedNote.profiles?.display_name || 'Someone'} updated "${updatedNote.title}"`,
          });
        }
      },
      (deletedNoteId: string) => {
        setNotes(prev => prev.filter(note => note.id !== deletedNoteId));
        
        toast({
          title: "Note deleted",
          description: "A note was removed from the collection",
        });
      }
    );

    // Set up presence tracking for collaborative editing
    if (groupId) {
      RealtimeService.trackPresence(groupId, {
        id: user.id,
        name: user.user_metadata?.display_name || user.email || 'Anonymous',
        avatar: user.user_metadata?.avatar_url,
      });

      RealtimeService.subscribeToPresence(groupId, (presences) => {
        setOnlineCollaborators(presences);
      });
    }

    // Load initial data
    loadNotes();

    // Cleanup on unmount
    return () => {
      const channelName = groupId ? `group_notes:${groupId}` : `user_notes:${user.id}`;
      RealtimeService.unsubscribe(channelName);
      
      if (groupId) {
        RealtimeService.unsubscribe(`presence:${groupId}`);
        RealtimeService.untrackPresence(groupId);
      }
    };
  }, [user, groupId, loadNotes, toast]);

  // Create a new note
  const createNote = useCallback(async (noteData: {
    title: string;
    content: string;
    subject: string;
    is_collaborative?: boolean;
    permission_level?: 'private' | 'friends' | 'group' | 'public';
  }) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const newNote = await NotesService.createNote({
        ...noteData,
        group_id: groupId,
        is_collaborative: groupId ? true : (noteData.is_collaborative || false),
        permission_level: noteData.permission_level || (groupId ? 'group' : 'private'),
      });

      // Note will be added via real-time subscription
      return newNote;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }, [user, groupId]);

  // Update a note
  const updateNote = useCallback(async (noteId: string, updates: {
    title?: string;
    content?: string;
    subject?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const updatedNote = await NotesService.updateNote(noteId, updates);
      
      // Note will be updated via real-time subscription
      return updatedNote;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }, [user]);

  // Delete a note
  const deleteNote = useCallback(async (noteId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await NotesService.deleteNote(noteId);
      
      // Note will be removed via real-time subscription
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }, [user]);

  // Broadcast cursor position for collaborative editing
  const broadcastCursor = useCallback((noteId: string, position: number) => {
    if (groupId && user) {
      RealtimeService.broadcast(
        `collaborative_notes:${groupId}`,
        'cursor_position',
        {
          note_id: noteId,
          user_id: user.id,
          user_name: user.user_metadata?.display_name || user.email,
          position,
          timestamp: Date.now(),
        }
      );
    }
  }, [groupId, user]);

  // Subscribe to cursor positions from other users
  const subscribeToCursors = useCallback((onCursorUpdate: (data: any) => void) => {
    if (groupId) {
      RealtimeService.subscribeToBroadcast(
        `collaborative_notes:${groupId}`,
        'cursor_position',
        onCursorUpdate
      );
    }
  }, [groupId]);

  return {
    notes,
    loading,
    error,
    onlineCollaborators,
    createNote,
    updateNote,
    deleteNote,
    loadNotes,
    broadcastCursor,
    subscribeToCursors,
  };
};