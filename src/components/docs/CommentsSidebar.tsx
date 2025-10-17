
import { useState } from 'react';
import { MessageSquare, X, Reply } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

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

interface CommentsSidebarProps {
  comments: Comment[];
  onAddComment: (selectedText: string, content: string) => void;
  onResolveComment: (commentId: string) => void;
  onReplyToComment: (commentId: string, content: string) => void;
}

export const CommentsSidebar = ({ 
  comments, 
  onAddComment, 
  onResolveComment, 
  onReplyToComment 
}: CommentsSidebarProps) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleAddReply = (commentId: string) => {
    if (replyContent.trim()) {
      onReplyToComment(commentId, replyContent);
      setReplyContent('');
      setReplyingTo(null);
    }
  };

  const activeComments = comments.filter(comment => !comment.resolved);
  const resolvedComments = comments.filter(comment => comment.resolved);

  return (
    <div className="w-80 bg-white border-l h-full overflow-y-auto">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <MessageSquare size={18} className="mr-2" />
          Comments ({activeComments.length})
        </h3>

        {/* Active Comments */}
        <div className="space-y-4">
          {activeComments.map((comment) => (
            <Card key={comment.id} className="border border-yellow-200">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{comment.author}</p>
                    <p className="text-xs text-gray-500">{comment.timestamp}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onResolveComment(comment.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X size={12} />
                  </Button>
                </div>
                {comment.selectedText && (
                  <div className="bg-yellow-50 p-2 rounded text-xs">
                    "{comment.selectedText}"
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm mb-2">{comment.content}</p>
                
                {/* Replies */}
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="ml-4 border-l-2 border-gray-200 pl-3 mt-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-xs">{reply.author}</span>
                      <span className="text-xs text-gray-500">{reply.timestamp}</span>
                    </div>
                    <p className="text-sm">{reply.content}</p>
                  </div>
                ))}

                {/* Reply Input */}
                {replyingTo === comment.id ? (
                  <div className="mt-2 space-y-2">
                    <Input
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="text-sm"
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAddReply(comment.id)}
                        disabled={!replyContent.trim()}
                      >
                        Reply
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(comment.id)}
                    className="mt-2 text-xs"
                  >
                    <Reply size={12} className="mr-1" />
                    Reply
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Resolved Comments */}
        {resolvedComments.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-600 mb-2">
              Resolved ({resolvedComments.length})
            </h4>
            <div className="space-y-2">
              {resolvedComments.map((comment) => (
                <Card key={comment.id} className="border-gray-200 opacity-60">
                  <CardContent className="p-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-xs">{comment.author}</span>
                      <span className="text-xs text-gray-500">{comment.timestamp}</span>
                    </div>
                    <p className="text-xs line-through">{comment.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
