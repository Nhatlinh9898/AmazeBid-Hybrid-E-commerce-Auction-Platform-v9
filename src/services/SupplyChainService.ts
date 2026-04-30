
import { Supplier, RawMaterial, PurchaseInvoice, BOMItem, SupplierOption } from '../types';

class SupplyChainService {
  private suppliers: Supplier[] = [];
  private materials: RawMaterial[] = [];
  private invoices: PurchaseInvoice[] = [];
  private boms: BOMItem[] = [];
  private listeners: ((data: { suppliers: Supplier[], materials: RawMaterial[], invoices: PurchaseInvoice[], boms: BOMItem[] }) => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;

    const savedSuppliers = localStorage.getItem('amazebid_suppliers');
    const savedMaterials = localStorage.getItem('amazebid_materials');
    const savedInvoices = localStorage.getItem('amazebid_invoices');
    const savedBoms = localStorage.getItem('amazebid_boms');

    if (savedSuppliers) this.suppliers = JSON.parse(savedSuppliers);
    if (savedMaterials) this.materials = JSON.parse(savedMaterials);
    if (savedInvoices) this.invoices = JSON.parse(savedInvoices);
    if (savedBoms) this.boms = JSON.parse(savedBoms);

    // Initial mock data for BOM if empty
    if (this.boms.length === 0) {
      this.generateMockBOM();
    }
  }

  private generateMockBOM() {
    const motorId = 'prod-motor-01';
    const wireId = 'material-copper-01';
    const droneId = 'prod-drone-01';

    const mockBOM: BOMItem = {
      id: 'bom-a1',
      productId: droneId,
      name: 'Drone Quantum X1',
      specs: 'Carbon Fiber Body, 4x Brushless Motors',
      quantity: 1,
      unit: 'Unit',
      basePrice: 500,
      origin: 'Vietnam',
      supplierOptions: [],
      consumesProductIds: [motorId],
      subComponents: [
        {
          id: 'bom-a1-1',
          productId: motorId,
          name: 'Brushless Motor v2',
          specs: '2200KV, High Torque',
          quantity: 4,
          unit: 'Kit',
          basePrice: 45,
          origin: 'Germany',
          supplierOptions: this.getMockSuppliers('Brushless Motor'),
          consumesProductIds: [wireId],
          isMaterialFor: [droneId],
          subComponents: [
            {
              id: 'bom-a1-1-1',
              productId: wireId,
              name: 'Copper Wire',
              specs: '0.2mm, Grade A',
              quantity: 0.5,
              unit: 'kg',
              basePrice: 12,
              origin: 'Chile',
              supplierOptions: this.getMockSuppliers('Copper Wire'),
              isMaterialFor: [motorId]
            }
          ]
        }
      ]
    };
    this.boms.push(mockBOM);
    this.saveToStorage();
  }

  /**
   * Tìm các sản phẩm trong hệ sinh thái có thể tiêu thụ sản phẩm này (Forward Matching)
   */
  public findPotentialBuyers(productId: string): BOMItem[] {
    return this.boms.filter(b => b.consumesProductIds?.includes(productId));
  }

  /**
   * Tìm các linh kiện có sẵn trong hệ thống cho sản phẩm này (Backward Matching)
   */
  public findInternalSuppliers(bom: BOMItem): BOMItem[] {
    if (!bom.consumesProductIds) return [];
    return this.boms.filter(b => bom.consumesProductIds?.includes(b.productId));
  }

  private getMockSuppliers(name: string): SupplierOption[] {
    return [
      { id: 's1', name: `Top Global ${name}`, location: 'Berlin, Germany', origin: 'EU', contactPerson: 'Hans Mueller', contactEmail: 'hans@global.de', pricePerUnit: 40, shippingFee: 5, leadTimeDays: 7, rating: 4.9, reliabilityScore: 98 },
      { id: 's2', name: `${name} Direct`, location: 'Shenzhen, China', origin: 'CN', contactPerson: 'Li Wei', contactEmail: 'li@direct.cn', pricePerUnit: 35, shippingFee: 12, leadTimeDays: 14, rating: 4.5, reliabilityScore: 85 },
      { id: 's3', name: `${name} Local Hub`, location: 'HCM City, VN', origin: 'VN', contactPerson: 'Minh Tuan', contactEmail: 'tuan@local.vn', pricePerUnit: 42, shippingFee: 2, leadTimeDays: 2, rating: 4.7, reliabilityScore: 92 },
      { id: 's4', name: `Premium ${name} Co`, location: 'Osaka, Japan', origin: 'JP', contactPerson: 'Yuki Sato', contactEmail: 'yuki@premium.jp', pricePerUnit: 50, shippingFee: 8, leadTimeDays: 5, rating: 4.9, reliabilityScore: 99 },
      { id: 's5', name: `Economy ${name}`, location: 'Bangkok, Thailand', origin: 'TH', contactPerson: 'Somchai P', contactEmail: 'som@economy.th', pricePerUnit: 38, shippingFee: 6, leadTimeDays: 10, rating: 4.3, reliabilityScore: 78 }
    ];
  }

