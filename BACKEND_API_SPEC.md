# Đặc Tả Kiến Trúc & API Hệ Thống AmazeBid (Chi Tiết)

Tài liệu này cung cấp cái nhìn toàn diện về kiến trúc hệ thống, sơ đồ dữ liệu và các quy trình nghiệp vụ quan trọng để xây dựng một Backend hoàn chỉnh tương thích 100% với AmazeBid.

---

## 1. Kiến Trúc Hệ Thống (System Architecture)

Hệ thống được thiết kế theo mô hình **Hybrid Cloud-Edge AI** kết hợp với kiến trúc **Event-Driven** cho các tính năng thời gian thực.

### 1.1. Sơ đồ Tổng quát
```text
[ Người dùng ] <---> [ Frontend (React + Vite) ]
                           |
                           | (HTTP/REST & WebSockets)
                           v
              [ Backend API Gateway (Express.js) ]
               /           |           \
              /            |            \
     [ Auth Service ] [ Business Logic ] [ Real-time Engine ]
     (Firebase/JWT)   (Orders, Bids)     (Socket.io)
            |              |                |
            v              v                v
     [ Database ]    [ AI Services ]   [ Email/SMS ]
     (MongoDB/Postgre) (Gemini SDK)    (Resend/Twilio)
```

### 1.2. Các Thành phần Chính
- **Frontend:** ReactJS, TailwindCSS, Lucide Icons, Motion (Framer Motion).
- **Backend:** Node.js + Express.js.
- **Real-time:** Socket.io để xử lý cập nhật giá thầu và trạng thái livestream.
- **AI Engine:** Tích hợp trực tiếp Google Gemini (Flash & Pro) cho đàm phán giá, tạo nội dung và phân tích gian lận.
- **Database:** Khuyến nghị MongoDB (NoSQL) cho tính linh hoạt hoặc PostgreSQL (SQL) cho tính nhất quán cao.

---

## 2. Sơ Đồ Dữ Liệu Chi Tiết (Database Schema)

Dựa trên `types.ts`, dưới đây là các thực thể chính cần được triển khai trong Database.

### 2.1. Người dùng (Users)
| Trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | UUID / ObjectId | Khóa chính |
| `fullName` | String | Tên đầy đủ |
| `email` | String (Unique) | Email đăng nhập |
| `password` | String (Hashed) | Mật khẩu (Bcrypt) |
| `role` | Enum | `USER`, `ADMIN` |
| `balance` | Number | Số dư ví sàn |
| `tier` | Enum | `BRONZE`, `SILVER`, `GOLD`, `DIAMOND` |
| `points` | Number | Điểm thưởng tích lũy |
| `socialAccounts` | Array<Object> | Liên kết FB, Google, v.v. |

### 2.2. Sản phẩm (Products)
| Trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | UUID / ObjectId | Khóa chính |
| `title` | String | Tên sản phẩm |
| `type` | Enum | `FIXED_PRICE` (Bán thẳng), `AUCTION` (Đấu giá) |
| `price` | Number | Giá niêm yết / Giá khởi điểm |
| `currentBid` | Number | Giá thầu cao nhất hiện tại |
| `bidHistory` | Array<Bid> | Lịch sử các lượt đặt giá |
| `endTime` | DateTime | Thời gian kết thúc (cho Đấu giá) |
| `status` | Enum | `AVAILABLE`, `SHIPPED`, `COMPLETED`, v.v. |
| `isAffiliate` | Boolean | Có phải sản phẩm tiếp thị liên kết không |
| `minNegotiationPrice`| Number | Giá tối thiểu AI có thể chấp nhận khi đàm phán |

### 2.3. Đơn hàng (Orders)
| Trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | UUID / ObjectId | Khóa chính |
| `userId` | UUID | ID người mua |
| `items` | Array<CartItem> | Danh sách sản phẩm và số lượng |
| `totalAmount` | Number | Tổng giá trị đơn hàng |
| `status` | Enum | Trạng thái đơn hàng (theo `OrderStatus`) |
| `shippingInfo` | Object | Thông tin vận chuyển & Tracking |

---

## 3. Quy Trình Nghiệp Vụ Quan Trọng (Core Workflows)

### 3.1. Quy trình Đấu giá Thời gian thực (Real-time Bidding)
1. **Client:** Gửi sự kiện `join_product_room` qua Socket khi vào trang chi tiết.
2. **Client:** Gọi API `POST /api/bids` để đặt giá.
3. **Server:** 
   - Kiểm tra: `amount > currentBid` và `time < endTime`.
   - Lưu vào DB.
   - Phát sự kiện `bid:updated` qua Socket tới toàn bộ người trong room.
4. **Client:** Nhận sự kiện và cập nhật UI (giá mới, hiệu ứng pháo hoa).

### 3.2. Quy trình Đàm phán Giá với AI (AI Negotiation)
1. **Client:** Gửi mức giá đề nghị của người dùng qua `api.ai.negotiate`.
2. **Server/AI:** 
   - Lấy `minNegotiationPrice` của sản phẩm.
   - Gemini AI phân tích lịch sử chat và mức giá.
   - Trả về kết quả: `ACCEPTED` (Chấp nhận), `COUNTER` (Đề nghị giá khác), hoặc `REJECTED` (Từ chối).
3. **Client:** Hiển thị tin nhắn từ trợ lý ảo và cập nhật giá trong giỏ hàng nếu được chấp nhận.

### 3.3. Quy trình Kiểm duyệt Sản phẩm (Admin Verification)
1. **Seller:** Đăng sản phẩm, trạng thái mặc định là `PENDING_VERIFICATION`.
2. **Admin:** Xem danh sách tại `/api/admin/pending-products`.
3. **Admin:** Gọi `POST /api/admin/verify-product` để duyệt.
4. **Server:** Cập nhật trạng thái thành `AVAILABLE` và thông báo cho Seller.

---

## 4. Đặc Tả API Chi Tiết (Chi tiết hơn)

### 4.1. Header & Authentication
Tất cả các yêu cầu (trừ Login/Register) phải kèm theo:
- `Content-Type: application/json`
- `Authorization: Bearer <JWT_TOKEN>`

### 4.2. Cấu trúc Lỗi (Error Handling)
Khi có lỗi, Backend trả về mã HTTP tương ứng (400, 401, 403, 500) và body:
```json
{
  "status": "error",
  "action": "ACTION_NAME",
  "data": {
    "message": "Mô tả lỗi chi tiết bằng tiếng Việt",
    "code": "ERROR_CODE"
  }
}
```

---

## 5. Hướng Dẫn Triển Khai Kỹ Thuật

### 5.1. Biến môi trường (Environment Variables)
Cần cấu hình các biến sau ở Backend:
- `PORT`: 3000 (Mặc định)
- `DATABASE_URL`: Chuỗi kết nối DB.
- `JWT_SECRET`: Khóa bí mật ký Token.
- `GEMINI_API_KEY`: Khóa API của Google AI.
- `RESEND_API_KEY`: Khóa gửi Email (nếu dùng tính năng thông báo).

### 5.2. Socket.io Events
- **Listen (Server nhận):**
  - `join_product_room`: `(productId: string)`
  - `bid:place`: `(bidData: Bid)`
- **Emit (Server gửi):**
  - `bid:updated`: `(bidData: Bid)`
  - `order:status_changed`: `(orderData: Order)`

---

## 6. Các Tính Năng Đặc Biệt & Tác Vụ Nền (Special Features & Background Tasks)

Đội ngũ Backend cần lưu ý triển khai các logic đặc thù sau để đảm bảo hệ thống vận hành đúng thiết kế:

### 6.1. Hệ Thống Tự Động Kết Thúc Đấu Giá (Auction Auto-Closer)
- **Yêu cầu:** Cần một tác vụ nền (Cron Job hoặc Queue) chạy định kỳ (ví dụ: mỗi 1 phút).
- **Logic:** Tìm các sản phẩm có `type: 'AUCTION'`, `status: 'AVAILABLE'` và `endTime <= CurrentTime`.
- **Hành động:** 
  - Chuyển trạng thái sản phẩm sang `PENDING_PAYMENT`.
  - Tạo đơn hàng (`Order`) tự động cho người đặt giá cao nhất (`currentBid`).
  - Gửi thông báo (Email/Push) cho người thắng cuộc và người bán.

### 6.2. Công Cụ Đàm Phán Giá AI (AI Sales Agent)
- **Yêu cầu:** Tích hợp Gemini AI để đóng vai trò người bán.
- **Logic:** Backend phải giữ bí mật trường `minNegotiationPrice`. Khi người dùng trả giá, AI sẽ so sánh mức giá này với giá người dùng đưa ra để quyết định chốt đơn hoặc mặc cả thêm.
- **Bảo mật:** Tuyệt đối không trả về `minNegotiationPrice` trong các API công khai.

### 6.3. Hệ Thống Ký Quỹ (Escrow System)
- **Yêu cầu:** Xử lý luồng tiền an toàn.
- **Logic:** 
  - Khi người mua thanh toán, tiền sẽ được giữ ở trạng thái `PAID_ESCROW` (trong ví hệ thống).
  - Tiền chỉ được cộng vào ví người bán (`balance`) khi người mua xác nhận `DELIVERED` hoặc sau X ngày không có khiếu nại.
  - Phí sàn (`systemFeeRate`) sẽ được khấu trừ tự động trong bước này.

### 6.4. Công Cụ Phát Hiện Gian Lận (AI Fraud Detection)
- **Yêu cầu:** Kiểm tra các hành vi bất thường.
- **Logic:** 
  - Phát hiện "Shill Bidding" (người bán dùng tài khoản phụ để đẩy giá).
  - Kiểm tra địa chỉ IP và vân tay trình duyệt để phát hiện đa tài khoản.
  - Đánh dấu sản phẩm/đơn hàng là `isFraudulent: true` để Admin kiểm duyệt lại.

### 6.5. Gamification & Loyalty Engine
- **Yêu cầu:** Cập nhật điểm thưởng (`points`) và cấp bậc (`tier`) theo thời gian thực.
- **Logic:** 
  - Mỗi hành động (Đặt thầu, Mua hàng, Xem livestream) sẽ kích hoạt cộng điểm.
  - Khi đạt ngưỡng điểm, tự động nâng `tier` (Bronze -> Silver -> Gold -> Diamond) để người dùng hưởng ưu đãi phí sàn thấp hơn hoặc voucher đặc biệt.

### 6.6. Xử Lý Tác Vụ AI Dài Hạn (Async AI Tasks)
- **Yêu cầu:** Xử lý tạo Video/Ảnh quảng cáo (có thể mất 30s - 2 phút).
- **Logic:** Sử dụng kiến trúc **Job Queue** (như BullMQ). 
  - Client gửi yêu cầu -> Backend trả về `jobId`.
  - Backend xử lý ngầm qua Gemini -> Khi xong cập nhật trạng thái Job.
  - Client dùng cơ chế Polling hoặc Socket để nhận kết quả cuối cùng.

### 6.7. Quản Lý Livestream & Tương Tác Thời Gian Thực
- **Yêu cầu:** Quản lý trạng thái luồng trực tiếp và sản phẩm đang được ghim.
- **Logic:** 
  - Backend cần lưu trữ danh sách sản phẩm đang được giới thiệu trong mỗi Livestream.
  - Khi Host thay đổi sản phẩm đang ghim, Backend phải broadcast sự kiện `stream:product_featured` tới tất cả người xem để cập nhật UI ngay lập tức.
  - Đếm số lượng người xem thực tế (`viewerCount`) dựa trên các kết nối Socket đang hoạt động trong phòng stream.

### 6.8. Hệ Thống Khóa Kho & Xử Lý Tranh Chấp (Inventory Locking)
- **Yêu cầu:** Tránh tình trạng bán quá số lượng (Overselling) cho sản phẩm giá cố định.
- **Logic:** 
  - Khi người dùng nhấn "Thanh toán", Backend nên tạm giữ (Lock) số lượng sản phẩm trong X phút.
  - Nếu thanh toán không thành công hoặc hết hạn, tự động hoàn trả số lượng vào kho.
  - Sử dụng Redis hoặc Database Locks để xử lý các yêu cầu đồng thời (Race Conditions).

### 6.9. Công Cụ Đề Xuất Cá Nhân Hóa (AI Recommendation Engine)
- **Yêu cầu:** Gợi ý sản phẩm dựa trên hành vi người dùng.
- **Logic:** 
  - Backend thu thập dữ liệu: sản phẩm đã xem, sản phẩm đã đấu giá, danh mục quan tâm.
  - Định kỳ (hoặc Real-time) sử dụng Gemini AI để phân tích và trả về danh sách `recommendedProductIds` cho mỗi người dùng.

### 6.10. Thông Báo Đẩy & Cảnh Báo Giá (Push Notification Engine)
- **Yêu cầu:** Gửi cảnh báo ngay lập tức khi người dùng bị vượt giá (Outbid).
- **Logic:** 
  - Khi có một lượt đặt giá mới, Backend kiểm tra người đặt giá cao thứ hai.
  - Gửi thông báo đẩy (Web Push/Firebase Cloud Messaging) cho người đó với nội dung: "Bạn đã bị vượt giá! Hãy đặt giá mới để giữ sản phẩm."

### 6.11. Bản Địa Hóa & Dịch Thuật AI (AI Localization)
- **Yêu cầu:** Hỗ trợ đa ngôn ngữ cho mô tả sản phẩm và chat.
- **Logic:** 
  - Khi người bán đăng sản phẩm bằng một ngôn ngữ, Backend có thể sử dụng Gemini để tự động tạo bản dịch cho các ngôn ngữ mục tiêu khác.
  - Hỗ trợ dịch thời gian thực trong khung chat livestream để kết nối người mua và người bán toàn cầu.

### 6.12. Hệ Thống Định Giá Động AI (AI Dynamic Pricing)
- **Yêu cầu:** Tự động điều chỉnh giá dựa trên thị trường và tồn kho.
- **Logic:** 
  - Backend định kỳ phân tích tốc độ bán hàng (`sold` vs `stock`) và giá đối thủ.
  - Sử dụng Gemini AI để đề xuất giá bán tối ưu nhằm đạt điểm hòa vốn (`breakEvenQuantity`) nhanh nhất hoặc tối đa hóa lợi nhuận.
  - Cập nhật trường `price` và thông báo cho người bán về sự thay đổi.

### 6.13. Quản Lý Avatar Ảo & Livestream AI (Virtual Avatar Engine)
- **Yêu cầu:** Lưu trữ và cấu hình các nhân vật ảo phục vụ livestream tự động.
- **Logic:** 
  - Quản lý `AvatarConfig` (giọng nói, phong cách), `AvatarOutfit` (trang phục) và `AvatarEnvironment` (bối cảnh).
  - Backend cần xử lý việc kết hợp các lớp hình ảnh/video này để tạo ra luồng livestream mượt mà khi Host là AI.

### 6.14. Hệ Thống Tiếp Thị Liên Kết & KOL (Affiliate & KOL Tracking)
- **Yêu cầu:** Theo dõi nguồn đơn hàng và tính toán hoa hồng.
- **Logic:** 
  - Khi đơn hàng được tạo với `affiliateId`, Backend phải ghi nhận doanh thu cho KOL tương ứng.
  - Tự động tính toán hoa hồng (`commissionRate`) và cộng vào ví của KOL sau khi đơn hàng hoàn tất.
  - Cung cấp Dashboard thống kê hiệu quả cho KOL (số click, số đơn, doanh thu).

### 6.15. Tính Toán Phí Vận Chuyển Thông Minh (Smart Shipping Calculation)
- **Yêu cầu:** Tính phí ship dựa trên kích thước, khối lượng và vị trí.
- **Logic:** 
  - Sử dụng dữ liệu từ `packagingInfo` (dài, rộng, cao, cân nặng) để gọi API của các đơn vị vận chuyển (GHTK, GHN, Viettel Post).
  - Backend cần lưu trữ tọa độ (`latitude`, `longitude`) của kho người bán và địa chỉ người mua để tính toán quãng đường và phí chính xác.

### 6.16. Tìm Kiếm Ngữ Nghĩa AI (AI Semantic Search)
- **Yêu cầu:** Tìm kiếm sản phẩm theo ý nghĩa thay vì chỉ từ khóa.
- **Logic:** 
  - Backend sử dụng Gemini Embedding Model để chuyển đổi mô tả sản phẩm thành các vector số.
  - Khi người dùng tìm kiếm "đồ đi tiệc sang trọng", Backend thực hiện so sánh vector để tìm ra các sản phẩm phù hợp nhất dù tiêu đề không chứa từ khóa đó.

### 6.17. Hệ Thống Đánh Giá Tín Nhiệm (User Reputation System)
- **Yêu cầu:** Tính toán điểm uy tín cho người mua và người bán.
- **Logic:** 
  - Điểm `reputation` (0-100) được tính dựa trên: tỷ lệ hoàn hàng, lịch sử thanh toán, đánh giá từ người dùng khác, và các hành vi gian lận bị phát hiện.
  - Người có điểm thấp sẽ bị hạn chế tham gia các phiên đấu giá giá trị cao hoặc bị tăng mức ký quỹ.

### 6.18. Lưu Trữ & Xem Lại Livestream (VOD - Video On Demand)
- **Yêu cầu:** Cho phép người dùng xem lại các phiên livestream đã kết thúc.
- **Logic:** 
  - Backend cần xử lý việc ghi lại luồng video và lưu trữ vào Cloud Storage (S3/GCS).
  - Lưu trữ lịch sử chat và các sản phẩm đã ghim theo mốc thời gian (timestamps) để khi xem lại, người dùng vẫn thấy được các tương tác như lúc trực tiếp.

### 6.19. Kiểm Duyệt Nội Dung Tự Động (AI Content Moderation)
- **Yêu cầu:** Tự động quét nội dung vi phạm chính sách (hình ảnh nhạy cảm, từ ngữ thô tục).
- **Logic:** 
  - Mọi hình ảnh, video và văn bản (mô tả sản phẩm, bài đăng cộng đồng) khi tải lên phải đi qua lớp kiểm duyệt AI.
  - Sử dụng Gemini Vision để phân tích hình ảnh và Gemini Pro để phân tích văn bản.
  - Tự động ẩn nội dung vi phạm và gửi cảnh báo cho người dùng hoặc chuyển cho Admin xem xét.

### 6.20. Hệ Thống Chat P2P & Hỗ Trợ Khách Hàng AI (AI Customer Support)
- **Yêu cầu:** Chat trực tiếp giữa người mua - người bán và hỗ trợ tự động.
- **Logic:** 
  - Sử dụng WebSockets để truyền tin nhắn thời gian thực.
  - Tích hợp AI Chatbot để trả lời các câu hỏi thường gặp (FAQ) khi người bán không online.
  - Hỗ trợ dịch tin nhắn tức thời nếu hai bên sử dụng ngôn ngữ khác nhau.

### 6.21. Phân Tích Dữ Liệu & Báo Cáo Cho Người Bán (Seller Analytics)
- **Yêu cầu:** Cung cấp thông tin chi tiết về hiệu quả kinh doanh.
- **Logic:** 
  - Backend tổng hợp dữ liệu: lượt xem sản phẩm, tỷ lệ chuyển đổi, doanh thu theo thời gian, nguồn khách hàng (trực tiếp hay affiliate).
  - Sử dụng AI để đưa ra các nhận xét thông minh: "Sản phẩm A đang có lượt xem cao nhưng tỷ lệ mua thấp, bạn nên cân nhắc giảm giá hoặc cải thiện hình ảnh."

### 6.22. Hệ Thống Giới Thiệu & Thưởng (Referral & Rewards System)
- **Yêu cầu:** Khuyến khích người dùng mời bạn bè tham gia.
- **Logic:** 
  - Quản lý mã giới thiệu (`referralCode`). Khi người dùng mới đăng ký qua mã này, cả người mời và người được mời đều nhận được điểm thưởng hoặc voucher.
  - Theo dõi chuỗi giới thiệu để tính toán các phần thưởng theo cấp bậc (Multi-tier referral).

### 6.23. Quản Lý Đa Tiền Tệ & Tỷ Giá (Multi-currency & Exchange Rates)
- **Yêu cầu:** Hỗ trợ người dùng quốc tế thanh toán bằng nhiều loại tiền tệ.
- **Logic:** 
  - Backend cập nhật tỷ giá hối đoái hàng ngày từ các nguồn uy tín.
  - Tự động quy đổi giá sản phẩm sang tiền tệ địa phương của người dùng dựa trên vị trí địa lý hoặc cài đặt cá nhân.

### 6.24. Đồng Bộ Kho Online-Offline (Omnichannel Inventory Sync)
- **Yêu cầu:** Đồng bộ tồn kho cho các cửa hàng có cả điểm bán vật lý.
- **Logic:** 
  - Cung cấp API để các hệ thống POS (Point of Sale) tại cửa hàng có thể cập nhật số lượng tồn kho lên AmazeBid.
  - Đảm bảo khi một mặt hàng được bán tại cửa hàng, số lượng trên sàn đấu giá cũng giảm đi tương ứng để tránh bán quá số lượng.

### 6.25. Hệ Thống Đăng Ký Thành Viên Cao Cấp (Subscription & Membership)
- **Yêu cầu:** Cung cấp các gói tính năng đặc quyền cho người bán và người mua.
- **Logic:** 
  - Quản lý các gói thành viên (ví dụ: Gói Pro cho người bán với phí sàn thấp hơn, ghim sản phẩm ưu tiên).
  - Xử lý thanh toán định kỳ và tự động gia hạn gói dịch vụ.

