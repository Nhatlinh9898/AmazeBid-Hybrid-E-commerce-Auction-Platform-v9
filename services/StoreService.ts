import { PhysicalStore, StoreMenuItem } from '../types';

class StoreService {
  private stores: PhysicalStore[] = [];
  private listeners: ((stores: PhysicalStore[]) => void)[] = [];

  constructor() {
    const saved = localStorage.getItem('physical_stores');
    if (saved) {
      try {
        this.stores = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load stores', e);
      }
    } else {
      // Mock data
      this.stores = [
        {
          id: 'store-1',
          ownerId: 'seller-1',
          name: 'Hà Nội Coffee House',
          description: 'Cà phê rang xay nguyên chất, không gian yên tĩnh.',
          address: '123 Phố Huế, Hai Bà Trưng, Hà Nội',
          latitude: 21.0173,
          longitude: 105.8500,
          category: 'DRINK',
          images: ['https://picsum.photos/seed/coffee/800/600'],
          openingHours: '07:00 - 22:00',
          rating: 4.8,
          reviewCount: 156,
          menu: [
            { id: 'm1', name: 'Cà phê đen', description: 'Đậm đà hương vị Việt', price: 25000, image: 'https://picsum.photos/seed/blackcoffee/200/200', category: 'Coffee', isAvailable: true },
            { id: 'm2', name: 'Bạc xỉu', description: 'Cà phê sữa nhiều sữa', price: 35000, image: 'https://picsum.photos/seed/bacxiu/200/200', category: 'Coffee', isAvailable: true }
          ],
          createdAt: new Date().toISOString()
        },
        {
          id: 'store-2',
          ownerId: 'seller-2',
          name: 'Bún Chả Hương Liên',
          description: 'Bún chả truyền thống nổi tiếng.',
          address: '24 Lê Văn Hưu, Hai Bà Trưng, Hà Nội',
          latitude: 21.0195,
          longitude: 105.8525,
          category: 'FOOD',
          images: ['https://picsum.photos/seed/buncha/800/600'],
          openingHours: '08:00 - 21:00',
          rating: 4.9,
          reviewCount: 2500,
          menu: [
            { id: 'm3', name: 'Suất bún chả đầy đủ', description: 'Chả miếng, chả băm, bún, rau sống', price: 60000, image: 'https://picsum.photos/seed/buncha-item/200/200', category: 'Main', isAvailable: true },
            { id: 'm4', name: 'Nem hải sản', description: 'Nem giòn tan', price: 15000, image: 'https://picsum.photos/seed/nem/200/200', category: 'Side', isAvailable: true }
          ],
          createdAt: new Date().toISOString()
        },
        {
          id: 'store-3',
          ownerId: 'seller-3',
          name: 'TechZone Store',
          description: 'Cửa hàng thiết bị điện tử, điện thoại và phụ kiện chính hãng.',
          address: '45 Thái Hà, Đống Đa, Hà Nội',
          latitude: 21.0123,
          longitude: 105.8211,
          category: 'ELECTRONICS',
          images: ['https://picsum.photos/seed/techstore/800/600'],
          openingHours: '09:00 - 21:00',
          rating: 4.7,
          reviewCount: 842,
          menu: [
            { id: 'm5', name: 'Tai nghe Bluetooth Pro', description: 'Chống ồn chủ động, pin 24h', price: 1250000, image: 'https://picsum.photos/seed/earbuds/200/200', category: 'Phụ kiện', isAvailable: true },
            { id: 'm6', name: 'Cáp sạc nhanh 65W', description: 'Dây dù siêu bền, dài 2m', price: 250000, image: 'https://picsum.photos/seed/cable/200/200', category: 'Phụ kiện', isAvailable: true }
          ],
          createdAt: new Date().toISOString()
        },
        {
          id: 'store-4',
          ownerId: 'seller-4',
          name: 'Glow Beauty Spa',
          description: 'Dịch vụ chăm sóc da và làm đẹp chuyên nghiệp.',
          address: '12 Nguyễn Thị Minh Khai, Q1, TP.HCM',
          latitude: 10.7769,
          longitude: 106.7009,
          category: 'BEAUTY',
          images: ['https://picsum.photos/seed/spa/800/600'],
          openingHours: '09:00 - 20:00',
          rating: 4.9,
          reviewCount: 320,
          menu: [
            { id: 'm7', name: 'Combo Chăm Sóc Da Mặt', description: 'Làm sạch sâu, massage, đắp mặt nạ', price: 450000, image: 'https://picsum.photos/seed/facial/200/200', category: 'Dịch vụ', isAvailable: true },
            { id: 'm8', name: 'Serum Phục Hồi', description: 'Sản phẩm chăm sóc da tại nhà', price: 850000, image: 'https://picsum.photos/seed/serum/200/200', category: 'Sản phẩm', isAvailable: true }
          ],
          createdAt: new Date().toISOString()
        }
      ];
      this.save();
    }
  }

  private save() {
    localStorage.setItem('physical_stores', JSON.stringify(this.stores));
    this.notifyListeners();
  }

  subscribe(listener: (stores: PhysicalStore[]) => void) {
    this.listeners.push(listener);
    listener(this.stores);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l([...this.stores]));
  }

  getStores() {
    return [...this.stores];
  }

  getStoreById(id: string) {
    return this.stores.find(s => s.id === id);
  }

  createStore(storeData: Omit<PhysicalStore, 'id' | 'createdAt' | 'rating' | 'reviewCount'>) {
    const newStore: PhysicalStore = {
      ...storeData,
      id: `store-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      rating: 0,
      reviewCount: 0,
      menu: storeData.menu || []
    };
    this.stores.push(newStore);
    this.save();
    return newStore;
  }

  updateStore(id: string, updates: Partial<PhysicalStore>) {
    const index = this.stores.findIndex(s => s.id === id);
    if (index !== -1) {
      this.stores[index] = { ...this.stores[index], ...updates };
      this.save();
      return this.stores[index];
    }
    return null;
  }

  addMenuItem(storeId: string, item: Omit<StoreMenuItem, 'id'>) {
    const store = this.stores.find(s => s.id === storeId);
    if (store) {
      const newItem: StoreMenuItem = {
        ...item,
        id: `menu-${Math.random().toString(36).substring(2, 9)}`
      };
      store.menu.push(newItem);
      this.save();
      return newItem;
    }
    return null;
  }

  deleteStore(id: string) {
    this.stores = this.stores.filter(s => s.id !== id);
    this.save();
  }
}

export const storeService = new StoreService();
