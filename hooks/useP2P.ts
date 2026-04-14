import { useState, useEffect } from 'react';
import { p2p } from '../services/p2pService';

/**
 * HOOK: useP2P
 * Cung cấp các tính năng P2P Mesh nâng cao cho React Components.
 */
export const useP2P = (productId?: string) => {
  const [peerCount, setPeerCount] = useState(0);
  const [latestBid, setLatestBid] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!productId) return;

    // 1. Theo dõi số lượng Peer trong Mesh
    p2p.countPeers(productId, (count) => {
      setPeerCount(count);
    });

    // 2. Theo dõi giá thầu thời gian thực (P2P Auction)
    p2p.subscribeToAuction(productId, (bid) => {
      setLatestBid(bid);
    });

    // 3. Đánh dấu sự hiện diện (Presence)
    const userId = `user-${Math.random().toString(36).substr(2, 9)}`;
    p2p.trackPresence(productId, userId);
    
    // Tránh gọi setState đồng bộ trong effect
    setTimeout(() => setIsOnline(true), 0);

    return () => {
      // Cleanup nếu cần
    };
  }, [productId]);

  /**
   * Gửi giá thầu qua P2P Mesh
   */
  const placeP2PBid = (amount: number, bidder: string) => {
    if (!productId) return;
    p2p.publishBid(productId, { amount, bidder });
  };

  return {
    peerCount,
    latestBid,
    isOnline,
    placeP2PBid
  };
};
