import { GoogleGenAI, Type } from "@google/genai";

export const aiStoreService = {
  generateStoreInfo: async (prompt: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a store profile based on this description: "${prompt}". 
        Return a JSON object with: name, description, category (FOOD, DRINK, FASHION, or OTHER), openingHours.`,
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
        contents: `Generate a menu for a ${storeCategory} store named "${storeName}". 
        Store description: "${description}". 
        Return a list of 5-8 menu items. 
        Each item should have: name, description, price (in VND, e.g., 50000), category.`,
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
        contents: `Write a compelling and professional store description for a ${storeCategory} store named "${storeName}". 
        The description should be in Vietnamese, engaging, and about 2-3 sentences long.`,
      });
      return response.text;
    } catch (error) {
      console.error("AI Store Description Generation Error:", error);
      throw error;
    }
  }
};
