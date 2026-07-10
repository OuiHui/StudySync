import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ParticipantsList } from './ParticipantsList';
import { StudyGoals } from './StudyGoals';
import { SessionNotes } from './SessionNotes';

vi.mock('@/contexts/UserProfileModalContext', () => ({
  useUserProfileModal: () => ({
    openProfile: vi.fn(),
    closeProfile: vi.fn(),
  }),
}));

describe('GroupStudySession Features Unit Tests', () => {
  describe('ParticipantsList Component', () => {
    const mockParticipants = [
      {
        user_id: 'host-user-id',
        role: 'host',
        status: 'active',
        profiles: { id: 'p1', display_name: 'Host User', avatar_url: null, user_id: 'host-user-id' }
      },
      {
        user_id: 'part-user-id',
        role: 'participant',
        status: 'away',
        profiles: { id: 'p2', display_name: 'Participant User', avatar_url: null, user_id: 'part-user-id' }
      }
    ];

    it('renders participants name and status', () => {
      render(
        <ParticipantsList
          participants={mockParticipants}
          currentUserId="host-user-id"
          isHost={true}
        />
      );

      expect(screen.getByText('HU')).toBeInTheDocument();
      expect(screen.getByText('PU')).toBeInTheDocument();
    });



    it('renders remove button for non-host participants ONLY if the current user is host', () => {
      const mockKick = vi.fn();
      const { rerender } = render(
        <ParticipantsList
          participants={mockParticipants}
          currentUserId="host-user-id"
          isHost={true}
          onKickParticipant={mockKick}
        />
      );

      // Remove button exists for part-user-id
      const removeBtn = screen.getByTitle('Remove from session');
      expect(removeBtn).toBeInTheDocument();
      fireEvent.click(removeBtn);
      expect(mockKick).toHaveBeenCalledWith('part-user-id');

      // Now rerender with isHost = false
      rerender(
        <ParticipantsList
          participants={mockParticipants}
          currentUserId="part-user-id"
          isHost={false}
          onKickParticipant={mockKick}
        />
      );

      expect(screen.queryByTitle('Remove from session')).not.toBeInTheDocument();
    });
  });

  describe('StudyGoals Component', () => {
    const mockGoals = [
      { id: 'g1', session_id: 's1', title: 'Complete calculus homework', description: null, progress: 0, completed: false },
      { id: 'g2', session_id: 's1', title: 'Read physics chapter', description: null, progress: 0, completed: true }
    ];

    it('renders goals list correctly', () => {
      render(<StudyGoals goals={mockGoals} isHost={false} />);
      expect(screen.getByText('Complete calculus homework')).toBeInTheDocument();
      expect(screen.getByText('Read physics chapter')).toBeInTheDocument();
    });

    it('disables checkbox interaction and hides add/delete tools if user is not host', () => {
      render(<StudyGoals goals={mockGoals} isHost={false} />);
      
      const checkbox = screen.getAllByRole('checkbox')[0] as HTMLInputElement;
      expect(checkbox).toBeDisabled();
      expect(screen.queryByPlaceholderText('Add a new goal...')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Trash/i })).not.toBeInTheDocument();
    });

    it('enables checkboxes and allows adding new goals if user is host', () => {
      const mockAddGoal = vi.fn();
      render(<StudyGoals goals={mockGoals} isHost={true} onAddGoal={mockAddGoal} />);

      const checkbox = screen.getAllByRole('checkbox')[0] as HTMLInputElement;
      expect(checkbox).not.toBeDisabled();

      const input = screen.getByPlaceholderText('Add a new goal...');
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'Write draft essay' } });

      const form = input.closest('form')!;
      fireEvent.submit(form);
      expect(mockAddGoal).toHaveBeenCalledWith('Write draft essay');
    });
  });

  describe('SessionNotes Component', () => {
    const mockNotes = [
      { id: 'n1', title: 'Integration Notes', content: 'Use substitution', created_at: new Date().toISOString(), created_by: 'host-user-id', profiles: { display_name: 'Host User', avatar_url: null } }
    ];

    it('renders notes and allows sharing new notes', () => {
      const mockAddNote = vi.fn();
      render(
        <SessionNotes
          notes={mockNotes}
          isHost={false}
          currentUserId="part-user-id"
          onAddNote={mockAddNote}
        />
      );

      // Expand the subject "General"
      const generalBtn = screen.getByText('General');
      fireEvent.click(generalBtn);

      // Note title should be visible
      const noteTitleLink = screen.getByText('Integration Notes');
      expect(noteTitleLink).toBeInTheDocument();

      // Click to select/view note
      fireEvent.click(noteTitleLink);
      expect(screen.getByText('Use substitution')).toBeInTheDocument();

      // Close the note view
      const closeBtn = screen.getAllByRole('button')[0]; // X button is the only button for participant view
      fireEvent.click(closeBtn);

      // Click "New Note" to open create form
      const newNoteBtn = screen.getByRole('button', { name: /New Note/i });
      fireEvent.click(newNoteBtn);

      const titleInput = screen.getByPlaceholderText(/Title/i);
      const subjectInput = screen.getByPlaceholderText(/e.g. Mathematics/i);
      const contentInput = screen.getByPlaceholderText(/content/i);
      
      fireEvent.change(titleInput, { target: { value: 'Physics Equations' } });
      fireEvent.change(subjectInput, { target: { value: 'Physics' } });
      fireEvent.change(contentInput, { target: { value: 'F = ma' } });

      const form = titleInput.closest('form')!;
      fireEvent.submit(form);

      expect(mockAddNote).toHaveBeenCalledWith('Physics Equations', 'F = ma', 'Physics');
    });
  });
});
