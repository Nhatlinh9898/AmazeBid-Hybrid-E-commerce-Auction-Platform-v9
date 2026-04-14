import React, { useState } from 'react';
import { Product } from '../types';
import { suggestPackaging, PackagingSuggestion } from '../services/packagingService';
import { Wand2, Box } from 'lucide-react';

interface PackagingSuggestionProps {
  product: Product;
}

const PackagingSuggestionComponent: React.FC<PackagingSuggestionProps> = ({ product }) => {
  const [suggestion, setSuggestion] = useState<PackagingSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGetSuggestion = async () => {
    if (!product.packagingInfo) {
      alert("Vui lòng nhập thông tin kích thước và trọng lượng sản phẩm trước.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await suggestPackaging(product);
      setSuggestion(result);
    } catch (error) {
      console.error("Packaging suggestion failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="font-bold text-sm text-gray-700 mb-2 flex items-center gap-2">
        <Box className="text-indigo-600" size={18} /> Gợi ý Đóng gói AI
      </h3>
      
      {!product.packagingInfo ? (
        <p className="text-xs text-gray-500">Chưa có thông tin kích thước/trọng lượng sản phẩm.</p>
      ) : (
        <button 
          onClick={handleGetSuggestion}
          disabled={isLoading}
          className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-700 flex items-center gap-2"
        >
          <Wand2 size={14} /> {isLoading ? 'Đang gợi ý...' : 'Nhận Gợi ý Đóng gói'}
        </button>
      )}

      {suggestion && (
        <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <p className="font-bold text-sm text-indigo-700">{suggestion.suggestedPackaging}</p>
          <p className="text-xs text-gray-600 mt-1">{suggestion.reason}</p>
          <p className="text-xs font-bold text-gray-800 mt-2">Ước tính phí: {suggestion.estimatedShippingCost}k</p>
        </div>
      )}
    </div>
  );
};

export default PackagingSuggestionComponent;
