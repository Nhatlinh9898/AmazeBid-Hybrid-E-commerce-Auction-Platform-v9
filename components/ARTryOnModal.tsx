import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, RefreshCw, CheckCircle, Smartphone } from 'lucide-react';
import { Product } from '../types';

interface ARTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

const ARTryOnModal: React.FC<ARTryOnModalProps> = ({ isOpen, onClose, product }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraActive(true);
          setCameraError(false);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        // Fallback for demo if camera fails
        setIsCameraActive(false);
        setCameraError(true);
      }
    };

    const stopCamera = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
    };

    if (isOpen && !capturedImage) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      setIsProcessing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Simulate AR Overlay (Draw product image over the face/body)
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = product.image;
        img.onload = () => {
          // Simple simulated positioning (e.g., center of screen)
          const overlayWidth = canvas.width * 0.4;
          const overlayHeight = (img.height / img.width) * overlayWidth;
          const x = (canvas.width - overlayWidth) / 2;
          const y = (canvas.height - overlayHeight) / 2 + 50; // Offset down a bit
          
          ctx.globalAlpha = 0.9;
          ctx.drawImage(img, x, y, overlayWidth, overlayHeight);
          ctx.globalAlpha = 1.0;
          
          setCapturedImage(canvas.toDataURL('image/jpeg'));
          setIsProcessing(false);
        };
      }
    } else if (!isCameraActive) {
        // Fallback demo if no camera
        setIsProcessing(true);
        setTimeout(() => {
            setCapturedImage('https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80');
            setIsProcessing(false);
        }, 1500);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col h-[80vh] max-h-[800px]">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-100 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent text-white">
          <div className="flex items-center gap-2">
            <Smartphone size={20} />
            <h3 className="font-bold text-sm">Thử đồ thực tế ảo (AR)</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Main View */}
        <div className="flex-1 relative bg-gray-900 flex items-center justify-center overflow-hidden">
          {!capturedImage ? (
            <>
              {cameraError ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-gray-400 p-6 text-center">
                  <Camera size={48} className="mb-4 opacity-50" />
                  <p className="font-bold mb-2 text-white">Không tìm thấy Camera</p>
                  <p className="text-sm">Hệ thống sẽ sử dụng ảnh mẫu để mô phỏng tính năng AR Try-on.</p>
                </div>
              ) : (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              )}
              <canvas ref={canvasRef} className="hidden" />
              
              {/* AR Guidelines Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-64 border-2 border-dashed border-white/50 rounded-[100px] flex items-center justify-center">
                    <p className="text-white/50 text-xs text-center px-4">Căn chỉnh khuôn mặt vào khung hình</p>
                </div>
              </div>

              {/* Product Preview Overlay (Bottom Corner) */}
              <div className="absolute bottom-24 right-4 bg-white p-2 rounded-xl shadow-lg flex items-center gap-3">
                  <img src={product.image} className="w-12 h-12 object-cover rounded-lg" />
                  <div className="pr-2">
                      <p className="text-xs font-bold text-gray-900 line-clamp-1 max-w-[100px]">{product.title}</p>
                      <p className="text-[10px] text-gray-500">Đang thử...</p>
                  </div>
              </div>
            </>
          ) : (
            <img src={capturedImage} className="w-full h-full object-cover" alt="AR Try-on Result" />
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white backdrop-blur-sm">
              <RefreshCw className="animate-spin mb-4" size={32} />
              <p className="font-bold">AI đang xử lý hình ảnh...</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 bg-white shrink-0">
          {!capturedImage ? (
            <div className="flex flex-col items-center">
              <button 
                onClick={handleCapture}
                disabled={isProcessing}
                className="w-16 h-16 rounded-full border-4 border-gray-200 flex items-center justify-center hover:border-blue-500 transition-colors group"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-full group-hover:bg-blue-700 transition-colors flex items-center justify-center text-white">
                  <Camera size={24} />
                </div>
              </button>
              <p className="text-xs text-gray-500 mt-3 font-medium">Chạm để chụp và thử đồ</p>
            </div>
          ) : (
            <div className="flex gap-3">
              <button 
                onClick={handleRetake}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} /> Chụp lại
              </button>
              <button 
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
              >
                <CheckCircle size={18} /> Lưu & Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ARTryOnModal;
