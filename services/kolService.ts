import { api } from "./api";

export interface KOLProfile {
  id: string;
  name: string;
  style: string;
  avatarUrl: string;
  description: string;
}

// 1. Analyze a reference video to extract motion/style description
export const analyzeMotionStyle = async (motionDescription: string): Promise<string> => {
  try {
    const result = await api.ai.generate({
      prompt: `Analyze this motion description for a video generation prompt: "${motionDescription}". 
      Convert it into a precise visual prompt for a video generation model (Veo).
      Focus on camera angles, lighting, and specific movements.
      Output ONLY the prompt text.`,
      modelType: 'FLASH'
    });
    return result.text?.trim() || motionDescription;
  } catch (error) {
    console.error("Motion Analysis Error:", error);
    return motionDescription;
  }
};

// 2. Generate a KOL Avatar (Image)
export const generateKOLAvatar = async (prompt: string): Promise<string | null> => {
  try {
    const result = await api.ai.image({
      prompt: `Full body portrait of a virtual influencer (KOL), ${prompt}, high fashion, studio lighting, 8k, realistic texture.`,
      aspectRatio: "9:16"
    });
    return result.image;
  } catch (error) {
    console.error("KOL Avatar Gen Error:", error);
    return null;
  }
};

// Generate multiple KOL images (gallery) with different poses
export const generateKOLGallery = async (prompt: string, customPoses?: string[], cameraAngle?: string): Promise<string[]> => {
  const defaultPoses = [
    "full body portrait, standing confidently, looking at camera",
    "full body, walking forward on a runway, dynamic movement",
    "full body, running pose, athletic and energetic",
    "fashion show modeling, dramatic pose, high fashion editorial",
    "presenting a product, holding hands out, friendly smile"
  ];

  const poses = customPoses && customPoses.length > 0 ? customPoses : defaultPoses;

  try {
    const results: string[] = [];
    // Execute sequentially to avoid rate limiting
    for (const pose of poses) {
      try {
        const isProfessional = prompt.toLowerCase().includes('công nhân') || 
                               prompt.toLowerCase().includes('kỹ sư') || 
                               prompt.toLowerCase().includes('nông dân') ||
                               prompt.toLowerCase().includes('y tế') ||
                               prompt.toLowerCase().includes('xây dựng');
        
        const styleModifier = isProfessional ? "realistic setting, professional attire" : "high fashion, studio lighting";
        const finalCameraAngle = cameraAngle || "cinematic camera angle";
        
        const res = await api.ai.image({
          prompt: `${pose} of a virtual influencer (KOL), ${prompt}, ${styleModifier}, 8k, realistic texture, ${finalCameraAngle}.`,
          aspectRatio: "9:16"
        });
        if (res.image) {
          results.push(res.image);
        }
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.error("Failed to generate pose:", pose, e);
      }
    }
    
    return results;
  } catch (error) {
    console.error("KOL Gallery Gen Error:", error);
    return [];
  }
};

// 2b. Generate KOL with specific Outfit (Products)
export const generateKOLOutfitGallery = async (baseDescription: string, productTitles: string[], customPoses?: string[], cameraAngle?: string): Promise<string[]> => {
    const outfitDescription = productTitles.join(", ");
    const defaultPoses = [
      "full body portrait, standing confidently",
      "full body, walking forward on a runway, dynamic movement",
      "fashion show modeling, dramatic pose, high fashion editorial",
      "presenting the product, holding hands out, friendly smile"
    ];

    const poses = customPoses && customPoses.length > 0 ? customPoses : defaultPoses;
    
    try {
      const results: string[] = [];
      // Execute sequentially to avoid rate limiting
      for (const pose of poses) {
        const isProfessional = baseDescription.toLowerCase().includes('công nhân') || 
                               baseDescription.toLowerCase().includes('kỹ sư') || 
                               baseDescription.toLowerCase().includes('nông dân') ||
                               baseDescription.toLowerCase().includes('y tế') ||
                               baseDescription.toLowerCase().includes('xây dựng');
        
        const styleModifier = isProfessional ? "realistic setting, professional attire" : "high fashion, studio lighting";
        const finalCameraAngle = cameraAngle || "cinematic camera angle";

        try {
          const res = await api.ai.image({
            prompt: `${pose} of a virtual influencer (KOL), ${baseDescription}. Wearing the following fashion items: ${outfitDescription}. The outfit should be stylishly coordinated. ${styleModifier}, 8k, realistic texture, ${finalCameraAngle}.`,
            aspectRatio: "9:16"
          });
          if (res.image) {
            results.push(res.image);
          }
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
          console.error("Failed to generate outfit pose:", pose, e);
        }
      }
      
      return results;
    } catch (error) {
      console.error("KOL Outfit Gen Error:", error);
      return [];
    }
  };

// 3. Generate Auto-Stream Video (KOL + Product)
export const generateStreamVideo = async (
  kolImageBase64: string, 
  productImageBase64: string, 
  script: string
): Promise<string | null> => {
  const prompt = `A video of this character (KOL) holding and presenting the products. 
  Action: ${script}. 
  Style: Professional livestream, bright lighting, 4k, focus on product details.`;

  try {
    const result = await api.ai.video({
      prompt,
      imageBase64: kolImageBase64
    });
    return result.video;
  } catch (error) {
    console.error("Stream Gen Error:", error);
    return null;
  }
};

// 4. Generate Livestream Script
export const generateStreamScript = async (productNames: string[], kolStyle: string, knowledgeContext: string = ''): Promise<string> => {
    const productsText = productNames.join(", ");
    try {
        const result = await api.ai.generate({
            prompt: `Write a short, energetic 20-second livestream script for a KOL selling/wearing these products: "${productsText}".
            Style: ${kolStyle}.
            Format: Just the spoken lines and key actions in brackets.
            The KOL should mention how they are mixing and matching these items.
            ${knowledgeContext ? `\nTHÔNG TIN THAM KHẢO VỀ SẢN PHẨM (Sử dụng thông tin này để viết kịch bản chính xác hơn):\n${knowledgeContext}\n` : ''}`,
            modelType: 'FLASH'
        });
        return result.text || "";
    } catch {
        return "Xin chào mọi người! Hôm nay mình có một set đồ cực chất muốn giới thiệu...";
    }
}
