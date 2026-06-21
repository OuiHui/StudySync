import { Users, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export const GroupMembersTab = ({ members }: { members: any[] }) => {
  const { user } = useAuth();

  if (members.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <Users size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-300">No members found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {members.map((member) => {
        const isCurrentUser = user?.id === member.id;
        const isAdmin = member.role === 'admin';
        const initials = member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
        
        return (
          <Card key={member.id} className={`border-0 shadow-md dark:bg-gray-800 ${isCurrentUser ? 'ring-2 ring-blue-500' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className={`w-12 h-12 ${isAdmin ? 'bg-yellow-500' : 'bg-blue-500'} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-medium">{initials}</span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 dark:text-white">
                    {member.name}
                    {isCurrentUser && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>}
                  </h3>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">{member.role}</span>
                    {isAdmin && <Crown size={14} className="ml-1 text-yellow-500" />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
