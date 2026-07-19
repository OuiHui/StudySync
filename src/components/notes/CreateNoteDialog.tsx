import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MarkdownEditor } from './MarkdownEditor/index';
import { FilePlus, X } from 'lucide-react';

interface CreateNoteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groupId?: string;
  newNote: {
    title: string;
    content: string;
    subject: string;
    permission_level: 'private' | 'friends' | 'group' | 'public';
  };
  setNewNote: (note: any) => void;
  onCreate: () => void;
}

export const CreateNoteDialog = ({ isOpen, onOpenChange, groupId, newNote, setNewNote, onCreate }: CreateNoteDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full bg-white dark:bg-[#1a1f2c] text-gray-900 dark:text-zinc-100 border border-gray-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-2xl overflow-hidden [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-slate-700/80">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2a78d6]/10 text-[#2a78d6] flex items-center justify-center flex-shrink-0">
              <FilePlus size={18} />
            </div>
            Create New Note
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

        <div className="space-y-4 pt-1.5">
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
              Title <span className="text-red-500 ml-0.5">*</span>
            </Label>
            <Input
              value={newNote.title}
              onChange={(e) => setNewNote((prev: any) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter note title..."
              className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
            />
          </div>
          
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Subject</Label>
            <Input
              value={newNote.subject}
              onChange={(e) => setNewNote((prev: any) => ({ ...prev, subject: e.target.value }))}
              placeholder="e.g., Mathematics, Physics..."
              className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
            />
          </div>
          
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Content</Label>
            <MarkdownEditor value={newNote.content || ''} onChange={(val) => setNewNote((prev: any) => ({ ...prev, content: val }))} placeholder="Write your note content..." />
          </div>
          
          {!groupId && (
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Permission</Label>
              <Select value={newNote.permission_level} onValueChange={(value) => setNewNote((prev: any) => ({ ...prev, permission_level: value }))}>
                <SelectTrigger className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white rounded-lg h-10 focus:ring-[#2a78d6] text-sm font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#1a1f2c] border-gray-200 dark:border-slate-700 text-gray-900 dark:text-zinc-200">
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="friends">Friends Only</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="pt-3 border-t border-gray-200 dark:border-slate-700/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl px-4 h-10 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onCreate}
              disabled={!newNote.title.trim()}
              className="bg-[#2a78d6] hover:bg-[#2268bc] text-white rounded-xl px-5 h-10 text-sm font-semibold disabled:opacity-50 flex items-center justify-center transition-all duration-200"
            >
              Create Note
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

