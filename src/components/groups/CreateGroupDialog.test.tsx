import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CreateGroupDialog } from './CreateGroupDialog';
import { StudyGroupsService } from '@/services/database';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
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
    createGroup: vi.fn(),
  },
}));

describe('CreateGroupDialog Component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders trigger button initially and opens dialog on click', () => {
    render(<CreateGroupDialog />);
    
    const triggerBtn = screen.getByRole('button', { name: /Create Group/i });
    expect(triggerBtn).toBeInTheDocument();
    
    fireEvent.click(triggerBtn);
    
    expect(screen.getByText('Create Study Group')).toBeInTheDocument();
    expect(screen.getByLabelText(/Group Name/i)).toBeInTheDocument();
  });

  it('validates required fields and enables/disables the submit button', () => {
    render(<CreateGroupDialog />);
    
    fireEvent.click(screen.getByRole('button', { name: /Create Group/i }));
    
    const submitBtn = screen.getAllByRole('button', { name: /Create Group/i }).find(btn => btn.getAttribute('type') === 'submit')!;
    expect(submitBtn).toBeDisabled();

    const nameInput = screen.getByLabelText(/Group Name/i);
    fireEvent.change(nameInput, { target: { value: 'Study Buddies' } });

    expect(submitBtn).not.toBeDisabled();
  });

  it('submits form data successfully using StudyGroupsService', async () => {
    const mockCreatedGroup = { id: 'new-group-id', name: 'Study Buddies' };
    vi.mocked(StudyGroupsService.createGroup).mockResolvedValue(mockCreatedGroup);

    const onGroupCreatedMock = vi.fn();
    render(<CreateGroupDialog onGroupCreated={onGroupCreatedMock} />);

    fireEvent.click(screen.getByRole('button', { name: /Create Group/i }));

    fireEvent.change(screen.getByLabelText(/Group Name/i), { target: { value: 'Study Buddies' } });
    fireEvent.change(screen.getByLabelText(/Subject/i), { target: { value: 'Chemistry' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Weekly chem study session.' } });
    fireEvent.change(screen.getByLabelText(/Max Members/i), { target: { value: '25' } });

    const isPublicSwitch = screen.getByLabelText(/Public group/i);
    fireEvent.click(isPublicSwitch);

    const submitBtn = screen.getAllByRole('button', { name: /Create Group/i }).find(btn => btn.getAttribute('type') === 'submit')!;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(StudyGroupsService.createGroup).toHaveBeenCalledWith({
        name: 'Study Buddies',
        subject: 'Chemistry',
        description: 'Weekly chem study session.',
        is_public: false,
        max_members: 25,
      });
    });

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Success',
      description: 'Study group created successfully!',
    }));

    expect(onGroupCreatedMock).toHaveBeenCalledWith(mockCreatedGroup);
  });
});
