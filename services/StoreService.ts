import { PhysicalStore, OrganizationType } from '../types';

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
    // Mock data with hierarchy
    this.stores = [
      {
        id: 'HQ-001',
        ownerId: 'Nhatlinhckm2016@gmail.com',
        name: 'AmazeCorp Global HQ',
        description: 'Bản doanh chính điều hành toàn bộ mạng lưới AmazeBid',
        address: 'Tháp Tài Chính Bitexco, TP. HCM',
        phone: '028-11223344',
        rating: 5.0,
        reviewCount: 1,
        latitude: 10.7715,
        longitude: 106.7042,
        category: 'Corporation',
        type: OrganizationType.CORPORATION,
        images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop'],
        openingHours: '24/7',
        staffIds: ['staff_ceo'],
        createdAt: new Date().toISOString(),
        menu: []
      },
      {
        id: 'BRANCH-X1',
        ownerId: 'Nhatlinhckm2016@gmail.com',
        parentId: 'HQ-001',
        name: 'Chi Nhánh Highlands Coffee X1',
        description: 'Chi nhánh nhượng quyền cấp 1',
        address: '456 Lê Lợi, Quận 1, TP. HCM',
        phone: '028-77889900',
        rating: 4.6,
        reviewCount: 45,
        latitude: 10.7769,
        longitude: 106.7009,
        category: 'Food & Drink',
        type: OrganizationType.COMPANY,
        images: ['https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1937&auto=format&fit=crop'],
        openingHours: '07:00 - 22:00',
        staffIds: ['staff_mgr_x1'],
        createdAt: new Date().toISOString(),
        menu: [
          { 
            id: 'm1', 
            name: 'Cà phê phin sữa', 
            description: 'Phin truyền thống đậm đà',
            price: 29000, 
            category: 'Cà phê',
            image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1937&auto=format&fit=crop',
            isAvailable: true
          }
        ]
      },
      {
        id: 'STORE-A',
        ownerId: 'Nhatlinhckm2016@gmail.com',
        name: 'Cửa hàng Tiện lợi A (System Admin)',
        description: 'Cửa hàng mẫu thuộc quyền sở hữu của Admin toàn hệ thống',
        address: 'Quận 3, TP. Hồ Chí Minh',
        phone: '028-55667788',
        rating: 4.5,
        reviewCount: 12,
        latitude: 10.7765,
        longitude: 106.6908,
        category: 'Grocery',
        type: OrganizationType.COMPANY,
        parentId: 'HQ-001',
        images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2074&auto=format&fit=crop'],
        openingHours: '08:00 - 22:00',
        staffIds: ['staff_a123'],
        createdAt: new Date().toISOString(),
        menu: []
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

  notify() {
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

  getStoreById(id: string): PhysicalStore | null {
    return this.stores.find(s => s.id === id) || null;
  }

  getStoresByOwner(ownerId: string): PhysicalStore[] {
    return this.stores.filter(s => s.ownerId === ownerId);
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
