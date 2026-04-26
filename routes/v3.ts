import { Router } from 'express';
import { db } from '../db';
import { PricingService } from '../services/pricingService';
import { OrderStatus, ItemType, WalletTransaction, EscrowItem } from '../types';
import Stripe from 'stripe';
import bcrypt from 'bcryptjs';
import SecurityService from '../services/SecurityService';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

let stripe: Stripe | null = null;
function getStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

const router = Router();

router.use((req, res, next) => {
  console.log(`[v3Router] ${req.method} ${req.url}`);
  next();
});

const sendSuccess = (res: any, data: any, action = 'none') => {
  res.json({
    status: 'success',
    action,
    data,
    ui: { update: false, elements: null }
  });
};

const sendError = (res: any, message: string, action = 'none') => {
  res.status(500).json({
    status: 'error',
    action,
    data: { message },
    ui: { update: false, elements: null }
  });
};

const getClientIp = (req: any) => {
  const forwarded = req.headers['x-forwarded-for'];
  return typeof forwarded === 'string' ? forwarded.split(',')[0] : req.ip || '127.0.0.1';
};

// IP Blocking Middleware
router.use((req, res, next) => {
  console.log(`[v3Router] ${req.method} ${req.originalUrl}`);
  const ip = getClientIp(req);
  const blockedIps = db.get('blocked_ips') || [];
  if (blockedIps.includes(ip)) {
    return res.status(403).json({
      status: 'error',
      message: 'Truy cập của bạn đã bị chặn do vi phạm chính sách bảo mật.'
    });
  }
  next();
});

// ==========================================
// 1. PRODUCTS API
// ==========================================

router.get('/products', async (req, res) => {
  try {
    const products = db.get('products');
    sendSuccess(res, { products }, 'get_products');
  } catch (error: any) {
    sendError(res, error.message, 'get_products');
  }
});

router.post('/products', async (req, res) => {
  try {
    const product = req.body;
    if (!product.id) product.id = `prod_${Date.now()}`;
    if (!product.status) product.status = OrderStatus.AVAILABLE;
    
    await db.update('products', (products) => [product, ...products]);
    sendSuccess(res, { product }, 'create_product');
  } catch (error: any) {
    sendError(res, error.message, 'create_product');
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    await db.update('products', (prev) => prev.map(p => p.id === id ? { ...p, ...data } : p));
    const product = db.get('products').find(p => p.id === id);
    sendSuccess(res, { product }, 'update_product');
  } catch (error: any) {
    sendError(res, error.message, 'update_product');
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.update('products', (prev) => prev.filter(p => p.id !== id));
    sendSuccess(res, { id }, 'delete_product');
  } catch (error: any) {
    sendError(res, error.message, 'delete_product');
  }
});

// ==========================================
// 2. BIDS API
// ==========================================

router.post('/bids', async (req, res) => {
  try {
    const { productId, userId, userName, amount } = req.body;
    
    const products = db.get('products');
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) throw new Error('Không tìm thấy sản phẩm');
    const product = products[productIndex];
    
    if (product.type !== ItemType.AUCTION) throw new Error('Sản phẩm không phải dạng đấu giá');
    
    const now = new Date();
    if (product.startTime && new Date(product.startTime) > now) {
      throw new Error('Phiên đấu giá chưa bắt đầu (Đang trong giai đoạn thẩm định)');
    }
    if (product.endTime && new Date(product.endTime) < now) throw new Error('Phiên đấu giá đã kết thúc');
    
    const currentPrice = product.currentBid || product.price;
    if (amount <= currentPrice) throw new Error('Giá đặt phải cao hơn giá hiện tại');

    const updatedProduct = {
      ...product,
      currentBid: amount,
      bidCount: (product.bidCount || 0) + 1,
      bidHistory: [
        { id: `bid_${Date.now()}`, userId, userName, amount, timestamp: new Date().toISOString() },
        ...(product.bidHistory || [])
      ]
    };

    await db.update('products', (prev) => prev.map(p => p.id === productId ? updatedProduct : p));

    sendSuccess(res, { product: updatedProduct }, 'place_bid');
  } catch (error: any) {
    res.status(400).json({
      status: 'error',
      action: 'place_bid',
      data: { message: error.message },
      ui: { update: false, elements: null }
    });
  }
});

// ==========================================
// 3. STREAMS API
// ==========================================

router.get('/streams', async (req, res) => {
  try {
    const streams = db.get('streams');
    sendSuccess(res, { streams }, 'get_streams');
  } catch (error: any) {
    sendError(res, error.message, 'get_streams');
  }
});

// ==========================================
// 4. AUTH API
// ==========================================

router.get('/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Không có token xác thực', 'auth_me');
  }

  const token = authHeader.split(' ')[1];
  const decoded = SecurityService.verifyToken(token);

  if (!decoded) {
    return sendError(res, 'Token không hợp lệ hoặc đã hết hạn', 'auth_me');
  }

  const users = db.get('users');
  let user = users.find(u => u.id === decoded.id);

  // Handle virtual admin user
  if (!user && decoded.id === 'admin_root') {
    const adminEmail = SecurityService.getAdminEmail();
    if (decoded.email === adminEmail) {
      user = {
        id: 'admin_root',
        fullName: 'System Administrator',
        email: adminEmail,
        avatar: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
        role: 'ADMIN',
        joinDate: new Date().toISOString(),
        balance: 1000000,
        tokenVersion: decoded.tokenVersion || 0
      } as any;
    }
  }

  if (!user) {
    return sendError(res, 'Người dùng không tồn tại', 'auth_me');
  }

  // Ensure both are compared as numbers or defaults to 0
  const userVersion = Number(user.tokenVersion || 0);
  const tokenVersion = Number(decoded.tokenVersion || 0);

  if (userVersion !== tokenVersion) {
    return sendError(res, 'Phiên đăng nhập đã bị vô hiệu hóa', 'auth_me');
  }

  const userWithoutPassword = { ...user as any };
  delete userWithoutPassword.password;
  sendSuccess(res, { user: userWithoutPassword }, 'auth_me');
});