### 6.26. Chống Đặt Giá Phút Chót (Auction Snipe Protection)
- **Yêu cầu:** Ngăn chặn việc người dùng chờ đến giây cuối cùng để đặt giá khiến người khác không kịp phản ứng.
- **Logic:** 
  - Nếu có một lượt đặt giá hợp lệ trong vòng 30-60 giây cuối cùng của phiên đấu giá, Backend tự động gia hạn `endTime` thêm 1-2 phút.
  - Quá trình này lặp lại cho đến khi không còn ai đặt giá thêm trong khoảng thời gian gia hạn.
  - Broadcast thời gian kết thúc mới tới tất cả người dùng qua Socket.

### 6.27. Tìm Kiếm Bằng Hình Ảnh AI (AI Visual Search)
- **Yêu cầu:** Cho phép người dùng tải ảnh lên để tìm các sản phẩm tương tự.
- **Logic:** 
  - Backend nhận file ảnh, sử dụng Gemini Vision hoặc mô tả ảnh thành vector để so sánh với cơ sở dữ liệu sản phẩm.
  - Trả về danh sách các sản phẩm có đặc điểm hình ảnh tương đồng nhất.

### 6.28. Hệ Thống Webhooks Cho Bên Thứ Ba (Third-party Webhooks)
- **Yêu cầu:** Cho phép các ứng dụng bên ngoài tích hợp và nhận thông báo từ AmazeBid.
- **Logic:** 
  - Cung cấp giao diện cho người dùng (đặc biệt là các đối tác doanh nghiệp) đăng ký URL Webhook.
  - Backend gửi POST request tới các URL này khi có sự kiện xảy ra (ví dụ: `order.created`, `bid.won`, `payout.completed`).
  - Hỗ trợ cơ chế retry và ký chữ ký số (HMAC) để đảm bảo an toàn dữ liệu.

### 6.29. Quản Lý Biến Thể Sản Phẩm (Product Variants & SKUs)
- **Yêu cầu:** Hỗ trợ các sản phẩm có nhiều thuộc tính (màu sắc, kích cỡ, phiên bản).
- **Logic:** 
  - Backend cần quản lý cấu trúc dữ liệu phức tạp hơn cho `Product`, bao gồm danh sách các `Variants`.
  - Mỗi biến thể có thể có giá (`price`), tồn kho (`stock`) và hình ảnh riêng biệt.
  - Đảm bảo việc trừ kho và khóa kho (Inventory Locking) hoạt động chính xác ở cấp độ SKU (Stock Keeping Unit).

### 6.30. Tự Động Tính Thuế & Phí Theo Khu Vực (Automated Tax & Regional Fees)
- **Yêu cầu:** Tính toán chính xác các loại thuế (VAT, thuế nhập khẩu) và phí vùng sâu vùng xa.
- **Logic:** 
  - Backend dựa vào địa chỉ người mua và người bán để xác định các quy định thuế hiện hành.
  - Tự động cộng thêm các khoản phí này vào `totalAmount` của đơn hàng.
  - Hỗ trợ xuất hóa đơn điện tử (E-invoice) tự động sau khi giao dịch hoàn tất.

### 6.31. Phân Tích Cảm Xúc Đánh Giá Bằng AI (AI Sentiment Analysis)
- **Yêu cầu:** Tự động phân tích thái độ của khách hàng qua các bài đánh giá (Reviews).
- **Logic:** 
  - Sử dụng Gemini AI để phân loại đánh giá là Tích cực, Tiêu cực hoặc Trung lập.
  - Tự động gắn thẻ (Tags) cho các vấn đề thường gặp (ví dụ: "Giao hàng chậm", "Chất lượng tốt").
  - Cung cấp báo cáo tổng hợp cho người bán để họ cải thiện dịch vụ.

### 6.32. Cảnh Báo Tồn Kho Thời Gian Thực (Real-time Inventory Alerts)
- **Yêu cầu:** Thông báo ngay cho người bán khi hàng sắp hết.
- **Logic:** 
  - Người bán có thể thiết lập `lowStockThreshold` cho từng sản phẩm.
  - Khi `stock` giảm xuống dưới ngưỡng này, Backend tự động gửi thông báo (Email/Push) để người bán kịp thời nhập hàng.

### 6.33. Quản Lý Đa Kho Hàng (Multi-warehouse Management)
- **Yêu cầu:** Hỗ trợ người bán có nhiều kho hàng ở các vị trí khác nhau.
- **Logic:** 
  - Backend cần quản lý danh sách `Warehouses` cho mỗi người bán.
  - Khi có đơn hàng, hệ thống tự động chọn kho gần người mua nhất để tối ưu phí vận chuyển và thời gian giao hàng.

### 6.34. Quy Trình Hoàn Tiền & Giải Quyết Tranh Chấp Tự Động (Automated Refund & Dispute)
- **Yêu cầu:** Xử lý các yêu cầu trả hàng/hoàn tiền một cách minh bạch.
- **Logic:** 
  - Cung cấp quy trình từng bước: Yêu cầu -> Bằng chứng (Ảnh/Video) -> Người bán phản hồi -> Admin quyết định (nếu tranh chấp).
  - Tự động hoàn tiền vào ví người mua (`balance`) sau khi yêu cầu được chấp nhận và hàng đã được trả về kho.

### 6.35. Dịch Thuật Chat AI Thời Gian Thực (AI Chat Translation)
- **Yêu cầu:** Phá bỏ rào cản ngôn ngữ giữa người mua và người bán quốc tế.
- **Logic:** 
  - Tích hợp Gemini AI trực tiếp vào luồng Socket tin nhắn.
  - Tự động phát hiện ngôn ngữ và hiển thị bản dịch ngay dưới tin nhắn gốc nếu ngôn ngữ của hai bên khác nhau.

### 6.36. Tích Hợp Đăng Nhập Mạng Xã Hội Nâng Cao (Advanced OAuth)
- **Yêu cầu:** Hỗ trợ đa dạng các phương thức đăng nhập (Apple ID, TikTok, Zalo).
- **Logic:** 
  - Backend xử lý các luồng OAuth2 phức tạp, đảm bảo đồng bộ hóa thông tin người dùng (`email`, `avatar`, `fullName`) từ các nền tảng khác nhau về một tài khoản duy nhất trên AmazeBid.

### 6.37. Lưu Trữ Dữ Liệu Lịch Sử & Cold Storage (Data Archiving)
- **Yêu cầu:** Tối ưu hóa hiệu suất database bằng cách di chuyển dữ liệu cũ.
- **Logic:** 
  - Các đơn hàng hoặc lượt đấu giá đã kết thúc hơn 1 năm sẽ được di chuyển từ Database chính sang Cold Storage (như BigQuery hoặc S3).
  - Đảm bảo người dùng vẫn có thể yêu cầu xem lại lịch sử khi cần thiết nhưng không làm chậm các truy vấn hàng ngày.

### 6.38. Giới Hạn Tốc Độ API & Chống Tấn Công DDoS (Rate Limiting)
- **Yêu cầu:** Bảo vệ hệ thống khỏi các yêu cầu spam hoặc tấn công từ chối dịch vụ.
- **Logic:** 
  - Triển khai Middleware giới hạn số lượng yêu cầu trên mỗi IP/User trong một khoảng thời gian (ví dụ: tối đa 100 requests/phút).
  - Sử dụng Redis để lưu trữ và kiểm tra quota truy cập theo thời gian thực.

### 6.39. Nhật Ký Hoạt Động & Kiểm Toán (Audit Trail)
- **Yêu cầu:** Ghi lại mọi thay đổi quan trọng của hệ thống để phục vụ bảo mật và kiểm tra.
- **Logic:** 
  - Ghi lại nhật ký (Logs) cho các hành động: thay đổi giá, duyệt đơn hàng, rút tiền, thay đổi quyền admin.
  - Mỗi bản ghi bao gồm: `userId`, `action`, `oldValue`, `newValue`, `ipAddress`, `timestamp`.

### 6.40. Tự Động Hóa Tiếp Thị Cá Nhân Hóa (AI Marketing Automation)
- **Yêu cầu:** Gửi các chiến dịch marketing mục tiêu dựa trên hành vi người dùng.
- **Logic:** 
  - Backend phân tích các sản phẩm người dùng đã thêm vào giỏ hàng nhưng chưa mua.
  - Sau X giờ, Gemini AI tự động soạn và gửi một email/thông báo kèm mã giảm giá đặc biệt để thúc đẩy người dùng hoàn tất đơn hàng.

### 6.41. Tự Động Nâng Cấp Hình Ảnh & Xóa Phông AI (AI Image Enhancement)
- **Yêu cầu:** Cải thiện chất lượng hình ảnh sản phẩm do người bán tải lên.
- **Logic:** 
  - Sử dụng Gemini Vision hoặc các mô hình AI chuyên dụng để tự động làm nét, điều chỉnh ánh sáng và xóa phông nền cho ảnh sản phẩm.
  - Giúp các sản phẩm trông chuyên nghiệp hơn, từ đó tăng tỷ lệ chuyển đổi đơn hàng.

### 6.42. Đóng Dấu Bản Quyền Hình Ảnh Động (Dynamic Watermarking)
- **Yêu cầu:** Bảo vệ bản quyền hình ảnh cho người bán.
- **Logic:** 
  - Backend tự động chèn logo AmazeBid hoặc tên người bán vào hình ảnh sản phẩm khi hiển thị.
  - Watermark được tạo động để tránh việc người khác tải ảnh về và sử dụng trái phép trên các nền tảng khác.

### 6.43. Phân Tích Đấu Giá Thời Gian Thực Cho Người Bán (Seller Live Analytics)
- **Yêu cầu:** Cung cấp bảng điều khiển trực quan cho người bán trong phiên đấu giá.
- **Logic:** 
  - Hiển thị biểu đồ thời gian thực về số lượng người xem, số lượt đặt giá, và phân bổ vị trí địa lý của những người đang quan tâm.
  - Giúp người bán đưa ra các quyết định kịp thời như gia hạn thêm thời gian hoặc tung ra voucher khuyến khích.

### 6.44. Hệ Thống Thẻ Quà Tặng & Điểm Tín Dụng (Gift Cards & Credits)
- **Yêu cầu:** Quản lý các loại thẻ quà tặng và số dư tín dụng nội bộ.
- **Logic:** 
  - Backend xử lý việc tạo mã thẻ quà tặng với mệnh giá cụ thể.
  - Khi người dùng nạp mã, số tiền được cộng vào `balance` hoặc một loại ví `credits` riêng biệt dùng để thanh toán đơn hàng.

### 6.45. Phụ Đề Livestream Tự Động Bằng AI (AI Live Captioning)
- **Yêu cầu:** Tạo phụ đề thời gian thực cho các phiên livestream.
- **Logic:** 
  - Sử dụng công nghệ Speech-to-Text của Gemini để chuyển đổi giọng nói của Host thành văn bản.
  - Broadcast phụ đề qua Socket để hiển thị ngay trên màn hình người xem, hỗ trợ tốt cho người khiếm thính hoặc người xem trong môi trường ồn ào.

### 6.46. Nhận Diện Mẫu Đấu Giá Bất Thường (Fraudulent Bid Pattern Recognition)
- **Yêu cầu:** Sử dụng Machine Learning để phát hiện các hành vi đặt giá ảo tinh vi.
- **Logic:** 
  - Backend phân tích lịch sử đặt giá để tìm ra các mẫu (patterns) bất thường, ví dụ: hai tài khoản liên tục nâng giá cho nhau nhưng không bao giờ thanh toán.
  - Tự động gắn cờ (Flag) hoặc tạm khóa các tài khoản nghi vấn để Admin kiểm tra.

### 6.47. Hệ Thống Thưởng Chia Sẻ Mạng Xã Hội (Social Sharing Rewards)
- **Yêu cầu:** Khuyến khích người dùng chia sẻ sản phẩm lên Facebook, TikTok, v.v.
- **Logic:** 
  - Backend cung cấp các link chia sẻ có chứa ID người dùng.
  - Khi có người click vào link hoặc mua hàng từ link đó, người chia sẻ sẽ nhận được điểm thưởng (`points`) hoặc hoa hồng nhỏ.

### 6.48. Tìm Kiếm Nâng Cao Với Bộ Lọc Động (Faceted Search)
- **Yêu cầu:** Cho phép lọc sản phẩm theo hàng chục tiêu chí khác nhau một cách nhanh chóng.
- **Logic:** 
  - Sử dụng Elasticsearch hoặc Algolia để đánh chỉ mục (Indexing) dữ liệu sản phẩm.
  - Hỗ trợ lọc theo: khoảng giá, danh mục, thương hiệu, đánh giá, vị trí kho, thời gian kết thúc đấu giá, v.v. với tốc độ phản hồi dưới 100ms.

### 6.49. Hệ Thống Quản Lý Tranh Chấp & Khiếu Nại (Dispute Management System)
- **Yêu cầu:** Cung cấp giao diện cho Admin xử lý các mâu thuẫn giữa người mua và người bán.
- **Logic:** 
  - Lưu trữ toàn bộ bằng chứng: lịch sử chat, ảnh sản phẩm lúc gửi, ảnh sản phẩm lúc nhận.
  - Cho phép Admin đưa ra phán quyết: Hoàn tiền toàn bộ, Hoàn tiền một phần, hoặc Từ chối khiếu nại.

### 6.50. Bảng Điều Khiển Giám Sát Sức Khỏe Hệ Thống (System Health Monitoring)
- **Yêu cầu:** Công cụ nội bộ cho đội ngũ Backend theo dõi trạng thái server.
- **Logic:** 
  - Theo dõi thời gian phản hồi API, tỷ lệ lỗi (Error Rate), tải CPU/RAM, và trạng thái kết nối Database/Socket.
  - Tự động gửi cảnh báo qua Telegram/Slack cho đội ngũ kỹ thuật khi có sự cố xảy ra.

### 6.51. Thử Đồ Ảo Bằng AI (AI Virtual Try-On)
- **Yêu cầu:** Hỗ trợ người dùng "mặc thử" quần áo hoặc phụ kiện qua camera.
- **Logic:** 
  - Backend cung cấp API để xử lý hình ảnh người dùng và hình ảnh sản phẩm, sử dụng các mô hình AI (Generative AI) để ghép sản phẩm lên người một cách chân thực.
  - Lưu trữ các `TryOnSession` để người dùng có thể chia sẻ kết quả thử đồ với bạn bè.

### 6.52. Chứng Chỉ Xác Thực Trên Blockchain (Blockchain Authenticity Certificate)
- **Yêu cầu:** Đảm bảo tính nguyên bản cho các sản phẩm giá trị cao (đồ cổ, hàng hiệu).
- **Logic:** 
  - Khi một sản phẩm được xác thực bởi chuyên gia, Backend sẽ tạo một bản ghi (NFT hoặc Metadata) trên Blockchain.
  - Cung cấp mã QR trên sản phẩm để người mua có thể quét và kiểm tra lịch sử sở hữu cũng như tính xác thực không thể bị làm giả.

### 6.53. Hệ Thống Quảng Cáo Động Thông Minh (AI Dynamic Ad Engine)
- **Yêu cầu:** Hiển thị quảng cáo sản phẩm phù hợp nhất trong ứng dụng.
- **Logic:** 
  - Backend phân tích ngữ cảnh (ví dụ: người dùng đang xem livestream về đồng hồ) để tự động chèn các banner quảng cáo hoặc sản phẩm liên quan.
  - Tối ưu hóa chi phí quảng cáo (CPC/CPM) cho người bán dựa trên tỷ lệ click thực tế.

### 6.54. Điều Khiển Bằng Giọng Nói & Trợ Lý Ảo (Voice-Controlled Bidding)
- **Yêu cầu:** Cho phép người dùng đặt giá hoặc tìm kiếm bằng giọng nói.
- **Logic:** 
  - Tích hợp công nghệ Speech-to-Intent để hiểu các lệnh như: "Đặt giá 1 triệu cho sản phẩm này" hoặc "Tìm cho tôi túi xách màu đỏ".
  - Hỗ trợ tính năng rảnh tay, đặc biệt hữu ích khi người dùng đang làm việc khác nhưng vẫn muốn theo dõi đấu giá.

### 6.55. Tự Động Tạo Nội Dung Mạng Xã Hội (AI Social Content Generator)
- **Yêu cầu:** Tự động tạo video ngắn (TikTok/Reels) từ dữ liệu sản phẩm.
- **Logic:** 
  - Backend sử dụng Gemini để viết kịch bản, sau đó kết hợp hình ảnh sản phẩm, nhạc nền và giọng đọc AI để tạo ra các video quảng cáo ngắn.
  - Người bán có thể tải về hoặc đăng trực tiếp lên các nền tảng mạng xã hội chỉ với một cú click.

### 6.56. Dự Báo Nhu Cầu & Tái Nhập Hàng (Predictive Inventory Restocking)
- **Yêu cầu:** AI dự đoán khi nào sản phẩm sẽ hết hàng dựa trên xu hướng mua sắm.
- **Logic:** 
  - Phân tích dữ liệu lịch sử bán hàng và các yếu tố mùa vụ.
  - Gửi cảnh báo: "Dựa trên tốc độ bán hiện tại, bạn sẽ hết hàng trong 3 ngày tới. Hãy nhập thêm 50 đơn vị để không bị gián đoạn kinh doanh."

### 6.57. Hỗ Trợ Đa Nền Tảng White-label (Multi-tenant White-label Support)
- **Yêu cầu:** Cho phép các thương hiệu lớn tổ chức phiên đấu giá riêng trên hạ tầng AmazeBid.
- **Logic:** 
  - Backend hỗ trợ cấu hình giao diện (Logo, màu sắc) và tên miền riêng cho từng đối tác doanh nghiệp.
  - Quản lý dữ liệu người dùng và sản phẩm tách biệt cho từng "tenant" nhưng vẫn chạy trên cùng một lõi hệ thống.

### 6.58. Phân Tích Tâm Lý Người Đấu Giá (Bidder Sentiment Analysis)
- **Yêu cầu:** Phân tích khung chat trong livestream để dự đoán mức độ quan tâm.
- **Logic:** 
  - AI quét các từ khóa trong chat như "đẹp quá", "giá cao thế", "chốt đơn".
  - Đưa ra chỉ số `HypeScore` để người bán biết được phiên đấu giá đang nóng hay lạnh và điều chỉnh chiến thuật bán hàng.

### 6.59. Xác Thực Danh Tính & Chống Rửa Tiền Tự Động (AI KYC/AML)
- **Yêu cầu:** Đảm bảo an toàn cho các giao dịch giá trị cực lớn.
- **Logic:** 
  - Tự động kiểm tra giấy tờ tùy thân (CCCD/Passport) qua AI.
  - Theo dõi các luồng tiền bất thường để ngăn chặn hành vi rửa tiền qua hình thức đấu giá ảo.

### 6.60. Đồng Bộ Dữ Liệu Ngoại Tuyến (Offline-First Sync)
- **Yêu cầu:** Đảm bảo trải nghiệm mượt mà ngay cả khi kết nối mạng yếu.
- **Logic:** 
  - Sử dụng Service Workers và IndexedDB ở client để lưu trữ dữ liệu tạm thời.
  - Backend hỗ trợ cơ chế đồng bộ hóa thông minh (Conflict Resolution) khi client kết nối lại sau khi mất mạng, đảm bảo các lượt đặt giá không bị mất.

### 6.61. Tóm Tắt Livestream Tự Động Bằng AI (AI Video Summarization)
- **Yêu cầu:** Tạo các đoạn video ngắn (Highlights) từ các phiên livestream dài.
- **Logic:** 
  - Backend sử dụng AI để phân tích các khoảnh khắc có tương tác cao (nhiều chat, nhiều lượt đặt giá).
  - Tự động cắt và ghép thành các đoạn video ngắn tóm tắt các sản phẩm đã bán và các tình huống hấp dẫn để người dùng xem nhanh.

### 6.62. Lồng Tiếng Đa Ngôn Ngữ Thời Gian Thực (AI Live Dubbing)
- **Yêu cầu:** Tự động dịch và lồng tiếng cho livestream sang ngôn ngữ khác.
- **Logic:** 
  - Sử dụng công nghệ Speech-to-Speech của Gemini để dịch giọng nói của Host và phát lại bằng giọng đọc AI theo thời gian thực.
  - Cho phép người xem quốc tế nghe livestream bằng ngôn ngữ mẹ đẻ của họ.

### 6.63. Hiển Thị Sản Phẩm 3D & Thực Tế Ảo Tăng Cường (AR Product Visualization)
- **Yêu cầu:** Cho phép người dùng xem sản phẩm 3D trong không gian thực của họ.
- **Logic:** 
  - Backend quản lý các tệp mô hình 3D (`.glb`, `.usdz`) cho sản phẩm.
  - Cung cấp API để client tải và hiển thị sản phẩm qua AR, giúp người mua hình dung kích thước và kiểu dáng thực tế trước khi đặt thầu.

### 6.64. Ký Quỹ Bằng Hợp Đồng Thông Minh (Smart Contract Escrow)
- **Yêu cầu:** Tăng cường tính minh bạch và bảo mật cho các giao dịch lớn.
- **Logic:** 
  - Tích hợp với các nền tảng Blockchain để tạo hợp đồng thông minh tự động khóa tiền khi giao dịch bắt đầu.
  - Tiền chỉ được giải ngân cho người bán khi các điều kiện trong hợp đồng (xác nhận giao hàng) được đáp ứng hoàn toàn.

### 6.65. Tối Ưu Hóa Chuỗi Cung Ứng Bằng AI (AI Supply Chain Optimization)
- **Yêu cầu:** Gợi ý các phương án vận chuyển và lưu kho tối ưu cho người bán lớn.
- **Logic:** 
  - Phân tích dữ liệu vận chuyển toàn cầu để gợi ý các đơn vị vận chuyển có giá tốt nhất và thời gian nhanh nhất cho từng tuyến đường cụ thể.
  - Dự báo các rủi ro chậm trễ do thời tiết hoặc sự cố để người bán chủ động điều chỉnh.

