import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FriendsService } from './friends';
import { supabase } from '@/integrations/supabase/client';

// Mock checkAuth to return a mock session
vi.mock('./utils', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    checkAuth: vi.fn().mockResolvedValue({
      user: { id: 'current-user-123' },
    }),
  };
});

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      rpc: vi.fn(),
      from: vi.fn(),
    },
  };
});

describe('FriendsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMutualFriends', () => {
    it('should query mutual friends from database RPC get_mutual_friends', async () => {
      const mockMutualFriends = [
        {
          friend_user_id: 'mutual-friend-1',
          display_name: 'Mutual Friend 1',
          is_mutual: true,
        },
      ];

      (supabase.rpc as any).mockResolvedValue({
        data: mockMutualFriends,
        error: null,
      });

      const result = await FriendsService.getMutualFriends('target-user-456');

      expect(supabase.rpc).toHaveBeenCalledWith('get_mutual_friends', {
        target_user_id: 'target-user-456',
        current_user_id: 'current-user-123',
      });
      expect(result).toEqual(mockMutualFriends);
    });

    it('should handle errors gracefully and return empty array', async () => {
      (supabase.rpc as any).mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      const result = await FriendsService.getMutualFriends('target-user-456');
      expect(result).toEqual([]);
    });
  });

  describe('getUserProfile', () => {
    it('should include friendsCount in profile metadata', async () => {
      const createChain = (table: string) => {
        const chain: any = {
          select: vi.fn().mockImplementation(() => chain),
          eq: vi.fn().mockImplementation(() => chain),
          or: vi.fn().mockImplementation(() => chain),
          in: vi.fn().mockImplementation(() => chain),
          single: vi.fn().mockImplementation(() => {
            if (table === 'profiles') {
              return Promise.resolve({
                data: {
                  user_id: 'target-user-456',
                  display_name: 'Target User',
                  email: 'target@example.com',
                },
                error: null,
              });
            }
            return Promise.resolve({ data: null, error: null });
          }),
          maybeSingle: vi.fn().mockImplementation(() => {
            if (table === 'profiles') {
              return Promise.resolve({
                data: {
                  user_id: 'target-user-456',
                  display_name: 'Target User',
                  email: 'target@example.com',
                },
                error: null,
              });
            }
            return Promise.resolve({ data: null, error: null });
          }),
        };

        chain.then = (onfulfilled: any) => {
          let resolvedValue: any = { data: [], error: null };
          if (table === 'friendships') {
            resolvedValue = { count: 5, data: [], error: null };
          }
          return Promise.resolve(resolvedValue).then(onfulfilled);
        };

        return chain;
      };

      (supabase.from as any).mockImplementation((table: string) => createChain(table));

      (supabase.rpc as any).mockImplementation((rpcName: string) => {
        if (rpcName === 'get_user_friends') {
          return Promise.resolve({
            data: Array(5).fill({}),
            error: null,
          });
        }
        if (rpcName === 'get_mutual_friends') {
          return Promise.resolve({
            data: [],
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const profile = await FriendsService.getUserProfile('target-user-456', 'current-user-123');

      expect(profile).toBeDefined();
      expect(profile?.friendsCount).toBe(5);
    });
  });
});
