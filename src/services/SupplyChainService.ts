
import { Supplier, RawMaterial, PurchaseInvoice } from '../types';

class SupplyChainService {
  private suppliers: Supplier[] = [];
  private materials: RawMaterial[] = [];
  private invoices: PurchaseInvoice[] = [];
  private listeners: ((data: { suppliers: Supplier[], materials: RawMaterial[], invoices: PurchaseInvoice[] }) => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;

    const savedSuppliers = localStorage.getItem('amazebid_suppliers');
    const savedMaterials = localStorage.getItem('amazebid_materials');
    const savedInvoices = localStorage.getItem('amazebid_invoices');

    if (savedSuppliers) this.suppliers = JSON.parse(savedSuppliers);
    if (savedMaterials) this.materials = JSON.parse(savedMaterials);
    if (savedInvoices) this.invoices = JSON.parse(savedInvoices);

    // Initial mock data if empty
    if (this.suppliers.length === 0) {
      this.suppliers = [
        {
          id: 'sup-1',
          ownerId: 'seller-1',
          name: 'Nông sản Sạch Đà Lạt',
          contactPerson: 'Nguyễn Văn A',
          phone: '0901234567',
          email: 'dalat@nongsan.vn',
          address: 'Đà Lạt, Lâm Đồng',
          rating: 4.8
        }
      ];
      this.saveToStorage();
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('amazebid_suppliers', JSON.stringify(this.suppliers));
      localStorage.setItem('amazebid_materials', JSON.stringify(this.materials));
      localStorage.setItem('amazebid_invoices', JSON.stringify(this.invoices));
    }
    this.notify();
  }

  private notify() {
    const data = {
      suppliers: this.suppliers,
      materials: this.materials,
      invoices: this.invoices
    };
    this.listeners.forEach(l => l(data));
  }

  subscribe(listener: (data: { suppliers: Supplier[], materials: RawMaterial[], invoices: PurchaseInvoice[] }) => void) {
    this.listeners.push(listener);
    listener({
      suppliers: this.suppliers,
      materials: this.materials,
      invoices: this.invoices
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
}

export const supplyChainService = new SupplyChainService();
