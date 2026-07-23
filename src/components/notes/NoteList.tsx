import { FileText, File, Trash2, Edit, Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CollaborativeNote } from '@/hooks/useCollaborativeNotes';

interface NoteListProps {
  notes: CollaborativeNote[];
  userId?: string;
  groupId?: string;
  onCreateClick: () => void;
  onEditClick: (note: CollaborativeNote) => void;
  onDeleteClick: (noteId: string) => void;
}

export const NoteList = ({ notes, userId, groupId, onCreateClick, onEditClick, onDeleteClick }: NoteListProps) => {
  const isPDF = (note: CollaborativeNote) => {
    const urlLower = (note.file_url || '').toLowerCase();
    const titleLower = (note.title || '').toLowerCase();
    return urlLower.endsWith('.pdf') || titleLower.endsWith('.pdf');
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No notes yet</h3>
        <p className="text-gray-500 dark:text-gray-400">
          {groupId ? 'Start collaborating by creating your first group note' : 'Create your first note to get started'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note, index) => {
        const hasPDF = isPDF(note);
        return (
          <div key={note.id}>
            {index > 0 && <div className="border-t border-gray-100 dark:border-gray-800/60 my-4" />}
            <div className="flex items-center justify-between group hover:bg-gray-50/50 dark:hover:bg-gray-800/10 p-2 rounded-lg transition-colors cursor-pointer" onClick={() => onEditClick(note)}>
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                {hasPDF ? (
                  <div className="w-10 h-10 rounded bg-red-100 dark:bg-red-950/30 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <File className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {note.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {note.profiles?.display_name || 'Unknown'} • {formatDate(note.updated_at)}
                  </p>
                </div>
              </div>
              
              {note.created_by === userId && (
                <div className="flex items-center space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onEditClick(note)}
                    className="h-8 w-8 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onDeleteClick(note.id)}
                    className="h-8 w-8 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