### 6.66. Phát Hiện Hình Ảnh Sản Phẩm Sao Chép (Fraudulent Image Detection)
- **Yêu cầu:** Ngăn chặn người bán sử dụng ảnh lấy từ mạng hoặc của người khác.
- **Logic:** 
  - Khi ảnh được tải lên, Backend thực hiện tìm kiếm hình ảnh ngược (Reverse Image Search) để kiểm tra xem ảnh đó có xuất hiện ở đâu khác không.
  - Yêu cầu người bán cung cấp ảnh thực tế (có chứa mã xác nhận của sàn) nếu phát hiện ảnh có dấu hiệu sao chép.

### 6.67. Trợ Lý Mua Sắm AI Chủ Động (Proactive AI Shopping Assistant)
- **Yêu cầu:** AI tự động tìm kiếm và thông báo cho người dùng về các sản phẩm họ đang cần.
- **Logic:** 
  - Người dùng có thể thiết lập "Wishlist thông minh" (ví dụ: "Tìm cho tôi đồng hồ Rolex dưới 200 triệu").
  - Backend liên tục quét các sản phẩm mới và các phiên đấu giá sắp diễn ra để gửi thông báo ngay khi tìm thấy sản phẩm phù hợp.

### 6.68. Cơ Chế Đấu Giá Game Hóa (Gamified Auction Mechanics)
- **Yêu cầu:** Tạo ra các hình thức đấu giá mới lạ để tăng tương tác.
- **Logic:** 
  - Triển khai các loại hình: Đấu giá mù (Blind Bid), Đấu giá ngược (Dutch Auction), Đấu giá theo nhóm (Team Bidding).
  - Backend cần xử lý các logic tính toán giá và thời gian đặc thù cho từng loại hình này.

### 6.69. Theo Dõi Dấu Chân Carbon (Carbon Footprint Tracking)
- **Yêu cầu:** Khuyến khích mua sắm bền vững.
- **Logic:** 
  - Backend tính toán lượng khí thải CO2 ước tính cho mỗi đơn hàng dựa trên quãng đường và phương thức vận chuyển.
  - Cung cấp tùy chọn cho người dùng đóng góp một khoản phí nhỏ để bù đắp carbon (Carbon Offset) qua các dự án môi trường đối tác.

### 6.70. Kiểm Tra Tuân Thủ Pháp Lý Tự Động (Automated Legal Compliance)
- **Yêu cầu:** Đảm bảo sản phẩm đăng bán tuân thủ pháp luật của từng quốc gia.
- **Logic:** 
  - AI quét danh mục sản phẩm và mô tả để phát hiện các mặt hàng cấm (vũ khí, động vật quý hiếm, hàng giả).
  - Tự động áp dụng các quy định về thuế và hạn chế vận chuyển dựa trên luật pháp của quốc gia người mua và người bán.

### 6.71. Cá Nhân Hóa Giao Diện Bằng AI (AI-Powered Dynamic Content)
- **Yêu cầu:** Tự động thay đổi bố cục và nội dung trang chủ cho từng người dùng.
- **Logic:** 
  - Backend phân tích phân khúc người dùng (Sở thích, độ tuổi, lịch sử mua hàng).
  - Trả về cấu trúc JSON động để Frontend hiển thị các khối nội dung (Banners, Danh mục, Sản phẩm) được cá nhân hóa hoàn toàn nhằm tăng tỷ lệ click (CTR).

### 6.72. Dự Báo Tải Hệ Thống Cho Sự Kiện Lớn (Predictive Server Scaling)
- **Yêu cầu:** Tự động chuẩn bị tài nguyên server cho các phiên đấu giá của KOL lớn.
- **Logic:** 
  - Backend phân tích lịch trình livestream và số lượng người đăng ký nhận thông báo.
  - Sử dụng AI để dự báo lưu lượng truy cập và tự động kích hoạt mở rộng server (Auto-scaling) trước khi sự kiện bắt đầu để tránh tình trạng nghẽn mạng.

### 6.73. Tích Hợp Danh Tính Phi Tập Trung (Decentralized Identity - DID)
- **Yêu cầu:** Hỗ trợ đăng nhập và xác thực qua ví Web3 (MetaMask, Phantom).
- **Logic:** 
  - Cho phép người dùng liên kết địa chỉ ví Blockchain với tài khoản AmazeBid.
  - Sử dụng chữ ký số để xác thực danh tính mà không cần lưu trữ mật khẩu truyền thống, tăng cường tính bảo mật và quyền riêng tư.

### 6.74. Dự Báo Giá Trị Vòng Đời Khách Hàng (AI Customer Lifetime Value Prediction)
- **Yêu cầu:** Xác định các khách hàng tiềm năng có giá trị cao.
- **Logic:** 
  - Phân tích hành vi chi tiêu và tần suất tương tác.
  - AI phân loại người dùng thành các nhóm: "Trung thành", "Tiềm năng", "Có nguy cơ rời bỏ" để hệ thống tự động đưa ra các kịch bản chăm sóc khách hàng phù hợp.

### 6.75. Bằng Chứng Không Tiết Lộ Cho Đấu Giá Kín (Zero-Knowledge Proofs for Private Bidding)
- **Yêu cầu:** Cho phép người dùng chứng minh mình có đủ tiền đặt thầu mà không cần tiết lộ số dư thực tế.
- **Logic:** 
  - Sử dụng giao thức ZKP để xác thực khả năng thanh toán của người dùng trong các phiên đấu giá kín (Blind Bidding).
  - Đảm bảo tính công bằng và bảo mật thông tin tài chính tuyệt đối cho các đại gia hoặc tổ chức lớn.

### 6.76. Tối Ưu Hóa Chất Lượng Video Thích Ứng (AI-Driven Adaptive Bitrate)
- **Yêu cầu:** Đảm bảo livestream mượt mà trên mọi điều kiện mạng.
- **Logic:** 
  - Backend xử lý chuyển mã (Transcoding) video thành nhiều độ phân giải khác nhau theo thời gian thực.
  - Sử dụng AI để dự đoán băng thông của người xem và tự động chuyển đổi luồng video phù hợp nhất, giảm thiểu tình trạng giật lag.

### 6.77. Điều Phối Tồn Kho Thông Minh Giữa Các Kho (Smart Inventory Redistribution)
- **Yêu cầu:** Tự động gợi ý chuyển hàng giữa các kho dựa trên nhu cầu vùng miền.
- **Logic:** 
  - AI phân tích xu hướng mua sắm tại từng khu vực địa lý.
  - Đưa ra khuyến nghị cho người bán: "Nhu cầu tại miền Nam đang tăng cao, hãy chuyển 30% tồn kho từ kho miền Bắc vào kho miền Nam để giảm phí ship và thời gian giao hàng."

### 6.78. Xác Thực Bằng Chứng Xã Hội Tự Động (Automated Social Proof)
- **Yêu cầu:** Hiển thị các thông báo tương tác thực tế để tạo sự tin tưởng.
- **Logic:** 
  - Hiển thị thông báo: "X người đang xem sản phẩm này", "Y người đã thêm vào giỏ hàng".
  - Backend phải đảm bảo các con số này là thực tế (không phải số ảo) và được cập nhật liên tục qua Socket để tránh gây hiểu lầm cho người tiêu dùng.

### 6.79. Dự Báo Tỷ Lệ Hoàn Hàng (AI-Driven Return Propensity Scoring)
- **Yêu cầu:** Cảnh báo người bán về các đơn hàng có nguy cơ bị hoàn trả cao.
- **Logic:** 
  - Phân tích lịch sử của người mua, loại sản phẩm và các yếu tố giao hàng.
  - Gắn điểm rủi ro cho đơn hàng. Nếu điểm quá cao, hệ thống gợi ý người bán nên gọi điện xác nhận kỹ hơn hoặc yêu cầu thanh toán trước.

### 6.80. Hệ Thống Quản Lý Quyền Riêng Tư & Xóa Dữ Liệu (GDPR/CCPA Compliance)
- **Yêu cầu:** Cho phép người dùng kiểm soát và yêu cầu xóa dữ liệu cá nhân.
- **Logic:** 
  - Cung cấp công cụ tự động để người dùng tải về toàn bộ dữ liệu cá nhân hoặc yêu cầu "được lãng quên" (xóa vĩnh viễn tài khoản và dữ liệu liên quan).
  - Backend xử lý việc xóa sạch dữ liệu trên tất cả các lớp (Database, Logs, Backups) theo đúng quy định pháp luật quốc tế.

### 6.81. Giảm Giá Động Dựa Trên Ý Định (AI-Powered Intent-Based Discounts)
- **Yêu cầu:** Tự động tung ra các ưu đãi chớp nhoáng khi người dùng có dấu hiệu sắp rời đi hoặc đang phân vân.
- **Logic:** 
  - Backend theo dõi hành vi thời gian thực: thời gian dừng lại trên trang, số lần di chuyển chuột ra khỏi vùng nội dung.
  - Sử dụng AI để dự đoán xác suất chuyển đổi. Nếu người dùng đang phân vân, hệ thống tự động tạo và gửi một mã giảm giá "chỉ dành cho bạn" có hiệu lực trong 15-30 phút.

### 6.82. Đấu Giá Nhóm & Góp Vốn (Collaborative Bidding & Crowdfunding)
- **Yêu cầu:** Cho phép nhiều người dùng cùng góp tiền để đấu giá một sản phẩm giá trị cao.
- **Logic:** 
  - Backend quản lý các "Bidding Pools". Người dùng có thể mời bạn bè cùng tham gia góp vốn.
  - Nếu thắng đấu giá, sản phẩm sẽ thuộc sở hữu chung hoặc được xử lý theo thỏa thuận trước đó của nhóm.
  - Xử lý việc hoàn tiền tự động cho tất cả thành viên nếu đấu giá thất bại.

### 6.83. Phòng Trưng Bày Ảo & VR (Virtual Showrooms & VR Integration)
- **Yêu cầu:** Trải nghiệm mua sắm trong không gian 3D/VR.
- **Logic:** 
  - Backend cung cấp dữ liệu không gian (Spatial Data) để dựng các phòng trưng bày ảo.
  - Đồng bộ hóa vị trí và tương tác của người dùng trong không gian ảo qua Socket để nhiều người có thể cùng xem sản phẩm và trò chuyện với nhau như trong thực tế.

### 6.84. Giải Quyết Tranh Chấp Phi Tập Trung (Decentralized Dispute Resolution)
- **Yêu cầu:** Sử dụng cộng đồng để phân xử các tranh chấp nhỏ.
- **Logic:** 
  - Triển khai cơ chế "Bồi thẩm đoàn" từ những người dùng có điểm uy tín cao.
  - Backend gửi bằng chứng ẩn danh cho các bồi thẩm đoàn để họ bỏ phiếu.
  - Hệ thống tự động thực hiện phán quyết dựa trên đa số phiếu bầu, giúp giảm tải cho đội ngũ Admin và tăng tính khách quan.

### 6.85. Nhân Bản Giọng Nói Người Bán Bằng AI (AI Voice Cloning for Sellers)
- **Yêu cầu:** Tự động tạo âm thanh giới thiệu sản phẩm bằng chính giọng nói của người bán.
- **Logic:** 
  - Người bán cung cấp một đoạn mẫu giọng nói ngắn.
  - Backend sử dụng Gemini TTS để chuyển đổi mô tả sản phẩm thành âm thanh giới thiệu với tông giọng và cảm xúc tương tự người bán, giúp tiết kiệm thời gian quay video/livestream.

### 6.86. Phân Tích Giá Sàn Thời Gian Thực (Real-time Price Floor Analysis)
- **Yêu cầu:** Cung cấp thông tin giá thị trường cho các mặt hàng xa xỉ và đồ sưu tầm.
- **Logic:** 
  - Backend liên tục thu thập dữ liệu giá từ các sàn đấu giá quốc tế (Sotheby's, Christie's, eBay).
  - Cung cấp biểu đồ xu hướng giá và định giá ước tính cho sản phẩm để người mua và người bán có cơ sở đưa ra mức giá phù hợp.

### 6.87. Tùy Chọn Vận Chuyển Trung Hòa Carbon (Carbon Neutral Shipping Integration)
- **Yêu cầu:** Tích hợp với các tổ chức bảo vệ môi trường để bù đắp khí thải.
- **Logic:** 
  - Khi thanh toán, người dùng có thể chọn "Vận chuyển xanh".
  - Backend tính toán phí bù đắp carbon và tự động chuyển khoản tiền này tới các dự án trồng rừng hoặc năng lượng tái tạo đối tác.
  - Cấp chứng chỉ "Người mua sắm xanh" cho người dùng.

### 6.88. Nhạc Nền Livestream Tự Động Bằng AI (AI-Generated Live Background Music)
- **Yêu cầu:** Tạo nhạc nền phù hợp với không khí của phiên livestream.
- **Logic:** 
  - AI phân tích nhịp điệu nói của Host và cảm xúc của khung chat.
  - Tự động tạo và phát nhạc nền (Lo-fi, sôi động, kịch tính) theo thời gian thực để tăng trải nghiệm xem.

### 6.89. Tự Động Kết Nối KOL & Sản Phẩm (AI-Driven Influencer Matching)
- **Yêu cầu:** Gợi ý người bán những KOL phù hợp nhất để quảng bá sản phẩm.
- **Logic:** 
  - Backend phân tích tệp người theo dõi của KOL và danh mục sản phẩm của người bán.
  - Sử dụng AI để tính toán điểm tương đồng (Match Score) và tự động gửi lời mời hợp tác nếu cả hai bên có thiết lập chế độ "Tìm kiếm đối tác".

### 6.90. Livestream Đa Nền Tảng (Multi-platform Restreaming)
- **Yêu cầu:** Phát livestream đồng thời lên Facebook, YouTube, TikTok từ AmazeBid.
- **Logic:** 
  - Backend xử lý việc phân phối luồng video (RTMP/HLS) tới các máy chủ của bên thứ ba.
  - Đồng bộ hóa khung chat từ tất cả các nền tảng về một giao diện duy nhất cho người bán dễ dàng quản lý và tương tác.

### 6.91. Tự Động Tạo Mô Tả Sản Phẩm Từ Video (AI Video-to-Description)
- **Yêu cầu:** Trích xuất thông tin từ video giới thiệu để viết mô tả văn bản.
- **Logic:** 
  - Backend sử dụng Gemini Multimodal để phân tích nội dung video (hình ảnh và lời nói).
  - Tự động liệt kê các đặc điểm kỹ thuật, tình trạng và ưu điểm của sản phẩm vào phần mô tả, giúp người bán tiết kiệm thời gian nhập liệu.

### 6.92. Cảnh Báo Tốc Độ Đặt Giá (Real-time Bid Velocity Alerts)
- **Yêu cầu:** Thông báo khi một sản phẩm đang trở nên "hot".
- **Logic:** 
  - Backend theo dõi tần suất đặt giá trong một khoảng thời gian ngắn.
  - Nếu tốc độ vượt ngưỡng, hệ thống tự động gắn nhãn "Trending" hoặc "Hot Auction" và đẩy lên vị trí ưu tiên trên trang chủ để thu hút thêm người tham gia.

### 6.93. Tự Động Lập Lịch Flash Sale Thông Minh (AI-Driven Flash Sale Scheduling)
- **Yêu cầu:** AI chọn thời điểm vàng để tổ chức các phiên giảm giá chớp nhoáng.
- **Logic:** 
  - Phân tích dữ liệu lịch sử về thời gian người dùng hoạt động tích cực nhất và có tỷ lệ mua hàng cao nhất.
  - Tự động đề xuất hoặc kích hoạt các phiên Flash Sale vào những khung giờ tối ưu này để tối đa hóa doanh số.

### 6.94. Phát Hiện Hàng Giả Qua Hình Ảnh AI (AI Counterfeit Detection)
- **Yêu cầu:** So sánh ảnh sản phẩm với dữ liệu hàng chính hãng để cảnh báo rủi ro.
- **Logic:** 
  - Backend sử dụng AI để so sánh các chi tiết nhỏ (logo, đường chỉ, tem nhãn) trên ảnh người bán tải lên với cơ sở dữ liệu hình ảnh chuẩn của các thương hiệu lớn.
  - Gắn cờ nghi vấn nếu phát hiện sai lệch đáng kể, yêu cầu Admin kiểm duyệt thủ công trước khi cho phép đăng bán.

### 6.95. Thời Gian Đấu Giá Động (Dynamic Auction Duration)
- **Yêu cầu:** Tự động điều chỉnh thời gian kết thúc dựa trên mức độ quan tâm.
- **Logic:** 
  - Nếu một sản phẩm có quá ít lượt tương tác, hệ thống có thể tự động rút ngắn thời gian để giải phóng kho.
  - Ngược lại, nếu cuộc đấu giá đang diễn ra cực kỳ sôi nổi, hệ thống có thể gia hạn thêm (ngoài cơ chế Snipe Protection) để tìm ra mức giá cao nhất có thể.

### 6.96. Khám Phá Phân Khúc Khách Hàng Mới (AI Customer Segment Discovery)
- **Yêu cầu:** Tìm ra các nhóm khách hàng tiềm năng mà người bán chưa nhận ra.
- **Logic:** 
  - AI phân tích các mẫu hành vi mua sắm chéo (Cross-buying patterns).
  - Gợi ý cho người bán: "Những người mua đồng hồ của bạn cũng thường xuyên quan tâm đến thắt lưng da cao cấp. Bạn nên cân nhắc nhập thêm mặt hàng này."

### 6.97. Phòng Ngừa Rủi Ro Tỷ Giá Thời Gian Thực (Real-time Currency Hedging)
- **Yêu cầu:** Bảo vệ lợi nhuận của người bán quốc tế trước sự biến động của tỷ giá.
- **Logic:** 
  - Backend tích hợp với các sàn giao dịch tài chính để theo dõi biến động tỷ giá theo từng giây.
  - Tự động điều chỉnh giá bán (nếu người bán cho phép) hoặc tạm khóa giao dịch nếu tỷ giá biến động vượt quá biên độ an toàn đã thiết lập.

### 6.98. Công Cụ Diễn Tập Livestream AI (AI Livestream Rehearsal Tool)
- **Yêu cầu:** Cung cấp phản hồi cho Host trước khi lên sóng thật.
- **Logic:** 
  - Host có thể quay một đoạn video ngắn giới thiệu sản phẩm.
  - AI phân tích giọng điệu, tốc độ nói, và khả năng thu hút để đưa ra các lời khuyên cải thiện: "Bạn nên nói chậm lại ở phần giới thiệu giá" hoặc "Hãy cười nhiều hơn để tạo thiện cảm".

### 6.99. Tuân Thủ Thuế Toàn Cầu Tự Động (Global Tax Compliance Engine)
- **Yêu cầu:** Xử lý các loại thuế phức tạp (VAT, GST, Sales Tax) cho mọi quốc gia.
- **Logic:** 
  - Backend tự động cập nhật biểu thuế của hơn 200 quốc gia và vùng lãnh thổ.
  - Tính toán và tách biệt phần thuế trong hóa đơn, đồng thời hỗ trợ kết nối với các hệ thống khai báo thuế điện tử của chính phủ.

### 6.100. Tương Tác Sau Mua Hàng Cá Nhân Hóa (AI Post-Purchase Engagement)
- **Yêu cầu:** Tăng tỷ lệ khách hàng quay lại bằng các nội dung chăm sóc sau bán hàng.
- **Logic:** 
  - Sau khi đơn hàng hoàn tất, Gemini AI tự động soạn các hướng dẫn sử dụng, video mở hộp (unboxing) hoặc gợi ý các phụ kiện đi kèm phù hợp với chính sản phẩm khách đã mua.
  - Gửi các thông điệp này qua Email/Push vào thời điểm khách hàng vừa nhận được hàng để tạo ấn tượng tốt nhất.

## 7. Tính Năng Hỗ Trợ Cấu Trúc & Trải Nghiệm Frontend (Frontend-Backend Synergy)

### 7.1. Hệ Thống Giao Diện Điều Khiển Từ Server (Server-Driven UI - SDUI)
- **Yêu cầu:** Cho phép thay đổi bố cục ứng dụng mà không cần deploy lại Frontend.
- **Logic:** 
  - Backend trả về một cấu trúc JSON mô tả các components (ví dụ: `type: "banner_carousel"`, `data: [...]`).
  - Frontend có một bộ thư viện để ánh xạ các JSON này thành các React components tương ứng.
  - Giúp Admin có thể thay đổi giao diện trang chủ hoặc các trang sự kiện một cách tức thì.

### 7.2. Theo Dõi Trạng Thái Hiện Diện Thời Gian Thực (Real-time Presence)
- **Yêu cầu:** Hiển thị số lượng và danh tính người dùng đang cùng xem một sản phẩm.
- **Logic:** 
  - Sử dụng Redis Pub/Sub kết hợp với WebSockets để theo dõi các kết nối đang hoạt động trên từng `productId`.
  - Hiển thị thông báo: "X người đang xem", "Y người đang gõ tin nhắn" để tạo hiệu ứng sôi động (Social Proof).

### 7.3. Lưu Trữ Trạng Thái Form & Bản Nháp (Form Persistence & Auto-save)
- **Yêu cầu:** Đảm bảo người dùng không bị mất dữ liệu khi đang nhập liệu dở.
- **Logic:** 
  - Frontend gửi dữ liệu tạm thời lên một endpoint `api/drafts` sau mỗi X giây hoặc khi có thay đổi lớn.
  - Backend lưu trữ các bản nháp này theo `userId` và `formType`. Khi người dùng quay lại, Frontend sẽ yêu cầu dữ liệu bản nháp để khôi phục lại trạng thái.

