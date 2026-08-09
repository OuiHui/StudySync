import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { NotificationSettingsPopup } from './NotificationSettingsPopup';
import { ProfileService } from '@/services/database';

vi.mock('@/services/database', () => ({
  ProfileService: {
    getCurrentUser: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('NotificationSettingsPopup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and excludes Digest & Updates section', async () => {
    vi.mocked(ProfileService.getCurrentUser).mockResolvedValue({
      id: 'user1',
      notification_settings: {
        emailNotifications: true,
        pushNotifications: true,
        studyReminders: true,
        groupMessages: true,
        sessionInvites: true,
        friendRequests: true,
      },
    } as any);

    render(<NotificationSettingsPopup isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Notification Settings')).toBeInTheDocument();
    });

    expect(screen.getByText('Study & Learning')).toBeInTheDocument();
    expect(screen.getByText('Social')).toBeInTheDocument();
    expect(screen.getByText('Communication')).toBeInTheDocument();

    // Verify Digest & Updates section is NOT rendered
    expect(screen.queryByText('Digest & Updates')).not.toBeInTheDocument();
    expect(screen.queryByText('Weekly digest')).not.toBeInTheDocument();
    expect(screen.queryByText('System updates')).not.toBeInTheDocument();
  });

  it('calls ProfileService.updateProfile on Save Settings click', async () => {
    vi.mocked(ProfileService.getCurrentUser).mockResolvedValue({
      id: 'user1',
      notification_settings: {
        emailNotifications: true,
        pushNotifications: true,
        studyReminders: true,
        groupMessages: true,
        sessionInvites: true,
        friendRequests: true,
      },
    } as any);

    vi.mocked(ProfileService.updateProfile).mockResolvedValue({} as any);

    const handleClose = vi.fn();
    render(<NotificationSettingsPopup isOpen={true} onClose={handleClose} />);

    await waitFor(() => {
      expect(screen.getByText('Notification Settings')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(ProfileService.updateProfile).toHaveBeenCalledWith({
        notification_settings: {
          emailNotifications: true,
          pushNotifications: true,
          studyReminders: true,
          groupMessages: true,
          sessionInvites: true,
          friendRequests: true,
        },
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
