import { useState, useEffect, useRef } from 'react';
import { Plus, Users, Edit, Trash2, Save, X, Eye, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCollaborativeNotes, CollaborativeNote } from '@/hooks/useCollaborativeNotes';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
    loadNotes,
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

  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Subscribe to cursor positions for collaborative editing
  useEffect(() => {
    if (groupId) {
      subscribeToCursors((data) => {
        if (data.user_id !== user?.id) {
          setCursorPositions(prev => ({
            ...prev,
            [data.user_id]: data,
          }));
          
          // Clean up old cursor positions
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
      toast({
        title: "Error",
        description: "Please enter a note title",
        variant: "destructive",
      });
      return;
    }

    try {
      await createNote(newNote);
      
      setNewNote({
        title: '',
        content: '',
        subject: '',
        permission_level: groupId ? 'group' : 'private',
      });
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Note created successfully",
      });
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Error",
        description: "Failed to create note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditNote = (note: CollaborativeNote) => {
    setEditingNote(note);
    setEditForm({
      title: note.title,
      content: note.content || '',
      subject: note.subject || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingNote) return;

    try {
      await updateNote(editingNote.id, editForm);
      setEditingNote(null);
      
      toast({
        title: "Success",
        description: "Note updated successfully",
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      });
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
        <AlertDescription className="text-red-800 dark:text-red-200">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  value={newNote.title}
                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter note title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Input
                  value={newNote.subject}
                  onChange={(e) => setNewNote(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g., Mathematics, Physics..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <Textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your note content..."
                  className="min-h-[200px]"
                />
              </div>
              
              {!groupId && (
                <div>
                  <label className="block text-sm font-medium mb-2">Permission</label>
                  <Select 
                    value={newNote.permission_level} 
                    onValueChange={(value: 'private' | 'friends' | 'group' | 'public') => 
                      setNewNote(prev => ({ ...prev, permission_level: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateNote}>
                  Create Note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No notes yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {groupId 
              ? 'Start collaborating by creating your first group note' 
              : 'Create your first note to get started'
            }
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Create Note
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <Card key={note.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate dark:text-white">
                      {note.title}
                    </CardTitle>
                    {note.subject && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {note.subject}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-2">
                    {note.is_collaborative && (
                      <Badge variant="outline" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        Collaborative
                      </Badge>
                    )}
                    
                    {note.created_by === user?.id && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditNote(note)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {note.content && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                      {note.content}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      By {note.profiles?.display_name || 'Unknown'}
                    </span>
                    <span>
                      {new Date(note.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {/* Show active collaborators for this note */}
                  {groupId && Object.values(cursorPositions).some((cursor: any) => cursor.note_id === note.id) && (
                    <div className="flex items-center space-x-1">
                      <Eye className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600 dark:text-green-400">
                        {Object.values(cursorPositions).filter((cursor: any) => cursor.note_id === note.id).length} viewing
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingNote && (
        <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Note</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Input
                  value={editForm.subject}
                  onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <Textarea
                  ref={editTextareaRef}
                  value={editForm.content}
                  onChange={(e) => {
                    setEditForm(prev => ({ ...prev, content: e.target.value }));
                    // Broadcast cursor position for real-time collaboration
                    if (editTextareaRef.current) {
                      handleCursorChange(editingNote.id, editTextareaRef.current.selectionStart);
                    }
                  }}
                  onSelect={() => {
                    // Broadcast cursor position on selection change
                    if (editTextareaRef.current) {
                      handleCursorChange(editingNote.id, editTextareaRef.current.selectionStart);
                    }
                  }}
                  className="min-h-[200px]"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingNote(null)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};