import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotesQueries } from './notes/queries';
import { supabase } from '@/integrations/supabase/client';

// Mock checkAuth to return a mock session
vi.mock('./utils', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    checkAuth: vi.fn().mockResolvedValue({ user: { id: 'current-user-123' } }),
  };
});

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      from: vi.fn(),
      rpc: vi.fn(),
    },
  };
});

describe('NotesQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getNotes should fetch notes and populate profiles without using invalid relationships', async () => {
    let capturedSelectArg = '';

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'notes') {
        return {
          select: (sel: string) => ({
            order: (_: any) => {
              capturedSelectArg = sel;
              return Promise.resolve({ data: [
                { id: 'n1', title: 't1', created_by: 'u1', note_group_shares: [] }
              ], error: null });
            }
          })
        };
      }

      if (table === 'profiles') {
        return {
          select: (_: string) => ({
            in: (_col: string, vals: any[]) => Promise.resolve({ data: [{ user_id: 'u1', display_name: 'User One' }], error: null })
          })
        };
      }

      return { select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) };
    });

    const result = await NotesQueries.getNotes();

    // Ensure we called notes select and that it did not request the profiles! relationship
    expect(capturedSelectArg).toBeTruthy();
    expect(capturedSelectArg.includes('profiles!')).toBe(false);

    // Ensure profiles were fetched and attached
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].profiles).toBeDefined();
    expect(result[0].profiles.user_id).toBe('u1');
  });

  it('getNote should fetch single note and attach profile', async () => {
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'notes') {
        return {
          select: (_: string) => ({
            eq: (_k: string, _v: any) => ({ single: () => Promise.resolve({ data: { id: 'n1', created_by: 'u1', note_group_shares: [] }, error: null }) })
          })
        };
      }

      if (table === 'profiles') {
        return {
          select: (_: string) => ({ in: (_: string, _v: any) => Promise.resolve({ data: [{ user_id: 'u1', display_name: 'User One' }], error: null }) })
        };
      }

      return { select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) };
    });

    const note = await NotesQueries.getNote('n1');
    expect(note).toBeDefined();
    expect(note?.profiles).toBeDefined();
    expect(note?.profiles.user_id).toBe('u1');
  });
});
