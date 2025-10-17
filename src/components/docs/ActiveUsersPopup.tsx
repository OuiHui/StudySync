
import { Users, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursor: number;
  isActive: boolean;
}

interface ActiveUsersPopupProps {
  isOpen: boolean;
  onClose: () => void;
  collaborators: Collaborator[];
  isTyping: boolean;
}

export const ActiveUsersPopup = ({ isOpen, onClose, collaborators, isTyping }: ActiveUsersPopupProps) => {
  const activeCollaborators = collaborators.filter(c => c.isActive);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users size={20} className="mr-2" />
            Active Collaborators ({activeCollaborators.length})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {activeCollaborators.map((collaborator) => (
            <div key={collaborator.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-10 h-10 ${collaborator.color} rounded-full flex items-center justify-center text-white font-medium`}>
                {collaborator.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-medium">{collaborator.name}</p>
                <p className="text-sm text-gray-500">
                  {collaborator.id === '1' ? 'You' : 'Editing'}
                  {isTyping && collaborator.id !== '1' && (
                    <span className="ml-2 text-blue-500 animate-pulse">typing...</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const CompactActiveUsers = ({ collaborators, isTyping, onClick }: { 
  collaborators: Collaborator[]; 
  isTyping: boolean; 
  onClick: () => void;
}) => {
  const activeCollaborators = collaborators.filter(c => c.isActive);

  return (
    <div 
      className="flex items-center space-x-2 cursor-pointer bg-white border rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex -space-x-2">
        {activeCollaborators.slice(0, 3).map((collaborator) => (
          <HoverCard key={collaborator.id}>
            <HoverCardTrigger asChild>
              <div className={`w-8 h-8 ${collaborator.color} rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-white`}>
                {collaborator.name.charAt(0).toUpperCase()}
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-auto p-2">
              <p className="text-sm font-medium">{collaborator.name}</p>
              <p className="text-xs text-gray-500">
                {collaborator.id === '1' ? 'You' : 'Active'}
              </p>
            </HoverCardContent>
          </HoverCard>
        ))}
        {activeCollaborators.length > 3 && (
          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
            +{activeCollaborators.length - 3}
          </div>
        )}
      </div>
      <span className="text-sm text-gray-600">{activeCollaborators.length} active</span>
    </div>
  );
};
