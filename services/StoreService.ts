import { PhysicalStore } from '../types';

class StoreService {
  private stores: PhysicalStore[] = [];
  private listeners: ((stores: PhysicalStore[]) => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        this.loadDefaultData();
        return;
      }
      
      const saved = localStorage.getItem('physical_stores');
      if (saved) {
        this.stores = JSON.parse(saved);
      } else {
        this.loadDefaultData();
      }
    } catch {
      this.loadDefaultData();
    }
  }

  private loadDefaultData() {
    // Mock data
    this.stores = [
      {
        id: 'store-1',
        ownerId: 'seller-1',
        name: 'Hà Nội Coffee House',
        address: '123 Đường Láng, Đống Đa, Hà Nội',
        phone: '024-33445566',
        rating: 4.8,
        image: 'https://picsum.photos/seed/coffee/600/400',
        menu: [
          { id: 'm1', name: 'Cà phê sữa đá', price: 35000, category: 'Đồ uống' },
          { id: 'm2', name: 'Bạc xỉu', price: 39000, category: 'Đồ uống' }
        ]
      },
      {
        id: 'store-2',
        ownerId: 'seller-1',
        name: 'Saigon Fashion Outlet',
        address: '456 Lê Lợi, Quận 1, TP. HCM',
        phone: '028-77889900',
        rating: 4.6,
        image: 'https://picsum.photos/seed/fashion/600/400',
        menu: [
          { id: 'm3', name: 'Áo thun Basic', price: 150000, category: 'Thời trang' },
          { id: 'm4', name: 'Quần Jeans', price: 350000, category: 'Thời trang' }
        ]
      }
    ];
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('physical_stores', JSON.stringify(this.stores));
      }
    } catch {
      // Ignore
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l([...this.stores]));
  }

  subscribe(listener: (stores: PhysicalStore[]) => void) {
    this.listeners.push(listener);
    listener([...this.stores]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getStores(): PhysicalStore[] {
    return [...this.stores];
  }

  updateStore(id: string, updates: Partial<PhysicalStore>) {
    this.stores = this.stores.map(s => s.id === id ? { ...s, ...updates } : s);
    this.saveToStorage();
  }

  addStore(store: PhysicalStore) {
    this.stores = [...this.stores, store];
    this.saveToStorage();
  }
}

export const storeService = new StoreService();
