import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { ChatPopup } from './ChatPopup';
import { ChatService } from '@/services/database';
import { RealtimeService } from '@/services/realtime';

vi.mock('@/services/database', () => ({
  ChatService: {
    getOrCreateGroupConversation: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

vi.mock('@/services/realtime', () => ({
  RealtimeService: {
    trackPresence: vi.fn(),
    subscribeToPresence: vi.fn(),
    subscribeToMessages: vi.fn(),
    unsubscribe: vi.fn(),
    untrackPresence: vi.fn(),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', user_metadata: { display_name: 'Test User' } },
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/contexts/UserProfileModalContext', () => ({
  useUserProfileModal: () => ({
    openProfile: vi.fn(),
  }),
}));

describe('ChatPopup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const store: Record<string, string> = {};
    const mockLocalStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
      length: 0,
      key: vi.fn(),
    };
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  it('deduplicates messages received via realtime and optimistic update', async () => {
    let messageCallback: ((msg: any) => void) | null = null;
    (RealtimeService.subscribeToMessages as any).mockImplementation((_convId: string, onNewMessage: any) => {
      messageCallback = onNewMessage;
    });

    (ChatService.getOrCreateGroupConversation as any).mockResolvedValue({ id: 'conv-123' });
    (ChatService.getMessages as any).mockResolvedValue([]);

    const sentMsg = {
      id: 'msg-abc-123',
      conversation_id: 'conv-123',
      sender_id: 'user-1',
      content: 'Hello world',
      created_at: new Date().toISOString(),
      profiles: { display_name: 'Test User', avatar_url: '' },
    };

    (ChatService.sendMessage as any).mockResolvedValue(sentMsg);

    render(
      <ChatPopup
        isOpen={true}
        onClose={vi.fn()}
        groupName="Test Group"
        groupId="group-123"
        isInline={true}
      />
    );

    await waitFor(() => {
      expect(ChatService.getOrCreateGroupConversation).toHaveBeenCalledWith('group-123');
    });

    const input = screen.getByPlaceholderText('Message the group');
    fireEvent.change(input, { target: { value: 'Hello world' } });

    const sendButton = screen.getByRole('button');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getAllByText('Hello world')).toHaveLength(1);
    });

    // Simulate realtime event firing with the exact same sent message
    if (messageCallback) {
      act(() => {
        (messageCallback as any)(sentMsg);
      });
    }

    // Verify message is still rendered exactly once
    expect(screen.getAllByText('Hello world')).toHaveLength(1);
  });
});
