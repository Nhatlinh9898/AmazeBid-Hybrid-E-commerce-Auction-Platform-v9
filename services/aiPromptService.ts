
import { GoogleGenAI } from "@google/genai";

export type StyleProfile = 'AmazeBid' | 'MC_Livestream' | 'SEO' | 'Neutral' | 'TikTok_Shop' | 'Shopee_FlashSale';

export const STYLE_PROFILES: Record<StyleProfile, string> = {
  AmazeBid: "Chuyên nghiệp, tin cậy, tập trung vào giá trị đấu giá và sự khan hiếm. Ngôn từ sang trọng nhưng gần gũi.",
  MC_Livestream: "Năng động, hào hứng, sử dụng nhiều từ cảm thán, thúc giục (FOMO). Phong cách 'chốt đơn' trực tiếp.",
  SEO: "Tối ưu từ khóa, cấu trúc rõ ràng với bullet points, tập trung vào thông số kỹ thuật và lợi ích thực tế.",
  Neutral: "Khách quan, trung tính, cung cấp thông tin đầy đủ và chính xác mà không dùng từ ngữ biểu cảm mạnh.",
  TikTok_Shop: "Ngắn gọn, bắt trend, sử dụng nhiều emoji, tập trung vào sự tiện lợi và 'phải có'.",
  Shopee_FlashSale: "Giật gân, tập trung vào con số giảm giá, quà tặng và giới hạn thời gian."
};

export interface BundleSchema {
  main_product: string;
  intent: string;
  related_products: Array<{ name: string; role: 'core' | 'support' | 'enhancer' | 'upgrade' }>;
  bundles: {
    budget: { items: string[]; benefits: string[]; sales_copy_raw: string; sales_copy_styled?: string };
    standard: { items: string[]; benefits: string[]; sales_copy_raw: string; sales_copy_styled?: string };
    premium: { items: string[]; benefits: string[]; sales_copy_raw: string; sales_copy_styled?: string };
  };
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * 🎨 MODULE 1: PROMPT STYLE ENGINE
 * Rewrites raw content into a specific style.
 */
export const rewriteWithStyle = async (rawJson: any, style: StyleProfile): Promise<any> => {
  const styleDescription = STYLE_PROFILES[style];
  const prompt = `
Bạn là Local AI Style Engine. 
Nhiệm vụ của bạn:
- Nhận nội dung thô từ Cloud AI.
- Rewrite lại theo style: ${style} (${styleDescription}).
- Giữ nguyên thông tin sản phẩm, không thêm thông tin không có thật.
- Làm nội dung hấp dẫn, rõ ràng, dễ đọc, tăng chuyển đổi.
- Không thay đổi cấu trúc JSON, chỉ thay đổi nội dung text bên trong.

Quy tắc:
- Không được thêm trường mới.
- Không được đổi tên trường.
- Không được thay đổi số lượng sản phẩm.
- Không được thay đổi meaning.
- Chỉ được rewrite nội dung text.

Dữ liệu đầu vào:
${JSON.stringify(rawJson, null, 2)}

Hãy trả về JSON đã được rewrite theo style ${style}.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Style Engine Error:", error);
    return rawJson;
  }
};

/**
 * 🧼 MODULE 2: PROMPT LOCAL AI CANONICALIZER
 * Standardizes and beautifies combo data.
 */
export const canonicalizeCombo = async (rawJson: any, style: StyleProfile = 'AmazeBid'): Promise<any> => {
  const prompt = `
Bạn là Local AI Canonicalizer. 
Nhiệm vụ:
- Nhận JSON thô từ Cloud AI.
- Chuẩn hóa nội dung.
- Làm rõ ràng, mạch lạc.
- Rewrite mô tả combo cho hấp dẫn.
- Giữ nguyên schema.
- Không thêm trường mới.
- Không thay đổi meaning.
- Không thay đổi số lượng sản phẩm.

Các bước xử lý:
1. Kiểm tra JSON hợp lệ.
2. Chuẩn hóa tên combo.
3. Chuẩn hóa lợi ích (ngắn – rõ – đúng).
4. Rewrite sales_copy theo style ${style}.
5. Giữ nguyên cấu trúc JSON.

Input:
${JSON.stringify(rawJson, null, 2)}

Output:
JSON đã canonicalize + rewrite theo style ${style}.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Canonicalizer Error:", error);
    return rawJson;
  }
};

/**
 * 💰 MODULE 3: PRICE-BASED BUNDLE GENERATOR
 * Generates 3 tiers of bundles (Budget, Standard, Premium).
 */
export const generatePriceBundles = async (productName: string, userInput: string = ''): Promise<BundleSchema | null> => {
  const prompt = `
Bạn là Cloud AI. 
Nhiệm vụ:
- Nhận sản phẩm chính: ${productName}.
- Hiểu nhu cầu thực tế của người mua.
- Tự động đề xuất các sản phẩm liên quan.
- Tạo combo theo 3 mức giá: Budget, Standard, Premium.
- Không làm đẹp nội dung.
- Không rewrite.
- Chỉ tạo nội dung thô.
- Xuất ra JSON đúng schema.

Schema:
{
  "main_product": "<ten_san_pham_chinh>",
  "intent": "<nhu_cau>",
  "related_products": [
    {"name": "", "role": "<core|support|enhancer|upgrade>"}
  ],
  "bundles": {
    "budget": {
      "items": [],
      "benefits": [],
      "sales_copy_raw": ""
    },
    "standard": {
      "items": [],
      "benefits": [],
      "sales_copy_raw": ""
    },
    "premium": {
      "items": [],
      "benefits": [],
      "sales_copy_raw": ""
    }
  }
}

Quy tắc:
- Không thêm trường mới.
- Không thay đổi tên trường.
- Không làm đẹp văn phong.
- Nếu thiếu dữ liệu, để trống.

Dữ liệu đầu vào:
${userInput || `Tạo combo theo 3 mức giá cho sản phẩm chính: ${productName}`}

Hãy trả về JSON đúng schema.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    
    const rawBundles = JSON.parse(response.text || '{}');
    
    // Pipeline: Cloud AI (Raw) -> Local AI (Canonicalize + Style)
    const styledBundles = await canonicalizeCombo(rawBundles, 'AmazeBid');
    
    return styledBundles as BundleSchema;
  } catch (error) {
    console.error("Bundle Generator Error:", error);
    return null;
  }
};
