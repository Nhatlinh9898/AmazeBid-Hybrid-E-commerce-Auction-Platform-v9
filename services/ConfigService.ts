import { GlobalConfig } from '../types';

class ConfigService {
  private config: GlobalConfig = {
    platformFeeRate: 0.05, // 5%
    defaultVatRate: 0.08, // 8% (VAT in Vietnam)
    personalIncomeTaxRate: 0.015, // 1.5% for business households
    currencySymbol: 'đ'
  };

  private listeners: ((config: GlobalConfig) => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    // SSR safety check: Use a super safe check
    try {
      if (typeof window === 'undefined') {
        return;
      }
      if (typeof localStorage === 'undefined') {
        return;
      }
      
      const saved = localStorage.getItem('amazebid_global_config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch {
      // In SSR this might happen if we access variables poorly, but try-catch handles it
      console.log('[ConfigService] SSR or LocalStorage not available');
    }
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('amazebid_global_config', JSON.stringify(this.config));
      }
    } catch {
      // Silent fail on server
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l({ ...this.config }));
  }

  subscribe(listener: (config: GlobalConfig) => void) {
    this.listeners.push(listener);
    listener({ ...this.config });
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getConfig(): GlobalConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<GlobalConfig>) {
    this.config = { ...this.config, ...updates };
    this.saveToStorage();
  }
}

export const configService = new ConfigService();
