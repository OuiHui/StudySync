import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StudyProgress } from './StudyProgress';

describe('StudyProgress Component', () => {
  beforeEach(() => {
    let store: Record<string, string> = {};
    const mockLocalStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      }
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    });
    (global as any).localStorage = mockLocalStorage;
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders initial stats and default goals correctly', () => {
    const stats = {
      studyHoursToday: '2h',
      studyHoursThisWeek: '6h',
      activeGroups: '3',
      notesShared: '4',
      sessionsThisWeek: '5'
    };

    render(<StudyProgress stats={stats} />);

    // Check header title
    expect(screen.getByText('Study Progress This Week')).toBeInTheDocument();

    // Check study hours text: 6/40 hours (should NOT say 6h/40 hours)
    expect(screen.getByText('6/40 hours')).toBeInTheDocument();

    // Check sessions completed text: 5/10 sessions
    expect(screen.getByText('5/10 sessions')).toBeInTheDocument();

    // Check edit button exists
    expect(screen.getByRole('button', { name: /Edit Goals/i })).toBeInTheDocument();
  });

  it('loads goals from localStorage on mount', () => {
    localStorage.setItem('study_hours_goal', '25.5');
    localStorage.setItem('study_sessions_goal', '8');

    const stats = {
      studyHoursToday: '0h',
      studyHoursThisWeek: '0.25h',
      activeGroups: '0',
      notesShared: '0',
      sessionsThisWeek: '0'
    };

    render(<StudyProgress stats={stats} />);

    expect(screen.getByText('0.25/25.5 hours')).toBeInTheDocument();
    expect(screen.getByText('0/8 sessions')).toBeInTheDocument();
  });

  it('enters edit mode, updates goals, saves and persists to localStorage', () => {
    const stats = {
      studyHoursToday: '1h',
      studyHoursThisWeek: '5h',
      activeGroups: '1',
      notesShared: '2',
      sessionsThisWeek: '3'
    };

    render(<StudyProgress stats={stats} />);

    const editBtn = screen.getByRole('button', { name: /Edit Goals/i });
    fireEvent.click(editBtn);

    // Inputs should be visible
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(2);

    const hoursInput = inputs[0];
    const sessionsInput = inputs[1];

    expect(hoursInput).toHaveValue(40);
    expect(sessionsInput).toHaveValue(10);

    // Edit values
    fireEvent.change(hoursInput, { target: { value: '30' } });
    fireEvent.change(sessionsInput, { target: { value: '15' } });

    // Save
    const saveBtn = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveBtn);

    // Check updated text
    expect(screen.getByText('5/30 hours')).toBeInTheDocument();
    expect(screen.getByText('3/15 sessions')).toBeInTheDocument();

    // Check localStorage
    expect(localStorage.getItem('study_hours_goal')).toBe('30');
    expect(localStorage.getItem('study_sessions_goal')).toBe('15');
  });

  it('reverts goal values when clicking cancel', () => {
    const stats = {
      studyHoursToday: '0h',
      studyHoursThisWeek: '0h',
      activeGroups: '0',
      notesShared: '0',
      sessionsThisWeek: '0'
    };

    render(<StudyProgress stats={stats} />);

    const editBtn = screen.getByRole('button', { name: /Edit Goals/i });
    fireEvent.click(editBtn);

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '50' } });
    fireEvent.change(inputs[1], { target: { value: '20' } });

    // Cancel
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    // Goals should not have changed from default 40 and 10
    expect(screen.getByText('0/40 hours')).toBeInTheDocument();
    expect(screen.getByText('0/10 sessions')).toBeInTheDocument();

    // LocalStorage should be empty
    expect(localStorage.getItem('study_hours_goal')).toBeNull();
    expect(localStorage.getItem('study_sessions_goal')).toBeNull();
  });
});
