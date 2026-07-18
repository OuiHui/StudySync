import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-6 px-1 text-sm text-gray-600 dark:text-gray-300">
      {/* Left: Navigation Buttons */}
      <div className="flex items-center space-x-1">
        <Button
          variant="outline"
          size="icon"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          className="h-9 w-9 rounded-lg border-gray-200 dark:border-gray-700"
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
              className={`h-9 w-9 rounded-lg text-xs font-semibold ${
                isActive
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600'
                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
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
          className="h-9 w-9 rounded-lg border-gray-200 dark:border-gray-700"
          title="Next Page"
        >
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Center: Range Summary Text */}
      <div className="font-medium text-xs sm:text-sm text-gray-500 dark:text-gray-400">
        Showing {startItem}–{endItem} of {totalNotesCount} notes
      </div>

      {/* Right: Page Size Dropdown */}
      <div className="flex items-center space-x-2">
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="h-9 px-3 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          <option value={5}>5 per page</option>
          <option value={8}>8 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
        </select>
      </div>
    </div>
  );
};
