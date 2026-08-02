import { useState } from 'react';
import {
  Lock,
  Globe,
  Users,
  Share2,
  Edit2,
  MoreHorizontal,
  Filter,
  Eye,
  Trash2,
  ArrowDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ColumnFilters, SortOption } from './useNotes';
import { NoteRow } from './NoteRow';

interface NotesTableProps {
  notes: any[];
  subjects: string[];
  columnFilters: ColumnFilters;
  updateColumnFilter: (column: keyof ColumnFilters, value: string) => void;
  sortOption: SortOption;
  setSortOption: (sort: SortOption) => void;
  handleViewNote: (note: any) => void;
  handleShareNote: (note: any) => void;
  handleEditNote: (note: any) => void;
  handleDeleteNote: (note: any) => void;
}

export const NotesTable = ({
  notes,
  subjects,
  columnFilters,
  updateColumnFilter,
  sortOption,
  setSortOption,
  handleViewNote,
  handleShareNote,
  handleEditNote,
  handleDeleteNote
}: NotesTableProps) => {
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const toggleSortDate = () => {
    setSortOption(sortOption === 'newest' ? 'oldest' : 'newest');
  };

  return (
    <div className="w-full max-w-full bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-xs overflow-hidden">
      <table className="w-full text-left border-collapse table-auto">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700/80 bg-gray-50/50 dark:bg-gray-900/40 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {/* Note Name Column */}
            <th className="py-3 px-3">
              <div className="flex items-center justify-between space-x-1">
                <span>Note Name</span>
                <Popover
                  open={openPopover === 'name'}
                  onOpenChange={(open) => setOpenPopover(open ? 'name' : null)}
                >
                  <PopoverTrigger asChild>
                    <button
                      className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                        columnFilters.name ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
                      }`}
                      title="Filter by name"
                    >
                      <Filter size={13} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-60 p-3" align="start">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Filter by Title</label>
                      <Input
                        placeholder="Type title or filename..."
                        value={columnFilters.name}
                        onChange={(e) => updateColumnFilter('name', e.target.value)}
                        className="h-8 text-xs"
                      />
                      {columnFilters.name && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateColumnFilter('name', '')}
                          className="h-7 text-xs w-full text-gray-500"
                        >
                          Clear Filter
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </th>

            {/* Subject / Course Column */}
            <th className="py-3 px-3">
              <div className="flex items-center justify-between space-x-1">
                <span>Subject / Course</span>
                <Popover
                  open={openPopover === 'subject'}
                  onOpenChange={(open) => setOpenPopover(open ? 'subject' : null)}
                >
                  <PopoverTrigger asChild>
                    <button
                      className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                        columnFilters.subject !== 'all' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
                      }`}
                      title="Filter by subject"
                    >
                      <Filter size={13} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-3" align="start">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Select Subject</label>
                      <select
                        value={columnFilters.subject}
                        onChange={(e) => updateColumnFilter('subject', e.target.value)}
                        className="w-full h-8 text-xs bg-white dark:bg-gray-800 border rounded px-2 text-gray-700 dark:text-gray-200"
                      >
                        {subjects.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub === 'all' ? 'All Subjects' : sub}
                          </option>
                        ))}
                      </select>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </th>

            {/* Created By Column */}
            <th className="py-3 px-3">
              <div className="flex items-center justify-between space-x-1">
                <span>Created By</span>
                <Popover
                  open={openPopover === 'creator'}
                  onOpenChange={(open) => setOpenPopover(open ? 'creator' : null)}
                >
                  <PopoverTrigger asChild>
                    <button
                      className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                        columnFilters.creator !== 'all' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
                      }`}
                      title="Filter by creator"
                    >
                      <Filter size={13} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-52 p-3" align="start">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Creator</label>
                      <select
                        value={columnFilters.creator}
                        onChange={(e) => updateColumnFilter('creator', e.target.value)}
                        className="w-full h-8 text-xs bg-white dark:bg-gray-800 border rounded px-2 text-gray-700 dark:text-gray-200"
                      >
                        <option value="all">All Creators</option>
                        <option value="mine">Created by You</option>
                        <option value="others">Shared Users</option>
                      </select>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </th>

            {/* Linked Group Column */}
            <th className="py-3 px-3">
              <div className="flex items-center justify-between space-x-1">
                <span>Linked Group</span>
                <Popover
                  open={openPopover === 'group'}
                  onOpenChange={(open) => setOpenPopover(open ? 'group' : null)}
                >
                  <PopoverTrigger asChild>
                    <button
                      className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                        columnFilters.group !== 'all' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
                      }`}
                      title="Filter by group"
                    >
                      <Filter size={13} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-52 p-3" align="start">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Group Attachment</label>
                      <select
                        value={columnFilters.group}
                        onChange={(e) => updateColumnFilter('group', e.target.value)}
                        className="w-full h-8 text-xs bg-white dark:bg-gray-800 border rounded px-2 text-gray-700 dark:text-gray-200"
                      >
                        <option value="all">All Notes</option>
                        <option value="linked">Group Notes Only</option>
                        <option value="none">Personal (No Group)</option>
                      </select>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </th>

            {/* Visibility Column */}
            <th className="py-3 px-3">
              <div className="flex items-center justify-between space-x-1">
                <span>Visibility</span>
                <Popover
                  open={openPopover === 'visibility'}
                  onOpenChange={(open) => setOpenPopover(open ? 'visibility' : null)}
                >
                  <PopoverTrigger asChild>
                    <button
                      className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                        columnFilters.visibility !== 'all' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
                      }`}
                      title="Filter by visibility"
                    >
                      <Filter size={13} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-52 p-3" align="start">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Visibility Level</label>
                      <select
                        value={columnFilters.visibility}
                        onChange={(e) => updateColumnFilter('visibility', e.target.value)}
                        className="w-full h-8 text-xs bg-white dark:bg-gray-800 border rounded px-2 text-gray-700 dark:text-gray-200"
                      >
                        <option value="all">All Levels</option>
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </th>

            {/* Date Created Column */}
            <th className="py-3 px-3 whitespace-nowrap">
              <button
                onClick={toggleSortDate}
                className="flex items-center space-x-1 hover:text-indigo-600 transition-colors"
              >
                <span>Date Created</span>
                <ArrowDown
                  size={13}
                  className={`transition-transform ${sortOption === 'oldest' ? 'rotate-180' : ''}`}
                />
              </button>
            </th>

            {/* Actions Column */}
            <th className="py-3 px-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-sm">
          {notes.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-gray-500 dark:text-gray-400">
                <div className="max-w-xs mx-auto space-y-2">
                  <p className="text-base font-semibold text-gray-800 dark:text-gray-200">No notes found</p>
                  <p className="text-xs">Try adjusting your filters or search criteria.</p>
                </div>
              </td>
            </tr>
          ) : (
            notes.map((note) => (
              <NoteRow
                key={note.id}
                note={note}
                onViewNote={handleViewNote}
                onShareNote={handleShareNote}
                onEditNote={handleEditNote}
                onDeleteNote={handleDeleteNote}
              />
            ))
          )}

        </tbody>
      </table>
    </div>
  );
};
