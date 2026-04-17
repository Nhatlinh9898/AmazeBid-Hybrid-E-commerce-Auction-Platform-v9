# Hướng dẫn Quản lý P2P Relay (GunDB) - AmazeBid

Tài liệu này hướng dẫn cách bật/tắt và quản lý bộ xử lý P2P (GunDB Relay) trên server AmazeBid để tối ưu hóa hiệu năng và tài nguyên.

## 1. Tại sao cần tạm tắt P2P Relay?
Trong môi trường phát triển (Development) với tài nguyên giới hạn, việc chạy đồng thời cả:
- **Vite Build/Dev Server** (Nặng nhất khi biên dịch giao diện)
- **GunDB Relay Node** (Quản lý mạng lưới Mesh)
- **Socket.io** (Notifications)
- **Edge AI Models** (Transformers.js)

có thể dẫn đến lỗi **Out of Memory (OOM)**. Việc tạm tắt P2P Relay giúp ưu tiên tài nguyên cho việc hiển thị và chỉnh sửa giao diện.

## 2. Cách bật lại P2P Relay đúng cách

Để kích hoạt lại mạng lưới P2P, bạn cần thực hiện 2 bước sau:

### Bước 1: Mở khóa mã nguồn trong `server.ts`
1. Tìm đến file `/server.ts`.
2. Tìm khối lệnh ở cuối hàm `startServer()`.
3. Bỏ comment (`/*` và `*/`) để code trở thành như sau:

```typescript
// server.ts
// ...
    // Initialize P2P Relay Node after server starts
    try {
      console.log('[Server] Initializing P2P Relay Node...');
      p2p.initServer(server); // Kích hoạt Relay
      console.log('[Server] P2P Relay Node initialized');
    } catch (err: any) {
      console.error('[Server] P2P Initialization failed:', err.message);
    }
// ...
```

### Bước 2: Đảm bảo biến môi trường chính xác
Để mạng lưới P2P hoạt động, trình duyệt (Client) cần biết server đang chạy ở đâu. Hãy kiểm tra file `.env`:

```env
# .env
VITE_APP_URL=https://ais-dev-...run.app
```
*Lưu ý: Không thêm dấu `/` ở cuối URL.*

## 3. Các lưu ý quan trọng (Lỗi 137)

Nếu sau khi bật lại P2P, ứng dụng gặp lỗi **"Please wait while your application starts..."** kéo dài hoặc console log báo **"Killed" (exit status 137)**:

1. **Nguyên nhân:** Server hết RAM khi đang Build.
2. **Cách xử lý:** 
   - Tắt tạm P2P Relay (comment lại code ở Bước 1).
   - Đợi ứng dụng Build xong và hiển thị giao diện thành công.
   - Bật lại P2P Relay.
   - Khi này Server sẽ Restart và nạp code đã Build sẵn, giúp giảm tải RAM.

## 4. Kiểm tra trạng thái
Khi P2P Relay hoạt động đúng, bạn sẽ thấy dòng log sau trong terminal:
`[P2P] Initializing GunDB... (Server)`
`AXE relay enabled!`
`[P2P] GunDB Server instance created`
