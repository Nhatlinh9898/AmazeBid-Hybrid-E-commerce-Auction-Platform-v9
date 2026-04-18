import { Product } from '../types';
import { localAnalyzeProfit } from '../src/services/inventoryService';
import { configService } from './ConfigService';

export interface PricingPlan {
  sellingPrice: number;
  breakEvenQuantity: number;
  flashSalePrice: number;
  estimatedProfit: number;
  systemFeePerUnit: number;
  vatAmountPerUnit: number;
  specialTaxAmountPerUnit: number;
  netProfitPerUnit: number;
}

export class PricingService {
  private static DEFAULT_MARKUP = 0.40; // 40% markup as default

  /**
   * Calculates a pricing plan based on cost price and stock, including taxes.
   */
  static calculatePlan(
    costPrice: number, 
    totalStock: number, 
    markup: number = this.DEFAULT_MARKUP,
    customVat?: number,
    customSpecialTax?: number
  ): PricingPlan {
    const config = configService.getConfig();
    const vatRate = customVat !== undefined ? customVat : config.defaultVatRate;
    const specialTaxRate = customSpecialTax || 0;
    
    // Price before tax = cost * (1 + markup)
    const basePrice = costPrice * (1 + markup);
    
    // Special Tax (Thuế tiêu thụ đặc biệt) applied on base price
    const specialTaxAmount = basePrice * specialTaxRate;
    
    // VAT applied on (Base Price + Special Tax)
    const vatAmount = (basePrice + specialTaxAmount) * vatRate;
    
    // Final Selling Price to user
    const sellingPrice = basePrice + specialTaxAmount + vatAmount;
    
    // Platform fee on profit
    const profitBeforePlatform = basePrice - costPrice;
    const systemFeePerUnit = profitBeforePlatform * config.platformFeeRate;
    
    const netProfitPerUnit = profitBeforePlatform - systemFeePerUnit;
    
    // Break even analysis
    const breakEvenQuantity = Math.ceil((costPrice * totalStock) / sellingPrice);
    
    const flashSalePrice = costPrice * 1.1 + specialTaxAmount + vatAmount; 
    
    const estimatedProfit = (breakEvenQuantity * netProfitPerUnit) + 
                            ((totalStock - breakEvenQuantity) * (flashSalePrice - costPrice - specialTaxAmount - vatAmount - (flashSalePrice - costPrice - specialTaxAmount - vatAmount) * config.platformFeeRate));

    return {
      sellingPrice: Number(sellingPrice.toFixed(2)),
      breakEvenQuantity,
      flashSalePrice: Number(flashSalePrice.toFixed(2)),
      estimatedProfit: Number(estimatedProfit.toFixed(2)),
      systemFeePerUnit: Number(systemFeePerUnit.toFixed(2)),
      vatAmountPerUnit: Number(vatAmount.toFixed(2)),
      specialTaxAmountPerUnit: Number(specialTaxAmount.toFixed(2)),
      netProfitPerUnit: Number(netProfitPerUnit.toFixed(2))
    };
  }

  /**
   * Checks if a product should transition to the "Campaign" phase (Flash Sale/Live)
   */
  static shouldStartCampaign(product: Product): boolean {
    if (!product.breakEvenQuantity || !product.sold) return false;
    return product.sold >= product.breakEvenQuantity;
  }

  /**
   * AI Skill: Generate a pricing strategy description (Now Local)
   */
  static getAIStrategyDescription(plan: PricingPlan, totalStock: number, product?: Product): string {
    if (product) {
      const { analysis } = localAnalyzeProfit(product);
      return analysis;
    }
    
    return `Chiến lược định giá nội bộ:
- Giá bán đề xuất: $${plan.sellingPrice} (Lợi nhuận gộp: $${(plan.sellingPrice - plan.flashSalePrice/1.1).toFixed(2)}/sp)
- Điểm hòa vốn: Bán ${plan.breakEvenQuantity}/${totalStock} sản phẩm để thu hồi vốn.
- Giai đoạn 2: Sau khi hòa vốn, ${totalStock - plan.breakEvenQuantity} sản phẩm còn lại sẽ được đẩy vào Flash Sale với giá cực sốc $${plan.flashSalePrice} để tối ưu hóa lợi nhuận và giải phóng kho.
- Phí hệ thống: 5% lợi nhuận ($${plan.systemFeePerUnit}/sp) sẽ được trích vào quỹ vận hành.`;
  }
}
