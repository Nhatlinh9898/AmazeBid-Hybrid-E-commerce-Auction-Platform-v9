import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function analyzeOrder(product: Product) {
  const prompt = `
    Analyze the following order/product details and customer notes.
    Product Title: ${product.title}
    Description: ${product.description}
    
    Determine:
    1. Priority: URGENT, NORMAL, or LOW.
    2. Tags: A list of relevant tags (e.g., "VIP", "Gift Wrap", "Office Hours", "Careful Inspection", "Fragile").
    
    Return the result as JSON.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          priority: { type: Type.STRING, enum: ['URGENT', 'NORMAL', 'LOW'] },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['priority', 'tags']
      }
    }
  });

  return JSON.parse(response.text || '{}');
}
