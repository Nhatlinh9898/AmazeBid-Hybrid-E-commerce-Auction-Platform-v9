import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface PackagingSuggestion {
  suggestedPackaging: string;
  reason: string;
  estimatedShippingCost: number;
}

export async function suggestPackaging(product: Product): Promise<PackagingSuggestion> {
  const packagingInfo = product.packagingInfo || { length: 0, width: 0, height: 0, weight: 0, isFragile: false };
  
  const prompt = `
    Analyze the following product and suggest the best packaging (box/bag) to save shipping costs.
    Product: ${product.title}
    Dimensions: ${packagingInfo.length}x${packagingInfo.width}x${packagingInfo.height} cm
    Weight: ${packagingInfo.weight} kg
    Fragile: ${packagingInfo.isFragile}
    
    Suggest the best packaging type and provide a reason. Also estimate the shipping cost.
    Return the result as a JSON object with fields: suggestedPackaging, reason, estimatedShippingCost.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestedPackaging: { type: Type.STRING },
          reason: { type: Type.STRING },
          estimatedShippingCost: { type: Type.NUMBER }
        },
        required: ['suggestedPackaging', 'reason', 'estimatedShippingCost']
      }
    }
  });

  return JSON.parse(response.text || '{}');
}
