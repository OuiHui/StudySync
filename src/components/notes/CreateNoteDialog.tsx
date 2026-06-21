import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input value={newNote.title} onChange={(e) => setNewNote((prev: any) => ({ ...prev, title: e.target.value }))} placeholder="Enter note title..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Subject</label>
            <Input value={newNote.subject} onChange={(e) => setNewNote((prev: any) => ({ ...prev, subject: e.target.value }))} placeholder="e.g., Mathematics, Physics..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <Textarea value={newNote.content} onChange={(e) => setNewNote((prev: any) => ({ ...prev, content: e.target.value }))} placeholder="Write your note content..." className="min-h-[200px]" />
          </div>
          {!groupId && (
            <div>
              <label className="block text-sm font-medium mb-2">Permission</label>
              <Select value={newNote.permission_level} onValueChange={(value) => setNewNote((prev: any) => ({ ...prev, permission_level: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="friends">Friends Only</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={onCreate}>Create Note</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
