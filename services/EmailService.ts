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

  private getModernLayout(title: string, content: string, footerNote: string = "") {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          .email-wrapper { background-color: #f1f5f9; padding: 40px 20px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
          .email-card { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .email-header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px; text-align: center; color: white; }
          .email-body { padding: 32px; line-height: 1.6; color: #1e293b; }
          .email-footer { padding: 24px; text-align: center; background-color: #f8fafc; color: #64748b; font-size: 13px; }
          .btn { display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .recommendation-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 24px; display: flex; align-items: center; gap: 16px; }
          .recommendation-img { width: 60px; height: 60px; background: #f1f5f9; border-radius: 8px; overflow: hidden; }
          .price-tag { color: #2563eb; font-weight: bold; }
          .social-icons { margin-top: 16px; opacity: 0.6; }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-card">
            <div class="email-header">
              <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">AmazeBid</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">Hybrid E-commerce & Auction Platform</p>
            </div>
            <div class="email-body">
              ${content}
              
              <div style="margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 24px;">
                <h3 style="font-size: 16px; color: #334155; margin-bottom: 16px;">Có thể bạn cũng quan tâm:</h3>
                
                <div class="recommendation-card">
                  <div class="recommendation-img"><img src="https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=100" style="width:100%; height:100%; object-fit:cover;"></div>
                  <div>
                    <div style="font-weight: 600; font-size: 14px;">Gói Bảo hiểm VIP AmazeSafe</div>
                    <div class="price-tag">Chỉ từ 99.000đ/tháng</div>
                  </div>
                </div>

                <div class="recommendation-card">
                  <div class="recommendation-img"><img src="https://images.unsplash.com/photo-1544725121-be3b5d0c19cb?w=100" style="width:100%; height:100%; object-fit:cover;"></div>
                  <div>
                    <div style="font-weight: 600; font-size: 14px;">Dịch vụ Giám định Thật-Giả</div>
                    <div class="price-tag">Miễn phí cho đơn từ 5.000.000đ</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="email-footer">
              <p>${footerNote || "Bạn nhận được email này vì đã đăng ký tài khoản tại AmazeBid."}</p>
              <div class="social-icons">
                Facebook | Twitter | LinkedIn
              </div>
              <p style="margin-top: 16px;">&copy; 2024 AmazeBid Inc. 123 Innovation Drive, Silicon Valley.</p>
              <p><a href="#" style="color: #64748b; text-decoration: underline;">Hủy đăng ký</a> | <a href="#" style="color: #64748b; text-decoration: underline;">Cài đặt thông báo</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Specific Notification Methods
  sendKYCStatusNotification(user: any, status: 'APPROVED' | 'REJECTED' | 'PENDING') {
    const subject = status === 'APPROVED' ? 'Tài khoản của bạn đã được xác minh!' : 'Cập nhật trạng thái KYC';
    const content = `
      <h2 style="color: #1e293b; margin-top: 0;">Thông báo Xác minh Danh tính (KYC)</h2>
      <p>Chào <strong>${user.fullName}</strong>,</p>
      <p>Hệ thống AI của AmazeBid đã hoàn tất kiểm tra hồ sơ của bạn.</p>
      <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; margin: 24px 0; text-align: center;">
        <div style="font-size: 14px; color: #64748b; margin-bottom: 4px;">Trạng thái hiện tại:</div>
        <div style="color: ${status === 'APPROVED' ? '#10b981' : '#ef4444'}; font-weight: 800; font-size: 20px;">
          ${status === 'APPROVED' ? '● ĐÃ PHÊ DUYỆT' : status === 'REJECTED' ? '● TỪ CHỐI' : '● ĐANG CHỜ'}
        </div>
      </div>
      <p>${status === 'APPROVED' ? 'Chúc mừng! Bạn hiện đã có thể thực hiện các giao dịch giá trị cao và tham gia các cuộc đấu giá VIP.' : 'Rất tiếc, thông tin bạn cung cấp chưa đủ rõ ràng. Vui lòng cập nhật hình ảnh CCCD mới.'}</p>
      <div style="text-align: center;">
        <a href="${window.location.origin}/profile" class="btn">Kiểm tra thông tin</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content);

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
    const content = `
      <h2 style="color: #1e293b; margin-top: 0;">🎉 Bạn đã thắng cuộc đấu giá!</h2>
      <p>Chào <strong>${user.fullName}</strong>,</p>
      <p>Bạn đã vượt qua các đối thủ khác để trở thành người sở hữu sản phẩm tuyệt vời này:</p>
      
      <div style="border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin: 24px 0;">
        <div style="display: flex; gap: 16px;">
          <div style="flex: 1;">
            <div style="font-weight: 700; font-size: 18px;">${product.title}</div>
            <div style="color: #64748b; font-size: 14px; margin-top: 4px;">Mã số thầu: #BID-${Math.floor(Math.random()*10000)}</div>
          </div>
        </div>
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e2e8f0; display: flex; justify-content: space-between;">
          <span style="color: #64748b;">Giá thắng thầu:</span>
          <span style="font-weight: 800; color: #2563eb; font-size: 20px;">${amount.toLocaleString()}đ</span>
        </div>
      </div>

      <p>Để đảm bảo quyền sở hữu, vui lòng hoàn tất thanh toán trong vòng <strong>24 giờ</strong> tới.</p>
      <div style="text-align: center;">
        <a href="${window.location.origin}/orders" class="btn">Thanh toán & Nhận hàng</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content);

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
    const subject = `Xác nhận đơn hàng #${order.id} - Cảm ơn bạn đã mua hàng!`;
    const content = `
      <h2 style="color: #1e293b; margin-top: 0;">Xác nhận Mua hàng Thành công</h2>
      <p>Chào <strong>${user.fullName}</strong>,</p>
      <p>Cảm ơn bạn đã tin tưởng AmazeBid. Đơn hàng của bạn đang được người bán chuẩn bị.</p>
      
      <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <h3 style="margin-top: 0; font-size: 16px; color: #334155;">Chi tiết đơn hàng #${order.id}</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${order.items.map((item: any) => `
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                <div style="font-weight: 600;">${item.title}</div>
                <div style="font-size: 13px; color: #64748b;">Số lượng: ${item.quantity}</div>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">
                ${item.price.toLocaleString()}đ
              </td>
            </tr>
          `).join('')}
          <tr>
            <td style="padding: 16px 0 0 0; text-align: right;"><strong>Tổng thanh toán:</strong></td>
            <td style="padding: 16px 0 0 0; text-align: right; font-size: 18px; color: #2563eb; font-weight: 800;">
              ${order.totalAmount.toLocaleString()}đ
            </td>
          </tr>
        </table>
      </div>

      <p>Số tiền này hiện đang được <strong>AmazeBid Escrow</strong> tạm giữ an toàn cho đến khi bạn xác nhận đã nhận hàng.</p>
      <div style="text-align: center;">
        <a href="${window.location.origin}/orders" class="btn">Xem trạng thái vận chuyển</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content);

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
    const content = `
      <h2 style="color: #059669; margin-top: 0;">🛡️ Thanh toán của bạn đã được bảo vệ</h2>
      <p>Chào <strong>${user.fullName}</strong>,</p>
      <p>Số tiền <strong>${order.totalAmount.toLocaleString()}đ</strong> cho đơn hàng <strong>#${order.id}</strong> đã được chuyển vào hệ thống tạm giữ an toàn của AmazeBid.</p>
      
      <div style="background: #ecfdf5; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #d1fae5;">
        <h3 style="margin-top: 0; font-size: 16px; color: #065f46;">Quy trình AmazeSafe Escrow:</h3>
        <ol style="padding-left: 20px; color: #065f46;">
          <li style="margin-bottom: 8px;">Người bán nhận thông báo và tiến hành giao hàng.</li>
          <li style="margin-bottom: 8px;">Hệ thống theo dõi vận đơn thời gian thực.</li>
          <li>Tiền chỉ được giải ngân cho người bán sau khi bạn xác nhận "Đã nhận hàng".</li>
        </ol>
      </div>
      
      <p>AmazeBid cam kết bảo vệ quyền lợi người mua 100%. Nếu hàng không đúng mô tả, bạn có quyền yêu cầu hoàn tiền ngay lập tức.</p>
    `;

    const html = this.getModernLayout(subject, content);

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
    const subject = `🔥 Đơn hàng mới! Khách hàng đã thanh toán đơn #${order.id}`;
    const content = `
      <h2 style="color: #2563eb; margin-top: 0;">Bạn có đơn hàng mới!</h2>
      <p>Xin chào đối tác bán hàng,</p>
      <p>Thật tuyệt vời! Một khách hàng vừa chốt đơn sản phẩm của bạn. Tiền hàng đã được hệ thống tạm giữ an toàn.</p>
      
      <div style="background: #eff6ff; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #dbeafe;">
        <div style="font-size: 14px; color: #1e40af;">Số tiền sẽ nhận (tạm giữ):</div>
        <div style="font-size: 28px; font-weight: 800; color: #1d4ed8; margin: 8px 0;">${order.totalAmount.toLocaleString()}đ</div>
        <div style="font-size: 14px; color: #1e40af;">Mã đơn hàng: #${order.id}</div>
      </div>

      <p>Vui lòng đóng gói và gửi hàng trong vòng 48h để đảm bảo tỷ lệ phản hồi tốt. Sau khi gửi, hãy cập nhật Mã vận đơn ngay trong trang quản trị.</p>
      
      <div style="text-align: center;">
        <a href="${window.location.origin}/admin/products" class="btn">Giao hàng ngay</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content, "Vui lòng hoàn tất đơn hàng đúng hạn để tránh bị phạt điểm uy tín.");

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
    const subject = `🚚 Đơn hàng đang đến bạn: ${product.title}`;
    const content = `
      <h2 style="color: #1e293b; margin-top: 0;">Đơn hàng đã được bàn giao cho vận chuyển</h2>
      <p>Chào <strong>${user.fullName}</strong>,</p>
      <p>Tin vui! Sản phẩm <strong>${product.title}</strong> của bạn đã bắt đầu hành trình đến địa chỉ nhận hàng.</p>
      
      <div style="border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin: 24px 0;">
        <div style="background: #f8fafc; padding: 16px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 700;">Thông tin vận đơn</div>
        </div>
        <div style="padding: 20px;">
          <p style="margin: 0 0 8px 0;"><strong>Đơn vị:</strong> ${trackingInfo.carrier}</p>
          <p style="margin: 0 0 8px 0;"><strong>Mã vận đơn:</strong> <span style="font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${trackingInfo.trackingNumber}</span></p>
          <p style="margin: 0;"><strong>Dự kiến nhận:</strong> Trong 2-3 ngày tới</p>
        </div>
      </div>

      <p>Hệ thống AI sẽ liên tục cập nhật vị trí đơn hàng cho bạn.</p>
      <div style="text-align: center;">
        <a href="${window.location.origin}/orders" class="btn">Theo dõi hành trình</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content);

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
    const isIncrease = type === 'DEPOSIT' || type === 'BONUS';
    const subject = `Biến động số dư: ${isIncrease ? '+' : '-'} ${amount.toLocaleString()}đ`;
    const content = `
      <h2 style="color: #1e293b; margin-top: 0;">Thông báo Giao dịch Ví AmazeBid</h2>
      <p>Chào <strong>${user.fullName}</strong>,</p>
      <p>Ví của bạn vừa ghi nhận một giao dịch mới:</p>
      
      <div style="background: #f8fafc; border-radius: 16px; padding: 32px; text-align: center; margin: 24px 0;">
        <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">Số tiền thay đổi:</div>
        <div style="font-size: 32px; font-weight: 800; color: ${isIncrease ? '#10b981' : '#ef4444'};">
          ${isIncrease ? '+' : '-'} ${amount.toLocaleString()}đ
        </div>
        <div style="margin-top: 16px; font-size: 14px; color: #334155;">
          <strong>Nội dung:</strong> ${type === 'DEPOSIT' ? 'Nạp tiền vào ví' : type === 'WITHDRAWAL' ? 'Rút tiền tài khoản' : 'Thưởng hệ thống'}
        </div>
      </div>
      
      <p>Vui lòng kiểm tra lại lịch sử giao dịch nếu có bất kỳ thắc mắc nào.</p>
      <div style="text-align: center;">
        <a href="${window.location.origin}/wallet" class="btn">Quản lý Ví</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content);

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
    const subject = `✅ Kiện hàng đã được giao: ${product.title}`;
    const content = `
      <h2 style="color: #10b981; margin-top: 0;">Giao hàng thành công!</h2>
      <p>Chào <strong>${user.fullName}</strong>,</p>
      <p>Sản phẩm <strong>${product.title}</strong> đã được shipper giao đến bạn thành công.</p>
      
      <div style="background: #f0fdf4; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #bbf7d0;">
        <p style="margin: 0; color: #166534;"><strong>Lưu ý quan trọng:</strong></p>
        <p style="margin: 8px 0 0 0; color: #166534; font-size: 14px;">Vui lòng kiểm tra sản phẩm thực tế. Nếu hài lòng, hãy nhấn "Xác nhận nhận hàng" để hoàn tất. Bạn có 3 ngày trước khi hệ thống tự động giải ngân.</p>
      </div>

      <div style="text-align: center;">
        <a href="${window.location.origin}/orders" class="btn">Xác nhận đã nhận hàng</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content);

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
    const subject = `💰 Tiền đã về ví! Giải ngân đơn hàng #${orderId}`;
    const content = `
      <h2 style="color: #10b981; margin-top: 0;">Thông báo Giải ngân tiền hàng</h2>
      <p>Xin chào đối tác bán hàng,</p>
      <p>Chúc mừng! Khách hàng đã hài lòng và xác nhận nhận hàng cho đơn #${orderId}. Số tiền đã được chuyển từ hệ thống tạm giữ vào Ví khả dụng của bạn.</p>
      
      <div style="background: #f0fdf4; border-radius: 16px; padding: 32px; text-align: center; margin: 24px 0; border: 2px solid #bbf7d0;">
        <div style="font-size: 14px; color: #166534; margin-bottom: 8px;">Số tiền đã giải ngân:</div>
        <div style="font-size: 32px; font-weight: 800; color: #15803d;">
          + ${amount.toLocaleString()}đ
        </div>
      </div>
      
      <p>Bạn có thể rút số tiền này về ngân hàng bất cứ lúc nào.</p>
      <div style="text-align: center;">
        <a href="${window.location.origin}/admin/wallet" class="btn">Kiểm tra Ví</a>
      </div>
    `;

    const html = this.getModernLayout(subject, content);

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
