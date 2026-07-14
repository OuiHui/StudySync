import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGroupStudySessionData } from './useGroupStudySessionData';
import { StudySessionsService } from '@/services/database';
import { NotesService } from '@/services/notes';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' }
  })
}));

// Mock SessionContext
vi.mock('@/contexts/SessionContext', () => ({
  useSession: () => ({
    isInGroupSession: true,
    setIsInGroupSession: vi.fn()
  })
}));

// Mock GlobalTimerContext
vi.mock('@/contexts/GlobalTimerContext', () => ({
  useGlobalTimer: () => ({
    handleTimerUpdate: vi.fn()
  })
}));

// Mock UserProfileModalContext
vi.mock('@/contexts/UserProfileModalContext', () => ({
  useUserProfileModal: () => ({
    openProfile: vi.fn(),
    closeProfile: vi.fn(),
  }),
}));

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock global timer
vi.mock('./useTimer', () => ({
  useTimer: () => ({
    workDuration: 25 * 60,
    breakDuration: 5 * 60,
    longBreakDuration: 15 * 60,
    timeLeft: 25 * 60,
    isActive: false,
    mode: 'work',
    sessions: 0,
    sessionGoal: 4,
    progress: 0,
    currentCycle: 1,
    handleSettingsChange: vi.fn(),
    toggleTimer: vi.fn(),
    resetTimer: vi.fn(),
    setSessionGoal: vi.fn()
  }),
}));

// Mock services
vi.mock('@/services/database', () => ({
  StudySessionsService: {
    getSession: vi.fn().mockResolvedValue({
      id: 'test-session-id',
      title: 'ML Sync Session',
      status: 'active',
      created_by: 'test-user-id'
    }),
    getParticipants: vi.fn().mockResolvedValue([
      { user_id: 'test-user-id', role: 'host', status: 'active', profiles: { display_name: 'Sarah Chen' } }
    ]),
    getGoals: vi.fn().mockResolvedValue([]),
    joinSession: vi.fn().mockResolvedValue({}),
    updateParticipantStatus: vi.fn().mockResolvedValue({})
  }
}));

vi.mock('@/services/notes', () => ({
  NotesService: {
    getSessionNotes: vi.fn().mockResolvedValue([])
  }
}));

// Mock Supabase Client
const listeners: Record<string, Function> = {};
const mockChannel = {
  on: vi.fn().mockImplementation((type, config, callback) => {
    if (type === 'postgres_changes') {
      listeners[config.table] = callback;
    }
    return mockChannel;
  }),
  subscribe: vi.fn().mockImplementation((cb) => {
    cb?.('SUBSCRIBED');
    return mockChannel;
  }),
  track: vi.fn().mockResolvedValue({}),
  presenceState: vi.fn().mockReturnValue({}),
  send: vi.fn().mockResolvedValue({})
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: vi.fn().mockImplementation(() => mockChannel),
    removeChannel: vi.fn(),
  }
}));

describe('useGroupStudySessionData real-time sync hook tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    const store: Record<string, string> = {
      'active_group_session_id': 'test-session-id'
    };
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); }
    });
  });

  it('subscribes to real-time events and refreshes participants client-side on change', async () => {
    const { result } = renderHook(() => useGroupStudySessionData());

    // Allow async state resolution
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(StudySessionsService.getParticipants).toHaveBeenCalledWith('test-session-id');
    expect(listeners['session_participants']).toBeDefined();

    // Reset calls to verify subsequent real-time triggers
    vi.mocked(StudySessionsService.getParticipants).mockClear();

    // Simulate real-time insert event for another user joining
    await act(async () => {
      listeners['session_participants']({
        new: { session_id: 'test-session-id', user_id: 'new-user-id', status: 'active' },
        old: null
      });
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    // Verify it re-loads participants dynamically
    expect(StudySessionsService.getParticipants).toHaveBeenCalledWith('test-session-id');
  });
});
