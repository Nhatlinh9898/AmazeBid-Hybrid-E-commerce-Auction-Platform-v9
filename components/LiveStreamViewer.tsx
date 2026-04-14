
import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, Send, Share2, Mic, MicOff, Camera, CameraOff, ShoppingBag, CreditCard, CheckCircle2, TrendingUp, VideoOff, ExternalLink, Layers, ChevronRight, ChevronLeft, Link as LinkIcon } from 'lucide-react';
import { LiveStream, Product, ItemType } from '../types';
import socket from '../services/socket';

interface LiveStreamViewerProps {
  stream?: LiveStream; 
  products: Product[];
  onClose: () => void;
  onPlaceBid: (p: Product, amount: number) => void;
  onAddToCart: (p: Product) => void;
  isHost?: boolean; // Explicit flag for host mode
}

const LiveStreamViewer: React.FC<LiveStreamViewerProps> = ({ stream, products, onClose, onPlaceBid, onAddToCart, isHost = false }) => {
  const [messages, setMessages] = useState<{user: string, text: string}[]>([]);
  const [input, setInput] = useState('');
  const [featuredProduct, setFeaturedProduct] = useState<Product | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);
  
  // Host Controls
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraError, setCameraError] = useState(false); // Track camera permission errors
  
  // Checkout States
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // Filter products: If stream exists, use its list. If host mode (creating), filter by currentUser
  const currentProducts = stream && stream.featuredProductIds.length > 0
    ? products.filter(p => stream.featuredProductIds.includes(p.id))
    : products.filter(p => p.sellerId === 'currentUser'); 

  useEffect(() => {
    // If we have products, feature the first one by default
    if (currentProducts.length > 0 && !featuredProduct) {
        const timer = setTimeout(() => {
            setFeaturedProduct(currentProducts[0]);
        }, 0);
        return () => clearTimeout(timer);
    }
  }, [currentProducts, featuredProduct]);

  // Sync featured product updates (e.g. price change)
  useEffect(() => {
    if (featuredProduct) {
        const updated = products.find(p => p.id === featuredProduct.id);
        if (updated && updated !== featuredProduct) {
            const timer = setTimeout(() => {
                setFeaturedProduct(updated);
            }, 0);
            return () => clearTimeout(timer);
        }
    }
  }, [products, featuredProduct]);

  // Scroll bid history
  useEffect(() => {
      if (historyRef.current) historyRef.current.scrollTop = 0; 
  }, [featuredProduct?.bidHistory]);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Socket: Join auction room for featured product
  useEffect(() => {
    if (featuredProduct && featuredProduct.type === ItemType.AUCTION) {
      const productId = featuredProduct.id;
      socket.emit('join:auction', productId);
      return () => {
        socket.emit('leave:auction', productId);
      };
    }
  }, [featuredProduct]);

  // Effect: Handle Stream Simulation (Viewer) OR Camera Access (Host)
  useEffect(() => {
    const peerConnections: { [id: string]: RTCPeerConnection } = {};
    let localStream: MediaStream | null = null;
    const streamId = stream?.id || 'demo-stream';

    if (isHost) {
        const videoEl = videoRef.current;
        const startCamera = async () => {
            setCameraError(false);
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setCameraError(true);
                return;
            }
            try {
                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (videoEl) videoEl.srcObject = localStream;
                
                socket.emit('stream:join', { streamId, isHost: true });
            } catch {
                setCameraError(true);
            }
        };

        if (cameraEnabled) {
             startCamera();
        } else {
            if (videoEl && videoEl.srcObject) {
                const tracks = (videoEl.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
                videoEl.srcObject = null;
            }
        }

        socket.on('viewer:joined', async (viewerId) => {
            if (!localStream) return;
            const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
            peerConnections[viewerId] = pc;

            localStream.getTracks().forEach(track => pc.addTrack(track, localStream!));

            pc.onicecandidate = (e) => {
                if (e.candidate) {
                    socket.emit('stream:ice-candidate', { candidate: e.candidate, to: viewerId });
                }
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('stream:offer', { offer, to: viewerId });
        });

        socket.on('stream:answer', async ({ answer, from }) => {
            const pc = peerConnections[from];
            if (pc) await pc.setRemoteDescription(answer);
        });

        socket.on('stream:ice-candidate', ({ candidate, from }) => {
            const pc = peerConnections[from];
            if (pc) pc.addIceCandidate(candidate);
        });

        return () => {
             Object.values(peerConnections).forEach(pc => pc.close());
             if (videoEl && videoEl.srcObject) {
                const tracks = (videoEl.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
             }
             socket.off('viewer:joined');
             socket.off('stream:answer');
             socket.off('stream:ice-candidate');
        }
    } else if (stream) {
        // Viewer Mode: WebRTC
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        peerConnections['host'] = pc;

        pc.ontrack = (e) => {
            if (videoRef.current) {
                videoRef.current.srcObject = e.streams[0];
            }
        };

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                // We don't know host socket id directly, but the server handles 'to' if we know it.
                // Actually, the host sends the offer, so we get the host's socket id from the offer.
            }
        };

        socket.emit('stream:join', { streamId, isHost: false });

        socket.on('stream:offer', async ({ offer, from }) => {
            await pc.setRemoteDescription(offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('stream:answer', { answer, to: from });
            
            // Now we know the host's socket id, we can send ice candidates
            pc.onicecandidate = (e) => {
                if (e.candidate) {
                    socket.emit('stream:ice-candidate', { candidate: e.candidate, to: from });
                }
            };
        });

        socket.on('stream:ice-candidate', ({ candidate }) => {
            pc.addIceCandidate(candidate);
        });

        // Simulate chat messages
        const interval = setInterval(() => {
            const randomUsers = ['TuanAnh99', 'MaiLan', 'HuyHoang', 'SarahJ', 'AuctionHunter'];
            const randomMsgs = ['Sản phẩm đẹp quá!', 'Shop ơi ship HCM không?', 'Chốt đơn!', 'Giá này hời quá', 'Hàng new hay used vậy?'];
            const user = randomUsers[Math.floor(Math.random() * randomUsers.length)];
            const text = randomMsgs[Math.floor(Math.random() * randomMsgs.length)];
            setMessages(prev => [...prev.slice(-10), { user, text }]);
        }, 2500);

        return () => {
            clearInterval(interval);
            pc.close();
            socket.off('stream:offer');
            socket.off('stream:ice-candidate');
        };
    }
  }, [stream, isHost, cameraEnabled]);

  const handleSendMessage = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { user: isHost ? 'Bạn (Host)' : 'Bạn', text: input }]);
    setInput('');
  };

  const handleAction = (product: Product) => {
      if (product.isAffiliate && product.affiliateLink) {
          window.open(product.affiliateLink, '_blank');
      } else {
          handleOpenCheckout(product);
      }
  };

  const handleOpenCheckout = (product: Product) => {
      setCheckoutProduct(product);
      setOrderSuccess(false);
  };

  const handleConfirmOrder = () => {
      if (!checkoutProduct) return;
      onAddToCart(checkoutProduct);
      setOrderSuccess(true);
      setTimeout(() => {
          setMessages(prev => [...prev, { user: 'Hệ thống', text: `Chúc mừng bạn đã chốt đơn ${checkoutProduct.title}!` }]);
      }, 500);
      setTimeout(() => {
          setCheckoutProduct(null);
          setOrderSuccess(false);
      }, 2000);
  };

  const handleQuickBid = (increment: number) => {
      if (!featuredProduct) return;
      const currentPrice = featuredProduct.currentBid || featuredProduct.price;
      const nextPrice = currentPrice + increment;
      onPlaceBid(featuredProduct, nextPrice);
  };

  const handleSwitchProduct = (direction: 'next' | 'prev') => {
    if (!featuredProduct || currentProducts.length <= 1) return;
    const currentIndex = currentProducts.findIndex(p => p.id === featuredProduct.id);
    const nextIndex = direction === 'next' 
        ? (currentIndex + 1) % currentProducts.length
        : (currentIndex - 1 + currentProducts.length) % currentProducts.length;
    
    setFeaturedProduct(currentProducts[nextIndex]);
  };

  const handleShare = async () => {
    const shareData = {
        title: stream?.title || 'AmazeBid Live Stream',
        text: `Đang xem Live Stream hấp dẫn trên AmazeBid: ${stream?.title}`,
        url: window.location.href
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.log('Error sharing:', err);
        }
    } else {
        // Fallback: Copy to clipboard
        try {
            await navigator.clipboard.writeText(window.location.href);
            setShowShareToast(true);
            setTimeout(() => setShowShareToast(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black text-white flex flex-col md:flex-row h-screen w-screen overflow-hidden">
        
      {/* Main Video Area */}
      <div className="relative flex-1 bg-gray-900 flex items-center justify-center overflow-hidden">
        
        {/* Render Video or Fallback */}
        {isHost ? (
            // HOST VIEW
            cameraError ? (
                <div className="flex flex-col items-center justify-center text-gray-400 p-8 text-center animate-in fade-in bg-gray-900 w-full h-full">
                    <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mb-4 border-2 border-red-600/50 shadow-lg shadow-red-900/20">
                        <VideoOff size={48} className="text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Chế độ Audio / Avatar</h3>
                    <p className="max-w-xs text-sm opacity-80">Chúng tôi không tìm thấy camera hoặc quyền truy cập bị từ chối. Bạn vẫn có thể livestream bằng âm thanh.</p>
                    <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full text-xs font-bold text-green-400">
                         <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> 
                         Microphone đang hoạt động (Giả lập)
                    </div>
                </div>
            ) : (
                <video 
                    ref={videoRef}
                    autoPlay muted playsInline
                    className={`w-full h-full object-cover mirror-mode ${!cameraEnabled ? 'hidden' : ''}`}
                />
            )
        ) : (
            // VIEWER VIEW
             <>
                <img 
                    src={stream?.thumbnail} 
                    className="absolute inset-0 w-full h-full object-cover opacity-60 blur-sm" 
                />
                <video 
                    ref={videoRef}
                    autoPlay playsInline
                    className="relative w-full h-full object-contain max-w-[600px] md:max-w-full"
                />
             </>
        )}

        {/* Overlay Controls (Close, Viewers) */}
        <div className="absolute top-4 left-4 flex items-center gap-3 z-10">
            <button onClick={onClose} className="bg-black/40 backdrop-blur p-2 rounded-full hover:bg-black/60 transition-colors">
                <X size={24} />
            </button>
            <div className="bg-black/40 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="font-bold text-sm">LIVE</span>
                <span className="text-xs border-l border-gray-500 pl-2 ml-1">
                    {isHost ? 'Đang phát' : `${stream?.viewerCount.toLocaleString()} xem`}
                </span>
            </div>
        </div>

        {/* Host Info & Share (Top Right) */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button 
                onClick={handleShare}
                className="bg-black/40 backdrop-blur p-2 rounded-full hover:bg-black/60 transition-colors text-white"
                title="Chia sẻ Live Stream"
            >
                <Share2 size={20} />
            </button>

            <div className="flex items-center gap-2 bg-black/40 backdrop-blur p-1 pr-3 rounded-full">
                <img 
                    src={stream?.hostAvatar || "https://ui-avatars.com/api/?name=You&background=random"} 
                    className="w-8 h-8 rounded-full border border-white" 
                />
                <span className="font-bold text-sm">{stream?.hostName || "Bạn (Host)"}</span>
                {!isHost && <button className="bg-red-600 text-xs px-2 py-1 rounded font-bold hover:bg-red-700">Follow</button>}
            </div>
        </div>
        
        {/* Share Toast Notification */}
        {showShareToast && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-[#131921] text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in zoom-in font-bold text-sm border border-[#febd69]">
                <LinkIcon size={16} className="text-[#febd69]"/> Đã sao chép liên kết chia sẻ!
            </div>
        )}

      </div>

      {/* Right Sidebar */}
      <div className="w-full md:w-[350px] bg-white text-gray-800 flex flex-col h-[50%] md:h-full shrink-0 border-l border-gray-200 absolute bottom-0 md:relative rounded-t-2xl md:rounded-none shadow-2xl z-20">
        
        {/* Host Controls Toolbar */}
        {isHost && (
            <div className="p-2 bg-gray-100 border-b border-gray-200 flex flex-col gap-2 shrink-0">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <button onClick={() => setMicEnabled(!micEnabled)} className={`p-2 rounded hover:bg-white ${!micEnabled ? 'text-red-600 bg-red-50' : ''}`} title="Mic">
                            {micEnabled ? <Mic size={18}/> : <MicOff size={18}/>}
                        </button>
                        <button 
                            onClick={() => {
                                if (cameraError) {
                                    setCameraEnabled(true);
                                    setCameraError(false); 
                                } else {
                                    setCameraEnabled(!cameraEnabled);
                                }
                            }} 
                            className={`p-2 rounded hover:bg-white ${!cameraEnabled || cameraError ? 'text-red-600 bg-red-50' : ''}`} 
                            title="Camera"
                        >
                            {cameraEnabled && !cameraError ? <Camera size={18}/> : <CameraOff size={18}/>}
                        </button>
                    </div>
                    <div className="text-xs font-bold text-gray-500 uppercase">Host Control</div>
                </div>

                {/* Playlist Manager (Host Only) */}
                <div className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                            <Layers size={12}/> DANH SÁCH SP ({currentProducts.length})
                        </span>
                        <div className="flex gap-1">
                            <button onClick={() => handleSwitchProduct('prev')} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={14}/></button>
                            <button onClick={() => handleSwitchProduct('next')} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={14}/></button>
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {currentProducts.map(p => (
                            <div 
                                key={p.id}
                                onClick={() => setFeaturedProduct(p)}
                                className={`relative shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 w-12 h-12 transition-all ${featuredProduct?.id === p.id ? 'border-red-600 ring-1 ring-red-600' : 'border-gray-200 opacity-70 hover:opacity-100'}`}
                            >
                                <img src={p.image} className="w-full h-full object-cover" />
                                {featuredProduct?.id === p.id && (
                                    <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center">
                                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-sm shadow-white"/>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* Featured Product / Auction Dashboard */}
        {featuredProduct ? (
            <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 shrink-0">
                 {/* Product Header */}
                <div className="p-3 flex gap-3 items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-[#febd69] text-black text-[10px] font-bold px-2 py-0.5 rounded-bl">
                        Đang ghim
                    </div>
                    <img src={featuredProduct.image} className="w-16 h-16 rounded bg-white object-cover border border-gray-200" />
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{featuredProduct.title}</h4>
                        {featuredProduct.type === ItemType.AUCTION ? (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[#b12704] font-black text-lg">${featuredProduct.currentBid?.toLocaleString()}</span>
                                <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold animate-pulse">LIVE BID</span>
                            </div>
                        ) : (
                            <p className="text-red-600 font-bold mt-1">${featuredProduct.price}</p>
                        )}
                    </div>
                    {/* Action Button: Buy (Viewer) or Unpin (Host - Mock) */}
                    {featuredProduct.type === ItemType.FIXED_PRICE && !isHost && (
                        <button 
                            onClick={() => handleAction(featuredProduct)}
                            className={`${featuredProduct.isAffiliate ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-[#ffd814] hover:bg-[#f7ca00] text-black'} p-2 rounded-lg`}
                            title={featuredProduct.isAffiliate ? "Mua tại sàn liên kết" : "Thêm vào giỏ"}
                        >
                            {featuredProduct.isAffiliate ? <ExternalLink size={20}/> : <ShoppingBag size={20} />}
                        </button>
                    )}
                </div>

                {/* Auction Control Panel */}
                {featuredProduct.type === ItemType.AUCTION && (
                    <div className="px-3 pb-3">
                        {/* Only viewers can bid */}
                        {!isHost && (
                            <div className="flex gap-2 mb-2">
                                {[10, 20, 50].map(inc => (
                                    <button 
                                        key={inc}
                                        onClick={() => handleQuickBid(inc)}
                                        className="flex-1 bg-white border border-[#febd69] text-black hover:bg-[#febd69] font-bold text-xs py-2 rounded-lg transition-colors shadow-sm flex flex-col items-center"
                                    >
                                        <span>+${inc}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {/* Real-time Bid History List */}
                        <div className="bg-gray-100 rounded-lg p-2 h-24 overflow-y-auto no-scrollbar relative" ref={historyRef}>
                            <div className="text-[10px] font-bold text-gray-400 mb-1 sticky top-0 bg-gray-100 flex justify-between">
                                <span>DIỄN BIẾN ({featuredProduct.bidCount || 0})</span>
                                <span><TrendingUp size={10}/></span>
                            </div>
                            <div className="space-y-1">
                                {featuredProduct.bidHistory && [...featuredProduct.bidHistory].reverse().map((bid, i) => (
                                    <div key={bid.id} className={`flex justify-between text-xs ${i === 0 ? 'font-bold text-black animate-in slide-in-from-left' : 'text-gray-500'}`}>
                                        <div className="flex items-center gap-1">
                                            {i === 0 && <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
                                            <span>{bid.userName === 'Bạn' ? 'Bạn' : bid.userName}</span>
                                        </div>
                                        <span>${bid.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                                {(!featuredProduct.bidHistory || featuredProduct.bidHistory.length === 0) && (
                                    <p className="text-center text-gray-400 text-[10px] py-2">Chưa có lượt đấu giá nào.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        ) : (
            // Empty State if no product pinned
            <div className="p-4 bg-gray-50 border-b border-gray-200 text-center text-gray-400 shrink-0">
                <ShoppingBag size={24} className="mx-auto mb-1 opacity-50"/>
                <p className="text-xs">Chưa có sản phẩm nào được ghim</p>
            </div>
        )}

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-white relative">
             {messages.map((msg, idx) => (
                 <div key={idx} className="text-sm animate-in slide-in-from-bottom-2 fade-in">
                     <span className={`font-bold mr-2 ${msg.user.includes('Host') ? 'text-red-600' : 'text-gray-500'}`}>{msg.user}:</span>
                     <span className="text-gray-800">{msg.text}</span>
                 </div>
             ))}

            {/* Quick Checkout Overlay */}
            {checkoutProduct && (
                <div className="absolute inset-x-0 bottom-0 bg-white border-t border-gray-200 shadow-2xl rounded-t-2xl p-4 animate-in slide-in-from-bottom-full z-30">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <CreditCard size={20} className="text-[#febd69]" /> Thanh toán nhanh
                        </h3>
                        {!orderSuccess && (
                            <button onClick={() => setCheckoutProduct(null)} className="p-1 hover:bg-gray-100 rounded-full">
                                <X size={20} className="text-gray-500" />
                            </button>
                        )}
                    </div>
                    
                    {orderSuccess ? (
                        <div className="flex flex-col items-center justify-center py-6">
                            <CheckCircle2 size={40} className="text-green-600 mb-2" />
                            <p className="font-bold text-green-700">Thành công!</p>
                        </div>
                    ) : (
                         <button 
                            onClick={handleConfirmOrder}
                            className="w-full bg-[#febd69] hover:bg-[#f3a847] text-black font-bold py-3 rounded-xl shadow-md"
                        >
                            Xác nhận mua - ${checkoutProduct.price}
                        </button>
                    )}
                </div>
            )}
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-gray-100 flex items-center gap-2 bg-white pb-6 md:pb-3 shrink-0">
            <div className="bg-gray-100 p-2 rounded-full cursor-pointer hover:bg-gray-200">
                <Heart size={20} className="text-red-500" />
            </div>
            <div className="flex-1 bg-gray-100 rounded-full flex items-center px-3">
                <input 
                    className="flex-1 bg-transparent py-2 text-sm outline-none"
                    placeholder="Bình luận..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={!!checkoutProduct} 
                />
                <button onClick={handleSendMessage} className="text-[#febd69] hover:text-orange-600">
                    <Send size={18} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamViewer;
