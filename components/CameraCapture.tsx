import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Camera, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageBlob: Blob) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Không thể truy cập camera. Vui lòng cấp quyền.");
    }
  }, []);

  useEffect(() => {
    let active = true;

    const init = async () => {
      if (isOpen && active) {
        await startCamera();
      }
    };

    if (isOpen) {
      init();
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      stopCamera();
    }

    return () => {
      active = false;
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
      }
    }
  };

  const handleConfirm = () => {
    if (canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          onCapture(blob);
          onClose();
        }
      }, 'image/jpeg', 0.82);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl"
        >
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Camera className="w-5 h-5 text-orange-500" />
              Chụp ảnh Hóa đơn / Sản phẩm
            </h3>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative aspect-[4/3] bg-black flex items-center justify-center">
            {capturedImage ? (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                {error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 p-6 text-center">
                    <AlertCircle className="w-12 h-12 mb-2" />
                    <p>{error}</p>
                    <button 
                      onClick={startCamera}
                      className="mt-4 px-4 py-2 bg-white text-black rounded-lg font-bold"
                    >
                      Thử lại
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-6 flex justify-center items-center gap-4 bg-zinc-950/50">
            {capturedImage ? (
              <>
                <button 
                  onClick={() => setCapturedImage(null)}
                  className="w-14 h-14 rounded-full border-2 border-zinc-700 flex items-center justify-center text-white"
                >
                  <RefreshCw className="w-6 h-6" />
                </button>
                <button 
                  onClick={handleConfirm}
                  className="flex-1 max-w-[200px] h-14 bg-orange-600 hover:bg-orange-50 rounded-full text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-900/20"
                >
                  <Check className="w-6 h-6" />
                  Xác nhận
                </button>
              </>
            ) : (
              <button 
                onClick={takePhoto}
                disabled={!!error}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group disabled:opacity-50"
              >
                <div className="w-16 h-16 rounded-full bg-white group-active:scale-90 transition-transform" />
              </button>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CameraCapture;