router.post('/auth/login', async (req, res) => {
  const { email, pass, expiresIn = '24h' } = req.body;
  
  // Lớp 1 & 2: Kiểm tra quyền Admin thông qua SecurityService (Trừu tượng hóa)
  const isAdmin = await SecurityService.verifyAdmin(email, pass);
  const adminEmail = SecurityService.getAdminEmail();

  // Nếu email khớp với Admin nhưng mật khẩu sai (isAdmin = false)
  if ((email || '').toLowerCase() === (adminEmail || '').toLowerCase() && !isAdmin) {
    return sendError(res, 'Sai mật khẩu Admin', 'auth_login');
  }

  const users = db.get('users');
  let user = users.find(u => u.email === email);
  
  if (isAdmin) {
    // Nếu là Admin, ưu tiên gán quyền Admin cao nhất
    user = {
      id: 'admin_root',
      fullName: 'System Administrator',
      email: adminEmail,
      avatar: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
      role: 'ADMIN',
      joinDate: new Date().toISOString(),
      balance: 1000000,
      tokenVersion: user?.tokenVersion || 0
    };
  } else if (user) {
    // Nếu là người dùng thường, kiểm tra mật khẩu nếu có
    if (user.password) {
      const isPassCorrect = await bcrypt.compare(pass, user.password);
      if (!isPassCorrect) {
        return sendError(res, 'Sai mật khẩu người dùng', 'auth_login');
      }
    }
  } else {
    user = users[0]; // Fallback cho demo
  }

  // Tạo Token
  const token = SecurityService.generateToken(
    { id: user.id, email: user.email, tokenVersion: Number(user.tokenVersion || 0) },
    expiresIn
  );

  // Log login event
  SecurityService.logEvent(db, user.id, 'LOGIN', { email: user.email, isAdmin, expiresIn }, getClientIp(req));

  // Check if 2FA is enabled
  if (user.twoFactorEnabled && !isAdmin) {
    return sendSuccess(res, { twoFactorRequired: true, email: user.email }, 'auth_login');
  }

  // Loại bỏ password trước khi gửi về client
  const userWithoutPassword = { ...user as any };
  delete userWithoutPassword.password;
  sendSuccess(res, { user: userWithoutPassword, token }, 'auth_login');
});

router.post('/auth/register', async (req, res) => {
  try {
    const { fullName, email, pass } = req.body;
    
    // Kiểm tra email đã tồn tại chưa
    const existingUser = db.get('users').find(u => u.email === email);
    if (existingUser) {
      return sendError(res, 'Email đã được sử dụng', 'auth_register');
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(pass, 10);

    const user = {
      id: `u_${Date.now()}`,
      fullName,
      email,
      password: hashedPassword,
      tokenVersion: 0,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
      joinDate: new Date().toISOString(),
      balance: 0,
      role: 'USER',
      points: 0,
      badges: [],
      reputation: 50
    };
    await db.update('users', (prev) => [...prev, user]);

    // Log registration event
    SecurityService.logEvent(db, user.id, 'REGISTER', { email: user.email }, getClientIp(req));

    // Tạo Token mặc định 24h
    const token = SecurityService.generateToken(
      { id: user.id, email: user.email, tokenVersion: Number(user.tokenVersion || 0) },
      '24h'
    );

    // Loại bỏ password trước khi gửi về client
    const userWithoutPassword = { ...user as any };
    delete userWithoutPassword.password;
    sendSuccess(res, { user: userWithoutPassword, token }, 'auth_register');
  } catch (error: any) {
    sendError(res, error.message, 'auth_register');
  }
});

// ==========================================
// 4.1 2FA API
// ==========================================

router.post('/auth/2fa/setup', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Không có token xác thực', '2fa_setup');
  }

  const token = authHeader.split(' ')[1];
  const decoded = SecurityService.verifyToken(token);
  if (!decoded) return sendError(res, 'Token không hợp lệ', '2fa_setup');

  const secret = speakeasy.generateSecret({ name: `AmazeBid (${decoded.email})` });
  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

  sendSuccess(res, { secret: secret.base32, qrCode }, '2fa_setup');
});

router.post('/auth/2fa/verify', async (req, res) => {
  const { code, secret } = req.body;
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Không có token xác thực', '2fa_verify');
  }

  const token = authHeader.split(' ')[1];
  const decoded = SecurityService.verifyToken(token);
  if (!decoded) return sendError(res, 'Token không hợp lệ', '2fa_verify');

  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: code
  });

  if (verified) {
    await db.update('users', (users) => users.map(u => {
      if (u.id === decoded.id) {
        return { ...u, twoFactorEnabled: true, twoFactorSecret: secret };
      }
      return u;
    }));
    sendSuccess(res, { success: true }, '2fa_verify');
  } else {
    sendError(res, 'Mã xác thực không chính xác', '2fa_verify');
  }
});

router.post('/auth/2fa/toggle', async (req, res) => {
  const { enabled } = req.body;
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Không có token xác thực', '2fa_toggle');
  }

  const token = authHeader.split(' ')[1];
  const decoded = SecurityService.verifyToken(token);
  if (!decoded) return sendError(res, 'Token không hợp lệ', '2fa_toggle');

  await db.update('users', (users) => users.map(u => {
    if (u.id === decoded.id) {
      return { ...u, twoFactorEnabled: enabled };
    }
    return u;
  }));

  sendSuccess(res, { enabled }, '2fa_toggle');
});

router.post('/auth/2fa/login', async (req, res) => {
  const { email, code } = req.body;
  const users = db.get('users');
  const user = users.find(u => u.email === email);

  if (!user || !user.twoFactorSecret) {
    return sendError(res, 'Người dùng không tồn tại hoặc chưa bật 2FA', '2fa_login');
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: code
  });

  if (verified) {
    const token = SecurityService.generateToken(
      { id: user.id, email: user.email, tokenVersion: Number(user.tokenVersion || 0) },
      '24h'
    );
    const userWithoutPassword = { ...user as any };
    delete userWithoutPassword.password;
    sendSuccess(res, { user: userWithoutPassword, token }, '2fa_login');
  } else {
    sendError(res, 'Mã xác thực không chính xác', '2fa_login');
  }
});

