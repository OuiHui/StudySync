import { Users, Calendar, Clock, } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SessionDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  session: {
    id: string;
    groupName: string;
    subject: string;
    participants: number;
    startTime: string;
    duration: string;
    type: 'active' | 'planned';
    description: string;
  };
  onJoinSession: (sessionId: string) => void;
}

export const SessionDetailsPopup = ({ isOpen, onClose, session, onJoinSession }: SessionDetailsPopupProps) => {
  const handleJoin = () => {
    onJoinSession(session.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar size={20} className="mr-2" />
            Session Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Session Header */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{session.groupName}</h3>
            <p className="text-gray-600 dark:text-gray-300">{session.subject}</p>
            <Badge variant={session.type === 'active' ? 'default' : 'secondary'} className="mt-2">
              {session.type === 'active' ? 'LIVE' : 'SCHEDULED'}
            </Badge>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Description</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">{session.description}</p>
          </div>

          {/* Session Info */}
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <Users size={16} className="mr-2 text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">{session.participants} participants</span>
            </div>
            <div className="flex items-center text-sm">
              <Clock size={16} className="mr-2 text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">{session.duration} duration</span>
            </div>
            {session.type === 'planned' && (
              <div className="flex items-center text-sm">
                <Calendar size={16} className="mr-2 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">Starts at {session.startTime}</span>
              </div>
            )}
          </div>

          {/* Study Topics */}
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Study Topics</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Integration Techniques</Badge>
              <Badge variant="outline">Vector Spaces</Badge>
              <Badge variant="outline">Linear Transformations</Badge>
            </div>
          </div>

          {/* Requirements */}
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Requirements</h4>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>• Basic calculus knowledge</li>
              <li>• Textbook: Advanced Mathematics 3rd Ed.</li>
              <li>• Calculator recommended</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button 
              onClick={handleJoin}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              {session.type === 'active' ? 'Join Now' : 'Schedule'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};