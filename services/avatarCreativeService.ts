
import { GoogleGenAI, Type } from "@google/genai";
import { AvatarCustomization } from "../types";

export const refineAvatarRealism = async (userPrompt: string, currentCustomization: AvatarCustomization): Promise<{ customization: Partial<AvatarCustomization>, creativeStory: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Bạn là một chuyên gia thiết kế nhân vật 3D. Dựa trên yêu cầu: "${userPrompt}", hãy tinh chỉnh các thông số của mô hình 3D hiện tại: ${JSON.stringify(currentCustomization)} để nhân vật trông "giống người thật" và sống động hơn.
      
      Hãy trả về một đối tượng JSON chứa các thông số mới và một đoạn mô tả ngắn (creativeStory) về phong cách này.
      Lưu ý các giới hạn thông số:
      - heightScale: 0.9 đến 1.1 (tỉ lệ chiều cao)
      - skinToneHash: mã màu hex (dùng để tint nhẹ lớp da cho chân thực)
      - hairStyle: 'LONG' | 'SHORT' | 'BOB' | 'PONYTAIL'
      - voiceSpeed: 0.8 đến 1.2 (tốc độ nói tự nhiên)
      - voicePitch: 0.8 đến 1.2 (cao độ giọng nói tự nhiên)
      
      Hãy ưu tiên các giá trị mang lại cảm giác tự nhiên, không quá cường điệu trừ khi người dùng yêu cầu phong cách đặc biệt.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            customization: {
              type: Type.OBJECT,
              properties: {
                heightScale: { type: Type.NUMBER },
                skinToneHash: { type: Type.STRING },
                hairStyle: { type: Type.STRING },
                voiceSpeed: { type: Type.NUMBER },
                voicePitch: { type: Type.NUMBER },
              }
            },
            creativeStory: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Avatar Creative Service Error:", error);
    return { 
      customization: {}, 
      creativeStory: "Xin lỗi, mình chưa thể tinh chỉnh phong cách này lúc này." 
    };
  }
};