  private saveToStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('amazebid_suppliers', JSON.stringify(this.suppliers));
      localStorage.setItem('amazebid_materials', JSON.stringify(this.materials));
      localStorage.setItem('amazebid_invoices', JSON.stringify(this.invoices));
      localStorage.setItem('amazebid_boms', JSON.stringify(this.boms));
    }
    this.notify();
  }

  private notify() {
    const data = {
      suppliers: this.suppliers,
      materials: this.materials,
      invoices: this.invoices,
      boms: this.boms
    };
    this.listeners.forEach(l => l(data));
  }

  /**
   * Tính toán tổng giá thành vật liệu (Recursive)
   */
  public calculateTotalBOMCost(bom: BOMItem): number {
    const cost = (bom.subComponents && bom.subComponents.length > 0)
      ? bom.subComponents.reduce((acc, sub) => acc + (this.calculateTotalBOMCost(sub) * sub.quantity), 0)
      : bom.basePrice;
    return cost;
  }

  /**
   * Đề xuất 5 nhà cung cấp tối ưu hóa (Giá + Vận chuyển + Tin cậy)
   */
  public getOptimalSuppliers(suppliers: SupplierOption[], weightPrice = 0.6, weightTime = 0.4): SupplierOption[] {
    return [...suppliers]
      .sort((a, b) => {
        const scoreA = (a.pricePerUnit + a.shippingFee) * weightPrice + (a.leadTimeDays * 5) * weightTime;
        const scoreB = (b.pricePerUnit + b.shippingFee) * weightPrice + (b.leadTimeDays * 5) * weightTime;
        return scoreA - scoreB;
      })
      .slice(0, 5);
  }

  subscribe(listener: (data: { suppliers: Supplier[], materials: RawMaterial[], invoices: PurchaseInvoice[], boms: BOMItem[] }) => void) {
    this.listeners.push(listener);
    listener({
      suppliers: this.suppliers,
      materials: this.materials,
      invoices: this.invoices,
      boms: this.boms
    });
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Supplier Methods
  addSupplier(supplier: Omit<Supplier, 'id'>) {
    const newSupplier = { ...supplier, id: `sup-${Math.random().toString(36).substring(2, 9)}` };
    this.suppliers.push(newSupplier);
    this.saveToStorage();
    return newSupplier;
  }

  updateSupplier(id: string, updates: Partial<Supplier>) {
    this.suppliers = this.suppliers.map(s => s.id === id ? { ...s, ...updates } : s);
    this.saveToStorage();
  }

  deleteSupplier(id: string) {
    this.suppliers = this.suppliers.filter(s => s.id !== id);
    this.saveToStorage();
  }

  // Material Methods
  addMaterial(material: Omit<RawMaterial, 'id'>) {
    const newMaterial = { ...material, id: `mat-${Math.random().toString(36).substring(2, 9)}` };
    this.materials.push(newMaterial);
    this.saveToStorage();
    return newMaterial;
  }

  updateMaterial(id: string, updates: Partial<RawMaterial>) {
    this.materials = this.materials.map(m => m.id === id ? { ...m, ...updates } : m);
    this.saveToStorage();
  }

  deleteMaterial(id: string) {
    this.materials = this.materials.filter(m => m.id !== id);
    this.saveToStorage();
  }

  // Invoice Methods
  addInvoice(invoice: Omit<PurchaseInvoice, 'id'>) {
    const newInvoice = { ...invoice, id: `inv-${Math.random().toString(36).substring(2, 9)}` };
    this.invoices.push(newInvoice);
    
    // Update material stocks
    newInvoice.items.forEach(item => {
      const material = this.materials.find(m => m.id === item.materialId);
      if (material) {
        this.updateMaterial(material.id, { 
          stock: material.stock + item.quantity,
          lastPurchaseDate: newInvoice.invoiceDate
        });
      }
    });

    this.saveToStorage();
    return newInvoice;
  }

  getSuppliersByOwner(ownerId: string) {
    return this.suppliers.filter(s => s.ownerId === ownerId);
  }

  getMaterialsByOwner(ownerId: string) {
    return this.materials.filter(m => m.ownerId === ownerId);
  }

  getInvoicesByOwner(ownerId: string) {
    return this.invoices.filter(i => i.ownerId === ownerId);
  }

  // BOM Methods
  saveBOM(bom: BOMItem) {
    const existingIndex = this.boms.findIndex(b => b.id === bom.id);
    if (existingIndex > -1) {
      this.boms[existingIndex] = bom;
    } else {
      this.boms.push(bom);
    }
    this.saveToStorage();
  }

  deleteBOM(id: string) {
    this.boms = this.boms.filter(b => b.id !== id);
    this.saveToStorage();
  }
}

export const supplyChainService = new SupplyChainService();