### 7.4. Tối Ưu Hóa Media Theo Thiết Bị (On-the-fly Media Optimization)
- **Yêu cầu:** Cung cấp hình ảnh/video có kích thước và định dạng tối ưu nhất cho từng thiết bị.
- **Logic:** 
  - Frontend gửi kèm thông tin `width`, `height`, và `format_support` (ví dụ: webp, avif) trong request header hoặc query params.
  - Backend (hoặc Image Proxy) tự động resize và convert ảnh gốc sang phiên bản tối ưu nhất trước khi trả về.

### 7.5. Quản Lý Tính Năng & Thử Nghiệm A/B (Feature Flags & A/B Testing)
- **Yêu cầu:** Kiểm soát việc ra mắt tính năng mới và đo lường hiệu quả UI.
- **Logic:** 
  - Backend quản lý danh sách các `FeatureFlags` cho từng nhóm người dùng.
  - Khi Frontend khởi tạo, nó sẽ nhận được danh sách các tính năng được phép hiển thị.
  - Hỗ trợ chia nhóm người dùng (ví dụ: 50% thấy nút màu xanh, 50% thấy nút màu đỏ) để phân tích tỷ lệ chuyển đổi.

### 7.6. Theo Dõi Hành Trình & Hướng Dẫn Người Dùng (Onboarding Tracking)
- **Yêu cầu:** Đảm bảo người dùng hoàn thành các bước hướng dẫn sử dụng.
- **Logic:** 
  - Backend lưu trữ trạng thái `onboarding_steps_completed` (ví dụ: `step_1: true`, `step_2: false`).
  - Frontend dựa vào dữ liệu này để hiển thị các tooltip hoặc popup hướng dẫn phù hợp, tránh hiển thị lại những gì người dùng đã biết.

### 7.7. Quản Lý Điều Hướng & Deep Linking (Universal Links)
- **Yêu cầu:** Mở đúng màn hình ứng dụng từ các liên kết bên ngoài (Email, Social Media).
- **Logic:** 
  - Backend quản lý một bảng ánh xạ (Mapping Table) giữa các URL rút gọn và các route nội bộ của ứng dụng.
  - Cung cấp API để Frontend kiểm tra tính hợp lệ của một link và nhận về các tham số cần thiết để điều hướng.

### 7.8. API Cho Màn Hình Chờ (Skeleton & Metadata API)
- **Yêu cầu:** Cải thiện cảm giác tốc độ khi tải trang.
- **Logic:** 
  - Cung cấp các endpoint siêu nhẹ chỉ trả về Metadata (Tiêu đề, cấu trúc lưới) để Frontend render Skeleton Screens ngay lập tức.
  - Dữ liệu chi tiết sẽ được tải ở một request thứ hai hoặc qua stream.

### 7.9. Đồng Bộ Hóa Ngoại Tuyến & Giải Quyết Xung Đột (Offline Sync)
- **Yêu cầu:** Cho phép người dùng thực hiện hành động ngay cả khi mất mạng.
- **Logic:** 
  - Frontend lưu các hành động vào một hàng đợi (Queue) trong LocalStorage/IndexedDB.
  - Khi có mạng lại, Frontend gửi toàn bộ hàng đợi lên Backend.
  - Backend xử lý việc ghi đè dữ liệu theo mốc thời gian (Timestamp) và trả về kết quả đồng bộ cuối cùng cho Frontend.

### 7.10. Hệ Thống Thông Báo Đa Kênh Tích Hợp (Notification Center)
- **Yêu cầu:** Đồng bộ trạng thái thông báo trên mọi thiết bị.
- **Logic:** 
  - Backend quản lý trạng thái `read/unread` của từng thông báo.
  - Khi người dùng đọc thông báo trên Web, Backend sẽ gửi tín hiệu qua Socket để cập nhật trạng thái tương ứng trên App di động ngay lập tức.

### 7.11. Quản Lý Chủ Đề & Giao Diện Động (Dynamic Theming & Branding)
- **Yêu cầu:** Thay đổi màu sắc, font chữ và phong cách thiết kế theo mùa hoặc theo sự kiện.
- **Logic:** 
  - Backend cung cấp một endpoint trả về cấu hình CSS Variables hoặc Design Tokens (ví dụ: `primary-color`, `border-radius`).
  - Frontend áp dụng các giá trị này vào hệ thống theme (Tailwind/CSS) để thay đổi diện mạo ứng dụng ngay lập tức mà không cần build lại.

### 7.12. Đồng Bộ Hóa Đa Tab & Đa Cửa Sổ (Multi-tab Synchronization)
- **Yêu cầu:** Đảm bảo dữ liệu nhất quán khi người dùng mở AmazeBid trên nhiều tab trình duyệt.
- **Logic:** 
  - Sử dụng Broadcast Channel API ở Frontend kết hợp với tín hiệu từ Backend qua WebSockets.
  - Khi người dùng đặt giá ở tab A, Backend gửi thông báo qua Socket, tab A cập nhật và đồng thời phát tín hiệu cho tab B, C để cùng cập nhật trạng thái mà không cần reload.

### 7.13. Hệ Thống Gợi Ý Tìm Kiếm Thông Minh (Search Autocomplete & Suggestions)
- **Yêu cầu:** Hiển thị kết quả gợi ý ngay khi người dùng đang gõ.
- **Logic:** 
  - Backend cung cấp endpoint tìm kiếm tốc độ cao (sử dụng Redis hoặc Elasticsearch).
  - Trả về danh sách các từ khóa phổ biến, danh mục liên quan và các sản phẩm khớp nhất để Frontend hiển thị trong dropdown tìm kiếm.

### 7.14. Theo Dõi Hiệu Suất & Web Vitals (Performance Monitoring)
- **Yêu cầu:** Thu thập dữ liệu về tốc độ tải trang thực tế của người dùng.
- **Logic:** 
  - Frontend gửi các chỉ số (LCP, FID, CLS) về một endpoint `api/telemetry`.
  - Backend tổng hợp dữ liệu để đội ngũ kỹ thuật biết được trang nào đang chậm và cần tối ưu hóa.

### 7.15. Quản Lý Bản Dịch & Đa Ngôn Ngữ Động (Dynamic i18n)
- **Yêu cầu:** Cập nhật nội dung dịch thuật mà không cần deploy code.
- **Logic:** 
  - Backend quản lý kho dữ liệu dịch thuật (JSON).
  - Frontend tải các file ngôn ngữ này khi ứng dụng khởi chạy hoặc khi người dùng chuyển đổi ngôn ngữ.
  - Admin có thể sửa lỗi chính tả hoặc thêm ngôn ngữ mới trực tiếp từ Dashboard.

### 7.16. Kích Hoạt Phản Hồi Rung & Âm Thanh (Haptic & Audio Feedback Triggers)
- **Yêu cầu:** Tăng cường trải nghiệm giác quan cho các hành động quan trọng.
- **Logic:** 
  - Backend trả về các cờ (flags) trong response (ví dụ: `trigger_haptic: "success"`, `play_sound: "bid_won"`).
  - Frontend dựa vào các cờ này để kích hoạt bộ rung trên điện thoại hoặc phát âm thanh hiệu ứng tương ứng.

### 7.17. Quản Lý Trạng Thái Vi Mô (Micro-interaction State Management)
- **Yêu cầu:** Lưu trữ các trạng thái nhỏ như "đã xem hướng dẫn", "đã đóng banner quảng cáo".
- **Logic:** 
  - Backend cung cấp một bảng `UserPreferences` lưu trữ các cặp key-value đơn giản.
  - Giúp Frontend biết được người dùng đã thực hiện các tương tác nhỏ này chưa để không làm phiền họ lần sau.

### 7.18. Tiền Tải Dữ Liệu Thông Minh (Smart Data Prefetching)
- **Yêu cầu:** Dự đoán trang tiếp theo người dùng sẽ vào để tải dữ liệu trước.
- **Logic:** 
  - Backend phân tích luồng hành vi (User Flow).
  - Trả về danh sách các URL cần prefetch trong response của trang hiện tại.
  - Frontend sử dụng thông tin này để tải ngầm dữ liệu, giúp việc chuyển trang diễn ra tức thì.

### 7.19. Báo Cáo Lỗi & Nhật Ký Frontend (Frontend Error Logging)
- **Yêu cầu:** Thu thập các lỗi JavaScript hoặc lỗi render xảy ra trên trình duyệt người dùng.
- **Logic:** 
  - Frontend bắt các lỗi qua `window.onerror` hoặc Error Boundaries và gửi về `api/logs/frontend`.
  - Backend lưu trữ và phân loại lỗi để đội ngũ kỹ thuật có thể fix các bug "lạ" chỉ xuất hiện trên một số thiết bị nhất định.

### 7.20. Quản Lý Metadata Cho SEO & Mạng Xã Hội (Dynamic SEO Metadata)
- **Yêu cầu:** Tối ưu hóa hiển thị khi chia sẻ link lên Facebook, Zalo, Google.
- **Logic:** 
  - Backend cung cấp API trả về các thẻ Meta (Title, Description, Open Graph Image) được cá nhân hóa cho từng sản phẩm hoặc phiên đấu giá.
  - Đảm bảo khi chia sẻ, hình ảnh và mô tả luôn là phiên bản mới nhất và hấp dẫn nhất.

### 7.21. Tạo Ảnh Placeholder Thông Minh (BlurHash/LIP Generation)
- **Yêu cầu:** Hiển thị ảnh mờ (blur) chất lượng cao trong khi chờ ảnh gốc tải xong.
- **Logic:** 
  - Khi người bán tải ảnh lên, Backend tự động tạo một chuỗi `blurHash` siêu nhẹ.
  - Frontend nhận chuỗi này và hiển thị placeholder ngay lập tức, tạo cảm giác tải trang mượt mà và chuyên nghiệp.

### 7.22. Tối Ưu Hóa Truy Vấn Theo Thành Phần (Component-Based Data Fetching)
- **Yêu cầu:** Chỉ lấy đúng dữ liệu mà một component cụ thể cần (tương tự GraphQL).
- **Logic:** 
  - Backend cung cấp các endpoint linh hoạt cho phép Frontend chỉ định các trường dữ liệu cần thiết qua query params (ví dụ: `?fields=id,name,price`).
  - Giúp giảm kích thước payload và tăng tốc độ xử lý cho các thiết bị di động cấu hình thấp.

### 7.23. Quản Lý Cấu Hình PWA & Manifest Động (Dynamic PWA Management)
- **Yêu cầu:** Thay đổi biểu tượng ứng dụng và màn hình chờ (Splash Screen) từ xa.
- **Logic:** 
  - Backend cung cấp API để quản lý file `manifest.json`.
  - Giúp ứng dụng có thể thay đổi icon hoặc tên hiển thị trên màn hình điện thoại người dùng theo các chiến dịch marketing.

### 7.24. Bản Đồ Tài Nguyên & Icon Động (Dynamic Asset & Icon Mapping)
- **Yêu cầu:** Cập nhật bộ icon và tài nguyên đồ họa mà không cần cập nhật code.
- **Logic:** 
  - Backend trả về một bản đồ (Mapping) giữa tên icon và URL của file SVG/PNG.
  - Frontend sử dụng bản đồ này để hiển thị icon, cho phép Admin thay đổi bộ nhận diện thương hiệu một cách nhanh chóng.

### 7.25. Lưu Trữ Trạng Thái Cuộn & Vị Trí Xem (Scroll & Viewport Persistence)
- **Yêu cầu:** Quay lại đúng vị trí đang xem khi người dùng tải lại trang hoặc quay lại từ trang khác.
- **Logic:** 
  - Frontend gửi tọa độ cuộn (`scroll_x`, `scroll_y`) về Backend khi người dùng rời khỏi trang.
  - Khi quay lại, Backend trả về tọa độ này để Frontend tự động cuộn đến vị trí cũ, tạo trải nghiệm liền mạch.

### 7.26. Tự Động Tạo Metadata Truy Cập (AI-Generated Accessibility Metadata)
- **Yêu cầu:** Hỗ trợ người dùng khiếm thính/khiếm thị qua các thẻ ARIA và Alt text.
- **Logic:** 
  - Backend sử dụng AI để tự động tạo mô tả ảnh (`alt text`) và các nhãn trợ năng (`aria-labels`) cho mọi thành phần giao diện.
  - Đảm bảo ứng dụng luôn tuân thủ các tiêu chuẩn về khả năng truy cập (Accessibility) mà không cần người bán phải nhập thủ công.

### 7.27. Điều Phối Vi Dịch Vụ Frontend (Micro-Frontend Orchestration Metadata)
- **Yêu cầu:** Quản lý việc tải các module Frontend khác nhau một cách linh hoạt.
- **Logic:** 
  - Backend cung cấp một "Service Registry" cho Frontend, cho biết module nào (ví dụ: Chat, Đấu giá, Ví) đang ở phiên bản nào và cần tải từ URL nào.
  - Giúp việc cập nhật từng phần của ứng dụng diễn ra độc lập và an toàn.

### 7.28. Tối Ưu Hóa Font Chữ Theo Ngữ Cảnh (Dynamic Font Subsetting)
- **Yêu cầu:** Chỉ tải các ký tự cần thiết của font chữ để giảm dung lượng.
- **Logic:** 
  - Backend phân tích nội dung văn bản sẽ hiển thị (ví dụ: tiếng Việt, tiếng Anh).
  - Tự động tạo và trả về các file font chữ đã được cắt gọn (subsetted font) chỉ chứa các ký tự có trong nội dung đó.

### 7.29. Kích Hoạt Xóa Cache Client Chủ Động (Client-Side Cache Invalidation)
- **Yêu cầu:** Đảm bảo người dùng luôn thấy dữ liệu mới nhất mà không cần reload.
- **Logic:** 
  - Khi dữ liệu thay đổi, Backend gửi một tín hiệu "Invalidate" qua Socket kèm theo ID của resource.
  - Frontend nhận tín hiệu và tự động xóa cache local (React Query/SWR) để thực hiện fetch lại dữ liệu mới nhất.

### 7.30. Trạng Thái Hướng Dẫn & Tutorial Tương Tác (Interactive Tour State)
- **Yêu cầu:** Quản lý việc người dùng đã xem các bước hướng dẫn tính năng mới chưa.
- **Logic:** 
  - Backend lưu trữ một mảng các `seen_tutorials` cho mỗi người dùng.
  - Frontend dựa vào danh sách này để quyết định có hiển thị các bước hướng dẫn (Guided Tours) khi người dùng truy cập vào một tính năng lần đầu hay không.

### 7.31. Hệ Thống Phân Phối Nội Dung Theo Vùng (Edge Content Delivery Logic)
- **Yêu cầu:** Tối ưu hóa tốc độ tải tài nguyên dựa trên vị trí địa lý của người dùng.
- **Logic:** 
  - Backend tích hợp với các dịch vụ Edge Computing để lưu trữ và phân phối các file JSON cấu hình giao diện tại các node gần người dùng nhất.
  - Giúp giảm độ trễ (latency) khi người dùng mở ứng dụng từ các quốc gia khác nhau.

### 7.32. Quản Lý Trạng Thái "Đang Hoạt Động" (User Presence Heartbeat)
- **Yêu cầu:** Theo dõi chính xác người dùng nào đang online để hiển thị trong chat hoặc đấu giá.
- **Logic:** 
  - Frontend gửi các tín hiệu "heartbeat" định kỳ qua Socket.
  - Backend cập nhật trạng thái `last_active` trong Redis. Nếu quá X giây không nhận được tín hiệu, hệ thống tự động chuyển trạng thái sang `offline` và thông báo cho các người dùng liên quan.

### 7.33. Tối Ưu Hóa Tải Trang Với HTTP Streaming (Data Streaming API)
- **Yêu cầu:** Hiển thị dữ liệu ngay khi nó vừa được xử lý xong, không cần chờ toàn bộ request hoàn tất.
- **Logic:** 
  - Backend sử dụng cơ chế Transfer-Encoding: chunked để gửi dữ liệu theo từng phần.
  - Frontend sử dụng ReadableStream để nhận và hiển thị dữ liệu ngay lập tức (ví dụ: danh sách 100 sản phẩm sẽ hiện 10 cái đầu tiên ngay khi Backend tìm thấy).

### 7.34. Hệ Thống Gợi Ý Hành Động Tiếp Theo (Next Best Action - NBA)
- **Yêu cầu:** Hướng dẫn người dùng thực hiện hành động có lợi nhất cho họ.
- **Logic:** 
  - AI phân tích trạng thái hiện tại của người dùng (ví dụ: vừa thắng đấu giá nhưng chưa thanh toán).
  - Backend trả về một đối tượng `next_action` (ví dụ: `type: "PAY_NOW"`, `priority: "HIGH"`).
  - Frontend hiển thị nút bấm hoặc banner nổi bật để dẫn dắt người dùng hoàn tất quy trình.

### 7.35. Quản Lý Cấu Hình Phím Tắt Động (Dynamic Keyboard Shortcuts)
- **Yêu cầu:** Cho phép người dùng chuyên nghiệp (Power Users) tùy chỉnh phím tắt.
- **Logic:** 
  - Backend lưu trữ bảng ánh xạ phím tắt (ví dụ: `Alt+B` -> `Mở khung đặt giá`).
  - Frontend tải cấu hình này và đăng ký các sự kiện bàn phím tương ứng, giúp người dùng thao tác nhanh hơn trong các phiên đấu giá kịch tính.

### 7.36. Tự Động Chuyển Đổi Chế Độ Hiển Thị (AI-Driven Display Mode)
- **Yêu cầu:** Gợi ý chế độ Sáng/Tối dựa trên môi trường và thói quen.
- **Logic:** 
  - Backend phân tích thời gian địa phương và vị trí của người dùng.
  - Trả về gợi ý `preferred_appearance`. Frontend có thể tự động chuyển đổi hoặc hiển thị thông báo: "Trời đã tối, bạn có muốn chuyển sang Chế độ Tối để bảo vệ mắt không?".

### 7.37. Hệ Thống Quản Lý Widget Động (Widget Orchestration)
- **Yêu cầu:** Cho phép người dùng tùy chỉnh Dashboard cá nhân bằng các widget.
- **Logic:** 
  - Backend quản lý danh sách các widget khả dụng và vị trí của chúng cho từng người dùng.
  - Frontend render các widget này dựa trên cấu hình JSON, cho phép người dùng kéo thả và thay đổi kích thước các khối thông tin theo ý thích.

### 7.38. Theo Dõi Tương Tác Video Chuyên Sâu (Video Interaction Telemetry)
- **Yêu cầu:** Hiểu rõ người dùng quan tâm đến phần nào trong video sản phẩm.
- **Logic:** 
  - Frontend gửi dữ liệu về các điểm dừng, tua lại, hoặc thay đổi âm lượng trong video về Backend.
  - AI phân tích các "điểm nóng" (Hotspots) để gợi ý người bán tập trung vào các tính năng sản phẩm được quan tâm nhiều nhất.

### 7.39. Quản Lý Token Thông Báo Đẩy (Push Notification Token Management)
- **Yêu cầu:** Đảm bảo thông báo luôn đến đúng thiết bị và không bị trùng lặp.
- **Logic:** 
  - Backend quản lý việc đăng ký, cập nhật và thu hồi các FCM/APNs tokens.
  - Xử lý logic gửi thông báo thông minh: nếu người dùng đang mở Web, không gửi thông báo đẩy về điện thoại để tránh gây phiền nhiễu.

### 7.40. Hệ Thống Phản Hồi Người Dùng Tích Hợp (In-app Micro-Surveys)
- **Yêu cầu:** Thu thập ý kiến người dùng ngay trong quá trình sử dụng.
- **Logic:** 
  - Backend quản lý các chiến dịch khảo sát (ví dụ: "Bạn thấy quy trình thanh toán thế nào?").
  - AI quyết định thời điểm hiển thị khảo sát (ví dụ: ngay sau khi thanh toán thành công) để nhận được phản hồi chính xác nhất mà không gây khó chịu.

### 7.41. Bố Cục Tự Thích Ứng Theo Thiết Bị (AI-Powered Layout Adaptation)
- **Yêu cầu:** Tối ưu hóa giao diện dựa trên kích thước màn hình và khả năng phần cứng thực tế.
- **Logic:** 
  - Frontend gửi thông số chi tiết về thiết bị (GPU, RAM, Screen Size).
  - Backend trả về cấu hình UI phù hợp: ví dụ, thiết bị yếu sẽ nhận giao diện tối giản (Lite UI), thiết bị mạnh nhận giao diện đầy đủ hiệu ứng và 3D.

### 7.42. Con Trỏ & Vùng Chọn Cộng Tác (Collaborative Cursor & Selection)
- **Yêu cầu:** Hiển thị vị trí chuột hoặc vùng đang xem của những người dùng khác trong cùng một phiên đấu giá.
- **Logic:** 
  - Backend xử lý luồng dữ liệu tọa độ (X, Y) qua WebSockets với độ trễ cực thấp.
  - Đồng bộ hóa các vùng chọn hoặc các sản phẩm đang được người khác "hover" để tạo cảm giác cộng đồng đang cùng tham gia.

### 7.43. Đóng Gói Tài Nguyên Động (Dynamic Asset Bundling)
- **Yêu cầu:** Chỉ tải các module và thư viện cần thiết cho phiên làm việc hiện tại.
- **Logic:** 
  - Backend phân tích các tính năng người dùng thường xuyên sử dụng.
  - Trả về danh sách các "bundles" cần ưu tiên tải, giúp giảm thời gian tải trang ban đầu (First Contentful Paint) một cách đáng kể.

### 7.44. Dự Báo Ý Định Điều Hướng (Navigation Intent Prediction)
- **Yêu cầu:** Chuẩn bị sẵn dữ liệu cho trang mà người dùng có khả năng cao sẽ click vào.
- **Logic:** 
  - AI phân tích quỹ đạo di chuyển chuột và lịch sử hành vi.
  - Nếu người dùng di chuyển chuột về phía nút "Ví tiền", Backend sẽ chủ động đẩy dữ liệu số dư qua Socket trước khi người dùng kịp click.

