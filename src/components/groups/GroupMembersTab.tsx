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
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {members.map((member) => {
        const isCurrentUser = user?.id === member.id;
        const isAdmin = member.role === 'admin';
        const initials = member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
        
        return (
          <Card key={member.id} className={`border-0 shadow-sm dark:bg-gray-800 ${isCurrentUser ? 'ring-2 ring-blue-500' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                ) : (
                  <div className={`w-12 h-12 ${isAdmin ? 'bg-yellow-500' : 'bg-blue-500'} rounded-full flex items-center justify-center shrink-0`}>
                    <span className="text-white font-medium">{initials}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-850 dark:text-white truncate text-sm">
                    {member.name}
                    {isCurrentUser && <span className="ml-1 text-[10px] text-blue-600 dark:text-blue-400 font-normal">(You)</span>}
                  </h3>
                  <div className="flex items-center mt-0.5">
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{member.role}</span>
                    {isAdmin && <Crown size={12} className="ml-1 text-yellow-500" />}
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
