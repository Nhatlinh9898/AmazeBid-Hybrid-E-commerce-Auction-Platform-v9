import { GoogleGenAI, Type } from "@google/genai";

export interface AIImportResult {
  title: string;
  description: string;
  category: string;
  price: string;
  costPrice: string;
  totalStock: string;
}

/**
 * AI Smart Import Service
 * Handles extracting product data from images, invoices, and files using Gemini AI.
 */
export const aiImportService = {
  /**
   * Analyzes an invoice image to extract product details.
   */
  analyzeInvoice: async (base64Image: string, mimeType: string): Promise<AIImportResult | null> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
            {
              text: `Bạn là một chuyên gia phân tích hóa đơn nhập hàng. 
              Hãy trích xuất các thông tin sau từ hóa đơn này để tạo sản phẩm trên sàn thương mại điện tử:
              - Tên sản phẩm (title)
              - Mô tả ngắn gọn (description)
              - Danh mục phù hợp (category)
              - Giá bán lẻ đề xuất (price)
              - Giá vốn nhập hàng (costPrice)
              - Số lượng nhập (totalStock)
              
              Nếu không tìm thấy thông tin chính xác, hãy dự đoán một cách hợp lý nhất dựa trên ngữ cảnh.`,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Tên sản phẩm" },
              description: { type: Type.STRING, description: "Mô tả sản phẩm chuẩn SEO" },
              category: { type: Type.STRING, description: "Danh mục sản phẩm (VD: Electronics, Fashion, Collectibles...)" },
              price: { type: Type.STRING, description: "Giá bán lẻ đề xuất (USD)" },
              costPrice: { type: Type.STRING, description: "Giá vốn nhập hàng (USD)" },
              totalStock: { type: Type.STRING, description: "Số lượng nhập kho" },
            },
            required: ["title", "description", "category", "price", "costPrice", "totalStock"],
          },
        },
      });

      if (response.text) {
        return JSON.parse(response.text) as AIImportResult;
      }
      return null;
    } catch (error) {
      console.error("Error analyzing invoice:", error);
      throw error;
    }
  },

  /**
   * Analyzes a product image to generate SEO content and pricing.
   */
  analyzeProductImage: async (base64Image: string, mimeType: string): Promise<AIImportResult | null> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
            {
              text: `Bạn là một chuyên gia bán hàng trực tuyến và viết nội dung SEO.
              Hãy phân tích hình ảnh sản phẩm này và tạo ra các thông tin hấp dẫn để đăng bán:
              - Tên sản phẩm thu hút (title)
              - Mô tả chi tiết, chuẩn SEO, nêu bật tính năng (description)
              - Danh mục phù hợp (category)
              - Giá bán lẻ thị trường ước tính (price)
              - Giá vốn ước tính (costPrice)
              - Số lượng mặc định (totalStock: "1")`,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Tên sản phẩm" },
              description: { type: Type.STRING, description: "Mô tả sản phẩm chuẩn SEO" },
              category: { type: Type.STRING, description: "Danh mục sản phẩm" },
              price: { type: Type.STRING, description: "Giá bán lẻ ước tính (USD)" },
              costPrice: { type: Type.STRING, description: "Giá vốn ước tính (USD)" },
              totalStock: { type: Type.STRING, description: "Số lượng (mặc định 1)" },
            },
            required: ["title", "description", "category", "price", "costPrice", "totalStock"],
          },
        },
      });

      if (response.text) {
        return JSON.parse(response.text) as AIImportResult;
      }
      return null;
    } catch (error) {
      console.error("Error analyzing product image:", error);
      throw error;
    }
  },

  /**
   * Analyzes inventory list (CSV/Excel text content) to extract the first product.
   */
  analyzeInventoryFile: async (fileContent: string): Promise<AIImportResult | null> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-preview',
        contents: `Bạn là một hệ thống phân tích dữ liệu kho hàng.
        Dưới đây là nội dung của một file danh sách sản phẩm (CSV/Excel/Text):
        
        ${fileContent.substring(0, 2000)} // Limit content to avoid token limits
        
        Hãy trích xuất thông tin của sản phẩm ĐẦU TIÊN trong danh sách này để đăng bán.
        Nếu dữ liệu thiếu, hãy tự động bổ sung mô tả chuẩn SEO và dự đoán giá bán hợp lý.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Tên sản phẩm" },
              description: { type: Type.STRING, description: "Mô tả sản phẩm chuẩn SEO" },
              category: { type: Type.STRING, description: "Danh mục sản phẩm" },
              price: { type: Type.STRING, description: "Giá bán lẻ (USD)" },
              costPrice: { type: Type.STRING, description: "Giá vốn nhập hàng (USD)" },
              totalStock: { type: Type.STRING, description: "Số lượng tồn kho" },
            },
            required: ["title", "description", "category", "price", "costPrice", "totalStock"],
          },
        },
      });

      if (response.text) {
        return JSON.parse(response.text) as AIImportResult;
      }
      return null;
    } catch (error) {
      console.error("Error analyzing inventory file:", error);
      throw error;
    }
  }
};
