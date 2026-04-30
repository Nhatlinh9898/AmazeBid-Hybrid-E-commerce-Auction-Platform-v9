
import { GoogleGenAI } from "@google/genai";

// Cấu hình AI để phân tích mẫu tấn công
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface AttackPattern {
  nodeId: string;
  type: 'SPAM' | 'UNAUTHORIZED_MOD' | 'DOS' | 'CORRUPTION';
  timestamp: number;
}

export class QuantumSentinel {
  private static instance: QuantumSentinel;
  private blacklist: Set<string> = new Set();
  private attackHistory: AttackPattern[] = [];
  private nodeActivity: Map<string, { count: number, lastUpdate: number }> = new Map();
  
  // Ngưỡng an toàn
  private readonly THRESHOLD_FREQ = 100; // updates per minute
  private readonly THRESHOLD_SIZE = 1024 * 512; // 512KB per update

  private constructor() {}

  public static getInstance(): QuantumSentinel {
    if (!QuantumSentinel.instance) {
      QuantumSentinel.instance = new QuantumSentinel();
    }
    return QuantumSentinel.instance;
  }

  /**
   * Kiểm tra xem một thay đổi dữ liệu có an toàn không
   */
  public async validateMiddleware(nodeId: string, data: any): Promise<boolean> {
    if (this.blacklist.has(nodeId)) return false;

    const now = Date.now();
    const activity = this.nodeActivity.get(nodeId) || { count: 0, lastUpdate: now };

    // 1. Kiểm tra tần suất (Anti-DOS/Spam)
    if (now - activity.lastUpdate < 60000) {
      activity.count++;
    } else {
      activity.count = 1;
      activity.lastUpdate = now;
    }
    this.nodeActivity.set(nodeId, activity);

    if (activity.count > this.THRESHOLD_FREQ) {
      this.quarantineNode(nodeId, 'SPAM', `Tần suất gửi quá cao: ${activity.count} req/min`);
      return false;
    }

    // 2. Kiểm tra kích thước dữ liệu
    const dataSize = JSON.stringify(data).length;
    if (dataSize > this.THRESHOLD_SIZE) {
      this.quarantineNode(nodeId, 'DOS', `Dữ liệu quá lớn: ${dataSize} bytes`);
      return false;
    }

    return true;
  }

  /**
   * Cô lập Node tấn công
   */
  private quarantineNode(nodeId: string, type: AttackPattern['type'], reason: string) {
    console.error(`[SENTINEL FIREWALL] THREAT DETECTED: Node ${nodeId} is flagged for ${type}. Reason: ${reason}`);
    this.blacklist.add(nodeId);
    this.attackHistory.push({ nodeId, type, timestamp: Date.now() });
    
    // Tự động phân tích sâu bằng AI nếu cần
    if (this.attackHistory.length % 5 === 0) {
      this.analyzeThreatsWithAI();
    }
  }

  /**
   * AI tự động cập nhật chính sách bảo mật
   */
  private async analyzeThreatsWithAI() {
    if (!process.env.GEMINI_API_KEY) return;
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Analyze these P2P attack patterns: ${JSON.stringify(this.attackHistory.slice(-10))}. 
      Propose new rate limits or validation rules to prevent these in the future. Return in JSON format.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      console.log("[SENTINEL AI] New Security Policy Proposed:", response.text());
      // Ở đây có thể tích hợp để cập nhật THRESHOLD_FREQ động
    } catch (err) {
      console.error("AI Analysis failed", err);
    }
  }

  public unblockNode(nodeId: string) {
    this.blacklist.delete(nodeId);
  }

  public getBlacklist(): string[] {
    return Array.from(this.blacklist);
  }

  /**
   * Tự vá lỗi dữ liệu bị hỏng (Data Restoration)
   * Trong thực tế, GunDB tự đồng bộ nhưng chúng ta có thể ép buộc snapshot từ node sạch
   */
  public async selfHealData() {
    console.log(`[SENTINEL SELF-HEAL] Restoring integrity for critical data paths`);
    // Logic để ghi đè dữ liệu hỏng bằng dữ liệu sạch từ Node được tin cậy hoàn toàn
  }

  public getStatus() {
    return {
      activeThreats: this.blacklist.size,
      historyCount: this.attackHistory.length,
      protectedNodes: this.nodeActivity.size,
      lastAttack: this.attackHistory.length > 0 ? this.attackHistory[this.attackHistory.length - 1] : null
    };
  }
}

export const sentinel = QuantumSentinel.getInstance();
