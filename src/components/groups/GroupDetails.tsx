
import { Users, BookOpen, MessageSquare, Calendar, Calculator, Atom, Code, Globe, Music, Camera, Heart, Star, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface GroupDetailsProps {
  group: any;
  onClose: () => void;
  onOpenChat: (groupName: string, groupId: string) => void;
}

export const GroupDetails = ({ group, onClose, onOpenChat }: GroupDetailsProps) => {
  // Helper function to get icon component by name
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      Users,
      BookOpen,
      Calculator,
      Atom,
      Code,
      Globe,
      Music,
      Camera,
      Heart,
      Star,
      Zap
    };
    return iconMap[iconName] || Users;
  };

  // Helper function to render icon (library icon or custom image)
  const renderGroupIcon = (iconValue: string, size: number = 24, className: string = "text-white") => {
    // Check if it's a custom image (data URI or URL)
    if (iconValue && (iconValue.startsWith('data:') || iconValue.startsWith('http'))) {
      return (
        <img 
          src={iconValue} 
          alt="Group icon" 
          className="object-cover rounded"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      );
    }
    
    // Otherwise, use icon from library
    const IconComponent = getIconComponent(iconValue);
    return <IconComponent size={size} className={className} />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 border-0 shadow-xl max-h-[80vh] overflow-y-auto dark:bg-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 ${group.color} rounded-lg flex items-center justify-center`}>
                {renderGroupIcon(group.icon || 'Users', 24, "text-white")}
              </div>
              <div>
                <CardTitle className="text-xl text-gray-800 dark:text-white">{group.name}</CardTitle>
                <p className="text-gray-600 dark:text-gray-300">{group.subject}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="dark:text-gray-300 dark:hover:bg-gray-700"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2 text-gray-800 dark:text-white">About This Group</h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm">{group.fullDescription}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-sm text-gray-600 dark:text-gray-300">Members</h5>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{group.members}</p>
            </div>
            <div>
              <h5 className="font-medium text-sm text-gray-600 dark:text-gray-300">Your Role</h5>
              <p className="text-lg font-semibold capitalize text-gray-800 dark:text-white">{group.role}</p>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-sm text-gray-600 dark:text-gray-300 mb-1">Meeting Schedule</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">{group.meetingSchedule}</p>
          </div>
          
          <div>
            <h5 className="font-medium text-sm text-gray-600 dark:text-gray-300 mb-1">Requirements</h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">{group.requirements}</p>
          </div>
          
          <div>
            <h5 className="font-medium text-sm text-gray-600 dark:text-gray-300 mb-2">Study Materials</h5>
            <ul className="text-sm space-y-1">
              {group.studyMaterials?.map((material: string, index: number) => (
                <li key={index} className="flex items-center text-gray-700 dark:text-gray-300">
                  <BookOpen size={12} className="mr-2 text-gray-400" />
                  {material}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex space-x-2 pt-4">
            <Button 
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => {
                onClose();
                // Navigate to group study session
              }}
            >
              Join Session
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={() => {
                onOpenChat(group.name, group.id);
              }}
            >
              <MessageSquare size={16} className="mr-1" />
              Chat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
