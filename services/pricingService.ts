import { Product } from '../types';
import { localAnalyzeProfit } from '../src/services/inventoryService';

export interface PricingPlan {
  sellingPrice: number;
  breakEvenQuantity: number;
  flashSalePrice: number;
  estimatedProfit: number;
  systemFeePerUnit: number;
}

export class PricingService {
  private static DEFAULT_MARKUP = 0.25; // 25% markup
  private static SYSTEM_FEE_RATE = 0.05; // 5% of profit

  /**
   * Calculates a pricing plan based on cost price and stock.
   */
  static calculatePlan(costPrice: number, totalStock: number, markup: number = this.DEFAULT_MARKUP): PricingPlan {
    const sellingPrice = costPrice * (1 + markup);
    
    // Total investment = costPrice * totalStock
    // How many units at sellingPrice to recover investment?
    const breakEvenQuantity = Math.ceil((costPrice * totalStock) / sellingPrice);
    
    // Profit per unit = sellingPrice - costPrice
    const profitPerUnit = sellingPrice - costPrice;
    const systemFeePerUnit = profitPerUnit * this.SYSTEM_FEE_RATE;
    
    // Remaining units for campaigns (Flash Sale/Live)
    // We can sell these at a lower price since we've recovered the cost
    const flashSalePrice = costPrice * 1.1; // 10% profit for flash sales
    
    const estimatedProfit = (breakEvenQuantity * (profitPerUnit - systemFeePerUnit)) + 
                            ((totalStock - breakEvenQuantity) * (flashSalePrice - costPrice));

    return {
      sellingPrice: Number(sellingPrice.toFixed(2)),
      breakEvenQuantity,
      flashSalePrice: Number(flashSalePrice.toFixed(2)),
      estimatedProfit: Number(estimatedProfit.toFixed(2)),
      systemFeePerUnit: Number(systemFeePerUnit.toFixed(2))
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
