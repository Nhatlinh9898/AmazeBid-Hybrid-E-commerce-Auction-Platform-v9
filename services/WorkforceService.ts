import { StaffRole, StaffPermission, StoreStaff } from '../types';

class WorkforceService {
  private staff: StoreStaff[] = [];
  private listeners: ((staff: StoreStaff[]) => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const saved = localStorage.getItem('amazebid_workforce');
    if (saved) {
      this.staff = JSON.parse(saved);
    }
  }

  private saveToStorage() {
    localStorage.setItem('amazebid_workforce', JSON.stringify(this.staff));
    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l([...this.staff]));
  }

  subscribe(listener: (staff: StoreStaff[]) => void) {
    this.listeners.push(listener);
    listener([...this.staff]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Lấy danh sách nhân viên của một chi nhánh
  getStaffByStore(storeId: string): StoreStaff[] {
    return this.staff.filter(s => s.storeId === storeId);
  }

  // Thêm nhân viên mới vào chi nhánh
  addStaff(member: Omit<StoreStaff, 'id' | 'joinDate' | 'status'>) {
    const newMember: StoreStaff = {
      ...member,
      id: `staff_${Math.random().toString(36).substr(2, 9)}`,
      joinDate: new Date().toISOString(),
      status: 'ACTIVE'
    };
    this.staff.push(newMember);
    this.saveToStorage();
    return newMember;
  }

  // Cập nhật vai trò/quyền
  updateStaff(id: string, updates: Partial<StoreStaff>) {
    this.staff = this.staff.map(s => s.id === id ? { ...s, ...updates } : s);
    this.saveToStorage();
  }

  // Kiểm tra quyền truy cập (Security Point)
  hasPermission(userId: string, storeId: string, permission: StaffPermission): boolean {
    const member = this.staff.find(s => s.userId === userId && s.storeId === storeId && s.status === 'ACTIVE');
    if (!member) return false;
    
    // Super admin có mọi quyền
    if (member.role === StaffRole.SUPER_ADMIN) return true;
    
    return member.permissions.includes(permission);
  }

  // Vai trò mặc định cho từng vị trí
  getDefaultPermissions(role: StaffRole): StaffPermission[] {
    switch (role) {
      case StaffRole.SUPER_ADMIN:
        return Object.values(StaffPermission);
      case StaffRole.STORE_MANAGER:
        return [
          StaffPermission.MANAGE_PRODUCTS,
          StaffPermission.MANAGE_INVENTORY,
          StaffPermission.CREATE_ORDER,
          StaffPermission.VIEW_REPORTS,
          StaffPermission.MANAGE_STAFF,
          StaffPermission.VIEW_CUSTOMER_DATA
        ];
      case StaffRole.CASHIER:
      case StaffRole.BARISTA:
        return [StaffPermission.CREATE_ORDER];
      case StaffRole.INVENTORY_MANAGER:
        return [StaffPermission.MANAGE_INVENTORY, StaffPermission.MANAGE_PRODUCTS];
      case StaffRole.SALES_EXECUTIVE:
        return [StaffPermission.CREATE_ORDER, StaffPermission.MANAGE_PRODUCTS, StaffPermission.VIEW_CUSTOMER_DATA];
      case StaffRole.MARKETING_SPECIALIST:
        return [StaffPermission.MANAGE_MARKETING, StaffPermission.VIEW_CUSTOMER_DATA];
      case StaffRole.KITCHEN_CHEF:
        return [StaffPermission.MANAGE_PRODUCTS];
      default:
        return [];
    }
  }

  // Xác thực đăng nhập nhân viên
  authenticate(userId: string, storeId: string, password?: string): StoreStaff | null {
    const member = this.staff.find(s => 
      s.userId === userId && 
      s.storeId === storeId && 
      s.status === 'ACTIVE' &&
      (!s.password || s.password === password)
    );
    return member || null;
  }
}

export const workforceService = new WorkforceService();