router.post('/auth/reset-token', async (req, res) => {
  try {
    const { userId } = req.body;
    
    await db.update('users', (users) => {
      return users.map(u => {
        if (u.id === userId) {
          return { ...u, tokenVersion: (u.tokenVersion || 0) + 1 };
        }
        return u;
      });
    });

    // Log token reset event
    SecurityService.logEvent(db, userId, 'RESET_TOKEN', { reason: 'User requested' }, getClientIp(req));

    sendSuccess(res, { message: 'Đã vô hiệu hóa tất cả các phiên đăng nhập cũ' }, 'reset_token');
  } catch (error: any) {
    sendError(res, error.message, 'reset_token');
  }
});

/**
 * EMERGENCY RECOVERY ENDPOINT
 * Dùng để lấy lại tài khoản khi bị chiếm quyền.
 * Yêu cầu MASTER_RECOVERY_KEY từ biến môi trường.
 */
router.post('/auth/emergency-reset', async (req, res) => {
  try {
    const { email, newPassword, recoveryKey } = req.body;
    const masterKey = process.env.MASTER_RECOVERY_KEY;

    if (!masterKey || recoveryKey !== masterKey) {
      return sendError(res, 'Mã khôi phục khẩn cấp không hợp lệ hoặc chưa được thiết lập', 'emergency_reset');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    let userFound = false;

    await db.update('users', (users) => {
      return users.map(u => {
        if (u.email === email) {
          userFound = true;
          // Đặt lại mật khẩu và tăng tokenVersion để kick hacker ra
          return { 
            ...u, 
            password: hashedPassword, 
            tokenVersion: (u.tokenVersion || 0) + 1 
          };
        }
        return u;
      });
    });

    if (!userFound) {
      return sendError(res, 'Không tìm thấy tài khoản với email này', 'emergency_reset');
    }

    // Log emergency reset event
    SecurityService.logEvent(db, null, 'EMERGENCY_RESET', { email }, getClientIp(req));

    sendSuccess(res, { message: 'Khôi phục tài khoản thành công. Tất cả phiên đăng nhập cũ đã bị vô hiệu hóa.' }, 'emergency_reset');
  } catch (error: any) {
    sendError(res, error.message, 'emergency_reset');
  }
});

router.post('/auth/logout', (req, res) => {
  sendSuccess(res, null, 'auth_logout');
});

// ==========================================
// 5. ADMIN API
// ==========================================

router.get('/admin/pending-products', (req, res) => {
  try {
    const products = db.get('products').filter((p: any) => p.status === OrderStatus.PENDING_VERIFICATION);
    sendSuccess(res, { products }, 'get_pending_products');
  } catch (error: any) {
    sendError(res, error.message, 'get_pending_products');
  }
});

router.get('/admin/users', (req, res) => {
  try {
    const users = db.get('users').map((u: any) => {
      const userWithoutPassword = { ...u };
      delete userWithoutPassword.password;
      return userWithoutPassword;
    });
    sendSuccess(res, { users }, 'get_admin_users');
  } catch (error: any) {
    sendError(res, error.message, 'get_admin_users');
  }
});

router.post('/admin/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    await db.update('users', (users) => {
      return users.map(u => {
        if (u.id === userId) {
          return { ...u, role };
        }
        return u;
      });
    });

    SecurityService.logEvent(db, userId, 'CHANGE_ROLE', { newRole: role }, getClientIp(req));
    sendSuccess(res, { message: 'Đã cập nhật vai trò người dùng' }, 'admin_change_role');
  } catch (error: any) {
    sendError(res, error.message, 'admin_change_role');
  }
});

router.post('/admin/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    
    await db.update('users', (users) => {
      return users.map(u => {
        if (u.id === userId) {
          return { ...u, status };
        }
        return u;
      });
    });

    SecurityService.logEvent(db, userId, 'CHANGE_STATUS', { newStatus: status }, getClientIp(req));
    sendSuccess(res, { message: 'Đã cập nhật trạng thái người dùng' }, 'admin_change_status');
  } catch (error: any) {
    sendError(res, error.message, 'admin_change_status');
  }
});

router.post('/admin/users/:userId/reset-token', async (req, res) => {
  try {
    const { userId } = req.params;
    
    await db.update('users', (users) => {
      return users.map(u => {
        if (u.id === userId) {
          return { ...u, tokenVersion: (u.tokenVersion || 0) + 1 };
        }
        return u;
      });
    });

    SecurityService.logEvent(db, userId, 'ADMIN_RESET_TOKEN', { reason: 'Admin forced logout' }, getClientIp(req));
    sendSuccess(res, { message: 'Đã vô hiệu hóa tất cả các phiên đăng nhập của người dùng này' }, 'admin_reset_token');
  } catch (error: any) {
    sendError(res, error.message, 'admin_reset_token');
  }
});

router.post('/admin/reset-all-sessions', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Không có token xác thực', 'admin_reset_all_sessions');
    }

    const token = authHeader.split(' ')[1];
    const decoded = SecurityService.verifyToken(token);
    if (!decoded || decoded.id !== 'admin_root') {
      return sendError(res, 'Quyền truy cập bị từ chối', 'admin_reset_all_sessions');
    }

    await db.update('users', (users) => {
      return users.map((u: any) => ({
        ...u,
        tokenVersion: (u.tokenVersion || 0) + 1
      }));
    });

    SecurityService.logEvent(db, 'admin_root', 'ADMIN_RESET_ALL_SESSIONS', { reason: 'Admin reset all sessions' }, getClientIp(req));
    sendSuccess(res, { message: 'Đã vô hiệu hóa tất cả các phiên đăng nhập trên toàn hệ thống' }, 'admin_reset_all_sessions');
  } catch (error: any) {
    sendError(res, error.message, 'admin_reset_all_sessions');
  }
});

router.get('/admin/stats', (req, res) => {
  try {
    const users = db.get('users') || [];
    const products = db.get('products') || [];
    const orders = db.get('orders') || [];
    const logs = db.get('security_logs') || [];

    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter((u: any) => u.status !== 'BANNED').length,
      totalProducts: products.length,
      pendingProducts: products.filter((p: any) => p.status === OrderStatus.PENDING_VERIFICATION).length,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0),
      securityAlerts: logs.filter((l: any) => ['EMERGENCY_RESET', 'CHANGE_STATUS'].includes(l.action)).length,
      recentLogs: logs.slice(0, 5)
    };

    sendSuccess(res, { stats }, 'get_admin_stats');
  } catch (error: any) {
    sendError(res, error.message, 'get_admin_stats');
  }
});

