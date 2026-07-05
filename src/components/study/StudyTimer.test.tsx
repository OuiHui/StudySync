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
    
    // Initial display time is 25:00
    expect(screen.getByText('25:00')).toBeInTheDocument();
    
    // Start button
    expect(screen.getByRole('button', { name: /Start/i })).toBeInTheDocument();
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
