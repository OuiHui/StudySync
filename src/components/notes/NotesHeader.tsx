import { Plus, Upload, Search, FilterX, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SortOption } from './useNotes';

interface NotesHeaderProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  sortOption: SortOption;
  setSortOption: (v: SortOption) => void;
  hasActiveFilters: boolean;
  clearAllFilters: () => void;
  setIsCreateDialogOpen: (v: boolean) => void;
  setIsUploadPopupOpen: (v: boolean) => void;
}

export const NotesHeader = ({
  searchTerm,
  setSearchTerm,
  sortOption,
  setSortOption,
  hasActiveFilters,
  clearAllFilters,
  setIsCreateDialogOpen,
  setIsUploadPopupOpen
}: NotesHeaderProps) => (
  <div className="space-y-5">
    {/* Top Bar: Title & Primary Action Buttons */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Notes</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Create, organize, and share your study notes.
        </p>
      </div>

      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          className="h-10 border-gray-300 dark:border-gray-700 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          onClick={() => setIsUploadPopupOpen(true)}
        >
          <Upload size={16} className="mr-2 text-gray-600 dark:text-gray-400" />
          Upload Note
        </Button>
        <Button
          className="h-10 bg-brand hover:bg-brand-hover text-white font-semibold shadow-sm transition-all rounded-xl border-0"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus size={18} className="mr-1.5" />
          Create New Note
        </Button>
      </div>
    </div>

    {/* Search, Clear Filters, & Sort Bar */}
    <div className="flex flex-col sm:flex-row items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <Search size={18} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search notes by name, subject, or creator..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700/80 text-sm placeholder:text-gray-400 rounded-lg focus-visible:ring-indigo-500"
        />
      </div>

      {/* Action Buttons: Clear Filters & Sort Dropdown */}
      <div className="flex items-center space-x-3 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
        {/* Clear Filters Button */}
        <Button
          variant="outline"
          onClick={clearAllFilters}
          disabled={!hasActiveFilters}
          className={`h-10 text-xs sm:text-sm font-medium px-3.5 rounded-lg border transition-colors ${
            hasActiveFilters
              ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 dark:hover:bg-indigo-900/50'
              : 'border-gray-200 text-gray-400 dark:border-gray-800 dark:text-gray-600 opacity-60 cursor-not-allowed'
          }`}
        >
          <FilterX size={15} className="mr-1.5 shrink-0" />
          Clear Filters
        </Button>

        {/* Sort Dropdown */}
        <div className="relative flex items-center">
          <ArrowUpDown size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="h-10 pl-8 pr-8 text-xs sm:text-sm font-medium bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="title-asc">Sort: Name (A-Z)</option>
            <option value="title-desc">Sort: Name (Z-A)</option>
          </select>
        </div>
      </div>
    </div>
  </div>
);