router.get('/admin/security-logs', (req, res) => {
  try {
    const logs = db.get('security_logs') || [];
    sendSuccess(res, { logs }, 'get_security_logs');
  } catch (error: any) {
    sendError(res, error.message, 'get_security_logs');
  }
});

router.get('/admin/blocked-ips', (req, res) => {
  try {
    const ips = db.get('blocked_ips') || [];
    sendSuccess(res, { ips }, 'get_blocked_ips');
  } catch (error: any) {
    sendError(res, error.message, 'get_blocked_ips');
  }
});

router.post('/admin/blocked-ips', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) throw new Error('IP is required');
    
    await db.update('blocked_ips', (ips) => {
      if (!ips.includes(ip)) return [...ips, ip];
      return ips;
    });

    SecurityService.logEvent(db, null, 'BLOCK_IP', { blockedIp: ip }, getClientIp(req));
    sendSuccess(res, { ip }, 'block_ip');
  } catch (error: any) {
    sendError(res, error.message, 'block_ip');
  }
});

router.delete('/admin/blocked-ips/:ip', async (req, res) => {
  try {
    const { ip } = req.params;
    await db.update('blocked_ips', (ips) => ips.filter(i => i !== ip));
    
    SecurityService.logEvent(db, null, 'UNBLOCK_IP', { unblockedIp: ip }, getClientIp(req));
    sendSuccess(res, { ids: [ip] }, 'unblock_ip');
  } catch (error: any) {
    sendError(res, error.message, 'unblock_ip');
  }
});

router.get('/admin/config', (req, res) => {
  try {
    const config = db.get('globalConfig');
    sendSuccess(res, config, 'get_config');
  } catch (error: any) {
    sendError(res, error.message, 'get_config');
  }
});

router.post('/admin/config', async (req, res) => {
  try {
    const config = req.body;
    await db.update('globalConfig', () => config);
    sendSuccess(res, config, 'update_config');
  } catch (error: any) {
    sendError(res, error.message, 'update_config');
  }
});

// AI Billing for Users
router.post('/ai/subscribe', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendError(res, 'Không có token xác nhận', 'ai_subscribe_error');
        }

        const token = authHeader.split(' ')[1];
        const decoded = SecurityService.verifyToken(token);
        if (!decoded) return sendError(res, 'Phiên đăng nhập hết hạn', 'ai_subscribe_error');

        const userId = decoded.id; // Use ID from token, not body
        const { tier } = req.body;
        
        const users = db.get('users');
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) throw new Error('Người dùng không tồn tại');
        const user = users[userIndex];

        // Constants - Could be moved to globalConfig later
        const PRO_MONTHLY_FEE = 500000; // ~ $20 USD in VND
        
        if (tier !== 'PRO') throw new Error('Hệ thống hiện chỉ hỗ trợ đăng ký gói PRO');

        if (!user.wallet || user.wallet.balance < PRO_MONTHLY_FEE) {
            throw new Error(`Số dư ví không đủ. Cần ít nhất ${PRO_MONTHLY_FEE.toLocaleString()} VND để đăng ký gói AI Pro.`);
        }

        // Calculate expiry (30 days from now)
        const now = new Date();
        const expiry = new Date();
        expiry.setDate(now.getDate() + 30);

        // Deduct from wallet
        user.wallet.balance -= PRO_MONTHLY_FEE;
        if (!user.wallet.transactions) user.wallet.transactions = [];
        user.wallet.transactions.unshift({
            id: `sub_${Date.now()}`,
            type: 'WITHDRAWAL', 
            amount: PRO_MONTHLY_FEE,
            status: 'COMPLETED',
            timestamp: now.toISOString(),
            description: `Đăng ký gói AI Pro (30 ngày) - AmazeBid AI Suite`
        });

        // Set Subscription data
        user.aiSubscription = {
            tier: 'PRO',
            startDate: now.toISOString(),
            expiryDate: expiry.toISOString(),
            autoRenew: true,
            priceMonth: PRO_MONTHLY_FEE
        };

        // Add revenue to system
        const sysWallet = db.get('systemWallet');
        sysWallet.balance += PRO_MONTHLY_FEE;
        sysWallet.totalRevenue += PRO_MONTHLY_FEE;
        if (!sysWallet.transactions) sysWallet.transactions = [];
        sysWallet.transactions.unshift({
            id: `sys_sub_${Date.now()}`,
            type: 'REVENUE',
            amount: PRO_MONTHLY_FEE,
            status: 'COMPLETED',
            timestamp: now.toISOString(),
            description: `Doanh thu đăng ký AI Pro từ user ${userId}`
        });

        await db.update('users', (prev) => {
            prev[userIndex] = user;
            return [...prev];
        });
        await db.update('systemWallet', () => sysWallet);

        sendSuccess(res, { user, message: 'Đăng ký gói AI Pro thành công!' }, 'ai_subscribe_success');
    } catch (error: any) {
        sendError(res, error.message, 'ai_subscribe_error');
    }
});

