import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, X, Edit2, Trash2, FileText } from 'lucide-react';
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

  const handleStartEdit = () => {
    if (note) {
      setForm({
        title: note.title || '',
        subject: note.subject || '',
        content: note.content || '',
        permission_level: note.permission_level || 'private',
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (note) {
      setForm({
        title: note.title || '',
        subject: note.subject || '',
        content: note.content || '',
        permission_level: note.permission_level || 'private',
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!onSave || !form.title.trim()) return;
    try {
      setIsSaving(true);
      await onSave(note.id, form);
      note.title = form.title;
      note.content = form.content;
      note.subject = form.subject;
      note.permission_level = form.permission_level;
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
      <DialogContent className={`${hasFile ? 'max-w-4xl' : 'max-w-3xl'} max-h-[90vh] overflow-y-auto flex flex-col w-full bg-white dark:bg-[#1a1f2c] text-gray-900 dark:text-zinc-100 border border-gray-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-2xl [&>button]:hidden`}>
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-slate-700/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2a78d6]/10 text-[#2a78d6] flex items-center justify-center flex-shrink-0">
              <FileText size={18} />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {hasFile
                ? isEditing
                  ? 'Edit PDF Note Details'
                  : 'View PDF Note'
                : isEditing
                ? 'Edit Note'
                : 'View Note'}
            </DialogTitle>
            {note.subject && (
              <Badge variant="secondary" className="text-xs bg-[#2a78d6]/10 text-[#2a78d6]">
                {note.subject}
              </Badge>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-zinc-300 transition-colors border border-gray-200 dark:border-slate-700"
            title="Close"
          >
            <X size={18} />
          </button>
        </DialogHeader>

        <div className="space-y-6 py-4 flex-1 overflow-y-auto">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Title <span className="text-red-500 ml-0.5">*</span>
                  </Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Note title..."
                    className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Subject
                  </Label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g. Computer Science"
                    className="bg-gray-100 dark:bg-[#12151e] border-gray-200 dark:border-slate-700/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-lg h-10 focus-visible:ring-[#2a78d6] focus-visible:border-[#2a78d6] text-sm font-semibold"
                  />
                </div>
              </div>

              {!hasFile && (
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Content
                  </Label>
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
                  <Label className="text-sm font-semibold text-gray-800 dark:text-zinc-200 mb-2 block">
                    Attachment Preview
                  </Label>
                  <FileViewer fileUrl={note.file_url!} title={form.title} />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-b border-gray-200 dark:border-slate-700/80 pb-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                  {note.title}
                </h2>
                {note.profiles?.display_name && (
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                    By <span className="font-semibold text-gray-700 dark:text-zinc-300">{note.profiles.display_name}</span>
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
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    Content
                  </h4>
                  <div className="p-4 bg-gray-100 dark:bg-[#12151e] border border-gray-200 dark:border-slate-700/80 rounded-xl max-h-[500px] overflow-y-auto">
                    <MarkdownRenderer content={note.content} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 dark:border-slate-700/80 pt-4 shrink-0">
          <div>
            {onDelete && canEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 h-10 text-sm font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {canEdit && !isEditing && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl px-4 h-10 text-sm font-semibold transition-colors inline-flex items-center gap-1.5"
              >
                <Edit2 className="w-4 h-4" /> Edit Note
              </button>
            )}

            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl px-4 h-10 text-sm font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !form.title.trim()}
                  className="bg-[#2a78d6] hover:bg-[#2268bc] text-white rounded-xl px-5 h-10 text-sm font-semibold disabled:opacity-50 flex items-center justify-center transition-all duration-200 inline-flex gap-1.5"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl px-4 h-10 text-sm font-semibold transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

