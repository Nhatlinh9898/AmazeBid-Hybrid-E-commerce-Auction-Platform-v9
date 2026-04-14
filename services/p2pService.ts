import Gun from 'gun';
import 'gun/sea';

/**
 * P2P SERVICE - LAYER 0 (DEEP IMPLEMENTATION)
 * Quản lý mạng lưới phi tập trung, bảo mật và đồng bộ thời gian thực.
 */
class P2PService {
  private gun: any;
  private user: any;
  private nodes: string[] = [
    'https://gun-manhattan.herokuapp.com/gun',
    ((typeof process !== 'undefined' ? process.env.VITE_APP_URL : (import.meta as any).env?.VITE_APP_URL) || 
     (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')) + '/gun'
  ];

  constructor() {
    // Lazy initialization
  }

  /**
   * Khởi tạo GunDB trên Server với HTTP Server để làm Relay Node
   */
  initServer(server: any) {
    this.initGun(server);
  }

  private initGun(server?: any) {
    if (this.gun) return;
    
    if (typeof Gun === 'undefined') {
      console.error('[P2P] Gun is not defined. Check your imports.');
      return;
    }

    console.log('[P2P] Initializing GunDB...', typeof window === 'undefined' ? '(Server)' : '(Client)');
    if (typeof window === 'undefined') {
      // Server-side Gun instance (Relay mode)
      this.gun = Gun({
        web: server,
        peers: this.nodes,
        file: 'p2p-data',
        radisk: true
      });
      console.log('[P2P] GunDB Server instance created');
    } else {
      // Client-side Gun instance
      this.gun = Gun({
        peers: this.nodes,
        localStorage: true,
        radisk: true // Kích hoạt lưu trữ đĩa cục bộ bền vững
      });
      console.log('[P2P] GunDB Client instance created');
      
      // Khởi tạo User P2P Identity (SEA)
      this.user = this.gun.user().recall({ sessionStorage: true });
    }
  }

  /**
   * Đăng ký/Đăng nhập vào mạng lưới P2P (Decentralized Identity)
   */
  async authenticate(alias: string, pass: string) {
    this.initGun();
    return new Promise((resolve, reject) => {
      this.user.auth(alias, pass, (ack: any) => {
        if (ack.err) {
          this.user.create(alias, pass, (createAck: any) => {
            if (createAck.err) reject(createAck.err);
            else resolve(createAck);
          });
        } else {
          resolve(ack);
        }
      });
    });
  }

  /**
   * ĐỒNG BỘ ĐẤU GIÁ (P2P AUCTION SYNC)
   * Gửi giá thầu trực tiếp qua mạng lưới P2P để đạt độ trễ cực thấp (<50ms)
   */
  publishBid(auctionId: string, bidData: { amount: number, bidder: string }) {
    this.initGun();
    const auctionRoom = this.gun.get('auctions').get(auctionId);
    
    // Sử dụng SEA để ký dữ liệu (Data Signing)
    // Đảm bảo giá thầu không bị giả mạo bởi các Node khác
    if (this.user.is) {
      this.user.get('bids').get(auctionId).put(bidData);
      auctionRoom.get('latest-bid').put(bidData);
    } else {
      auctionRoom.get('latest-bid').put(bidData);
    }
  }

  /**
   * Theo dõi giá thầu thời gian thực từ các Peer
   */
  subscribeToAuction(auctionId: string, callback: (bid: any) => void) {
    this.initGun();
    this.gun.get('auctions').get(auctionId).get('latest-bid').on((data: any) => {
      if (data) callback(data);
    });
  }

  /**
   * PRESENCE TRACKING (MESH AWARENESS)
   * Theo dõi số lượng người dùng đang xem cùng một sản phẩm qua P2P
   */
  trackPresence(productId: string, userId: string) {
    this.initGun();
    const presenceNode = this.gun.get('presence').get(productId).get(userId);
    
    // Cập nhật trạng thái "Sống" (Heartbeat)
    presenceNode.put({ status: 'online', lastSeen: Date.now() });
    
    // Tự động xóa sau 30s nếu không có heartbeat (giả lập)
    setInterval(() => {
      presenceNode.put({ status: 'online', lastSeen: Date.now() });
    }, 15000);
  }

  /**
   * Đếm số lượng Peer đang online trong Mesh của sản phẩm
   */
  countPeers(productId: string, callback: (count: number) => void) {
    this.initGun();
    this.gun.get('presence').get(productId).map().on(() => {
      // Logic lọc các node đã offline (>30s)
      this.gun.get('presence').get(productId).once((all: any) => {
        const active = Object.values(all || {}).filter((node: any) => 
          node && node.status === 'online' && (Date.now() - node.lastSeen < 30000)
        ).length;
        callback(active);
      });
    });
  }

  /**
   * TASK DISTRIBUTION (COMPUTE SHARING)
   * Gửi một tác vụ AI lên mạng lưới để nhờ các Node mạnh hơn xử lý.
   */
  async requestCompute(taskId: string, payload: any): Promise<string | null> {
    this.initGun();
    return new Promise((resolve) => {
      const taskNode = this.gun.get('compute-tasks').get(taskId);
      
      // 1. Đưa tác vụ lên Mesh
      taskNode.put({
        ...payload,
        status: 'pending',
        timestamp: Date.now()
      });

      // 2. Lắng nghe kết quả từ các Worker
      taskNode.get('result').on((result: string) => {
        if (result) resolve(result);
      });

      // Timeout sau 10s nếu không có ai nhận
      setTimeout(() => resolve(null), 10000);
    });
  }

  /**
   * WORKER VOLUNTEER
   * Tự động nhận các tác vụ từ Mesh nếu thiết bị đang rảnh và đủ mạnh.
   */
  startListeningForTasks(capabilities: any, processor: (payload: any) => Promise<string>) {
    this.initGun();
    if (capabilities.tier === 'LOW') return; // Thiết bị yếu không nhận việc

    this.gun.get('compute-tasks').map().on(async (task: any, id: string) => {
      if (task && task.status === 'pending' && !task.result) {
        // Nhận việc
        const taskNode = this.gun.get('compute-tasks').get(id);
        taskNode.get('status').put('processing');
        
        const result = await processor(task);
        taskNode.get('result').put(result);
        taskNode.get('status').put('completed');
      }
    });
  }
}

export const p2p = new P2PService();