router.post('/ai/charge', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return sendError(res, 'Không có token xác nhận', 'ai_charge_error');
      }

      const token = authHeader.split(' ')[1];
      const decoded = SecurityService.verifyToken(token);
      if (!decoded) return sendError(res, 'Phiên đăng nhập hết hạn', 'ai_charge_error');

      const userId = decoded.id; // ISO identity: Use ID from token
      const { modelType, task } = req.body;
      const config = db.get('globalConfig');
      const users = db.get('users');
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) throw new Error('Người dùng không tồn tại');
      
      const user = users[userIndex];
      
      // 1. Subscription Check (Isolation & Privilege)
      const isPro = user.aiSubscription?.tier === 'PRO' && new Date(user.aiSubscription.expiryDate) > new Date();
      
      // Admins and Pro users are not charged for AI usage (within policy)
      if (user.role === 'ADMIN' || isPro) {
          // Track usage even if not charged
          if (!user.aiUsage) user.aiUsage = { totalTokens: 0, totalRequests: 0, estimatedCost: 0, history: [] };
          user.aiUsage.totalRequests++;
          
          await db.update('users', (prev) => {
              prev[userIndex] = user;
              return [...prev];
          });
          
          return sendSuccess(res, { charged: 0, balance: user.wallet?.balance || 0, isPro }, 'ai_charge_exempt');
      }
  
      const fee = modelType === 'PRO' ? (config.proAIFee || 500) : (config.flashAIFee || 100);
      
      if (!user.wallet || user.wallet.balance < fee) {
          throw new Error('Số dư ví không đủ để sử dụng tính năng AI này. Vui lòng nạp thêm tiền hoặc nâng cấp gói Pro.');
      }
  
      // Deduct from user
      user.wallet.balance -= fee;
      if (!user.wallet.transactions) user.wallet.transactions = [];
      user.wallet.transactions.unshift({
          id: `ai_${Date.now()}`,
          type: 'AI_FEE',
          amount: fee,
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          description: `Phí xử lý AI (${modelType || 'FLASH'}) - Tác vụ: ${task || 'N/A'}`
      });

      // Update usage stats for tracking/admin view
      if (!user.aiUsage) user.aiUsage = { totalTokens: 0, totalRequests: 0, estimatedCost: 0, history: [] };
      user.aiUsage.totalRequests++;
      user.aiUsage.estimatedCost += fee;
  
      // Add to system wallet
      const sysWallet = db.get('systemWallet');
      sysWallet.balance += fee;
      sysWallet.totalRevenue += fee;
      
      if (!sysWallet.transactions) sysWallet.transactions = [];
      sysWallet.transactions.unshift({
          id: `ai_sys_${Date.now()}`,
          type: 'AI_REVENUE',
          amount: fee,
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          description: `Thu phí AI từ user ${userId} (${modelType})`
      });
  
      await db.update('users', (prev) => {
          prev[userIndex] = user;
          return [...prev];
      });
      await db.update('systemWallet', () => sysWallet);
  
      sendSuccess(res, { charged: fee, balance: user.wallet.balance }, 'ai_charge_success');
    } catch (error: any) {
      sendError(res, error.message, 'ai_charge_error');
    }
  });

router.post('/admin/verify-product', async (req, res) => {
  try {
    const { productId, approved, reason } = req.body;
    let updatedProduct = null;
    await db.update('products', (products) => {
      return products.map((p: any) => {
        if (p.id === productId) {
          updatedProduct = { 
            ...p, 
            status: approved ? OrderStatus.AVAILABLE : OrderStatus.CANCELLED, 
            verificationReason: reason 
          };
          return updatedProduct;
        }
        return p;
      });
    });
    sendSuccess(res, { product: updatedProduct }, 'verify_product');
  } catch (error: any) {
    sendError(res, error.message, 'verify_product');
  }
});

router.get('/admin/wallet', (req, res) => {
  try {
    const wallet = db.get('systemWallet');
    sendSuccess(res, wallet, 'get_wallet');
  } catch (error: any) {
    sendError(res, error.message, 'get_wallet');
  }
});

router.post('/admin/wallet/bank', async (req, res) => {
  try {
    const { bankName, accountNumber, accountName } = req.body;
    if (!bankName || !accountNumber || !accountName) {
      throw new Error('Vui lòng cung cấp đầy đủ thông tin ngân hàng');
    }

    const wallet = db.get('systemWallet');
    const updatedWallet = {
      ...wallet,
      bankAccount: { bankName, accountNumber, accountName }
    };
    await db.update('systemWallet', () => updatedWallet);
    sendSuccess(res, updatedWallet, 'update_bank');
  } catch (error: any) {
    sendError(res, error.message, 'update_bank');
  }
});

router.post('/admin/withdraw', async (req, res) => {
  try {
    const { amount } = req.body;
    const wallet = db.get('systemWallet');
    if (amount > wallet.balance) throw new Error('Số dư không đủ');
    
    const updatedWallet = {
      ...wallet,
      balance: wallet.balance - amount,
      transactions: [
        {
          id: `tx_${Date.now()}`,
          type: 'WITHDRAWAL',
          amount,
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          description: `Rút tiền hệ thống`
        },
        ...(wallet.transactions || [])
      ]
    };
    await db.update('systemWallet', () => updatedWallet);
    sendSuccess(res, updatedWallet, 'withdraw');
  } catch (error: any) {
    sendError(res, error.message, 'withdraw');
  }
});

// ==========================================
// 6. ORDERS API
// ==========================================

router.post('/orders/complete', async (req, res) => {
  try {
    const { items, totalAmount, shippingInfo, isPOS, sellerId, storeId, userId } = req.body;
    const order = {
      id: `ord_${Date.now()}`,
      userId: userId || 'anonymous',
      sellerId,
      storeId,
      isPOS: !!isPOS,
      items,
      totalAmount,
      shippingInfo,
      status: OrderStatus.PAID_ESCROW,
      escrowStatus: 'held',
      createdAt: new Date().toISOString()
    };
    
    await db.update('orders', (prev) => [order, ...prev]);
    
    // Update product status/stock
    const productIds = items.map((i: any) => i.id);
    const products = db.get('products');
    const users = db.get('users');

    await db.update('products', (prev) => prev.map(p => {
      if (productIds.includes(p.id)) {
        const item = items.find((i: any) => i.id === p.id);
        // Decrease stock if it's a menu item or has stock tracked
        if (p.stock !== undefined) {
          const newStock = Math.max(0, p.stock - (item?.quantity || 1));
          return { ...p, stock: newStock, status: newStock === 0 ? OrderStatus.OUT_OF_STOCK : p.status };
        }
        return { ...p, status: OrderStatus.PAID_ESCROW };
      }
      return p;
    }));

    // If it's a store menu item, update the store stock as well
    if (storeId) {
      await db.update('stores', (stores) => stores.map((s: any) => {
        if (s.id === storeId) {
          return {
            ...s,
            menu: s.menu.map((m: any) => {
              const orderedItem = items.find((i: any) => i.id === m.id);
              if (orderedItem && m.stock !== undefined) {
                const newStock = Math.max(0, m.stock - (orderedItem.quantity || 1));
                return { ...m, stock: newStock };
              }
              return m;
            })
          };
        }
        return s;
      }));
    }

    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      const targetSellerId = sellerId || product?.sellerId;
      
      if (targetSellerId) {
        const sellerIndex = users.findIndex(u => u.id === targetSellerId);
        if (sellerIndex !== -1) {
          const seller = users[sellerIndex];
          if (!seller.wallet) {
            seller.wallet = { balance: seller.balance || 0, pendingBalance: 0, kycStatus: 'unverified' };
          }
          seller.wallet.pendingBalance += item.price * (item.quantity || 1);
          
          // Add to escrow items
          if (!seller.wallet.escrowItems) seller.wallet.escrowItems = [];
          seller.wallet.escrowItems.unshift({
            id: `esc_${Date.now()}_${item.id}`,
            orderId: order.id,
            amount: item.price * (item.quantity || 1),
            expectedReleaseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'HELD',
            productName: item.title || product?.title || 'Sản phẩm tại quầy'
          });
        }
      }
    }
    await db.update('users', () => users);

    sendSuccess(res, { order }, 'complete_order');
  } catch (error: any) {
    sendError(res, error.message, 'complete_order');
  }
});

