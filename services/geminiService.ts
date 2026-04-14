
import { GoogleGenAI, Modality } from "@google/genai";
import { api } from "./api";
import { Product, OrderStatus } from "../types";
import { getGeminiApiKey } from "./aiConfig";

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return `data:audio/pcm;base64,${base64Audio}`;
    }
    return null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

export const getShoppingAdvice = async (query: string, products: Product[], style: any = 'FRIENDLY') => {
  const productContext = products.filter(p => p.status === OrderStatus.AVAILABLE).map(p => 
    `- ${p.title} (${p.type === 'AUCTION' ? 'Đấu giá' : 'Mua ngay'}: ${p.price || p.currentBid} USD)`
  ).join('\n');

  const orderContext = products.filter(p => p.status !== OrderStatus.AVAILABLE && p.status !== OrderStatus.PENDING_VERIFICATION).map(p => 
    `- Đơn hàng: ${p.title} (ID: ${p.id}, Trạng thái: ${p.status})`
  ).join('\n');

  const prompt = `
    User Query: ${query}
    
    Role: Bạn là trợ lý chăm sóc khách hàng của AmazeBid.
    
    Nhiệm vụ:
    1. Nếu người dùng hỏi về trạng thái đơn hàng, hãy tra cứu trong danh sách đơn hàng dưới đây và trả lời chính xác.
    2. Nếu người dùng phàn nàn hoặc khiếu nại, hãy phân tích cảm xúc (sentiment) của họ. Nếu cảm xúc tiêu cực, hãy xin lỗi chân thành và ưu tiên giải quyết vấn đề.
    
    Available Products (Listings):
    ${productContext}
    
    User Orders:
    ${orderContext}
  `;

  try {
    const result = await api.ai.generate({
      prompt,
      modelType: 'FLASH',
      style
    });
    return result.content;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return "Hiện tại hệ thống đang quá tải hoặc có lỗi xảy ra. Vui lòng thử lại sau.";
  }
};

export const analyzeImageForSearch = async (base64Data: string, mimeType: string): Promise<string> => {
  const prompt = `Analyze this image and provide a search query.`;

  try {
    const result = await api.ai.generate({
      prompt: [
        { inlineData: { data: base64Data, mimeType } },
        { text: prompt }
      ] as any,
      modelType: 'FLASH',
      style: 'PROFESSIONAL'
    });
    return result.content.trim();
  } catch (error) {
    console.error("Visual Search Error:", error);
    return "";
  }
};

export const generateKeywordSuggestions = async (productName: string, description: string) => {
  const prompt = `Generate SEO keywords for: "${productName}". Description: "${description}"`;
  
  try {
    const result = await api.ai.generate({
      prompt,
      modelType: 'FLASH'
    });

    // Local Compute Core trả về content là text đã được rewrite, 
    // nhưng chúng ta có thể trích xuất keywords từ raw_output nếu cần.
    // Giả sử Cloud AI trả về keywords trong raw_output hoặc raw_media.
    return result.content.split(',').map(k => k.trim());
  } catch {
    return [];
  }
};

