import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { StudyGroupsBrowse } from './StudyGroupsBrowse';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
}));

const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

const mockAvailableGroups = [
  {
    id: 'group-1',
    name: 'CS 1331 Study Group',
    subject: 'CS 1331',
    description: 'Java Programming',
    members: 5,
    admin: 'Admin 1',
    sessions: 2,
    isEnlisted: false,
    color: 'bg-blue-500',
    icon: 'BookOpen',
    created_at: new Date().toISOString(),
    max_members: 10,
    created_by: 'other-user-1',
    is_public: true
  },
  {
    id: 'group-2',
    name: 'Physics Mechanics Group',
    subject: 'Physics',
    description: 'Newtonian Dynamics',
    members: 8,
    admin: 'Admin 2',
    sessions: 3,
    isEnlisted: false,
    color: 'bg-purple-500',
    icon: 'Atom',
    created_at: new Date().toISOString(),
    max_members: 10,
    created_by: 'other-user-2',
    is_public: true
  }
];

vi.mock('@/hooks/usePublicGroups', () => ({
  usePublicGroups: () => ({
    availableGroups: mockAvailableGroups,
    loading: false,
    error: null,
    loadPublicGroups: vi.fn(),
    handleCreateGroup: vi.fn(),
    handleJoinGroup: vi.fn(),
  }),
}));

vi.mock('@/hooks/useUserGroups', () => ({
  useUserGroups: () => ({
    studyGroups: [],
  }),
}));

describe('StudyGroupsBrowse Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all groups initially and dynamic course options in dropdown', () => {
    render(<StudyGroupsBrowse onSelectGroup={vi.fn()} />);

    expect(screen.getByText('CS 1331 Study Group')).toBeInTheDocument();
    expect(screen.getByText('Physics Mechanics Group')).toBeInTheDocument();

    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toBeInTheDocument();

    expect(screen.getByRole('option', { name: 'CS 1331' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Psychology' })).not.toBeInTheDocument();
  });

  it('toggles visible groups when selecting a specific course from dropdown', () => {
    render(<StudyGroupsBrowse onSelectGroup={vi.fn()} />);

    const selectElement = screen.getByRole('combobox');
    fireEvent.change(selectElement, { target: { value: 'CS 1331' } });

    expect(screen.getByText('CS 1331 Study Group')).toBeInTheDocument();
    expect(screen.queryByText('Physics Mechanics Group')).not.toBeInTheDocument();
  });
});
