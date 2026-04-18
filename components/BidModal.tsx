
import React, { useState, useEffect } from 'react';
import { X, Gavel, Clock, History, Trophy, AlertCircle, Sparkles, Loader2, Mail } from 'lucide-react';
import { Product } from '../types';
import socket from '../services/socket';
import { api } from '../services/api';
import { emailService } from '../services/EmailService';
import { useAuth } from '../context/useAuth';

interface BidModalProps {
  product: Product;
  onClose: () => void;
  onSubmitBid: (amount: number) => void;
}

const BidModal: React.FC<BidModalProps> = ({ product, onClose, onSubmitBid }) => {
  const { user } = useAuth();
  const currentBid = product.currentBid || product.price;
  const stepPrice = product.stepPrice || 10;
  const minNextBid = currentBid + stepPrice;
  
  const [bidAmount, setBidAmount] = useState<number>(minNextBid);
  const [error, setError] = useState<string>('');
  const [prediction, setPrediction] = useState<number | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  useEffect(() => {
    socket.emit('join:auction', product.id);
    return () => {
      socket.emit('leave:auction', product.id);
    };
  }, [product.id]);

  useEffect(() => {
    if (bidAmount < minNextBid) {
      const timer = setTimeout(() => {
        setBidAmount(minNextBid);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [minNextBid, bidAmount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bidAmount < minNextBid) {
      setError(`Giá đấu tối thiểu phải là $${minNextBid.toFixed(2)}`);
      return;
    }
    onSubmitBid(bidAmount);
    onClose();
  };

  const handlePredict = async () => {
    setIsPredicting(true);
    try {
      const result = await api.ai.predictBid(product.id);
      setPrediction(result.predictedPrice);
    } catch (err) {
      console.error('Prediction error:', err);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleSimulateWin = () => {
    if (user) {
      emailService.sendAuctionWinNotification(user, product, currentBid);
      alert('Đã gửi email mô phỏng thắng đấu giá vào Hộp thư!');
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        
        {/* Header */}
        <div className="bg-[#131921] p-4 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
             <div className="bg-[#febd69] p-1.5 rounded text-black">
                <Gavel size={20} />
             </div>
             <h2 className="font-bold text-lg">Đấu giá sản phẩm</h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleSimulateWin}
              className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
              title="Mô phỏng thắng đấu giá (Gửi Email)"
            >
              <Mail size={14} /> Thắng
            </button>
            <button onClick={onClose} className="hover:bg-gray-700 p-2 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {/* Product Summary */}
            <div className="flex gap-4 mb-6 pb-6 border-b border-gray-100">
                <img src={product.image} className="w-20 h-20 rounded-lg object-cover bg-gray-100 border border-gray-200" />
                <div>
                    <h3 className="font-bold text-gray-900 line-clamp-2">{product.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded font-bold">
                            <Clock size={12} /> Kết thúc: 2h 15m
                        </span>
                        <span>{product.bidCount} lượt trả giá</span>
                    </div>
                </div>
            </div>

            {/* Current Status */}
            <div className="bg-gray-50 rounded-xl p-5 mb-6 flex justify-between items-center border border-gray-200">
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Giá hiện tại</p>
                    <p className="text-3xl font-black text-[#b12704]">${(currentBid || 0).toLocaleString()}</p>
                </div>
                <div className="text-right">
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Người dẫn đầu</p>
                     <p className="text-sm font-bold flex items-center justify-end gap-1 text-gray-800">
                        <Trophy size={14} className="text-[#febd69]" /> 
                        {product.bidHistory && product.bidHistory.length > 0 
                            ? product.bidHistory[product.bidHistory.length - 1].userName 
                            : 'Chưa có'}
                     </p>
                </div>
            </div>

            {/* Bidding Form */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-700">Đặt giá thầu của bạn</label>
                    <button 
                        type="button"
                        onClick={handlePredict}
                        disabled={isPredicting}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-purple-600 hover:text-purple-700 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100 transition-all"
                    >
                        {isPredicting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        Dự báo giá cuối (AI)
                    </button>
                </div>

                {prediction && (
                    <div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-xl border border-purple-100 animate-in slide-in-from-top-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} className="text-purple-500" />
                                <span className="text-xs font-medium text-purple-700">Dự báo giá kết thúc:</span>
                            </div>
                            <span className="text-sm font-bold text-purple-900">${(prediction || 0).toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-purple-500 mt-1">Dựa trên lịch sử đấu giá và xu hướng thị trường.</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                <div className="relative mb-2">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</div>
                    <input 
                        type="number" 
                        step={stepPrice}
                        min={minNextBid}
                        className="w-full border-2 border-gray-200 rounded-xl p-4 pl-8 text-xl font-bold focus:border-[#febd69] outline-none transition-all"
                        value={bidAmount}
                        onChange={(e) => {
                            setBidAmount(parseFloat(e.target.value));
                            setError('');
                        }}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                         <button 
                            type="button"
                            onClick={() => setBidAmount(currentBid + stepPrice)}
                            className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-xs font-bold transition-colors"
                         >
                            Min (+${stepPrice})
                         </button>
                         <button 
                            type="button"
                            onClick={() => setBidAmount(currentBid + stepPrice * 5)}
                            className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-xs font-bold transition-colors"
                         >
                            +${stepPrice * 5}
                         </button>
                    </div>
                </div>
                {error && (
                    <div className="text-red-500 text-xs flex items-center gap-1 mb-2 animate-in slide-in-from-top-1">
                        <AlertCircle size={12} /> {error}
                    </div>
                )}
                <p className="text-xs text-gray-500 mb-4">
                    Bước giá tối thiểu: <strong>${stepPrice}</strong>. Bạn phải đặt ít nhất <strong>${(minNextBid || 0).toLocaleString()}</strong>.
                </p>
                <button 
                    type="submit"
                    className="w-full bg-[#febd69] hover:bg-[#f3a847] text-black font-bold py-3 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <Gavel size={18} /> Đặt giá thầu ngay
                </button>
            </form>
            </div>

            {/* Bid History */}
            <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <History size={16} /> Lịch sử đấu giá
                </h4>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                            <tr>
                                <td className="p-3">Người đấu giá</td>
                                <td className="p-3 text-right">Giá</td>
                                <td className="p-3 text-right">Thời gian</td>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {product.bidHistory && [...product.bidHistory].reverse().map((bid, index) => (
                                <tr key={bid.id} className={index === 0 ? "bg-orange-50/50" : ""}>
                                    <td className="p-3 font-medium flex items-center gap-2">
                                        {index === 0 && <Trophy size={14} className="text-[#febd69]" />}
                                        {bid.userName === 'Bạn' ? <span className="text-blue-600 font-bold">Bạn</span> : bid.userName}
                                    </td>
                                    <td className={`p-3 text-right font-bold ${index === 0 ? "text-[#b12704]" : "text-gray-600"}`}>
                                        ${(bid.amount || 0).toLocaleString()}
                                    </td>
                                    <td className="p-3 text-right text-gray-400 text-xs">
                                        {bid.timestamp ? new Date(bid.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                            {(!product.bidHistory || product.bidHistory.length === 0) && (
                                <tr>
                                    <td colSpan={3} className="p-4 text-center text-gray-400 italic">Chưa có lượt trả giá nào. Hãy là người đầu tiên!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BidModal;
