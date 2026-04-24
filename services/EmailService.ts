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

  private async sendRealEmail(to: string, subject: string, html: string) {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html })
      });
      if (!response.ok) {
        console.warn('Real email sending failed (likely RESEND_API_KEY missing)', await response.json().catch(() => ({})));
      }
    } catch (error) {
      console.error('Error calling send-email API:', error);
    }
  }

  subscribe(listener: (emails: EmailTemplate[]) => void) {
    this.listeners.push(listener);
    listener([...this.emails]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Specific Notification Methods
  sendKYCStatusNotification(user: any, status: 'APPROVED' | 'REJECTED' | 'PENDING') {
    const subject = status === 'APPROVED' ? 'Tài khoản của bạn đã được xác minh!' : 'Cập nhật trạng thái KYC';
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2563eb;">Thông báo Xác minh Danh tính (KYC)</h2>
        <p>Chào ${user.fullName},</p>
        <p>Hệ thống AI của AmazeBid đã hoàn tất kiểm tra hồ sơ của bạn.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <strong>Trạng thái: </strong> 
          <span style="color: ${status === 'APPROVED' ? '#10b981' : '#ef4444'}; font-weight: bold;">
            ${status === 'APPROVED' ? 'ĐÃ PHÊ DUYỆT' : status === 'REJECTED' ? 'TỪ CHỐI' : 'ĐANG CHỜ'}
          </span>
        </div>
        <p>${status === 'APPROVED' ? 'Bạn hiện đã có thể thực hiện các giao dịch giá trị cao và rút tiền về ngân hàng.' : 'Vui lòng kiểm tra lại thông tin và cung cấp giấy tờ chính xác hơn.'}</p>
        <p style="font-size: 12px; color: #666; margin-top: 30px;">Đây là thông báo tự động từ hệ thống AmazeBid.</p>
      </div>
    `;

    this.addTemplate({
      id: `kyc-${Date.now()}`,
      subject,
      to: user.email,
      type: 'KYC',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: html
    });

    this.sendRealEmail(user.email, subject, html);
  }

  sendAuctionWinNotification(user: any, product: any, amount: number) {
    const subject = `Chúc mừng! Bạn đã thắng đấu giá: ${product.title}`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #d97706;">Bạn đã thắng cuộc đấu giá!</h2>
        <p>Chào ${user.fullName},</p>
        <p>Chúc mừng bạn đã sở hữu sản phẩm <strong>${product.title}</strong>.</p>
        <div style="background: #fffbeb; padding: 15px; border: 1px solid #fbbf24; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Giá thắng thầu:</strong> ${amount.toLocaleString()}đ</p>
          <p style="margin: 5px 0 0 0;"><strong>Mã sản phẩm:</strong> ${product.id}</p>
        </div>
        <p>Vui lòng tiến hành thanh toán trong vòng 24h để hoàn tất giao dịch.</p>
        <a href="#" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Thanh toán ngay</a>
      </div>
    `;

    this.addTemplate({
      id: `bid-${Date.now()}`,
      subject,
      to: user.email,
      type: 'AUCTION_WIN',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: html
    });

    this.sendRealEmail(user.email, subject, html);
  }

  sendPurchaseConfirmation(user: any, order: any) {
    const subject = `Xác nhận đơn hàng #${order.id}`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2563eb;">Xác nhận Mua hàng thành công</h2>
        <p>Chào ${user.fullName},</p>
        <p>Cảm ơn bạn đã mua sắm tại AmazeBid. Đơn hàng của bạn đang được xử lý.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 10px; text-align: left;">Sản phẩm</th>
              <th style="padding: 10px; text-align: right;">Số lượng</th>
              <th style="padding: 10px; text-align: right;">Giá</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((item: any) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px;">${item.title}</td>
                <td style="padding: 10px; text-align: right;">x${item.quantity}</td>
                <td style="padding: 10px; text-align: right;">${item.price.toLocaleString()}đ</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Tổng cộng:</td>
              <td style="padding: 10px; text-align: right; font-weight: bold; color: #2563eb;">${order.totalAmount.toLocaleString()}đ</td>
            </tr>
          </tfoot>
        </table>
        <p>Hệ thống đã nhận thanh toán và đang tạm giữ (Escrow) để đảm bảo quyền lợi của bạn.</p>
      </div>
    `;

    this.addTemplate({
      id: `purchase-${Date.now()}`,
      subject,
      to: user.email,
      type: 'PURCHASE',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: html
    });

    this.sendRealEmail(user.email, subject, html);
  }

  sendPaymentEscrowNotification(user: any, order: any) {
    const subject = `Bảo vệ thanh toán (Escrow) - Đơn hàng #${order.id}`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333; border-left: 4px solid #10b981;">
        <h2 style="color: #059669;">Thanh toán tạm giữ an toàn</h2>
        <p>Chào ${user.fullName},</p>
        <p>Số tiền <strong>${order.totalAmount.toLocaleString()}đ</strong> cho đơn hàng #${order.id} đã được chuyển vào hệ thống tạm giữ của AmazeBid.</p>
        <p><strong>Quy trình bảo mật:</strong></p>
        <ol>
          <li>Người bán chuẩn bị và giao hàng cho đơn vị vận chuyển.</li>
          <li>Bạn nhận hàng và kiểm tra trong vòng 3 ngày.</li>
          <li>Sau khi bạn xác nhận "Đã nhận hàng", tiền sẽ được giải ngân cho người bán.</li>
        </ol>
        <p>AmazeBid đảm bảo hoàn tiền 100% nếu sản phẩm không đúng mô tả.</p>
      </div>
    `;

    this.addTemplate({
      id: `escrow-${Date.now()}`,
      subject,
      to: user.email,
      type: 'PAYMENT_CONFIRMATION',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: html
    });

    this.sendRealEmail(user.email, subject, html);
  }

  sendSellerNotification(sellerEmail: string, order: any) {
    const subject = `Bạn có đơn hàng mới! #${order.id}`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2563eb;">Thông báo Bán hàng</h2>
        <p>Xin chào đối tác bán hàng,</p>
        <p>Chúc mừng! Khách hàng đã thanh toán và đặt mua sản phẩm của bạn.</p>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0; margin: 20px 0;">
          <p style="margin: 0;"><strong>Số tiền được tạm giữ:</strong> ${order.totalAmount.toLocaleString()}đ</p>
          <p style="margin: 5px 0 0 0;"><strong>Mã đơn hàng:</strong> #${order.id}</p>
        </div>
        <p>Vui lòng đóng gói và gửi hàng sớm nhất có thể. Truy cập trang quản lý đơn hàng để cập nhật thông tin vận chuyển.</p>
        <a href="#" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Quản lý đơn hàng</a>
      </div>
    `;

    this.addTemplate({
      id: `seller-${Date.now()}`,
      subject,
      to: sellerEmail,
      type: 'SYSTEM',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: html
    });

    this.sendRealEmail(sellerEmail, subject, html);
  }

  sendShippingUpdateNotification(user: any, product: any, trackingInfo: any) {
    const subject = `Đơn hàng đang trên đường đến bạn - ${product.title}`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2563eb;">Thông tin Vận chuyển</h2>
        <p>Chào ${user.fullName},</p>
        <p>Sản phẩm <strong>${product.title}</strong> đã được gửi đi.</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="margin: 0;"><strong>Đơn vị vận chuyển:</strong> ${trackingInfo.carrier}</p>
          <p style="margin: 5px 0 0 0;"><strong>Mã vận đơn:</strong> ${trackingInfo.trackingNumber}</p>
          <p style="margin: 5px 0 0 0;"><strong>Trạng thái:</strong> ${trackingInfo.status}</p>
        </div>
        <p>Bạn có thể theo dõi hành trình đơn hàng trong phần "Đơn mua" của mình.</p>
      </div>
    `;

    this.addTemplate({
      id: `ship-${Date.now()}`,
      subject,
      to: user.email,
      type: 'SHIPPING',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: html
    });

    this.sendRealEmail(user.email, subject, html);
  }

  sendWalletTransferNotification(user: any, amount: number, type: 'DEPOSIT' | 'WITHDRAWAL' | 'BONUS') {
    const subject = `Giao dịch ví AmazeBid: ${type === 'DEPOSIT' ? '+' : '-'} ${amount.toLocaleString()}đ`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2563eb;">Thông báo Biến động số dư</h2>
        <p>Chào ${user.fullName},</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px;">
            <strong>Số tiền:</strong> 
            <span style="color: ${type === 'DEPOSIT' || type === 'BONUS' ? '#10b981' : '#ef4444'}; font-weight: bold;">
              ${type === 'DEPOSIT' || type === 'BONUS' ? '+' : '-'} ${amount.toLocaleString()}đ
            </span>
          </p>
          <p style="margin: 5px 0 0 0;"><strong>Nội dung:</strong> ${type === 'DEPOSIT' ? 'Nạp tiền vào ví' : type === 'WITHDRAWAL' ? 'Rút tiền về ngân hàng' : 'Thưởng hệ thống'}</p>
        </div>
        <p>Kiểm tra chi tiết trong phần "Ví của tôi" trên ứng dụng AmazeBid.</p>
      </div>
    `;

    this.addTemplate({
      id: `wallet-${Date.now()}`,
      subject,
      to: user.email,
      type: 'SYSTEM',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: html
    });

    this.sendRealEmail(user.email, subject, html);
  }

  sendDeliveryNotification(user: any, product: any) {
    const subject = `Đơn hàng đã được giao thành công - ${product.title}`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #10b981;">Giao hàng thành công!</h2>
        <p>Chào ${user.fullName},</p>
        <p>Đơn hàng chứa sản phẩm <strong>${product.title}</strong> của bạn đã được giao thành công.</p>
        <p>Vui lòng kiểm tra sản phẩm và xác nhận "Đã nhận hàng" trong ứng dụng để hoàn tất giao dịch và giải ngân cho người bán.</p>
        <p>Nếu có vấn đề gì, bạn có 3 ngày để gửi yêu cầu khiếu nại/hoàn tiền.</p>
      </div>
    `;

    this.addTemplate({
      id: `delivery-${Date.now()}`,
      subject,
      to: user.email,
      type: 'SHIPPING',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: html
    });

    this.sendRealEmail(user.email, subject, html);
  }

  sendEscrowReleaseNotification(sellerEmail: string, orderId: string, amount: number) {
    const subject = `Tiền đã được giải ngân! Đơn hàng #${orderId}`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #10b981;">Thông báo Giải ngân tiền hàng</h2>
        <p>Xin chào đối tác bán hàng,</p>
        <p>Khách hàng đã xác nhận nhận hàng cho đơn hàng #${orderId}.</p>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px;"><strong>Số tiền đã được cộng vào ví:</strong> ${amount.toLocaleString()}đ</p>
        </div>
        <p>Cảm ơn bạn đã đồng hành cùng AmazeBid. Chúc bạn buôn may bán đắt!</p>
      </div>
    `;

    this.addTemplate({
      id: `release-${Date.now()}`,
      subject,
      to: sellerEmail,
      type: 'SYSTEM',
      isRead: false,
      timestamp: new Date().toISOString(),
      htmlContent: html
    });

    this.sendRealEmail(sellerEmail, subject, html);
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
