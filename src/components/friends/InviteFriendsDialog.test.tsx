import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { InviteFriendsDialog } from './InviteFriendsDialog';
import { FriendsService, StudyGroupsService } from '@/services/database';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
}));

vi.mock('@/services/database', () => ({
  FriendsService: {
    getUserFriends: vi.fn(),
  },
  StudyGroupsService: {
    getGroupById: vi.fn(),
    getGroupMembers: vi.fn(),
    getGroupInvitations: vi.fn(),
    inviteUserToGroup: vi.fn(),
  },
  StudySessionsService: {
    getParticipants: vi.fn(),
  },
}));

describe('InviteFriendsDialog Component', () => {
  const mockFriendsList = [
    { user_id: 'friend-1', display_name: 'Friend One', email: 'friend1@example.com', avatar_url: null },
    { user_id: 'friend-2', display_name: 'Friend Two', email: 'friend2@example.com', avatar_url: null },
  ];

  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders invitation dialog and lists friends', async () => {
    vi.mocked(FriendsService.getUserFriends).mockResolvedValue(mockFriendsList);
    vi.mocked(StudyGroupsService.getGroupById).mockResolvedValue({ id: 'group-123', max_members: 10 });
    vi.mocked(StudyGroupsService.getGroupMembers).mockResolvedValue([
      { id: 'creator-id', name: 'Creator', role: 'admin' }
    ]);
    vi.mocked(StudyGroupsService.getGroupInvitations).mockResolvedValue([]);

    render(
      <InviteFriendsDialog
        isOpen={true}
        onClose={vi.fn()}
        type="group"
        id="group-123"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Friend One')).toBeInTheDocument();
      expect(screen.getByText('Friend Two')).toBeInTheDocument();
    });

    const inviteBtns = screen.getAllByRole('button', { name: /Invite/i });
    expect(inviteBtns.length).toBe(2);
    expect(inviteBtns[0]).not.toBeDisabled();
  });

  it('disables Invite buttons and shows warning banner if group is full', async () => {
    vi.mocked(FriendsService.getUserFriends).mockResolvedValue(mockFriendsList);
    vi.mocked(StudyGroupsService.getGroupById).mockResolvedValue({ id: 'group-123', max_members: 2 });
    vi.mocked(StudyGroupsService.getGroupMembers).mockResolvedValue([
      { id: 'member-1', name: 'Member One', role: 'admin' },
      { id: 'member-2', name: 'Member Two', role: 'member' }
    ]);
    vi.mocked(StudyGroupsService.getGroupInvitations).mockResolvedValue([]);

    render(
      <InviteFriendsDialog
        isOpen={true}
        onClose={vi.fn()}
        type="group"
        id="group-123"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/maximum member limit/i)).toBeInTheDocument();
      expect(screen.getByText(/2 members/i)).toBeInTheDocument();
    });

    const inviteBtns = screen.getAllByRole('button', { name: /Invite/i });
    expect(inviteBtns.length).toBe(2);
    expect(inviteBtns[0]).toBeDisabled();
    expect(inviteBtns[1]).toBeDisabled();
  });
});
