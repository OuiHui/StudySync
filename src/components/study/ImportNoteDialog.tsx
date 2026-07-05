import { useState, useEffect } from 'react';
import { Search, Loader2, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NotesService } from '@/services/database';

interface SimpleNote {
  id: string;
  title: string;
  content: string | null;
  subject?: string | null;
  source: 'personal' | 'group';
}

interface ImportNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (note: { title: string; content: string; subject?: string }) => Promise<void>;
  groupId?: string;
  excludeNoteTitles?: string[];
}

export const ImportNoteDialog = ({
  open,
  onOpenChange,
  onImport,
  groupId,
  excludeNoteTitles = []
}: ImportNoteDialogProps) => {
  const [notes, setNotes] = useState<SimpleNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!open) return;

    const loadImportableNotes = async () => {
      setLoading(true);
      try {
        const fetchedNotes: SimpleNote[] = [];

        // 1. Fetch personal notes
        const personal = await NotesService.getNotes();
        if (personal) {
          personal.forEach((n: any) => {
            fetchedNotes.push({
              id: n.id,
              title: n.title,
              content: n.content,
              subject: n.subject,
              source: 'personal'
            });
          });
        }

        // 2. Fetch group notes if groupId is present
        if (groupId) {
          const groupNotes = await NotesService.getGroupNotes(groupId);
          if (groupNotes) {
            groupNotes.forEach((n: any) => {
              // Avoid duplicate IDs if already added from personal
              if (!fetchedNotes.some(fn => fn.id === n.id)) {
                fetchedNotes.push({
                  id: n.id,
                  title: n.title,
                  content: n.content,
                  subject: n.subject,
                  source: 'group'
                });
              }
            });
          }
        }

        // Filter out notes already imported in the session by title
        const filtered = fetchedNotes.filter(
          n => !excludeNoteTitles.includes(n.title)
        );

        setNotes(filtered);
      } catch (err) {
        console.error('Failed to fetch importable notes:', err);
      } finally {
        setLoading(false);
      }
    };

    loadImportableNotes();
    setSelectedNoteId(null);
    setSearchQuery('');
  }, [open, groupId, excludeNoteTitles]);

  const handleShare = async () => {
    if (!selectedNoteId) return;
    const note = notes.find(n => n.id === selectedNoteId);
    if (!note) return;

    setImporting(true);
    try {
      await onImport({
        title: note.title,
        content: note.content || '',
        subject: note.subject || undefined
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to import note:', err);
    } finally {
      setImporting(false);
    }
  };

  const filteredNotes = notes.filter(n => {
    const query = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(query) ||
      (n.subject || '').toLowerCase().includes(query) ||
      (n.content || '').toLowerCase().includes(query)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] max-h-[85vh] flex flex-col bg-white dark:bg-gray-900 border dark:border-gray-800">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-gray-900 dark:text-white flex items-center">
            <FileText className="mr-2 text-indigo-500" size={18} />
            Share Existing Notes
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center space-x-2 shrink-0 my-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="text"
              placeholder="Search by title, subject, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs dark:bg-gray-950 dark:border-gray-800"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 py-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mb-2" />
              <span className="text-xs text-gray-500">Loading your notes...</span>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs">
              {searchQuery ? 'No matching notes found.' : 'No study notes available to share.'}
            </div>
          ) : (
            <ScrollArea className="h-[250px] pr-2">
              <div className="space-y-2">
                {filteredNotes.map((note) => {
                  const isSelected = selectedNoteId === note.id;
                  return (
                    <div
                      key={note.id}
                      onClick={() => setSelectedNoteId(note.id)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex justify-between items-start ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20'
                          : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center space-x-1.5 mb-1.5 flex-wrap gap-y-1">
                          <Badge variant="outline" className="text-[9px] uppercase font-semibold">
                            {note.source === 'personal' ? 'Personal' : 'Group'}
                          </Badge>
                          {note.subject && (
                            <Badge variant="secondary" className="text-[9px] py-0">
                              {note.subject}
                            </Badge>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {note.title}
                        </h4>
                        {note.content && (
                          <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">
                            {note.content}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="shrink-0 self-center bg-indigo-500 text-white rounded-full p-0.5">
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-3 border-t dark:border-gray-800 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={importing}
            className="text-xs h-8"
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={importing || !selectedNoteId}
            size="sm"
            className="text-xs h-8 bg-indigo-650 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700"
          >
            {importing && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
            Share Note
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
