import { useState, useEffect } from 'react';
import { NotesService, StudyGroupsService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useNotes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedOwnership, setSelectedOwnership] = useState('all');
  const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false);

  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [editingNote, setEditingNote] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    content: '',
    subject: '',
    permission_level: 'private' as 'private' | 'public' | 'group' | 'friends',
    selectedGroups: [] as string[]
  });
  
  const [sharingNote, setSharingNote] = useState<any | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareSelectedGroups, setShareSelectedGroups] = useState<string[]>([]);
  
  const [viewingNote, setViewingNote] = useState<any | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
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
      if (errorMessage.includes('Authentication required') || errorMessage.includes('session has expired')) {
        setError('Your session has expired. Please log in again.');
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

  const displayNotes = notes.map(note => {
    const hasPDF = note.file_url && note.file_url.toLowerCase().endsWith('.pdf');
    const hasFile = note.file_url && note.file_url.trim() !== '';
    let preview = 'No content preview';
    if (hasPDF) preview = `📄 PDF Document: ${note.file_name || 'Unnamed file'}`;
    else if (hasFile) preview = `📎 Attached file: ${note.file_name || 'File available'}`;
    else if (note.content && note.content.trim() !== '') preview = note.content.substring(0, 100) + '...';
    
    const isMine = note.created_by === user?.id;
    return {
      id: note.id,
      title: note.title || 'Untitled',
      subject: note.subject || 'General',
      author: isMine ? 'You' : 'Shared User',
      sharedBy: isMine ? 'me' : 'Shared User',
      date: new Date(note.created_at).toLocaleDateString(),
      downloads: 0,
      category: 'notes',
      group: note.group_id ? 'Group Note' : 'Personal',
      preview,
      isPrivate: note.permission_level === 'private',
      isMine,
      user_id: note.created_by,
      created_by: note.created_by,
      file_url: note.file_url,
      file_name: note.file_name,
      content: note.content,
      permission_level: note.permission_level,
      hasPDF,
      hasFile
    };
  });

  const subjects = ['all', ...Array.from(new Set(displayNotes.map(note => note.subject || 'Unknown')))];
  
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
      const fullNote = await NotesService.getNote(note.id);
      const sharedGroups = await NotesService.getNoteSharedGroups?.(note.id) || [];
      const groupIds = sharedGroups.map((sg: any) => sg.group_id);
      setEditingNote(fullNote);
      setEditFormData({
        title: fullNote.title || '', content: fullNote.content || '', subject: fullNote.subject || '',
        permission_level: fullNote.permission_level || 'private', selectedGroups: groupIds
      });
    } catch (err) {
      setEditingNote(note);
      setEditFormData({
        title: note.title || '', content: note.preview?.replace('...', '') || '', subject: note.subject || '',
        permission_level: note.permission_level || 'private', selectedGroups: []
      });
      toast({ title: "Warning", description: "Could not fetch full note content.", variant: "destructive" });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingNote) return;
    if (!editFormData.title.trim()) {
      toast({ title: "Validation Error", description: "Note title is required.", variant: "destructive" });
      return;
    }
    try {
      await NotesService.updateNote(editingNote.id, {
        title: editFormData.title.trim(), content: editFormData.content.trim(),
        subject: editFormData.subject.trim() || null, permission_level: editFormData.permission_level
      });
      await NotesService.shareNoteWithGroups?.(editingNote.id, editFormData.selectedGroups);
      toast({ title: "Note Updated", description: "Your note has been updated successfully." });
      setEditingNote(null);
      loadNotes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update note.';
      if (errorMessage.includes('Authentication required') || errorMessage.includes('session has expired')) {
        toast({ title: "Session Expired", description: "Your session has expired. Redirecting...", variant: "destructive" });
        setTimeout(() => window.location.href = '/auth', 2000);
      } else {
        toast({ title: "Update Failed", description: errorMessage, variant: "destructive" });
      }
    }
  };

  const handleShareNote = async (note: any) => {
    try {
      const sharedGroups = await NotesService.getNoteSharedGroups?.(note.id) || [];
      const groupIds = sharedGroups.map((share: any) => share.group_id);
      setSharingNote(note);
      setShareSelectedGroups(groupIds);
      setShareDialogOpen(true);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load sharing settings", variant: "destructive" });
    }
  };

  const handleSaveShare = async () => {
    if (!sharingNote) return;
    try {
      await NotesService.shareNoteWithGroups?.(sharingNote.id, shareSelectedGroups);
      if (shareSelectedGroups.length > 0 && sharingNote.permission_level !== 'group') {
        await NotesService.updateNote(sharingNote.id, { permission_level: 'group' });
      } else if (shareSelectedGroups.length === 0 && sharingNote.permission_level === 'group') {
        await NotesService.updateNote(sharingNote.id, { permission_level: 'private' });
      }
      toast({ title: "Sharing Updated", description: `Note is now shared with ${shareSelectedGroups.length} group(s)` });
      setShareDialogOpen(false);
      setSharingNote(null);
      setShareSelectedGroups([]);
      loadNotes();
    } catch (err) {
      toast({ title: "Sharing Failed", description: err instanceof Error ? err.message : 'Failed to update sharing.', variant: "destructive" });
    }
  };

  const handleViewNote = async (note: any) => {
    try {
      const fullNote = await NotesService.getNote(note.id);
      setViewingNote(fullNote);
      setViewDialogOpen(true);
    } catch (err) {
      setViewingNote(note);
      setViewDialogOpen(true);
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteData.title.trim()) {
      toast({ title: "Validation Error", description: "Note title is required.", variant: "destructive" });
      return;
    }
    try {
      await NotesService.createNote({
        title: newNoteData.title.trim(), content: newNoteData.content.trim(),
        subject: newNoteData.subject.trim() || null, group_id: newNoteData.group_id || null, is_collaborative: true
      });
      toast({ title: "Note Created", description: "Your note has been created successfully." });
      setNewNoteData({ title: '', content: '', subject: '', group_id: '' });
      setIsCreateDialogOpen(false);
      loadNotes();
    } catch (err) {
      toast({ title: "Create Failed", description: err instanceof Error ? err.message : 'Failed to create note.', variant: "destructive" });
    }
  };

  const handleDeleteNote = async (note: any) => {
    try {
      await NotesService.deleteNote(note.id);
      toast({ title: "Note Deleted", description: "Your note has been permanently deleted." });
      loadNotes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete note.';
      if (errorMessage.includes('Authentication required') || errorMessage.includes('session has expired')) {
        toast({ title: "Session Expired", description: "Your session has expired. Redirecting...", variant: "destructive" });
        setTimeout(() => window.location.href = '/auth', 2000);
      } else {
        toast({ title: "Delete Failed", description: errorMessage, variant: "destructive" });
      }
    }
  };

  return {
    searchTerm, setSearchTerm, selectedSubject, setSelectedSubject,
    selectedOwnership, setSelectedOwnership, isUploadPopupOpen, setIsUploadPopupOpen,
    notes, loading, error, editingNote, setEditingNote, editFormData, setEditFormData,
    sharingNote, setSharingNote, shareDialogOpen, setShareDialogOpen, shareSelectedGroups, setShareSelectedGroups,
    viewingNote, setViewingNote, viewDialogOpen, setViewDialogOpen, isCreateDialogOpen, setIsCreateDialogOpen,
    groups, newNoteData, setNewNoteData, loadNotes, subjects, filteredNotes, displayNotes,
    handleEditNote, handleSaveEdit, handleShareNote, handleSaveShare, handleViewNote, handleCreateNote, handleDeleteNote,
    toggleGroupSelection: (groupId: string) => setEditFormData(prev => ({ ...prev, selectedGroups: prev.selectedGroups.includes(groupId) ? prev.selectedGroups.filter(id => id !== groupId) : [...prev.selectedGroups, groupId] })),
    toggleShareGroupSelection: (groupId: string) => setShareSelectedGroups(prev => prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId])
  };
};
