import { GoogleGenAI, Type } from "@google/genai";

export const aiStoreService = {
  generateStoreInfo: async (prompt: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Bạn là một chuyên gia tư vấn thương hiệu doanh nghiệp. Dựa trên mô tả sau: "${prompt}", hãy xây dựng một hồ sơ cửa hàng chuyên nghiệp và đẳng cấp.
        Yêu cầu:
        1. Tên (name): Phải sáng tạo và phù hợp.
        2. Mô tả (description): Viết một đoạn văn giới thiệu thu hút, chuyên nghiệp, làm nổi bật giá trị cốt lõi và không gian trải nghiệm (khoảng 100-150 chữ).
        3. Danh mục (category): Chọn một trong (FOOD, DRINK, FASHION, OTHER).
        4. Giờ mở cửa (openingHours): Định dạng phù hợp.
        
        Trả về kết quả dưới dạng JSON object.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING, enum: ["FOOD", "DRINK", "FASHION", "OTHER"] },
              openingHours: { type: Type.STRING }
            },
            required: ["name", "description", "category", "openingHours"]
          }
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.error("AI Store Info Generation Error:", error);
      throw error;
    }
  },

  generateStoreMenuFromImage: async (imageBase64: string, mimeType: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType,
              },
            },
            {
              text: `Analyze this image of a menu or food/product items. Extract the items and generate a structured menu list.
              Return a list of items found. For each item, provide: name, description (infer from image if not explicit), price (in VND, infer a reasonable price if not visible, e.g., 50000), category (infer a reasonable category).`,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                price: { type: Type.NUMBER },
                category: { type: Type.STRING }
              },
              required: ["name", "description", "price", "category"]
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.error("AI Store Menu Generation from Image Error:", error);
      throw error;
    }
  },

  generateStoreMenu: async (storeName: string, storeCategory: string, description: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Hãy đóng vai một chuyên gia tư vấn thực đơn. Dựa trên tên cửa hàng "${storeName}", lĩnh vực "${storeCategory}" và mô tả: "${description}", hãy thiết kế một thực đơn đặc sắc gồm 6-10 món/sản phẩm tiêu biểu.
        
        Yêu cầu cho mỗi món:
        1. Tên món (name): Sáng tạo, độc đáo.
        2. Mô tả (description): Ngắn gọn nhưng kích thích vị giác/nhu cầu mua sắm.
        3. Giá (price): Phù hợp với thị trường (đơn vị VND).
        4. Danh mục (category): Phân loại logic.
        
        Trả về kết quả dưới dạng mảng JSON các đối tượng. Tận dụng tối đa sự sáng tạo để thực đơn thực sự hấp dẫn.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                price: { type: Type.NUMBER },
                category: { type: Type.STRING }
              },
              required: ["name", "description", "price", "category"]
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.error("AI Store Menu Generation Error:", error);
      throw error;
    }
  },

  generateStoreDescription: async (storeName: string, storeCategory: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Bạn là một chuyên gia Content Marketing chuyên nghiệp. Hãy viết một bài giới thiệu về quán/cửa hàng "${storeName}" thuộc lĩnh vực "${storeCategory}".
        
        Nội dung cần đạt được:
        1. Sự thu hút ngay từ câu đầu tiên.
        2. Mô tả không gian, chất lượng và dịch vụ một cách tinh tế, đẳng cấp.
        3. Sử dụng ngôn từ phong phú, biểu cảm (evocative), tránh các mẫu câu sáo rỗng.
        4. Làm nổi bật sự tận tâm và trải nghiệm khách hàng vượt trội.
        5. Độ dài khoảng 4-6 câu văn mạch lạc, cuốn hút.
        
        Hãy viết nội dung bằng tiếng Việt với phong cách hiện đại và sang trọng.`,
      });
      return response.text;
    } catch (error) {
      console.error("AI Store Description Generation Error:", error);
      throw error;
    }
  }
};
