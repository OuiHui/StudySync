
import { useState, useEffect, useRef } from 'react';
import { Save, Users, FileText, Share, MessageSquare, X, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EditorToolbar } from './EditorToolbar';
import { CommentsSidebar } from './CommentsSidebar';
import { ActiveUsersPopup, CompactActiveUsers } from './ActiveUsersPopup';
import { DocumentStatsPopup } from './DocumentStatsPopup';

interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursor: number;
  isActive: boolean;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  selectedText: string;
  resolved: boolean;
  replies: Reply[];
}

interface Reply {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

interface Document {
  id: string;
  title: string;
  content: string;
  lastModified: string;
  collaborators: Collaborator[];
}

interface CollaborativeEditorProps {
  onBackToDashboard?: () => void;
}

export const CollaborativeEditor = ({ onBackToDashboard }: CollaborativeEditorProps) => {
  const [document, setDocument] = useState<Document>({
    id: '1',
    title: 'Study Notes - Chapter 7',
    content: 'Welcome to the collaborative editor!\n\nThis is where you can work together on study materials, notes, and documents in real-time.\n\nStart typing to see the collaboration features in action...',
    lastModified: new Date().toLocaleTimeString(),
    collaborators: [
      { id: '1', name: 'You', color: 'bg-blue-500', cursor: 0, isActive: true },
      { id: '2', name: 'Sarah Chen', color: 'bg-green-500', cursor: 25, isActive: true },
      { id: '3', name: 'Mike Johnson', color: 'bg-purple-500', cursor: 50, isActive: false },
    ]
  });

  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: 'Sarah Chen',
      content: 'Great explanation of integration techniques!',
      timestamp: '10 minutes ago',
      selectedText: 'integration techniques',
      resolved: false,
      replies: [
        {
          id: '1-1',
          author: 'You',
          content: 'Thanks! I found that example really helpful.',
          timestamp: '5 minutes ago'
        }
      ]
    }
  ]);

  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showActiveUsers, setShowActiveUsers] = useState(false);
  const [showDocStats, setShowDocStats] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleContentChange = (value: string) => {
    setDocument(prev => ({
      ...prev,
      content: value,
      lastModified: new Date().toLocaleTimeString()
    }));
    setIsTyping(true);
    
    setTimeout(() => setIsTyping(false), 1000);
  };

  const handleTitleChange = (value: string) => {
    setDocument(prev => ({
      ...prev,
      title: value,
      lastModified: new Date().toLocaleTimeString()
    }));
  };

  const handleTextSelection = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const selected = target.value.substring(start, end);
    setSelectedText(selected);
    setCursorPosition(start);
  };

  const handleFormatText = (format: string, value?: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    let replacement = '';
    
    switch (format) {
      case 'bold':
        replacement = `**${selectedText}**`;
        break;
      case 'italic':
        replacement = `*${selectedText}*`;
        break;
      case 'underline':
        replacement = `<u>${selectedText}</u>`;
        break;
      case 'strikethrough':
        replacement = `~~${selectedText}~~`;
        break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) replacement = `[${selectedText}](${url})`;
        else return;
        break;
      case 'bulletList':
        replacement = selectedText.split('\n').map(line => `• ${line}`).join('\n');
        break;
      case 'numberedList':
        replacement = selectedText.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n');
        break;
      case 'color':
        replacement = `<span style="color: ${value}">${selectedText}</span>`;
        break;
      case 'fontSize':
        replacement = `<span style="font-size: ${value}">${selectedText}</span>`;
        break;
      case 'comment':
        handleAddComment(selectedText);
        return;
      default:
        return;
    }

    const newContent = 
      textarea.value.substring(0, start) + 
      replacement + 
      textarea.value.substring(end);

    handleContentChange(newContent);
    
    // Reset selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + replacement.length);
    }, 0);
  };

  const handleAddComment = (selectedText: string) => {
    const content = prompt('Add a comment:');
    if (content && content.trim()) {
      const newComment: Comment = {
        id: Date.now().toString(),
        author: 'You',
        content: content.trim(),
        timestamp: 'Just now',
        selectedText: selectedText,
        resolved: false,
        replies: []
      };
      setComments(prev => [...prev, newComment]);
      setShowComments(true);
    }
  };

  const handleResolveComment = (commentId: string) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, resolved: true }
          : comment
      )
    );
  };

  const handleReplyToComment = (commentId: string, content: string) => {
    const newReply: Reply = {
      id: `${commentId}-${Date.now()}`,
      author: 'You',
      content: content,
      timestamp: 'Just now'
    };

    setComments(prev => 
      prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, replies: [...comment.replies, newReply] }
          : comment
      )
    );
  };

  const activeCollaborators = document.collaborators.filter(c => c.isActive);

  return (
    <div className="max-w-full mx-auto h-screen flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
        <div className="flex items-center space-x-4">
          {onBackToDashboard && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToDashboard}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              ← Back to Documents
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Collaborative Editor</h1>
            <p className="text-gray-600 dark:text-gray-300">Work together on documents in real-time</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className={`dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 ${showComments ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
          >
            <MessageSquare size={16} className="mr-2" />
            Comments ({comments.filter(c => !c.resolved).length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDocStats(true)}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <BarChart3 size={16} className="mr-2" />
            Stats
          </Button>
          <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            <Share size={16} className="mr-2" />
            Share
          </Button>
          <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
            <Save size={16} className="mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Editor */}
        <div className="flex-1 flex flex-col">
          {/* Document Title */}
          <div className="p-4 border-b dark:border-gray-700">
            <Input
              value={document.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-xl font-semibold border-0 px-0 focus-visible:ring-0 dark:bg-transparent dark:text-white"
              placeholder="Document title..."
            />
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
              <div className="flex items-center space-x-2">
                <FileText size={16} />
                <span>Last saved: {document.lastModified}</span>
              </div>
              <CompactActiveUsers 
                collaborators={document.collaborators} 
                isTyping={isTyping}
                onClick={() => setShowActiveUsers(true)}
              />
            </div>
          </div>

          {/* Toolbar */}
          <EditorToolbar onFormatText={handleFormatText} selectedText={selectedText} />

          {/* Editor */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={document.content}
              onChange={(e) => handleContentChange(e.target.value)}
              onSelect={handleTextSelection}
              className="h-full border-0 resize-none focus-visible:ring-0 text-base leading-relaxed p-6 dark:bg-transparent dark:text-white"
              placeholder="Start writing your document..."
            />
          </div>
        </div>

        {/* Comments Sidebar */}
        {showComments && (
          <CommentsSidebar
            comments={comments}
            onAddComment={handleAddComment}
            onResolveComment={handleResolveComment}
            onReplyToComment={handleReplyToComment}
          />
        )}
      </div>

      {/* Popups */}
      <ActiveUsersPopup
        isOpen={showActiveUsers}
        onClose={() => setShowActiveUsers(false)}
        collaborators={document.collaborators}
        isTyping={isTyping}
      />

      <DocumentStatsPopup
        isOpen={showDocStats}
        onClose={() => setShowDocStats(false)}
        content={document.content}
      />
    </div>
  );
};
