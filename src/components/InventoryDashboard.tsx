import React, { useState } from 'react';
import { Product } from '../types';
import { forecastDemand, suggestCombos, DemandForecast, ComboSuggestion } from '../services/inventoryService';
import { TrendingUp, Wand2 } from 'lucide-react';

interface InventoryDashboardProps {
  products: Product[];
}

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ products }) => {
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
  const [combos, setCombos] = useState<ComboSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleRunAnalysis = async () => {
    setIsLoading(true);
    try {
      const [forecastResult, comboResult] = await Promise.all([
        forecastDemand(products),
        suggestCombos(products)
      ]);
      setForecasts(forecastResult);
      setCombos(comboResult);
    } catch (error) {
      console.error("Inventory analysis failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="text-indigo-600" /> Quản lý Kho & Dự báo
        </h2>
        <button 
          onClick={handleRunAnalysis}
          disabled={isLoading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
        >
          <Wand2 size={16} /> {isLoading ? 'Đang phân tích...' : 'Chạy AI Phân tích'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold text-sm text-gray-500 mb-4">Dự báo nhập hàng</h3>
          {forecasts.map(f => {
            const product = products.find(p => p.id === f.productId);
            return (
              <div key={f.productId} className="bg-gray-50 p-3 rounded-lg mb-2 border border-gray-100">
                <p className="font-bold text-sm">{product?.title}</p>
                <p className="text-xs text-gray-600">Gợi ý nhập: <span className="font-bold text-indigo-600">{f.suggestedRestockQuantity}</span></p>
                <p className="text-[10px] text-gray-500 mt-1">{f.reason}</p>
              </div>
            );
          })}
        </div>
        <div>
          <h3 className="font-bold text-sm text-gray-500 mb-4">Combo gợi ý</h3>
          {combos.map((c, idx) => (
            <div key={idx} className="bg-gray-50 p-3 rounded-lg mb-2 border border-gray-100">
              <p className="text-xs text-gray-700 mb-1">
                {c.productIds.map(id => products.find(p => p.id === id)?.title).join(' + ')}
              </p>
              <p className="text-[10px] text-gray-500">{c.reason}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;
