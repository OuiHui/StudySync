import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { NotesService } from '@/services/database';
import { useToast } from '@/hooks/use-toast';
import { Note } from '@/services/utils';
import { BookOpen, Loader2, ChevronDown, ChevronUp, Plus, Edit2, Save, X } from 'lucide-react';

export const StudyMaterial = () => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Edit fields
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // New Note fields
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      const userNotes = await NotesService.getNotes() as Note[];
      setNotes(userNotes);
    } catch (err) {
      console.error('Error loading notes:', err);
      toast({
        title: 'Error loading notes',
        description: err instanceof Error ? err.message : 'Could not fetch your notes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !activeNote) {
      toast({
        title: "Validation Error",
        description: "Note title is required.",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsSaving(true);
      await NotesService.updateNote(activeNote.id, {
        title: editTitle.trim(),
        subject: editSubject.trim() || null,
        content: editContent.trim(),
      });
      toast({
        title: "Success",
        description: "Note updated successfully.",
      });
      setIsEditing(false);
      const updatedNotes = await NotesService.getNotes() as Note[];
      setNotes(updatedNotes);
      const updated = updatedNotes.find((n: Note) => n.id === activeNote.id);
      if (updated) {
        setActiveNote(updated);
      } else {
        setActiveNote(null);
      }
    } catch (err) {
      console.error('Error saving note:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update note.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newTitle.trim()) {
      toast({
        title: "Validation Error",
        description: "Note title is required.",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsCreatingNote(true);
      await NotesService.createNote({
        title: newTitle.trim(),
        subject: newSubject.trim() || null,
        content: newContent.trim(),
        permission_level: 'private',
      });
      toast({
        title: "Success",
        description: "Note created successfully.",
      });
      setIsCreating(false);
      setNewTitle('');
      setNewSubject('');
      setNewContent('');
      loadNotes();
    } catch (err) {
      console.error('Error creating note:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create note.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingNote(false);
    }
  };

  const groupedNotes = notes.reduce((acc, note: Note) => {
    const subjectName = note.subject?.trim() || 'General';
    if (!acc[subjectName]) {
      acc[subjectName] = [];
    }
    acc[subjectName].push(note);
    return acc;
  }, {} as Record<string, Note[]>);

  return (
    <Card className="border-0 shadow-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="dark:text-white text-lg font-bold">
          {isCreating ? 'Create Note' : activeNote ? (isEditing ? 'Editing Note' : 'Study Note') : 'Study Materials'}
        </CardTitle>
        {!isCreating && !activeNote && (
          <Button
            size="sm"
            onClick={() => setIsCreating(true)}
            className="h-8 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 flex items-center space-x-1"
          >
            <Plus size={14} />
            <span>New Note</span>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : isCreating ? (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                  Title
                </label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter note title..."
                  className="dark:bg-gray-900 dark:border-gray-700 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                  Subject
                </label>
                <Input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Mathematics, History..."
                  className="dark:bg-gray-900 dark:border-gray-700 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                  Content
                </label>
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write your note content here..."
                  rows={8}
                  className="dark:bg-gray-900 dark:border-gray-700 focus-visible:ring-blue-500 font-sans resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setIsCreating(false)} disabled={isCreatingNote}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateNote}
                disabled={isCreatingNote}
                className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600"
              >
                {isCreatingNote ? (
                  <Loader2 size={16} className="animate-spin mr-1.5" />
                ) : (
                  <Save size={16} className="mr-1.5" />
                )}
                Create Note
              </Button>
            </div>
          </div>
        ) : activeNote ? (
          isEditing ? (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                    Title
                  </label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Enter note title..."
                    className="dark:bg-gray-900 dark:border-gray-700 focus-visible:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                    Subject
                  </label>
                  <Input
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    placeholder="e.g. Mathematics, History..."
                    className="dark:bg-gray-900 dark:border-gray-700 focus-visible:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                    Content
                  </label>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Write your note content here..."
                    rows={8}
                    className="dark:bg-gray-900 dark:border-gray-700 focus-visible:ring-blue-500 font-sans resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin mr-1.5" />
                  ) : (
                    <Save size={16} className="mr-1.5" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3 dark:border-gray-700">
                <div className="flex-1 min-w-0 pr-4">
                  <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs">
                    {activeNote.subject || 'General'}
                  </Badge>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white mt-1.5 break-words">
                    {activeNote.title}
                  </h3>
                </div>
                <div className="flex space-x-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Edit2 size={14} className="mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setActiveNote(null)}
                    className="h-8 w-8 p-0"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
              <div className="bg-gray-50/50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800 max-h-[300px] overflow-y-auto whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {activeNote.content || <span className="text-gray-400 italic">No content in this note.</span>}
              </div>
              {activeNote.file_url && (
                <div className="mt-4 border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800">
                  {activeNote.file_url.toLowerCase().endsWith('.pdf') ? (
                    <div className="flex flex-col">
                      <div className="p-3 border-b bg-gray-100/50 dark:bg-gray-800/50 flex justify-between items-center text-xs border-gray-100 dark:border-gray-800">
                        <span className="font-medium truncate text-gray-700 dark:text-gray-300 max-w-[70%]">
                          📄 {activeNote.file_name || 'Attached PDF Document'}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(activeNote.file_url, '_blank')}
                          className="h-7 px-2 text-xs border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          Open in New Tab
                        </Button>
                      </div>
                      <iframe src={activeNote.file_url} className="w-full h-[400px] border-0" title="PDF Viewer" />
                    </div>
                  ) : activeNote.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <div className="p-3 flex flex-col items-center">
                      <img src={activeNote.file_url} className="max-w-full h-auto max-h-[300px] rounded border dark:border-gray-800" alt={activeNote.file_name || 'Attached image'} />
                      <div className="mt-2 w-full flex justify-between items-center text-xs">
                        <span className="font-medium truncate text-gray-700 dark:text-gray-300">
                          📷 {activeNote.file_name || 'Attached Image'}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(activeNote.file_url, '_blank')}
                          className="h-7 px-2 text-xs border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          Open Original Image
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[70%]">
                        📎 {activeNote.file_name || 'Attachment'}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(activeNote.file_url, '_blank')}
                        className="h-7 px-2 text-xs border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        Download File
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        ) : notes.length > 0 ? (
          <div className="space-y-2">
            {Object.keys(groupedNotes).map((subject) => {
              const isExpanded = expandedSubject === subject;
              const subjectNotes = groupedNotes[subject];

              return (
                <div key={subject} className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden transition-all duration-200">
                  <button
                    onClick={() => setExpandedSubject(isExpanded ? null : subject)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-100/70 dark:bg-gray-800/40 dark:hover:bg-gray-800/80 transition-colors text-left"
                  >
                    <span className="font-medium text-sm text-gray-700 dark:text-gray-200">
                      {subject}
                    </span>
                    <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                      <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full font-medium">
                        {subjectNotes.length} {subjectNotes.length === 1 ? 'note' : 'notes'}
                      </span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-800">
                      {subjectNotes.map((note) => (
                        <button
                          key={note.id}
                          onClick={() => {
                            setActiveNote(note);
                            setEditTitle(note.title || '');
                            setEditSubject(note.subject || '');
                            setEditContent(note.content || '');
                            setIsEditing(false);
                          }}
                          className="w-full text-left p-3 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors pl-6"
                        >
                          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {note.title || 'Untitled note'}
                          </h4>
                          {note.content && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                              {note.content}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">No study materials yet</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Create a note to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
