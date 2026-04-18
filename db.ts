import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { MOCK_PRODUCTS, MOCK_STREAMS, MOCK_ALL_USERS, MOCK_FEED_POSTS, MOCK_REVIEWS, MOCK_DISCOUNT_CODES, MOCK_SHIPPING_OPTIONS } from './data';
import { Product, LiveStream, User, FeedPost, Review, DiscountCode, ShippingOption, SystemWallet, Order } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

interface Schema {
  products: Product[];
  streams: LiveStream[];
  users: User[];
  feedPosts: FeedPost[];
  reviews: Review[];
  discountCodes: DiscountCode[];
  shippingOptions: ShippingOption[];
  systemWallet: SystemWallet;
  orders: Order[];
  security_logs: any[];
  blocked_ips: string[];
  globalConfig: {
    platformFeeRate: number;
    defaultVatRate: number;
    personalIncomeTaxRate: number;
    currencySymbol: string;
  };
}

class Database {
  private data: Schema;
  private useFirestore: boolean = false;
  private db: admin.firestore.Firestore | null = null;

  constructor() {
    this.initFirebase();
    this.data = this.load();
  }

  private initFirebase() {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        if (admin.apps.length === 0) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
          });
        }
        this.db = admin.firestore();
        this.useFirestore = true;
        console.log('🔥 Firebase Firestore initialized as primary database');
      } catch (error) {
        console.error('Failed to initialize Firebase Admin, falling back to local JSON:', error);
      }
    } else {
      console.log('ℹ️ No FIREBASE_SERVICE_ACCOUNT_JSON found, using local JSON database');
    }
  }

  private load(): Schema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(content);
        
        // Migration: Ensure systemWallet exists
        if (!data.systemWallet) {
          data.systemWallet = {
            balance: 1000,
            totalRevenue: 0,
            totalFeesCollected: 0,
            withdrawalLimitRate: 0.25,
            transactions: []
          };
        } else if (!data.systemWallet.transactions) {
          data.systemWallet.transactions = [];
        }

        // Migration: Ensure orders exists
        if (!data.orders) {
          data.orders = [];
        }

        // Migration: Ensure security_logs exists
        if (!data.security_logs) {
          data.security_logs = [];
        }

        // Migration: Ensure blocked_ips exists
        if (!data.blocked_ips) {
          data.blocked_ips = [];
        }

        // Migration: Ensure globalConfig exists
        if (!data.globalConfig) {
          data.globalConfig = {
            platformFeeRate: 0.05,
            defaultVatRate: 0.08,
            personalIncomeTaxRate: 0.015,
            currencySymbol: 'đ'
          };
        }

        // Migration: Ensure users have gamification fields and tokenVersion and wallet
        data.users = data.users.map((u: any) => ({
          points: 0,
          badges: [],
          reputation: 50,
          tokenVersion: 0,
          twoFactorEnabled: false,
          twoFactorSecret: '',
          ...u,
          wallet: {
            balance: u.balance || 0,
            pendingBalance: 0,
            kycStatus: 'unverified',
            transactions: [],
            escrowItems: [],
            ...(u.wallet || {})
          }
        }));
        
        this.save(data);
        return data;
      } catch (error) {
        console.error('Error loading database file, falling back to mock data:', error);
      }
    }

    // Default data if file doesn't exist or is corrupted
    const defaultData: Schema = {
      products: MOCK_PRODUCTS,
      streams: MOCK_STREAMS,
      users: MOCK_ALL_USERS,
      feedPosts: MOCK_FEED_POSTS,
      reviews: MOCK_REVIEWS,
      discountCodes: MOCK_DISCOUNT_CODES,
      shippingOptions: MOCK_SHIPPING_OPTIONS,
      systemWallet: {
        balance: 1000, // Initial seed
        totalRevenue: 0,
        totalFeesCollected: 0,
        withdrawalLimitRate: 0.25
      },
      orders: [],
      security_logs: [],
      blocked_ips: [],
      globalConfig: {
        platformFeeRate: 0.05,
        defaultVatRate: 0.08,
        personalIncomeTaxRate: 0.015,
        currencySymbol: 'đ'
      }
    };
    this.save(defaultData);
    return defaultData;
  }

  private async save(data: Schema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      
      // If Firestore is enabled, we could sync here, but for simplicity 
      // in this hybrid model, we'll handle Firestore updates in the update method.
    } catch (error) {
      console.error('Error saving database file:', error);
    }
  }

  get<T extends keyof Schema>(key: T): Schema[T] {
    return this.data[key];
  }

  async set<T extends keyof Schema>(key: T, value: Schema[T]) {
    this.data[key] = value;
    this.save(this.data);

    if (this.useFirestore && this.db) {
      try {
        // In a real production app, we wouldn't store the whole array in one doc
        // but for this migration from JSON, it's the simplest first step.
        await this.db.collection('app_data').doc(key).set({ data: value });
      } catch (error) {
        console.error(`Firestore sync error for ${key}:`, error);
      }
    }
  }

  async update<T extends keyof Schema>(key: T, updater: (val: Schema[T]) => Schema[T]) {
    this.data[key] = updater(this.data[key]);
    this.save(this.data);

    if (this.useFirestore && this.db) {
      try {
        await this.db.collection('app_data').doc(key).set({ data: this.data[key] });
      } catch (error) {
        console.error(`Firestore sync error for ${key}:`, error);
      }
    }
  }
}

export const db = new Database();
