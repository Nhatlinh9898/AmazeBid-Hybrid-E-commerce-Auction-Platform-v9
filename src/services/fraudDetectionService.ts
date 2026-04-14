import { GoogleGenAI, Type } from "@google/genai";
import { Order } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function detectFraud(order: Order, userPurchaseHistory: Order[]) {
  const prompt = `
    Analyze the following order for potential fraud.
    Order ID: ${order.id}
    Total Amount: ${order.totalAmount}
    Items: ${order.items.map(i => i.title).join(', ')}
    
    User Purchase History (recent orders):
    ${userPurchaseHistory.map(o => `- Amount: ${o.totalAmount}, Date: ${o.createdAt}`).join('\n')}
    
    Determine:
    1. isFraudulent: boolean (true if suspicious).
    2. fraudReason: string (brief reason if suspicious).
    
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
          isFraudulent: { type: Type.BOOLEAN },
          fraudReason: { type: Type.STRING }
        },
        required: ['isFraudulent', 'fraudReason']
      }
    }
  });

  return JSON.parse(response.text || '{"isFraudulent": false, "fraudReason": ""}');
}
