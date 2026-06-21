import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, MessageSquare, Plus } from 'lucide-react';
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
  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No notes yet</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {groupId ? 'Start collaborating by creating your first group note' : 'Create your first note to get started'}
        </p>
        <Button onClick={onCreateClick} variant="outline">
          <Plus className="w-4 h-4 mr-2" /> Create Note
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {notes.map((note) => (
        <Card key={note.id} className="border-0 shadow-md hover:shadow-xl transition-all duration-200 dark:bg-gray-800 cursor-pointer group">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 flex-1">
                <div className="flex-1">
                  <CardTitle className="text-lg dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {note.title}
                  </CardTitle>
                  {note.subject && <p className="text-sm text-gray-600 dark:text-gray-300">{note.subject}</p>}
                </div>
              </div>
              {note.created_by === userId && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Mine</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {note.content && <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">{note.content}</p>}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">By {note.profiles?.display_name || 'Unknown'}</span>
                <span className="text-gray-600 dark:text-gray-400">{new Date(note.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
            {note.created_by === userId && (
              <div className="mt-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onEditClick(note); }} className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                  <Edit size={14} className="mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onDeleteClick(note.id); }} className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 size={14} className="mr-1" /> Delete
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
