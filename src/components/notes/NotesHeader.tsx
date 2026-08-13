import { Plus, Upload, Search, FilterX, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortOption, NoteTab } from './useNotes';
import { PAGE_TITLE_CLASS } from '@/constants/theme';
import { PageTabs } from '@/components/common/navigation/PageTabs';

interface NotesHeaderProps {
  activeTab: NoteTab;
  setActiveTab: (v: NoteTab) => void;
  tabCounts: {
    'my-notes': number;
    'group-notes': number;
    [key: string]: number;
  };
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
  activeTab,
  setActiveTab,
  tabCounts,
  searchTerm,
  setSearchTerm,
  sortOption,
  setSortOption,
  hasActiveFilters,
  clearAllFilters,
  setIsCreateDialogOpen,
  setIsUploadPopupOpen,
}: NotesHeaderProps) => {
  const tabs = [
    { id: 'my-notes' as NoteTab, label: 'My Notes', count: tabCounts['my-notes'] },
    { id: 'group-notes' as NoteTab, label: 'Group Notes', count: tabCounts['group-notes'] },
  ];

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <h1 className={PAGE_TITLE_CLASS}>Notes</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Create, organize, and share your study notes.
        </p>
      </div>

      {/* Shared PageTabs with action buttons on tab bar line */}
      <PageTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
        action={
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              className="group h-10 rounded-xl border border-border bg-card/90 hover:bg-brand/10 hover:border-brand/40 text-card-foreground hover:text-brand transition-all duration-200 shadow-sm px-4 font-semibold text-xs sm:text-sm"
              onClick={() => setIsUploadPopupOpen(true)}
            >
              <Upload size={16} className="mr-2 text-muted-foreground group-hover:text-brand transition-colors" />
              Upload Note
            </Button>
            <Button
              className="h-10 bg-brand hover:bg-brand-hover text-primary-foreground font-semibold shadow-sm transition-all rounded-xl border-0 px-4 text-xs sm:text-sm"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus size={18} className="mr-1.5" />
              Create New Note
            </Button>
          </div>
        }
      />

      {/* Search, Clear Filters, & Sort Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes by name, subject, or creator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 bg-card border-border text-sm placeholder:text-muted-foreground rounded-xl focus-visible:ring-brand"
          />
        </div>

        {/* Action Buttons: Clear Filters & Sort Dropdown */}
        <div className="flex items-center space-x-3 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
          {/* Clear Filters Button */}
          <Button
            variant="outline"
            onClick={clearAllFilters}
            disabled={!hasActiveFilters}
            className={`h-10 text-xs sm:text-sm font-semibold px-3.5 rounded-xl border transition-colors ${
              hasActiveFilters
                ? 'border-brand/30 bg-brand/10 text-brand hover:bg-brand/20'
                : 'border-border text-muted-foreground/40 opacity-60 cursor-not-allowed'
            }`}
          >
            <FilterX size={15} className="mr-1.5 shrink-0" />
            Clear Filters
          </Button>

          {/* Sort Dropdown */}
          <Select value={sortOption} onValueChange={(val) => setSortOption(val as SortOption)}>
            <SelectTrigger className="h-10 min-w-[150px] sm:min-w-[170px] bg-card border-border text-foreground rounded-xl text-xs sm:text-sm font-semibold transition-all">
              <ArrowUpDown size={14} className="mr-1.5 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Sort notes" />
            </SelectTrigger>
            <SelectContent align="end" className="bg-card border-border text-card-foreground shadow-2xl backdrop-blur-md rounded-xl z-50">
              <SelectItem value="newest">Sort: Newest</SelectItem>
              <SelectItem value="oldest">Sort: Oldest</SelectItem>
              <SelectItem value="title-asc">Sort: Name (A-Z)</SelectItem>
              <SelectItem value="title-desc">Sort: Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
