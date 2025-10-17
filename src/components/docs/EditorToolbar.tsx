
import { 
  Bold, 
  Italic, 
  Link, 
  List, 
  ListOrdered, 
  Type, 
  Palette,
  MessageSquare,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Underline,
  Strikethrough
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EditorToolbarProps {
  onFormatText: (format: string, value?: string) => void;
  selectedText: string;
}

export const EditorToolbar = ({ onFormatText, selectedText }: EditorToolbarProps) => {
  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];
  const colors = [
    '#000000', '#333333', '#666666', '#999999',
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080'
  ];

  return (
    <div className="flex items-center space-x-1 p-2 border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700 flex-wrap gap-2">
      {/* Font Size */}
      <Select onValueChange={(value) => onFormatText('fontSize', value)}>
        <SelectTrigger className="w-20 h-8 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
          <SelectValue placeholder="16px" />
        </SelectTrigger>
        <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
          {fontSizes.map((size) => (
            <SelectItem key={size} value={size} className="dark:text-gray-200 dark:hover:bg-gray-700">
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6 dark:bg-gray-600" />

      {/* Text Formatting */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormatText('bold')}
        className="h-8 w-8 p-0 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Bold"
      >
        <Bold size={16} />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormatText('italic')}
        className="h-8 w-8 p-0 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Italic"
      >
        <Italic size={16} />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormatText('underline')}
        className="h-8 w-8 p-0 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Underline"
      >
        <Underline size={16} />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormatText('strikethrough')}
        className="h-8 w-8 p-0 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </Button>

      <Separator orientation="vertical" className="h-6 dark:bg-gray-600" />

      {/* Font Color */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 dark:text-gray-300 dark:hover:bg-gray-700"
            title="Text Color"
          >
            <Palette size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 dark:bg-gray-800 dark:border-gray-600">
          <div className="grid grid-cols-4 gap-2">
            {colors.map((color) => (
              <button
                key={color}
                className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400"
                style={{ backgroundColor: color }}
                onClick={() => onFormatText('color', color)}
                title={color}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6 dark:bg-gray-600" />

      {/* Alignment */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormatText('alignLeft')}
        className="h-8 w-8 p-0 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Align Left"
      >
        <AlignLeft size={16} />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormatText('alignCenter')}
        className="h-8 w-8 p-0 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Align Center"
      >
        <AlignCenter size={16} />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormatText('alignRight')}
        className="h-8 w-8 p-0 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Align Right"
      >
        <AlignRight size={16} />
      </Button>

      <Separator orientation="vertical" className="h-6 dark:bg-gray-600" />

      {/* Lists */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormatText('bulletList')}
        className="h-8 w-8 p-0 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Bullet List"
      >
        <List size={16} />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormatText('numberedList')}
        className="h-8 w-8 p-0 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Numbered List"
      >
        <ListOrdered size={16} />
      </Button>

      <Separator orientation="vertical" className="h-6 dark:bg-gray-600" />

      {/* Link */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormatText('link')}
        className="h-8 w-8 p-0 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Insert Link"
        disabled={!selectedText}
      >
        <Link size={16} />
      </Button>

      {/* Comments */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormatText('comment')}
        className="h-8 w-8 p-0 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Add Comment"
        disabled={!selectedText}
      >
        <MessageSquare size={16} />
      </Button>
    </div>
  );
};
