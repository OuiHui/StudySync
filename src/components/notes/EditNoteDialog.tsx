import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, X } from 'lucide-react';
import { CollaborativeNote } from '@/hooks/useCollaborativeNotes';
import { MarkdownEditor } from './MarkdownEditor';
import { MarkdownRenderer } from './MarkdownRenderer';
import { FileViewer } from './FileViewer';

interface EditNoteDialogProps {
  editingNote: CollaborativeNote | null;
  userId?: string;
  onOpenChange: () => void;
  editForm: { title: string; content: string; subject: string };
  setEditForm: (form: any) => void;
  onSave: () => void;
  onCursorChange: (noteId: string, position: number) => void;
}

export const EditNoteDialog = ({
  editingNote,
  userId,
  onOpenChange,
  editForm,
  setEditForm,
  onSave,
  onCursorChange,
}: EditNoteDialogProps) => {
  if (!editingNote) return null;

  const isOwner = userId ? editingNote.created_by === userId : false;
  const hasFile = !!editingNote.file_url;

  return (
    <Dialog open={!!editingNote} onOpenChange={onOpenChange}>
      <DialogContent className={`${hasFile ? 'max-w-4xl' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>
            {hasFile ? (isOwner ? 'Edit PDF Note Details' : 'View PDF Note') : (isOwner ? 'Edit Note' : 'View Note')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {hasFile ? (
            // PDF/File Layout: Only Title, Subject and PDF renderer
            <div className="space-y-6">
              {isOwner ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Title</label>
                    <Input
                      value={editForm.title}
                      onChange={(e) => setEditForm((prev: any) => ({ ...prev, title: e.target.value }))}
                      className="dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Subject</label>
                    <Input
                      value={editForm.subject}
                      onChange={(e) => setEditForm((prev: any) => ({ ...prev, subject: e.target.value }))}
                      className="dark:bg-gray-800"
                    />
                  </div>
                </div>
              ) : (
                <div className="border-b border-gray-150 dark:border-gray-800 pb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{editForm.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Subject: <span className="font-medium text-gray-700 dark:text-gray-300">{editForm.subject || 'General'}</span>
                  </p>
                </div>
              )}

              {editingNote.file_url && (
                <FileViewer fileUrl={editingNote.file_url} title={editingNote.title} />
              )}
            </div>
          ) : (
            // Regular Markdown Layout: Title, Subject and MarkdownEditor/Renderer
            <div className="space-y-6">
              {isOwner ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Title</label>
                    <Input
                      value={editForm.title}
                      onChange={(e) => setEditForm((prev: any) => ({ ...prev, title: e.target.value }))}
                      className="dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Subject</label>
                    <Input
                      value={editForm.subject}
                      onChange={(e) => setEditForm((prev: any) => ({ ...prev, subject: e.target.value }))}
                      className="dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Content</label>
                    <MarkdownEditor
                      value={editForm.content || ''}
                      onChange={(val) => setEditForm((prev: any) => ({ ...prev, content: val }))}
                      onCursorChange={(pos) => onCursorChange(editingNote.id, pos)}
                      placeholder="Write your note content..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-b border-gray-150 dark:border-gray-800 pb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{editForm.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Subject: <span className="font-medium text-gray-700 dark:text-gray-300">{editForm.subject || 'General'}</span>
                    </p>
                  </div>
                  {editForm.content && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Content</h4>
                      <div className="p-4 bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 rounded-lg max-h-[300px] overflow-y-auto">
                        <MarkdownRenderer content={editForm.content} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isOwner ? (
            <div className="flex justify-end space-x-2 border-t pt-4">
              <Button variant="outline" onClick={onOpenChange}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button onClick={onSave} className="bg-blue-500 hover:bg-blue-600 text-white">
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </div>
          ) : (
            <div className="flex justify-end border-t pt-4">
              <Button onClick={onOpenChange} className="bg-blue-500 hover:bg-blue-600 text-white">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