### 7.45. Quản Lý Ngân Sách Hiệu Suất Tự Động (Automated Performance Budgeting)
- **Yêu cầu:** Đảm bảo ứng dụng luôn chạy mượt mà trên mọi phiên bản code.
- **Logic:** 
  - Backend tích hợp công cụ kiểm tra hiệu suất tự động sau mỗi lần cập nhật dữ liệu lớn.
  - Nếu kích thước payload hoặc thời gian phản hồi vượt ngưỡng cho phép, hệ thống tự động gửi cảnh báo cho đội ngũ phát triển.

### 7.46. Hydration Nội Dung Thông Minh (Smart Content Hydration)
- **Yêu cầu:** Ưu tiên hiển thị nội dung quan trọng trước, các phần phụ tải sau.
- **Logic:** 
  - Backend đánh dấu mức độ ưu tiên (`priority_level`) cho từng khối dữ liệu trong JSON.
  - Frontend dựa vào đó để thực hiện "Hydration" (kích hoạt tương tác) cho các vùng quan trọng nhất (như nút Đặt giá) trước các vùng khác.

### 7.47. Hệ Thống Trợ Giúp Theo Ngữ Cảnh (Context-Aware Help System)
- **Yêu cầu:** Cung cấp tài liệu hướng dẫn ngay tại vị trí người dùng gặp khó khăn.
- **Logic:** 
  - Backend quản lý kho nội dung trợ giúp được gắn thẻ theo `route` và `component_id`.
  - Khi người dùng nhấn trợ giúp, Frontend gửi ngữ cảnh hiện tại, Backend trả về đúng đoạn hướng dẫn hoặc video demo tương ứng.

### 7.48. Điều Phối Hiệu Ứng Chuyển Động Động (Dynamic Animation Orchestration)
- **Yêu cầu:** Đồng bộ các hiệu ứng hình ảnh phức tạp giữa các thiết bị khác nhau.
- **Logic:** 
  - Backend gửi các mốc thời gian (Timestamps) và thông số hiệu ứng (Easing, Duration).
  - Đảm bảo khi một sự kiện lớn xảy ra (ví dụ: có người thắng đấu giá), tất cả người xem đều thấy hiệu ứng pháo hoa đồng bộ hoàn hảo.

### 7.49. Chuyển Giao Trạng Thái Đa Thiết Bị (Cross-Device State Handoff)
- **Yêu cầu:** Tiếp tục công việc đang dở dang khi chuyển từ điện thoại sang máy tính.
- **Logic:** 
  - Backend lưu trữ trạng thái chi tiết của phiên làm việc (ví dụ: đang xem dở video giới thiệu ở phút thứ 2).
  - Khi người dùng đăng nhập trên thiết bị mới, Backend trả về trạng thái này để Frontend khôi phục chính xác vị trí cũ.

### 7.50. Báo Cáo Kiểm Tra Trợ Năng Tự Động (Automated Accessibility Audit)
- **Yêu cầu:** Đảm bảo ứng dụng luôn thân thiện với người khuyết tật.
- **Logic:** 
  - Backend định kỳ quét cấu hình giao diện (SDUI) để kiểm tra độ tương phản màu sắc và các nhãn trợ năng.
  - Tự động điều chỉnh các giá trị màu sắc nếu phát hiện chúng không đạt tiêu chuẩn WCAG, đảm bảo tính bao trùm cho ứng dụng.

### 7.51. Cắt Ảnh Thông Minh & Xác Định Điểm Tập Trung (AI Focal Point Detection)
- **Yêu cầu:** Đảm bảo ảnh sản phẩm luôn hiển thị phần quan trọng nhất trên mọi khung hình.
- **Logic:** 
  - Khi ảnh được tải lên, Backend sử dụng AI để xác định tọa độ "điểm tập trung" (Focal Point - ví dụ: mặt đồng hồ, logo túi xách).
  - Trả về tọa độ này cho Frontend để sử dụng thuộc tính `object-position` trong CSS, giúp ảnh không bị cắt mất phần quan trọng khi thay đổi tỷ lệ khung hình.

### 7.52. Quy Tắc Xác Thực Form Động (Dynamic Form Validation Rules)
- **Yêu cầu:** Thay đổi quy tắc kiểm tra dữ liệu đầu vào mà không cần cập nhật code Frontend.
- **Logic:** 
  - Backend gửi một bộ quy tắc xác thực (Regex, Min/Max, Required) dưới dạng JSON cho từng trường trong form.
  - Frontend sử dụng một engine (như Yup hoặc Zod) để áp dụng các quy tắc này theo thời gian thực, đảm bảo tính nhất quán dữ liệu giữa Client và Server.

### 7.53. Tiền Tải Truy Vấn API Dự Đoán (Predictive API Prefetching)
- **Yêu cầu:** Tải sẵn dữ liệu của các API mà người dùng có khả năng sẽ gọi tiếp theo.
- **Logic:** 
  - AI phân tích chuỗi hành động phổ biến (ví dụ: sau khi xem "Chi tiết sản phẩm" thường sẽ xem "Lịch sử đặt giá").
  - Backend trả về một danh sách `prefetch_endpoints` trong response hiện tại để Frontend thực hiện tải ngầm dữ liệu vào cache.

### 7.54. Chỉnh Sửa Form Cộng Tác Thời Gian Thực (Collaborative Form Editing)
- **Yêu cầu:** Ngăn chặn xung đột khi nhiều Admin cùng chỉnh sửa một sản phẩm.
- **Logic:** 
  - Backend quản lý trạng thái "khóa trường" (Field Locking) qua WebSockets.
  - Khi Admin A đang gõ vào trường "Mô tả", Backend gửi tín hiệu để Frontend của Admin B vô hiệu hóa trường đó và hiển thị avatar của Admin A đang chỉnh sửa.

### 7.55. Làm Mới Nội Dung Từng Phần Thông Minh (Intelligent Partial Refresh)
- **Yêu cầu:** Chỉ cập nhật đúng thành phần cần thiết thay vì tải lại toàn bộ danh sách.
- **Logic:** 
  - Khi có thay đổi dữ liệu, Backend gửi một tín hiệu Socket chứa ID của resource và tên các trường bị thay đổi.
  - Frontend sử dụng thông tin này để chỉ cập nhật đúng các components đang hiển thị dữ liệu đó, tối ưu hóa hiệu năng render.

### 7.56. Kiểm Soát Tính Năng Theo Hiệu Năng Thiết Bị (Device Capability Gating)
- **Yêu cầu:** Tự động bật/tắt các hiệu ứng nặng dựa trên khả năng thực tế của thiết bị.
- **Logic:** 
  - Frontend gửi các chỉ số Benchmark (FPS, thời gian xử lý JS) về Backend.
  - Backend trả về cấu hình `experience_level` (ví dụ: `disable_blur: true`, `enable_3d: false`), giúp ứng dụng chạy mượt mà trên cả điện thoại cũ và máy tính mạnh.

### 7.57. Nhật Ký Lỗi Giao Diện Tự Động (Automated UI Regression Telemetry)
- **Yêu cầu:** Phát hiện các lỗi hiển thị (vỡ khung, chồng chéo) trên trình duyệt người dùng.
- **Logic:** 
  - Frontend sử dụng các công cụ như `html2canvas` để chụp ảnh màn hình khi phát hiện lỗi render hoặc khi người dùng báo cáo.
  - Backend lưu trữ ảnh và phân tích để đội ngũ thiết kế biết được giao diện đang bị lỗi trên cấu hình màn hình nào.

### 7.58. Tạo Menu Điều Hướng Động (Dynamic Navigation Orchestration)
- **Yêu cầu:** Thay đổi cấu trúc menu và sidebar dựa trên quyền hạn và vai trò người dùng.
- **Logic:** 
  - Backend trả về cấu trúc cây menu (JSON) sau khi người dùng đăng nhập.
  - Frontend render menu dựa trên dữ liệu này, cho phép Admin ẩn/hiện các tính năng mới hoặc thay đổi thứ tự ưu tiên một cách linh hoạt.

### 7.59. Tạo Liên Kết Sâu Bảo Toàn Trạng Thái (Stateful Deep Linking)
- **Yêu cầu:** Chia sẻ link không chỉ đến trang mà còn đến đúng trạng thái của các bộ lọc/tab.
- **Logic:** 
  - Backend cung cấp API để mã hóa trạng thái hiện tại của Frontend (Filters, Sorting, Tab index) thành một mã ngắn (Short Code).
  - Khi người dùng khác mở link chứa mã này, Backend giải mã và trả về trạng thái để Frontend khôi phục chính xác giao diện như người chia sẻ.

### 7.60. Gợi Ý Khắc Phục Lỗi Bằng AI (AI-Powered Error Recovery)
- **Yêu cầu:** Hướng dẫn người dùng cách sửa lỗi khi gặp sự cố hệ thống hoặc nhập liệu sai.
- **Logic:** 
  - Khi Backend trả về lỗi (ví dụ: 400 Bad Request), nó kèm theo một trường `ai_suggestion` được tạo bởi Gemini.
  - Thay vì hiện lỗi khô khan, Frontend hiển thị: "Có vẻ bạn đã nhập sai định dạng ngày tháng, hãy thử định dạng DD/MM/YYYY nhé!".

### 7.61. Tối Ưu Hóa Nội Dung Văn Bản Bằng AI (AI-Driven Micro-Copy Optimization)
- **Yêu cầu:** Tự động điều chỉnh các đoạn văn bản ngắn (nút bấm, thông báo) để tăng tỷ lệ chuyển đổi.
- **Logic:** 
  - Backend quản lý nhiều phiên bản văn bản (Micro-copy) cho cùng một hành động.
  - AI phân tích phản ứng của người dùng (CTR) và tự động trả về phiên bản văn bản hiệu quả nhất cho từng phân khúc khách hàng.

### 7.62. Ưu Tiên Tài Nguyên Theo Ngữ Cảnh (Client-Side Resource Prioritization)
- **Yêu cầu:** Chỉ đạo Frontend tải các tài nguyên quan trọng nhất dựa trên mục đích sử dụng.
- **Logic:** 
  - Backend trả về danh sách `critical_assets` trong header của response đầu tiên.
  - Frontend sử dụng thông tin này để thiết lập thuộc tính `fetchpriority="high"` cho các ảnh hoặc script quan trọng, giúp trang hiển thị nội dung chính nhanh hơn.

### 7.63. Tạo Form Động Từ Schema (Dynamic Form Schema Generation)
- **Yêu cầu:** Xây dựng các biểu mẫu phức tạp hoàn toàn từ cấu hình JSON.
- **Logic:** 
  - Backend cung cấp một `FormSchema` mô tả các trường, kiểu dữ liệu, quy tắc xác thực và logic hiển thị (ví dụ: hiện trường B nếu trường A được chọn).
  - Frontend sử dụng một engine để render form tự động, giúp việc thêm mới các loại sản phẩm đấu giá trở nên cực kỳ linh hoạt.

### 7.64. Chú Thích Cộng Tác Thời Gian Thực (Real-time Collaborative Annotations)
- **Yêu cầu:** Cho phép người dùng và người bán cùng thảo luận trực tiếp trên hình ảnh hoặc video sản phẩm.
- **Logic:** 
  - Backend xử lý việc lưu trữ và đồng bộ hóa các tọa độ chú thích (Annotations) qua WebSockets.
  - Khi người bán khoanh tròn một vết xước trên ảnh, tất cả người xem đều thấy vòng tròn đó xuất hiện ngay lập tức kèm theo lời giải thích.

### 7.65. Che Giấu Dữ Liệu Nhạy Cảm Thông Minh (Intelligent Data Masking)
- **Yêu cầu:** Bảo vệ thông tin cá nhân (PII) ngay tại lớp hiển thị.
- **Logic:** 
  - Backend đánh dấu các trường dữ liệu nhạy cảm trong JSON.
 che giấu (masking) các thông tin này (ví dụ: `****@gmail.com`) dựa trên quyền hạn của người xem, đảm bảo an toàn dữ liệu ngay cả khi có lỗi render.

### 7.66. Cảnh Báo Suy Giảm Hiệu Suất Giao Diện (UI Performance Regression Alerts)
- **Yêu cầu:** Phát hiện khi một bản cập nhật làm ứng dụng chạy chậm đi trên thiết bị người dùng.
- **Logic:** 
  - Frontend gửi các chỉ số về thời gian render component và độ trễ tương tác về Backend.
  - Backend sử dụng AI để phát hiện các xu hướng bất thường và tự động tạo ticket cho đội ngũ kỹ thuật nếu hiệu suất giảm quá 10%.

### 7.67. Menu Hành Động Theo Ngữ Cảnh AI (AI-Driven Contextual Menus)
- **Yêu cầu:** Gợi ý các hành động nhanh phù hợp nhất khi người dùng nhấn chuột phải hoặc nhấn giữ.
- **Logic:** 
  - Khi người dùng tương tác, Frontend gửi ngữ cảnh (loại sản phẩm, trạng thái người dùng).
  - Backend trả về danh sách các hành động ưu tiên (ví dụ: "Đặt giá nhanh", "Thêm vào danh sách theo dõi") được sắp xếp theo xác suất người dùng sẽ thực hiện.

### 7.68. Cấu Hình Màn Hình Chờ Động (Dynamic Skeleton Screen Configuration)
- **Yêu cầu:** Thay đổi hình dáng màn hình chờ (Skeleton) để khớp hoàn hảo với nội dung sắp tải.
- **Logic:** 
  - Backend trả về cấu trúc `skeleton_layout` trong request metadata.
  - Frontend render các khối xám theo đúng hình dáng của dữ liệu thực tế sắp về, giảm thiểu hiện tượng nhảy khung hình (Layout Shift) khi dữ liệu nạp xong.

### 7.69. Đồng Bộ Hóa Đầu Vào Đa Phương Thức (Multi-modal Input Sync)
- **Yêu cầu:** Kết hợp giọng nói, văn bản và cử chỉ để điều khiển ứng dụng.
- **Logic:** 
  - Backend xử lý việc hợp nhất các luồng dữ liệu từ micrô, bàn phím và camera.
  - Sử dụng AI để hiểu ý định tổng hợp (ví dụ: người dùng vừa nói "Tôi muốn cái này" vừa chỉ tay vào một sản phẩm trên màn hình qua AR).

### 7.70. Quản Lý Header Bảo Mật Frontend Tự Động (Automated Security Headers)
- **Yêu cầu:** Tự động điều chỉnh các chính sách bảo mật (CSP, CORS) dựa trên nội dung hiển thị.
- **Logic:** 
  - Backend phân tích các nguồn tài nguyên bên thứ ba cần thiết cho một trang cụ thể.
  - Tự động tạo và gửi các header bảo mật tối ưu nhất, giúp ngăn chặn các cuộc tấn công XSS hoặc Clickjacking mà không làm gián đoạn tính năng.

### 7.71. Tự Động Gợi Ý Phím Tắt Theo Hành Vi (AI-Driven Shortcut Suggestions)
- **Yêu cầu:** Giúp người dùng thao tác nhanh hơn bằng cách gợi ý các phím tắt cho những hành động lặp đi lặp lại.
- **Logic:** 
  - Backend phân tích tần suất thực hiện các hành động của người dùng (ví dụ: liên tục nhấn "Làm mới giá").
  - AI trả về một gợi ý: "Bạn có biết nhấn 'R' sẽ giúp làm mới giá nhanh hơn không?".
  - Frontend hiển thị tooltip hoặc thông báo nhỏ để hướng dẫn người dùng.

### 7.72. Đồng Bộ Hóa Trạng Thái UI Đa Người Dùng (Multi-user UI State Sync)
- **Yêu cầu:** Cho phép nhiều người dùng cùng nhìn thấy những thay đổi nhỏ trên giao diện của nhau (ví dụ: đang xem tab nào, đang chọn sản phẩm nào).
- **Logic:** 
  - Backend đồng bộ hóa các trạng thái "phi chức năng" (Non-functional states) qua WebSockets.
  - Tạo cảm giác như đang cùng đi mua sắm trong một cửa hàng vật lý, tăng tính kết nối xã hội.

### 7.73. Quản Lý Tài Nguyên Theo Băng Thông Thực Tế (Network-Adaptive Asset Management)
- **Yêu cầu:** Tự động điều chỉnh chất lượng tài nguyên dựa trên tốc độ mạng thực tế của người dùng.
- **Logic:** 
  - Frontend gửi chỉ số `downlink` và `rtt` về Backend.
  - Backend trả về danh sách URL tài nguyên (ảnh, video) với độ phân giải thấp hơn nếu mạng yếu, đảm bảo ứng dụng luôn khả dụng.

### 7.74. Tối Ưu Hóa Bố Cục Theo Tần Suất Sử Dụng (Usage-Based Layout Optimization)
- **Yêu cầu:** Tự động đưa các nút bấm hoặc tính năng hay dùng vào vị trí dễ tiếp cận nhất.
- **Logic:** 
  - Backend thu thập dữ liệu về các vùng người dùng hay click nhất.
  - AI đề xuất thay đổi thứ tự menu hoặc vị trí các nút bấm trong cấu hình SDUI để tối ưu hóa hành trình người dùng.

### 7.75. Giải Quyết Xung Đột Trạng Thái Client Tự Động (Automated State Reconciliation)
- **Yêu cầu:** Đảm bảo dữ liệu trên màn hình luôn khớp với server ngay cả khi có lỗi mạng chập chờn.
- **Logic:** 
  - Backend gửi các "checksum" của trạng thái dữ liệu hiện tại qua Socket.
  - Nếu Frontend phát hiện checksum không khớp, nó sẽ yêu cầu Backend gửi một bản "diff" để cập nhật lại những phần bị sai lệch mà không cần tải lại toàn bộ trang.

### 7.76. Báo Cáo Lỗi Kèm Theo Video Quay Lại Phiên (Error Reporting with Session Replay)
- **Yêu cầu:** Giúp đội ngũ kỹ thuật tái hiện lỗi chính xác bằng cách xem lại hành động của người dùng trước khi lỗi xảy ra.
- **Logic:** 
  - Khi có lỗi nghiêm trọng, Frontend gửi metadata phiên làm việc về Backend.
  - Backend lưu trữ và liên kết với các công cụ như LogRocket hoặc Sentry để Admin có thể xem lại video mô phỏng hành vi dẫn đến lỗi.

### 7.77. Khám Phá Tính Năng Nâng Cao Cho Người Dùng Chuyên Nghiệp (Power User Feature Discovery)
- **Yêu cầu:** Giới thiệu các tính năng phức tạp cho những người dùng đã thành thạo.
- **Logic:** 
  - Backend theo dõi "điểm kỹ năng" (Skill Score) của người dùng dựa trên thời gian sử dụng và số lượng tính năng đã dùng.
  - Khi người dùng đạt ngưỡng "Pro", AI sẽ mở khóa và hướng dẫn các tính năng như: "Đấu giá tự động nâng cao", "Phân tích thị trường chuyên sâu".

### 7.78. Gợi Ý Hoàn Thiện Biểu Mẫu Bằng AI (AI-Powered Form Autocomplete)
- **Yêu cầu:** Tự động điền các trường thông tin dựa trên dữ liệu lịch sử và ngữ cảnh.
- **Logic:** 
  - Khi người dùng bắt đầu điền form, Frontend gửi các ký tự đầu tiên về Backend.
  - AI dự đoán nội dung (ví dụ: địa chỉ giao hàng, mô tả sản phẩm tương tự) và trả về danh sách gợi ý để người dùng chọn nhanh.

### 7.79. Bản Đồ Nhiệt Tương Tác Thời Gian Thực (Real-time Interaction Heatmaps)
- **Yêu cầu:** Cho phép Admin xem trực tiếp người dùng đang tương tác ở đâu trên trang web.
- **Logic:** 
  - Backend tổng hợp dữ liệu click/scroll thời gian thực từ hàng ngàn người dùng.
  - Cung cấp một lớp phủ (Overlay) trên Dashboard để Admin thấy các "vùng nóng" đang thu hút sự chú ý trong các phiên đấu giá lớn.

### 7.80. Tự Động Gợi Ý Khắc Phục Lỗi Trợ Năng (Automated Accessibility Fix Suggestions)
- **Yêu cầu:** Hỗ trợ người bán cải thiện tính tiếp cận cho gian hàng của họ.
- **Logic:** 
  - Backend quét các mô tả sản phẩm và hình ảnh do người bán tải lên.
  - Nếu thiếu Alt-text hoặc cấu trúc văn bản khó đọc, AI sẽ tự động soạn thảo bản sửa lỗi và gợi ý người bán: "Bạn có muốn thêm mô tả này để người khiếm thị dễ dàng mua hàng hơn không?".

## 8. Kiến Trúc Phi Tập Trung & Tối Ưu Hóa Tài Nguyên Phía Người Dùng (Decentralized Architecture & Client-Side Resource Optimization)

### 8.1. Phân Phối Luồng Livestream P2P (P2P Livestreaming via WebRTC)
- **Yêu cầu:** Giảm tải băng thông máy chủ bằng cách cho phép người xem chia sẻ luồng video với nhau.
- **Logic:** 
  - Backend đóng vai trò là "Signaling Server" để thiết lập kết nối giữa các người xem (Peers).
  - Sử dụng WebRTC Mesh hoặc Star topology để người dùng có băng thông tốt truyền dữ liệu video cho người dùng ở gần, giảm áp lực lên CDN trung tâm.

