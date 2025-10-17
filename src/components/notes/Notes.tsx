
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
import { CollaborativeNotes } from './CollaborativeNotes';
import { NotesService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const Notes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedOwnership, setSelectedOwnership] = useState('all');
  const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'collaborative' | 'legacy'>('legacy');

  // For legacy view
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit note state
  const [editingNote, setEditingNote] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    content: '',
    subject: ''
  });
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    loadNotes();
  }, [user]);

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
  
  const categories = [
    { id: 'all', label: 'All Materials', count: displayNotes.length },
    { id: 'notes', label: 'Notes', count: displayNotes.filter(n => n.category === 'notes').length },
    { id: 'flashcards', label: 'Flashcards', count: displayNotes.filter(n => n.category === 'flashcards').length },
    { id: 'documents', label: 'Documents', count: displayNotes.filter(n => n.category === 'documents').length },
    { id: 'study-guide', label: 'Study Guides', count: displayNotes.filter(n => n.category === 'study-guide').length },
  ];

  const ownershipOptions = [
    { id: 'all', label: 'All Notes', count: displayNotes.length },
    { id: 'mine', label: 'My Notes', count: displayNotes.filter(n => n.isMine).length },
    { id: 'public', label: 'Public Notes', count: displayNotes.filter(n => !n.isMine).length },
  ];

  const filteredNotes = displayNotes.filter(note => {
    const matchesSearch = (note.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (note.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
    const matchesSubject = selectedSubject === 'all' || note.subject === selectedSubject;
    const matchesOwnership = selectedOwnership === 'all' || 
                           (selectedOwnership === 'mine' && note.isMine) ||
                           (selectedOwnership === 'public' && !note.isMine);
    return matchesSearch && matchesCategory && matchesSubject && matchesOwnership;
  });

  const handleEditNote = async (note: any) => {
    try {
      // Fetch the full note content for editing
      const fullNote = await NotesService.getNote(note.id);
      setEditingNote(fullNote);
      setEditFormData({
        title: fullNote.title || '',
        content: fullNote.content || '',
        subject: fullNote.subject || ''
      });
    } catch (err) {
      console.error('Error fetching note for editing:', err);
      // Fallback to using the truncated data
      setEditingNote(note);
      setEditFormData({
        title: note.title || '',
        content: note.preview?.replace('...', '') || '',
        subject: note.subject || ''
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
        subject: editFormData.subject.trim() || null
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

  const handleDeleteNote = (note: any) => {
    setNoteToDelete(note);
    setShowDeleteConfirm(true);
    setDeleteConfirm('');
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete || deleteConfirm !== noteToDelete.title) return;

    try {
      await NotesService.deleteNote(noteToDelete.id);
      
      toast({
        title: "Note Deleted",
        description: "Your note has been permanently deleted.",
      });

      setShowDeleteConfirm(false);
      setNoteToDelete(null);
      setDeleteConfirm('');
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'notes':
        return '📝';
      case 'flashcards':
        return '🗂️';
      case 'documents':
        return '📄';
      case 'study-guide':
        return '📚';
      default:
        return '📋';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'notes':
        return 'bg-blue-100 text-blue-800';
      case 'flashcards':
        return 'bg-green-100 text-green-800';
      case 'documents':
        return 'bg-purple-100 text-purple-800';
      case 'study-guide':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Study Materials</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Share and access notes, flashcards, and documents</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-1">
            <Button
              variant={viewMode === 'collaborative' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('collaborative')}
            >
              Real-time Notes
            </Button>
            <Button
              variant={viewMode === 'legacy' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('legacy')}
            >
              Legacy View
            </Button>
          </div>
          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => setIsUploadPopupOpen(true)}
          >
            <Plus size={16} className="mr-2" />
            Upload Material
          </Button>
        </div>
      </div>

      {/* Show collaborative notes by default */}
      {viewMode === 'collaborative' ? (
        <CollaborativeNotes />
      ) : (
        <>
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="space-y-4">
          {/* Ownership Filter */}
          <Card className="border-0 shadow-md dark:bg-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg dark:text-white">Ownership</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ownershipOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedOwnership(option.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      selectedOwnership === option.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="font-medium">{option.label}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      selectedOwnership === option.id
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                    }`}>
                      {option.count}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md dark:bg-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg dark:text-white">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="font-medium">{category.label}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      selectedCategory === category.id
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                    }`}>
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md dark:bg-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg dark:text-white">Recent Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center text-gray-500">
                  <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Upload your first material to get started!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredNotes.map((note) => (
              <Card key={note.id} className="border-0 shadow-md hover:shadow-lg transition-all duration-200 dark:bg-gray-800">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getCategoryIcon(note.category)}</span>
                      <div>
                        <CardTitle className="text-lg dark:text-gray-100">{note.title}</CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{note.subject}</p>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(note.category)}`}>
                        {note.category.replace('-', ' ')}
                      </span>
                      {note.isMine && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          note.isPrivate ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {note.isPrivate ? 'Private' : 'Public'}
                        </span>
                      )}
                      {!note.isMine && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          Public
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{note.preview}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">By {note.author}</span>
                      <span className="text-gray-600 dark:text-gray-400">{note.date}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Group: {note.group}</span>
                      <span className="text-gray-600 dark:text-gray-400">{note.downloads} downloads</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download size={14} className="mr-1" />
                      Download
                    </Button>
                    <Button size="sm" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
                      <Share size={14} className="mr-1" />
                      Share
                    </Button>
                    {note.isMine && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditNote(note)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteNote(note)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </>
                    )}
                  </div>
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
        </div>
      </div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center p-6">
            <Card className="border-red-200 bg-red-50 dark:bg-red-900 dark:border-red-800 w-full shadow-xl">
              <CardHeader>
                <CardTitle className="text-red-800 dark:text-red-300 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Delete Note
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-red-700 dark:text-red-300">
                  This action cannot be undone. This will permanently delete your note:
                </p>
                <div className="p-3 bg-red-100 dark:bg-red-800/30 rounded-lg">
                  <p className="font-medium text-red-800 dark:text-red-200">
                    "{noteToDelete?.title}"
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deleteConfirm" className="text-red-800 dark:text-red-300">
                    Type the note title <strong>{noteToDelete?.title}</strong> to confirm:
                  </Label>
                  <Input
                    id="deleteConfirm"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder={noteToDelete?.title}
                    className="border-red-300 focus:border-red-500 dark:border-red-700 dark:focus:border-red-500"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={confirmDeleteNote}
                    disabled={deleteConfirm !== noteToDelete?.title}
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Note Permanently
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setNoteToDelete(null);
                      setDeleteConfirm('');
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
        </>
      )}

      {/* Upload Material Popup */}
      <UploadMaterialPopup 
        isOpen={isUploadPopupOpen} 
        onClose={() => setIsUploadPopupOpen(false)} 
      />
    </div>
  );
};
