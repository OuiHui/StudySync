import { useState, useEffect } from 'react';
import { Search, Loader2, FileText, Check, X } from 'lucide-react';
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

        if (groupId) {
          const groupNotes = await NotesService.getGroupNotes(groupId);
          if (groupNotes) {
            groupNotes.forEach((n: any) => {
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
      <DialogContent className="max-w-lg w-full bg-white dark:bg-[#1a1f2c] text-gray-900 dark:text-zinc-100 border border-gray-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden max-h-[85vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-slate-700/80 shrink-0">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2a78d6]/10 text-[#2a78d6] flex items-center justify-center flex-shrink-0">
              <FileText size={18} />
            </div>
            Share Existing Notes
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-zinc-300 transition-colors border border-gray-200 dark:border-slate-700"
            title="Close"
          >
            <X size={18} />
          </button>
        </DialogHeader>

        <div className="flex items-center space-x-2 shrink-0 my-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-slate-500" />
            <Input
              type="text"
              placeholder="Search by title, subject, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 py-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#2a78d6] mb-2" />
              <span className="text-xs text-gray-500 dark:text-zinc-400">Loading your notes...</span>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-zinc-400 text-xs">
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
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex justify-between items-start ${
                        isSelected
                          ? 'border-[#2a78d6] bg-[#2a78d6]/10'
                          : 'border-gray-200 dark:border-slate-700/80 bg-gray-100 dark:bg-[#12151e] hover:border-gray-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center space-x-1.5 mb-1.5 flex-wrap gap-y-1">
                          <Badge variant="outline" className="text-[9px] uppercase font-semibold border-gray-300 dark:border-slate-700">
                            {note.source === 'personal' ? 'Personal' : 'Group'}
                          </Badge>
                          {note.subject && (
                            <Badge variant="secondary" className="text-[9px] py-0 bg-gray-200 dark:bg-slate-800 text-gray-800 dark:text-zinc-300">
                              {note.subject}
                            </Badge>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {note.title}
                        </h4>
                        {note.content && (
                          <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-1 line-clamp-1">
                            {note.content}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="shrink-0 self-center bg-[#2a78d6] text-white rounded-full p-0.5">
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

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-slate-700/80 shrink-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={importing}
            className="bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl px-4 h-10 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={importing || !selectedNoteId}
            className="bg-[#2a78d6] hover:bg-[#2268bc] text-white rounded-xl px-5 h-10 text-sm font-semibold disabled:opacity-50 flex items-center justify-center transition-all duration-200"
          >
            {importing && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Share Note
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

