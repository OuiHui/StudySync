import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NotesService } from '@/services/database';
import { useToast } from '@/hooks/use-toast';
import { Note } from '@/services/utils';
import { BookOpen, Loader2, ChevronDown, ChevronUp, Plus, Save } from 'lucide-react';
import { SharedNoteModal } from '@/components/notes/SharedNoteModal';

export const StudyMaterial = () => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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

  const handleSaveModal = async (noteId: string, updates: { title: string; content: string; subject: string }) => {
    try {
      await NotesService.updateNote(noteId, {
        title: updates.title.trim(),
        subject: updates.subject.trim() || null,
        content: updates.content.trim(),
      });
      setActiveNote((prev) =>
        prev && prev.id === noteId
          ? {
              ...prev,
              title: updates.title.trim(),
              subject: updates.subject.trim() || null,
              content: updates.content.trim(),
            }
          : prev
      );
      toast({
        title: "Success",
        description: "Note updated successfully.",
      });
      await loadNotes();
    } catch (err) {
      console.error('Error saving note:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update note.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteModal = async (noteId: string) => {
    try {
      await NotesService.deleteNote(noteId);
      toast({
        title: "Success",
        description: "Note deleted successfully.",
      });
      setActiveNote(null);
      await loadNotes();
    } catch (err) {
      console.error('Error deleting note:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete note.",
        variant: "destructive",
      });
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
          {isCreating ? 'Create Note' : 'Study Materials'}
        </CardTitle>
        {!isCreating && (
          <Button
            size="sm"
            onClick={() => setIsCreating(true)}
            className="h-8 bg-brand hover:bg-brand-hover text-white font-medium flex items-center space-x-1"
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
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                Title *
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
                Subject (Optional)
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
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsCreating(false)}
                disabled={isCreatingNote}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateNote}
                disabled={isCreatingNote}
                className="bg-brand hover:bg-brand-hover text-white font-medium"
              >
                {isCreatingNote ? (
                  <Loader2 size={16} className="animate-spin mr-1.5" />
                ) : (
                  <Save size={16} className="mr-1.5" />
                )}
                Save Note
              </Button>
            </div>
          </div>
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
                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                      {subject}
                    </span>
                    <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                      <span className="text-xs px-2 py-0.5 bg-gray-200/60 dark:bg-gray-700 rounded-full font-medium">
                        {subjectNotes.length} {subjectNotes.length === 1 ? 'note' : 'notes'}
                      </span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
                      {subjectNotes.map((note) => (
                        <button
                          key={note.id}
                          onClick={() => setActiveNote(note)}
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

      <SharedNoteModal
        note={activeNote}
        isOpen={!!activeNote}
        onClose={() => setActiveNote(null)}
        onSave={handleSaveModal}
        onDelete={handleDeleteModal}
      />
    </Card>
  );
};
