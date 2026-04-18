import { api } from './api';
import { storeService } from './StoreService';
import { supplyChainService } from '../src/services/SupplyChainService';
import { OrderStatus, StoreMenuItem, RawMaterial } from '../types';

export const marketplaceSyncService = {
  /**
   * Kiểm tra xem một món ăn có đủ nguyên liệu để chế biến không.
   */
  isMenuItemAvailable(item: StoreMenuItem, materials: RawMaterial[]): boolean {
    if (!item.recipe || item.recipe.ingredients.length === 0) {
      return item.isAvailable;
    }

    // Kiểm tra từng nguyên liệu trong định lượng
    for (const ingredient of item.recipe.ingredients) {
      const material = materials.find(m => m.id === ingredient.materialId);
      if (!material || material.stock < ingredient.quantity) {
        return false;
      }
    }

    return true;
  },

  /**
   * Đồng bộ trạng thái sản phẩm trên Marketplace với tồn kho nguyên liệu thực tế.
   */
  async syncInventory(ownerId: string): Promise<{ updated: number, total: number }> {
    try {
      // 1. Lấy tất cả sản phẩm của người bán
      const { products } = await api.products.getAll();
      const myMarketplaceProducts = products.filter(p => p.sellerId === ownerId && p.storeId && p.menuItemId);

      if (myMarketplaceProducts.length === 0) return { updated: 0, total: 0 };

      // 2. Lấy dữ liệu cửa hàng và nguyên liệu
      const stores = storeService.getStores().filter(s => s.ownerId === ownerId);
      const materials = supplyChainService.getMaterialsByOwner(ownerId);

      let updatedCount = 0;

      // 3. Duyệt qua từng sản phẩm đã đăng bán từ thực đơn
      for (const product of myMarketplaceProducts) {
        const store = stores.find(s => s.id === product.storeId);
        if (!store) continue;

        const menuItem = store.menu.find(m => m.id === product.menuItemId);
        if (!menuItem) {
          // Nếu món ăn không còn trong thực đơn, có thể ẩn sản phẩm
          if (product.status !== OrderStatus.OUT_OF_STOCK) {
             await api.products.update(product.id, { status: OrderStatus.OUT_OF_STOCK });
             updatedCount++;
          }
          continue;
        }

        const isAvailable = this.isMenuItemAvailable(menuItem, materials);
        
        // Cập nhật trạng thái nếu thay đổi
        if (isAvailable && product.status === OrderStatus.OUT_OF_STOCK) {
          await api.products.update(product.id, { status: OrderStatus.AVAILABLE });
          updatedCount++;
        } else if (!isAvailable && product.status !== OrderStatus.OUT_OF_STOCK) {
          await api.products.update(product.id, { status: OrderStatus.OUT_OF_STOCK });
          updatedCount++;
        }
      }

      return { updated: updatedCount, total: myMarketplaceProducts.length };
    } catch (error) {
      console.error('Marketplace Sync Error:', error);
      return { updated: 0, total: 0 };
    }
  }
};
