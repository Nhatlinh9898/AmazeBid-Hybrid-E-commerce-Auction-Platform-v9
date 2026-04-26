import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Product } from '../types';
import ProductCard from './ProductCard';

interface AIRecommendationsProps {
  products: Product[];
  cartItems: any[];
  onAddToCart: (p: Product) => void;
  onPlaceBid: (p: Product) => void;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({ products, cartItems, onAddToCart, onPlaceBid }) => {
  const [recommendedProducts, setRecommendedProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate AI processing time
    const timer = setTimeout(() => {
      // Simple mock logic: if cart has items, recommend similar categories. 
      // Otherwise, recommend random items.
      let recommendations: Product[] = [];
      if (cartItems.length > 0) {
        const cartCategories = cartItems.map(item => item.category);
        recommendations = products.filter(p => cartCategories.includes(p.category) && !cartItems.find(c => c.id === p.id));
      }
      
      // Fill with random if not enough
      if (recommendations.length < 5) {
        const remaining = products.filter(p => !recommendations.includes(p) && !cartItems.find(c => c.id === p.id));
        const randomItems = [...remaining].sort(() => 0.5 - Math.random()).slice(0, 5 - recommendations.length);
        recommendations = [...recommendations, ...randomItems];
      }
      
      setRecommendedProducts(recommendations.slice(0, 5));
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [cartItems, products]);

  if (recommendedProducts.length === 0) return null;

  return (
    <div className="mt-12 mb-8 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 shadow-sm relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg text-white shadow-md">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI Gợi ý cho bạn</h2>
            <p className="text-sm text-gray-600">Dựa trên sở thích và giỏ hàng của bạn</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
            <p className="text-sm text-purple-600 font-medium">AI đang phân tích sở thích của bạn...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {recommendedProducts.map(product => (
              <ProductCard 
                key={`ai-rec-${product.id}`} 
                product={product} 
                onAddToCart={onAddToCart}
                onPlaceBid={onPlaceBid} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRecommendations;
