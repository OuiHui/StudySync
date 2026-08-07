import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FriendsService } from './friends';
import { supabase } from '@/integrations/supabase/client';

// Mock checkAuth to return a mock session
vi.mock('./utils', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    checkAuth: vi.fn().mockResolvedValue({ user: { id: 'current-user-123' } }),
  };
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }));

describe('FriendsService.searchUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls RPC with both search_term and current_user_id', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: [{ id: 'u1' }], error: null });

    const res = await FriendsService.searchUsers('alice');

    expect(supabase.rpc).toHaveBeenCalledWith('search_users', {
      search_term: 'alice',
      current_user_id: 'current-user-123'
    });

    expect(res).toEqual([{ id: 'u1' }]);
  });
});
