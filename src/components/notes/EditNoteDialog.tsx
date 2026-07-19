import { CollaborativeNote } from '@/hooks/useCollaborativeNotes';
import { SharedNoteModal, SharedNoteData } from './SharedNoteModal';

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

  const noteData: SharedNoteData = {
    ...editingNote,
    title: editForm.title || editingNote.title,
    content: editForm.content ?? editingNote.content,
    subject: editForm.subject ?? editingNote.subject,
  };

  const handleSave = async (noteId: string, updates: { title: string; content: string; subject: string }) => {
    setEditForm({
      title: updates.title,
      content: updates.content,
      subject: updates.subject,
    });
    await onSave();
  };

  return (
    <SharedNoteModal
      note={noteData}
      isOpen={!!editingNote}
      onClose={onOpenChange}
      onSave={handleSave}
      onCursorChange={onCursorChange}
      currentUserId={userId}
    />
  );
};
