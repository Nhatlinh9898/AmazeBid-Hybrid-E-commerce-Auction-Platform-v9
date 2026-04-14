
import React, { useState, useEffect } from 'react';
import { Key, AlertTriangle, ExternalLink, CheckCircle2 } from 'lucide-react';
import { isGeminiConfigured } from '../services/aiConfig';

interface ApiKeySelectorProps {
  onKeySelected?: () => void;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
  const [hasKey, setHasKey] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkKey = async () => {
      // Check if key is already in process.env
      if (isGeminiConfigured()) {
        setHasKey(true);
        setIsChecking(false);
        return;
      }

      // Check if platform selection is available
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        try {
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasKey(selected);
        } catch (e) {
          console.error("Error checking AI Studio API key:", e);
        }
      } else {
        // Not in AI Studio or platform API not available
        // We assume it's missing if not in process.env
        setHasKey(false);
      }
      setIsChecking(false);
    };

    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        // Skill says: "assume the key selection was successful after triggering openSelectKey() and proceed to the app"
        setHasKey(true);
        if (onKeySelected) onKeySelected();
      } catch (e) {
        console.error("Error opening AI Studio API key selector:", e);
      }
    } else {
      alert("Hệ thống chọn API Key không khả dụng. Vui lòng cấu hình GEMINI_API_KEY trong biến môi trường.");
    }
  };

  if (isChecking || hasKey) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Key className="text-orange-600 w-10 h-10" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cấu hình Gemini AI</h2>
        <p className="text-gray-600 mb-6">
          Để sử dụng các tính năng AI (Livestream, Tư vấn mua sắm, Tạo nội dung), bạn cần chọn một API Key từ dự án Google Cloud có trả phí.
        </p>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 text-left">
          <div className="flex gap-3">
            <AlertTriangle className="text-blue-600 shrink-0 w-5 h-5" />
            <div className="text-sm text-blue-800">
              <p className="font-bold mb-1">Lưu ý quan trọng:</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>Bạn sẽ không bị tính phí cho các yêu cầu trong hạn mức miễn phí.</li>
                <li>API Key được bảo mật và chỉ sử dụng trong ứng dụng này.</li>
                <li>Xem hướng dẫn thiết lập thanh toán tại <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">đây <ExternalLink size={12} /></a></li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={handleSelectKey}
          className="w-full py-4 bg-[#131921] text-white rounded-xl font-bold text-lg hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-95"
        >
          <CheckCircle2 size={24} />
          Chọn API Key để bắt đầu
        </button>
        
        <p className="mt-4 text-xs text-gray-400 italic">
          * Nếu bạn đã cấu hình biến môi trường, thông báo này sẽ tự động biến mất.
        </p>
      </div>
    </div>
  );
};

export default ApiKeySelector;
