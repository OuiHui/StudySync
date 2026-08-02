import { Globe, Lock, Users, Share2, Edit2, MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface NoteRowProps {
  note: any;
  onViewNote: (note: any) => void;
  onShareNote: (note: any) => void;
  onEditNote: (note: any) => void;
  onDeleteNote: (note: any) => void;
}

export const NoteRow = ({
  note,
  onViewNote,
  onShareNote,
  onEditNote,
  onDeleteNote
}: NoteRowProps) => {
  return (
    <tr
      onClick={() => onViewNote(note)}
      className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors cursor-pointer group"
    >
      {/* Note Name */}
      <td className="py-3 px-3 font-medium text-gray-900 dark:text-gray-100">
        <div className="flex items-center space-x-2.5 min-w-0">
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

      {/* Linked Group */}
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

      {/* Visibility */}
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
                onClick={() => onShareNote(note)}
                title="Share Note"
              >
                <Share2 size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                onClick={() => onEditNote(note)}
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
              <DropdownMenuItem onClick={() => onViewNote(note)}>
                <Eye size={14} className="mr-2" /> View Note
              </DropdownMenuItem>
              {note.isMine && (
                <>
                  <DropdownMenuItem onClick={() => onShareNote(note)}>
                    <Share2 size={14} className="mr-2" /> Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEditNote(note)}>
                    <Edit2 size={14} className="mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDeleteNote(note)}
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
  );
};