### 8.2. Lưu Trữ Tài Nguyên Phân Tán (Distributed Asset Caching)
- **Yêu cầu:** Sử dụng bộ nhớ local của người dùng để lưu trữ và chia sẻ các tài nguyên tĩnh (ảnh, script).
- **Logic:** 
  - Các tài nguyên phổ biến được lưu vào Cache API hoặc IndexedDB của người dùng.
  - Khi một người dùng mới cần tài nguyên đó, hệ thống ưu tiên tìm kiếm và tải từ các "Peers" đang online trong cùng mạng nội bộ hoặc khu vực địa lý trước khi tải từ Server.

### 8.3. Xử Lý AI Tại Chỗ (Local AI Inference via WebGPU/WASM)
- **Yêu cầu:** Giảm chi phí tính toán server bằng cách tận dụng GPU/CPU của người dùng để chạy các mô hình AI nhỏ.
- **Logic:** 
  - Backend phân phối các mô hình AI đã được tối ưu hóa (TensorFlow.js/ONNX) xuống trình duyệt.
  - Các tác vụ như: xóa phông nền ảnh, nhận diện vật thể cơ bản, hoặc lọc nhiễu âm thanh được thực hiện trực tiếp trên máy người dùng.

### 8.4. Tính Toán Biên Phía Client (Client-Side Edge Computing)
- **Yêu cầu:** Thực hiện các logic xử lý dữ liệu nặng ngay trên thiết bị người dùng.
- **Logic:** 
  - Thay vì gửi toàn bộ dữ liệu thô về Server để xử lý (ví dụ: phân tích file log lớn hoặc xử lý video), Backend gửi "scripts" xử lý xuống.
  - Client thực hiện tính toán và chỉ gửi kết quả cuối cùng về Server, giúp tiết kiệm băng thông và tài nguyên CPU của hệ thống.

### 8.5. Đồng Bộ Hóa Dữ Liệu P2P (P2P Data Synchronization)
- **Yêu cầu:** Giảm độ trễ và tải trọng Socket Server cho các tương tác nhóm nhỏ.
- **Logic:** 
  - Trong một phòng chat hoặc phiên đấu giá nhỏ, các người dùng thiết lập kênh dữ liệu P2P (WebRTC Data Channel).
  - Các tin nhắn hoặc trạng thái "đang gõ" được truyền trực tiếp giữa các máy khách, Backend chỉ lưu trữ bản ghi cuối cùng để đồng bộ hóa sau.

### 8.6. Cơ Sở Dữ Liệu Ngoại Tuyến Ưu Tiên (Offline-First Local Database)
- **Yêu cầu:** Cho phép ứng dụng hoạt động mượt mà ngay cả khi kết nối server không ổn định.
- **Logic:** 
  - Sử dụng IndexedDB làm cơ sở dữ liệu chính ở phía Client.
  - Mọi thay đổi được ghi vào local trước, sau đó một "Sync Worker" ở Backend sẽ quản lý việc gộp dữ liệu (Merge) và giải quyết xung đột khi có kết nối trở lại.

### 8.7. Chia Sẻ Tài Nguyên Tính Toán Có Thưởng (Incentivized Shared Computing)
- **Yêu cầu:** Tận dụng tài nguyên nhàn rỗi của người dùng để thực hiện các tác vụ nặng của hệ thống (ví dụ: render video, training AI).
- **Logic:** 
  - Người dùng có thể bật chế độ "Đóng góp tài nguyên" khi máy đang cắm sạc và nhàn rỗi.
  - Backend phân phối các gói công việc nhỏ (Tasks). Sau khi hoàn thành, người dùng nhận được điểm thưởng hoặc giảm phí giao dịch trên AmazeBid.

### 8.8. Chia Sẻ File Lớn Qua P2P (P2P Large File Sharing)
- **Yêu cầu:** Chuyển các file dữ liệu lớn (video 4K, bộ sưu tập ảnh) giữa người bán và người mua mà không qua Server.
- **Logic:** 
  - Thiết lập kết nối P2P trực tiếp để truyền file.
  - Backend chỉ quản lý việc xác thực, kiểm tra mã băm (Hash) để đảm bảo tính toàn vẹn của file và ghi lại lịch sử giao dịch.

### 8.9. Lưu Trữ Danh Tính Phi Tập Trung (Decentralized Identity Storage - DID)
- **Yêu cầu:** Tăng cường bảo mật và quyền riêng tư bằng cách lưu trữ thông tin định danh tại local.
- **Logic:** 
  - Các chứng chỉ xác thực và thông tin cá nhân nhạy cảm được lưu trữ trong "Secure Enclave" của thiết bị người dùng.
  - Backend chỉ lưu trữ các "Public Keys" và "Proofs" để xác minh danh tính mà không cần giữ dữ liệu gốc.

### 8.10. Mã Hóa Video/Hình Ảnh Tại Client (Client-Side Media Encoding)
- **Yêu cầu:** Giảm tải cho Server Transcoding và tăng tốc độ upload.
- **Logic:** 
  - Sử dụng WebAssembly (FFmpeg.wasm) để nén và chuyển đổi định dạng video/ảnh ngay trên trình duyệt trước khi upload.
  - Đảm bảo dữ liệu gửi lên Server đã ở định dạng tối ưu nhất, giúp người bán thấy kết quả ngay lập tức và Server không cần xử lý lại.

### 8.11. Mạng Lưới CDN P2P Cho Tài Nguyên Tĩnh (P2P-CDN for Static Assets)
- **Yêu cầu:** Tận dụng băng thông upload của người dùng để phân phối các file JS, CSS và Icons.
- **Logic:** 
  - Khi một người dùng tải xong các file thư viện nặng, họ trở thành một "Seed" trong mạng lưới.
  - Những người dùng mới truy cập sẽ ưu tiên tải các phần (chunks) của file từ các "Peers" lân cận qua WebRTC, giúp giảm chi phí CDN truyền thống lên đến 70%.

### 8.12. Chuyển Đổi Định Dạng Video Đa Luồng Tại Client (Client-Side Multi-Bitrate Transcoding)
- **Yêu cầu:** Tạo ra các phiên bản độ phân giải khác nhau (360p, 720p, 1080p) ngay trên máy người bán.
- **Logic:** 
  - Thay vì upload một file gốc khổng lồ, trình duyệt sử dụng tài nguyên CPU/GPU local để nén và chia nhỏ video thành các luồng HLS/DASH.
  - Người bán chỉ cần upload các luồng đã được xử lý, giúp video có thể xem được ngay lập tức ở mọi chất lượng mà không cần Server xử lý lại.

### 8.13. Chỉ Mục Metadata Phi Tập Trung (Decentralized Metadata Indexing)
- **Yêu cầu:** Cho phép tìm kiếm nhanh các sản phẩm đã xem hoặc trong bộ nhớ tạm mà không cần gọi API.
- **Logic:** 
  - Backend phân phối một bản chỉ mục (Index) thu nhỏ của các sản phẩm phổ biến xuống Client.
  - Frontend sử dụng các thư viện như FlexSearch hoặc Lunr.js để thực hiện tìm kiếm tức thì ngay trên máy người dùng, cực kỳ hữu ích khi mạng chập chờn.

### 8.14. Đồng Bộ Trạng Thái Đấu Giá P2P (P2P State Reconciliation for Auctions)
- **Yêu cầu:** Đảm bảo mọi người xem đều thấy giá mới nhất với độ trễ gần như bằng không.
- **Logic:** 
  - Trong các phiên đấu giá kịch tính, các máy khách tự động thiết lập mạng lưới P2P để lan truyền mức giá mới nhất cho nhau.
  - Backend đóng vai trò là trọng tài cuối cùng để xác nhận giao dịch, nhưng việc hiển thị giá được thực hiện qua mạng lưới P2P để đạt tốc độ ánh sáng.

### 8.15. Mạng Lưới Ad-hoc Cho Sự Kiện Đấu Giá Trực Tiếp (Localized Ad-hoc Networks)
- **Yêu cầu:** Hỗ trợ đấu giá tại các sự kiện offline (hội chợ, triển lãm) nơi sóng 4G/5G yếu.
- **Logic:** 
  - Các thiết bị người dùng trong cùng một khu vực địa lý tự kết nối với nhau qua Bluetooth hoặc Wi-Fi Direct.
  - Tạo thành một mạng lưới nội bộ để truyền tin nhắn đặt giá, sau đó chỉ cần một thiết bị có kết nối Internet mạnh nhất để đồng bộ toàn bộ dữ liệu lên Cloud.

### 8.16. Tiền Tải Tài Nguyên Dự Đoán Qua P2P (Predictive P2P Prefetching)
- **Yêu cầu:** Tải trước các sản phẩm người dùng sắp xem từ máy của những người dùng khác.
- **Logic:** 
  - AI dự đoán xu hướng xem của người dùng.
  - Thay vì tải từ Server, ứng dụng sẽ âm thầm tải dữ liệu từ bộ nhớ cache của các "Peers" đang online, giúp việc mở trang sản phẩm tiếp theo diễn ra trong tích tắc.

### 8.17. Xác Minh Tin Cậy Phi Tập Trung (Decentralized Trust Verification)
- **Yêu cầu:** Kiểm tra uy tín người bán dựa trên dữ liệu lưu trữ phân tán.
- **Logic:** 
  - Các đánh giá và lịch sử giao dịch được mã hóa và lưu trữ một phần tại máy của những người dùng đã từng giao dịch.
  - Khi người dùng mới muốn kiểm tra uy tín, họ yêu cầu các "Proofs" từ mạng lưới P2P, giúp ngăn chặn việc người bán tự tạo đánh giá giả trên Server.

### 8.18. Phân Phối Bản Cập Nhật Ứng Dụng Qua P2P (P2P Delta Updates)
- **Yêu cầu:** Giảm tải cho máy chủ khi có hàng triệu người cùng cập nhật phiên bản mới.
- **Logic:** 
  - Thay vì mọi người cùng tải từ Server, những người đã cập nhật xong sẽ chia sẻ các phần thay đổi (Delta) cho những người khác.
  - Giúp việc nâng cấp ứng dụng diễn ra nhanh chóng ngay cả trong giờ cao điểm.

### 8.19. Render 3D Sản Phẩm Chia Sẻ (Shared 3D Product Rendering)
- **Yêu cầu:** Hiển thị các mô hình 3D phức tạp mượt mà trên thiết bị yếu.
- **Logic:** 
  - Tận dụng sức mạnh tính toán của các thiết bị mạnh trong mạng lưới P2P để hỗ trợ render các khung hình (frames) cho các thiết bị yếu hơn ở gần.
  - Kết quả render được truyền qua WebRTC, cho phép mọi người dùng đều có trải nghiệm xem sản phẩm 3D/AR đỉnh cao.

### 8.20. Phân Tích Dữ Liệu Bảo Mật Tại Chỗ (Federated Learning for Analytics)
- **Yêu cầu:** Thu thập thông tin hành vi người dùng mà không cần gửi dữ liệu cá nhân về Server.
- **Logic:** 
  - Các mô hình học máy (Machine Learning) được huấn luyện trực tiếp trên máy người dùng dựa trên hành vi của họ.
  - Chỉ có các "trọng số" (weights) đã được ẩn danh được gửi về Backend để cải thiện hệ thống gợi ý chung, đảm bảo quyền riêng tư tuyệt đối cho người dùng.

### 8.21. Quy Trình Xử Lý Ảnh P2P (P2P Image Processing Pipeline)
- **Yêu cầu:** Chia sẻ gánh nặng xử lý bộ lọc và cải thiện chất lượng ảnh giữa các thiết bị.
- **Logic:** 
  - Khi một người bán tải lên hàng loạt ảnh, các máy khách nhàn rỗi trong mạng lưới có thể nhận các "tác vụ xử lý" nhỏ (như resize, nén, hoặc áp dụng bộ lọc AI).
  - Kết quả được gửi lại cho người bán hoặc trực tiếp lên Server, giúp đẩy nhanh tốc độ đăng sản phẩm mà không tốn tài nguyên Server.

### 8.22. Kiểm Duyệt Nội Dung Phi Tập Trung (Decentralized Content Moderation)
- **Yêu cầu:** Sử dụng AI tại chỗ để gắn cờ nội dung vi phạm trước khi nó được gửi lên máy chủ.
- **Logic:** 
  - Backend phân phối các mô hình kiểm duyệt (Moderation Models) xuống trình duyệt.
  - Khi người dùng soạn tin nhắn hoặc đăng sản phẩm, AI local sẽ kiểm tra hình ảnh/văn bản. Nếu phát hiện vi phạm, nó sẽ chặn ngay lập tức hoặc yêu cầu xác minh thêm, giúp giảm tải công việc kiểm duyệt thủ công ở Backend.

### 8.23. Chuyển Tiếp Tin Nhắn P2P Cho Người Dùng Bị Chặn Tường Lửa (P2P Message Relay)
- **Yêu cầu:** Đảm bảo kết nối thông suốt ngay cả khi mạng của người dùng bị hạn chế truy cập Server.
- **Logic:** 
  - Nếu một người dùng không thể kết nối trực tiếp đến Socket Server, họ có thể tìm kiếm các "Peers" lân cận có kết nối tốt.
  - Tin nhắn sẽ được chuyển tiếp qua các máy khách trung gian (Relay Peers) để đến được Server, đảm bảo tính sẵn sàng cao cho hệ thống.

### 8.24. Phân Mảnh Cơ Sở Dữ Liệu Tại Client (Client-Side Database Sharding)
- **Yêu cầu:** Lưu trữ các phần của danh mục sản phẩm toàn cầu trên máy của hàng triệu người dùng.
- **Logic:** 
  - Thay vì Server phải lưu và phục vụ toàn bộ dữ liệu, mỗi Client sẽ lưu trữ một "mảnh" (shard) dữ liệu dựa trên sở thích hoặc vị trí.
  - Khi cần tìm kiếm, mạng lưới P2P sẽ truy vấn các mảnh này, tạo thành một cơ sở dữ liệu khổng lồ, phân tán và cực kỳ khó bị đánh sập.

### 8.25. Hệ Thống Thu Thập Dữ Liệu P2P (P2P Search Crawler)
- **Yêu cầu:** Các máy khách tự động cập nhật và chia sẻ thông tin về các sản phẩm mới cho nhau.
- **Logic:** 
  - Khi một sản phẩm mới được đăng, thông tin sẽ được "lan truyền" (gossip) qua mạng lưới P2P.
  - Các máy khách tự xây dựng bản chỉ mục tìm kiếm local, giúp việc tìm kiếm các sản phẩm mới nhất diễn ra tức thì mà không cần chờ Server cập nhật chỉ mục toàn cầu.

### 8.26. Phát Hiện Gian Lận Tại Chỗ (Client-Side Fraud Detection)
- **Yêu cầu:** Phân tích các mẫu hành vi bất thường ngay trên thiết bị để phát hiện bot hoặc tài khoản giả.
- **Logic:** 
  - AI local theo dõi các tương tác vi mô (tốc độ gõ phím, quỹ đạo chuột) để xác định xem đó là người thật hay script.
  - Chỉ gửi các "tín hiệu nghi ngờ" về Backend để xử lý, giúp bảo vệ hệ thống khỏi các cuộc tấn công spam hoặc đẩy giá ảo một cách hiệu quả.

### 8.27. Tự Động Tạo Ảnh Thu Nhỏ Video P2P (P2P Video Thumbnail Generation)
- **Yêu cầu:** Giảm tải cho Server xử lý video bằng cách nhờ các máy khách tạo ảnh preview.
- **Logic:** 
  - Khi một video được chia sẻ qua mạng lưới P2P, các máy khách có cấu hình mạnh sẽ tự động trích xuất các khung hình đẹp nhất để làm ảnh thu nhỏ (thumbnails).
  - Các ảnh này được chia sẻ lại cho mạng lưới, giúp mọi người đều thấy preview video mà Server không tốn một giây xử lý nào.

### 8.28. Sổ Cái Uy Tín Phi Tập Trung (Decentralized Reputation Ledger)
- **Yêu cầu:** Lưu trữ điểm tin cậy của người dùng một cách minh bạch và khó bị thao túng.
- **Logic:** 
  - Điểm uy tín được tính toán và lưu trữ phân tán trên máy của những người dùng đã từng tương tác với nhau.
  - Hệ thống sử dụng thuật toán đồng thuận (Consensus) để xác minh điểm số, đảm bảo ngay cả khi Server bị tấn công, dữ liệu về sự tin cậy của cộng đồng vẫn an toàn.

### 8.29. Đấu Giá Tài Nguyên P2P (P2P Resource Auction)
- **Yêu cầu:** Người dùng có thể "đấu giá" băng thông hoặc tài nguyên CPU của mình cho người khác cần.
- **Logic:** 
  - Một người dùng cần tải file lớn nhanh có thể "trả phí" (bằng điểm thưởng) để thuê băng thông từ các máy khách lân cận.
  - Hệ thống tự động kết nối và điều phối việc truyền dữ liệu, tạo ra một thị trường tài nguyên nội bộ sôi động và hiệu quả.

### 8.30. Cân Bằng Tải Phân Tán (Distributed Load Balancing)
- **Yêu cầu:** Các máy khách tự động điều hướng yêu cầu đến các node Server hoặc Peers ít bận rộn nhất.
- **Logic:** 
  - Mỗi Client theo dõi độ trễ của các kết nối xung quanh.
  - Khi thực hiện một hành động, Client sẽ tự quyết định gửi yêu cầu đến Server chính, một Edge node, hay một Peer trung gian để đạt tốc độ nhanh nhất, giúp hệ thống tự động cân bằng tải mà không cần bộ điều phối trung tâm phức tạp.

### 8.31. Chế Độ "Sống Sót" Phi Tập Trung (Decentralized "Survival" Mode)
- **Yêu cầu:** Đảm bảo hệ thống vẫn hoạt động khi máy chủ trung tâm bị sập hoàn toàn (do cháy nổ, mất điện, hoặc tấn công mạng).
- **Logic:** 
  - Khi không thể kết nối tới Server, ứng dụng tự động chuyển sang chế độ P2P thuần túy.
  - Các máy khách tự bầu chọn các "Super-Peers" (máy có cấu hình mạnh, mạng ổn định) để tạm thời đóng vai trò là các node điều phối và lưu trữ dữ liệu tạm thời cho mạng lưới lân cận.

### 8.32. Cơ Sở Dữ Liệu Phân Tán Tự Phục Hồi (Self-Healing Distributed Database)
- **Yêu cầu:** Dữ liệu không bị mất ngay cả khi nhiều node (máy người dùng) bị ngắt kết nối đột ngột.
- **Logic:** 
  - Sử dụng thuật toán đồng thuận (như Raft hoặc Paxos) trên mạng lưới các máy khách để duy trì một sổ cái dữ liệu nhất quán.
  - Mỗi mảnh dữ liệu được nhân bản (replicated) trên ít nhất X máy khách khác nhau. Nếu một máy sập, hệ thống tự động tạo bản sao mới trên một máy khách khác để duy trì độ tin cậy.

### 8.33. Hệ Thống Định Danh P2P Dự Phòng (Fallback P2P Authentication)
- **Yêu cầu:** Người dùng vẫn có thể đăng nhập và xác thực quyền hạn khi Auth Server không hoạt động.
- **Logic:** 
  - Sử dụng chữ ký số (Digital Signatures) và Web Crypto API.
  - Các máy khách trong mạng lưới có thể xác minh danh tính của nhau dựa trên các chứng chỉ đã được ký trước đó bởi Server (khi còn online) hoặc qua mạng lưới tin cậy (Web of Trust).

### 8.34. Cổng Thanh Toán Nội Bộ P2P (P2P Internal Payment Gateway)
- **Yêu cầu:** Cho phép thực hiện giao dịch bằng điểm thưởng hoặc tiền điện tử nội bộ khi cổng thanh toán chính bị ngắt.
- **Logic:** 
  - Các giao dịch được ghi lại vào một chuỗi khối (Blockchain) mini chạy trên máy của những người tham gia phiên đấu giá.
  - Khi Server hoạt động trở lại, các giao dịch này sẽ được đồng bộ và xác nhận chính thức lên hệ thống trung tâm.

### 8.35. Khám Phá Dịch Vụ Không Cần Server (Serverless Peer Discovery)
- **Yêu cầu:** Các máy khách tự tìm thấy nhau mà không cần Signaling Server trung gian.
- **Logic:** 
  - Sử dụng các giao thức mDNS (Multicast DNS) trong mạng nội bộ hoặc DHT (Distributed Hash Tables) trên mạng diện rộng.
  - Người dùng có thể tham gia vào "vùng đấu giá" chỉ bằng cách ở gần các người dùng khác, tạo thành một mạng lưới mesh tự phát.

### 8.36. Lưu Trữ Trạng Thái Toàn Cầu Phân Tán (Distributed Global State Storage)
- **Yêu cầu:** Lưu trữ các thông tin quan trọng (giá hiện tại, thời gian còn lại) phân tán trên mọi máy khách.
- **Logic:** 
  - Mỗi máy khách tham gia đấu giá giữ một bản sao của "Trạng thái phiên" (Session State).
  - Khi có một lệnh đặt giá mới, nó được lan truyền (gossip) tới tất cả các máy khách. Hệ thống sử dụng thời gian logic (Lamport Timestamps) để đảm bảo thứ tự các lệnh đặt giá là công bằng và chính xác.

### 8.37. Hệ Thống Cảnh Báo Thảm Họa Tự Động (Automated Disaster Alert & Transition)
- **Yêu cầu:** Tự động phát hiện sự cố máy chủ và kích hoạt quy trình chuyển đổi sang P2P.
- **Logic:** 
  - Các máy khách liên tục giám sát sức khỏe của Server trung tâm.
  - Nếu 90% máy khách không thể kết nối tới Server trong 30 giây, hệ thống tự động phát lệnh "Chuyển đổi sang chế độ phi tập trung" tới toàn bộ mạng lưới.