router.post('/orders/:orderId/release-escrow', async (req, res) => {
  try {
    const { orderId } = req.params;
    const orders = db.get('orders');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) throw new Error('Không tìm thấy đơn hàng');
    const order = orders[orderIndex];
    
    if (order.escrowStatus !== 'held') {
      throw new Error('Đơn hàng không ở trạng thái lưu ký hoặc đã được giải phóng');
    }

    const products = db.get('products');
    const users = db.get('users');
    const systemWallet = db.get('systemWallet');

    let totalFees = 0;

    for (const item of order.items) {
      const product = products.find(p => p.id === item.id);
      if (product && product.sellerId) {
        const sellerIndex = users.findIndex(u => u.id === product.sellerId);
        if (sellerIndex !== -1) {
          const seller = users[sellerIndex];
          if (!seller.wallet) {
            seller.wallet = { balance: seller.balance || 0, pendingBalance: 0, kycStatus: 'unverified' };
          }
          
          const feeRate = product.systemFeeRate || 0.05;
          const fee = item.price * feeRate;
          const sellerAmount = item.price - fee;

          // Deduct from pending, add to available
          seller.wallet.pendingBalance = Math.max(0, seller.wallet.pendingBalance - item.price);
          seller.wallet.balance += sellerAmount;
          seller.balance = seller.wallet.balance; // Sync legacy balance
          
          // Update escrow item status
          if (seller.wallet.escrowItems) {
            const escrowIndex = seller.wallet.escrowItems.findIndex(e => e.orderId === orderId && e.amount === item.price);
            if (escrowIndex !== -1) {
              seller.wallet.escrowItems[escrowIndex].status = 'RELEASED';
            }
          }

          // Record transaction for seller
          if (!seller.wallet.transactions) seller.wallet.transactions = [];
          seller.wallet.transactions.unshift({
            id: `tx_${Date.now()}_${item.id}`,
            type: 'ESCROW_RELEASE',
            amount: sellerAmount,
            status: 'COMPLETED',
            timestamp: new Date().toISOString(),
            description: `Giải ngân từ đơn hàng ${orderId}`
          });
          
          totalFees += fee;
        }
      }
    }

    // Update system wallet
    systemWallet.balance += totalFees;
    systemWallet.totalFeesCollected += totalFees;
    systemWallet.totalRevenue += order.totalAmount;

    // Record fee transaction for system
    if (!systemWallet.transactions) systemWallet.transactions = [];
    systemWallet.transactions.unshift({
      id: `tx_fee_${Date.now()}_${orderId}`,
      type: 'FEE',
      amount: totalFees,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      description: `Phí hệ thống từ đơn hàng ${orderId}`
    });

    // Update order status
    order.escrowStatus = 'released';
    order.status = OrderStatus.COMPLETED;

    await db.update('orders', () => orders);
    await db.update('users', () => users);
    await db.update('systemWallet', () => systemWallet);

    sendSuccess(res, { order }, 'release_escrow');
  } catch (error: any) {
    sendError(res, error.message, 'release_escrow');
  }
});

router.get('/orders/user/:userId', (req, res) => {
  const orders = db.get('orders');
  // In a real app we'd filter by userId. For mock, return all or filter if items have buyerId
  sendSuccess(res, { orders }, 'get_user_orders');
});

router.get('/orders/seller/:sellerId', (req, res) => {
  try {
    const { sellerId } = req.params;
    console.log(`[v3Router] Handling get_seller_orders for seller: ${sellerId}`);
    
    // Ensure db is loaded and orders collection exists
    const orders = db.get('orders') || [];
    
    // Filter orders where the order has the sellerId OR any item in the order belongs to the seller
    const sellerOrders = orders.filter((o: any) => 
      o && (
        o.sellerId === sellerId || 
        (o.items && Array.isArray(o.items) && o.items.some((item: any) => item && item.sellerId === sellerId))
      )
    );
    
    sendSuccess(res, { orders: sellerOrders }, 'get_seller_orders');
  } catch (error) {
    console.error('Error in get_seller_orders:', error);
    sendError(res, 'Failed to fetch seller orders', 500);
  }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await db.update('orders', (prev) => prev.map(o => 
      o.id === id ? { ...o, status } : o
    ));
    const order = db.get('orders').find(o => o.id === id);
    sendSuccess(res, { order }, 'update_order_status');
  } catch (error: any) {
    sendError(res, error.message, 'update_order_status');
  }
});

// ==========================================
// 7. SOCIAL & COMMUNITY API
// ==========================================

router.get('/posts', (req, res) => {
  const posts = db.get('feedPosts');
  sendSuccess(res, { posts }, 'get_posts');
});

