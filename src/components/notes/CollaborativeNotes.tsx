import { useState, useEffect } from 'react';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCollaborativeNotes, CollaborativeNote } from '@/hooks/useCollaborativeNotes';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { NoteList } from './NoteList';
import { CreateNoteDialog } from './CreateNoteDialog';
import { EditNoteDialog } from './EditNoteDialog';

interface CollaborativeNotesProps {
  groupId?: string;
  groupName?: string;
}

export const CollaborativeNotes = ({ groupId, groupName }: CollaborativeNotesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    notes,
    loading,
    error,
    onlineCollaborators,
    createNote,
    updateNote,
    deleteNote,
    broadcastCursor,
    subscribeToCursors,
  } = useCollaborativeNotes(groupId);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CollaborativeNote | null>(null);
  const [cursorPositions, setCursorPositions] = useState<Record<string, any>>({});
  
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    subject: '',
    permission_level: (groupId ? 'group' : 'private') as 'private' | 'friends' | 'group' | 'public',
  });

  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    subject: '',
  });

  useEffect(() => {
    if (groupId) {
      subscribeToCursors((data) => {
        if (data.user_id !== user?.id) {
          setCursorPositions(prev => ({ ...prev, [data.user_id]: data }));
          setTimeout(() => {
            setCursorPositions(prev => {
              const updated = { ...prev };
              if (Date.now() - data.timestamp > 5000) {
                delete updated[data.user_id];
              }
              return updated;
            });
          }, 5000);
        }
      });
    }
  }, [groupId, subscribeToCursors, user?.id]);

  const handleCreateNote = async () => {
    if (!newNote.title.trim()) {
      toast({ title: "Error", description: "Please enter a note title", variant: "destructive" });
      return;
    }
    try {
      await createNote(newNote);
      setNewNote({ title: '', content: '', subject: '', permission_level: groupId ? 'group' : 'private' });
      setIsCreateDialogOpen(false);
      toast({ title: "Success", description: "Note created successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create note. Please try again.", variant: "destructive" });
    }
  };

  const handleEditNote = (note: CollaborativeNote) => {
    setEditingNote(note);
    setEditForm({ title: note.title, content: note.content || '', subject: note.subject || '' });
  };

  const handleSaveEdit = async () => {
    if (!editingNote) return;
    try {
      await updateNote(editingNote.id, editForm);
      setEditingNote(null);
      toast({ title: "Success", description: "Note updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update note. Please try again.", variant: "destructive" });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      toast({ title: "Success", description: "Note deleted successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete note. Please try again.", variant: "destructive" });
    }
  };

  const handleCursorChange = (noteId: string, position: number) => {
    if (groupId) {
      broadcastCursor(noteId, position);
    }
  };

  const onlineCount = Object.keys(onlineCollaborators).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading notes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
        <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl font-bold dark:text-white">
            {groupId ? `${groupName} Notes` : 'My Notes'}
          </h2>
          {groupId && onlineCount > 0 && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>{onlineCount} online</span>
            </Badge>
          )}
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-brand hover:bg-brand-hover text-white rounded-xl font-semibold transition-all">
          <Plus className="w-4 h-4 mr-2" /> New Note
        </Button>
      </div>

      <NoteList 
        notes={notes} 
        userId={user?.id} 
        groupId={groupId} 
        onCreateClick={() => setIsCreateDialogOpen(true)} 
        onEditClick={handleEditNote} 
        onDeleteClick={handleDeleteNote} 
      />

      <CreateNoteDialog 
        isOpen={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
        groupId={groupId} 
        newNote={newNote} 
        setNewNote={setNewNote} 
        onCreate={handleCreateNote} 
      />

      <EditNoteDialog 
        editingNote={editingNote} 
        userId={user?.id}
        onOpenChange={() => setEditingNote(null)} 
        editForm={editForm} 
        setEditForm={setEditForm} 
        onSave={handleSaveEdit} 
        onCursorChange={handleCursorChange} 
      />
    </div>
  );
};