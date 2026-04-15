
export enum ItemType {
  FIXED_PRICE = 'FIXED_PRICE',
  AUCTION = 'AUCTION'
}

export enum OrderStatus {
  AVAILABLE = 'AVAILABLE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID_ESCROW = 'PAID_ESCROW',
  PENDING_SHIPMENT = 'PENDING_SHIPMENT',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED'
}

export interface Bid {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  timestamp: string;
}

export interface PaymentMethod {
  id: string;
  type: 'BANK' | 'CARD' | 'WALLET';
  providerName: string; // Vietcombank, Visa, Momo
  accountNumber: string; // Will be masked in UI
  holderName: string;
  isDefault: boolean;
}

export interface SocialAccount {
  provider: 'facebook' | 'google' | 'instagram' | 'twitter';
  connected: boolean;
  username?: string;
}

export enum UserTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  DIAMOND = 'DIAMOND'
}

export interface Task {
  id: string;
  title: string;
  points: number;
  isCompleted: boolean;
  type: 'WATCH_STREAM' | 'AUCTION_BID' | 'PURCHASE';
}

export interface Voucher {
  id: string;
  code: string;
  discount: number; // Percent or fixed amount
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  minPurchase: number;
  pointsRequired: number;
  expiryDate: string;
}

export interface AffiliateAccount {
  id: string;
  platform: string; // e.g., 'Amazon', 'Shopee', 'Lazada', 'Tiki'
  affiliateId: string; // The user's tracking ID (e.g., ref=user123)
  isActive: boolean;
}

export interface WalletTransaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'ESCROW_RELEASE' | 'FEE' | 'PURCHASE';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  timestamp: string;
  description: string;
}

export interface EscrowItem {
  id: string;
  orderId: string;
  amount: number;
  expectedReleaseDate: string;
  status: 'HELD' | 'RELEASED' | 'REFUNDED';
  productName: string;
}

export interface UserWallet {
  balance: number;
  pendingBalance: number;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  kycStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  transactions?: WalletTransaction[];
  escrowItems?: EscrowItem[];
}

export interface User {
  id: string;
  firebaseUid?: string;
  fullName: string;
  email: string;
  password?: string; // Hashed password
  tokenVersion?: number; // For session invalidation
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  phone?: string;
  avatar: string;
  address?: string;
  joinDate: string;
  balance: number; // Legacy balance
  wallet?: UserWallet; // New Escrow Wallet
  paymentMethods: PaymentMethod[];
  // Social & Referral
  socialAccounts?: SocialAccount[];
  referralCode?: string;
  referredBy?: string;
  friendCount?: number;
  role?: 'USER' | 'ADMIN'; // Added Role
  // New Social Features
  followers?: string[]; // Array of User IDs
  following?: string[]; // Array of User IDs
  // Gamification
  points: number;
  tier: UserTier;
  badges: string[];
  reputation: number; // 0-100
  dailyTasks: Task[];
  vouchers: Voucher[];
}

// --- New Social Types ---
export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number; // 1-5
  comment: string;
  images?: string[];
  likes: number;
  createdAt: string;
}

export interface FeedPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  images?: string[];
  relatedProductId?: string;
  likes: number;
  comments: number;
  createdAt: string;
  isAiGenerated?: boolean;
}
// ------------------------

