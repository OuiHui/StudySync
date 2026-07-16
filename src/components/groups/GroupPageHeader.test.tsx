import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { GroupPageHeader } from './GroupPageHeader';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
}));

vi.mock('@/contexts/UserProfileModalContext', () => ({
  useUserProfileModal: () => ({
    openProfile: vi.fn(),
  }),
}));

describe('GroupPageHeader Component', () => {
  const defaultGroup = {
    id: 'group-123',
    name: 'CS Study Club',
    subject: 'Computer Science',
    description: 'Study group for computer science students.',
    is_public: true,
    max_members: 5,
    created_by: 'creator-user-id',
  };

  const defaultMembers = [
    { id: 'member-1', name: 'Alice', avatar: null, role: 'member' },
    { id: 'member-2', name: 'Bob', avatar: null, role: 'member' },
  ];

  it('renders group details correctly', () => {
    render(
      <GroupPageHeader
        group={defaultGroup}
        enrolled={false}
        onBack={vi.fn()}
        chatOpen={false}
        onChatToggle={vi.fn()}
        onSettingsOpen={vi.fn()}
        onLeaveGroup={vi.fn()}
        onJoinGroup={vi.fn()}
        members={defaultMembers}
      />
    );

    expect(screen.getByText('CS Study Club')).toBeInTheDocument();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.getByText('Study group for computer science students.')).toBeInTheDocument();
  });

  it('displays the limit badge correctly', () => {
    render(
      <GroupPageHeader
        group={defaultGroup}
        enrolled={false}
        onBack={vi.fn()}
        chatOpen={false}
        onChatToggle={vi.fn()}
        onSettingsOpen={vi.fn()}
        onLeaveGroup={vi.fn()}
        onJoinGroup={vi.fn()}
        members={defaultMembers}
      />
    );

    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });

  it('enables Join button if not full', () => {
    render(
      <GroupPageHeader
        group={defaultGroup}
        enrolled={false}
        onBack={vi.fn()}
        chatOpen={false}
        onChatToggle={vi.fn()}
        onSettingsOpen={vi.fn()}
        onLeaveGroup={vi.fn()}
        onJoinGroup={vi.fn()}
        members={defaultMembers}
      />
    );

    const joinBtn = screen.getByRole('button', { name: /Join Group/i });
    expect(joinBtn).toBeInTheDocument();
    expect(joinBtn).not.toBeDisabled();
  });

  it('disables Join button and shows "Group Full" if group is full', () => {
    const fullMembers = [
      { id: 'member-1', name: 'Alice', avatar: null, role: 'member' },
      { id: 'member-2', name: 'Bob', avatar: null, role: 'member' },
      { id: 'member-3', name: 'Charlie', avatar: null, role: 'member' },
      { id: 'member-4', name: 'Dave', avatar: null, role: 'member' },
      { id: 'member-5', name: 'Eve', avatar: null, role: 'member' },
    ];

    render(
      <GroupPageHeader
        group={defaultGroup}
        enrolled={false}
        onBack={vi.fn()}
        chatOpen={false}
        onChatToggle={vi.fn()}
        onSettingsOpen={vi.fn()}
        onLeaveGroup={vi.fn()}
        onJoinGroup={vi.fn()}
        members={fullMembers}
      />
    );

    expect(screen.getByText('5 / 5')).toBeInTheDocument();
    const joinBtn = screen.getByRole('button', { name: /Group Full/i });
    expect(joinBtn).toBeInTheDocument();
    expect(joinBtn).toBeDisabled();
  });
});
