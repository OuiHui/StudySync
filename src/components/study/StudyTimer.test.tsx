import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { StudyTimer } from './StudyTimer';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' }
  })
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { created_by: 'test-user-id', subject: null }, error: null })
        })
      })
    })
  }
}));

describe('StudyTimer Component (Integration)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  it('renders correctly with initial state and defaults', () => {
    render(<StudyTimer />);
    
    // Topic title
    expect(screen.getByText('Integration by Parts - Advanced Techniques')).toBeInTheDocument();
    
    // Initial display time is 25:00
    expect(screen.getByText('25:00')).toBeInTheDocument();
    
    // Start button
    expect(screen.getByRole('button', { name: /Start/i })).toBeInTheDocument();
  });

  it('can edit and update the study topic', () => {
    const { container } = render(<StudyTimer />);
    
    // Edit button (containing the pen icon)
    const editBtn = container.querySelector('.lucide-pen')?.closest('button')!;
    fireEvent.click(editBtn);

    // Input should be present
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Integration by Parts - Advanced Techniques');

    // Change input value
    fireEvent.change(input, { target: { value: 'Quantum Physics Intro' } });

    // Save button (green check icon button)
    const saveBtn = screen.getAllByRole('button').find(btn => btn.classList.contains('text-green-600'));
    expect(saveBtn).toBeInTheDocument();
    fireEvent.click(saveBtn!);

    // Check if new topic is rendered
    expect(screen.getByText('Quantum Physics Intro')).toBeInTheDocument();
  });

  it('should toggle timer state on button click', () => {
    render(<StudyTimer />);
    
    const startBtn = screen.getByRole('button', { name: /Start/i });
    fireEvent.click(startBtn);

    // Should now show Pause
    expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();

    // Advance time and check timer countdown
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('24:57')).toBeInTheDocument();
  });
});
