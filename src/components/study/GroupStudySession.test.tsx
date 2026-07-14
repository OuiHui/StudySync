import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { GroupStudySession } from './GroupStudySession';
import { useGroupStudySessionData } from '@/hooks/useGroupStudySessionData';

// Mock sub-components to keep unit test isolated
vi.mock('@/components/chat/ChatPopup', () => ({
  ChatPopup: () => <div data-testid="chat-popup" />
}));
vi.mock('../friends/InviteFriendsDialog', () => ({
  InviteFriendsDialog: () => <div data-testid="invite-dialog" />
}));
vi.mock('./SessionSettings', () => ({
  SessionSettings: () => <div data-testid="session-settings" />
}));
vi.mock('./ReflectionDialog', () => ({
  ReflectionDialog: () => <div data-testid="reflection-dialog" />
}));
vi.mock('./SessionInfoPanel', () => ({
  SessionInfoPanel: () => <div data-testid="session-info-panel" />
}));
vi.mock('./TimerDisplay', () => ({
  TimerDisplay: () => <div data-testid="timer-display" />
}));
vi.mock('./ParticipantsList', () => ({
  ParticipantsList: () => <div data-testid="participants-list" />
}));
vi.mock('./StudyGoals', () => ({
  StudyGoals: () => <div data-testid="study-goals" />
}));
vi.mock('./SessionNotes', () => ({
  SessionNotes: () => <div data-testid="session-notes" />
}));
vi.mock('@/components/common/settings/ColorCustomizer', () => ({
  ColorCustomizer: () => <div data-testid="color-customizer" />
}));

// Mock hook
vi.mock('@/hooks/useGroupStudySessionData', () => ({
  useGroupStudySessionData: vi.fn(),
}));

describe('GroupStudySession Component Leave Session Behavior', () => {
  const mockDefaultLeaveSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('bypasses warning modal when session has not started yet', () => {
    vi.mocked(useGroupStudySessionData).mockReturnValue({
      sessionId: 'session-123',
      sessionData: { status: 'scheduled', actual_start: null },
      participants: [],
      goals: [],
      notes: [],
      isHost: true,
      loading: false,
      goalsLoading: false,
      notesLoading: false,
      sessionSubject: 'Math',
      sessionTitle: 'Study Room',
      hostName: 'Alice',
      startTime: null,
      settingsOpen: false,
      setSettingsOpen: vi.fn(),
      reflectionOpen: false,
      setReflectionOpen: vi.fn(),
      savingReflection: false,
      onLeaveSession: mockDefaultLeaveSession,
      handleToggleStatus: vi.fn(),
      handleKickParticipant: vi.fn(),
      handleAddGoal: vi.fn(),
      handleToggleGoal: vi.fn(),
      handleDeleteGoal: vi.fn(),
      handleAddNote: vi.fn(),
      handleDeleteNote: vi.fn(),
      handleReflectionSubmit: vi.fn(),
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
      setSessionGoal: vi.fn(),
      user: { id: 'host-user' }
    } as any);

    const mockPropLeaveSession = vi.fn();

    render(
      <GroupStudySession 
        onLeaveSession={mockPropLeaveSession}
      />
    );

    const leaveButton = screen.getByRole('button', { name: /Leave Session/i });
    expect(leaveButton).toBeInTheDocument();
    fireEvent.click(leaveButton);

    // Should call defaultLeaveSession (direct leave) and NOT mockPropLeaveSession (dialog)
    expect(mockDefaultLeaveSession).toHaveBeenCalled();
    expect(mockPropLeaveSession).not.toHaveBeenCalled();
  });

  it('triggers leave dialog (prop onLeaveSession) when session has started', () => {
    vi.mocked(useGroupStudySessionData).mockReturnValue({
      sessionId: 'session-123',
      sessionData: { status: 'running', actual_start: '2026-07-14T10:00:00Z' },
      participants: [],
      goals: [],
      notes: [],
      isHost: true,
      loading: false,
      goalsLoading: false,
      notesLoading: false,
      sessionSubject: 'Math',
      sessionTitle: 'Study Room',
      hostName: 'Alice',
      startTime: '2026-07-14T10:00:00Z',
      settingsOpen: false,
      setSettingsOpen: vi.fn(),
      reflectionOpen: false,
      setReflectionOpen: vi.fn(),
      savingReflection: false,
      onLeaveSession: mockDefaultLeaveSession,
      handleToggleStatus: vi.fn(),
      handleKickParticipant: vi.fn(),
      handleAddGoal: vi.fn(),
      handleToggleGoal: vi.fn(),
      handleDeleteGoal: vi.fn(),
      handleAddNote: vi.fn(),
      handleDeleteNote: vi.fn(),
      handleReflectionSubmit: vi.fn(),
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
      setSessionGoal: vi.fn(),
      user: { id: 'host-user' }
    } as any);

    const mockPropLeaveSession = vi.fn();

    render(
      <GroupStudySession 
        onLeaveSession={mockPropLeaveSession}
      />
    );

    const leaveButton = screen.getByRole('button', { name: /Leave Session/i });
    expect(leaveButton).toBeInTheDocument();
    fireEvent.click(leaveButton);

    // Should call mockPropLeaveSession (dialog) and NOT mockDefaultLeaveSession directly
    expect(mockPropLeaveSession).toHaveBeenCalled();
    expect(mockDefaultLeaveSession).not.toHaveBeenCalled();
  });
});
