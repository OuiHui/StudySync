import { Dialog } from '@/components/ui/dialog';
import { StandardDialogContent, ModalHeader, FormLabel, ModalFooter } from '@/components/ui/modal-primitives';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MarkdownEditor } from './MarkdownEditor/index';
import { FilePlus } from 'lucide-react';

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
      <StandardDialogContent size="xl">
        <ModalHeader title="Create New Note" icon={<FilePlus size={18} />} onClose={() => onOpenChange(false)} />

        <div className="space-y-3.5 pt-1.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <FormLabel required>
                Title
              </FormLabel>
              <Input
                value={newNote.title}
                onChange={(e) => setNewNote((prev: any) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter note title..."
                className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground rounded-xl h-10 focus-visible:ring-brand focus-visible:border-brand text-sm font-semibold"
              />
            </div>
            
            <div className="space-y-1">
              <FormLabel>Subject</FormLabel>
              <Input
                value={newNote.subject}
                onChange={(e) => setNewNote((prev: any) => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g., Mathematics, Physics..."
                className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground rounded-xl h-10 focus-visible:ring-brand focus-visible:border-brand text-sm font-semibold"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <FormLabel>Content</FormLabel>
            <MarkdownEditor value={newNote.content || ''} onChange={(val) => setNewNote((prev: any) => ({ ...prev, content: val }))} placeholder="Write your note content..." minHeight="200px" />
          </div>
          
          {!groupId && (
            <div className="space-y-1">
              <FormLabel>Permission</FormLabel>
              <Select value={newNote.permission_level} onValueChange={(value) => setNewNote((prev: any) => ({ ...prev, permission_level: value }))}>
                <SelectTrigger className="bg-muted/40 border border-border text-foreground rounded-xl h-10 focus:ring-2 focus:ring-brand text-sm font-semibold transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-card-foreground shadow-2xl backdrop-blur-md rounded-xl z-50">
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="friends">Friends Only</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <ModalFooter onCancel={() => onOpenChange(false)}>
            <button
              type="button"
              onClick={onCreate}
              disabled={!newNote.title.trim()}
              className="bg-brand hover:bg-brand-hover text-primary-foreground rounded-xl px-5 h-10 text-sm font-semibold disabled:opacity-50 flex items-center justify-center transition-all duration-200"
            >
              Create Note
            </button>
          </ModalFooter>
        </div>
      </StandardDialogContent>
    </Dialog>
  );
};