### 8.38. Phân Phối Tài Nguyên Theo Ưu Tiên Thảm Họa (Disaster-Priority Resource Pooling)
- **Yêu cầu:** Ưu tiên băng thông và tài nguyên cho các giao dịch quan trọng nhất khi hệ thống đang ở chế độ dự phòng.
- **Logic:** 
  - Trong chế độ P2P, tài nguyên được ưu tiên cho việc truyền tin nhắn đặt giá và xác thực thanh toán.
  - Các tài nguyên nặng như video, ảnh chất lượng cao sẽ tự động bị tạm dừng hoặc giảm chất lượng để đảm bảo luồng nghiệp vụ cốt lõi không bị gián đoạn.

### 8.39. Hệ Thống "Hộp Đen" Phân Tán (Distributed Blackbox Logging)
- **Yêu cầu:** Ghi lại mọi sự kiện xảy ra trong lúc Server sập để phục vụ việc phục hồi sau thảm họa.
- **Logic:** 
  - Mọi hành động của người dùng trong chế độ P2P được ghi lại và ký số bởi các máy khách lân cận (Witnesses).
  - Khi Server online trở lại, "Hộp đen" này được upload lên để hệ thống phân tích và khôi phục lại trạng thái chính xác nhất của phiên đấu giá.

### 8.40. Phần Thưởng Cho "Nút Cứu Hộ" (Rescue Node Incentives)
- **Yêu cầu:** Khuyến khích người dùng duy trì kết nối và chia sẻ tài nguyên trong lúc xảy ra sự cố.
- **Logic:** 
  - Những người dùng đóng vai trò là "Rescue Nodes" (giúp duy trì mạng lưới khi Server sập) sẽ nhận được mức thưởng điểm cao gấp 5-10 lần bình thường.
  - Điều này đảm bảo hệ thống luôn có đủ "máy chủ tình nguyện" để duy trì hoạt động trong những tình huống khẩn cấp nhất.

### 8.41. Mạng Riêng Ảo P2P (P2P Virtual Private Network)
- **Yêu cầu:** Tạo kênh truyền tin bảo mật giữa các máy khách khi tường lửa của khu vực bị thắt chặt trong sự cố.
- **Logic:** 
  - Backend cung cấp các giao thức thiết lập đường hầm (tunneling) giữa các Peers.
  - Các máy khách tự thiết lập một mạng nội bộ ảo (Overlay Network) được mã hóa đầu cuối, giúp dữ liệu đấu giá lưu thông an toàn mà không bị can thiệp bởi các yếu tố bên ngoài.

### 8.42. Phân Phối Tài Nguyên Giao Diện Khẩn Cấp (Emergency dCDN)
- **Yêu cầu:** Đảm bảo giao diện ứng dụng vẫn hiển thị đầy đủ ngay cả khi máy chủ chứa source code bị tấn công.
- **Logic:** 
  - Các thành phần UI cốt lõi (HTML/JS/CSS) được phân mảnh và lưu trữ trên hàng ngàn máy khách (tương tự IPFS).
  - Khi trình duyệt không thể tải từ CDN chính, nó sẽ tự động truy vấn các mảnh này từ mạng lưới P2P để tái cấu trúc lại giao diện ứng dụng.

### 8.43. Đồng Thuận Giao Dịch Phi Tập Trung (P2P Transaction Finality)
- **Yêu cầu:** Xác nhận người thắng cuộc một cách công bằng mà không cần máy chủ trung tâm làm trọng tài.
- **Logic:** 
  - Sử dụng thuật toán đồng thuận Byzantine Fault Tolerance (BFT) giữa các máy khách tham gia phiên đấu giá.
  - Một giao dịch đặt giá được coi là "hợp lệ" khi có trên 66% số máy khách trong phiên xác nhận, ngăn chặn việc gian lận hoặc thay đổi giá trị khi Server sập.

### 8.44. Điều Phối Node Máy Chủ Ảo (Virtual Server Node Orchestration)
- **Yêu cầu:** Biến các máy tính cấu hình cao của người dùng thành các API Gateway tạm thời.
- **Logic:** 
  - Backend (khi còn online) đánh dấu các máy khách có tài nguyên dư thừa là "Potential Gateways".
  - Khi thảm họa xảy ra, các máy này tự động kích hoạt một container siêu nhẹ (WASM-based) để xử lý các logic API cơ bản cho các máy khách yếu hơn xung quanh.

### 8.45. Hệ Thống Tên Miền Phi Tập Trung (Decentralized DNS - dDNS)
- **Yêu cầu:** Tìm thấy các node hoạt động mà không cần thông qua các máy chủ DNS truyền thống.
- **Logic:** 
  - Sử dụng bảng băm phân tán (DHT) để ánh xạ ID người dùng với địa chỉ IP hiện tại.
  - Người dùng chỉ cần biết "ID phiên đấu giá" là có thể tìm thấy danh sách các IP của những người đang tham gia để kết nối, bất kể hạ tầng DNS toàn cầu có gặp sự cố hay không.

### 8.46. Đồng Bộ Trạng Thái Qua Giao Thức "Tin Đồn" (Gossip-based State Sync)
- **Yêu cầu:** Lan truyền thông tin giá mới nhất đến hàng triệu người dùng trong vài mil giây.
- **Logic:** 
  - Mỗi máy khách khi nhận được giá mới sẽ ngay lập tức gửi cho 3-5 máy khách ngẫu nhiên khác.
  - Với cơ chế lan truyền theo cấp số nhân, toàn bộ mạng lưới sẽ đạt được sự thống nhất về giá chỉ sau vài bước nhảy (hops), cực kỳ hiệu quả cho các phiên đấu giá quy mô lớn.

### 8.47. Chat Nhóm Mesh Khẩn Cấp (Emergency Mesh Chat)
- **Yêu cầu:** Duy trì kênh liên lạc giữa người mua và người bán khi máy chủ Chat bị phá hủy.
- **Logic:** 
  - Tin nhắn được truyền qua mạng lưới mesh giữa các thiết bị lân cận (qua Bluetooth/Wi-Fi) hoặc qua các node trung gian trên Internet.
  - Đảm bảo việc thương lượng và hỗ trợ khách hàng không bị gián đoạn trong mọi tình huống.

### 8.48. Xác Minh Danh Tính Qua Mạng Lưới Tin Cậy (Web of Trust Verification)
- **Yêu cầu:** Xác thực người dùng dựa trên sự bảo chứng của các người dùng khác.
- **Logic:** 
  - Trong chế độ P2P, nếu không thể liên hệ Auth Server, một người dùng có thể được xác thực nếu có X người dùng uy tín khác (đã được Server xác nhận trước đó) ký xác nhận danh tính cho họ.
  - Tạo ra một hệ thống bảo mật dựa trên cộng đồng, cực kỳ bền bỉ trước các cuộc tấn công vào hệ thống trung tâm.

### 8.49. Lưu Trữ Lịch Sử Đấu Giá Phân Mảnh (Encrypted History Shards)
- **Yêu cầu:** Bảo vệ dữ liệu lịch sử đấu giá bằng cách chia nhỏ và lưu trữ trên máy người dùng.
- **Logic:** 
  - Dữ liệu lịch sử được mã hóa, chia thành nhiều mảnh (shards) và phân tán cho cộng đồng lưu trữ.
  - Chỉ người sở hữu khóa bí mật mới có thể thu thập đủ các mảnh để giải mã và xem lại lịch sử, đảm bảo dữ liệu không bao giờ bị mất ngay cả khi Data Center bị cháy.

### 8.50. Tự Động Tái Hợp Nhất Dữ Liệu Sau Thảm Họa (Post-Disaster State Reintegration)
- **Yêu cầu:** Hợp nhất dữ liệu từ mạng lưới P2P vào máy chủ trung tâm sau khi khôi phục hạ tầng.
- **Logic:** 
  - Khi Server online trở lại, nó sẽ thực hiện quy trình "Reconciliation" (Đối soát).
  - Server thu thập các bằng chứng giao dịch (Signed Proofs) từ các máy khách, kiểm tra tính hợp lệ và cập nhật lại cơ sở dữ liệu chính thức, đảm bảo tính toàn vẹn dữ liệu sau sự cố.

## 9. Giải Pháp Lưu Trữ & Xử Lý Dữ Liệu Khối Lượng Lớn (Big Data & Advanced Storage Solutions)

### 9.1. Kiến Trúc Hồ Dữ Liệu (Data Lake Architecture)
- **Yêu cầu:** Lưu trữ khối lượng lớn dữ liệu thô (logs, hành vi người dùng, media) để phân tích lâu dài.
- **Logic:** 
  - Backend sử dụng các giải pháp như Amazon S3 hoặc Google Cloud Storage để tạo Data Lake.
  - Dữ liệu được phân loại theo định dạng (Parquet, Avro) để tối ưu hóa việc truy vấn bằng các công cụ như Presto hoặc Athena.

### 9.2. Phân Lớp Dữ Liệu Tự Động (Automated Data Tiering)
- **Yêu cầu:** Tối ưu hóa chi phí lưu trữ bằng cách di chuyển dữ liệu ít dùng đến các lớp lưu trữ rẻ hơn.
- **Logic:** 
  - Dữ liệu "nóng" (phiên đấu giá đang diễn ra) được lưu trong RAM/SSD.
  - Dữ liệu "ấm" (lịch sử gần đây) lưu trong HDD.
  - Dữ liệu "lạnh" (lịch sử từ nhiều năm trước) tự động được đẩy vào Cold Storage (Glacier/Archive).

### 9.3. Xử Lý Luồng Dữ Liệu Thời Gian Thực (Real-time Stream Processing)
- **Yêu cầu:** Phân tích hàng triệu sự kiện (clicks, bids) mỗi giây để đưa ra quyết định tức thì.
- **Logic:** 
  - Sử dụng Apache Kafka hoặc Google Pub/Sub làm hệ thống hàng đợi thông điệp.
  - Các worker sử dụng Apache Flink hoặc Spark Streaming để phát hiện các mẫu (patterns) như: xu hướng giá tăng đột biến, hoặc hành vi tấn công DDoS.

### 9.4. Nén Dữ Liệu Thông Minh (Intelligent Data Compression)
- **Yêu cầu:** Giảm dung lượng lưu trữ mà không làm ảnh hưởng đến hiệu suất truy cập.
- **Logic:** 
  - Áp dụng các thuật toán nén hiện đại (Zstandard, Brotli) dựa trên loại dữ liệu.
  - Đối với dữ liệu chuỗi thời gian (Time-series) của giá đấu, sử dụng nén Delta-encoding để giảm tới 90% dung lượng.

### 9.5. Phân Mảnh Cơ Sở Dữ Liệu Động (Dynamic Database Sharding)
- **Yêu cầu:** Mở rộng khả năng ghi của cơ sở dữ liệu khi số lượng người dùng tăng vọt.
- **Logic:** 
  - Tự động chia nhỏ cơ sở dữ liệu (Sharding) dựa trên ID người dùng hoặc khu vực địa lý.
  - Một "Sharding Proxy" quản lý việc điều hướng truy vấn đến đúng mảnh dữ liệu, đảm bảo hệ thống có thể xử lý hàng trăm nghìn giao dịch mỗi giây.

### 9.6. Hệ Thống Chỉ Mục Tìm Kiếm Phân Tán (Distributed Search Indexing)
- **Yêu cầu:** Tìm kiếm sản phẩm trong hàng tỷ bản ghi với độ trễ dưới 100ms.
- **Logic:** 
  - Sử dụng Elasticsearch hoặc Meilisearch cluster để đánh chỉ mục dữ liệu.
  - Áp dụng kỹ thuật "Index Partitioning" để chia nhỏ chỉ mục, giúp việc tìm kiếm diễn ra song song trên nhiều node máy chủ.

### 9.7. Xử Lý Dữ Liệu Theo Lô Hiệu Suất Cao (High-Performance Batch Processing)
- **Yêu cầu:** Tính toán các báo cáo tài chính và thống kê thị trường khổng lồ định kỳ.
- **Logic:** 
  - Sử dụng mô hình MapReduce để chia nhỏ các tác vụ tính toán nặng.
  - Backend điều phối hàng ngàn container chạy song song để hoàn thành việc xử lý dữ liệu hàng Terabyte trong vài phút.

### 9.8. Lưu Trữ Dữ Liệu Đồ Thị (Graph Data Storage)
- **Yêu cầu:** Phân tích các mối quan hệ phức tạp giữa người dùng, sản phẩm và sở thích.
- **Logic:** 
  - Sử dụng cơ sở dữ liệu đồ thị (Neo4j hoặc AWS Neptune) để lưu trữ mạng lưới tương tác.
  - Giúp AI đưa ra các gợi ý "Người dùng giống bạn cũng thích..." hoặc phát hiện các nhóm "đẩy giá ảo" có mối liên hệ ngầm với nhau.

### 9.9. Hệ Thống Cache Đa Lớp (Multi-level Caching Strategy)
- **Yêu cầu:** Giảm tải tối đa cho cơ sở dữ liệu chính.
- **Logic:** 
  - Lớp 1: Local Cache (trong bộ nhớ ứng dụng).
  - Lớp 2: Distributed Cache (Redis/Memcached).
  - Lớp 3: CDN Cache (cho các response API tĩnh).
  - Sử dụng cơ chế "Cache Invalidation" thông minh qua WebSockets để đảm bảo dữ liệu cache luôn mới nhất.

### 9.10. Tự Động Sao Lưu & Phục Hồi Điểm Thời Gian (Point-in-Time Recovery - PITR)
- **Yêu cầu:** Khôi phục dữ liệu về bất kỳ thời điểm nào trong quá khứ nếu có sự cố.
- **Logic:** 
  - Backend thực hiện "Continuous Backup" (sao lưu liên tục) các thay đổi dữ liệu (Write-Ahead Logs).
  - Cung cấp giao diện cho Admin để "quay ngược thời gian" hệ thống về trước thời điểm xảy ra lỗi hoặc tấn công mạng.

### 9.11. Ẩn Danh Dữ Liệu Tự Động Cho Phân Tích (Automated Data Anonymization)
- **Yêu cầu:** Đảm bảo quyền riêng tư khi xuất dữ liệu khối lượng lớn cho các bên thứ ba hoặc đội ngũ phân tích.
- **Logic:** 
  - Backend tích hợp quy trình ETL (Extract, Transform, Load) tự động nhận diện và che giấu (masking) hoặc băm (hashing) các thông tin định danh cá nhân (PII).
  - Dữ liệu trong Data Lake luôn ở trạng thái an toàn, sẵn sàng cho việc huấn luyện AI mà không vi phạm quy định bảo mật.

### 9.12. Tối Ưu Hóa Truy Xuất Dữ Liệu Lạnh (Cold Storage Retrieval Optimization)
- **Yêu cầu:** Giảm thời gian chờ đợi khi cần lấy lại dữ liệu từ các lớp lưu trữ lưu trữ lâu đời.
- **Logic:** 
  - Backend duy trì một "Metadata Index" cực nhẹ cho toàn bộ dữ liệu lạnh.
  - Khi có yêu cầu, hệ thống dự đoán các file liên quan và thực hiện "Pre-warming" (làm nóng trước) dữ liệu từ Glacier về SSD, giúp rút ngắn thời gian phản hồi từ hàng giờ xuống hàng phút.

### 9.13. Sao Chép Dữ Liệu Đa Vùng Địa Lý (Multi-Region Data Replication)
- **Yêu cầu:** Đảm bảo dữ liệu luôn khả dụng và có độ trễ thấp cho người dùng toàn cầu.
- **Logic:** 
  - Sử dụng cơ chế "Global Database" để đồng bộ hóa dữ liệu giữa các trung tâm dữ liệu (Data Centers) tại Châu Á, Châu Âu và Mỹ.
  - Áp dụng chiến lược "Read Local, Write Global" để người dùng luôn truy cập dữ liệu từ node gần nhất.

### 9.14. Kiểm Tra Tính Nhất Quán Dữ Liệu Phân Mảnh (Cross-Shard Consistency Checks)
- **Yêu cầu:** Đảm bảo không có sự sai lệch dữ liệu giữa các mảnh (shards) cơ sở dữ liệu khác nhau.
- **Logic:** 
  - Backend chạy các "Background Auditors" định kỳ để so khớp checksum giữa các shards.
  - Nếu phát hiện sai lệch (ví dụ: tổng số dư ví không khớp với lịch sử giao dịch), hệ thống tự động khóa tài khoản nghi vấn và tạo cảnh báo khẩn cấp.

### 9.15. Tiến Hóa Schema Tự Động (Automated Schema Evolution)
- **Yêu cầu:** Cập nhật cấu trúc dữ liệu mà không làm gián đoạn hệ thống đang chạy.
- **Logic:** 
  - Backend sử dụng các công cụ quản lý phiên bản schema (như Flyway hoặc Liquibase).
  - Hỗ trợ "Blue-Green Deployment" cho cơ sở dữ liệu, cho phép phiên bản code cũ và mới cùng hoạt động song song trên các cấu trúc dữ liệu khác nhau trong quá trình chuyển đổi.

### 9.16. Đường Ống Trực Quan Hóa Dữ Liệu Thời Gian Thực (Real-time Data Visualization Pipeline)
- **Yêu cầu:** Cung cấp các biểu đồ thống kê biến động tức thì cho Dashboard của Admin.
- **Logic:** 
  - Dữ liệu từ Kafka được đẩy trực tiếp vào các cơ sở dữ liệu OLAP (như ClickHouse hoặc Druid).
  - Frontend kết nối qua WebSocket để nhận các bản cập nhật biểu đồ (Aggregated Data) mà không cần thực hiện các truy vấn nặng nề vào DB chính.

### 9.17. Dự Báo Quy Mô Lưu Trữ Bằng AI (Predictive Storage Scaling)
- **Yêu cầu:** Tự động mở rộng tài nguyên lưu trữ trước khi hệ thống bị đầy.
- **Logic:** 
  - AI phân tích tốc độ tăng trưởng dữ liệu hàng ngày.
  - Tự động kích hoạt việc cấp phát thêm ổ đĩa hoặc tạo thêm shards mới khi dự báo dung lượng sẽ đạt ngưỡng 80% trong vòng 24 giờ tới.

### 9.18. Tuân Thủ Chủ Quyền Dữ Liệu (Data Sovereignty & Compliance)
- **Yêu cầu:** Đáp ứng các yêu cầu pháp lý khắt khe về việc lưu trữ dữ liệu tại quốc gia bản địa (GDPR, CCPA).
- **Logic:** 
  - Backend tự động điều hướng việc lưu trữ dữ liệu người dùng vào các vùng (regions) được chỉ định dựa trên quốc tịch của họ.
  - Cung cấp công cụ "Right to be Forgotten" để xóa sạch mọi dấu vết dữ liệu của người dùng trên tất cả các lớp lưu trữ (nóng, ấm, lạnh) chỉ bằng một lệnh.

### 9.19. Loại Bỏ Dữ Liệu Trùng Lặp Khối Lượng Lớn (Global Data Deduplication)
- **Yêu cầu:** Tiết kiệm dung lượng lưu trữ cho các file media (ảnh, video) bị upload trùng lặp.
- **Logic:** 
  - Backend tính toán mã băm (Content Hash) cho mọi file được tải lên.
  - Nếu file đã tồn tại trong hệ thống, Backend chỉ lưu một bản ghi tham chiếu (Reference) thay vì lưu file mới, giúp tiết kiệm tới 40% dung lượng lưu trữ media.

### 9.20. Theo Dõi Nguồn Gốc Dữ Liệu Nâng Cao (Advanced Data Lineage Tracking)
- **Yêu cầu:** Biết chính xác một mẩu dữ liệu được tạo ra, biến đổi và di chuyển như thế nào trong hệ thống.
- **Logic:** 
  - Backend gắn "Metadata Tags" cho mọi bản ghi dữ liệu, ghi lại ID của worker và thời gian xử lý ở mỗi bước.
  - Cung cấp bản đồ trực quan (Lineage Map) để Admin có thể truy vết nguyên nhân gốc rễ nếu phát hiện dữ liệu bị sai lệch ở cuối đường ống xử lý.

### 9.21. Phân Tích Dự Đoán Tải Trọng Hệ Thống (Predictive Load Analytics)
- **Yêu cầu:** Sử dụng Big Data để dự báo các đợt cao điểm đấu giá và tự động chuẩn bị tài nguyên.
- **Logic:** 
  - AI phân tích dữ liệu lịch sử của hàng triệu phiên đấu giá để tìm ra các quy luật về thời gian và loại sản phẩm thu hút người dùng.
  - Backend tự động mở rộng (scale-up) các cụm xử lý dữ liệu trước khi đợt cao điểm bắt đầu 15-30 phút.

### 9.22. Hệ Thống Quản Lý Metadata Quy Mô Lớn (Hyper-scale Metadata Management)
- **Yêu cầu:** Quản lý hàng tỷ thuộc tính sản phẩm mà không làm chậm hệ thống tìm kiếm.
- **Logic:** 
  - Sử dụng kiến trúc "Metadata Store" riêng biệt dựa trên cơ sở dữ liệu NoSQL có độ trễ cực thấp (như ScyllaDB hoặc Cassandra).
  - Tách biệt dữ liệu nghiệp vụ chính và dữ liệu mô tả để tối ưu hóa tốc độ đọc/ghi.

### 9.23. Tự Động Phát Hiện Dữ Liệu Bất Thường (Automated Data Anomaly Detection)
- **Yêu cầu:** Phát hiện các lỗi dữ liệu hoặc hành vi gian lận tinh vi trong khối lượng dữ liệu khổng lồ.
- **Logic:** 
  - Chạy các mô hình học máy không giám sát (Unsupervised Learning) trên luồng dữ liệu thời gian thực.
  - Tự động gắn cờ các giao dịch hoặc thay đổi dữ liệu có dấu hiệu bất thường để đội ngũ bảo mật kiểm tra ngay lập tức.

