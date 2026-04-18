import { EmailTemplate } from '../types';

class EmailService {
  private emails: EmailTemplate[] = [
    {
      id: 'welcome',
      subject: 'Chào mừng bạn đến với AmazeBid!',
      to: 'nguoidung@example.com',
      type: 'SYSTEM',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: '<h1>Chào mừng!</h1><p>Cảm ơn bạn đã tham gia AmazeBid - nền tảng thương mại điện tử lai thế hệ mới.</p>',
      lastModified: new Date().toISOString()
    },
    {
      id: 'bid-won-demo',
      subject: 'Chúc mừng! Bạn đã thắng đấu giá',
      to: 'nguoidung@example.com',
      type: 'AUCTION_WIN',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: '<h1>Thắng đấu giá!</h1><p>Bạn đã thắng sản phẩm <strong>iPhone 15 Pro</strong> với giá 25,000,000đ.</p>',
      lastModified: new Date().toISOString()
    }
  ];

  private listeners: ((emails: EmailTemplate[]) => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('mock_emails');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            this.emails = parsed;
          }
        }
      }
    } catch (e) {
      console.error('Failed to load emails', e);
    }
  }

  private save() {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('mock_emails', JSON.stringify(this.emails));
      }
    } catch {
      // Ignore
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l([...this.emails]));
  }

  subscribe(listener: (emails: EmailTemplate[]) => void) {
    this.listeners.push(listener);
    listener([...this.emails]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getAll() {
    return [...this.emails];
  }

  markAsRead(id: string) {
    this.emails = this.emails.map(e => e.id === id ? { ...e, isRead: true } : e);
    this.save();
  }

  markAllAsRead() {
    this.emails = this.emails.map(e => ({ ...e, isRead: true }));
    this.save();
  }

  deleteEmail(id: string) {
    this.emails = this.emails.filter(e => e.id !== id);
    this.save();
  }

  clearAll() {
    this.emails = [];
    this.save();
  }

  addTemplate(template: EmailTemplate) {
    this.emails.push(template);
    this.save();
  }

  updateTemplate(id: string, updates: Partial<EmailTemplate>) {
    this.emails = this.emails.map(e => e.id === id ? { ...e, ...updates, lastModified: new Date().toISOString() } : e);
    this.save();
  }
}

export const emailService = new EmailService();
export type { EmailTemplate };
