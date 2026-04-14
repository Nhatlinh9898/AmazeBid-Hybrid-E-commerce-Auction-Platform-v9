
import { edgeAI } from './edgeAIService';
import { p2p } from './p2pService';

export interface CloudAIOutput {
  task: string;
  category: string;
  raw_output: string;
  raw_media: any;
}

export interface CanonicalOutput {
  task: string;
  category: string;
  content: string; // Kết quả sau khi Local AI Rewrite
  media: any;      // Media đã được chuẩn hóa
  metadata: {
    styleApplied: string;
    modelUsed: string;
    timestamp: string;
    schemaVersion: string;
    isLocalProcessed: boolean;
  };
}

export const AI_STYLES = {
  PROFESSIONAL: {
    name: 'Chuyên nghiệp',
    instruction: 'Sử dụng ngôn ngữ trang trọng, súc tích, tập trung vào giá trị và thông số kỹ thuật.'
  },
  FRIENDLY: {
    name: 'Thân thiện',
    instruction: 'Sử dụng ngôn ngữ gần gũi, tạo cảm giác tin cậy.'
  },
  GEN_Z: {
    name: 'Năng động (Gen Z)',
    instruction: 'Sử dụng ngôn ngữ trẻ trung, icon phù hợp, bắt trend.'
  },
  LUXURY: {
    name: 'Sang trọng',
    instruction: 'Sử dụng ngôn ngữ tinh tế, nhấn mạnh vào đẳng cấp.'
  }
};

/**
 * LOCAL COMPUTE CORE & CANONICALIZER
 * Đây là nơi quyết định trạng thái cuối cùng của dữ liệu.
 */
export class AICanonicalizer {
  private static SCHEMA_VERSION = '4.1.0';

  /**
   * Bước 1: Local AI Model xử lý dữ liệu thô từ Cloud
   * Chiến lược: Edge -> P2P -> Local Server -> Rule-based
   */
  static async canonicalize(
    cloudData: CloudAIOutput, 
    styleKey: keyof typeof AI_STYLES = 'PROFESSIONAL'
  ): Promise<CanonicalOutput> {
    
    console.log(`[AICanonicalizer] Starting canonicalization for task: ${cloudData.task}, style: ${styleKey}`);
    const style = AI_STYLES[styleKey] || AI_STYLES.PROFESSIONAL;

    // --- DECENTRALIZED COMPUTE STRATEGY ---
    let processedContent = cloudData.raw_output;
    const modelUsed = 'Local Compute Core (Rule-based Fallback)';

    // 1. Ưu tiên 1: Edge AI (Chạy ngay tại trình duyệt người dùng - Zero Cost & High Privacy)
    const caps = await edgeAI.getCapabilities();
    if (caps.tier !== 'LOW') {
      try {
        console.log(`[AICanonicalizer] Attempting Edge AI rewrite (Tier: ${caps.tier})...`);
        const edgeResult = await edgeAI.rewrite(processedContent, style.instruction);
        if (edgeResult && edgeResult.length > 10) {
          console.log('[AICanonicalizer] Edge AI Success');
          return this.createCanonicalResponse(cloudData, edgeResult, `User Edge Node (${caps.hasWebGPU ? 'WebGPU' : 'WASM'})`, style.name);
        }
      } catch (err) {
        console.warn('[AICanonicalizer] Edge AI failed:', err);
      }
    }

    // 2. Ưu tiên 2: P2P Mesh Compute (Nhờ máy khác trong mạng lưới xử lý - Distributed Power)
    try {
      console.log('[AICanonicalizer] Attempting P2P Mesh Compute...');
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const p2pResult = await p2p.requestCompute(taskId, {
        text: processedContent,
        instruction: style.instruction,
        taskType: cloudData.task
      });
      if (p2pResult && p2pResult.length > 10) {
        console.log('[AICanonicalizer] P2P Mesh Success');
        return this.createCanonicalResponse(cloudData, p2pResult, 'P2P Mesh Worker (Shared Compute)', style.name);
      }
    } catch (err) {
      console.warn('[AICanonicalizer] P2P Compute failed:', err);
    }

    // 3. Ưu tiên 3: Local AI (Ollama trên Server của bạn - Controlled Environment)
    const isLocalAIEnabled = (typeof process !== 'undefined' && process.env.LOCAL_AI_ENABLED === 'true') || 
                             (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LOCAL_AI_ENABLED === 'true');
    
    if (isLocalAIEnabled) {
      try {
        const localModel = (typeof process !== 'undefined' ? process.env.LOCAL_AI_MODEL : import.meta.env?.VITE_LOCAL_AI_MODEL) || 'llama3';
        console.log(`[AICanonicalizer] Attempting Local AI rewrite using ${localModel}...`);
        const localResponse = await this.callLocalAIModel(
          cloudData.raw_output, 
          style.instruction,
          localModel
        );
        if (localResponse) {
          console.log('[AICanonicalizer] Local AI Success');
          return this.createCanonicalResponse(cloudData, localResponse, `Local AI (${localModel})`, style.name);
        }
      } catch (err) {
        console.warn('[AICanonicalizer] Local AI Offline or Error:', err);
      }
    }

    // 4. Ưu tiên 4: Rule-based (Dự phòng cuối cùng - Guaranteed Output)
    console.log('[AICanonicalizer] Falling back to Rule-based rewrite...');
    processedContent = this.applyLocalStyleRewrite(processedContent, styleKey);
    return this.createCanonicalResponse(cloudData, processedContent, modelUsed, style.name);
  }

