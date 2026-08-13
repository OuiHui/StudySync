import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NotesPaginationProps {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  itemsPerPage: number;
  setItemsPerPage: (items: number) => void;
  totalNotesCount: number;
}

export const NotesPagination = ({
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
  setItemsPerPage,
  totalNotesCount
}: NotesPaginationProps) => {
  if (totalNotesCount === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalNotesCount);

  // Generate page numbers
  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-6 px-1 text-sm text-muted-foreground">
      {/* Left: Navigation Buttons */}
      <div className="flex items-center space-x-1">
        <Button
          variant="outline"
          size="icon"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          className="h-9 w-9 rounded-xl border-border hover:bg-muted text-foreground"
          title="Previous Page"
        >
          <ChevronLeft size={16} />
        </Button>

        {pages.map((page) => {
          const isActive = page === currentPage;
          return (
            <Button
              key={page}
              variant={isActive ? 'default' : 'outline'}
              onClick={() => setCurrentPage(page)}
              className={`h-9 w-9 rounded-xl text-xs font-semibold ${
                isActive
                  ? 'bg-brand hover:bg-brand-hover text-primary-foreground shadow-sm'
                  : 'border-border text-foreground hover:bg-muted'
              }`}
            >
              {page}
            </Button>
          );
        })}

        <Button
          variant="outline"
          size="icon"
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
          className="h-9 w-9 rounded-xl border-border hover:bg-muted text-foreground"
          title="Next Page"
        >
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Center: Range Summary Text */}
      <div className="font-medium text-xs sm:text-sm text-muted-foreground">
        Showing {startItem}–{endItem} of {totalNotesCount} notes
      </div>

      {/* Right: Page Size Dropdown */}
      <div className="flex items-center space-x-2">
        <Select value={String(itemsPerPage)} onValueChange={(val) => setItemsPerPage(Number(val))}>
          <SelectTrigger className="h-9 w-[120px] bg-card border-border text-foreground rounded-xl text-xs sm:text-sm font-semibold transition-all">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end" className="bg-card border-border text-card-foreground shadow-2xl backdrop-blur-md rounded-xl z-50">
            <SelectItem value="5">5 per page</SelectItem>
            <SelectItem value="8">8 per page</SelectItem>
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="20">20 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
