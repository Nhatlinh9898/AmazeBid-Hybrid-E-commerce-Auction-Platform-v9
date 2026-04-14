import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface DemandForecast {
  productId: string;
  suggestedRestockQuantity: number;
  reason: string;
}

export async function forecastDemand(products: Product[]): Promise<DemandForecast[]> {
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