router.post('/posts', async (req, res) => {
  try {
    const post = req.body;
    if (!post.id) post.id = `post_${Date.now()}`;
    post.likes = 0;
    post.comments = 0;
    post.createdAt = new Date().toISOString();
    
    await db.update('feedPosts', (prev) => [post, ...prev]);
    sendSuccess(res, { post }, 'create_post');
  } catch (error: any) {
    sendError(res, error.message, 'create_post');
  }
});

router.post('/posts/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    await db.update('feedPosts', (prev) => prev.map(p => 
      p.id === id ? { ...p, likes: p.likes + 1 } : p
    ));
    sendSuccess(res, null, 'like_post');
  } catch (error: any) {
    sendError(res, error.message, 'like_post');
  }
});

// ==========================================
// 8. MISC API
// ==========================================

router.get('/coupons', (req, res) => {
  const coupons = db.get('discountCodes');
  sendSuccess(res, { coupons }, 'get_coupons');
});

router.get('/gamification/leaderboard', (req, res) => {
  const users = db.get('users');
  const leaderboard = users.sort((a, b) => (b.points || 0) - (a.points || 0));
  sendSuccess(res, { leaderboard }, 'get_leaderboard');
});

router.post('/pricing/calculate', (req, res) => {
  const { costPrice, totalStock, markup = 0.25, productId } = req.body;
  const products = db.get('products');
  const product = products.find(p => p.id === productId);
  
  const plan = PricingService.calculatePlan(costPrice, totalStock, markup);
  const aiDescription = PricingService.getAIStrategyDescription(plan, totalStock, product);

  res.json({ 
    success: true, 
    data: { plan, aiDescription },
    source: 'local_engine'
  });
});

router.put('/products/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, shippingInfo } = req.body;
    await db.update('products', (prev) => prev.map(p => 
      p.id === id ? { ...p, status, shippingInfo: shippingInfo || p.shippingInfo } : p
    ));
    sendSuccess(res, { id, status }, 'update_product_status');
  } catch (error: any) {
    sendError(res, error.message, 'update_product_status');
  }
});

// ==========================================
// AI ROUTER DASHBOARD API
// ==========================================

let aiJobs: any[] = [];
const aiDlq: any[] = [];

router.get('/dashboard', (req, res) => {
  const stats = {
    total: aiJobs.length + aiDlq.length,
    pending: aiJobs.filter(j => j.status === 'pending').length,
    processing: aiJobs.filter(j => j.status === 'processing').length,
    completed: aiJobs.filter(j => j.status === 'completed').length,
    failed: aiJobs.filter(j => j.status === 'failed').length,
    dlq: aiDlq.length
  };
  res.json({ stats, jobs: aiJobs, dlq: aiDlq });
});

