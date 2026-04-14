---
name: amazebid-core
description: 
  Chuyên gia toàn diện về hệ thống AmazeBid. Sử dụng khi người dùng yêu cầu giải thích kiến trúc, 
  vận hành đấu giá, bảo trì P2P Mesh, hoặc cấu hình AI cho dự án này.
---

# AmazeBid Full-Stack Expertise

Chuyên gia toàn diện về hệ thống thương mại điện tử Hybrid AmazeBid (E-commerce, Auction, P2P, AI).

## Overview
Skill này cung cấp kiến thức và quy trình vận hành cho toàn bộ hệ thống AmazeBid, từ giao diện người dùng đến hạ tầng mạng lưới phi tập trung và trí tuệ nhân tạo.

## 1. Frontend Architecture (React & Tailwind)
- **Styling**: Sử dụng Tailwind CSS với các Recipe thiết kế đã định nghĩa (Dashboard, Editorial, Hardware).
- **Animations**: Sử dụng `motion/react` cho các hiệu ứng chuyển cảnh và tương tác mượt mà.
- **Components**: Các component reusable nằm trong `src/components/`. Luôn ưu tiên sử dụng `lucide-react` cho icon.
- **State Management**: Sử dụng React Context (`AuthContext`) và local state cho các UI phức tạp.

## 2. Backend & Data Layer (Express & db.json)
- **Server**: Express server chạy tại `server.ts`, tích hợp Vite middleware.
- **Database**: Sử dụng `db.json` (thông qua `src/db.ts`) để lưu trữ bền vững các sản phẩm, đơn hàng, và người dùng.
- **API Standards**: Mọi API phải trả về định dạng chuẩn thông qua hàm `sendResponse`.
- **Rate Limiting**: Áp dụng `limiter` cho API chung và `aiLimiter` cho các tác vụ AI.

## 3. Real-time & P2P Mesh (Socket.io & GunDB)
- **Socket.io**: Dùng cho các thông báo hệ thống, cập nhật giỏ hàng và chat trực tiếp.
- **GunDB (P2P)**: 
    - Đồng bộ giá thầu đấu giá với độ trễ cực thấp.
    - Theo dõi sự hiện diện (Presence) của người dùng.
    - Phân phối tác vụ tính toán (Compute Sharing).
- **Relay Node**: Server hoạt động như một Relay Node thông qua `p2p.initServer(httpServer)`.

## 4. AI Ecosystem (Cloud & Edge)
- **Cloud AI (Gemini)**: Xử lý các tác vụ nặng (tạo hình ảnh, video, phân tích dữ liệu lớn).
- **Edge AI (Transformers.js)**: Xử lý các tác vụ nhẹ trực tiếp trên trình duyệt người dùng (viết lại mô tả, tóm tắt nhanh).
- **AI Worker**: Người dùng có thể đóng góp tài nguyên thông qua `AIWorkerManager` để nhận AmazeCredits.
- **Canonicalization**: Mọi phản hồi AI phải đi qua `AICanonicalizer` để đảm bảo tính ổn định của dữ liệu.

## 5. Payment & Escrow Flow
- **Stripe**: Tích hợp tại `src/components/CheckoutForm.tsx` và API `/api/create-payment-intent`.
- **Escrow (SafePay)**: 
    - Tiền được hệ thống giữ khi đơn hàng ở trạng thái `PENDING_SHIPMENT`.
    - Tiền chỉ chuyển cho người bán khi trạng thái là `COMPLETED`.
- **Wallet**: Quản lý số dư và phí hệ thống (System Fee) tại `src/services/pricingService.ts`.

## 6. Configuration & DevOps
- **Environment**: Mọi cấu hình (AI Models, Domain, API Keys) phải nằm trong `.env`.
- **Domain**: Sử dụng `VITE_APP_URL` để định danh ứng dụng trong mạng lưới P2P và OAuth.

## Procedural Workflows

### Quy trình thêm một tính năng Đấu giá mới:
1. Cập nhật `ItemType` trong `src/types.ts`.
2. Thiết lập logic Socket.io trong `server.ts` để broadcast giá thầu.
3. Tích hợp `p2p.publishBid` để đồng bộ hóa nhanh.
4. Cập nhật UI trong `ProductCard` và `LiveStreamViewer`.

### Quy trình xử lý sự cố P2P:
1. Kiểm tra `VITE_APP_URL` trong `.env`.
2. Chạy script kiểm tra hệ thống: `node .agents/skills/amazebid-core/scripts/sys-check.js`.
3. Xác nhận Server đã khởi tạo GunDB Relay.
3. Kiểm tra Console log để xem các Peer có đang kết nối thành công hay không.
