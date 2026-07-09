import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, X } from 'lucide-react';
import { CollaborativeNote } from '@/hooks/useCollaborativeNotes';
import { MarkdownEditor } from './MarkdownEditor';

interface EditNoteDialogProps {
  editingNote: CollaborativeNote | null;
  onOpenChange: () => void;
  editForm: { title: string; content: string; subject: string };
  setEditForm: (form: any) => void;
  onSave: () => void;
  onCursorChange: (noteId: string, position: number) => void;
}

export const EditNoteDialog = ({ editingNote, onOpenChange, editForm, setEditForm, onSave, onCursorChange }: EditNoteDialogProps) => {

  if (!editingNote) return null;

  return (
    <Dialog open={!!editingNote} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input value={editForm.title} onChange={(e) => setEditForm((prev: any) => ({ ...prev, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Subject</label>
            <Input value={editForm.subject} onChange={(e) => setEditForm((prev: any) => ({ ...prev, subject: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <MarkdownEditor
              value={editForm.content || ''}
              onChange={(val) => setEditForm((prev: any) => ({ ...prev, content: val }))}
              onCursorChange={(pos) => onCursorChange(editingNote.id, pos)}
              placeholder="Write your note content..."
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onOpenChange}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button onClick={onSave}>
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
