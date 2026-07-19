import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NotesService, StudyGroupsService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type NoteTab = 'all' | 'mine' | 'shared' | 'public' | 'group';
export type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc';

export interface ColumnFilters {
  name: string;
  subject: string;
  creator: string;
  group: string;
  visibility: string;
}

const initialColumnFilters: ColumnFilters = {
  name: '',
  subject: 'all',
  creator: 'all',
  group: 'all',
  visibility: 'all'
};

export const useNotes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedOwnership, setSelectedOwnership] = useState('all');
  const [activeTab, setActiveTab] = useState<NoteTab>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>(initialColumnFilters);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false);

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
  const [newNoteData, setNewNoteData] = useState({
    title: '',
    content: '',
    subject: '',
    group_id: ''
  });

  const {
    data: notes = [],
    isLoading: loading,
    error: notesQueryError,
    refetch: refetchNotes
  } = useQuery<any[], Error>({
    queryKey: ['notes', 'user', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return (await NotesService.getNotes()) || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: groups = [] } = useQuery<any[], Error>({
    queryKey: ['user-groups', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return (await StudyGroupsService.getUserGroups()) || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const error = notesQueryError ? notesQueryError.message : null;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSubject, activeTab, sortOption, columnFilters, itemsPerPage]);

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['notes'] });
    queryClient.invalidateQueries({ queryKey: ['user-groups'] });
  };

  const displayNotes = useMemo(() => {
    return notes.map(note => {
      const hasPDF = Boolean(note.file_url && note.file_url.toLowerCase().endsWith('.pdf'));
      const hasFile = Boolean(note.file_url && note.file_url.trim() !== '');

      let preview = 'No content preview';
      if (hasPDF) preview = `📄 PDF Document: ${note.file_name || 'Unnamed file'}`;
      else if (hasFile) preview = `📎 Attached file: ${note.file_name || 'File available'}`;
      else if (note.content && note.content.trim() !== '') preview = note.content.substring(0, 100) + '...';

      const isMine = note.created_by === user?.id;
      const creatorName = isMine ? 'You' : (note.profiles?.display_name || 'Shared User');
      const avatarUrl = note.profiles?.avatar_url || null;

      const matchedGroup =
        groups.find(g => g.id === note.group_id) ||
        note.study_group ||
        (note.shared_groups && note.shared_groups[0]?.study_groups);

      const linkedGroup = matchedGroup ? matchedGroup.name : (note.group_id ? 'Study Group' : '—');

      let isPublic = false;
      if (matchedGroup) {
        isPublic = matchedGroup.is_public !== false;
      } else {
        isPublic = note.permission_level === 'public';
      }
      const effectiveVisibility: 'public' | 'private' = isPublic ? 'public' : 'private';

      return {
        id: note.id,
        title: note.title || 'Untitled',
        subject: note.subject || 'General',
        author: creatorName,
        avatarUrl,
        linkedGroup,
        date: new Date(note.created_at || note.updated_at || Date.now()).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        rawDate: note.created_at || note.updated_at || new Date().toISOString(),
        preview,
        isPrivate: effectiveVisibility === 'private',
        effectiveVisibility,
        isMine,
        user_id: note.created_by,
        created_by: note.created_by,
        file_url: note.file_url,
        file_name: note.file_name,
        content: note.content,
        permission_level: note.permission_level || 'private',
        hasPDF,
        hasFile
      };
    });
  }, [notes, user?.id, groups]);

  const subjects = useMemo(() => {
    return ['all', ...Array.from(new Set(displayNotes.map(n => n.subject).filter(Boolean)))];
  }, [displayNotes]);

  const tabCounts = useMemo(() => {
    return {
      all: displayNotes.length,
      mine: displayNotes.filter(n => n.isMine).length,
      shared: displayNotes.filter(n => !n.isMine).length,
      public: displayNotes.filter(n => n.effectiveVisibility === 'public').length,
      group: displayNotes.filter(n => n.linkedGroup && n.linkedGroup !== '—').length
    };
  }, [displayNotes]);

  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm.trim() !== '' ||
      selectedSubject !== 'all' ||
      activeTab !== 'all' ||
      columnFilters.name.trim() !== '' ||
      columnFilters.subject !== 'all' ||
      columnFilters.creator !== 'all' ||
      columnFilters.group !== 'all' ||
      columnFilters.visibility !== 'all'
    );
  }, [searchTerm, selectedSubject, activeTab, columnFilters]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedSubject('all');
    setSelectedOwnership('all');
    setActiveTab('all');
    setColumnFilters(initialColumnFilters);
    setCurrentPage(1);
  };

  const filteredNotes = useMemo(() => {
    return displayNotes.filter(note => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        note.title.toLowerCase().includes(searchLower) ||
        note.subject.toLowerCase().includes(searchLower) ||
        note.author.toLowerCase().includes(searchLower) ||
        note.linkedGroup.toLowerCase().includes(searchLower);

      const matchesSubjectSelect = selectedSubject === 'all' || note.subject === selectedSubject;

      let matchesTab = true;
      if (activeTab === 'mine') matchesTab = note.isMine;
      else if (activeTab === 'shared') matchesTab = !note.isMine;
      else if (activeTab === 'public') matchesTab = note.effectiveVisibility === 'public';
      else if (activeTab === 'group') matchesTab = note.linkedGroup !== '—';

      const matchesColName = !columnFilters.name || note.title.toLowerCase().includes(columnFilters.name.toLowerCase());
      const matchesColSubject = columnFilters.subject === 'all' || note.subject === columnFilters.subject;
      const matchesColCreator =
        columnFilters.creator === 'all' ||
        (columnFilters.creator === 'mine' && note.isMine) ||
        (columnFilters.creator === 'others' && !note.isMine);
      const matchesColGroup =
        columnFilters.group === 'all' ||
        (columnFilters.group === 'linked' && note.linkedGroup !== '—') ||
        (columnFilters.group === 'none' && note.linkedGroup === '—') ||
        note.linkedGroup === columnFilters.group;
      const matchesColVisibility = columnFilters.visibility === 'all' || note.effectiveVisibility === columnFilters.visibility;

      return (
        matchesSearch &&
        matchesSubjectSelect &&
        matchesTab &&
        matchesColName &&
        matchesColSubject &&
        matchesColCreator &&
        matchesColGroup &&
        matchesColVisibility
      );
    });
  }, [displayNotes, searchTerm, selectedSubject, activeTab, columnFilters]);

  const sortedNotes = useMemo(() => {
    const list = [...filteredNotes];
    switch (sortOption) {
      case 'oldest':
        return list.sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());
      case 'title-asc':
        return list.sort((a, b) => a.title.localeCompare(b.title));
      case 'title-desc':
        return list.sort((a, b) => b.title.localeCompare(a.title));
      case 'newest':
      default:
        return list.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
    }
  }, [filteredNotes, sortOption]);

  const totalPages = Math.max(1, Math.ceil(sortedNotes.length / itemsPerPage));
  const paginatedNotes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedNotes.slice(start, start + itemsPerPage);
  }, [sortedNotes, currentPage, itemsPerPage]);

  const updateColumnFilter = (column: keyof ColumnFilters, value: string) => {
    setColumnFilters(prev => ({ ...prev, [column]: value }));
  };

  const handleEditNote = async (note: any) => {
    try {
      const fullNote = await NotesService.getNote(note.id);
      const sharedGroups = (await NotesService.getNoteSharedGroups?.(note.id)) || [];
      const groupIds = sharedGroups.map((sg: any) => sg.group_id);
      setEditingNote(fullNote);
      setEditFormData({
        title: fullNote.title || '',
        content: fullNote.content || '',
        subject: fullNote.subject || '',
        permission_level: fullNote.permission_level || 'private',
        selectedGroups: groupIds
      });
    } catch (err) {
      setEditingNote(note);
      setEditFormData({
        title: note.title || '',
        content: note.preview?.replace('...', '') || '',
        subject: note.subject || '',
        permission_level: note.permission_level || 'private',
        selectedGroups: []
      });
      toast({ title: 'Warning', description: 'Could not fetch full note content.', variant: 'destructive' });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingNote) return;
    if (!editFormData.title.trim()) {
      toast({ title: 'Validation Error', description: 'Note title is required.', variant: 'destructive' });
      return;
    }
    try {
      await NotesService.updateNote(editingNote.id, {
        title: editFormData.title.trim(),
        content: editFormData.content.trim(),
        subject: editFormData.subject.trim() || null,
        permission_level: editFormData.permission_level
      });
      await NotesService.shareNoteWithGroups?.(editingNote.id, editFormData.selectedGroups);
      toast({ title: 'Note Updated', description: 'Your note has been updated successfully.' });
      setEditingNote(null);
      refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update note.';
      if (errorMessage.includes('Authentication required') || errorMessage.includes('session has expired')) {
        toast({ title: 'Session Expired', description: 'Your session has expired. Redirecting...', variant: 'destructive' });
        setTimeout(() => (window.location.href = '/auth'), 2000);
      } else {
        toast({ title: 'Update Failed', description: errorMessage, variant: 'destructive' });
      }
    }
  };

  const handleShareNote = async (note: any) => {
    try {
      const sharedGroups = (await NotesService.getNoteSharedGroups?.(note.id)) || [];
      const groupIds = sharedGroups.map((share: any) => share.group_id);
      setSharingNote(note);
      setShareSelectedGroups(groupIds);
      setShareDialogOpen(true);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load sharing settings', variant: 'destructive' });
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
      toast({ title: 'Sharing Updated', description: `Note is now shared with ${shareSelectedGroups.length} group(s)` });
      setShareDialogOpen(false);
      setSharingNote(null);
      setShareSelectedGroups([]);
      refreshData();
    } catch (err) {
      toast({
        title: 'Sharing Failed',
        description: err instanceof Error ? err.message : 'Failed to update sharing.',
        variant: 'destructive'
      });
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
      toast({ title: 'Validation Error', description: 'Note title is required.', variant: 'destructive' });
      return;
    }
    try {
      const createdNote = await NotesService.createNote({
        title: newNoteData.title.trim(),
        content: newNoteData.content.trim(),
        subject: newNoteData.subject.trim() || null,
        is_collaborative: true
      });
      if (newNoteData.group_id && createdNote?.id) {
        await NotesService.shareNoteWithGroups?.(createdNote.id, [newNoteData.group_id]);
      }
      toast({ title: 'Note Created', description: 'Your note has been created successfully.' });
      setNewNoteData({ title: '', content: '', subject: '', group_id: '' });
      setIsCreateDialogOpen(false);
      refreshData();
    } catch (err) {
      toast({ title: 'Create Failed', description: err instanceof Error ? err.message : 'Failed to create note.', variant: 'destructive' });
    }
  };

  const handleDeleteNote = async (note: any) => {
    try {
      await NotesService.deleteNote(note.id);
      toast({ title: 'Note Deleted', description: 'Your note has been permanently deleted.' });
      refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete note.';
      if (errorMessage.includes('Authentication required') || errorMessage.includes('session has expired')) {
        toast({ title: 'Session Expired', description: 'Your session has expired. Redirecting...', variant: 'destructive' });
        setTimeout(() => (window.location.href = '/auth'), 2000);
      } else {
        toast({ title: 'Delete Failed', description: errorMessage, variant: 'destructive' });
      }
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedSubject,
    setSelectedSubject,
    selectedOwnership,
    setSelectedOwnership,
    activeTab,
    setActiveTab,
    sortOption,
    setSortOption,
    columnFilters,
    updateColumnFilter,
    hasActiveFilters,
    clearAllFilters,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    tabCounts,
    isUploadPopupOpen,
    setIsUploadPopupOpen,
    notes,
    loading,
    error,
    editingNote,
    setEditingNote,
    editFormData,
    setEditFormData,
    sharingNote,
    setSharingNote,
    shareDialogOpen,
    setShareDialogOpen,
    shareSelectedGroups,
    setShareSelectedGroups,
    viewingNote,
    setViewingNote,
    viewDialogOpen,
    setViewDialogOpen,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    groups,
    newNoteData,
    setNewNoteData,
    loadNotes: refetchNotes,
    subjects,
    filteredNotes: sortedNotes,
    paginatedNotes,
    totalNotesCount: sortedNotes.length,
    displayNotes,
    handleEditNote,
    handleSaveEdit,
    handleShareNote,
    handleSaveShare,
    handleViewNote,
    handleCreateNote,
    handleDeleteNote,
    toggleGroupSelection: (groupId: string) =>
      setEditFormData(prev => ({
        ...prev,
        selectedGroups: prev.selectedGroups.includes(groupId)
          ? prev.selectedGroups.filter(id => id !== groupId)
          : [...prev.selectedGroups, groupId]
      })),
    toggleShareGroupSelection: (groupId: string) =>
      setShareSelectedGroups(prev =>
        prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
      )
  };
};
