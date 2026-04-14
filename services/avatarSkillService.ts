import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";

export interface AvatarContext {
    avatarName: string;
    product: Product | null;
    hasVideoAvailable: boolean;
}

export interface AvatarAction {
    type: 'VOUCHER' | 'PIN' | 'VIDEO' | 'SING' | 'JOKE' | 'CHANGE_OUTFIT' | 'CHANGE_ENV' | 'REFINE_MODEL' | 'NONE';
    payload?: any;
}

export interface AvatarResponse {
    replyText: string;
    action: AvatarAction;
}

export const processAvatarInteraction = async (userMessage: string, context: AvatarContext): Promise<AvatarResponse> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `Bạn là nhân vật ảo tên là ${context.avatarName}.
Khách hàng hỏi: "${userMessage}". Hãy trả lời ngắn gọn, thân thiện bằng tiếng Việt (tối đa 2-3 câu).
Bạn có các kỹ năng (skills) sau đây để tương tác với khách hàng. Hãy gọi hàm tương ứng nếu phù hợp với yêu cầu của khách:
1. Nếu khách hàng hỏi xin mã giảm giá, hãy gọi hàm showVoucher.
2. Nếu khách hàng muốn mua sản phẩm hoặc hỏi về sản phẩm đang bán, hãy gọi hàm pinProduct.
3. Nếu khách hàng muốn xem chi tiết sản phẩm, xem video sản phẩm, hoặc hỏi "sản phẩm này dùng thế nào", hãy gọi hàm showProductVideo.
4. Nếu khách yêu cầu hát một bài, hãy gọi hàm singSong.
5. Nếu khách yêu cầu kể chuyện cười, hãy gọi hàm tellJoke.
6. Nếu khách yêu cầu thay đổi trang phục (ví dụ: mặc đồ thể thao, đồ dạ hội, đồ công sở, đồ streetwear), hãy gọi hàm changeOutfit.
7. Nếu khách yêu cầu đổi cảnh nền hoặc studio (ví dụ: ra ngoài trời, lên sân khấu, vào phòng khách), hãy gọi hàm changeEnvironment.
8. Nếu khách yêu cầu tinh chỉnh ngoại hình, làm cho nhân vật giống người thật hơn, hoặc thay đổi các đặc điểm cơ thể/giọng nói, hãy gọi hàm refineModel.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                tools: [{
                    functionDeclarations: [
                        {
                            name: "showVoucher",
                            description: "Hiển thị mã giảm giá cho khách hàng khi họ yêu cầu",
                            parameters: {
                                type: Type.OBJECT,
                                properties: {
                                    code: { type: Type.STRING, description: "Mã giảm giá (VD: FREESHIP, GIAM50K)" },
                                    discount: { type: Type.STRING, description: "Mức giảm giá" }
                                },
                                required: ["code", "discount"]
                            }
                        },
                        {
                            name: "pinProduct",
                            description: "Ghim sản phẩm lên màn hình khi khách hàng muốn mua",
                            parameters: {
                                type: Type.OBJECT,
                                properties: {
                                    productId: { type: Type.STRING, description: "ID của sản phẩm" }
                                }
                            }
                        },
                        {
                            name: "showProductVideo",
                            description: "Phát video giới thiệu sản phẩm khi khách hàng muốn xem chi tiết hoặc cách sử dụng",
                            parameters: {
                                type: Type.OBJECT,
                                properties: {
                                    productId: { type: Type.STRING, description: "ID của sản phẩm" }
                                }
                            }
                        },
                        {
                            name: "singSong",
                            description: "Hát một bài hát ngắn để tặng khách hàng",
                            parameters: {
                                type: Type.OBJECT,
                                properties: {
                                    topic: { type: Type.STRING, description: "Chủ đề bài hát (VD: tình yêu, vui vẻ, sản phẩm)" }
                                }
                            }
                        },
                        {
                            name: "tellJoke",
                            description: "Kể một câu chuyện cười ngắn để làm vui lòng khách hàng",
                            parameters: {
                                type: Type.OBJECT,
                                properties: {
                                    topic: { type: Type.STRING, description: "Chủ đề câu chuyện cười" }
                                }
                            }
                        },
                        {
                            name: "changeOutfit",
                            description: "Thay đổi trang phục của Avatar theo yêu cầu của khách",
                            parameters: {
                                type: Type.OBJECT,
                                properties: {
                                    style: { type: Type.STRING, description: "Phong cách trang phục: 'CASUAL', 'EVENING', 'STREETWEAR', 'SPORT'" }
                                },
                                required: ["style"]
                            }
                        },
                        {
                            name: "changeEnvironment",
                            description: "Thay đổi bối cảnh/phòng livestream của Avatar",
                            parameters: {
                                type: Type.OBJECT,
                                properties: {
                                    envType: { type: Type.STRING, description: "Loại bối cảnh: 'STUDIO', 'STAGE', 'OUTDOOR', 'SHOP'" }
                                },
                                required: ["envType"]
                            }
                        },
                        {
                            name: "refineModel",
                            description: "Tinh chỉnh mô hình 3D và giọng nói để giống người thật hoặc theo yêu cầu sáng tạo",
                            parameters: {
                                type: Type.OBJECT,
                                properties: {
                                    prompt: { type: Type.STRING, description: "Mô tả yêu cầu tinh chỉnh (VD: làm cho giống người thật, cao hơn, giọng trầm hơn)" }
                                },
                                required: ["prompt"]
                            }
                        }
                    ]
                }]
            }
        });

        let replyText = response.text || "Cảm ơn bạn đã quan tâm!";
        let action: AvatarAction = { type: 'NONE' };

        if (response.functionCalls && response.functionCalls.length > 0) {
            const call = response.functionCalls[0];
            const args = call.args as any;

            if (call.name === "showVoucher") {
                action = { type: 'VOUCHER', payload: { code: args.code, discount: args.discount } };
                replyText = `Mình vừa gửi mã giảm giá ${args.code} cho bạn rồi nhé! Nhanh tay lưu lại nha.`;
            } else if (call.name === "pinProduct") {
                if (context.product) {
                    action = { type: 'PIN', payload: { product: context.product } };
                    replyText = `Mình đã ghim sản phẩm ${context.product.title} lên màn hình rồi nhé. Bạn click vào để xem chi tiết nha!`;
                }
            } else if (call.name === "showProductVideo") {
                if (context.hasVideoAvailable) {
                    action = { type: 'VIDEO', payload: { productId: context.product?.id } };
                    replyText = `Mời bạn xem video chi tiết về sản phẩm đang được chiếu trên màn hình nhé! Đây là video được tạo tự động từ Studio của chúng mình.`;
                } else {
                    replyText = `Dạ hiện tại sản phẩm này chưa có video chi tiết, bạn xem tạm hình ảnh giúp mình nhé!`;
                }
            } else if (call.name === "singSong") {
                action = { type: 'SING', payload: { topic: args.topic } };
                replyText = `Mình xin gửi tặng bạn một đoạn hát ngắn về ${args.topic || 'niềm vui'} nhé!`;
            } else if (call.name === "tellJoke") {
                action = { type: 'JOKE', payload: { topic: args.topic } };
                const jokeResponse = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: `Kể một câu chuyện cười cực ngắn (2 câu) bằng tiếng Việt về chủ đề: ${args.topic || 'mua sắm'}`
                });
                replyText = jokeResponse.text || "Hôm nay mình hơi bí ý tưởng, hẹn bạn lúc khác kể chuyện cười nha!";
            } else if (call.name === "changeOutfit") {
                action = { type: 'CHANGE_OUTFIT', payload: { style: args.style } };
                replyText = `Mình vừa thay một bộ đồ phong cách ${args.style} theo ý bạn rồi nè, bạn thấy sao?`;
            } else if (call.name === "changeEnvironment") {
                action = { type: 'CHANGE_ENV', payload: { envType: args.envType } };
                replyText = `Tèn ten! Mình đã chuyển sang bối cảnh mới rồi nhé. Không gian này hợp với buổi live hôm nay chứ?`;
            } else if (call.name === "refineModel") {
                action = { type: 'REFINE_MODEL', payload: { prompt: args.prompt } };
                replyText = `Được chứ! Đợi mình xíu để mình tinh chỉnh lại ngoại hình và giọng nói cho phù hợp với yêu cầu "${args.prompt}" của bạn nhé.`;
            }

            // --- LOCAL BRIDGE INTEGRATION ---
            // If the user is running the local-bridge.js script, send the action to OBS/VSeeFace
            try {
                fetch('http://localhost:3001/api/action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: action.type, payload: action.payload })
                }).catch(() => {
                    // Ignore errors if the bridge is not running
                    console.log("Local bridge not detected. Running in Web-only mode.");
                });
            } catch {
                // Silent fail
            }
        }

        return { replyText, action };

    } catch (error) {
        console.error("Avatar Skill Error:", error);
        return { replyText: "Xin lỗi, mình đang gặp chút sự cố kỹ thuật. Bạn đợi mình xíu nhé!", action: { type: 'NONE' } };
    }
};
