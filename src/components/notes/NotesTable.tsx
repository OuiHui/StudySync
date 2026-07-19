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
              <tr
                key={note.id}
                onClick={() => handleViewNote(note)}
                className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors cursor-pointer group"
              >
                {/* Note Name */}
                <td className="py-3 px-3 font-medium text-gray-900 dark:text-gray-100">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    {/* File Icon Badge */}
                    {note.hasPDF ? (
                      <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-red-600 dark:text-red-400">PDF</span>
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300">M↓</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold break-words line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {note.title}
                      </p>
                      {note.file_name && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 break-all line-clamp-1">{note.file_name}</p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Subject / Course */}
                <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200 break-words">{note.subject}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">General</p>
                  </div>
                </td>

                {/* Created By */}
                <td className="py-3 px-3">
                  <div className="flex items-center space-x-1.5">
                    {note.avatarUrl ? (
                      <img
                        src={note.avatarUrl}
                        alt={note.author}
                        className="w-5 h-5 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold flex items-center justify-center shrink-0">
                        {note.author.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-gray-700 dark:text-gray-300 font-medium text-xs break-words">
                      {note.author}
                    </span>
                  </div>
                </td>

                {/* Linked Group (wraps text cleanly) */}
                <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                  {note.linkedGroup !== '—' ? (
                    <div className="flex items-start space-x-1 text-indigo-600 dark:text-indigo-400 font-medium text-xs max-w-[160px]">
                      <Users size={13} className="shrink-0 mt-0.5" />
                      <span className="break-words whitespace-normal leading-tight">{note.linkedGroup}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>

                {/* Visibility (Public or Private based on Group Privacy) */}
                <td className="py-3 px-3 whitespace-nowrap">
                  {note.effectiveVisibility === 'public' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <Globe size={10} className="mr-1" /> Public
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      <Lock size={10} className="mr-1" /> Private
                    </span>
                  )}
                </td>

                {/* Date Created */}
                <td className="py-3 px-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                  {note.date}
                </td>

                {/* Actions */}
                <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end space-x-0.5">
                    {note.isMine && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                          onClick={() => handleShareNote(note)}
                          title="Share Note"
                        >
                          <Share2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                          onClick={() => handleEditNote(note)}
                          title="Edit Note"
                        >
                          <Edit2 size={14} />
                        </Button>
                      </>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                          <MoreHorizontal size={15} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleViewNote(note)}>
                          <Eye size={14} className="mr-2" /> View Note
                        </DropdownMenuItem>
                        {note.isMine && (
                          <>
                            <DropdownMenuItem onClick={() => handleShareNote(note)}>
                              <Share2 size={14} className="mr-2" /> Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditNote(note)}>
                              <Edit2 size={14} className="mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteNote(note)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 size={14} className="mr-2" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
