
import { useState, useEffect } from 'react';
import { BookOpen, Plus, Share, Download, Search, Filter, Upload, Loader2, Edit, Trash2, AlertTriangle, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UploadMaterialPopup } from './UploadMaterialPopup';
import { NotesService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const Notes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedOwnership, setSelectedOwnership] = useState('all');
  const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false);

  // For legacy view
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit note state
  const [editingNote, setEditingNote] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    content: '',
    subject: '',
    permission_level: 'private' as 'private' | 'public' | 'group' | 'friends'
  });
  
  // View file state
  const [viewingNote, setViewingNote] = useState<any | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  // Create note state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [newNoteData, setNewNoteData] = useState({
    title: '',
    content: '',
    subject: '',
    group_id: ''
  });

  useEffect(() => {
    loadNotes();
    loadGroups();
  }, [user]);

  const loadGroups = async () => {
    if (!user) return;
    
    try {
      const { StudyGroupsService } = await import('@/services/database');
      const userGroups = await StudyGroupsService.getUserGroups();
      setGroups(userGroups);
    } catch (err) {
      console.error('Error loading groups:', err);
    }
  };

  const loadNotes = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const userNotes = await NotesService.getNotes();
      setNotes(userNotes);
    } catch (err) {
      console.error('Error loading notes:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to load notes. Please try again.';
      
      // Check if it's an authentication error
      if (errorMessage.includes('Authentication required') || errorMessage.includes('session has expired')) {
        setError('Your session has expired. Please log in again.');
        
        // Optional: Auto-redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/auth';
        }, 3000);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Mock data fallback for when there's no real data
  const mockNotes = [
    {
      id: '1',
      title: 'Calculus Integration Techniques',
      subject: 'Mathematics',
      author: 'Alex Chen',
      sharedBy: 'me',
      date: '2024-01-10',
      downloads: 24,
      category: 'notes',
      group: 'Advanced Mathematics',
      preview: 'Integration by parts, substitution methods, and partial fractions...',
      isPrivate: false,
      isMine: true
    },
    {
      id: '2',
      title: 'Quantum Mechanics Flashcards',
      subject: 'Physics',
      author: 'Sarah Johnson',
      sharedBy: 'Sarah Johnson',
      date: '2024-01-09',
      downloads: 18,
      category: 'flashcards',
      group: 'Physics Study Circle',
      preview: 'Wave functions, uncertainty principle, quantum tunneling...',
      isPrivate: false,
      isMine: false
    },
    {
      id: '3',
      title: 'Organic Chemistry Lab Procedures',
      subject: 'Chemistry',
      author: 'John Smith',
      sharedBy: 'John Smith',
      date: '2024-01-08',
      downloads: 31,
      category: 'documents',
      group: 'Chemistry Lab Prep',
      preview: 'Step-by-step procedures for synthesis reactions...',
      isPrivate: false,
      isMine: false
    },
    {
      id: '4',
      title: 'Linear Algebra Study Guide',
      subject: 'Mathematics',
      author: 'Emma Wilson',
      sharedBy: 'Emma Wilson',
      date: '2024-01-07',
      downloads: 42,
      category: 'study-guide',
      group: 'Advanced Mathematics',
      preview: 'Vectors, matrices, eigenvalues, and transformations...',
      isPrivate: false,
      isMine: false
    },
    {
      id: '5',
      title: 'Personal History Notes',
      subject: 'History',
      author: 'You',
      sharedBy: 'me',
      date: '2024-01-12',
      downloads: 0,
      category: 'notes',
      group: 'Personal',
      preview: 'Private notes on World War II timeline...',
      isPrivate: true,
      isMine: true
    }
  ];

  // Use the fetched notes or fallback to mock data if no real data
  const displayNotes = notes.length > 0 ? notes.map(note => ({
    id: note.id,
    title: note.title || 'Untitled',
    subject: note.subject || 'General',
    author: 'You', // Since these are user's own notes
    sharedBy: 'me',
    date: new Date(note.created_at).toLocaleDateString(),
    downloads: 0, // Not tracked in current schema
    category: 'notes', // Default to notes since category isn't in schema
    group: 'Personal',
    preview: note.content ? note.content.substring(0, 100) + '...' : 'No content preview',
    isPrivate: note.permission_level === 'private',
    isMine: true, // These are all user's notes
    user_id: note.created_by,
    created_by: note.created_by
  })) : mockNotes;
  const subjects = ['all', ...Array.from(new Set(displayNotes.map(note => note.subject || 'Unknown')))];

  const ownershipOptions = [
    { id: 'all', label: 'All Notes', count: displayNotes.length },
    { id: 'mine', label: 'My Notes', count: displayNotes.filter(n => n.isMine).length },
    { id: 'public', label: 'Public Notes', count: displayNotes.filter(n => !n.isMine).length },
  ];

  const filteredNotes = displayNotes.filter(note => {
    const matchesSearch = (note.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (note.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || note.subject === selectedSubject;
    const matchesOwnership = selectedOwnership === 'all' || 
                           (selectedOwnership === 'mine' && note.isMine) ||
                           (selectedOwnership === 'public' && !note.isMine);
    return matchesSearch && matchesSubject && matchesOwnership;
  });

  const handleEditNote = async (note: any) => {
    try {
      // Fetch the full note content for editing
      const fullNote = await NotesService.getNote(note.id);
      setEditingNote(fullNote);
      setEditFormData({
        title: fullNote.title || '',
        content: fullNote.content || '',
        subject: fullNote.subject || '',
        permission_level: fullNote.permission_level || 'private'
      });
    } catch (err) {
      console.error('Error fetching note for editing:', err);
      // Fallback to using the truncated data
      setEditingNote(note);
      setEditFormData({
        title: note.title || '',
        content: note.preview?.replace('...', '') || '',
        subject: note.subject || '',
        permission_level: note.permission_level || 'private'
      });
      toast({
        title: "Warning",
        description: "Could not fetch full note content. You may be editing a preview.",
        variant: "destructive"
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingNote) return;

    if (!editFormData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Note title is required.",
        variant: "destructive"
      });
      return;
    }

    try {
      await NotesService.updateNote(editingNote.id, {
        title: editFormData.title.trim(),
        content: editFormData.content.trim(),
        subject: editFormData.subject.trim() || null,
        permission_level: editFormData.permission_level
      });

      toast({
        title: "Note Updated",
        description: "Your note has been updated successfully.",
      });

      setEditingNote(null);
      loadNotes(); // Refresh the notes list
    } catch (err) {
      console.error('Error updating note:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to update note. Please try again.';
      
      // Check if it's an authentication error
      if (errorMessage.includes('Authentication required') || errorMessage.includes('session has expired')) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Redirecting to login...",
          variant: "destructive"
        });
        
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
      } else {
        toast({
          title: "Update Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    }
  };

  const handleViewNote = async (note: any) => {
    try {
      // Fetch the full note content for viewing
      const fullNote = await NotesService.getNote(note.id);
      setViewingNote(fullNote);
      setViewDialogOpen(true);
    } catch (err) {
      console.error('Error fetching note for viewing:', err);
      // Fallback to using the note data we have
      setViewingNote(note);
      setViewDialogOpen(true);
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Note title is required.",
        variant: "destructive"
      });
      return;
    }

    try {
      await NotesService.createNote({
        title: newNoteData.title.trim(),
        content: newNoteData.content.trim(),
        subject: newNoteData.subject.trim() || null,
        group_id: newNoteData.group_id || null,
        is_collaborative: true
      });

      toast({
        title: "Note Created",
        description: "Your note has been created successfully.",
      });

      setNewNoteData({
        title: '',
        content: '',
        subject: '',
        group_id: ''
      });
      setIsCreateDialogOpen(false);
      loadNotes(); // Refresh the notes list
    } catch (err) {
      console.error('Error creating note:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to create note. Please try again.';
      
      toast({
        title: "Create Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleDeleteNote = async (note: any) => {
    try {
      await NotesService.deleteNote(note.id);
      
      toast({
        title: "Note Deleted",
        description: "Your note has been permanently deleted.",
      });

      loadNotes(); // Refresh the notes list
    } catch (err) {
      console.error('Error deleting note:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete note. Please try again.';
      
      // Check if it's an authentication error
      if (errorMessage.includes('Authentication required') || errorMessage.includes('session has expired')) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Redirecting to login...",
          variant: "destructive"
        });
        
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
      } else {
        toast({
          title: "Delete Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    }
  };

 
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Study Materials</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Create, share and access notes, flashcards, and documents</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus size={16} className="mr-2" />
            Create Note
          </Button>
          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => setIsUploadPopupOpen(true)}
          >
            <Upload size={16} className="mr-2" />
            Upload Material
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600 dark:text-gray-300">Loading your notes...</span>
        </div>
      ) : (
        <>
          {/* Search and Filter */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search notes, flashcards, documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Filter:</span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-1 border rounded text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
              >
                {subjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject === 'all' ? 'All Subjects' : subject}
                  </option>
                ))}
              </select>
            </div>
          </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <Card 
                key={note.id} 
                className="border-0 shadow-md hover:shadow-xl transition-all duration-200 dark:bg-gray-800 cursor-pointer group"
                onClick={() => handleViewNote(note)}
              >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 flex-1">
                    <div className="flex-1">
                      <CardTitle className="text-lg dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {note.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{note.subject}</p>
                    </div>
                  </div>
                    {note.isMine && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        note.isPrivate ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {note.isPrivate ? 'Private' : 'Public'}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">{note.preview}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">By {note.author}</span>
                      <span className="text-gray-600 dark:text-gray-400">{note.date}</span>
                    </div>
                  </div>
                  
                  {note.isMine && (
                    <div className="mt-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditNote(note);
                        }}
                        className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note);
                        }}
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredNotes.length === 0 && (
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">No materials found</h3>
              <p className="text-gray-600 dark:text-gray-300">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </>
      )}

      <UploadMaterialPopup 
        isOpen={isUploadPopupOpen}
        onClose={() => setIsUploadPopupOpen(false)}
        onUploadSuccess={() => {
          loadNotes(); // Refresh the notes list
          setIsUploadPopupOpen(false);
        }}
      />

      {/* Create Note Dialog with Collaborative Editor Interface */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Note
            </DialogTitle>
            <DialogDescription>
              Create a collaborative note that you can edit and share with your study groups.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-title">Title *</Label>
                <Input
                  id="create-title"
                  value={newNoteData.title}
                  onChange={(e) => setNewNoteData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter note title..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-group">Study Group (Subject)</Label>
                <select
                  id="create-group"
                  value={newNoteData.group_id}
                  onChange={(e) => {
                    const selectedGroup = groups.find(g => g.id === e.target.value);
                    setNewNoteData(prev => ({ 
                      ...prev, 
                      group_id: e.target.value,
                      subject: selectedGroup?.subject || prev.subject
                    }));
                  }}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                >
                  <option value="">Personal Note (No Group)</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name} - {group.subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-content">Content</Label>
              <Textarea
                id="create-content"
                value={newNoteData.content}
                onChange={(e) => setNewNoteData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Start typing your note content... This note will support collaborative editing."
                rows={15}
                className="font-mono"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tip: This note can be edited collaboratively in real-time with your study group members.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewNoteData({
                  title: '',
                  content: '',
                  subject: '',
                  group_id: ''
                });
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleCreateNote}
              disabled={!newNoteData.title.trim()}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Create Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={!!editingNote} onOpenChange={(open) => !open && setEditingNote(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Note
            </DialogTitle>
            <DialogDescription>
              Update your note details and content.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter note title..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-subject">Subject</Label>
              <Input
                id="edit-subject"
                value={editFormData.subject}
                onChange={(e) => setEditFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g., Mathematics, Physics..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={editFormData.content}
                onChange={(e) => setEditFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter your note content..."
                rows={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-permission">Privacy</Label>
              <select
                id="edit-permission"
                value={editFormData.permission_level}
                onChange={(e) => setEditFormData(prev => ({ ...prev, permission_level: e.target.value as 'private' | 'public' | 'group' | 'friends' }))}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                <option value="private">Private (Only You)</option>
                <option value="friends">Friends Only</option>
                <option value="group">Group Members</option>
                <option value="public">Public (Everyone)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingNote(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={!editFormData.title.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Note Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => !open && setViewDialogOpen(false)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {viewingNote?.title}
            </DialogTitle>
            <DialogDescription>
              {viewingNote?.subject && `Subject: ${viewingNote.subject}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* If note has a file URL (PDF, image, etc.), show it */}
            {viewingNote?.file_url && (
              <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
                {viewingNote.file_url.endsWith('.pdf') ? (
                  <iframe
                    src={viewingNote.file_url}
                    className="w-full h-[600px]"
                    title={viewingNote.title}
                  />
                ) : viewingNote.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img 
                    src={viewingNote.file_url} 
                    alt={viewingNote.title}
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                      Preview not available for this file type.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => window.open(viewingNote.file_url, '_blank')}
                    >
                      <Download size={16} className="mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Show text content if available */}
            {viewingNote?.content && viewingNote.content.trim() !== '' && (
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap p-4 bg-white dark:bg-gray-800 rounded-lg border">
                  {viewingNote.content}
                </div>
              </div>
            )}
            
            {/* Show preview if content is not available but preview is */}
            {(!viewingNote?.content || viewingNote.content.trim() === '') && viewingNote?.preview && (
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap p-4 bg-white dark:bg-gray-800 rounded-lg border">
                  {viewingNote.preview}
                </div>
              </div>
            )}
            
            {!viewingNote?.file_url && (!viewingNote?.content || viewingNote.content.trim() === '') && !viewingNote?.preview && (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">No content available for this note yet.</p>
                <p className="text-sm">This might be a newly created note or a file-based note.</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
            >
              Close
            </Button>
            {viewingNote?.file_url && (
              <Button
                onClick={() => window.open(viewingNote.file_url, '_blank')}
              >
                <Download size={16} className="mr-2" />
                Download
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Material Popup */}
      <UploadMaterialPopup 
        isOpen={isUploadPopupOpen} 
        onClose={() => {
          setIsUploadPopupOpen(false);
          // Reload notes after upload
          loadNotes();
        }} 
      />
    </div>
  );
};
