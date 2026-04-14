import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Star, Send, Image as ImageIcon, UserPlus, UserCheck, BookOpen, Trophy, X } from 'lucide-react';
import { FeedPost, Review, Product, ContentPost } from '../types';
import Leaderboard from './Leaderboard';

interface CommunityFeedProps {
  posts: FeedPost[];
  reviews: Review[];
  products: Product[];
  contentPosts?: ContentPost[]; // New prop for blog posts
  currentUserId: string | undefined;
  currentUserAvatar?: string;
  following: string[];
  onLikePost: (postId: string) => void;
  onCommentPost: (postId: string, comment: string) => void;
  onAddPost: (content: string, images?: string[], relatedProductId?: string) => void;
  onToggleFollow: (userId: string) => void;
  onAddToCart?: (product: Product) => void;
}

const CommunityFeed: React.FC<CommunityFeedProps> = ({ posts, reviews, products, contentPosts = [], currentUserId, currentUserAvatar, following, onLikePost, onCommentPost, onAddPost, onToggleFollow, onAddToCart }) => {
  const [activeTab, setActiveTab] = useState<'FEED' | 'REVIEWS' | 'BLOG' | 'LEADERBOARD'>('FEED');
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  
  // Create Post State
  const [postContent, setPostContent] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const handleCommentSubmit = (postId: string) => {
    if (newComment[postId]?.trim()) {
      onCommentPost(postId, newComment[postId]);
      setNewComment({ ...newComment, [postId]: '' });
    }
  };

  const handlePostSubmit = () => {
    if (postContent.trim() || uploadedImages.length > 0) {
      onAddPost(postContent, uploadedImages, selectedProductId || undefined);
      setPostContent('');
      setSelectedProductId('');
      setUploadedImages([]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={14} className={i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
    ));
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Cộng đồng AmazeBid</h2>
        <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
          <button
            onClick={() => setActiveTab('FEED')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'FEED' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Bảng tin
          </button>
          <button
            onClick={() => setActiveTab('REVIEWS')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'REVIEWS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Đánh giá
          </button>
          <button
            onClick={() => setActiveTab('BLOG')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1 ${activeTab === 'BLOG' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <BookOpen size={14} /> Bài viết AI
          </button>
          <button
            onClick={() => setActiveTab('LEADERBOARD')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1 ${activeTab === 'LEADERBOARD' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Trophy size={14} /> Bảng xếp hạng
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        
        {/* Create Post Section */}
        {activeTab === 'FEED' && currentUserId && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex gap-3">
              <img src={currentUserAvatar || 'https://i.pravatar.cc/150'} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
              <div className="flex-1">
                <textarea 
                  placeholder="Bạn đang nghĩ gì? Chia sẻ đánh giá hoặc món đồ bạn vừa săn được..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 resize-none"
                  rows={3}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />
                <div className="flex items-center justify-between mt-3">
                   <div className="flex gap-2">
                      <button 
                        onClick={() => document.getElementById('post-image-upload')?.click()}
                        className="text-gray-500 hover:text-blue-500 flex items-center gap-1 text-sm transition-colors"
                      >
                        <ImageIcon size={16} /> <span className="hidden sm:inline">Ảnh/Video</span>
                      </button>
                      <input 
                        id="post-image-upload"
                        type="file" 
                        accept="image/*,video/*" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                      />
                      <select 
                        className="text-sm border border-gray-200 rounded p-1 outline-none text-gray-600 max-w-[150px] sm:max-w-xs"
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                      >
                        <option value="">Đính kèm sản phẩm</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      </select>
                   </div>
                   <button 
                     onClick={handlePostSubmit}
                     disabled={!postContent.trim() && uploadedImages.length === 0}
                     className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-full text-sm font-bold disabled:opacity-50 transition-all"
                   >
                     Đăng bài
                   </button>
                </div>
                {uploadedImages.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 shrink-0">
                        <img src={img} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                        <button 
                          onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-gray-400 mt-2 italic">
                  * Tải lên ảnh/video thực tế của bạn để chia sẻ thay vì dùng AI tạo mới, giúp cộng đồng tin tưởng hơn.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'FEED' && posts.map(post => {
          const relatedProduct = products.find(p => p.id === post.relatedProductId);
          return (
            <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Post Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={post.userAvatar} alt={post.userName} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                      {post.userName}
                      {currentUserId !== post.userId && (
                        <button 
                          onClick={() => onToggleFollow(post.userId)}
                          className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${following.includes(post.userId) ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                        >
                          {following.includes(post.userId) ? <><UserCheck size={12}/> Đang theo dõi</> : <><UserPlus size={12}/> Theo dõi</>}
                        </button>
                      )}
                    </h4>
                    <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={20} /></button>
              </div>

              {/* Post Content */}
              <div className="px-4 pb-3">
                <p className="text-gray-800 text-sm whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Post Images */}
              {post.images && post.images.length > 0 && (
                <div className={`grid gap-1 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {post.images.map((img, idx) => (
                    <img key={idx} src={img} alt="Post content" className="w-full h-64 object-cover" />
                  ))}
                </div>
              )}

              {/* Related Product Card */}
              {relatedProduct && (
                <div className="mx-4 my-3 p-3 border border-gray-200 rounded-lg flex gap-3 hover:bg-gray-50 transition-colors items-center">
                  <img src={relatedProduct.image} alt={relatedProduct.title} className="w-16 h-16 object-cover rounded-md cursor-pointer" />
                  <div className="flex-1 cursor-pointer">
                    <h5 className="font-bold text-sm text-gray-900 line-clamp-1">{relatedProduct.title}</h5>
                    <p className="text-xs text-gray-500 mt-1">{relatedProduct.category}</p>
                    <p className="font-bold text-[#b12704] mt-1">${relatedProduct.price}</p>
                  </div>
                  {onAddToCart && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(relatedProduct);
                      }}
                      className="bg-[#febd69] hover:bg-[#f3a847] text-black text-xs font-bold px-3 py-2 rounded-full shadow-sm transition-colors whitespace-nowrap"
                    >
                      Mua ngay
                    </button>
                  )}
                </div>
              )}

              {/* Post Actions */}
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex gap-4">
                  <button 
                    onClick={() => onLikePost(post.id)}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Heart size={18} /> <span className="text-sm font-medium">{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition-colors">
                    <MessageCircle size={18} /> <span className="text-sm font-medium">{post.comments}</span>
                  </button>
                </div>
                <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors">
                  <Share2 size={18} />
                </button>
              </div>

              {/* Comment Input */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
                <img src={currentUserAvatar || "https://i.pravatar.cc/150?img=11"} alt="Current User" className="w-8 h-8 rounded-full object-cover" />
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    placeholder="Viết bình luận..." 
                    value={newComment[post.id] || ''}
                    onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                    className="w-full bg-white border border-gray-300 rounded-full py-1.5 pl-4 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button 
                    onClick={() => handleCommentSubmit(post.id)}
                    disabled={!newComment[post.id]?.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700 disabled:opacity-50"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {activeTab === 'REVIEWS' && reviews.map(review => {
          const relatedProduct = products.find(p => p.id === review.productId);
          return (
            <div key={review.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img src={review.userAvatar} alt={review.userName} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{review.userName}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex">{renderStars(review.rating)}</div>
                      <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gray-800 text-sm mb-3">{review.comment}</p>

              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2 custom-scrollbar">
                  {review.images.map((img, idx) => (
                    <img key={idx} src={img} alt="Review" className="w-20 h-20 object-cover rounded-lg border border-gray-200 shrink-0" />
                  ))}
                </div>
              )}

              {relatedProduct && (
                <div className="p-2 bg-gray-50 rounded-lg flex items-center gap-3 border border-gray-100">
                  <img src={relatedProduct.image} alt={relatedProduct.title} className="w-10 h-10 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 truncate">Đánh giá cho sản phẩm:</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{relatedProduct.title}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Blog Posts Tab */}
        {activeTab === 'BLOG' && (
          <div className="space-y-6">
            {contentPosts.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Chưa có bài viết nào được tạo.</p>
                <p className="text-sm text-gray-400 mt-1">Hãy sử dụng Content Studio để tạo bài viết chuẩn SEO đầu tiên!</p>
              </div>
            ) : (
              contentPosts.map(post => (
                <article key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Blog Header Image/Video */}
                  {post.generatedVideo ? (
                    <div className="h-64 overflow-hidden relative bg-black">
                      <video src={post.generatedVideo} controls className="w-full h-full object-contain" />
                    </div>
                  ) : post.generatedImages && post.generatedImages.length > 1 ? (
                    <div className="h-64 overflow-hidden relative bg-black">
                      <div 
                        className="absolute inset-0 flex"
                        style={{ animation: `slide 10s infinite alternate` }}
                      >
                        {post.generatedImages.map((img, i) => (
                          <img key={i} src={img} alt={post.title} className="w-full h-full object-contain shrink-0" />
                        ))}
                      </div>
                      <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm font-bold">
                        Slideshow
                      </div>
                    </div>
                  ) : post.generatedImages && post.generatedImages.length === 1 ? (
                    <div className="h-48 overflow-hidden relative">
                       <img src={post.generatedImages[0]} alt={post.title} className="w-full h-full object-cover" />
                       <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm font-bold">
                          AI Generated
                       </div>
                    </div>
                  ) : null}

                  <div className="p-5">
                    {/* Meta */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">BLOG</span>
                      <span>•</span>
                      <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-blue-600 cursor-pointer">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {post.content.slice(0, 200)}...
                    </p>

                    {/* Keywords */}
                    {post.keywords && post.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {post.keywords.slice(0, 3).map((kw, i) => (
                          <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full">#{kw}</span>
                        ))}
                      </div>
                    )}

                    {/* Related Product Card */}
                    {post.relatedProductId && products.find(p => p.id === post.relatedProductId) && (
                      <div className="mb-4 p-3 border border-gray-200 rounded-lg flex gap-3 hover:bg-gray-50 transition-colors items-center">
                        <img src={products.find(p => p.id === post.relatedProductId)!.image} alt={products.find(p => p.id === post.relatedProductId)!.title} className="w-16 h-16 object-cover rounded-md cursor-pointer" />
                        <div className="flex-1 cursor-pointer">
                          <h5 className="font-bold text-sm text-gray-900 line-clamp-1">{products.find(p => p.id === post.relatedProductId)!.title}</h5>
                          <p className="text-xs text-gray-500 mt-1">{products.find(p => p.id === post.relatedProductId)!.category}</p>
                          <p className="font-bold text-[#b12704] mt-1">${products.find(p => p.id === post.relatedProductId)!.price}</p>
                        </div>
                        {onAddToCart && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(products.find(p => p.id === post.relatedProductId)!);
                            }}
                            className="bg-[#febd69] hover:bg-[#f3a847] text-black text-xs font-bold px-3 py-2 rounded-full shadow-sm transition-colors whitespace-nowrap"
                          >
                            Mua ngay
                          </button>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                       <div className="flex items-center gap-4">
                          <button className="flex items-center gap-1 text-gray-500 hover:text-red-500 text-sm">
                             <Heart size={16}/> <span>Thích</span>
                          </button>
                          <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 text-sm">
                             <MessageCircle size={16}/> <span>Bình luận</span>
                          </button>
                       </div>
                       <button className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1">
                          Đọc tiếp <Share2 size={14}/>
                       </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'LEADERBOARD' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <Leaderboard />
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityFeed;
