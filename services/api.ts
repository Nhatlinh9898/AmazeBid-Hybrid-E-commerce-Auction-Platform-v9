
// Đây là cầu nối giữa Frontend và Backend
const BASE_URL = '/api';

interface BackendResponse<T> {
  status: 'success' | 'error';
  action: string;
  data: T;
  ui: {
    update: boolean;
    elements: any;
  };
}

// Hàm helper để gọi API với Retry logic
async function fetchClient<T>(endpoint: string, options: RequestInit = {}, retries = 2): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutMs = 30000; // Increased to 30s
  const timeoutId = setTimeout(() => controller.abort(new Error('Timeout after 30s')), timeoutMs);

  const fullUrl = `${BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const text = await response.text();
    let result: BackendResponse<T>;
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      // Nếu không phải JSON, có thể là lỗi 500 hoặc server đang khởi động (trả về HTML)
      if (retries > 0) {
        console.warn(`[API] Non-JSON response for ${endpoint}, retrying... (${retries} left)`);
        await new Promise(res => setTimeout(res, 2000));
        return fetchClient(endpoint, options, retries - 1);
      }
      console.error(`[API] Non-JSON response for ${endpoint}:`, text.substring(0, 500));
      throw new Error(`Server returned non-JSON response for ${endpoint}`, { cause: parseError });
    }
    
    if (result.status === 'error') {
      const message = (result.data as any)?.message || 'API Error';
      // Nếu token hết hạn, xóa token
      if (message.includes('Token không hợp lệ') || message.includes('hết hạn')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
      throw new Error(message);
    }

    return result.data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Nếu là lỗi network (Failed to fetch) và còn lượt retry
    if (error.name === 'TypeError' && error.message === 'Failed to fetch' && retries > 0) {
      console.warn(`[API] Fetch failed for ${endpoint}, retrying... (${retries} left)`);
      await new Promise(res => setTimeout(res, 1000)); // Chờ 1s trước khi thử lại
      return fetchClient(endpoint, options, retries - 1);
    }

    console.error(`API Call Error [${endpoint}]:`, error.message);
    throw error;
  }
}

export const api = {
  // Sản phẩm
  products: {
    getAll: () => fetchClient<{ products: any[] }>('/products'),
    create: (data: any) => fetchClient<{ product: any }>('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchClient<{ product: any }>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string, shippingInfo?: any) => fetchClient<{ product: any }>(`/products/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, shippingInfo }) }),
    delete: (id: string) => fetchClient<{ id: string }>(`/products/${id}`, { method: 'DELETE' }),
  },
  
  // Xác thực
  auth: {
    me: () => fetchClient<{ user: any }>('/auth/me'),
    login: (email: string, pass: string, expiresIn: string = '24h') => 
      fetchClient<{ user: any, token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, pass, expiresIn }) }),
    loginWithFirebase: (idToken: string) => fetchClient<{ user: any, token: string }>('/auth/firebase', { method: 'POST', body: JSON.stringify({ idToken }) }),
    register: (fullName: string, email: string, pass: string) => 
      fetchClient<{ user: any, token: string }>('/auth/register', { method: 'POST', body: JSON.stringify({ fullName, email, pass }) }),
    resetToken: (userId: string) => fetchClient<void>('/auth/reset-token', { method: 'POST', body: JSON.stringify({ userId }) }),
    logout: () => fetchClient<void>('/auth/logout', { method: 'POST' }),
    setup2FA: () => fetchClient<{ secret: string, qrCode: string }>('/auth/2fa/setup', { method: 'POST' }),
    verify2FA: (code: string, secret: string) => fetchClient<{ success: boolean }>('/auth/2fa/verify', { method: 'POST', body: JSON.stringify({ code, secret }) }),
    toggle2FA: (enabled: boolean) => fetchClient<{ enabled: boolean }>('/auth/2fa/toggle', { method: 'POST', body: JSON.stringify({ enabled }) }),
    login2FA: (email: string, code: string) => fetchClient<{ user: any, token: string }>('/auth/2fa/login', { method: 'POST', body: JSON.stringify({ email, code }) }),
  },

  // Đấu giá
  bidding: {
    placeBid: (productId: string, amount: number, userId: string, userName: string) => 
      fetchClient<{ product: any }>('/bids', {
        method: 'POST', body: JSON.stringify({ productId, amount, userId, userName })
      })
  },

  // Streams
  streams: {
    getAll: () => fetchClient<{ streams: any[] }>('/streams'),
  },

  // Pricing & Wallet
  pricing: {
    calculate: (data: { costPrice: number, totalStock: number, markup?: number }) => 
      fetchClient<{ plan: any, aiDescription: string }>('/pricing/calculate', { method: 'POST', body: JSON.stringify(data) }),
  },

  orders: {
    complete: (items: any[], totalAmount?: number, shippingInfo?: any) => fetchClient<any>('/orders/complete', { method: 'POST', body: JSON.stringify({ items, totalAmount, shippingInfo }) }),
    create: (data: any) => fetchClient<{ order: any }>('/orders/complete', { method: 'POST', body: JSON.stringify(data) }),
    getUserOrders: (userId: string) => fetchClient<{ orders: any[] }>(`/orders/user/${userId}`),
    getSellerOrders: (sellerId: string) => fetchClient<{ orders: any[] }>(`/orders/seller/${sellerId}`),
    updateStatus: (id: string, status: string) => fetchClient<{ order: any }>(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    releaseEscrow: (orderId: string) => fetchClient<{ order: any }>(`/orders/${orderId}/release-escrow`, { method: 'POST' }),
  },

  community: {
    getPosts: () => fetchClient<{ posts: any[] }>('/posts'),
    createPost: (data: any) => fetchClient<{ post: any }>('/posts', { method: 'POST', body: JSON.stringify(data) }),
    likePost: (id: string) => fetchClient<void>(`/posts/${id}/like`, { method: 'POST' }),
  },

  marketing: {
    getCoupons: () => fetchClient<{ coupons: any[] }>('/coupons'),
    createCoupon: (data: any) => fetchClient<{ coupon: any }>('/coupons', { method: 'POST', body: JSON.stringify(data) }),
  },

  gamification: {
    getLeaderboard: () => fetchClient<{ leaderboard: any[] }>('/gamification/leaderboard'),
  },

  admin: {
    getWallet: () => fetchClient<any>('/admin/wallet'),
    updateBank: (bankName: string, accountNumber: string, accountName: string) => 
      fetchClient<any>('/admin/wallet/bank', { method: 'POST', body: JSON.stringify({ bankName, accountNumber, accountName }) }),
    withdraw: (amount: number) => fetchClient<any>('/admin/withdraw', { method: 'POST', body: JSON.stringify({ amount }) }),
    getPendingProducts: () => fetchClient<{ products: any[] }>('/admin/pending-products'),
    verifyProduct: (productId: string, approved: boolean, reason?: string) => 
      fetchClient<{ product: any }>('/admin/verify-product', { 
        method: 'POST', 
        body: JSON.stringify({ productId, approved, reason }) 
      }),
    getUsers: () => fetchClient<{ users: any[] }>('/admin/users'),
    getAdminStats: () => fetchClient<{ stats: any }>('/admin/stats'),
    updateUserRole: (userId: string, role: string) => 
      fetchClient<void>(`/admin/users/${userId}/role`, { method: 'POST', body: JSON.stringify({ role }) }),
    updateUserStatus: (userId: string, status: string) => 
      fetchClient<void>(`/admin/users/${userId}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
    resetUserToken: (userId: string) => 
      fetchClient<void>(`/admin/users/${userId}/reset-token`, { method: 'POST' }),
    resetAllSessions: () => fetchClient<void>('/admin/reset-all-sessions', { method: 'POST' }),
    getSecurityLogs: () => fetchClient<{ logs: any[] }>('/admin/security-logs'),
    getBlockedIps: () => fetchClient<{ ips: string[] }>('/admin/blocked-ips'),
    blockIp: (ip: string) => fetchClient<void>('/admin/blocked-ips', { method: 'POST', body: JSON.stringify({ ip }) }),
    unblockIp: (ip: string) => fetchClient<void>(`/admin/blocked-ips/${ip}`, { method: 'DELETE' }),
    getConfig: () => fetchClient<any>('/admin/config'),
    updateConfig: (config: any) => fetchClient<any>('/admin/config', { method: 'POST', body: JSON.stringify(config) }),
  },

  wallet: {
    get: (userId: string) => fetchClient<{ wallet: any }>(`/users/${userId}/wallet`),
    updateBank: (userId: string, bankName: string, accountNumber: string, accountName: string) => 
      fetchClient<{ wallet: any }>(`/users/${userId}/wallet/bank`, { method: 'POST', body: JSON.stringify({ bankName, accountNumber, accountName }) }),
    submitKyc: (userId: string) => fetchClient<{ wallet: any }>(`/users/${userId}/wallet/kyc`, { method: 'POST' }),
    withdraw: (userId: string, amount: number) => fetchClient<{ wallet: any, amount: number }>(`/users/${userId}/wallet/withdraw`, { method: 'POST', body: JSON.stringify({ amount }) }),
    getAiAnalysis: async (userId: string, wallet: any) => {
      const prompt = `Hãy phân tích tình trạng ví của người dùng này và đưa ra lời khuyên tài chính thông minh.
      Số dư khả dụng: ${wallet.balance}
      Số dư đang lưu ký (Escrow): ${wallet.pendingBalance}
      Lịch sử giao dịch: ${JSON.stringify(wallet.transactions?.slice(0, 5))}
      Các khoản đang lưu ký: ${JSON.stringify(wallet.escrowItems?.slice(0, 5))}
      
      Hãy trả về một bản phân tích ngắn gọn bằng tiếng Việt, bao gồm:
      1. Nhận xét về dòng tiền (Cashflow).
      2. Dự báo khi nào tiền lưu ký sẽ về (dựa trên dữ liệu giả định nếu cần).
      3. Lời khuyên về việc rút tiền hoặc tái đầu tư.
      Trả về định dạng Markdown.`;

      const result = await api.ai.generate({
        prompt,
        modelType: 'FLASH'
      });
      return { analysis: result.content };
    },
  },

  // AI Enterprise Services (Moved to frontend to comply with guidelines)
  ai: {
    generate: async (data: { 
      prompt: string | any[], 
      systemInstruction?: string, 
      modelType?: 'FLASH' | 'PRO', 
      useCache?: boolean,
      task?: string,
      style?: string,
      tools?: any[]
    }) => {
      // 1. Charge for AI Usage first
      try {
        const userJson = localStorage.getItem('auth_user');
        if (userJson) {
          const user = JSON.parse(userJson);
          if (user.role !== 'ADMIN') {
            await fetchClient('/ai/charge', {
              method: 'POST',
              body: JSON.stringify({ 
                userId: user.id, 
                modelType: data.modelType || 'FLASH', 
                task: data.task || 'GENERAL_GENERATION' 
              })
            });
          }
        }
      } catch (error: any) {
        throw new Error(`AI Billing Error: ${error.message}`, { cause: error });
      }

      const { GoogleGenAI } = await import('@google/genai');
      const { AICanonicalizer } = await import('./aiCanonicalizer');
      const { getGeminiApiKey } = await import('./aiConfig');
      const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
      
      const config = await api.admin.getConfig().catch(() => ({ defaultModelType: 'FLASH' }));
      const effectiveModelType = data.modelType || config.defaultModelType || 'FLASH';

      const cloudSystemPrompt = AICanonicalizer.getCloudSystemPrompt();
      const modelName = effectiveModelType === 'PRO' ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: typeof data.prompt === 'string' ? data.prompt : { parts: data.prompt },
        config: {
          systemInstruction: data.systemInstruction || cloudSystemPrompt,
          temperature: 0.8,
          responseMimeType: 'application/json',
          tools: data.tools
        }
      });

      const rawJsonText = response.text || '{}';
      let cloudData;
      try {
        // Pre-process to fix common AI JSON mistakes like Python booleans
        const fixedJsonText = rawJsonText
          .replace(/```json|```/g, '')
          .replace(/:\s*True\b/g, ': true')
          .replace(/:\s*False\b/g, ': false')
          .replace(/:\s*None\b/g, ': null')
          .trim();
        cloudData = JSON.parse(fixedJsonText);
      } catch {
        cloudData = { task: data.task || 'unknown', category: 'unknown', raw_output: rawJsonText, raw_media: {} };
      }

      const canonicalOutput = await AICanonicalizer.canonicalize(cloudData, (data.style as any) || 'PROFESSIONAL');
      return canonicalOutput;
    },
    image: async (data: { prompt: string, aspectRatio?: string }) => {
      // Sử dụng Pollinations.ai - API tạo ảnh hoàn toàn MIỄN PHÍ, không cần key, không giới hạn
      let width = 512;
      let height = 512;
      if (data.aspectRatio === '16:9') { width = 1024; height = 576; }
      if (data.aspectRatio === '9:16') { width = 576; height = 1024; }
      
      const encodedPrompt = encodeURIComponent(data.prompt);
      const seed = Math.floor(Math.random() * 1000000); // Add seed to get unique images and avoid cache
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
      
      let retries = 3;
      while (retries > 0) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(new Error('Timeout after 60s')), 60000); // 60s timeout
          
          const response = await fetch(imageUrl, { signal: controller.signal });
          clearTimeout(timeoutId);
          
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const blob = await response.blob();
          
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve({ image: reader.result as string });
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error(`Image generation attempt failed (${retries} retries left):`, error);
          retries--;
          if (retries === 0) {
            throw new Error('Failed to generate image after multiple attempts', { cause: error });
          }
          // Wait 2 seconds before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      throw new Error('Failed to generate image');
    },
    video: async (data: { prompt: string, imageBase64?: string }) => {
      // TẠM DỪNG GỌI API TẠO VIDEO ĐẮT ĐỎ (Veo/Sora) ĐỂ TRÁNH MẤT TIỀN OAN.
      // Trả về một video mẫu (Mock Video) miễn phí chất lượng cao để UI vẫn hoạt động bình thường.
      // Trong tương lai, khi có hệ thống Credit, sẽ tích hợp lại API của Replicate/HeyGen.
      
      console.log("Simulating video generation to save costs. Prompt:", data.prompt);
      
      // Giả lập thời gian chờ xử lý (3 giây) để UX trông giống thật
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Trả về một video mẫu miễn phí (Big Buck Bunny)
      return { video: "https://www.w3schools.com/html/mov_bbb.mp4" };
    },
    negotiate: async (data: { productId: string, userOffer: number, chatHistory?: any[] }) => {
      const { edgeAI } = await import('./edgeAIService');
      
      // Fetch product details from frontend state or API
      const { products } = await api.products.getAll();
      const product = products.find(p => p.id === data.productId);
      if (!product) throw new Error('Product not found');

      const minPrice = product.minNegotiationPrice || (product.costPrice ? product.costPrice * 1.05 : product.price * 0.8);
      
      // Enhanced persuasive prompt
      const prompt = `
        Bạn là một chuyên gia bán hàng nghệ thuật và tâm lý tại AmazeBid.
        Mục tiêu: Bán sản phẩm "${product.title}" với giá tốt nhất có thể, đồng thời làm khách hàng cảm thấy họ đang nhận được một giá trị tuyệt vời.
        
        Thông tin sản phẩm:
        - Tên: ${product.title}
        - Giá niêm yết: $${product.price}
        - Giá sàn (bí mật): $${minPrice}
        - Đặc điểm nổi bật: ${product.description.substring(0, 200)}...
        
        Đề nghị của khách hàng: $${data.userOffer}
        Lịch sử trò chuyện: ${JSON.stringify(data.chatHistory || [])}

        QUY TẮC THƯƠNG LƯỢNG (PSHYCOLOGICAL SELLING):
        1. KHÔNG chấp nhận ngay lập tức trừ khi giá đề nghị rất gần giá niêm yết.
        2. Nếu giá đề nghị thấp hơn giá sàn ($${minPrice}):
           - Hãy giải thích giá trị của sản phẩm (chất lượng, độ hiếm, tính năng).
           - Sử dụng các cụm từ như "Tôi rất muốn giúp bạn, nhưng...", "Sản phẩm này thực sự đáng giá hơn thế vì...".
           - Đưa ra giá đối nghị (thường là mức trung bình giữa giá niêm yết và giá sàn) một cách tinh tế.
        3. Nếu giá đề nghị >= giá sàn ($${minPrice}):
           - Nếu giá vẫn còn thấp hơn giá niêm yết nhiều, hãy thử "đẩy" thêm một chút bằng cách tặng thêm giá trị ảo (ví dụ: ưu tiên giao hàng, bảo đảm chất lượng).
           - Nếu chấp nhận, hãy làm cho khách hàng cảm thấy họ đã thắng lợi: "Đây là một deal cực tốt, tôi sẽ giữ nó cho bạn!"
        4. Tông giọng: Chuyên nghiệp, nhiệt tình, không cứng nhắc, đậm chất nghệ thuật bán hàng.

        BẮT BUỘC trả về định dạng sau (không thêm văn bản thừa):
        STATUS: [ACCEPTED / COUNTER / REJECTED]
        PRICE: [Giá số]
        MESSAGE: [Lời thoại thuyết phục bằng tiếng Việt]
      `;

      const responseText = await edgeAI.chat([{ role: 'user', content: prompt }]);
      
      let status = 'COUNTER';
      let counterOffer = product.price;
      let message = responseText || "Tôi không thể chấp nhận mức giá này.";

      if (responseText) {
        if (responseText.includes('ACCEPTED') || responseText.includes('CHẤP NHẬN')) status = 'ACCEPTED';
        else if (responseText.includes('REJECTED') || responseText.includes('TỪ CHỐI')) status = 'REJECTED';

        const priceMatch = responseText.match(/PRICE:\s*(\d+)/i) || responseText.match(/Giá:\s*(\d+)/i);
        if (priceMatch) counterOffer = parseInt(priceMatch[1], 10);

        const msgMatch = responseText.match(/MESSAGE:\s*(.*)/is) || responseText.match(/Lời nhắn:\s*(.*)/is);
        if (msgMatch) message = msgMatch[1].trim();
      }

      return { status, counterOffer, message };
    },
    generateAd: async (productId: string) => {
      const { edgeAI } = await import('./edgeAIService');
      
      const { products } = await api.products.getAll();
      const product = products.find(p => p.id === productId);
      if (!product) throw new Error('Product not found');

      const prompt = `
        Hãy viết một bài quảng cáo hấp dẫn cho sản phẩm sau:
        Tên: ${product.title}
        Mô tả gốc: ${product.description}
        Giá: $${product.price}

        BẮT BUỘC trả về định dạng sau (không thêm bất kỳ văn bản nào khác):
        MÔ TẢ: [Mô tả sản phẩm mới, tối ưu SEO, hấp dẫn người mua]
        TỪ KHÓA: [Danh sách 5-10 từ khóa SEO, cách nhau bằng dấu phẩy]
        CỘNG ĐỒNG: [Một bài đăng ngắn gọn, bắt trend để đăng lên bảng tin cộng đồng (kèm emoji)]
      `;

      const responseText = await edgeAI.chat([{ role: 'user', content: prompt }]);
      
      let description = product.description;
      let seoKeywords = [product.title, "AmazeBid"];
      let communityPost = `🔥 Khám phá ngay ${product.title} với giá cực sốc $${product.price}! Đừng bỏ lỡ!`;

      if (responseText) {
        const descMatch = responseText.match(/MÔ TẢ:\s*(.*?)(?=TỪ KHÓA:|$)/is);
        if (descMatch) description = descMatch[1].trim();

        const kwMatch = responseText.match(/TỪ KHÓA:\s*(.*?)(?=CỘNG ĐỒNG:|$)/is);
        if (kwMatch) seoKeywords = kwMatch[1].split(',').map(k => k.trim());

        const commMatch = responseText.match(/CỘNG ĐỒNG:\s*(.*)/is);
        if (commMatch) communityPost = commMatch[1].trim();
      }
      
      const adData = { description, seoKeywords, communityPost };
      
      // Post to community feed
      const newPost = {
        userId: 'system_ai',
        userName: 'Amaze AI Assistant',
        userAvatar: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
        content: adData.communityPost,
        relatedProductId: product.id,
        isAiGenerated: true
      };
      const { post } = await api.community.createPost(newPost);
      
      return { ...adData, postId: post.id };
    },
    predictBid: async (productId: string) => {
      const { GoogleGenAI, Type } = await import('@google/genai');
      const { getGeminiApiKey } = await import('./aiConfig');
      const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
      
      const { products } = await api.products.getAll();
      const product = products.find(p => p.id === productId);
      if (!product) throw new Error('Product not found');

      const bidHistory = product.bidHistory || [];
      const prompt = `
        Dựa trên lịch sử đấu giá của sản phẩm này, hãy dự báo giá thầu cuối cùng.
        Sản phẩm: ${product.title}
        Giá khởi điểm: $${product.price}
        Giá hiện tại: $${product.currentBid || product.price}
        Số lượt thầu: ${product.bidCount || 0}
        Lịch sử thầu: ${JSON.stringify(bidHistory)}
        Thời gian kết thúc: ${product.endTime}

        Yêu cầu đầu ra JSON:
        - predictedPrice: Giá dự báo cuối cùng (số).
        - confidence: Độ tin tưởng (0-1).
        - reasoning: Giải thích ngắn gọn tại sao bạn đưa ra con số đó.
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-3.1-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              predictedPrice: { type: Type.NUMBER },
              confidence: { type: Type.NUMBER },
              reasoning: { type: Type.STRING }
            },
            required: ["predictedPrice", "confidence", "reasoning"]
          }
        }
      });
      return JSON.parse(result.text || '{}');
    },
  }
};
