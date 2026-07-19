import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save, X, Edit2, Trash2, Eye } from 'lucide-react';
import { MarkdownEditor } from './MarkdownEditor/index';
import { MarkdownRenderer } from './MarkdownRenderer';
import { FileViewer } from './FileViewer';

export interface SharedNoteData {
  id: string;
  title: string;
  content?: string | null;
  subject?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  created_by: string;
  permission_level?: string;
  created_at?: string;
  updated_at?: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface SharedNoteModalProps {
  note: SharedNoteData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (noteId: string, updates: { title: string; content: string; subject: string; permission_level?: string }) => Promise<void> | void;
  onDelete?: (noteId: string) => Promise<void> | void;
  onCursorChange?: (noteId: string, position: number) => void;
  currentUserId?: string;
  readOnly?: boolean;
}

export const SharedNoteModal = ({
  note,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onCursorChange,
  currentUserId,
  readOnly = false,
}: SharedNoteModalProps) => {
  if (!note) return null;

  const isOwner = currentUserId ? note.created_by === currentUserId : true;
  const canEdit = !readOnly && isOwner;
  const hasFile = !!note.file_url;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState({
    title: note.title || '',
    subject: note.subject || '',
    content: note.content || '',
    permission_level: note.permission_level || 'private',
  });

  useEffect(() => {
    if (note) {
      setForm({
        title: note.title || '',
        subject: note.subject || '',
        content: note.content || '',
        permission_level: note.permission_level || 'private',
      });
      setIsEditing(false);
    }
  }, [note]);

  const handleSave = async () => {
    if (!onSave || !form.title.trim()) return;
    try {
      setIsSaving(true);
      await onSave(note.id, form);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    try {
      setIsDeleting(true);
      await onDelete(note.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete note:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`${hasFile ? 'max-w-4xl' : 'max-w-3xl'} max-h-[90vh] overflow-y-auto flex flex-col`}>
        <DialogHeader className="shrink-0 pb-2 border-b dark:border-gray-800">
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {hasFile
                ? isEditing
                  ? 'Edit PDF Note Details'
                  : 'View PDF Note'
                : isEditing
                ? 'Edit Note'
                : 'View Note'}
            </DialogTitle>
            {note.subject && (
              <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {note.subject}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4 flex-1 overflow-y-auto">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Title *
                  </label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="dark:bg-gray-800"
                    placeholder="Note title..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Subject
                  </label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                    className="dark:bg-gray-800"
                    placeholder="e.g. Computer Science"
                  />
                </div>
              </div>

              {!hasFile && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Content
                  </label>
                  <MarkdownEditor
                    value={form.content}
                    onChange={(val) => setForm((prev) => ({ ...prev, content: val }))}
                    onCursorChange={(pos) => onCursorChange?.(note.id, pos)}
                    placeholder="Write your markdown note here..."
                  />
                </div>
              )}

              {hasFile && (
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Attachment Preview
                  </label>
                  <FileViewer fileUrl={note.file_url!} title={form.title} />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                  {note.title}
                </h2>
                {note.profiles?.display_name && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    By <span className="font-medium text-gray-700 dark:text-gray-300">{note.profiles.display_name}</span>
                  </p>
                )}
              </div>

              {hasFile && (
                <div className="my-2">
                  <FileViewer fileUrl={note.file_url!} title={note.title} />
                </div>
              )}

              {note.content && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Content
                  </h4>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg max-h-[500px] overflow-y-auto">
                    <MarkdownRenderer content={note.content} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4 shrink-0">
          <div>
            {onDelete && canEdit && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-xs"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {canEdit && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-xs"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Note
              </Button>
            )}

            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="text-xs"
                >
                  <X className="w-3.5 h-3.5 mr-1" /> Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !form.title.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                >
                  <Save className="w-3.5 h-3.5 mr-1" /> Save Changes
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={onClose}
                className="text-xs"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
