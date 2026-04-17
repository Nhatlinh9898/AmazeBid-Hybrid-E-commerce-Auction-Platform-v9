import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface DemandForecast {
  productId: string;
  suggestedRestockQuantity: number;
  reason: string;
}

export async function forecastDemand(products: Product[]): Promise<DemandForecast[]> {
  // If no API key, fallback to local analysis
  if (!process.env.GEMINI_API_KEY) {
    return localForecastDemand(products);
  }

  const productData = products.map(p => ({
    id: p.id,
    title: p.title,
    stock: p.stock || 0,
    sold: p.sold || 0,
    category: p.category
  }));

  const prompt = `
    Analyze the following product sales data and suggest restock quantities.
    Products: ${JSON.stringify(productData)}
    
    For each product, suggest a restock quantity (integer) and a brief reason.
    Return the result as a JSON array of objects with fields: productId, suggestedRestockQuantity, reason.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            productId: { type: Type.STRING },
            suggestedRestockQuantity: { type: Type.INTEGER },
            reason: { type: Type.STRING }
          },
          required: ['productId', 'suggestedRestockQuantity', 'reason']
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
}

export interface ComboSuggestion {
  productIds: string[];
  reason: string;
}

export async function suggestCombos(products: Product[]): Promise<ComboSuggestion[]> {
  // If no API key, fallback to local analysis
  if (!process.env.GEMINI_API_KEY) {
    return localSuggestCombos(products);
  }

  const productData = products.map(p => ({
    id: p.id,
    title: p.title,
    category: p.category
  }));

  const prompt = `
    Analyze the following products and suggest product combos that are frequently bought together.
    Products: ${JSON.stringify(productData)}
    
    Suggest 3-5 combos.
    Return the result as a JSON array of objects with fields: productIds (array of strings), reason.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            productIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            reason: { type: Type.STRING }
          },
          required: ['productIds', 'reason']
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
}

/**
 * Bộ xử lý phân tích dữ liệu nội bộ (Rule-based Engine)
 * Tự động chạy mà không cần gọi API AI bên ngoài.
 */

export function localForecastDemand(products: Product[]): DemandForecast[] {
  return products
    .filter(p => (p.stock || 0) < 10 || (p.sold || 0) > 0)
    .map(p => {
      const sold = p.sold || 0;
      const stock = p.stock || 0;
      let suggested: number;
      let reason: string;

      if (stock === 0) {
        suggested = Math.max(10, Math.ceil(sold * 0.8));
        reason = "Sản phẩm đã hết hàng. Lịch sử bán hàng cho thấy nhu cầu vẫn cao.";
      } else if (stock < 5) {
        suggested = Math.max(5, Math.ceil(sold * 0.4));
        reason = "Số lượng tồn kho đang ở mức báo động đỏ.";
      } else if (sold > stock) {
        suggested = Math.ceil((sold - stock) * 1.5);
        reason = "Tốc độ tiêu thụ vượt qua khả năng cung ứng hiện tại.";
      } else {
        suggested = Math.ceil(stock * 0.3);
        reason = "Duy trì mức tồn kho an toàn dựa trên quy mô danh mục.";
      }

      return {
        productId: p.id,
        suggestedRestockQuantity: suggested,
        reason: "[Local Engine] " + reason
      };
    })
    .sort((a, b) => b.suggestedRestockQuantity - a.suggestedRestockQuantity)
    .slice(0, 5);
}

export function localSuggestCombos(products: Product[]): ComboSuggestion[] {
  const categories = Array.from(new Set(products.map(p => p.category)));
  const combos: ComboSuggestion[] = [];

  // Quy tắc 1: Gom nhóm cùng danh mục
  categories.forEach(cat => {
    const productsInCat = products.filter(p => p.category === cat);
    if (productsInCat.length >= 2) {
      combos.push({
        productIds: productsInCat.slice(0, 2).map(p => p.id),
        reason: `[Local Engine] Sản phẩm cùng nhóm ${cat} thường có tỉ lệ mua kèm cao.`
      });
    }
  });

  // Quy tắc 2: Phối hợp danh mục bổ trợ (Heuristics)
  const mainItems = products.filter(p => ['điện tử', 'thời trang', 'đồ gia dụng'].includes(p.category.toLowerCase()));
  const accessories = products.filter(p => p.category.toLowerCase().includes('phụ kiện'));

  if (mainItems.length > 0 && accessories.length > 0) {
    combos.push({
      productIds: [mainItems[0].id, accessories[0].id],
      reason: "[Local Engine] Combo Sản phẩm chính + Phụ kiện giúp tối ưu hóa giá trị đơn hàng."
    });
  }

  return combos.slice(0, 3);
}