### 9.24. Nén Video Dựa Trên Nội Dung (Content-Aware Video Compression)
- **Yêu cầu:** Giảm dung lượng video livestream mà vẫn giữ được chất lượng ở những vùng quan trọng.
- **Logic:** 
  - AI phân tích từng khung hình video để xác định vùng chứa sản phẩm đấu giá.
  - Áp dụng tỷ lệ nén cao cho vùng nền và giữ nguyên chất lượng cho vùng sản phẩm, giúp tiết kiệm tới 50% băng thông truyền tải.

### 9.25. Lưu Trữ Dữ Liệu Theo Cấu Trúc Cột (Columnar Storage for Analytics)
- **Yêu cầu:** Tăng tốc độ truy vấn báo cáo trên hàng tỷ dòng dữ liệu.
- **Logic:** 
  - Chuyển đổi dữ liệu từ dạng hàng (Row-based) sang dạng cột (Columnar - như Parquet hoặc ClickHouse) cho các mục đích phân tích.
  - Giúp việc tính toán các hàm tổng hợp (SUM, AVG, COUNT) diễn ra nhanh hơn hàng trăm lần so với DB truyền thống.

### 9.26. Hệ Thống Gợi Ý Dựa Trên Đồ Thị Thời Gian Thực (Real-time Graph-based Recommendations)
- **Yêu cầu:** Đưa ra gợi ý sản phẩm dựa trên hành vi của những người dùng có mối liên hệ ngầm.
- **Logic:** 
  - Kết hợp dữ liệu từ Graph Database và luồng sự kiện thời gian thực.
  - Nếu người dùng A và B thường xuyên đấu giá cùng một loại sản phẩm, hệ thống sẽ ngay lập tức gợi ý sản phẩm mà B đang xem cho A.

### 9.27. Quản Lý Vòng Đời Dữ Liệu Dựa Trên AI (AI-Driven Data Lifecycle Management)
- **Yêu cầu:** Tự động quyết định khi nào dữ liệu nên được xóa hoặc di chuyển vào kho lưu trữ lạnh.
- **Logic:** 
  - AI phân tích tần suất truy cập thực tế của từng bản ghi dữ liệu.
  - Thay vì dựa trên quy tắc thời gian cố định, hệ thống tự động di chuyển các dữ liệu "nguội" sớm hơn để tối ưu hóa không gian lưu trữ SSD.

### 9.28. Trích Xuất Đặc Trưng Hình Ảnh Quy Mô Lớn (Large-scale Image Feature Extraction)
- **Yêu cầu:** Tìm kiếm sản phẩm bằng hình ảnh trong kho dữ liệu hàng triệu item.
- **Logic:** 
  - Backend sử dụng các mô hình Deep Learning để chuyển đổi hình ảnh thành các vector đặc trưng (Embeddings).
  - Lưu trữ các vector này trong Vector Database (như Milvus hoặc Pinecone) để thực hiện tìm kiếm tương đồng (Similarity Search) cực nhanh.

### 9.29. Hệ Thống Log Tập Trung & Phân Tích Lỗi AI (Centralized Logging & AI Log Analysis)
- **Yêu cầu:** Quản lý và tìm ra nguyên nhân gốc rễ của lỗi trong hàng Terabyte logs mỗi ngày.
- **Logic:** 
  - Thu thập logs từ hàng ngàn microservices vào một cụm ELK hoặc Splunk.
  - AI tự động phân loại logs và cảnh báo các chuỗi sự kiện dẫn đến lỗi hệ thống trước khi nó xảy ra.

### 9.30. Tối Ưu Hóa Truy Vấn Tự Động (Automated Query Optimization)
- **Yêu cầu:** Tự động điều chỉnh các câu lệnh SQL/NoSQL để đạt hiệu suất cao nhất.
- **Logic:** 
  - Backend theo dõi các truy vấn chạy chậm và phân tích kế hoạch thực thi (Execution Plan).
  - AI tự động đề xuất hoặc tạo thêm các chỉ mục (Indexes) cần thiết, hoặc gợi ý viết lại câu lệnh để giảm tải cho CPU.

### 9.31. Chống Phân Mảnh Dữ Liệu Lạnh (Cold-Data Defragmentation)
- **Yêu cầu:** Tối ưu hóa cấu trúc lưu trữ cho dữ liệu cũ để tăng tốc độ truy xuất khi cần.
- **Logic:** 
  - Backend định kỳ chạy các tác vụ "Compaction" để gộp các file nhỏ thành các khối lớn hơn trong kho lưu trữ lạnh.
  - Giảm số lượng yêu cầu I/O và tiết kiệm chi phí truy xuất dữ liệu từ các lớp lưu trữ như Glacier.

### 9.32. Loại Bỏ Dữ Liệu Trùng Lặp Theo Ngữ Nghĩa (Semantic Data Deduplication)
- **Yêu cầu:** Nhận diện và loại bỏ các nội dung tương tự nhau (không chỉ trùng khớp 100%) để tiết kiệm không gian.
- **Logic:** 
  - Sử dụng AI để so sánh nội dung văn bản hoặc hình ảnh dựa trên ý nghĩa (Semantics).
  - Nếu hai mô tả sản phẩm gần như giống hệt nhau, hệ thống chỉ lưu trữ một bản và các biến thể nhỏ, giúp tối ưu hóa Data Lake.

### 9.33. Đánh Giá Chất Lượng Dữ Liệu Thời Gian Thực (Real-time Data Quality Scoring)
- **Yêu cầu:** Đảm bảo dữ liệu đi vào hệ thống luôn sạch và chính xác.
- **Logic:** 
  - Tích hợp các bộ kiểm tra (Validators) vào đường ống Kafka.
  - Mỗi mẩu dữ liệu được gắn một "Quality Score". Nếu điểm quá thấp (ví dụ: thiếu trường quan trọng hoặc sai định dạng), dữ liệu sẽ bị đẩy vào vùng cách ly để xử lý thủ công.

### 9.34. Danh Mục Dữ Liệu Tự Động (Automated Data Cataloging)
- **Yêu cầu:** Giúp đội ngũ kỹ thuật dễ dàng tìm kiếm và hiểu các nguồn dữ liệu khổng lồ.
- **Logic:** 
  - AI tự động quét Data Lake để tạo ra các bản mô tả (Metadata) cho từng bảng và trường dữ liệu.
  - Cung cấp một giao diện tìm kiếm nội bộ để biết chính xác "Dữ liệu doanh thu nằm ở đâu và có ý nghĩa gì".

### 9.35. Phát Lại Sự Kiện Quy Mô Lớn (High-Volume Event Replay)
- **Yêu cầu:** Tái hiện lại các kịch bản quá khứ để tìm lỗi hoặc tính toán lại các chỉ số thống kê.
- **Logic:** 
  - Backend cho phép "tua lại" luồng dữ liệu từ Kafka về một thời điểm bất kỳ trong quá khứ.
  - Các worker sẽ xử lý lại toàn bộ sự kiện như thể chúng đang xảy ra ở hiện tại, giúp kiểm tra tính chính xác của các thuật toán mới.

### 9.36. Cách Ly Dữ Liệu Đa Người Dùng Quy Mô Lớn (Multi-Tenant Data Isolation at Scale)
- **Yêu cầu:** Đảm bảo tuyệt đối không có sự rò rỉ dữ liệu giữa các người bán hoặc khu vực.
- **Logic:** 
  - Sử dụng cơ chế "Logical Partitioning" kết hợp với mã hóa khóa riêng cho từng Tenant (người bán lớn).
  - Ngay cả khi có lỗi trong câu lệnh truy vấn, lớp bảo mật hạ tầng sẽ chặn đứng việc truy cập dữ liệu không thuộc quyền sở hữu.

### 9.37. Lấy Mẫu Dữ Liệu Thông Minh (Intelligent Data Sampling)
- **Yêu cầu:** Phân tích nhanh các tập dữ liệu hàng Terabyte mà không cần quét toàn bộ.
- **Logic:** 
  - AI tự động chọn ra một tập con (Sample) mang tính đại diện cao nhất cho toàn bộ dữ liệu.
  - Giúp các báo cáo xu hướng được tạo ra trong vài giây với độ chính xác trên 99% thay vì phải chờ đợi hàng giờ.

### 9.38. Theo Dõi Nguồn Gốc Dữ Liệu Đa Nền Tảng (Cross-Platform Data Lineage)
- **Yêu cầu:** Truy vết dữ liệu khi nó di chuyển qua nhiều dịch vụ đám mây khác nhau.
- **Logic:** 
  - Backend gắn nhãn (Tags) đồng nhất cho dữ liệu từ lúc ở AWS, qua Google Cloud để xử lý AI, và về lại Azure để lưu trữ.
  - Cung cấp cái nhìn xuyên suốt về hành trình của dữ liệu trong hệ sinh thái Multi-cloud.

### 9.39. Tiến Hóa Mô Hình Phát Hiện Gian Lận Tức Thì (Real-time Fraud Pattern Evolution)
- **Yêu cầu:** Cập nhật các quy tắc chống gian lận ngay khi phát hiện thủ đoạn mới.
- **Logic:** 
  - AI liên tục học hỏi từ các giao dịch bị gắn cờ và tự động tạo ra các "Feature Engineering" mới.
  - Các quy tắc bảo mật được cập nhật vào hệ thống xử lý luồng (Stream Processing) mà không cần khởi động lại server.

### 9.40. Quản Trị Dữ Liệu Tự Động (Automated Data Governance)
- **Yêu cầu:** Tự động thực thi các chính sách bảo mật và lưu trữ trên toàn bộ hệ thống.
- **Logic:** 
  - Backend sử dụng các "Policy Engines" để quét toàn bộ Data Lake.
  - Tự động xóa dữ liệu hết hạn, mã hóa các trường nhạy cảm bị bỏ sót, và báo cáo các vi phạm chính sách cho Admin.

## 10. Kiến Trúc Dữ Liệu Ưu Tiên Quyền Riêng Tư & Lưu Trữ Tại Chỗ (Privacy-First & Local-Only Data Architecture)

### 10.1. Lưu Trữ Thông Tin Nhạy Cảm Tuyệt Đối Tại Local (Local-Only Sensitive Vault)
- **Yêu cầu:** Đảm bảo các thông tin cực kỳ quan trọng (như khóa bí mật, ghi chú cá nhân, lịch sử tìm kiếm nhạy cảm) không bao giờ rời khỏi máy người dùng.
- **Logic:** 
  - Frontend sử dụng IndexedDB hoặc File System Access API để lưu trữ dữ liệu này trong một phân vùng được mã hóa.
  - Backend hoàn toàn không có API để truy cập hoặc đồng bộ hóa các dữ liệu này, đảm bảo quyền riêng tư tuyệt đối ngay cả khi Server bị xâm nhập.

### 10.2. Xác Thực Không Tiết Lộ Thông Tin (Zero-Knowledge Proofs - ZKP)
- **Yêu cầu:** Xác minh quyền hạn hoặc thông tin người dùng mà không cần gửi dữ liệu gốc về Server.
- **Logic:** 
  - Người dùng chứng minh mình đủ điều kiện (ví dụ: trên 18 tuổi hoặc có đủ số dư) thông qua một bằng chứng toán học (Proof).
  - Backend chỉ xác minh tính đúng đắn của bằng chứng mà không bao giờ biết được ngày sinh hay số dư thực tế của người dùng.

### 10.3. Mã Hóa Đầu Cuối Với Khóa Do Người Dùng Giữ (User-Managed End-to-End Encryption)
- **Yêu cầu:** Chỉ người dùng mới có thể đọc được dữ liệu của chính mình, ngay cả Admin cũng không xem được.
- **Logic:** 
  - Dữ liệu được mã hóa tại Client bằng khóa được tạo từ mật khẩu của người dùng.
  - Backend chỉ lưu trữ các khối dữ liệu đã mã hóa (Ciphertext). Khóa giải mã không bao giờ được gửi lên Server.

### 10.4. Xử Lý Dữ Liệu Tạm Thời Tại RAM (Ephemeral In-Memory Processing)
- **Yêu cầu:** Xử lý các thông tin nhạy cảm trong quá trình đấu giá mà không lưu lại dấu vết trên ổ đĩa.
- **Logic:** 
  - Các thông tin như giá thầu dự kiến hoặc chiến thuật đấu giá được xử lý hoàn toàn trong bộ nhớ RAM của Client.
  - Dữ liệu tự động bị xóa sạch ngay khi trình duyệt đóng lại hoặc phiên làm việc kết thúc, không để lại dấu vết trong logs hay database.

### 10.5. Nhật Ký Kiểm Toán Tại Chỗ (Local-Only Audit Logs)
- **Yêu cầu:** Người dùng có thể kiểm tra lịch sử hoạt động của mình mà không cần Server ghi lại.
- **Logic:** 
  - Mọi hành động nhạy cảm được ghi vào một file log bí mật ngay trên thiết bị người dùng.
  - Người dùng có thể xem lại để phát hiện các truy cập trái phép vào tài khoản của mình mà không lo ngại thông tin này bị Server thu thập để quảng cáo.

### 10.6. Tổng Hợp Dữ Liệu Bảo Vệ Quyền Riêng Tư (Privacy-Preserving Data Aggregation)
- **Yêu cầu:** Thu thập thống kê chung mà không biết dữ liệu cụ thể của từng cá nhân.
- **Logic:** 
  - Sử dụng kỹ thuật "Differential Privacy" để thêm nhiễu vào dữ liệu trước khi gửi về Server.
  - Backend chỉ có thể tính toán được các xu hướng chung (ví dụ: 60% người dùng quan tâm đến đồng hồ) nhưng không thể biết chính xác người dùng A thích gì.

### 10.7. Tích Hợp Vùng An Toàn Phần Cứng (Secure Enclave Integration)
- **Yêu cầu:** Sử dụng chip bảo mật trên điện thoại/máy tính để bảo vệ thông tin định danh.
- **Logic:** 
  - Các thao tác ký số hoặc xác thực sinh trắc học được thực hiện bên trong Secure Enclave (như Apple T2 hoặc Android StrongBox).
  - Dữ liệu sinh trắc học và khóa bí mật không bao giờ rời khỏi vùng an toàn này, ngay cả hệ điều hành cũng không truy cập được.

### 10.8. Kho Lưu Trữ Ngoại Tuyến Vĩnh Viễn (Permanent Offline Vaults)
- **Yêu cầu:** Lưu trữ các tài liệu quan trọng liên quan đến giao dịch đấu giá chỉ trên thiết bị.
- **Logic:** 
  - Sau khi hoàn thành giao dịch, các hóa đơn hoặc chứng nhận số được tải về và lưu vào một "Vault" ngoại tuyến trên máy người dùng.
  - Hệ thống cung cấp công cụ để người dùng tự sao lưu (backup) thủ công ra USB hoặc ổ cứng ngoài mà không qua Cloud.

### 10.9. Thực Thi Giảm Thiểu Dữ Liệu Tự Động (Automated Data Minimization)
- **Yêu cầu:** Tự động xóa bỏ các thông tin không còn cần thiết ngay tại nguồn.
- **Logic:** 
  - Frontend có các worker chạy ngầm để quét và xóa các dữ liệu tạm, cookies, hoặc cache nhạy cảm sau một khoảng thời gian nhất định.
  - Đảm bảo máy người dùng luôn sạch sẽ và không lưu trữ thừa thãi các thông tin có thể bị khai thác.

### 10.10. Phân Tích Hành Vi Tại Chỗ (On-Device Behavioral Analytics)
- **Yêu cầu:** AI học hỏi sở thích người dùng để cá nhân hóa giao diện mà không gửi dữ liệu về Server.
- **Logic:** 
  - Mô hình AI nhỏ chạy trực tiếp trên trình duyệt để phân tích xem người dùng hay xem loại sản phẩm nào.
  - Kết quả được dùng để sắp xếp lại giao diện (SDUI) ngay tại máy khách, giúp trải nghiệm mượt mà và riêng tư tuyệt đối.

### 10.11. Lưu Trữ Mẫu Sinh Trắc Học Tuyệt Đối Tại Local (Local-Only Biometric Template Storage)
- **Yêu cầu:** Đảm bảo dữ liệu vân tay hoặc khuôn mặt không bao giờ rời khỏi thiết bị.
- **Logic:** 
  - Ứng dụng chỉ sử dụng các API xác thực của hệ điều hành (FaceID/TouchID).
  - Backend chỉ nhận được một "Token" xác nhận thành công, hoàn toàn không biết và không lưu trữ dữ liệu sinh trắc học gốc.

### 10.12. Quản Lý Khóa Phân Tán (Decentralized Key Management - DKMS)
- **Yêu cầu:** Chia nhỏ khóa giải mã dữ liệu để tăng cường bảo mật.
- **Logic:** 
  - Khóa giải mã được chia thành nhiều phần (Shards), một phần lưu ở máy người dùng, một phần ở thiết bị tin cậy khác (như đồng hồ thông minh).
  - Chỉ khi các thiết bị này ở gần nhau hoặc được xác nhận đồng thời, dữ liệu nhạy cảm mới có thể được giải mã tại local.

### 10.13. Tìm Kiếm Bảo Vệ Quyền Riêng Tư (Privacy-Preserving Search)
- **Yêu cầu:** Tìm kiếm thông tin cá nhân mà Server không biết người dùng đang tìm gì.
- **Logic:** 
  - Frontend tải một bản chỉ mục (Index) đã được mã hóa về máy.
  - Việc tìm kiếm và khớp kết quả diễn ra hoàn toàn tại Client. Server chỉ thấy các yêu cầu tải khối dữ liệu ngẫu nhiên.

### 10.14. Phân Vùng Dữ Liệu Local Cách Ly (Local Data Sandboxing)
- **Yêu cầu:** Ngăn chặn các thành phần khác của ứng dụng truy cập vào dữ liệu nhạy cảm.
- **Logic:** 
  - Sử dụng các kỹ thuật như Web Workers hoặc Iframe cách ly để xử lý dữ liệu quan trọng.
  - Đảm bảo ngay cả khi một thư viện bên thứ ba bị tấn công, nó cũng không thể đọc được dữ liệu trong "vùng an toàn" của Client.

### 10.15. Dữ Liệu Local Tự Hủy (Self-Destructing Local Data)
- **Yêu cầu:** Tự động xóa dữ liệu nhạy cảm sau khi hoàn thành một điều kiện nhất định.
- **Logic:** 
  - Người dùng có thể thiết lập: "Xóa lịch sử đấu giá này sau 1 giờ" hoặc "Xóa ngay sau khi thanh toán thành công".
  - Frontend đảm bảo việc xóa sạch (Wipe) dữ liệu khỏi bộ nhớ local mà không cần lệnh từ Server.

### 10.16. Xử Lý Thông Báo Tại Chỗ (Local-Only Notification Processing)
- **Yêu cầu:** Phân tích nội dung thông báo để hiển thị cảnh báo mà không gửi nội dung đó về Server.
- **Logic:** 
  - Các thông báo đẩy (Push Notifications) được gửi ở dạng mã hóa hoặc rút gọn.
  - Frontend giải mã và sử dụng AI local để quyết định xem có nên hiển thị cảnh báo "Giá thầu của bạn đã bị vượt" hay không, giữ cho nội dung thông báo luôn riêng tư.

### 10.17. Sao Lưu Local Mã Hóa Lên Đám Mây Cá Nhân (Encrypted Backup to Personal Cloud)
- **Yêu cầu:** Cho phép người dùng sao lưu dữ liệu mà không thông qua server của AmazeBid.
- **Logic:** 
  - Frontend hỗ trợ kết nối trực tiếp với Google Drive hoặc iCloud cá nhân của người dùng.
  - Dữ liệu được mã hóa bằng khóa của người dùng trước khi upload, đảm bảo AmazeBid không bao giờ chạm được vào bản sao lưu này.

### 10.18. Ký Số Tài Liệu Tại Chỗ (Local-Only Document Signing)
- **Yêu cầu:** Ký các hợp đồng đấu giá mà không gửi nội dung tài liệu đầy đủ lên Server.
- **Logic:** 
  - Tài liệu được hiển thị và ký số hoàn toàn tại Client.
  - Chỉ có mã băm (Hash) của tài liệu và chữ ký số được gửi về Backend để làm bằng chứng pháp lý, giữ cho nội dung hợp đồng luôn bí mật.

### 10.19. Quảng Cáo Ưu Tiên Quyền Riêng Tư (Privacy-First Ad-Targeting)
- **Yêu cầu:** Hiển thị gợi ý mua sắm phù hợp mà không cần xây dựng hồ sơ người dùng trên Server.
- **Logic:** 
  - Hồ sơ sở thích (Interest Profile) được xây dựng và lưu trữ duy nhất tại máy người dùng.
  - Frontend yêu cầu các danh mục quảng cáo chung từ Server và tự chọn hiển thị cái nào phù hợp nhất với hồ sơ local.

### 10.20. Giải Quyết Xung Đột Dữ Liệu Tại Chỗ (Local-Only Conflict Resolution)
- **Yêu cầu:** Hợp nhất các thay đổi dữ liệu từ nhiều thiết bị mà Server không nhìn thấy nội dung.
- **Logic:** 
  - Sử dụng các thuật toán CRDT (Conflict-free Replicated Data Types) tại Client.
  - Các thiết bị của cùng một người dùng tự trao đổi các bản cập nhật mã hóa và tự hợp nhất trạng thái cuối cùng mà không cần Server làm trung gian hòa giải.

---
*Tài liệu này là kim chỉ nam để đội ngũ Backend xây dựng hệ thống lõi phục vụ cho Frontend AmazeBid.*
