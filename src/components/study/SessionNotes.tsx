import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Loader2, ChevronDown, ChevronUp, Plus, Save, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ImportNoteDialog } from './ImportNoteDialog';
import { SharedNoteModal } from '@/components/notes/SharedNoteModal';
import { NotesService } from '@/services/database';

export interface NoteItem {
  id: string;
  title: string;
  content: string | null;
  subject?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  created_at: string;
  created_by: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface SessionNotesProps {
  notes: NoteItem[];
  loading?: boolean;
  currentUserId?: string;
  isHost: boolean;
  groupId?: string;
  onAddNote?: (title: string, content: string, subject?: string) => Promise<void>;
  onDeleteNote?: (noteId: string) => Promise<void>;
  onNotesChange?: () => void;
}

export const SessionNotes = ({
  notes,
  loading = false,
  currentUserId,
  isHost,
  groupId,
  onAddNote,
  onDeleteNote,
  onNotesChange
}: SessionNotesProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [activeNote, setActiveNote] = useState<NoteItem | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // New Note fields
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Collapsed subjects tracking
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    try {
      if (onAddNote) {
        await onAddNote(newTitle.trim(), newContent.trim(), newSubject.trim() || undefined);
        setNewTitle('');
        setNewSubject('');
        setNewContent('');
        setIsCreating(false);
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNoteSelect = (note: NoteItem) => {
    setActiveNote(note);
    setIsCreating(false);
  };

  const handleDelete = async (noteId: string) => {
    try {
      if (onDeleteNote) {
        await onDeleteNote(noteId);
        if (activeNote?.id === noteId) {
          setActiveNote(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleSaveNote = async (noteId: string, updates: { title: string; content: string; subject: string }) => {
    try {
      await NotesService.updateNote(noteId, {
        title: updates.title,
        content: updates.content,
        subject: updates.subject || null,
      });
      setActiveNote((prev) =>
        prev && prev.id === noteId
          ? {
              ...prev,
              title: updates.title,
              content: updates.content,
              subject: updates.subject || null,
            }
          : prev
      );
      if (onNotesChange) {
        onNotesChange();
      }
    } catch (err) {
      console.error('Failed to update note:', err);
    }
  };

  const handleImportSelect = async (importedNote: { title: string; content: string; subject?: string }) => {
    if (onAddNote) {
      await onAddNote(importedNote.title, importedNote.content, importedNote.subject);
    }
  };

  const groupedNotes = notes.reduce((acc, note) => {
    const subjectName = note.subject?.trim() || 'General';
    if (!acc[subjectName]) {
      acc[subjectName] = [];
    }
    acc[subjectName].push(note);
    return acc;
  }, {} as Record<string, NoteItem[]>);

  const excludeNoteTitles = notes.map(n => n.title);

  return (
    <Card className="border-0 shadow-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex flex-col">
      <CardHeader className="py-3 shrink-0 flex flex-row flex-wrap items-center justify-between gap-2 border-b dark:border-gray-700/50">
        <CardTitle className="text-sm font-semibold flex items-center text-gray-800 dark:text-white">
          <BookOpen size={16} className="mr-2 text-indigo-500" />
          {isCreating ? 'Create Shared Note' : 'Shared Study Materials'}
        </CardTitle>
        {!isCreating && (
          <div className="flex items-center space-x-1.5 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setImportOpen(true)}
              className="h-7 text-xs flex items-center space-x-1"
            >
              <FileText size={13} />
              <span>Add Existing</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreating(true)}
              className="h-7 text-xs bg-brand hover:bg-brand-hover text-white flex items-center space-x-1"
            >
              <Plus size={13} />
              <span>New Note</span>
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-3 flex flex-col flex-1 min-h-0 justify-between">
        {loading ? (
          <div className="flex items-center justify-center flex-1 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : isCreating ? (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 space-y-3 justify-between">
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">
                  Title *
                </label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter note title..."
                  className="h-7 text-xs dark:bg-gray-900"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">
                  Subject
                </label>
                <Input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Mathematics, Physics..."
                  className="h-7 text-xs dark:bg-gray-900"
                />
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">
                  Content
                </label>
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write your note content here..."
                  className="text-xs flex-1 resize-none min-h-[60px] dark:bg-gray-900 font-sans"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2 border-t dark:border-gray-700 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setIsCreating(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || !newTitle.trim()}
                className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
              >
                {submitting ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Save size={12} className="mr-1" />
                )}
                Share Note
              </Button>
            </div>
          </form>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center py-6">
            <BookOpen size={30} className="text-gray-400 mb-1.5" />
            <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">No shared study materials yet</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">Click "New Note" or "Add Existing" to share a note</p>
          </div>
        ) : (
          <ScrollArea className="h-[250px] pr-1">
            <div className="space-y-1.5">
              {Object.keys(groupedNotes).map((subject) => {
                const isExpanded = expandedSubject === subject;
                const subjectNotes = groupedNotes[subject];

                return (
                  <div
                    key={subject}
                    className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setExpandedSubject(isExpanded ? null : subject)}
                      className="w-full flex items-center justify-between p-2.5 bg-gray-50/50 hover:bg-gray-100/70 dark:bg-gray-800/30 dark:hover:bg-gray-800/50 transition-colors text-left"
                    >
                      <span className="font-semibold text-xs text-gray-700 dark:text-gray-200">
                        {subject}
                      </span>
                      <div className="flex items-center space-x-1.5 text-gray-500 dark:text-gray-400">
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-200/50 dark:bg-gray-700 rounded-full font-medium">
                          {subjectNotes.length} {subjectNotes.length === 1 ? 'note' : 'notes'}
                        </span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
                        {subjectNotes.map((note) => (
                          <button
                            key={note.id}
                            onClick={() => handleNoteSelect(note)}
                            className="w-full text-left p-2 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition-colors pl-4"
                          >
                            <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                              {note.title || 'Untitled note'}
                            </h4>
                            {note.content && (
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
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
          </ScrollArea>
        )}
      </CardContent>

      <ImportNoteDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImportSelect}
        groupId={groupId}
        excludeNoteTitles={excludeNoteTitles}
      />

      <SharedNoteModal
        note={activeNote}
        isOpen={!!activeNote}
        onClose={() => setActiveNote(null)}
        onSave={handleSaveNote}
        onDelete={handleDelete}
        currentUserId={currentUserId}
      />
    </Card>
  );
};
