
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * SecurityService - Lớp bảo mật trung gian
 * Giúp tách biệt logic kiểm tra quyền Admin khỏi mã nguồn xử lý API.
 */
class SecurityService {
  private static adminEmail: string = (process.env.VITE_ADMIN_EMAIL || 'Nhatlinhckm2016@gmail.com').toLowerCase();
  private static adminPasswordHash: string = process.env.ADMIN_PASSWORD || 'admin123';
  private static jwtSecret: string = process.env.JWT_SECRET || 'super-secret-key-123';

  /**
   * Tạo JWT Token với thời hạn linh hoạt
   */
  static generateToken(payload: any, expiresIn: string | number): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn });
  }

  /**
   * Xác thực JWT Token
   */
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch {
      return null;
    }
  }

  /**
   * Kiểm tra xem thông tin đăng nhập có phải là Admin cao nhất không.
   * Việc so sánh được thực hiện qua lớp dịch vụ này, không lộ thông tin ra ngoài Route.
   */
  static async verifyAdmin(email: string, password: string): Promise<boolean> {
    const inputEmail = (email || '').toLowerCase();
    
    console.log(`[SecurityService] Verifying admin: ${inputEmail}`);
    console.log(`[SecurityService] Target admin email: ${this.adminEmail}`);

    // Lớp 1: Kiểm tra Email
    if (inputEmail !== this.adminEmail) {
      console.log(`[SecurityService] Email mismatch`);
      return false;
    }

    // Lớp 2: Kiểm tra Mật khẩu (Hỗ trợ cả văn bản thuần và mã hóa Bcrypt)
    const isMatch = (password === this.adminPasswordHash) || 
                    (this.adminPasswordHash.startsWith('$2') && await bcrypt.compare(password, this.adminPasswordHash));

    console.log(`[SecurityService] Password match: ${isMatch}`);
    return isMatch;
  }

  /**
   * Lấy Email Admin (chỉ dùng để gán thông tin khi đăng nhập thành công)
   */
  static getAdminEmail(): string {
    return this.adminEmail;
  }

  /**
   * Ghi lại các sự kiện bảo mật quan trọng
   */
  static async logEvent(db: any, userId: string | null, action: string, details: any, ip: string = '127.0.0.1'): Promise<void> {
    try {
      const log = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId,
        action,
        details,
        timestamp: new Date().toISOString(),
        ip
      };
      
      await db.update('security_logs', (logs: any[] = []) => [log, ...logs].slice(0, 500));
    } catch (error) {
      console.error('Lỗi khi ghi log bảo mật:', error);
    }
  }
}

export default SecurityService;
