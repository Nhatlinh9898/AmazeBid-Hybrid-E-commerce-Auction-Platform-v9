import { pipeline, env } from '@huggingface/transformers';

/**
 * EDGE AI SERVICE
 * Tận dụng CPU/GPU của thiết bị người dùng để xử lý AI.
 * Hỗ trợ WebGPU (Nhanh) và WASM (Dự phòng cho thiết bị yếu).
 */
class EdgeAIService {
  private classifier: any = null;
  private rewriter: any = null;
  private chatModel: any = null;
  private isInitializing = false;
  private isChatInitializing = false;

  constructor() {
    // Cấu hình để chạy hoàn toàn tại trình duyệt
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    
    // Thử giảm log level để bớt warning từ ONNX Runtime
    (env as any).logLevel = 'error';
  }

  /**
   * Kiểm tra khả năng phần cứng
   */
  async getCapabilities() {
    if (typeof navigator === 'undefined') {
      return { tier: 'LOW', hasWebGPU: false, memory: 'unknown', cores: 'unknown' };
    }
    const hasWebGPU = 'gpu' in navigator;
    const memory = (navigator as any).deviceMemory || 'unknown';
    const cores = navigator.hardwareConcurrency || 'unknown';
    
    return {
      hasWebGPU,
      memory,
      cores,
      tier: hasWebGPU ? 'HIGH' : (cores > 4 ? 'MEDIUM' : 'LOW')
    };
  }

  /**
   * Khởi tạo mô hình Chat (Sử dụng Qwen 0.5B cho tiếng Việt tốt và nhẹ)
   */
  async initChat() {
    if (this.chatModel || this.isChatInitializing) return;
    this.isChatInitializing = true;
    
    try {
      console.log("Đang tải mô hình AI cục bộ (Qwen1.5-0.5B-Chat)... Quá trình này có thể mất vài phút trong lần đầu tiên.");
      this.chatModel = await pipeline('text-generation', 'Xenova/Qwen1.5-0.5B-Chat', {
        device: 'webgpu', // Ưu tiên GPU
      });
      console.log("Tải mô hình AI cục bộ thành công (WebGPU)!");
    } catch (e) {
      console.warn('WebGPU không khả dụng, chuyển sang CPU (WASM)...', e);
      try {
        this.chatModel = await pipeline('text-generation', 'Xenova/Qwen1.5-0.5B-Chat');
        console.log("Tải mô hình AI cục bộ thành công (CPU)!");
      } catch (err) {
        console.error("Lỗi tải mô hình AI cục bộ:", err);
      }
    } finally {
      this.isChatInitializing = false;
    }
  }

  /**
   * Trò chuyện với AI hoàn toàn trên máy cá nhân
   */
  async chat(messages: { role: string, content: string }[]): Promise<string | null> {
    await this.initChat();
    if (!this.chatModel) return "Xin lỗi, không thể khởi tạo mô hình AI cục bộ trên thiết bị của bạn.";

    try {
      // Format messages into a prompt string for Qwen
      let prompt = "";
      for (const msg of messages) {
        prompt += `<|im_start|>${msg.role}\n${msg.content}<|im_end|>\n`;
      }
      prompt += "<|im_start|>assistant\n";

      const result = await this.chatModel(prompt, {
        max_new_tokens: 256,
        temperature: 0.7,
        do_sample: true,
      });
      
      // Trích xuất phần trả lời của assistant
      const generatedText = result[0].generated_text;
      const response = generatedText.split("<|im_start|>assistant\n").pop().split("<|im_end|>")[0].trim();
      
      return response;
    } catch (error) {
      console.error('Edge Chat Error:', error);
      return "Có lỗi xảy ra khi xử lý AI cục bộ.";
    }
  }

  /**
   * Khởi tạo mô hình Rewrite (Sử dụng mô hình nhỏ như Phi-3 hoặc T5-small)
   */
  async initRewriter() {
    if (this.rewriter || this.isInitializing) return;
    this.isInitializing = true;
    
    try {
      // Sử dụng mô hình cực nhẹ để chạy được trên cả Mobile
      this.rewriter = await pipeline('text2text-generation', 'Xenova/t5-small', {
        device: 'webgpu', // Ưu tiên GPU
      });
    } catch {
      console.warn('WebGPU not available, falling back to CPU (WASM)');
      this.rewriter = await pipeline('text2text-generation', 'Xenova/t5-small');
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Khởi tạo mô hình Phân loại (Sử dụng mô hình Zero-shot cực nhẹ)
   */
  async initClassifier() {
    if (this.classifier || this.isInitializing) return;
    this.isInitializing = true;
    try {
      this.classifier = await pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli', {
        device: 'webgpu',
      });
    } catch {
      this.classifier = await pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli');
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Phân loại danh mục sản phẩm cục bộ
   */
  async classify(text: string, candidateLabels: string[]): Promise<string | null> {
    await this.initClassifier();
    if (!this.classifier) return null;

    try {
      const output = await this.classifier(text, candidateLabels);
      return output.labels[0];
    } catch (error) {
      console.error('Edge Classification Error:', error);
      return null;
    }
  }

  /**
   * Tìm kiếm thông minh trong kho dữ liệu cục bộ (Local Data Vault)
   * Kết hợp Phân loại AI và Thuật toán so khớp chuỗi
   */
  async findBestMatch(input: string, items: any[]): Promise<any | null> {
    if (!input || items.length === 0) return null;

    try {
      // 1. Dùng AI phân loại input để thu hẹp phạm vi
      const categories = Array.from(new Set(items.map(item => item.category))).filter((c): c is string => !!c);
      const predictedCategory = await this.classify(input, categories);

      // 2. Lọc các item thuộc danh mục dự đoán (nếu độ tin cậy cao - ở đây lấy top 1)
      let candidateItems = items;
      if (predictedCategory) {
        candidateItems = items.filter(item => item.category === predictedCategory);
      }

      // 3. Sử dụng Fuzzy Match đơn giản (Jaccard Similarity trên các từ)
      const inputWords = new Set(input.toLowerCase().split(/\s+/));
      
      let bestMatch = null;
      let maxScore = 0;

      for (const item of candidateItems) {
        const itemWords = new Set(item.title.toLowerCase().split(/\s+/));
        const intersection = new Set([...inputWords].filter(x => itemWords.has(x)));
        const union = new Set([...inputWords, ...itemWords]);
        const score = intersection.size / union.size;

        if (score > maxScore) {
          maxScore = score;
          bestMatch = item;
        }
      }

      // Nếu điểm quá thấp, thử lại trên toàn bộ kho (không quan tâm category)
      if (maxScore < 0.1 && candidateItems.length !== items.length) {
        return this.findBestMatch(input, items.filter(i => i.category !== predictedCategory));
      }

      return maxScore > 0 ? bestMatch : null;
    } catch (error) {
      console.error('Edge Semantic Search Error:', error);
      // Fallback: Tìm theo từ khóa đơn giản
      return null;
    }
  }

  /**
   * Thực hiện Rewrite nội dung tại Edge
   */
  async rewrite(text: string, instruction: string): Promise<string | null> {
    await this.initRewriter();
    if (!this.rewriter) return null;

    try {
      const prompt = `instruction: ${instruction} text: ${text}`;
      const result = await this.rewriter(prompt, {
        max_new_tokens: 128,
        temperature: 0.7,
      });
      return result[0].generated_text;
    } catch (error) {
      console.error('Edge Inference Error:', error);
      return null;
    }
  }
}

export const edgeAI = new EdgeAIService();