// New Interface for Admin Reporting
export interface Transaction {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  type: 'PURCHASE' | 'FEE' | 'DEPOSIT';
  timestamp: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

// --- Virtual Avatar Types ---

export interface AvatarCustomization {
  heightScale: number; // 0.9 to 1.1
  skinToneHash: string; // Hex color for overlay tint
  hairStyle: 'LONG' | 'SHORT' | 'BOB' | 'PONYTAIL';
  language: 'vi-VN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'zh-CN';
  voiceSpeed: number; // 0.5 to 2
  voicePitch: number; // 0.5 to 2
  outfitColor?: string; // New: Hex color for outfit tint
  eyeColor?: string; // New: Hex color for eyes
  bodyType?: 'SLIM' | 'ATHLETIC' | 'CURVY'; // New: Body type
}

export interface AvatarConfig {
  id: string;
  name: string;
  role: 'FASHION_MODEL' | 'SALES_EXPERT' | 'SINGER' | 'FRIENDLY_HOST';
  gender: 'FEMALE' | 'MALE';
  voiceTone: string;
  image: string; // Base visualization (Thumbnail)
  // Video States for Realism
  idleVideo: string;    // Waiting/Listening
  talkingVideo: string; // Explaining/Selling
  singingVideo?: string; // Performing
}

export interface AvatarOutfit {
  id: string;
  name: string;
  image: string; // Overlay image or texture
  style: string;
}

export interface AvatarEnvironment {
  id: string;
  name: string;
  image: string;
  type: 'STUDIO' | 'STAGE' | 'OUTDOOR' | 'SHOP';
  lightingColor: string; // Hex color to blend avatar with bg
  cameraPosition?: [number, number, number];
  modelPosition?: [number, number, number];
  modelScale?: number;
}
// ----------------------------

export interface DiscountCode {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number; // e.g. 10 for 10%, 50 for $50
  minPurchase?: number;
  maxDiscount?: number;
  expiryDate: string;
  isActive: boolean;
}

export interface ShippingOption {
  id: string;
  name: string;
  provider: string;
  estimatedDays: string;
  price: number;
}

export interface TrackingEvent {
  id: string;
  status: string;
  location: string;
  timestamp: string;
  description: string;
}

export interface ShippingInfo {
  trackingNumber: string;
  carrier: string;
  status: string;
  events: TrackingEvent[];
  estimatedDelivery: string;
}

export interface PackagingInfo {
  length: number; // cm
  width: number;  // cm
  height: number; // cm
  weight: number; // kg
  isFragile: boolean;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number; // For Auction: Starting Price
  originalPrice?: number; // New: Original Price for discounts
  currentBid?: number;
  bidCount?: number;
  bidHistory?: Bid[]; // New: List of bids
  stepPrice?: number; // New: Minimum increment
  image: string;
  category: string;
  type: ItemType;
  endTime?: string; 
  rating: number;
  reviewCount: number;
  status: OrderStatus;
  sellerId: string;
  payoutMethod?: string;
  // Affiliate Fields
  isAffiliate?: boolean;
  affiliateLink?: string;
  platformName?: string; // e.g. "Amazon", "Shopee"
  commissionRate?: number; // e.g. 5%
  // Flash Sale Fields
  isFlashSale?: boolean;
  flashSalePrice?: number;
  flashSaleEndTime?: string;
  stock?: number;
  sold?: number;
  // Automatic Pricing & Recovery Logic
  costPrice?: number;         // Real value/Cost per unit
  totalStock?: number;        // Initial stock
  breakEvenQuantity?: number; // Units to sell to recover total cost
  pricingStrategy?: 'AUTO' | 'MANUAL';
  isRecoveryPhase?: boolean;  // True if still selling to recover cost
  systemFeeRate?: number;     // Default 0.05 (5%)
  videoUrl?: string;          // URL to product video
  // Shipping Tracking
  shippingInfo?: ShippingInfo;
  packagingInfo?: PackagingInfo; // New: Packaging Info
  // AI Sales Assistant Fields
  minNegotiationPrice?: number; // Minimum price the AI can accept
  isNegotiable?: boolean;
  privacyMode?: boolean;
  // AI Order Classification
  aiPriority?: 'URGENT' | 'NORMAL' | 'LOW';
  aiTags?: string[];
  // Fraud Detection
  isFraudulent?: boolean;
  fraudReason?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  shippingAddress?: string;
  paymentMethod?: string;
  shippingInfo?: ShippingInfo;
  isFraudulent?: boolean;
  fraudReason?: string;
  escrowStatus?: 'held' | 'released' | 'refunded';
}

export interface SystemWallet {
  balance: number;
  totalRevenue: number;
  totalFeesCollected: number;
  lastWithdrawalDate?: string;
  withdrawalLimitRate: number; // Default 0.25 (25%)
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  transactions?: WalletTransaction[];
}

export interface LiveStream {
  id: string;
  title: string;
  viewerCount: number;
  hostName: string;
  hostAvatar: string;
  thumbnail: string;
  featuredProductIds: string[];
  isLive: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface ProductIngredient {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  wastagePercentage: number; // % hao hụt
}

export interface ProductRecipe {
  ingredients: ProductIngredient[];
  laborCostEstimate: number;
  packagingCost: number; // Chi phí bao bì
  overheadCost: number; // Chi phí vận hành (điện, nước, mặt bằng)
  otherExpenses: number;
  yieldPortions: number; // Định lượng ra bao nhiêu suất
  totalCost: number;
  costPerPortion: number; // Giá vốn trên mỗi suất
}

export interface StoreMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isAvailable: boolean;
  recipe?: ProductRecipe; // New: Recipe for cost calculation
}

export interface PhysicalStore {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  category: 'FOOD' | 'FASHION' | 'DRINK' | 'ELECTRONICS' | 'BEAUTY' | 'BOOKS' | 'SERVICES' | 'OTHER';
  images: string[];
  openingHours: string;
  rating: number;
  reviewCount: number;
  menu: StoreMenuItem[];
  qrCode?: string;
  createdAt: string;
}

export interface ContentPost {
  id: string;
  title: string;
  content: string; // Markdown or HTML
  keywords: string[];
  generatedImages: string[];
  generatedVideo?: string;
  status: 'DRAFT' | 'PUBLISHED';
  platform: 'BLOG' | 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK';
  createdAt: string;
  relatedProductId?: string;
}

export interface KnowledgeItem {
  id: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'SPEC' | 'INSTRUCTION';
  title: string;
  content: string; // For images/videos this is the URL, for text/specs it's the content
  tags: string[];
  createdAt: string;
}

// --- Supply Chain Management ---
export interface Supplier {
  id: string;
  ownerId: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  website?: string;
  rating?: number;
}

export interface RawMaterial {
  id: string;
  ownerId: string;
  name: string;
  category: string; // Phân loại (VD: Thực phẩm, Linh kiện, Bao bì...)
  unit: string; // Đơn vị tính (kg, m, cái, bộ, thùng...)
  costPrice: number;
  currency: string; // Loại tiền tệ (VND, USD, EUR...)
  supplierId: string;
  stock: number;
  minStockAlert: number;
  lastPurchaseDate?: string;
}

export interface PurchaseInvoice {
  id: string;
  ownerId: string;
  supplierId: string;
  items: {
    materialId: string;
    materialName: string;
    quantity: number;
    unitPrice: number;
    currency: string;
  }[];
  totalAmount: number;
  currency: string;
  invoiceDate: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  imageUrl?: string;
  invoiceType: string; // Loại hóa đơn (VD: VAT, Hóa đơn bán lẻ...)
  purpose: string; // Mục đích chi tiêu
  requesterName: string; // Người thực hiện/Người dùng hóa đơn
  description?: string; // Mô tả chi tiết hóa đơn
}

// --- Labor & HR Management ---
export interface Employee {
  id: string;
  ownerId: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  salaryBase: number;
  salaryType: 'MONTHLY' | 'DAILY' | 'HOURLY';
  joinDate: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface LaborCost {
  id: string;
  ownerId: string;
  employeeId: string;
  amount: number;
  date: string;
  type: 'SALARY' | 'BONUS' | 'OVERTIME';
  note?: string;
}

// --- Equity & Shareholder Management ---
export interface Shareholder {
  id: string;
  ownerId: string;
  name: string;
  capitalContribution: number; // Cash/Assets
  laborContributionValue: number; // Sweat equity value
  otherContributionValue: number; // IP, network, etc.
  sharePercentage: number; // Calculated
  joinDate: string;
  role: 'FOUNDER' | 'INVESTOR' | 'ADVISOR' | 'EMPLOYEE';
  status: 'ACTIVE' | 'PASSIVE';
}

export interface ProfitDistribution {
  id: string;
  ownerId: string;
  totalProfit: number;
  distributedAmount: number;
  retainedAmount: number;
  period: string;
  distributions: {
    shareholderId: string;
    amount: number;
  }[];
  createdAt: string;
}
