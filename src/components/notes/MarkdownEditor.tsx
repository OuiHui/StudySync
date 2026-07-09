import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bold, Italic, Underline, Link as LinkIcon, List, ListOrdered, Table, Layers, ArrowDownCircle, ChevronDown, Undo2, Redo2 } from 'lucide-react';
import TurndownService from 'turndown';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onCursorChange?: (position: number) => void;
  placeholder?: string;
  className?: string;
}

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

// Configure turndown to keep tags that don't have direct markdown equivalents
turndownService.keep(['details', 'summary', 'u', 'ins', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'br']);

const markdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  try {
    marked.setOptions({
      gfm: true,
      breaks: true
    });
    const rawHtml = marked.parse(markdown) as string;
    return DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ['details', 'summary', 'u', 'ins'],
      ADD_ATTR: ['open', 'class']
    });
  } catch (e) {
    console.error('Error compiling markdown to html:', e);
    return markdown;
  }
};

const htmlToMarkdown = (html: string): string => {
  if (!html) return '';
  try {
    // Replace multiple empty paragraphs/lines to prevent spacing drift
    const cleanedHtml = html.replace(/<p><br><\/p>/g, '<br>').replace(/<p>&nbsp;<\/p>/g, '<br>');
    return turndownService.turndown(cleanedHtml);
  } catch (e) {
    console.error('Error compiling html to markdown:', e);
    return html;
  }
};

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  onCursorChange,
  placeholder = 'Write something...',
  className = ''
}) => {
  const [isRichText, setIsRichText] = useState(true);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtmlRef = useRef<string>('');

  const localValueRef = useRef(value);
  const lastRenderedValueRef = useRef<string | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  // Undo/redo history stack
  const historyRef = useRef<string[]>([value]);
  const historyIndexRef = useRef<number>(0);
  const isUndoRedoRef = useRef<boolean>(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const lastHistorySaveValueRef = useRef(value);

  const [currentBlockStyle, setCurrentBlockStyle] = useState('p');

  const updateUndoRedoState = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  const getBlockStyleAtSelection = useCallback(() => {
    if (!isRichText) return 'p';
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      try {
        const range = selection.getRangeAt(0);
        let node: Node | null = range.startContainer;
        while (node && node !== editorRef.current) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = (node as Element).tagName.toLowerCase();
            if (['h1', 'h2', 'h3', 'p'].includes(tagName)) {
              return tagName;
            }
          }
          node = node.parentNode;
        }
      } catch (e) {
        // Safe catch for environments like jsdom
      }
    }
    return 'p';
  }, [isRichText]);

  const pushToHistory = useCallback((newValue: string) => {
    if (isUndoRedoRef.current) return;
    const currentHistory = historyRef.current;
    const currentIndex = historyIndexRef.current;
    if (currentHistory[currentIndex] === newValue) return;

    // Discard any forward redo steps if user started editing from an undo point
    const newHistory = currentHistory.slice(0, currentIndex + 1);
    newHistory.push(newValue);
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    updateUndoRedoState();
  }, [updateUndoRedoState]);

  // Sync value from parent to Rich Text editor (avoiding cursor reset)
  useEffect(() => {
    if (isRichText && editorRef.current) {
      // If parent value matches what we last rendered or what we locally wrote, skip update!
      if (value === lastRenderedValueRef.current || (lastRenderedValueRef.current !== null && value === localValueRef.current)) {
        return;
      }
      
      const generatedHtml = markdownToHtml(value);
      editorRef.current.innerHTML = generatedHtml || `<p><br></p>`;
      localValueRef.current = value;
      lastHtmlRef.current = generatedHtml;
      lastRenderedValueRef.current = value;

      // Reset history if it is a completely external note load
      if (!isUndoRedoRef.current) {
        historyRef.current = [value];
        historyIndexRef.current = 0;
        setCanUndo(false);
        setCanRedo(false);
        lastHistorySaveValueRef.current = value;
      }
    }
  }, [value, isRichText]);

  // Debounce saving typing states to undo history
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value !== lastHistorySaveValueRef.current) {
        pushToHistory(value);
        lastHistorySaveValueRef.current = value;
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [value, pushToHistory]);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      isUndoRedoRef.current = true;
      historyIndexRef.current -= 1;
      const previousValue = historyRef.current[historyIndexRef.current];
      localValueRef.current = previousValue;
      lastRenderedValueRef.current = previousValue;
      lastHistorySaveValueRef.current = previousValue;
      onChange(previousValue);
      
      if (isRichText && editorRef.current) {
        const html = markdownToHtml(previousValue);
        editorRef.current.innerHTML = html || `<p><br></p>`;
        lastHtmlRef.current = html;
        editorRef.current.focus();
      } else if (!isRichText && textareaRef.current) {
        textareaRef.current.focus();
      }
      
      updateUndoRedoState();
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 50);
    }
  }, [isRichText, onChange, updateUndoRedoState]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      isUndoRedoRef.current = true;
      historyIndexRef.current += 1;
      const nextValue = historyRef.current[historyIndexRef.current];
      localValueRef.current = nextValue;
      lastRenderedValueRef.current = nextValue;
      lastHistorySaveValueRef.current = nextValue;
      onChange(nextValue);
      
      if (isRichText && editorRef.current) {
        const html = markdownToHtml(nextValue);
        editorRef.current.innerHTML = html || `<p><br></p>`;
        lastHtmlRef.current = html;
        editorRef.current.focus();
      } else if (!isRichText && textareaRef.current) {
        textareaRef.current.focus();
      }
      
      updateUndoRedoState();
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 50);
    }
  }, [isRichText, onChange, updateUndoRedoState]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      handleUndo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
      e.preventDefault();
      handleRedo();
    }
  };

  // Handle cursor changes in contentEditable
  const handleSelectionChange = useCallback(() => {
    if (isRichText && editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (editorRef.current.contains(range.commonAncestorContainer)) {
          savedRangeRef.current = range;
        }
      }
      
      const activeStyle = getBlockStyleAtSelection();
      setCurrentBlockStyle(activeStyle);
    }

    if (!onCursorChange) return;
    
    if (isRichText && editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editorRef.current);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        const caretOffset = preCaretRange.toString().length;
        onCursorChange(caretOffset);
      }
    } else if (!isRichText && textareaRef.current) {
      onCursorChange(textareaRef.current.selectionStart);
    }
  }, [isRichText, onCursorChange, getBlockStyleAtSelection]);

  // Sync Rich Text changes back to parent
  const handleEditorInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastHtmlRef.current = html;
      const markdown = htmlToMarkdown(html);
      localValueRef.current = markdown;
      lastRenderedValueRef.current = markdown;
      onChange(markdown);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    localValueRef.current = val;
    lastRenderedValueRef.current = val;
    onChange(val);
  };

  const toggleEditorMode = () => {
    if (isRichText) {
      // Rich Text -> Plain Text
      if (editorRef.current) {
        const markdown = htmlToMarkdown(editorRef.current.innerHTML);
        localValueRef.current = markdown;
        lastRenderedValueRef.current = markdown;
        onChange(markdown);
      }
      setIsRichText(false);
    } else {
      // Plain Text -> Rich Text
      const html = markdownToHtml(value);
      setIsRichText(true);
      // Wait for contentEditable to mount
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = html || `<p><br></p>`;
          lastHtmlRef.current = html;
          lastRenderedValueRef.current = value;
        }
      }, 0);
    }
  };

  // Run an editor command
  const handleCommand = (command: string, paramValue: string = '') => {
    if (isRichText) {
      if (!editorRef.current) return;
      
      editorRef.current.focus();
      
      const selection = window.getSelection();
      if (selection && savedRangeRef.current) {
        selection.removeAllRanges();
        selection.addRange(savedRangeRef.current);
      }

      if (command === 'h1' || command === 'h2' || command === 'h3' || command === 'p') {
        const tagName = command.toUpperCase();
        try {
          document.execCommand('formatBlock', false, `<${tagName}>`);
        } catch (e) {
          try {
            document.execCommand('formatBlock', false, tagName);
          } catch (err) {
            console.error('Error running formatBlock command:', err);
          }
        }
        setCurrentBlockStyle(command);
      } else if (command === 'bold') {
        document.execCommand('bold', false);
      } else if (command === 'italic') {
        document.execCommand('italic', false);
      } else if (command === 'underline') {
        document.execCommand('underline', false);
      } else if (command === 'bullet') {
        document.execCommand('insertUnorderedList', false);
      } else if (command === 'number') {
        document.execCommand('insertOrderedList', false);
      } else if (command === 'code') {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const code = document.createElement('code');
          code.className = 'bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono';
          code.textContent = range.toString() || 'code';
          range.deleteContents();
          range.insertNode(code);
        }
      } else if (command === 'link') {
        const url = prompt('Enter the link URL:');
        if (url) {
          document.execCommand('createLink', false, url);
        }
      } else if (command === 'details') {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const details = document.createElement('details');
          details.className = 'border rounded-md p-3 my-2 bg-gray-50 dark:bg-gray-900/30';
          
          const summary = document.createElement('summary');
          summary.className = 'cursor-pointer font-semibold text-sm select-none';
          summary.textContent = 'Summary (Click to expand)';
          details.appendChild(summary);
          
          const div = document.createElement('div');
          div.className = 'mt-2 text-sm text-gray-700 dark:text-gray-300';
          div.textContent = range.toString() || 'Details content goes here...';
          details.appendChild(div);
          
          range.deleteContents();
          range.insertNode(details);
        }
      } else if (command === 'table') {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const table = document.createElement('table');
          table.className = 'border-collapse border border-gray-300 dark:border-gray-700 w-full my-4 text-sm';
          table.innerHTML = `
            <thead>
              <tr>
                <th class="border border-gray-300 dark:border-gray-700 p-2 text-left bg-gray-50 dark:bg-gray-900/50">Header 1</th>
                <th class="border border-gray-300 dark:border-gray-700 p-2 text-left bg-gray-50 dark:bg-gray-900/50">Header 2</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-gray-700 p-2">Cell 1</td>
                <td class="border border-gray-300 dark:border-gray-700 p-2">Cell 2</td>
              </tr>
            </tbody>
          `;
          range.deleteContents();
          range.insertNode(table);
        }
      }
      
      const html = editorRef.current.innerHTML;
      lastHtmlRef.current = html;
      const markdown = htmlToMarkdown(html);
      localValueRef.current = markdown;
      lastRenderedValueRef.current = markdown;
      onChange(markdown);
      
      pushToHistory(markdown);
      lastHistorySaveValueRef.current = markdown;
    } else {
      if (!textareaRef.current) return;
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const selectedText = text.substring(start, end);

      let replacement = '';
      let selectionOffsetStart = 0;
      let selectionOffsetEnd = 0;

      if (command === 'bold') {
        replacement = `**${selectedText || 'bold text'}**`;
        selectionOffsetStart = 2;
        selectionOffsetEnd = selectedText ? replacement.length - 2 : replacement.length - 2;
      } else if (command === 'italic') {
        replacement = `*${selectedText || 'italic text'}*`;
        selectionOffsetStart = 1;
        selectionOffsetEnd = selectedText ? replacement.length - 1 : replacement.length - 1;
      } else if (command === 'underline') {
        replacement = `<u>${selectedText || 'underlined text'}</u>`;
        selectionOffsetStart = 3;
        selectionOffsetEnd = selectedText ? replacement.length - 4 : replacement.length - 4;
      // Inline code command removed
      } else if (command === 'link') {
        const url = prompt('Enter URL:');
        if (url !== null) {
          replacement = `[${selectedText || 'link text'}](${url})`;
          selectionOffsetStart = 1;
          selectionOffsetEnd = selectedText ? (selectedText.length + 1) : 10;
        } else {
          return;
        }
      } else if (command === 'bullet') {
        replacement = selectedText
          ? selectedText.split('\n').map(line => `- ${line}`).join('\n')
          : '- item';
        selectionOffsetStart = 2;
        selectionOffsetEnd = replacement.length;
      } else if (command === 'number') {
        replacement = selectedText
          ? selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n')
          : '1. item';
        selectionOffsetStart = 3;
        selectionOffsetEnd = replacement.length;
      } else if (command === 'h1' || command === 'h2' || command === 'h3' || command === 'p') {
        const level = command === 'h1' ? 1 : command === 'h2' ? 2 : command === 'h3' ? 3 : 0;
        const hashPrefix = level > 0 ? '#'.repeat(level) + ' ' : '';
        
        if (!selectedText) {
          replacement = level > 0 ? `\n${hashPrefix}Heading\n` : '';
          selectionOffsetStart = level > 0 ? hashPrefix.length + 1 : 0;
          selectionOffsetEnd = replacement.length > 0 ? replacement.length - 1 : 0;
        } else {
          const lines = selectedText.split('\n');
          const cleanedLines = lines.map(line => line.replace(/^#+\s+/, ''));
          replacement = cleanedLines.map(line => `${hashPrefix}${line}`).join('\n');
          selectionOffsetStart = hashPrefix.length;
          selectionOffsetEnd = replacement.length;
        }
      } else if (command === 'details') {
        replacement = `<details>\n<summary>${selectedText || 'Summary'}</summary>\n\nDetails content\n</details>`;
        selectionOffsetStart = 10;
        selectionOffsetEnd = selectedText ? 10 + selectedText.length : 17;
      } else if (command === 'table') {
        replacement = `\n| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |\n`;
        selectionOffsetStart = replacement.length;
        selectionOffsetEnd = replacement.length;
      }

      const newValue = text.substring(0, start) + replacement + text.substring(end);
      localValueRef.current = newValue;
      lastRenderedValueRef.current = newValue;
      onChange(newValue);

      pushToHistory(newValue);
      lastHistorySaveValueRef.current = newValue;

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + selectionOffsetStart, start + selectionOffsetEnd);
      }, 0);
    }
  };

  return (
    <div className={`flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all ${className}`}>
      
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
        
        {/* Headers dropdown select */}
        <div className="relative group/select mr-1">
          <select
            value={currentBlockStyle}
            onChange={(e) => {
              handleCommand(e.target.value);
            }}
            className="appearance-none pr-7 pl-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md cursor-pointer focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium"
          >
            <option value="p">Normal Text</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
          <ChevronDown className="absolute right-2 top-2 h-3.5 w-3.5 pointer-events-none text-gray-500" />
        </div>

        {/* Undo/Redo buttons */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); handleUndo(); }}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Undo2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); handleRedo(); }}
          disabled={!canRedo}
          title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Redo2 className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Basic text styling */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); handleCommand('bold'); }}
          title="Bold"
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); handleCommand('italic'); }}
          title="Italic"
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <Italic className="h-4 w-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); handleCommand('underline'); }}
          title="Underline"
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <Underline className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Inline components */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); handleCommand('link'); }}
          title="Add Link"
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <LinkIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); handleCommand('bullet'); }}
          title="Bullet List"
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <List className="h-4 w-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); handleCommand('number'); }}
          title="Numbered List"
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Blocks */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); handleCommand('details'); }}
          title="Insert Expandable Details Accordion"
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <Layers className="h-4 w-4" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); handleCommand('table'); }}
          title="Insert Table"
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <Table className="h-4 w-4" />
        </button>
      </div>

      {/* Editor Body */}
      <div className="relative flex-1 min-h-[300px] overflow-y-auto">
        {isRichText ? (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            onKeyDown={handleKeyDown}
            onSelect={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            onMouseUp={handleSelectionChange}
            className="prose dark:prose-invert max-w-none min-h-[300px] p-4 focus:outline-none overflow-y-auto"
            style={{ minHeight: '300px' }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onSelect={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            onMouseUp={handleSelectionChange}
            placeholder={placeholder}
            className="w-full min-h-[300px] p-4 font-mono text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-0 focus:outline-none focus:ring-0 resize-y"
            style={{ minHeight: '300px' }}
          />
        )}
      </div>

      {/* Mode Switcher Footer */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 select-none">
        <button
          type="button"
          onClick={toggleEditorMode}
          className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          {isRichText ? 'Switch to plain text editing' : 'Switch to rich text editing'}
        </button>
        <span className="flex items-center gap-1 font-semibold border px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          Markdown Supported
        </span>
      </div>
    </div>
  );
};
