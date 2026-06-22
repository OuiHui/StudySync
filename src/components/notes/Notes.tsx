import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNotes } from './useNotes';
import { NotesHeader } from './NotesHeader';
import { NotesGrid } from './NotesGrid';
import { NoteDialogs } from './NoteDialogs';

export const Notes = () => {
  const notesState = useNotes();
  const { error, loading } = notesState;

  return (
    <div className="space-y-6 animate-fade-in">
      <NotesHeader {...notesState} />
      {error && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
        </Alert>
      )}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600 dark:text-gray-300">Loading your notes...</span>
        </div>
      ) : (
        <NotesGrid {...notesState} />
      )}
      <NoteDialogs {...notesState} />
    </div>
  );
};