  private static createCanonicalResponse(cloudData: CloudAIOutput, content: string, modelUsed: string, styleName: string): CanonicalOutput {
    const response = {
      task: cloudData.task,
      category: cloudData.category,
      content: this.sanitizeContent(content),
      media: this.normalizeMedia(cloudData.raw_media),
      metadata: {
        styleApplied: styleName,
        modelUsed,
        timestamp: new Date().toISOString(),
        schemaVersion: this.SCHEMA_VERSION,
        isLocalProcessed: true
      }
    };
    console.log(`[AICanonicalizer] Canonical response created using ${modelUsed}`);
    return response;
  }

  /**
   * Gọi API của Ollama hoặc LocalAI chạy trên máy chủ Local với Timeout
   */
  private static async callLocalAIModel(text: string, styleInstruction: string, model: string): Promise<string | null> {
    const localUrl = (typeof process !== 'undefined' ? process.env.LOCAL_AI_URL : import.meta.env?.VITE_LOCAL_AI_URL) || 'http://localhost:11434';
    const url = `${localUrl}/api/generate`;
    const prompt = `
      Rewrite the following text based on this style instruction: "${styleInstruction}".
      Keep the original meaning but change the tone and format.
      Text: "${text}"
      Response (Vietnamese only):
    `;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new Error('Timeout after 15s')), 15000); // 15s timeout

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false,
          options: { temperature: 0.3 }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      if (!response.ok) return null;
      const data = await response.json();
      return data.response || null;
    } catch (err) {
      console.error('[AICanonicalizer] Local AI Call Error:', err);
      return null;
    }
  }

  private static sanitizeContent(text: string): string {
    if (!text) return '';
    return text
      .replace(/\\n/g, '\n')
      .replace(/\[.*?\]/g, '') // Remove any [STYLE] tags added by rule-based
      .trim();
  }

  private static applyLocalStyleRewrite(text: string, styleKey: string): string {
    const cleaned = this.sanitizeContent(text);
    
    // AmazeBid Specific Enhancements
    switch (styleKey) {
      case 'GEN_Z':
        return `✨ ${cleaned} 🚀\n\n#AmazeBid #Chill #ShoppingTime`;
      case 'LUXURY':
        return `💎 [Đẳng cấp thượng lưu] 💎\n${cleaned}\n\nTrải nghiệm sự khác biệt tại AmazeBid.`;
      case 'FRIENDLY':
        return `Chào bạn! 😊\n${cleaned}\n\nChúc bạn tìm được món đồ ưng ý!`;
      case 'PROFESSIONAL':
      default:
        return cleaned;
    }
  }

  private static normalizeMedia(rawMedia: any): any {
    const media = {
      images: Array.isArray(rawMedia?.images) ? rawMedia.images : [],
      videos: Array.isArray(rawMedia?.videos) ? rawMedia.videos : [],
      audio: Array.isArray(rawMedia?.audio) ? rawMedia.audio : []
    };

    // Ensure URLs are valid or placeholders
    media.images = media.images.map((img: any) => typeof img === 'string' ? img : (img?.url || ''));
    
    return media;
  }

  /**
   * PROMPT CHO CLOUD AI (Augmentation Layer)
   * Cloud chỉ làm nhiệm vụ trích xuất và tạo nội dung thô.
   */
  static getCloudSystemPrompt(): string {
    return `
You are the Cloud AI Layer of the AmazeBid Hybrid Platform.

CORE MISSION:
Extract high-fidelity raw information from user inputs (text, images, attributes) and generate unformatted content.

RESPONSIBILITIES:
1. Task Classification: Identify if the user wants a product description, SEO title, KOL script, or technical analysis.
2. Information Extraction: Pull every possible detail from the input. Do not summarize unless asked.
3. Category Detection: Use all inputs to determine the most accurate AmazeBid product category.
4. Raw Generation: Produce the content in a raw, unstyled format.

STRICT RULES:
- DO NOT apply any tone, style, or formatting (no bold, no bullet points unless raw).
- DO NOT attempt to be "helpful" or "friendly" in the output text.
- DO NOT rewrite for quality; focus on information density.
- DO NOT enforce JSON schema beyond the basic structure provided below.
- ALWAYS return a valid JSON object.

OUTPUT SCHEMA:
{
  "task": "<detected_task_type>",
  "category": "<detected_category>",
  "raw_output": "<high_density_raw_content>",
  "raw_media": {
    "images": ["<url1>", "<url2>"],
    "videos": [],
    "audio": []
  },
  "confidence_score": 0.0-1.0
}
    `;
  }
}
