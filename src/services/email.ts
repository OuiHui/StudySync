import { NotificationSettings } from '@/hooks/useProfileData';

export interface SentEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  notificationType: string;
  sentAt: string;
}

export class EmailService {
  private static STORAGE_KEY = 'studysync_sent_emails';
  private static inMemoryStore: SentEmail[] = [];

  /**
   * Dispatches an email notification, logging it to the console and storing it in local audit logs.
   */
  static async sendEmail(
    to: string,
    subject: string,
    body: string,
    notificationType: string = 'general'
  ): Promise<SentEmail> {
    const email: SentEmail = {
      id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      to,
      subject,
      body,
      notificationType,
      sentAt: new Date().toISOString(),
    };

    console.log(`[EmailService] 📧 Email Sent -> To: ${to} | Subject: "${subject}"`);
    console.log(`[EmailService] Body:\n${body}`);

    this.inMemoryStore.unshift(email);

    // Persist to audit log in localStorage for verification and testing
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const existing = this.getSentEmails();
        // Keep up to 100 most recent emails
        window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing.slice(0, 100)));
      }
    } catch (e) {
      console.error('Error saving sent email to audit log:', e);
    }

    return email;
  }

  /**
   * Retrieves audit log of sent emails.
   */
  static getSentEmails(): SentEmail[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
          return JSON.parse(raw);
        }
      }
    } catch (e) {
      console.error('Error reading sent emails audit log:', e);
    }
    return this.inMemoryStore;
  }

  /**
   * Clears sent emails audit log.
   */
  static clearSentEmails(): void {
    this.inMemoryStore = [];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (e) {
      console.error('Error clearing sent emails:', e);
    }
  }

  /**
   * Evaluates user notification preferences and dispatches an email if allowed.
   */
  static async processNotificationEmail(
    notification: {
      type: string;
      title: string;
      message: string;
      user_id?: string;
    },
    recipientEmail: string,
    settings?: NotificationSettings
  ): Promise<SentEmail | null> {
    if (!recipientEmail) {
      return null;
    }

    // Default settings if none provided
    const userSettings: NotificationSettings = settings || {
      emailNotifications: true,
      pushNotifications: true,
      studyReminders: true,
      groupMessages: true,
      sessionInvites: true,
      friendRequests: true,
    };

    // Global master switch check
    if (!userSettings.emailNotifications) {
      console.log('[EmailService] Email suppressed: user emailNotifications setting is OFF.');
      return null;
    }

    // Category check based on notification type
    const notificationType = notification.type;
    let allowed = true;

    if (notificationType === 'friend' && !userSettings.friendRequests) {
      allowed = false;
    } else if (notificationType === 'session' && !userSettings.sessionInvites && !userSettings.studyReminders) {
      allowed = false;
    } else if (notificationType === 'group' && !userSettings.groupMessages && !userSettings.sessionInvites) {
      allowed = false;
    }

    if (!allowed) {
      console.log(`[EmailService] Email suppressed: category setting for type '${notificationType}' is OFF.`);
      return null;
    }

    const subject = `StudySync: ${notification.title}`;
    const body = `Hello,\n\nYou have a new notification on StudySync:\n\n${notification.title}\n${notification.message}\n\nLog in to StudySync to view details.\n\nBest regards,\nThe StudySync Team`;

    return this.sendEmail(recipientEmail, subject, body, notificationType);
  }
}
