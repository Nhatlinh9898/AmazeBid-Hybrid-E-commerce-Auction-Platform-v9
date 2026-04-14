import { Order, Product, User } from '../types';

export interface EmailTemplate {
  id: string;
  to: string;
  subject: string;
  htmlContent: string;
  timestamp: string;
  type: 'PURCHASE' | 'INVOICE' | 'KYC' | 'AUCTION_WIN' | 'PAYMENT_CONFIRMATION' | 'SHIPPING';
  isRead: boolean;
}

class EmailService {
  private emails: EmailTemplate[] = [];
  private listeners: ((emails: EmailTemplate[]) => void)[] = [];

  constructor() {
    // Load from local storage if available
    const saved = localStorage.getItem('mock_emails');
    if (saved) {
      try {
        this.emails = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load emails', e);
      }
    }
  }

  private save() {
    localStorage.setItem('mock_emails', JSON.stringify(this.emails));
    this.notifyListeners();
  }

  subscribe(listener: (emails: EmailTemplate[]) => void) {
    this.listeners.push(listener);
    listener(this.emails);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l([...this.emails]));
  }

  getEmails() {
    return [...this.emails].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  markAsRead(id: string) {
    const email = this.emails.find(e => e.id === id);
    if (email && !email.isRead) {
      email.isRead = true;
      this.save();
    }
  }

  markAllAsRead() {
    let changed = false;
    this.emails.forEach(e => {
      if (!e.isRead) {
        e.isRead = true;
        changed = true;
      }
    });
    if (changed) this.save();
  }

  deleteEmail(id: string) {
    this.emails = this.emails.filter(e => e.id !== id);
    this.save();
  }

  getUnreadCount() {
    return this.emails.filter(e => !e.isRead).length;
  }

  clearAll() {
    this.emails = [];
    this.save();
  }

  private async sendEmail(email: Omit<EmailTemplate, 'id' | 'timestamp' | 'isRead'>) {
    const newEmail: EmailTemplate = {
      ...email,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    this.emails.unshift(newEmail);
    this.save();
    console.log(`[Email Service] Mock email saved for ${email.to}: ${email.subject}`);

    // Try to send real email if it's a real-looking address and not a mock one
    if (email.to.includes('@') && !email.to.includes('example.com')) {
      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email.to,
            subject: email.subject,
            html: email.htmlContent
          })
        });
        
        const result = await response.json();
        if (result.success) {
          console.log(`[Email Service] Real email sent successfully to ${email.to}`);
        } else {
          console.warn(`[Email Service] Real email failed: ${result.message || result.error}`);
        }
      } catch (err) {
        console.error('[Email Service] Error calling real email API:', err);
      }
    }
  }

  // --- Specific Email Generators ---

  sendPurchaseConfirmation(user: User, order: Order) {
    const itemsHtml = order.items.map(item => `
      <div style="display: flex; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
        <img src="${item.image}" alt="${item.title}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 15px;" />
        <div>
          <h4 style="margin: 0 0 5px 0; color: #333;">${item.title}</h4>
          <p style="margin: 0; color: #666;">Số lượng: ${item.quantity}</p>
          <p style="margin: 5px 0 0 0; font-weight: bold; color: #e11d48;">${(item.price * item.quantity).toLocaleString()} đ</p>
        </div>
      </div>
    `).join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #e11d48; margin: 0;">Xác Nhận Đơn Hàng</h2>
          <p style="color: #666; margin-top: 5px;">Cảm ơn bạn đã mua sắm tại hệ thống của chúng tôi!</p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #333;">Thông tin đơn hàng #${order.id.substring(0, 8).toUpperCase()}</h3>
          <p><strong>Ngày đặt:</strong> ${new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
          <p><strong>Trạng thái:</strong> ${order.status}</p>
          <p><strong>Phương thức thanh toán:</strong> ${order.paymentMethod || 'Chưa xác định'}</p>
          <p><strong>Địa chỉ giao hàng:</strong> ${order.shippingAddress || 'Chưa cung cấp'}</p>
        </div>

        <h3 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">Chi tiết sản phẩm</h3>
        ${itemsHtml}

        <div style="text-align: right; margin-top: 20px; font-size: 18px;">
          <strong>Tổng cộng: <span style="color: #e11d48;">${order.totalAmount.toLocaleString()} đ</span></strong>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 12px;">
          <p>Đây là email tự động, vui lòng không trả lời email này.</p>
          <p>&copy; 2026 E-Commerce Platform. All rights reserved.</p>
        </div>
      </div>
    `;

    this.sendEmail({
      to: user.email,
      subject: `Xác nhận đơn hàng #${order.id.substring(0, 8).toUpperCase()}`,
      htmlContent,
      type: 'PURCHASE'
    });
  }

  sendSellerNotification(sellerEmail: string, order: Order) {
    const itemsHtml = order.items.map(item => `
      <li style="margin-bottom: 10px;">
        <strong>${item.title}</strong> (x${item.quantity}) - ${(item.price * item.quantity).toLocaleString()} đ
      </li>
    `).join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #10b981;">Bạn có đơn hàng mới!</h2>
        <p>Chúc mừng! Một khách hàng vừa đặt mua sản phẩm của bạn.</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0;">Mã đơn hàng: #${order.id.substring(0, 8).toUpperCase()}</h3>
          <p><strong>Tổng giá trị:</strong> ${order.totalAmount.toLocaleString()} đ</p>
          <p><strong>Trạng thái thanh toán:</strong> Đã thanh toán (Tiền đang được giữ an toàn)</p>
        </div>

        <h3>Sản phẩm cần chuẩn bị:</h3>
        <ul>${itemsHtml}</ul>

        <p style="margin-top: 20px;">Vui lòng chuẩn bị hàng và cập nhật trạng thái giao hàng trong hệ thống càng sớm càng tốt.</p>
      </div>
    `;

    this.sendEmail({
      to: sellerEmail,
      subject: `[Đơn hàng mới] #${order.id.substring(0, 8).toUpperCase()}`,
      htmlContent,
      type: 'PURCHASE'
    });
  }

  sendAuctionWinNotification(user: User, product: Product, winningBid: number) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #f59e0b; margin: 0;">🎉 Chúc Mừng Bạn Đã Thắng Đấu Giá! 🎉</h2>
        </div>
        
        <p>Chào <strong>${user.fullName}</strong>,</p>
        <p>Chúc mừng bạn đã là người trả giá cao nhất cho sản phẩm <strong>${product.title}</strong>.</p>

        <div style="display: flex; background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <img src="${product.image}" alt="${product.title}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; margin-right: 15px;" />
          <div>
            <h3 style="margin: 0 0 10px 0;">${product.title}</h3>
            <p style="margin: 0; font-size: 16px;">Giá chiến thắng: <strong style="color: #e11d48;">${winningBid.toLocaleString()} đ</strong></p>
          </div>
        </div>

        <p>Vui lòng tiến hành thanh toán trong vòng 24 giờ để hoàn tất giao dịch và nhận hàng.</p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="#" style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Thanh Toán Ngay</a>
        </div>
      </div>
    `;

    this.sendEmail({
      to: user.email,
      subject: `Chúc mừng! Bạn đã thắng đấu giá: ${product.title}`,
      htmlContent,
      type: 'AUCTION_WIN'
    });
  }

  sendKYCStatusNotification(user: User, status: 'APPROVED' | 'REJECTED', reason?: string) {
    const isApproved = status === 'APPROVED';
    const color = isApproved ? '#10b981' : '#ef4444';
    const title = isApproved ? 'Xác thực KYC Thành Công' : 'Xác thực KYC Thất Bại';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: ${color}; text-align: center;">${title}</h2>
        
        <p>Chào <strong>${user.fullName}</strong>,</p>
        
        ${isApproved 
          ? `<p>Hồ sơ xác thực danh tính (KYC) của bạn đã được duyệt thành công. Giờ đây bạn có thể sử dụng toàn bộ các tính năng mua bán, đấu giá và rút tiền trên nền tảng.</p>`
          : `<p>Rất tiếc, hồ sơ xác thực danh tính (KYC) của bạn không được chấp nhận.</p>
             <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 10px; margin: 15px 0;">
               <strong>Lý do:</strong> ${reason || 'Thông tin không hợp lệ hoặc hình ảnh không rõ nét.'}
             </div>
             <p>Vui lòng đăng nhập vào hệ thống và gửi lại yêu cầu xác thực với thông tin chính xác hơn.</p>`
        }
      </div>
    `;

    this.sendEmail({
      to: user.email,
      subject: `[KYC] Cập nhật trạng thái xác thực tài khoản`,
      htmlContent,
      type: 'KYC'
    });
  }

  sendPaymentEscrowNotification(user: User, order: Order) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #3b82f6; text-align: center;">Xác Nhận Thanh Toán (Ký Quỹ)</h2>
        
        <p>Chào <strong>${user.fullName}</strong>,</p>
        <p>Hệ thống đã ghi nhận khoản thanh toán <strong>${order.totalAmount.toLocaleString()} đ</strong> cho đơn hàng #${order.id.substring(0, 8).toUpperCase()}.</p>
        
        <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bfdbfe;">
          <h4 style="margin-top: 0; color: #1e3a8a;">🛡️ Tiền của bạn đang được bảo vệ</h4>
          <p style="margin-bottom: 0; font-size: 14px; color: #1e40af;">
            Số tiền này đang được hệ thống giữ an toàn (Ký quỹ). Tiền sẽ chỉ được chuyển cho người bán sau khi bạn xác nhận đã nhận được hàng và hài lòng với sản phẩm.
          </p>
        </div>

        <p>Người bán đã được thông báo và đang chuẩn bị giao hàng cho bạn.</p>
      </div>
    `;

    this.sendEmail({
      to: user.email,
      subject: `Xác nhận thanh toán an toàn - Đơn hàng #${order.id.substring(0, 8).toUpperCase()}`,
      htmlContent,
      type: 'PAYMENT_CONFIRMATION'
    });
  }
}

export const emailService = new EmailService();
