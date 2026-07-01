import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CreateSessionDialog } from './CreateSessionDialog';
import { StudyGroupsService } from '@/services/database';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'creator-user-id', email: 'creator@example.com' },
  }),
}));

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

vi.mock('@/services/database', () => ({
  StudyGroupsService: {
    getUserGroups: vi.fn(),
  },
}));

const mockSingle = vi.fn();
const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
const mockInsertSession = vi.fn().mockReturnValue({ select: mockSelect });
const mockInsertParticipant = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('CreateSessionDialog Component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    
    vi.mocked(supabase.from).mockImplementation((table: any): any => {
      if (table === 'study_sessions') {
        return {
          insert: mockInsertSession,
        };
      }
      if (table === 'session_participants') {
        return {
          insert: mockInsertParticipant,
        };
      }
      return {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };
    });
  });

  it('renders trigger button and opens dialog on click, fetching groups', async () => {
    const mockGroups = [{ id: 'group-1', name: 'Linear Algebra', subject: 'Math' }];
    vi.mocked(StudyGroupsService.getUserGroups).mockResolvedValue(mockGroups);

    render(<CreateSessionDialog />);

    const triggerBtn = screen.getByRole('button', { name: /Create Session/i });
    expect(triggerBtn).toBeInTheDocument();

    fireEvent.click(triggerBtn);

    expect(screen.getByText('Create Study Session')).toBeInTheDocument();
    expect(StudyGroupsService.getUserGroups).toHaveBeenCalled();
  });

  it('validates empty inputs and submits session details to Supabase', async () => {
    const mockGroups = [{ id: 'group-1', name: 'Linear Algebra', subject: 'Math' }];
    vi.mocked(StudyGroupsService.getUserGroups).mockResolvedValue(mockGroups);
    mockSingle.mockResolvedValue({ data: { id: 'new-session-id' }, error: null });

    const onSessionCreatedMock = vi.fn();
    render(<CreateSessionDialog onSessionCreated={onSessionCreatedMock} />);

    fireEvent.click(screen.getByRole('button', { name: /Create Session/i }));

    const submitBtn = screen.getByRole('button', { name: /Create Session/i });
    expect(submitBtn).toBeDisabled();

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Session Title/i), { target: { value: 'Homework Help' } });
    fireEvent.change(screen.getByLabelText(/Start Time/i), { target: { value: '2026-07-02T10:00' } });
    fireEvent.change(screen.getByLabelText(/End Time/i), { target: { value: '2026-07-02T12:00' } });

    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('study_sessions');
      expect(mockInsertSession).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Homework Help',
        max_participants: 20,
        is_public: false,
        created_by: 'creator-user-id',
        status: 'scheduled',
      }));
      expect(supabase.from).toHaveBeenCalledWith('session_participants');
      expect(mockInsertParticipant).toHaveBeenCalledWith({
        session_id: 'new-session-id',
        user_id: 'creator-user-id',
        is_attending: true,
      });
    });

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Success',
      description: 'Study session created successfully!',
    }));
    expect(onSessionCreatedMock).toHaveBeenCalled();
  });
});
