import React from 'react';
import { api } from '../services/api';
import { CheckCircle, XCircle, FileText, AlertTriangle, Bot, Loader2 } from 'lucide-react';

const AdminVerification: React.FC = () => {
  const [pendingProducts, setPendingProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [verifyingId, setVerifyingId] = React.useState<string | null>(null);

  const fetchPending = async () => {
    try {
      const res = await api.admin.getPendingProducts();
      setPendingProducts(res.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPending();
  }, []);

  const handleAIVerify = async (productId: string) => {
    setVerifyingId(productId);
    // Simulate AI verification process
    setTimeout(async () => {
      try {
        await api.admin.verifyProduct(productId, true, 'AI đã xác thực giấy tờ hợp lệ (Độ tin cậy: 98%)');
        fetchPending();
      } catch (err) {
        console.error(err);
      } finally {
        setVerifyingId(null);
      }
    }, 2500);
  };

  const handleManualReject = async (productId: string) => {
    try {
      await api.admin.verifyProduct(productId, false, 'Giấy tờ không hợp lệ hoặc mờ');
      fetchPending();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

  if (pendingProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <CheckCircle size={48} className="text-green-500 mb-4" />
        <p className="font-bold text-lg">Không có tài sản nào cần duyệt</p>
        <p className="text-sm">Tất cả tài sản giá trị cao đã được xử lý</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3">
        <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="font-bold text-yellow-900 text-sm">Hàng đợi kiểm duyệt</h4>
          <p className="text-xs text-yellow-700 mt-1">
            Có {pendingProducts.length} tài sản giá trị cao đang chờ xác thực giấy tờ pháp lý. Bạn có thể sử dụng AI để tự động quét và đối chiếu thông tin.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {pendingProducts.map(product => (
          <div key={product.id} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row gap-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden shrink-0 bg-gray-100">
              <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{product.title}</h3>
                  <p className="text-sm text-gray-500">{product.category} • ${product.price}</p>
                </div>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-md">Chờ duyệt</span>
              </div>
              
              <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText size={14} /> Giấy tờ đính kèm (Mô phỏng)
                </p>
                <div className="flex gap-2">
                  <div className="w-12 h-12 bg-gray-200 rounded border border-gray-300 flex items-center justify-center text-[8px] text-gray-500">IMG_01</div>
                  <div className="w-12 h-12 bg-gray-200 rounded border border-gray-300 flex items-center justify-center text-[8px] text-gray-500">DOC_02</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-2 shrink-0 md:w-48 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
              <button 
                onClick={() => handleAIVerify(product.id)}
                disabled={verifyingId === product.id}
                className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:bg-indigo-400"
              >
                {verifyingId === product.id ? (
                  <><Loader2 size={16} className="animate-spin" /> Đang quét AI...</>
                ) : (
                  <><Bot size={16} /> AI Tự động duyệt</>
                )}
              </button>
              <button 
                onClick={() => handleManualReject(product.id)}
                disabled={verifyingId === product.id}
                className="w-full bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <XCircle size={16} /> Từ chối
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminVerification;
