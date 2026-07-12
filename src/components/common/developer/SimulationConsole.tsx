import React, { useState, useEffect, useRef } from 'react';
import { 
  simulationManager, 
  MOCK_USERS, 
  SeededUser 
} from '@/services/simulation';
import { 
  Terminal, 
  User as UserIcon, 
  Play, 
  Trash2, 
  Users, 
  MessageSquare, 
  Plus, 
  FileText, 
  X, 
  Activity,
  LogIn,
  UserPlus,
  Check,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase as mainSupabase } from '@/integrations/supabase/client';

export function SimulationConsole() {
  const { user: mainUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'actions' | 'scenarios' | 'logs'>('users');
  const [logs, setLogs] = useState<string[]>(simulationManager.logs);
  const [selectedBotId, setSelectedBotId] = useState<string>('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Bot Action states
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [dmContent, setDmContent] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [groupMessageContent, setGroupMessageContent] = useState('');

  // Bot Status States
  const [botFriends, setBotFriends] = useState<string[]>([]);
  const [botGroups, setBotGroups] = useState<any[]>([]);
  const [botSessions, setBotSessions] = useState<any[]>([]);
  const [botPendingRequests, setBotPendingRequests] = useState<string[]>([]);
  const [botPendingGroupInvites, setBotPendingGroupInvites] = useState<any[]>([]);
  const [botPendingSessionInvites, setBotPendingSessionInvites] = useState<any[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);

  const [selectedInviteGroupId, setSelectedInviteGroupId] = useState('');
  const [selectedInviteSessionId, setSelectedInviteSessionId] = useState('');

  // Dynamically resolve all interaction targets, including the main user
  const targets = [
    ...MOCK_USERS,
    ...(mainUser && !MOCK_USERS.some(u => u.id === mainUser.id) ? [{
      id: mainUser.id,
      name: mainUser.user_metadata?.display_name || mainUser.email?.split('@')[0] || 'You (Huy Nguyen)',
      email: mainUser.email || '',
      password: ''
    }] : [])
  ].filter(u => u.id !== selectedBotId);

  // Defer control to the main user by default
  useEffect(() => {
    if (mainUser && !selectedBotId) {
      setSelectedBotId(mainUser.id);
    }
  }, [mainUser, selectedBotId]);

  // Keep targetUserId updated when active bot or mainUser changes
  useEffect(() => {
    if (targets.length > 0 && (!targetUserId || !targets.some(t => t.id === targetUserId))) {
      setTargetUserId(targets[0].id);
    }
  }, [selectedBotId, mainUser, targetUserId, targets]);

  const loadBotStatus = async () => {
    if (!selectedBotId) return;
    try {
      setStatusLoading(true);
      
      // 1. Friends
      const { data: friendships } = await mainSupabase
        .from('friendships' as any)
        .select('user_id, friend_id')
        .or(`user_id.eq.${selectedBotId},friend_id.eq.${selectedBotId}`)
        .eq('status', 'accepted');
      
      const friendIds = (friendships || []).map((f: any) => 
        f.user_id === selectedBotId ? f.friend_id : f.user_id
      );
      
      let friendsList: any[] = [];
      if (friendIds.length > 0) {
        const { data: profiles } = await mainSupabase
          .from('profiles')
          .select('user_id, display_name, email')
          .in('user_id', friendIds);
        friendsList = profiles || [];
      }
      setBotFriends(friendsList.map(p => p.display_name || p.email.split('@')[0]));

      // 2. Groups
      const { data: memberships } = await mainSupabase
        .from('group_members' as any)
        .select('group_id, study_groups(id, name)')
        .eq('user_id', selectedBotId);
      
      setBotGroups((memberships || []).map((m: any) => m.study_groups).filter(Boolean));

      // 3. Sessions
      const { data: participations } = await mainSupabase
        .from('session_participants' as any)
        .select('session_id, study_sessions(id, title), status')
        .eq('user_id', selectedBotId);
      
      setBotSessions((participations || []).map((p: any) => ({
        id: p.study_sessions?.id,
        title: p.study_sessions?.title,
        status: p.status
      })).filter(s => s.id));

      // 4. Friend requests received
      const { data: requests } = await mainSupabase
        .from('friendships' as any)
        .select('user_id')
        .eq('friend_id', selectedBotId)
        .eq('status', 'pending');
      
      setBotPendingRequests((requests || []).map((r: any) => r.user_id));

      // 5. Group invitations received
      const { data: grpInvites } = await mainSupabase
        .from('group_invitations' as any)
        .select('group_id, study_groups(name)')
        .eq('invited_user_id', selectedBotId)
        .eq('status', 'pending');
      
      setBotPendingGroupInvites((grpInvites || []).map((gi: any) => ({
        groupId: gi.group_id,
        groupName: gi.study_groups?.name
      })).filter(gi => gi.groupId));

      // 6. Session invitations received
      const { data: sesInvites } = await mainSupabase
        .from('session_participants' as any)
        .select('session_id, study_sessions(title)')
        .eq('user_id', selectedBotId)
        .eq('status', 'invited');
      
      setBotPendingSessionInvites((sesInvites || []).map((si: any) => ({
        sessionId: si.session_id,
        sessionTitle: si.study_sessions?.title
      })).filter(si => si.sessionId));

    } catch (err) {
      console.error('Error loading bot status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && selectedBotId) {
      loadBotStatus();
    }
  }, [isOpen, selectedBotId]);
  
  // Group creation state
  const [groupName, setGroupName] = useState('');
  const [groupSubject, setGroupSubject] = useState('Computer Science');
  const [groupDesc, setGroupDesc] = useState('');

  // Study Session state
  const [sessionSearch, setSessionSearch] = useState('');

  // Note state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSubject, setNoteSubject] = useState('General');
  const [noteGroup, setNoteGroup] = useState('');
  const [notePermission, setNotePermission] = useState<'private' | 'group' | 'public'>('private');

  useEffect(() => {
    // Listen to logs from the simulation manager
    const unsubscribe = simulationManager.addLogListener((message) => {
      if (message === '__CLEAR__') {
        setLogs([]);
      } else {
        setLogs([...simulationManager.logs]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs' && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-xl hover:scale-105 transition duration-300 flex items-center justify-center group"
        title="Open Simulation Console"
      >
        <Terminal size={24} className="group-hover:rotate-12 transition duration-300" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-500 ease-out text-sm font-semibold whitespace-nowrap">
          Simulation Console
        </span>
        {/* Subtle pulsing badge to show it is active in dev mode */}
        <span className="absolute top-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse"></span>
      </button>
    );
  }

  const handleLogin = async (bot: SeededUser) => {
    try {
      await simulationManager.loginAs(bot.id);
    } catch (err) {
      alert(`Login failed! See console for details.`);
    }
  };

  const executeBotAction = async (actionFn: () => Promise<void>) => {
    try {
      await actionFn();
      setTimeout(() => {
        loadBotStatus();
      }, 800);
    } catch (err: any) {
      console.error(err);
    }
  };

  const currentBot = [
    ...MOCK_USERS,
    ...(mainUser ? [{
      id: mainUser.id,
      name: mainUser.user_metadata?.display_name || mainUser.email?.split('@')[0] || 'You (Huy Nguyen)',
      email: mainUser.email || '',
      password: ''
    }] : [])
  ].find(u => u.id === selectedBotId)!;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-slate-950/95 backdrop-blur-md text-slate-100 border border-slate-800 shadow-2xl rounded-2xl w-[450px] h-[580px] flex flex-col overflow-hidden font-sans transition-all duration-300 animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-bold text-sm text-indigo-400 tracking-wide uppercase">Simulation Console</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">dev mode</span>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded p-1 transition"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900/40 px-2 py-1 border-b border-slate-800 flex items-center gap-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'users' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <UserIcon size={14} />
          Users
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'actions' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity size={14} />
          Bot Actions
        </button>
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'scenarios' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Play size={14} />
          Scenarios
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'logs' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Terminal size={14} />
          Logs ({logs.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-950/20">
        
        {/* Tab 1: Users */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 mb-2">
              Select a mock user to login as them instantly in the UI, or set them as the active bot to run manual actions in the background.
            </p>
            <div className="space-y-2">
              {MOCK_USERS.map((bot) => {
                const isMainUser = mainUser?.email === bot.email;
                const isActiveBot = selectedBotId === bot.id;
                
                return (
                  <div 
                    key={bot.id} 
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                      isMainUser 
                        ? 'bg-emerald-950/25 border-emerald-500/30 text-emerald-300' 
                        : isActiveBot
                        ? 'bg-indigo-950/25 border-indigo-500/30 text-indigo-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold flex items-center gap-1.5">
                        {bot.name}
                        {isMainUser && (
                          <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.2 rounded font-semibold uppercase">
                            Main Tab
                          </span>
                        )}
                        {isActiveBot && (
                          <span className="text-[10px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 px-1.5 py-0.2 rounded font-semibold uppercase">
                            Active Bot
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-slate-500">{bot.email}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedBotId(bot.id)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition ${
                          isActiveBot 
                            ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50' 
                            : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-750'
                        }`}
                        title="Set as Active Bot to execute background actions"
                      >
                        Bot Control
                      </button>
                      <button
                        onClick={() => handleLogin(bot)}
                        disabled={isMainUser}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition ${
                          isMainUser 
                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/25 cursor-not-allowed' 
                            : 'bg-slate-800 hover:bg-indigo-600 hover:text-white border border-slate-700 text-slate-200'
                        }`}
                        title={isMainUser ? "Already logged in" : "Log in as this user in the main application"}
                      >
                        <LogIn size={12} />
                        Login
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Bot Actions */}
        {activeTab === 'actions' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Controlling Bot:</span>
                <span className="text-sm font-semibold text-indigo-400">{currentBot.name}</span>
              </div>
              <select
                value={selectedBotId}
                onChange={(e) => setSelectedBotId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {mainUser && (
                  <option value={mainUser.id}>
                    {mainUser.user_metadata?.display_name || mainUser.email?.split('@')[0] || 'You (Huy Nguyen)'} (You)
                  </option>
                )}
                {MOCK_USERS.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Bot Status & Relations */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 mb-1.5">
                <span className="font-bold text-slate-400">Bot Status</span>
                {statusLoading && <span className="text-slate-500 italic">Refreshing...</span>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-500 font-semibold block">Friends:</span>
                  <span className="truncate block" title={botFriends.join(', ')}>{botFriends.length > 0 ? botFriends.join(', ') : 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Groups:</span>
                  <span className="truncate block" title={botGroups.map(g => g.name).join(', ')}>{botGroups.length > 0 ? botGroups.map(g => g.name).join(', ') : 'None'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 font-semibold block">Sessions:</span>
                  <span className="truncate block" title={botSessions.map(s => `${s.title} (${s.status})`).join(', ')}>{botSessions.length > 0 ? botSessions.map(s => `${s.title} (${s.status})`).join(', ') : 'None'}</span>
                </div>
              </div>

              {(botPendingGroupInvites.length > 0 || botPendingSessionInvites.length > 0) && (
                <div className="border-t border-slate-800 pt-2 mt-2 space-y-1.5">
                  <span className="font-bold text-amber-400 flex items-center gap-1 font-semibold">
                    Pending Invites
                  </span>
                  {botPendingGroupInvites.map(gi => (
                    <div key={gi.groupId} className="flex justify-between items-center bg-slate-950 p-1.5 rounded gap-2">
                      <span className="text-slate-400 font-medium truncate">Group: {gi.groupName}</span>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => executeBotAction(async () => {
                            const bot = await simulationManager.bot(currentBot.id);
                            await bot.acceptGroupInvitation(gi.groupId);
                          })}
                          className="px-2 py-0.5 bg-emerald-600/30 text-emerald-400 rounded text-[10px] hover:bg-emerald-600/40 font-semibold"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => executeBotAction(async () => {
                            const bot = await simulationManager.bot(currentBot.id);
                            await bot.declineGroupInvitation(gi.groupId);
                          })}
                          className="px-2 py-0.5 bg-rose-600/30 text-rose-400 rounded text-[10px] hover:bg-rose-600/40 font-semibold"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                  {botPendingSessionInvites.map(si => (
                    <div key={si.sessionId} className="flex justify-between items-center bg-slate-950 p-1.5 rounded gap-2">
                      <span className="text-slate-400 font-medium truncate">Session: {si.sessionTitle}</span>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => executeBotAction(async () => {
                            const bot = await simulationManager.bot(currentBot.id);
                            await bot.acceptSessionInvitation(si.sessionId);
                          })}
                          className="px-2 py-0.5 bg-emerald-600/30 text-emerald-400 rounded text-[10px] hover:bg-emerald-600/40 font-semibold"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => executeBotAction(async () => {
                            const bot = await simulationManager.bot(currentBot.id);
                            await bot.declineSessionInvitation(si.sessionId);
                          })}
                          className="px-2 py-0.5 bg-rose-600/30 text-rose-400 rounded text-[10px] hover:bg-rose-600/40 font-semibold"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Friendships */}
            <div className="space-y-2 p-3 bg-slate-900/40 border border-slate-900 rounded-xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Users size={12} />
                Friendships
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5"
                >
                  {targets.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.id === mainUser?.id ? ' (You)' : ''}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => executeBotAction(async () => {
                    const bot = await simulationManager.bot(currentBot.id);
                    await bot.sendFriendRequest(targetUserId);
                  })}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg transition"
                >
                  Add Friend
                </button>
              </div>
              {botPendingRequests.includes(targetUserId) && (
                <div className="flex items-center gap-2 mt-1.5 animate-fade-in">
                  <button
                    onClick={() => executeBotAction(async () => {
                      const bot = await simulationManager.bot(currentBot.id);
                      await bot.acceptFriendRequest(targetUserId);
                    })}
                    className="flex-1 bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-400 text-xs py-1.5 rounded-lg transition"
                  >
                    Accept Request
                  </button>
                  <button
                    onClick={() => executeBotAction(async () => {
                      const bot = await simulationManager.bot(currentBot.id);
                      await bot.rejectFriendRequest(targetUserId);
                    })}
                    className="flex-1 bg-rose-600/30 hover:bg-rose-600/40 border border-rose-500/30 text-rose-400 text-xs py-1.5 rounded-lg transition"
                  >
                    Decline Request
                  </button>
                </div>
              )}
            </div>

            {/* Group & Session Invitations */}
            <div className="space-y-2.5 p-3 bg-slate-900/40 border border-slate-900 rounded-xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <UserPlus size={12} />
                Send Group/Session Invite
              </span>
              <div className="space-y-2">
                {/* Invite to Group */}
                <div className="flex gap-2">
                  <select
                    value={selectedInviteGroupId}
                    onChange={(e) => setSelectedInviteGroupId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                  >
                    <option value="">Select Group...</option>
                    {botGroups.map((g: any) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <button
                    disabled={!selectedInviteGroupId}
                    onClick={() => executeBotAction(async () => {
                      if (!selectedInviteGroupId) return;
                      const bot = await simulationManager.bot(currentBot.id);
                      await bot.inviteUserToGroup(selectedInviteGroupId, targetUserId);
                      setSelectedInviteGroupId('');
                    })}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition shrink-0 font-medium"
                  >
                    Invite to Group
                  </button>
                </div>

                {/* Invite to Session */}
                <div className="flex gap-2">
                  <select
                    value={selectedInviteSessionId}
                    onChange={(e) => setSelectedInviteSessionId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                  >
                    <option value="">Select Session...</option>
                    {botSessions.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                  <button
                    disabled={!selectedInviteSessionId}
                    onClick={() => executeBotAction(async () => {
                      if (!selectedInviteSessionId) return;
                      const bot = await simulationManager.bot(currentBot.id);
                      await bot.inviteUserToSession(selectedInviteSessionId, targetUserId);
                      setSelectedInviteSessionId('');
                    })}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition shrink-0 font-medium"
                  >
                    Invite to Session
                  </button>
                </div>
              </div>
            </div>

            {/* Direct Messaging */}
            <div className="space-y-2.5 p-3 bg-slate-900/40 border border-slate-900 rounded-xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <MessageSquare size={12} />
                Direct Messaging
              </span>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-16">To User:</span>
                  <select
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5"
                  >
                    {targets.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.id === mainUser?.id ? ' (You)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dmContent}
                    onChange={(e) => setDmContent(e.target.value)}
                    placeholder="Enter direct message..."
                    className="flex-1 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => executeBotAction(async () => {
                      if (!dmContent.trim()) return;
                      const bot = await simulationManager.bot(currentBot.id);
                      await bot.sendMessage(targetUserId, dmContent);
                      setDmContent('');
                    })}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-1.5 rounded-lg transition"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>

            {/* Group Chats & Messaging */}
            <div className="space-y-2.5 p-3 bg-slate-900/40 border border-slate-900 rounded-xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Users size={12} />
                Groups & Chat
              </span>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    placeholder="Group Name or ID..."
                    className="flex-1 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => executeBotAction(async () => {
                      const bot = await simulationManager.bot(currentBot.id);
                      await bot.joinGroup(groupSearch);
                    })}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg transition"
                  >
                    Join
                  </button>
                  <button
                    onClick={() => executeBotAction(async () => {
                      const bot = await simulationManager.bot(currentBot.id);
                      await bot.leaveGroup(groupSearch);
                    })}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition"
                  >
                    Leave
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={groupMessageContent}
                    onChange={(e) => setGroupMessageContent(e.target.value)}
                    placeholder="Message to group chat..."
                    className="flex-1 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => executeBotAction(async () => {
                      if (!groupMessageContent.trim()) return;
                      const bot = await simulationManager.bot(currentBot.id);
                      await bot.sendGroupMessage(groupSearch, groupMessageContent);
                      setGroupMessageContent('');
                    })}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-1.5 rounded-lg transition"
                  >
                    Send Chat
                  </button>
                </div>
              </div>
            </div>

            {/* Create Group */}
            <div className="space-y-2.5 p-3 bg-slate-900/40 border border-slate-900 rounded-xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Plus size={12} />
                Create Group
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group Name..."
                  className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                />
                <input
                  type="text"
                  value={groupSubject}
                  onChange={(e) => setGroupSubject(e.target.value)}
                  placeholder="Subject (Computer Science...)"
                  className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                />
              </div>
              <input
                type="text"
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                placeholder="Description..."
                className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              />
              <button
                onClick={() => executeBotAction(async () => {
                  if (!groupName.trim()) return;
                  const bot = await simulationManager.bot(currentBot.id);
                  await bot.createGroup(groupName, groupDesc, groupSubject);
                  setGroupName('');
                  setGroupDesc('');
                })}
                className="w-full bg-indigo-650 hover:bg-indigo-700 text-white text-xs py-1.5 rounded-lg transition"
              >
                Create Study Group
              </button>
            </div>

            {/* Study Sessions */}
            <div className="space-y-2.5 p-3 bg-slate-900/40 border border-slate-900 rounded-xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Activity size={12} />
                Study Sessions
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  placeholder="Session Title or ID..."
                  className="flex-1 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => executeBotAction(async () => {
                    const bot = await simulationManager.bot(currentBot.id);
                    await bot.joinSession(sessionSearch);
                  })}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg transition"
                >
                  Join
                </button>
                <button
                  onClick={() => executeBotAction(async () => {
                    const bot = await simulationManager.bot(currentBot.id);
                    await bot.leaveSession(sessionSearch);
                  })}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition"
                >
                  Leave
                </button>
              </div>
            </div>

            {/* Create Note */}
            <div className="space-y-2.5 p-3 bg-slate-900/40 border border-slate-900 rounded-xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <FileText size={12} />
                Create Note
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note Title..."
                  className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                />
                <input
                  type="text"
                  value={noteSubject}
                  onChange={(e) => setNoteSubject(e.target.value)}
                  placeholder="Subject (Mathematics...)"
                  className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                />
              </div>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Note markdown content..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={noteGroup}
                  onChange={(e) => setNoteGroup(e.target.value)}
                  placeholder="Optional Group Name..."
                  className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                />
                <select
                  value={notePermission}
                  onChange={(e) => setNotePermission(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5"
                >
                  <option value="private">Private</option>
                  <option value="group">Group Share</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <button
                onClick={() => executeBotAction(async () => {
                  if (!noteTitle.trim()) return;
                  const bot = await simulationManager.bot(currentBot.id);
                  await bot.createNote(noteTitle, noteContent, noteSubject, noteGroup, notePermission);
                  setNoteTitle('');
                  setNoteContent('');
                })}
                className="w-full bg-indigo-605 hover:bg-indigo-700 text-white text-xs py-1.5 rounded-lg transition"
              >
                Create note
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Preset Scenarios */}
        {activeTab === 'scenarios' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Run preset multi-user scenarios that execute multiple database events automatically to test live UI rendering and real-time syncing.
            </p>
            
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-sm font-bold text-indigo-400 block">Friendship & Chat Setup Flow</span>
              <p className="text-xs text-slate-400">
                Sarah Chen sends a friend request to Marcus Johnson. Marcus accepts it, then both exchange direct messages.
              </p>
              <button
                onClick={() => simulationManager.runFriendshipScenario('Sarah Chen', 'Marcus Johnson')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-2 rounded-lg font-medium flex items-center gap-1.5 transition"
              >
                <Play size={12} />
                Run Friendship Flow
              </button>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-sm font-bold text-indigo-400 block">Group Study Sync Flow</span>
              <p className="text-xs text-slate-400">
                Priya Patel creates a group named "AI Research Hub". Sarah Chen and Marcus Johnson join, and everyone sends chat messages into the group.
              </p>
              <button
                onClick={() => simulationManager.runGroupStudyScenario('Priya Patel', ['Sarah Chen', 'Marcus Johnson'], 'AI Research Hub')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-2 rounded-lg font-medium flex items-center gap-1.5 transition"
              >
                <Play size={12} />
                Run Group Sync Flow
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Logs */}
        {activeTab === 'logs' && (
          <div className="h-full flex flex-col min-h-[350px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Simulation Console Output Logs:</span>
              <button
                onClick={() => simulationManager.clearLogs()}
                className="text-[10px] text-rose-400 border border-rose-500/25 bg-rose-500/10 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-rose-500/20 transition"
              >
                <Trash2 size={10} />
                Clear Output
              </button>
            </div>

            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 overflow-y-auto space-y-1 h-[340px]">
              {logs.length === 0 ? (
                <span className="text-slate-500 italic block py-4 text-center">No simulation events recorded yet.</span>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="leading-5 break-words select-text selection:bg-indigo-500/35">
                    {log}
                  </div>
                ))
              )}
              <div ref={logsEndRef}></div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
