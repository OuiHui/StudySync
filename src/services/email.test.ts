import { describe, it, expect, beforeEach } from 'vitest';
import { EmailService } from './email';

describe('EmailService', () => {
  beforeEach(() => {
    EmailService.clearSentEmails();
  });

  it('should send and audit log emails', async () => {
    const result = await EmailService.sendEmail(
      'user@example.com',
      'StudySync Test',
      'Hello test body',
      'friend'
    );

    expect(result).toBeDefined();
    expect(result.to).toBe('user@example.com');
    expect(result.subject).toBe('StudySync Test');
    expect(result.notificationType).toBe('friend');

    const sentHistory = EmailService.getSentEmails();
    expect(sentHistory).toHaveLength(1);
    expect(sentHistory[0].subject).toBe('StudySync Test');
  });

  it('should process notification email when user preferences allow it', async () => {
    const notification = {
      type: 'friend',
      title: 'New Friend Request',
      message: 'Alice sent you a friend request.',
    };

    const settings = {
      emailNotifications: true,
      pushNotifications: true,
      studyReminders: true,
      groupMessages: true,
      sessionInvites: true,
      friendRequests: true,
    };

    const sent = await EmailService.processNotificationEmail(
      notification,
      'user@example.com',
      settings
    );

    expect(sent).not.toBeNull();
    expect(sent?.to).toBe('user@example.com');
    expect(sent?.subject).toContain('New Friend Request');
  });

  it('should suppress email when global emailNotifications setting is OFF', async () => {
    const notification = {
      type: 'friend',
      title: 'New Friend Request',
      message: 'Alice sent you a friend request.',
    };

    const settings = {
      emailNotifications: false,
      pushNotifications: true,
      studyReminders: true,
      groupMessages: true,
      sessionInvites: true,
      friendRequests: true,
    };

    const sent = await EmailService.processNotificationEmail(
      notification,
      'user@example.com',
      settings
    );

    expect(sent).toBeNull();
    expect(EmailService.getSentEmails()).toHaveLength(0);
  });

  it('should suppress email when category preference is OFF', async () => {
    const notification = {
      type: 'friend',
      title: 'New Friend Request',
      message: 'Alice sent you a friend request.',
    };

    const settings = {
      emailNotifications: true,
      pushNotifications: true,
      studyReminders: true,
      groupMessages: true,
      sessionInvites: true,
      friendRequests: false,
    };

    const sent = await EmailService.processNotificationEmail(
      notification,
      'user@example.com',
      settings
    );

    expect(sent).toBeNull();
    expect(EmailService.getSentEmails()).toHaveLength(0);
  });
});
