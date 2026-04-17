import React, { useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Scan } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerId = "barcode-scanner-viewport";

  const handleScanSuccess = useCallback((decodedText: string) => {
    onScanSuccess(decodedText);
    if (scannerRef.current) {
        scannerRef.current.clear();
    }
    onClose();
  }, [onScanSuccess, onClose]);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.0,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E
          ]
        };

        const scanner = new Html5QrcodeScanner(scannerId, config, false);
        scannerRef.current = scanner;

        scanner.render(
          handleScanSuccess,
          () => {
            // Silence common errors
          }
        );
      }, 500);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(err => console.error("Scanner clear error", err));
        }
      };
    }
  }, [isOpen, handleScanSuccess]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800"
        >
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                <Scan className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white">Quét Mã Vạch</h3>
                <p className="text-sm text-zinc-500">Đặt mã vạch hoặc mã QR vào khung hình</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X className="w-6 h-6 dark:text-zinc-400" />
            </button>
          </div>

          <div className="p-6">
            <div 
              id={scannerId} 
              className="overflow-hidden rounded-2xl border-4 border-dashed border-zinc-200 dark:border-zinc-700 aspect-square"
            >
              {/* html5-qrcode will render here */}
            </div>
          </div>

          <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 flex justify-center">
            <button 
              onClick={onClose}
              className="px-6 py-2 rounded-xl border border-zinc-300 dark:border-zinc-600 font-medium dark:text-zinc-200"
            >
              Hủy bỏ
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BarcodeScanner;
