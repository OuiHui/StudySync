import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNotes } from './useNotes';
import { NotesHeader } from './NotesHeader';
import { NotesFilterTabs } from './NotesFilterTabs';
import { NotesTable } from './NotesTable';
import { NotesPagination } from './NotesPagination';
import { NoteDialogs } from './NoteDialogs';

export const Notes = () => {
  const notesState = useNotes();
  const {
    error,
    loading,
    activeTab,
    setActiveTab,
    tabCounts,
    paginatedNotes,
    subjects,
    columnFilters,
    updateColumnFilter,
    sortOption,
    setSortOption,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    totalNotesCount,
    handleViewNote,
    handleShareNote,
    handleEditNote,
    handleDeleteNote
  } = notesState;

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-full overflow-x-hidden">
      {/* Header with Title, Create/Upload buttons, Search, Clear Filters, and Sorting */}
      <NotesHeader {...notesState} />

      {/* Category Pill Tabs with Item Counts */}
      <NotesFilterTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={tabCounts}
      />

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
          <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading Indicator or Notes Table */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          <span className="ml-3 text-sm font-medium text-gray-600 dark:text-gray-300">Loading notes...</span>
        </div>
      ) : (
        <>
          <NotesTable
            notes={paginatedNotes}
            subjects={subjects}
            columnFilters={columnFilters}
            updateColumnFilter={updateColumnFilter}
            sortOption={sortOption}
            setSortOption={setSortOption}
            handleViewNote={handleViewNote}
            handleShareNote={handleShareNote}
            handleEditNote={handleEditNote}
            handleDeleteNote={handleDeleteNote}
          />

          <NotesPagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            totalNotesCount={totalNotesCount}
          />
        </>
      )}

      {/* Modals & Dialogs (Create, Edit, Share, View, Upload) */}
      <NoteDialogs {...notesState} />
    </div>
  );
};