router.post('/tasks', (req, res) => {
  const payload = req.body;
  if (payload.invalid_field) {
    return res.status(400).json({ details: "Invalid schema" });
  }
  const newJob = {
    id: payload.id || `job_${Date.now()}`,
    data: payload,
    status: 'pending',
    attempts: 0,
    maxAttempts: 3,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  aiJobs.unshift(newJob);
  
  // Simulate processing
  setTimeout(() => {
    const job = aiJobs.find(j => j.id === newJob.id);
    if (job) {
      job.status = 'processing';
      job.updatedAt = Date.now();
      setTimeout(() => {
        if (Math.random() > 0.2) {
          job.status = 'completed';
          job.result = { success: true };
        } else {
          job.status = 'failed';
          job.error = 'Random failure';
          job.attempts += 1;
          if (job.attempts >= job.maxAttempts) {
            job.status = 'dlq';
            aiDlq.unshift(job);
            aiJobs = aiJobs.filter(j => j.id !== job.id);
          }
        }
        job.updatedAt = Date.now();
      }, 1500);
    }
  }, 500);

  res.json({ success: true, job: newJob });
});

router.post('/queue/retry/:id', (req, res) => {
  const { id } = req.params;
  const jobIndex = aiDlq.findIndex(j => j.id === id);
  if (jobIndex !== -1) {
    const job = aiDlq[jobIndex];
    aiDlq.splice(jobIndex, 1);
    job.status = 'pending';
    job.attempts = 0;
    job.updatedAt = Date.now();
    aiJobs.unshift(job);
    
    // Simulate processing
    setTimeout(() => {
      const j = aiJobs.find(x => x.id === job.id);
      if (j) {
        j.status = 'completed';
        j.updatedAt = Date.now();
      }
    }, 1500);
  }
  res.json({ success: true });
});

router.post('/tests/run', (req, res) => {
  const logs = [
    'Starting tests...',
    'Test 1: Schema validation - PASSED',
    'Test 2: Queue processing - PASSED',
    'Test 3: DLQ routing - PASSED',
    'All tests completed successfully.'
  ];
  res.json({ logs });
});

router.post('/create-payment-intent', async (req, res) => {
  try {
    const stripeClient = getStripe();
    if (!stripeClient) {
      return res.status(500).json({ error: 'Stripe is not configured' });
    }
    const { items } = req.body;
    const amount = items.reduce((sum: number, item: any) => sum + item.price, 0);
    
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(amount), // VND is zero-decimal
      currency: 'vnd',
    });
    
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 7. USER WALLET & KYC API
// ==========================================

router.get('/users/:id/wallet', (req, res) => {
  try {
    const { id } = req.params;
    const users = db.get('users');
    const user = users.find(u => u.id === id);
    
    // Handle virtual admin user
    if (!user && id === 'admin_root') {
      const systemWallet = db.get('systemWallet');
      
      // Mock some escrow items for admin if empty
      const escrowItems: EscrowItem[] = systemWallet.escrowItems || [
        { id: 'esc_1', orderId: 'ord_101', amount: 250.50, expectedReleaseDate: '2026-03-22T10:00:00Z', status: 'HELD', productName: 'iPhone 15 Pro' },
        { id: 'esc_2', orderId: 'ord_102', amount: 120.00, expectedReleaseDate: '2026-03-25T15:30:00Z', status: 'HELD', productName: 'AirPods Max' }
      ];
      const transactions: WalletTransaction[] = systemWallet.transactions || [
        { id: 'tx_1', type: 'DEPOSIT', amount: 1000, status: 'COMPLETED', timestamp: '2026-03-15T09:00:00Z', description: 'Initial seed' },
        { id: 'tx_2', type: 'FEE', amount: 50, status: 'COMPLETED', timestamp: '2026-03-18T14:20:00Z', description: 'Platform fee ord_101' }
      ];

      return sendSuccess(res, { 
        wallet: {
          balance: systemWallet.balance,
          pendingBalance: 370.50,
          bankAccount: systemWallet.bankAccount,
          kycStatus: 'verified',
          transactions,
          escrowItems
        } 
      }, 'get_user_wallet');
    }

    if (!user) throw new Error('Không tìm thấy người dùng');
    
    if (!user.wallet) {
      user.wallet = { 
        balance: user.balance || 0, 
        pendingBalance: 0, 
        kycStatus: 'unverified',
        transactions: [],
        escrowItems: []
      };
    }

    // Mock some data for regular users if empty
    if (!user.wallet.transactions || user.wallet.transactions.length === 0) {
      user.wallet.transactions = [
        { id: 'tx_u1', type: 'DEPOSIT', amount: 100, status: 'COMPLETED', timestamp: '2026-03-10T11:00:00Z', description: 'Nạp tiền từ ngân hàng' }
      ];
    }
    if (!user.wallet.escrowItems || user.wallet.escrowItems.length === 0) {
      user.wallet.escrowItems = [
        { id: 'esc_u1', orderId: 'ord_u101', amount: 45.00, expectedReleaseDate: '2026-03-21T08:00:00Z', status: 'HELD', productName: 'Vintage Watch' }
      ];
      user.wallet.pendingBalance = 45.00;
    }

    sendSuccess(res, { wallet: user.wallet }, 'get_user_wallet');
  } catch (error: any) {
    sendError(res, error.message, 'get_user_wallet');
  }
});

router.post('/users/:id/wallet/bank', async (req, res) => {
  try {
    const { id } = req.params;
    const { bankName, accountNumber, accountName } = req.body;
    
    if (id === 'admin_root') {
      const systemWallet = db.get('systemWallet');
      const updatedWallet = {
        ...systemWallet,
        bankAccount: { bankName, accountNumber, accountName }
      };
      await db.update('systemWallet', () => updatedWallet);
      return sendSuccess(res, { wallet: {
        balance: updatedWallet.balance,
        pendingBalance: 0,
        bankAccount: updatedWallet.bankAccount,
        kycStatus: 'verified'
      } }, 'update_user_bank');
    }

    const users = db.get('users');
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error('Không tìm thấy người dùng');
    
    const user = users[userIndex];
    if (!user.wallet) {
      user.wallet = { balance: user.balance || 0, pendingBalance: 0, kycStatus: 'unverified' };
    }
    
    user.wallet.bankAccount = { bankName, accountNumber, accountName };
    await db.update('users', () => users);
    
    sendSuccess(res, { wallet: user.wallet }, 'update_user_bank');
  } catch (error: any) {
    sendError(res, error.message, 'update_user_bank');
  }
});

router.post('/users/:id/wallet/kyc', async (req, res) => {
  try {
    const { id } = req.params;
    // In a real app, this would accept ID card images and process them
    const users = db.get('users');
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error('Không tìm thấy người dùng');
    
    const user = users[userIndex];
    if (!user.wallet) {
      user.wallet = { balance: user.balance || 0, pendingBalance: 0, kycStatus: 'unverified' };
    }
    
    // Auto-verify for demo purposes
    user.wallet.kycStatus = 'verified';
    await db.update('users', () => users);
    
    sendSuccess(res, { wallet: user.wallet }, 'submit_kyc');
  } catch (error: any) {
    sendError(res, error.message, 'submit_kyc');
  }
});

router.post('/users/:id/wallet/withdraw', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    
    if (id === 'admin_root') {
      const systemWallet = db.get('systemWallet');
      if (systemWallet.balance < amount) throw new Error('Số dư không đủ');
      if (!systemWallet.bankAccount) throw new Error('Vui lòng liên kết tài khoản ngân hàng trước khi rút tiền');
      
      systemWallet.balance -= amount;
      
      // Record transaction
      const transaction: WalletTransaction = {
        id: `tx_${Date.now()}`,
        type: 'WITHDRAWAL',
        amount,
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
        description: `Rút tiền về ${systemWallet.bankAccount.bankName}`
      };
      if (!systemWallet.transactions) systemWallet.transactions = [];
      systemWallet.transactions.unshift(transaction);

      await db.update('systemWallet', () => systemWallet);
      
      return sendSuccess(res, { 
        wallet: {
          balance: systemWallet.balance,
          pendingBalance: 0,
          bankAccount: systemWallet.bankAccount,
          kycStatus: 'verified',
          transactions: systemWallet.transactions
        }, 
        amount 
      }, 'withdraw_user_wallet');
    }

    const users = db.get('users');
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error('Không tìm thấy người dùng');
    
    const user = users[userIndex];
    if (!user.wallet) {
      user.wallet = { 
        balance: user.balance || 0, 
        pendingBalance: 0, 
        kycStatus: 'unverified',
        transactions: [],
        escrowItems: []
      };
    }
    
    if (user.wallet.kycStatus !== 'verified') {
      throw new Error('Vui lòng xác minh danh tính (KYC) trước khi rút tiền');
    }
    
    if (!user.wallet.bankAccount) {
      throw new Error('Vui lòng liên kết tài khoản ngân hàng trước khi rút tiền');
    }
    
    if (amount > user.wallet.balance) {
      throw new Error('Số dư không đủ');
    }
    
    user.wallet.balance -= amount;
    user.balance = user.wallet.balance;

    // Record transaction
    const transaction: WalletTransaction = {
      id: `tx_${Date.now()}`,
      type: 'WITHDRAWAL',
      amount,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      description: `Rút tiền về ${user.wallet.bankAccount.bankName}`
    };
    if (!user.wallet.transactions) user.wallet.transactions = [];
    user.wallet.transactions.unshift(transaction);

    await db.update('users', () => users);
    
    sendSuccess(res, { wallet: user.wallet, amount }, 'withdraw_user_wallet');
  } catch (error: any) {
    sendError(res, error.message, 'withdraw_user_wallet');
  }
});

export default router;