export const generateProductTags = async (productName: string, description: string) => {
  const prompt = `Generate 5-10 relevant e-commerce tags for: "${productName}". Description: "${description}". Return as a comma-separated list.`;
  
  try {
    const result = await api.ai.generate({
      prompt,
      modelType: 'FLASH',
      task: 'TAGGING'
    });

    return result.content.split(',').map(k => k.trim().replace(/^#/, ''));
  } catch {
    return [];
  }
};

export const generateSEOContent = async (productName: string, keywords: string, tone: string, knowledgeContext: string = '', style: any = 'PROFESSIONAL') => {
  const prompt = `Write a comprehensive SEO blog post for: "${productName}". 
  Keywords: ${keywords}. 
  Tone: ${tone}.
  ${knowledgeContext ? `\nTHÔNG TIN THAM KHẢO CHI TIẾT (Sử dụng thông tin này để viết bài chính xác và chuyên sâu hơn):\n${knowledgeContext}\n` : ''}
  
  Yêu cầu:
  1. Tiêu đề hấp dẫn, chuẩn SEO.
  2. Nội dung chia thành các đoạn có tiêu đề phụ (H2, H3).
  3. Lồng ghép từ khóa tự nhiên.
  4. Nếu có thông số kỹ thuật, hãy trình bày dưới dạng bảng hoặc danh sách.
  5. Nếu có hướng dẫn sử dụng, hãy viết thành các bước rõ ràng.`;

  try {
    const result = await api.ai.generate({
      prompt,
      modelType: 'PRO',
      style
    });
    return result.content;
  } catch {
    return "Không thể tạo nội dung lúc này.";
  }
};

export const generateProductImage = async (prompt: string) => {
  try {
    const result = await api.ai.image({ prompt });
    return result.image;
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};

export const enhanceProductImage = async (base64Data: string, mimeType: string, style: string = 'professional studio photography') => {
  const prompt = `Enhance this product image to look like ${style}. Keep the product recognizable.`;
  
  try {
    const result = await api.ai.generate({
      prompt: [
        { inlineData: { data: base64Data, mimeType } },
        { text: prompt }
      ] as any,
      modelType: 'PRO',
      task: 'IMAGE_ENHANCEMENT'
    });
    
    // Giả sử API trả về base64 của ảnh đã cải thiện trong content hoặc metadata
    // Nếu API trả về JSON, cần parse. Ở đây giả định trả về base64 trực tiếp hoặc URL.
    return result.content; 
  } catch (error) {
    console.error("Image Enhancement Error:", error);
    throw error;
  }
};

export const generateProductVideo = async (prompt: string) => {
  try {
    const result = await api.ai.video({ prompt });
    return result.video;
  } catch (error) {
    console.error("Video Gen Error:", error);
    throw error;
  }
};

export const customerServiceChat = async (message: string, history: { role: 'user' | 'model', text: string }[], orders: any[] = []) => {
  const { edgeAI } = await import('./edgeAIService');
  
  const orderContext = orders.length > 0 
    ? `Danh sách đơn hàng của người dùng:\n${orders.map(o => `- Mã ĐH: ${o.id}, Trạng thái: ${o.status}, Tổng tiền: ${o.totalAmount} USD, Ngày tạo: ${o.createdAt}`).join('\n')}`
    : "Người dùng chưa có đơn hàng nào.";

  const systemInstruction = `Bạn là trợ lý khách hàng thông minh của AmazeBid - Sàn đấu giá và TMĐT thế hệ mới.
Nhiệm vụ của bạn:
1. Trả lời các câu hỏi thường gặp (FAQ) dựa trên chính sách của AmazeBid:
   - Thanh toán qua SafePay: Tiền giữ lại cho đến khi người mua hài lòng.
   - Đóng gói: Cần quấn xốp hơi, quay video đóng gói.
   - Giao hàng: Người bán giao trong 48h. Người mua được đồng kiểm ngoại quan, BẮT BUỘC quay video mở hộp.
   - Trả hàng/Hoàn tiền: Khiếu nại trong 3 ngày. Chấp nhận nếu sai mô tả, bể vỡ, hàng giả.
   - Thuế: Người bán tự chịu trách nhiệm khai báo thuế TNCN.
2. Tra cứu đơn hàng: Sử dụng thông tin đơn hàng được cung cấp để trả lời trạng thái đơn hàng.
3. Giải quyết khiếu nại: Luôn lịch sự, yêu cầu bằng chứng video mở hộp nếu có khiếu nại về hàng hóa. Hướng dẫn người dùng các bước trả hàng nếu hợp lệ.

Quy tắc:
- Luôn trả lời bằng tiếng Việt.
- Ngôn ngữ chuyên nghiệp, thân thiện, tin cậy.
- Nếu không biết chắc chắn, hãy khuyên người dùng liên hệ hotline hoặc email hỗ trợ trực tiếp.

${orderContext}`;

  try {
    const messages = [
      { role: 'system', content: systemInstruction },
      ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.text })),
      { role: 'user', content: message }
    ];

    const responseText = await edgeAI.chat(messages);
    return responseText || "Xin lỗi, hệ thống AI cục bộ đang bận. Vui lòng thử lại sau.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Xin lỗi, tôi đang gặp chút sự cố kỹ thuật. Bạn có thể thử lại sau giây lát được không?";
  }
};
