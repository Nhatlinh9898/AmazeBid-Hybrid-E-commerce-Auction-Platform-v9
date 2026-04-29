import { StaffRole, StaffPermission, StoreStaff } from '../types';
import { storeService } from './StoreService';

class WorkforceService {
  private staff: StoreStaff[] = [];
  private listeners: ((staff: StoreStaff[]) => void)[] = [];

  constructor() {
    this.refresh();
  }

  async refresh() {
    try {
      const resp = await fetch('/api/staff');
      const json = await resp.json();
      if (json.status === 'success') {
        this.staff = json.data.staff;
        this.notify();
      } else {
        this.loadFromStorage();
      }
    } catch (error) {
      console.warn('[WorkforceService] Failed to load staff from API, using localStorage:', error);
      this.loadFromStorage();
    }
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
  async addStaff(member: Omit<StoreStaff, 'id' | 'joinDate' | 'status'>) {
    try {
      const resp = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member)
      });
      const json = await resp.json();
      if (json.status === 'success') {
        const newMember = json.data.staff;
        this.staff.push(newMember);
        this.saveToStorage();
        return newMember;
      }
      throw new Error(json.data?.message || 'Failed to add staff');
    } catch {
       // Fallback to local if API fails
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
  }

  // Cập nhật vai trò/quyền
  async updateStaff(id: string, updates: Partial<StoreStaff>) {
    try {
      const resp = await fetch(`/api/staff/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const json = await resp.json();
      if (json.status === 'success') {
        this.staff = this.staff.map(s => s.id === id ? { ...s, ...json.data.staff } : s);
      } else {
        this.staff = this.staff.map(s => s.id === id ? { ...s, ...updates } : s);
      }
    } catch {
      this.staff = this.staff.map(s => s.id === id ? { ...s, ...updates } : s);
    }
    this.saveToStorage();
  }

  // Kiểm tra quyền truy cập (Security Point) - Đã nâng cấp để hỗ trợ phân quyền theo cấp bậc
  hasPermission(identifier: string, storeId: string, permission: StaffPermission): boolean {
    if (!identifier) return false;
    const searchId = (identifier || '').toLowerCase().trim();
    
    // Tìm nhân viên khớp với định danh (ID hoặc Email)
    const members = this.staff.filter(s => 
      ((s.userId && s.userId.toLowerCase().trim() === searchId) || (s.email && s.email.toLowerCase().trim() === searchId)) && 
      s.status === 'ACTIVE'
    );

    if (members.length === 0) return false;

    // Kiểm tra xem có bản ghi quyền nào khớp với storeId hoặc cấp cha của storeId không
    const targetStore = storeService.getStoreById(storeId);
    
    for (const member of members) {
      // 1. Khớp trực tiếp chi nhánh
      if (member.storeId === storeId) {
        if (member.role === StaffRole.SUPER_ADMIN) return true;
        if (member.permissions.includes(permission)) return true;
      }
      
      // 2. Kiểm tra nếu nhân viên thuộc tập đoàn của chi nhánh này
      if (targetStore?.parentId === member.storeId || targetStore?.id === member.corporationId) {
        // Nếu là quản lý cấp trên, mặc định có quyền quản lý cấp dưới
        if (member.role === StaffRole.SUPER_ADMIN || member.role === StaffRole.STORE_MANAGER) return true;
      }
    }
    
    return false;
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

  // Lấy danh sách ID các chi nhánh mà nhân viên đang làm việc - Hỗ trợ phân tầng
  getStoresByStaff(identifier: string): string[] {
    if (!identifier) return [];
    const searchId = (identifier || '').toLowerCase().trim();
    
    // Tìm tất cả các chi nhánh nhân viên được gán trực tiếp
    const directStoreIds = this.staff
      .filter(s => (
        (s.userId && s.userId.toLowerCase().trim() === searchId) || 
        (s.email && s.email.toLowerCase().trim() === searchId)
      ) && s.status === 'ACTIVE')
      .map(s => s.storeId);

    if (directStoreIds.length === 0) return [];

    // Tìm tất cả các chi nhánh con thuộc các tổ chức mà nhân viên này quản lý
    const allStores = storeService.getStores();
    const resultStoreIds = new Set<string>(directStoreIds);

    for (const storeId of directStoreIds) {
      const staffMember = this.getStaffInfo(identifier, storeId);
      // Nếu là quản lý cấp cao (CEO/Manager) của một chi nhánh/tập đoàn, cho phép thấy các chi nhánh con
      if (staffMember && (staffMember.role === StaffRole.SUPER_ADMIN || staffMember.role === StaffRole.STORE_MANAGER)) {
        allStores.forEach(s => {
          if (s.parentId === storeId || s.corporationId === storeId) {
            resultStoreIds.add(s.id);
          }
        });
      }
    }

    return Array.from(resultStoreIds);
  }

  // Lấy thông tin chi tiết vai trò của nhân viên tại một chi nhánh
  getStaffInfo(identifier: string, storeId: string): StoreStaff | null {
    if (!identifier) return null;
    const searchId = (identifier || '').toLowerCase().trim();
    return this.staff.find(s => (
      (s.userId && s.userId.toLowerCase().trim() === searchId) || 
      (s.email && s.email.toLowerCase().trim() === searchId)
    ) && s.storeId === storeId && s.status === 'ACTIVE') || null;
  }

  // Lấy đường dẫn tổ chức của nhân viên (Corporation > Company > Department)
  getOrganizationPath(identifier: string, storeId: string): string[] {
    const member = this.getStaffInfo(identifier, storeId);
    if (!member) return ['Unknown'];

    const path = [];
    if (member.corporationId) {
       path.push(`Tập đoàn: ${member.corporationId}`);
    } else {
       path.push('Doanh nghiệp độc lập');
    }

    path.push(`Công ty: ${member.storeId}`);

    if (member.departmentId) {
      path.push(`Phòng ban: ${member.departmentId}`);
    }

    return path;
  }

  // Lấy chi tiết vị trí công việc
  getJobTitle(identifier: string, storeId: string): string {
    const member = this.getStaffInfo(identifier, storeId);
    if (!member) return 'Guest';
    return member.position || member.role;
  }

  // Xác thực đăng nhập nhân viên
  authenticate(identifier: string, storeId: string, password?: string): StoreStaff | null {
    if (!identifier) return null;
    const searchId = (identifier || '').toLowerCase().trim();
    const member = this.staff.find(s => 
      ((s.userId && s.userId.toLowerCase().trim() === searchId) || (s.email && s.email.toLowerCase().trim() === searchId)) && 
      s.storeId === storeId && 
      s.status === 'ACTIVE' &&
      (!s.password || s.password === password)
    );
    return member || null;
  }
}

export const workforceService = new WorkforceService();
