# ĐẶC TẢ GIAO DIỆN & CHỨC NĂNG FRONTEND - AMAZEBID
*Tài liệu chi tiết về cấu trúc trang, thành phần giao diện (UI) và trải nghiệm người dùng (UX) cho hệ thống đấu giá thế hệ mới AmazeBid.*

---

## 1. TỔNG QUAN KIẾN TRÚC GIAO DIỆN (UI ARCHITECTURE OVERVIEW)
- **Triết lý thiết kế:** Tối giản (Minimalist), Tập trung vào thời gian thực (Real-time Focus), Cá nhân hóa bằng AI (AI-Driven Personalization), và Ưu tiên quyền riêng tư (Privacy-First).
- **Công nghệ dự kiến:** React 18+ / Next.js, Tailwind CSS, Framer Motion (Animation), WebRTC (Livestream/P2P), WebGPU/WASM (Xử lý AI tại Client), IndexedDB (Local Storage).
- **Hệ thống Design System:** Hỗ trợ Dark/Light mode tự động, Responsive đa thiết bị (Mobile, Tablet, Desktop), và chế độ "Tiết kiệm dữ liệu/Băng thông thấp" (Low-Bandwidth Mode).

---

## 2. XÁC THỰC & ĐỊNH DANH (AUTHENTICATION & ONBOARDING)

### 2.1. Trang Đăng Nhập / Đăng Ký (Login / Register)
- **Đăng nhập không mật khẩu (Passwordless):** Hỗ trợ WebAuthn (Passkey, FaceID, TouchID) để đăng nhập nhanh và an toàn.
- **Xác thực P2P (Fallback):** Giao diện đăng nhập qua "Web of Trust" khi Auth Server bị sập (sử dụng chữ ký số local).
- **Đăng nhập mạng xã hội:** Google, Apple, Facebook.

### 2.2. Trang Định Danh & KYC (Identity Verification)
- **Chụp ảnh giấy tờ & Selfie:** Giao diện camera tích hợp AI kiểm tra chất lượng ảnh (chống chói, mờ) ngay tại trình duyệt trước khi upload.
- **Xác thực Zero-Knowledge (ZKP):** Giao diện cho phép người dùng chứng minh trên 18 tuổi hoặc đủ điều kiện tài chính mà không cần gửi dữ liệu thô về server.

### 2.3. Khôi Phục Tài Khoản (Account Recovery)
- **Quên mật khẩu:** Giao diện nhập email/SĐT nhận OTP.
- **Khôi phục qua Social Recovery:** Giao diện nhờ bạn bè/người thân (đã thiết lập trước) xác nhận để lấy lại quyền truy cập khi mất thiết bị.

---

## 3. KHU VỰC CÔNG CỘNG & KHÁM PHÁ (PUBLIC & DISCOVERY AREA)

### 3.1. Trang Chủ (Home Page)
- **Hero Section:** Banner động hiển thị các phiên đấu giá "bom tấn" đang diễn ra. Hình ảnh/Video banner được AI cá nhân hóa dựa trên sở thích lưu tại Local của người dùng.
- **Live Now Carousel:** Danh sách các phiên đấu giá đang phát trực tiếp. Hiển thị thumbnail động (tạo qua P2P), số người xem, và giá hiện tại nhảy số realtime.
- **Upcoming Auctions:** Lịch các phiên đấu giá sắp diễn ra. Nút "Nhắc tôi" (Lưu thông báo tại Local hoặc đồng bộ qua Cloud).
- **AI "For You" Feed:** Lưới sản phẩm được AI gợi ý. Giao diện dạng cuộn vô hạn (Infinite Scroll) với dữ liệu được tải trước (Prefetching) qua mạng lưới P2P.

### 3.2. Trang Tìm Kiếm & Khám Phá (Search & Explore)
- **Thanh tìm kiếm thông minh:** Hỗ trợ tìm kiếm bằng văn bản, giọng nói, và **Tìm kiếm bằng hình ảnh** (Trích xuất đặc trưng ảnh bằng AI ngay tại trình duyệt).
- **Bộ lọc động (Dynamic Filters):** Lọc theo danh mục, mức giá, tình trạng, độ uy tín của người bán.
- **Kết quả tìm kiếm:** Hiển thị dạng lưới hoặc danh sách. Hỗ trợ tìm kiếm ngoại tuyến (Offline Search) nhờ Decentralized Metadata Indexing lưu tại IndexedDB.

### 3.3. Trang Chi Tiết Sản Phẩm (Product Detail Page)
- **Thư viện Media:** Xem ảnh chất lượng cao, Video 360 độ, hoặc mô hình 3D/AR (Render chia sẻ qua P2P).
- **Thông tin sản phẩm:** Mô tả chi tiết, lịch sử nguồn gốc (Data Lineage/Blockchain proof).
- **Khu vực Đấu giá:** Đồng hồ đếm ngược, Giá hiện tại, Nút "Đặt giá nhanh" (Quick Bid).
- **Lịch sử đặt giá:** Danh sách ẩn danh các lượt đặt giá gần nhất.
- **Đánh giá & Uy tín:** Điểm uy tín của người bán được xác minh qua mạng lưới phi tập trung (Decentralized Trust Verification).

### 3.4. Hồ Sơ Công Khai Người Bán/Người Mua (Public Profile)
- **Thông tin cơ bản:** Avatar, Bio, Huy hiệu xác thực.
- **Cửa hàng (Storefront):** Danh sách các sản phẩm đang bán, đã bán (đối với người bán).
- **Đánh giá & Phản hồi (Reviews & Ratings):** Hiển thị các nhận xét từ người dùng khác.

---

## 4. TRẢI NGHIỆM ĐẤU GIÁ TRỰC TIẾP (LIVE AUCTION EXPERIENCE)

### 4.1. Phòng Đấu Giá Trực Tiếp (Live Auction Room)
- **Video Player (P2P WebRTC):** Trình phát video độ trễ siêu thấp. Có nút chuyển đổi chất lượng video (tự động điều chỉnh theo mạng).
- **Bidding Console (Bảng điều khiển đặt giá):**
  - Nút đặt giá khổng lồ với phản hồi xúc giác (Haptic feedback trên mobile).
  - Thanh trượt (Slider) để chọn mức giá muốn đặt.
  - Hiển thị độ trễ mạng (Ping) và trạng thái kết nối P2P.
- **Live Chat & Reactions:**
  - Khung chat thời gian thực. Tích hợp AI kiểm duyệt từ ngữ xấu ngay tại Client.
  - Thả tim, biểu tượng cảm xúc bay lượn trên màn hình (Render bằng Canvas/WebGL).
- **Bảng xếp hạng (Leaderboard):** Hiển thị top những người đang trả giá cao nhất (ẩn danh một phần).
- **Chế độ "Sống sót" (Survival Mode UI):** Khi mất kết nối Server, giao diện chuyển sang màu cảnh báo nhẹ, thông báo "Đang chạy trên mạng lưới P2P cộng đồng" nhưng vẫn cho phép đặt giá bình thường.

---

## 5. THANH TOÁN & ĐƠN HÀNG (CHECKOUT & ORDERS)

### 5.1. Giỏ Hàng & Thanh Toán (Cart & Checkout)
- **Tóm tắt đơn hàng:** Hiển thị sản phẩm trúng đấu giá, phí vận chuyển, thuế.
- **Phương thức thanh toán:** Thẻ tín dụng, Ví điện tử, Crypto, hoặc Điểm thưởng P2P.
- **Thanh toán P2P Khẩn cấp:** Giao diện thanh toán nội bộ qua Smart Contract/Mini-blockchain khi cổng thanh toán chính lỗi.

### 5.2. Theo Dõi Đơn Hàng (Order Tracking)
- **Timeline giao hàng:** Trạng thái từ lúc đóng gói đến khi nhận hàng.
- **Bản đồ trực tiếp (Live Map):** Theo dõi vị trí shipper (nếu có tích hợp).
- **Xác nhận nhận hàng:** Nút ký nhận điện tử (Ký số tại chỗ - Local-Only Document Signing).

### 5.3. Trung Tâm Khiếu Nại & Hoàn Tiền (Dispute & Refund Center)
- **Tạo khiếu nại:** Form upload hình ảnh/video bằng chứng (có nén tại client).
- **Tiến trình xử lý:** Theo dõi trạng thái giải quyết tranh chấp giữa người mua, người bán và Admin.

---

## 6. GIAO TIẾP & CỘNG ĐỒNG (SOCIAL & COMMUNITY)

### 6.1. Hộp Thư & Tin Nhắn (Inbox & Chat)
- **Danh sách hội thoại:** Phân loại tin nhắn từ hệ thống, người bán, và hỗ trợ viên.
- **Giao diện Chat:** Hỗ trợ gửi ảnh, video, voice note.
- **Chat Mesh Khẩn cấp (Emergency Mesh Chat):** Giao diện chat chuyển sang chế độ P2P (Bluetooth/Wi-Fi Direct) khi mất mạng Internet.
- **Mã hóa đầu cuối (E2EE):** Biểu tượng ổ khóa xác nhận tin nhắn chỉ người gửi và nhận mới đọc được.

### 6.2. Diễn Đàn & Cộng Đồng (Community Board)
- **Bảng tin (Feed):** Nơi người dùng chia sẻ kinh nghiệm đấu giá, review sản phẩm.
- **Bình luận & Thảo luận:** Giao diện thread lồng nhau (nested comments).

---

## 7. KHU VỰC NGƯỜI MUA & QUYỀN RIÊNG TƯ (BUYER & PRIVACY DASHBOARD)

### 7.1. Tổng quan Tài khoản (Account Overview)
- Thống kê cá nhân: Số phiên đã tham gia, Tỉ lệ thắng, Điểm uy tín người mua.
- Quản lý đơn hàng: Đang chờ thanh toán, Đang giao, Đã hoàn thành.

### 7.2. Ví & Thanh Toán (Wallet & Payments)
- Số dư khả dụng, Điểm thưởng (từ việc đóng góp tài nguyên P2P).
- Quản lý thẻ/tài khoản ngân hàng liên kết.

### 7.3. Cài Đặt Quyền Riêng Tư (Privacy & Security Settings)
- **Quản lý Dữ liệu:** Tùy chọn tải xuống toàn bộ dữ liệu cá nhân hoặc yêu cầu xóa dữ liệu (Right to be Forgotten).
- **Thiết lập P2P:** Bật/tắt việc chia sẻ tài nguyên máy tính (Băng thông, CPU) để kiếm điểm thưởng.

### 7.4. Két Sắt Local (Local-Only Vault) - *Tính năng Đặc biệt*
- **Giao diện bảo mật cao:** Yêu cầu xác thực sinh trắc học (FaceID/TouchID) để mở.
- **Quản lý Khóa (Key Management):** Nơi lưu trữ khóa giải mã cá nhân (DKMS).
- **Lịch sử Bí mật:** Xem lại các giao dịch, hóa đơn, hợp đồng đã ký số tại chỗ mà Server không hề biết.
- **Tự hủy dữ liệu:** Nút "Xóa sạch dấu vết" (Wipe Data) để dọn dẹp toàn bộ dữ liệu nhạy cảm trên thiết bị.

---

## 8. KHU VỰC NGƯỜI BÁN (SELLER STUDIO)

### 8.1. Bảng Điều Khiển Người Bán (Seller Dashboard)
- **Tổng quan:** Doanh thu hôm nay, số lượng đơn hàng cần xử lý, thông báo quan trọng.

### 8.2. Quản lý Sản phẩm & Kho hàng (Inventory Management)
- **Tạo sản phẩm mới:** Form nhập liệu thông minh. AI tự động gợi ý điền form (Autocomplete) và tối ưu hóa tiêu đề/mô tả.
- **Upload Media:** Giao diện kéo thả. Tích hợp nén ảnh/video và chuyển đổi định dạng đa luồng ngay tại trình duyệt (Client-Side Transcoding) trước khi upload.
- **Quản lý kho:** Theo dõi số lượng, trạng thái duyệt của sản phẩm, cảnh báo sắp hết hàng.

### 8.3. Studio Phát Sóng (Livestream Studio)
- **Màn hình Preview:** Xem trước luồng camera.
- **AI Effects Control:** Bật/tắt các bộ lọc AI xử lý tại chỗ (Xóa phông, làm mịn da, theo dõi khuôn mặt) bằng WebGPU.
- **Bảng điều khiển Phiên đấu giá:** Nút "Bắt đầu", "Kết thúc", "Chốt giá".
- **Real-time Analytics Overlay:** Bản đồ nhiệt (Heatmap) hiển thị mức độ quan tâm của người xem, biểu đồ tương tác trực tiếp.

### 8.4. Quản Lý Vận Chuyển (Shipping & Fulfillment)
- **In mã vận đơn:** Giao diện tạo và in nhãn vận chuyển hàng loạt.
- **Theo dõi đối tác vận chuyển:** Tích hợp API của các đơn vị giao hàng.

### 8.5. Khuyến Mãi & Marketing (Marketing Center)
- **Tạo mã giảm giá:** Giao diện thiết lập voucher cho người theo dõi.
- **Quảng cáo nội bộ:** Đấu thầu từ khóa để sản phẩm xuất hiện trên trang chủ.

### 8.6. Phân tích Kinh doanh (Seller Analytics)
- Biểu đồ doanh thu, Tỉ lệ chuyển đổi, Phân tích chân dung khách hàng.
- Báo cáo được tạo từ dữ liệu tổng hợp bảo vệ quyền riêng tư (Privacy-Preserving Data Aggregation).

---

## 9. KHU VỰC QUẢN TRỊ VIÊN (ADMIN & MODERATOR DASHBOARD)

### 9.1. Tổng Quan Hệ Thống (Admin Overview)
- Dashboard hiển thị các chỉ số cốt lõi: CCU (Lượng người dùng đồng thời), Tổng GMV (Giá trị giao dịch), Tình trạng Server.

### 9.2. Quản Lý Người Dùng (User Management)
- Danh sách người dùng, phân quyền (Admin, Mod, Seller, Buyer).
- Khóa/Mở khóa tài khoản, xem lịch sử vi phạm.

### 9.3. Giám sát Sức khỏe Hệ thống (System Health Monitor)
- Bản đồ mạng lưới P2P toàn cầu: Hiển thị các "Super-Peers", lưu lượng CDN truyền thống vs P2P CDN.
- Cảnh báo thảm họa: Biểu đồ theo dõi độ trễ, cảnh báo DDoS, trạng thái chuyển đổi chế độ "Sống sót".

### 9.4. Quản trị Dữ liệu & Big Data (Data Governance)
- **Data Lineage Map:** Sơ đồ trực quan theo dõi đường đi của dữ liệu từ khi sinh ra đến khi lưu trữ lạnh.
- **Point-in-Time Recovery (PITR):** Giao diện "Cỗ máy thời gian" cho phép Admin chọn một mốc thời gian để khôi phục cơ sở dữ liệu.
- **Quản lý Sharding:** Biểu đồ hiển thị mức độ đầy của các mảnh dữ liệu (Database Shards).

### 9.5. Kiểm duyệt Nội dung (Content Moderation)
- Hàng đợi kiểm duyệt: Các sản phẩm/video bị AI Local của người dùng gắn cờ nghi ngờ.
- Công cụ xem lại (Replay Tool): Phát lại các chuỗi sự kiện dẫn đến lỗi hoặc gian lận (High-Volume Event Replay).

### 9.6. Quản Lý Tài Chính (Financial Audit)
- Đối soát dòng tiền, quản lý phí nền tảng, lịch sử rút tiền của người bán.

---

## 10. TRANG THÔNG TIN & HỖ TRỢ (INFO & SUPPORT)

### 10.1. Trung Tâm Trợ Giúp (Help Center & FAQ)
- **Tìm kiếm thông minh:** Tìm kiếm bài viết hướng dẫn bằng AI.
- **Chatbot Hỗ trợ:** Tích hợp AI giải đáp thắc mắc tự động trước khi chuyển cho tư vấn viên.

### 10.2. Các Trang Tĩnh (Static Pages)
- Về chúng tôi (About Us).
- Điều khoản dịch vụ (Terms of Service).
- Chính sách bảo mật (Privacy Policy).

---

## 11. CÁC COMPONENT GIAO DIỆN ĐẶC BIỆT (SPECIAL UI COMPONENTS)

### 11.1. Trợ lý AI Cục bộ (Local AI Assistant Widget)
- Một bong bóng chat nhỏ ở góc màn hình.
- Hoạt động hoàn toàn offline dựa trên mô hình ngôn ngữ nhỏ (SLM) tải về máy.
- Chức năng: Giải đáp thắc mắc, hướng dẫn sử dụng, gợi ý chiến thuật đấu giá dựa trên hành vi người dùng (không gửi dữ liệu về server).

### 11.2. Bảng Trạng Thái Đóng Góp Mạng Lưới (P2P Contribution Panel)
- Hiển thị lượng băng thông (Upload/Download) và CPU người dùng đã đóng góp cho mạng lưới AmazeBid.
- Thanh tiến trình (Progress bar) hiển thị số Điểm thưởng (Incentives) kiếm được trong phiên làm việc hiện tại.
- Nút bật/tắt chế độ "Cho thuê tài nguyên" (Resource Auction).

### 11.3. Trình Quản Lý Xung Đột Dữ Liệu (Conflict Resolution UI)
- Khi người dùng sử dụng nhiều thiết bị (điện thoại, laptop) offline và có dữ liệu không đồng nhất.
- Giao diện hiển thị so sánh (Diff view) trực quan để người dùng chọn phiên bản dữ liệu đúng nhất trước khi hợp nhất (CRDT Merge) bằng khóa mã hóa local.

---

## 12. HỆ THỐNG COMPONENT CỐT LÕI (CORE UI COMPONENTS)
*Đây là danh sách các thành phần UI (Components) có thể tái sử dụng trên toàn bộ ứng dụng, được xây dựng theo phương pháp Atomic Design.*

### 12.1. Atoms (Thành phần Cơ bản)
- **Buttons (Nút bấm):**
  - `PrimaryButton`: Nút hành động chính (đặt giá, thanh toán). Có hiệu ứng "Pulse" (nhịp đập) khi đang trong phiên đấu giá gay cấn.
  - `SecondaryButton`: Nút phụ (hủy, quay lại).
  - `DangerButton`: Nút cảnh báo (xóa tài khoản, từ chối).
  - `GhostButton`: Nút trong suốt, dùng cho các hành động ít quan trọng.
- **Inputs (Trường nhập liệu):**
  - `TextInput`: Nhập văn bản cơ bản (có validation realtime).
  - `PasswordInput`: Nhập mật khẩu (có nút ẩn/hiện và thanh đo độ mạnh mật khẩu).
  - `OTPInput`: Các ô nhập mã OTP tách rời, tự động chuyển focus.
  - `RichTextEditor`: Trình soạn thảo văn bản cho mô tả sản phẩm (hỗ trợ in đậm, nghiêng, chèn link).
- **Badges & Tags (Nhãn & Thẻ):**
  - `LiveBadge`: Nhãn "LIVE" nhấp nháy màu đỏ cho phiên đang phát sóng.
  - `StatusTag`: Thẻ trạng thái đơn hàng (Đang giao, Hoàn thành, Đã hủy) với màu sắc tương ứng.
  - `P2PBadge`: Nhãn màu xanh lá hiển thị "P2P Active" khi người dùng đang kết nối mạng phi tập trung.
- **Avatars (Ảnh đại diện):**
  - `UserAvatar`: Ảnh đại diện tròn, có viền màu (vàng/bạc/đồng) dựa trên cấp độ uy tín.
  - `AvatarGroup`: Hiển thị chồng lên nhau (dùng cho danh sách người đang xem phiên đấu giá).
- **Tooltips (Chú giải):** Hiển thị thông tin bổ sung khi hover vào một icon hoặc đoạn text (ví dụ: giải thích về "Zero-Knowledge Proof").

### 12.2. Molecules (Thành phần Phức hợp)
- **Cards (Thẻ thông tin):**
  - `ProductCard`: Thẻ sản phẩm tiêu chuẩn (Ảnh, Tên, Giá hiện tại, Thời gian còn lại).
  - `LiveAuctionCard`: Thẻ sản phẩm đang live (Có thêm thumbnail video động, số người xem, hiệu ứng viền sáng khi có người vừa đặt giá).
  - `ReviewCard`: Thẻ đánh giá (Avatar người đánh giá, số sao, nội dung, ngày tháng).
- **Search & Filter (Tìm kiếm & Lọc):**
  - `SearchBar`: Thanh tìm kiếm tích hợp icon micro (Voice Search) và icon camera (Image Search).
  - `FilterDropdown`: Menu thả xuống chứa các tùy chọn lọc (Giá, Danh mục, Tình trạng).
- **Chat & Messaging (Trò chuyện):**
  - `ChatBubble`: Bong bóng chat (có màu khác nhau cho người gửi/nhận).
  - `SecureChatBubble`: Bong bóng chat có icon ổ khóa (biểu thị tin nhắn đã mã hóa E2EE).
- **Notifications (Thông báo):**
  - `ToastNotification`: Thông báo nhỏ hiện lên ở góc màn hình (ví dụ: "Bạn đã đặt giá thành công", "Mất kết nối Server, chuyển sang P2P").
  - `AlertBanner`: Dải thông báo chạy ngang trên cùng màn hình (dùng cho các cảnh báo hệ thống quan trọng).

### 12.3. Organisms (Thành phần Chức năng Lớn)
- **Bidding Components (Thành phần Đấu giá):**
  - `QuickBidPad`: Bảng điều khiển gồm các nút đặt giá nhanh (+10k, +50k, +100k).
  - `CustomBidSlider`: Thanh trượt cho phép người dùng kéo để chọn mức giá mong muốn một cách trực quan.
  - `AutoBidConfigurator`: Modal thiết lập đấu giá tự động (nhập giá tối đa, bước giá).
  - `LeaderboardList`: Danh sách xếp hạng những người trả giá cao nhất, tự động sắp xếp lại (re-order) với hiệu ứng mượt mà khi có thay đổi.
- **Media & Streaming (Đa phương tiện):**
  - `WebRTCVideoPlayer`: Trình phát video livestream tùy chỉnh, tích hợp nút chuyển đổi chất lượng, hiển thị thông số mạng P2P (Ping, Peers connected).
  - `3DModelViewer`: Component cho phép xoay, thu phóng mô hình 3D của sản phẩm (sử dụng WebGL/Three.js).
  - `ImageGalleryZoom`: Thư viện ảnh sản phẩm với chức năng phóng to chi tiết khi di chuột (Magnifier effect).
- **Security & Privacy (Bảo mật & Quyền riêng tư):**
  - `BiometricPromptModal`: Modal yêu cầu quét khuôn mặt/vân tay (mô phỏng UI của hệ điều hành) trước khi mở "Két sắt Local".
  - `ZKPVerificationSpinner`: Vòng quay loading đặc biệt hiển thị các bước mã hóa khi thực hiện xác thực Zero-Knowledge.
  - `P2PConnectionGraph`: Biểu đồ mạng nhện (Spider web graph) trực quan hóa các kết nối P2P hiện tại của người dùng với các máy khách khác.
- **Seller & Admin Tools (Công cụ Người bán/Quản trị):**
  - `AnalyticsChartWidget`: Các biểu đồ (Line, Bar, Pie) hiển thị doanh thu, lượng truy cập (sử dụng thư viện như Recharts hoặc Chart.js).
  - `DragDropMediaUploader`: Khu vực kéo thả file, hiển thị thanh tiến trình nén file tại Client (Client-side compression progress) trước khi upload.
  - `DataLineageVisualizer`: Component dạng node-based (giống sơ đồ tư duy) để Admin theo dõi luồng di chuyển của dữ liệu.
- **Layout Components (Thành phần Bố cục):**
  - `SidebarNavigation`: Menu điều hướng bên trái (có thể thu gọn).
  - `StickyHeader`: Thanh menu trên cùng luôn hiển thị khi cuộn trang, chứa Logo, Thanh tìm kiếm, Icon Giỏ hàng/Thông báo.
  - `BottomTabBar`: Thanh điều hướng dưới cùng (dành riêng cho giao diện Mobile).
  - `InfiniteScrollContainer`: Container tự động tải thêm dữ liệu khi người dùng cuộn đến cuối trang (dùng cho AI Feed).

### 12.4. Data Display & Feedback (Hiển thị Dữ liệu & Phản hồi)
- **Data Tables (Bảng dữ liệu):**
  - `SortableDataTable`: Bảng dữ liệu hỗ trợ sắp xếp, lọc, và phân trang (dùng cho Lịch sử giao dịch, Quản lý đơn hàng).
  - `ExpandableTableRow`: Hàng trong bảng có thể mở rộng để xem chi tiết (ví dụ: xem chi tiết các mặt hàng trong một đơn hàng).
- **Loading States (Trạng thái tải):**
  - `SkeletonLoader`: Khung xương xám nhấp nháy giữ chỗ cho nội dung đang tải (Skeleton Card, Skeleton Text).
  - `P2PSyncSpinner`: Spinner đặc biệt hiển thị trạng thái "Đang đồng bộ P2P" với animation các node kết nối.
  - `AITypingIndicator`: Dấu ba chấm nhấp nháy mô phỏng AI đang "suy nghĩ" hoặc "gõ" câu trả lời.
- **Empty States (Trạng thái trống):**
  - `EmptyCartState`: Minh họa giỏ hàng trống kèm nút "Khám phá ngay".
  - `NoResultsState`: Minh họa không tìm thấy kết quả, kèm theo các "Gợi ý từ AI" (AI Suggestions).
  - `OfflineState`: Minh họa mất kết nối Internet, hiển thị nút "Bật chế độ P2P/Bluetooth".

### 12.5. Overlays & Navigation (Lớp phủ & Điều hướng)
- **Modals & Dialogs (Hộp thoại):**
  - `ConfirmDialog`: Hộp thoại xác nhận hành động (Xóa, Hủy đơn).
  - `BottomSheet`: Bảng trượt từ dưới lên (đặc biệt quan trọng cho trải nghiệm Mobile: Chọn phương thức thanh toán, Xem bình luận live).
  - `PopoverMenu`: Menu ngữ cảnh bật ra khi click vào dấu 3 chấm (Tùy chọn sản phẩm, Báo cáo vi phạm).
- **Advanced Navigation (Điều hướng nâng cao):**
  - `Breadcrumbs`: Thanh điều hướng phân cấp (Trang chủ > Điện tử > Điện thoại).
  - `StepIndicator` (Stepper): Thanh tiến trình từng bước (dùng cho quá trình Checkout hoặc KYC: Thông tin -> Thanh toán -> Xác nhận).
  - `SwipeableTabs`: Các tab có thể vuốt ngang trên mobile (Chuyển đổi giữa "Đang diễn ra", "Sắp tới", "Đã kết thúc").

### 12.6. Advanced Form Controls (Điều khiển Form Nâng cao)
- **Selection & Toggles (Lựa chọn & Chuyển đổi):**
  - `ToggleSwitch`: Công tắc bật/tắt (Bật thông báo, Bật chế độ tối, Bật Local Vault).
  - `CustomCheckbox` & `CustomRadio`: Nút check/radio được style riêng biệt, hỗ trợ animation khi chọn.
- **Pickers & Sliders (Bộ chọn & Thanh trượt):**
  - `DateRangePicker`: Bộ chọn khoảng thời gian (dùng cho lọc thống kê doanh thu).
  - `MultiSelectCombobox`: Ô nhập liệu cho phép chọn nhiều tag (Thêm tag cho sản phẩm).
  - `PriceRangeSlider`: Thanh trượt hai đầu để lọc khoảng giá.

### 12.7. Gamification & Interactive (Trò chơi hóa & Tương tác)
- `ConfettiOverlay`: Hiệu ứng pháo giấy rơi xuống toàn màn hình khi người dùng chiến thắng một phiên đấu giá.
- `LevelProgressRing`: Vòng tròn tiến trình bao quanh Avatar hiển thị điểm kinh nghiệm (XP) của người dùng.
- `VoiceVisualizer`: Biểu đồ sóng âm thanh động (Audio waveform) nhấp nháy theo giọng nói khi người dùng sử dụng Voice Search.

---

## 13. HỆ THỐNG ANIMATION & TƯƠNG TÁC (ANIMATION & INTERACTION SYSTEM)
*Để mang lại trải nghiệm mượt mà, cao cấp (Premium) và phản hồi nhanh, hệ thống sử dụng thư viện như Framer Motion hoặc CSS Animations cho các tương tác.*

### 13.1. Page Transitions (Chuyển trang)
- **Fade Through:** Hiệu ứng mờ dần trang cũ và hiện rõ trang mới (dùng cho chuyển đổi tab cơ bản).
- **Shared Axis (X/Y/Z):** Trượt trang theo trục ngang (khi tiến/lùi trong luồng Checkout) hoặc trục dọc (khi mở chi tiết sản phẩm từ danh sách).
- **Hero Animation (Shared Element Transition):** Khi click vào ảnh sản phẩm ở trang chủ, ảnh đó sẽ phóng to và mượt mà di chuyển vào vị trí ảnh cover ở trang Chi tiết sản phẩm.

### 13.2. Micro-interactions (Tương tác vi mô)
- **Hover Effects:** Nút bấm nổi lên (lift up) và đổ bóng sâu hơn khi di chuột.
- **Tap/Click Ripple:** Hiệu ứng gợn sóng tỏa ra từ vị trí ngón tay chạm vào trên thiết bị di động.
- **Heart/Like Burst:** Khi thả tim sản phẩm, icon trái tim sẽ phình to, đổi màu đỏ và bắn ra các hạt li ti (particles).
- **Pull-to-Refresh:** Kéo từ trên xuống để làm mới trang, icon loading xoay theo lực kéo của ngón tay.

### 13.3. Real-time Feedback (Phản hồi Thời gian thực)
- **Bidding War Flash:** Khi có hai người liên tục trả giá (Bidding War), nền của khu vực giá sẽ chớp nháy màu cam/đỏ nhẹ để tăng tính kịch tính.
- **Number Counter Animation:** Khi giá trị thay đổi (ví dụ: giá thầu tăng từ 1.000.000đ lên 1.500.000đ), các con số sẽ cuộn (roll) giống như đồng hồ công tơ mét thay vì nhảy số giật cục.

---

## 14. CÁC TRANG & LUỒNG GIAO DIỆN ĐẶC THÙ (SPECIALIZED PAGES & FLOWS)
*Ngoài các trang chính, hệ thống cần các trang đặc thù để xử lý các tình huống ngoại lệ, hướng dẫn người dùng và phục vụ các đối tượng đặc biệt.*

### 14.1. Trang Lỗi & Trạng Thái Ngoại Tuyến (Error & Offline Pages)
- **Trang 404 (Not Found):** Giao diện thân thiện báo lỗi không tìm thấy trang, kèm theo thanh tìm kiếm và danh sách "Sản phẩm gợi ý từ AI".
- **Trang 500 (Server Error):** Giao diện báo lỗi máy chủ, tự động hiển thị nút "Chuyển sang Chế độ P2P" (Switch to P2P Mode) để người dùng tiếp tục duyệt web bằng dữ liệu từ các node lân cận.
- **Trang Offline Fallback:** Khi mất kết nối Internet hoàn toàn, trang này hiện ra cho phép người dùng xem lại "Két sắt Local" (Local Vault) và các sản phẩm đã lưu offline.

### 14.2. Luồng Hướng Dẫn Người Dùng Mới (User Onboarding Walkthrough)
- **Welcome Carousel:** Chuỗi 3-4 màn hình giới thiệu các tính năng nổi bật (Đấu giá P2P, Bảo mật ZKP, Trợ lý AI).
- **Interactive Tooltips:** Khi người dùng lần đầu vào phòng đấu giá, các tooltip sẽ sáng lên từng phần (Highlight) để hướng dẫn cách đặt giá, xem lịch sử và sử dụng chat.
- **KYC Step-by-Step:** Luồng hướng dẫn chụp ảnh CCCD và quét khuôn mặt 3D với khung lưới (mesh overlay) hướng dẫn người dùng quay đầu sang trái/phải.

### 14.3. Bảng Điều Khiển Tiếp Thị Liên Kết (Affiliate/KOL Dashboard)
- **Trang Lấy Link & Mã Giảm Giá:** Giao diện cho phép KOL/Influencer tạo link giới thiệu (Referral link) cho các phiên đấu giá.
- **Biểu Đồ Hoa Hồng (Commission Chart):** Biểu đồ theo dõi số lượt click, số người tham gia đấu giá qua link, và doanh thu hoa hồng theo thời gian thực.
- **Bảng Xếp Hạng KOL (Top Promoters):** Danh sách các KOL mang lại nhiều doanh thu nhất trong tuần/tháng.

### 14.4. Trung Tâm Nhiệm Vụ & Trò Chơi Hóa (Quest & Gamification Center)
- **Daily Quests (Nhiệm vụ hàng ngày):** Danh sách các nhiệm vụ (VD: Đăng nhập, Tham gia 1 phiên đấu giá, Chia sẻ băng thông P2P trong 1 giờ).
- **Badge Collection (Bộ sưu tập Huy hiệu):** Trang trưng bày các huy hiệu người dùng đạt được (VD: "Người mua uy tín", "Node P2P Tích cực").
- **Reward Wheel (Vòng quay may mắn):** Giao diện vòng quay để người dùng sử dụng điểm thưởng (Points) đổi lấy voucher hoặc quyền lợi đặc biệt.

---

## 15. COMPONENTS TƯƠNG TÁC THỰC TẾ ẢO & XU HƯỚNG MỚI (AR/VR & TRENDING COMPONENTS)
*Các component bắt kịp xu hướng công nghệ mới nhất để tăng cường trải nghiệm mua sắm.*

### 15.1. Nguồn Cấp Dữ Liệu Dạng Video Ngắn (Vertical Shorts Feed)
- **Swipeable Video Player:** Giao diện cuộn dọc (giống TikTok/Reels) để xem các video giới thiệu sản phẩm đấu giá ngắn.
- **Overlay Actions:** Các nút thả tim, bình luận, chia sẻ và nút "Tham gia đấu giá ngay" nổi trên nền video.

### 15.2. Phòng Thử Đồ Thực Tế Tăng Cường (AR Try-on Room)
- **Camera Viewport:** Khu vực mở camera điện thoại, sử dụng WebXR/AR.js để ướm thử sản phẩm (kính mắt, đồng hồ, trang sức, nội thất) lên người hoặc không gian thực.
- **AR Controls:** Các nút xoay, đổi màu sắc sản phẩm ngay trong môi trường AR.
- **Snapshot Button:** Nút chụp ảnh màn hình khoảnh khắc thử đồ để chia sẻ lên mạng xã hội.

### 15.3. Trình Khám Phá Hợp Đồng Thông Minh (Smart Contract / Proof Explorer)
- **ZKP Proof Viewer:** Giao diện hiển thị chuỗi mã hóa (hash) chứng minh tính minh bạch của phiên đấu giá mà không tiết lộ thông tin người mua.
- **Transaction Timeline:** Trục thời gian hiển thị các bước của một giao dịch đã được ghi vào sổ cái (Ledger) hoặc Blockchain (nếu có tích hợp).

---

## 16. COMPONENTS HỖ TRỢ TRUY CẬP & ĐA DẠNG (ACCESSIBILITY & INCLUSIVITY)
*Đảm bảo hệ thống có thể tiếp cận được với mọi đối tượng người dùng, bao gồm cả người khuyết tật.*

### 16.1. Bảng Điều Khiển Trợ Năng (Accessibility Control Panel)
- **Text Size Slider:** Thanh trượt phóng to/thu nhỏ kích thước chữ toàn hệ thống.
- **High Contrast Toggle:** Công tắc bật chế độ tương phản cao (chữ trắng/vàng trên nền đen) cho người khiếm thị nhẹ.
- **Color Blind Modes:** Các bộ lọc màu hỗ trợ người mù màu (Protanopia, Deuteranopia, Tritanopia).
- **Reduce Motion Toggle:** Công tắc tắt các hiệu ứng animation phức tạp (chống chóng mặt).

### 16.2. Trình Đọc Màn Hình Tích Hợp (Built-in Screen Reader)
- **Text-to-Speech Button:** Nút bấm có biểu tượng cái loa cạnh các mô tả sản phẩm dài, tự động đọc văn bản bằng AI Voice.
- **Voice Command Overlay:** Giao diện hiển thị trạng thái đang lắng nghe lệnh giọng nói (VD: "Đọc giá hiện tại", "Đặt giá thêm 50 ngàn").

---

## 17. TRANG QUẢN LÝ NÚT MẠNG P2P & TÀI NGUYÊN (P2P NODE & RESOURCE MANAGEMENT)
*Dành cho người dùng muốn đóng góp tài nguyên máy tính (Băng thông, Lưu trữ, CPU) để duy trì mạng lưới phi tập trung và nhận thưởng.*

### 17.1. Bảng Điều Khiển Nút Mạng (Node Dashboard)
- **Trạng Thái Node:** Hiển thị trạng thái hoạt động (Online/Offline), thời gian Uptime, và loại Node (Storage Node, Relay Node, Compute Node).
- **Biểu Đồ Tiêu Thụ Tài Nguyên:** Đồ thị realtime hiển thị mức sử dụng CPU, RAM, và Băng thông mạng mà AmazeBid đang mượn.
- **Lịch Sử Đóng Góp:** Danh sách các "khối dữ liệu" (chunks) đã lưu trữ hoặc chuyển tiếp thành công.

### 17.2. Cài Đặt Giới Hạn Tài Nguyên (Resource Limits Settings)
- **Thanh Trượt Băng Thông (Bandwidth Slider):** Cho phép người dùng giới hạn tốc độ Upload/Download tối đa dành cho mạng P2P (ví dụ: Max 5MB/s).
- **Giới Hạn Lưu Trữ (Storage Quota):** Nhập số GB ổ cứng tối đa cho phép hệ thống sử dụng làm bộ nhớ đệm (Cache) phi tập trung.
- **Lịch Trình Hoạt Động (Schedule):** Cài đặt giờ tự động bật/tắt chế độ Node (ví dụ: chỉ bật từ 12h đêm đến 6h sáng).

---

## 18. GIAO DIỆN TÍCH HỢP WEB3 & CRYPTO WALLET (WEB3 & CRYPTO INTEGRATION)
*Các trang và component phục vụ cho thanh toán bằng tiền điện tử và tương tác với Smart Contract.*

### 18.1. Quản Lý Ví Tiền Điện Tử (Crypto Wallet Manager)
- **Connect Wallet Modal:** Hộp thoại hỗ trợ kết nối nhiều loại ví (MetaMask, TrustWallet, WalletConnect) qua mã QR hoặc extension.
- **Giao Diện Chuyển Đổi (Swap UI):** Tích hợp DEX (Decentralized Exchange) mini để người dùng đổi từ Token/Coin khác sang Token chính của nền tảng ngay trên web.
- **Lịch Sử Giao Dịch On-chain:** Danh sách các giao dịch có kèm link dẫn đến Blockchain Explorer (Etherscan, BscScan).

### 18.2. Đấu Giá NFT & Tài Sản Số (NFT & Digital Asset Auction)
- **NFT Showcase Component:** Trình xem trước NFT (hỗ trợ ảnh động, video, mô hình 3D) với huy hiệu xác thực bản quyền (Verified Authenticity).
- **Minting Studio:** Giao diện cho phép người bán tự đúc (mint) sản phẩm vật lý thành NFT kèm chứng thư số trước khi đem đấu giá.

---

## 19. CÀI ĐẶT NÂNG CAO & CÁ NHÂN HÓA (ADVANCED SETTINGS & PERSONALIZATION)
*Khu vực cho phép người dùng tùy biến sâu trải nghiệm sử dụng.*

### 19.1. Đa Ngôn Ngữ & Tiền Tệ (Localization & Currency)
- **Language Picker:** Dropdown chọn ngôn ngữ với cờ quốc gia. Hỗ trợ dịch tự động (Auto-translate) nội dung chat và mô tả sản phẩm bằng AI.
- **Currency Converter:** Giao diện chọn loại tiền tệ hiển thị (VND, USD, EUR, Crypto). Tỷ giá được cập nhật realtime.

### 19.2. Trung Tâm Thông Báo Tùy Chỉnh (Notification Preferences)
- **Kênh Nhận Thông Báo:** Các Toggle Switch để chọn nhận thông báo qua App Push, SMS, Email, hoặc Telegram Bot.
- **Loại Thông Báo:** Lọc chi tiết (Chỉ nhận thông báo khi: Có người trả giá cao hơn, Sản phẩm yêu thích sắp lên sàn, Đơn hàng thay đổi trạng thái).

### 19.3. Giao Diện Tùy Biến (Theme Customizer)
- **Chế Độ Tối/Sáng (Dark/Light Mode):** Nút chuyển đổi nhanh trên Header.
- **Chế Độ Tương Phản Thấp (Low Contrast/Eye Care):** Giảm ánh sáng xanh và độ chói của các màu sắc sặc sỡ (đặc biệt trong phòng live).

---

## 20. CỔNG DÀNH CHO NHÀ PHÁT TRIỂN & ĐỐI TÁC (DEVELOPER & PARTNER PORTAL)
*Dành cho bên thứ ba muốn tích hợp với hệ thống AmazeBid.*

### 20.1. Quản Lý API Key (API Key Management)
- **Tạo/Xóa API Key:** Nút tạo khóa mới, hiển thị khóa một lần duy nhất (phải copy ngay).
- **Phân Quyền API (API Scopes):** Checkbox chọn quyền cho từng khóa (Read-only, Write, Bidding, Order Management).

### 20.2. Cấu Hình Webhook (Webhook Configuration)
- **Endpoint URL Input:** Nơi đối tác nhập URL để nhận dữ liệu realtime từ hệ thống (khi có đơn hàng mới, phiên đấu giá kết thúc).
- **Test Webhook Button:** Nút gửi một payload mẫu (dummy data) để kiểm tra kết nối.

---

## 21. TRUNG TÂM GIẢI QUYẾT TRANH CHẤP & KHIẾU NẠI (DISPUTE RESOLUTION CENTER)
*Nơi xử lý các vấn đề phát sinh giữa người mua và người bán một cách minh bạch.*

### 21.1. Giao Diện Tạo Khiếu Nại (Create Dispute Ticket)
- **Form Chọn Lý Do:** Dropdown các lý do (Hàng giả, Sai mô tả, Không nhận được hàng).
- **Bằng Chứng Đa Phương Tiện (Evidence Uploader):** Khu vực upload ảnh/video mở hộp (Unboxing video), hỗ trợ nén video tại client.

### 21.2. Phòng Xử Lý Tranh Chấp (Dispute Resolution Room)
- **Timeline Sự Kiện:** Trục thời gian hiển thị toàn bộ lịch sử từ lúc đặt giá, thanh toán, giao hàng đến lúc mở khiếu nại.
- **Chat 3 Bên (3-Way Chat):** Khung chat giữa Người mua, Người bán và AI Trọng tài (AI Mediator). AI sẽ phân tích bằng chứng và đưa ra gợi ý hòa giải trước khi cần Admin con người can thiệp.
- **Nút Đồng Ý/Từ Chối (Accept/Reject Proposal):** Các nút hành động để hai bên chốt phương án giải quyết (Hoàn tiền 50%, Trả hàng, v.v.).

---

## 22. COMPONENTS TRỰC QUAN HÓA DỮ LIỆU NÂNG CAO (ADVANCED DATA VISUALIZATION)
*Các component chuyên biệt để hiển thị dữ liệu phức tạp, Big Data và Analytics cho Admin/Seller.*

### 22.1. Biểu Đồ Thời Gian Thực (Real-time Streaming Charts)
- `LiveBiddingChart`: Biểu đồ đường (Line chart) hiển thị quỹ đạo giá thầu theo từng giây. Tự động cuộn ngang khi có dữ liệu mới.
- `ConcurrentUsersHeatmap`: Bản đồ nhiệt (Heatmap) hiển thị mật độ người dùng đang xem live stream theo khu vực địa lý.
- `ServerLoadGauge`: Biểu đồ dạng đồng hồ đo (Gauge) hiển thị áp lực máy chủ hiện tại, chuyển sang màu đỏ khi sắp quá tải.

### 22.2. Sơ Đồ & Đồ Thị Phức Tạp (Complex Graphs & Trees)
- `UserJourneySankey`: Biểu đồ Sankey hiển thị luồng di chuyển của người dùng từ lúc vào trang chủ đến lúc thanh toán thành công (hoặc rớt đài).
- `CategoryTreemap`: Biểu đồ dạng khối vuông (Treemap) hiển thị tỷ trọng doanh thu của các danh mục sản phẩm khác nhau.
- `FraudDetectionNetwork`: Biểu đồ mạng lưới (Network Graph) kết nối các tài khoản có dấu hiệu gian lận (ví dụ: dùng chung IP, thiết bị).

---

## 23. COMPONENTS ĐỒ HỌA WEBGL & CANVAS (WEBGL & CANVAS COMPONENTS)
*Sử dụng GPU của trình duyệt để render các hiệu ứng đồ họa nặng mà không làm chậm DOM.*

### 23.1. Hiệu Ứng Nền & Không Gian (Background & Spatial Effects)
- `ParticleBackground`: Nền tảng với các hạt (particles) trôi nổi, phản ứng khi chuột di chuyển qua (dùng cho trang Đăng nhập hoặc Landing Page).
- `AuctionCountdownHologram`: Đồng hồ đếm ngược 3D dạng Hologram lơ lửng trên sản phẩm khi thời gian chỉ còn dưới 10 giây.

### 23.2. Chỉnh Sửa & Xử Lý Ảnh/Video (Media Processing)
- `CanvasImageCropper`: Công cụ cắt, xoay, và chỉnh màu ảnh sản phẩm ngay trên trình duyệt trước khi upload.
- `VideoThumbnailExtractor`: Component tự động trích xuất các khung hình (frames) từ video upload để người bán chọn làm ảnh bìa (thumbnail).

---

## 24. COMPONENTS OFFLINE-FIRST & ĐỒNG BỘ HÓA (OFFLINE-FIRST & SYNC COMPONENTS)
*Đảm bảo trải nghiệm không gián đoạn ngay cả khi mạng chập chờn hoặc mất kết nối.*

### 24.1. Chỉ Báo Trạng Thái Đồng Bộ (Sync Status Indicators)
- `CloudSyncIcon`: Icon đám mây trên góc màn hình. Xoay tròn khi đang đồng bộ (Syncing), có dấu tick khi đã lưu lên server (Synced), và có dấu chấm than khi lưu tạm ở Local (Pending).
- `OfflineBanner`: Dải băng màu vàng xuất hiện khi mất mạng, thông báo "Bạn đang ở chế độ Offline. Các thay đổi sẽ được lưu cục bộ và đồng bộ sau."

### 24.2. Quản Lý Bộ Nhớ Cục Bộ (Local Storage Management)
- `CacheManagerPanel`: Bảng điều khiển cho phép người dùng xem ứng dụng đang chiếm bao nhiêu dung lượng trên máy (IndexedDB/Cache Storage) và nút "Xóa bộ nhớ đệm".
- `DraftItemCard`: Thẻ hiển thị các bài đăng sản phẩm hoặc tin nhắn đang viết dở (Drafts) được lưu tự động ở Local.

---

## 25. COMPONENTS KIẾN TRÚC MICRO-FRONTEND (MICRO-FRONTEND COMPONENTS)
*Nếu hệ thống được chia nhỏ thành nhiều ứng dụng độc lập (Micro-Frontends) ghép lại với nhau.*

### 25.1. Vỏ Bọc Ứng Dụng (App Shell)
- `GlobalAppShell`: Khung sườn chung của toàn bộ website (Header, Footer, Sidebar) luôn cố định, trong khi phần nội dung ở giữa (Content Area) được tải động từ các Micro-Frontend khác nhau (ví dụ: Bidding App, Seller App).

### 25.2. Cầu Nối Giao Tiếp (Communication Bridges)
- `CrossAppEventBus`: Component vô hình (Invisible Component) chịu trách nhiệm lắng nghe và phát các sự kiện (Events) giữa các Micro-Frontend (ví dụ: Khi người dùng thêm đồ vào giỏ ở "Storefront App", "Cart App" trên Header sẽ tự động cập nhật số lượng).

---

## 26. HỆ THỐNG DESIGN TOKENS & THEME (DESIGN TOKENS SYSTEM)
*Đảm bảo tính nhất quán tuyệt đối về màu sắc, typography và khoảng cách trên toàn bộ hệ thống.*

### 26.1. Bảng Màu (Color Palette)
- **Primary Colors:** Màu chủ đạo cho thương hiệu (ví dụ: Xanh dương đậm) dùng cho nút bấm chính, link.
- **Semantic Colors:** Màu ngữ nghĩa (Đỏ cho lỗi/cảnh báo, Xanh lá cho thành công/P2P, Vàng cho chờ đợi/Offline).
- **Surface Colors:** Màu nền các lớp (Background, Card, Modal) hỗ trợ chuyển đổi mượt mà giữa Dark/Light mode.

### 26.2. Typography (Kiểu chữ)
- **Display Fonts:** Font chữ lớn, cá tính dùng cho tiêu đề chính (H1, H2) hoặc số đếm ngược đấu giá.
- **Body Fonts:** Font chữ dễ đọc, tối ưu cho màn hình nhỏ dùng cho mô tả sản phẩm, nội dung chat.
- **Monospace Fonts:** Dùng cho các đoạn mã (ZKP Hash, Smart Contract, API Key).

### 26.3. Spacing & Elevation (Khoảng cách & Độ nổi)
- **Grid System:** Hệ thống lưới 12 cột chuẩn (hoặc 8-point grid system) cho khoảng cách (margin/padding).
- **Shadows (Z-index):** Quy định độ đổ bóng (box-shadow) tương ứng với độ cao của component (ví dụ: Modal nổi cao nhất sẽ có bóng đậm và rộng nhất).

---

## 27. COMPONENTS XÁC THỰC FORM NÂNG CAO (ADVANCED FORM VALIDATION)
*Xử lý lỗi nhập liệu một cách mượt mà và thân thiện với người dùng.*

### 27.1. Phản Hồi Nhập Liệu (Input Feedback)
- `InlineErrorText`: Dòng chữ đỏ nhỏ xuất hiện ngay dưới ô nhập liệu khi có lỗi (ví dụ: "Email không hợp lệ"), kèm hiệu ứng rung nhẹ (shake animation).
- `PasswordStrengthMeter`: Thanh tiến trình đổi màu (Đỏ -> Vàng -> Xanh) và gợi ý (Cần thêm ký tự đặc biệt) khi người dùng gõ mật khẩu.

### 27.2. Xác Thực Đa Bước (Multi-step Validation)
- `StepValidator`: Component kiểm tra tính hợp lệ của toàn bộ một bước (Step) trước khi cho phép người dùng nhấn "Tiếp theo" trong luồng Checkout hoặc KYC.

---

## 28. GIAO DIỆN TẠO BỞI AI (AI-GENERATED UI COMPONENTS)
*Các component có khả năng tự động thay đổi cấu trúc hoặc nội dung dựa trên phân tích của AI.*

### 28.1. Bố Cục Động (Dynamic Layouts)
- `SmartProductGrid`: Lưới sản phẩm tự động điều chỉnh kích thước ảnh (Masonry layout) dựa trên thói quen xem của người dùng (AI nhận thấy người dùng thích xem ảnh to hay danh sách chi tiết).
- `ContextualActionPanel`: Bảng điều khiển tự động thay đổi các nút bấm dựa trên ngữ cảnh (ví dụ: Đang xem đồ điện tử sẽ hiện nút "So sánh cấu hình", xem quần áo sẽ hiện nút "Bảng size").

### 28.2. Nội Dung Động (Dynamic Content)
- `AIPersonalizedBanner`: Banner quảng cáo tự động thay đổi hình ảnh và thông điệp (Copywriting) phù hợp với hồ sơ người dùng (User Persona).
- `SmartReviewSummary`: Component tổng hợp hàng ngàn đánh giá thành một đoạn văn ngắn gọn bằng AI, hiển thị ngay dưới tên sản phẩm.

---

## 29. COMPONENTS GIAO DIỆN ĐIỆN TOÁN BIÊN (EDGE COMPUTING UI)
*Tối ưu hóa trải nghiệm cho người dùng ở các khu vực địa lý khác nhau.*

### 29.1. Chỉ Báo Định Tuyến (Routing Indicators)
- `EdgeNodeBadge`: Nhãn nhỏ hiển thị tên máy chủ biên (Edge Server) mà người dùng đang kết nối (ví dụ: "Connected to: SG-Node-01") để minh bạch về tốc độ.
- `LatencyOptimizerToggle`: Nút bật/tắt chế độ "Tối ưu hóa độ trễ", cho phép hệ thống tự động chuyển đổi giữa các CDN hoặc mạng P2P để tìm đường truyền nhanh nhất.

---

## 30. RANH GIỚI LỖI & PHỤC HỒI (ERROR BOUNDARIES & RECOVERY)
*Ngăn chặn toàn bộ ứng dụng bị sập khi một component nhỏ gặp lỗi.*

### 30.1. Ranh Giới Lỗi (Error Boundaries)
- `ComponentCrashCard`: Một thẻ thay thế hiển thị thông báo "Phần này đang gặp sự cố" kèm nút "Thử lại" (Retry) khi một component cụ thể (ví dụ: Biểu đồ giá) bị lỗi render, giữ cho phần còn lại của trang vẫn hoạt động bình thường.

### 30.2. Phục Hồi Trạng Thái (State Recovery)
- `SessionRestorePrompt`: Hộp thoại xuất hiện khi người dùng mở lại tab sau khi trình duyệt bị crash, hỏi "Bạn có muốn khôi phục phiên đấu giá đang xem dở không?".

---

## 31. COMPONENTS TÍCH HỢP WEBASSEMBLY (WASM COMPONENTS)
*Các component thực thi các tác vụ tính toán nặng ngay trên trình duyệt với tốc độ gần bằng ứng dụng Native.*

### 31.1. Xử Lý Đa Phương Tiện (Media Processing)
- `WasmVideoTranscoder`: Component ẩn (hoặc có thanh tiến trình nhỏ) tự động chuyển đổi định dạng video (ví dụ: từ .mov sang .mp4) và nén dung lượng trước khi upload, tiết kiệm băng thông mạng.
- `RealtimeAudioDenoiser`: Nút bật/tắt bộ lọc tiếng ồn bằng AI (chạy qua WASM) cho người bán khi đang livestream trong môi trường ồn ào.

### 31.2. Tính Toán Mật Mã (Cryptographic Operations)
- `ZKPGeneratorWidget`: Giao diện hiển thị quá trình tạo Bằng chứng Không Tiết lộ (Zero-Knowledge Proof) tại client trước khi gửi lên mạng P2P, đảm bảo dữ liệu không bao giờ rời khỏi máy ở dạng rõ (plaintext).
- `LocalKeyVaultManager`: Bảng điều khiển quản lý các khóa mã hóa (Encryption Keys) được lưu trữ an toàn trong bộ nhớ trình duyệt (IndexedDB + WebCrypto API).

---

## 32. GIAO DIỆN TÍCH HỢP IOT & THIẾT BỊ NGOẠI VI (IOT & PERIPHERALS UI)
*Kết nối hệ thống với các thiết bị phần cứng bên ngoài.*

### 32.1. Quản Lý Thiết Bị (Device Management)
- `BluetoothScannerModal`: Hộp thoại quét và kết nối với các thiết bị Bluetooth LE (ví dụ: Cân điện tử để tự động nhập trọng lượng gói hàng, Máy in nhiệt để in mã vận đơn).
- `HardwareWalletConnector`: Giao diện kết nối với ví cứng (Ledger, Trezor) qua WebUSB API để ký các giao dịch đấu giá giá trị cao.

### 32.2. Hiển Thị Dữ Liệu Cảm Biến (Sensor Data Display)
- `LiveEnvironmentGauge`: Biểu đồ nhỏ hiển thị nhiệt độ/độ ẩm thực tế của kho hàng (dành cho các sản phẩm nhạy cảm như rượu vang, xì gà) lấy từ cảm biến IoT của người bán.

---

## 33. GIAO DIỆN ĐIỀU KHIỂN BẰNG GIỌNG NÓI (VOICE USER INTERFACE - VUI)
*Tương tác với hệ thống không cần chạm tay (Hands-free).*

### 33.1. Trợ Lý Giọng Nói (Voice Assistant)
- `FloatingVoiceOrb`: Quả cầu phát sáng lơ lửng trên màn hình, nhấp nháy theo nhịp điệu khi người dùng nói lệnh (ví dụ: "AmazeBid, tìm cho tôi đồng hồ Rolex cổ").
- `VoiceCommandTooltip`: Các gợi ý lệnh giọng nói hiện lên mờ mờ cạnh các nút bấm chính (ví dụ: "Nói 'Đặt giá' để đấu giá ngay").

### 33.2. Phản Hồi Âm Thanh (Audio Feedback)
- `SpatialAudioBidding`: Hiệu ứng âm thanh không gian (3D Audio) khi có người trả giá mới, âm thanh sẽ phát ra từ hướng (trái/phải) tương ứng với vị trí avatar của người đó trên màn hình.

---

## 34. LỚP PHỦ HỖ TRỢ TRUY CẬP NÂNG CAO (ADVANCED ACCESSIBILITY OVERLAYS)
*Đưa tính năng trợ năng lên một tầm cao mới.*

### 34.1. Hỗ Trợ Nhận Thức (Cognitive Support)
- `FocusModeOverlay`: Chế độ làm mờ toàn bộ các thành phần gây xao nhãng (quảng cáo, chat, hiệu ứng nhấp nháy), chỉ làm nổi bật hình ảnh sản phẩm và nút Đặt giá.
- `DyslexiaFontToggle`: Nút chuyển đổi toàn bộ font chữ trên trang sang định dạng OpenDyslexic (hỗ trợ người mắc chứng khó đọc).

### 34.2. Hỗ Trợ Vận Động (Motor Support)
- `EyeTrackingCursor`: Tích hợp với WebXR/Camera để hiển thị con trỏ chuột di chuyển theo ánh mắt của người dùng (dành cho người khuyết tật vận động tay).
- `DwellClickProgress`: Vòng tròn tiến trình xuất hiện quanh nút bấm khi người dùng nhìn chằm chằm (dwell) vào đó quá 2 giây, tự động kích hoạt click.

---

## 35. CÔNG CỤ XUẤT/NHẬP DỮ LIỆU (DATA EXPORT & IMPORT TOOLS)
*Cho phép người dùng kiểm soát hoàn toàn dữ liệu cá nhân của họ.*

### 35.1. Quản Lý Dữ Liệu Cá Nhân (Personal Data Management)
- `GDPRDataExporter`: Giao diện cho phép người dùng chọn các loại dữ liệu (Lịch sử đấu giá, Tin nhắn, Đánh giá) và tải về dưới dạng file JSON hoặc CSV được mã hóa.
- `AccountPortabilityWizard`: Trình hướng dẫn các bước để chuyển toàn bộ dữ liệu tài khoản và uy tín (Reputation Score) sang một nền tảng Web3 khác.

### 35.2. Nhập Dữ Liệu Hàng Loạt (Bulk Import)
- `CSVInventoryUploader`: Khu vực kéo thả file CSV/Excel cho người bán để đăng hàng loạt sản phẩm lên sàn, kèm theo bảng xem trước (Preview Table) và báo lỗi từng dòng (Row-level error reporting).

---

## 36. GIAO DIỆN TÌM KIẾM & KHÁM PHÁ NÂNG CAO (ADVANCED SEARCH & DISCOVERY UI)
*Cung cấp các công cụ tìm kiếm mạnh mẽ, vượt ra ngoài việc gõ từ khóa thông thường.*

### 36.1. Tìm Kiếm Bằng Hình Ảnh & Camera (Visual Search)
- `CameraSearchOverlay`: Giao diện mở camera toàn màn hình, có khung ngắm (viewfinder) nhận diện vật thể theo thời gian thực (Real-time Object Detection) để tìm sản phẩm tương tự trên sàn.
- `ImageCropSearch`: Khi người dùng upload một bức ảnh có nhiều đồ vật, component này cho phép họ khoanh vùng (crop) chính xác món đồ muốn tìm.

### 36.2. Bộ Lọc Động & Gợi Ý Thông Minh (Dynamic Filters & Suggestions)
- `FacetFilterSidebar`: Thanh bên chứa các bộ lọc tự động thay đổi dựa trên ngữ cảnh (ví dụ: Tìm "điện thoại" sẽ hiện bộ lọc RAM/ROM, tìm "áo" sẽ hiện bộ lọc Size/Chất liệu).
- `SearchAutocompleteDropdown`: Menu thả xuống khi gõ từ khóa, không chỉ gợi ý text mà còn hiển thị luôn ảnh sản phẩm thu nhỏ (Thumbnail), danh mục liên quan và lịch sử tìm kiếm gần đây.

---

## 37. BẢN ĐỒ TƯƠNG TÁC & VỊ TRÍ (INTERACTIVE MAPS & LOCATION UI)
*Trực quan hóa dữ liệu địa lý cho việc giao hàng và mạng lưới P2P.*

### 37.1. Theo Dõi Giao Hàng Thời Gian Thực (Live Delivery Tracking)
- `InteractiveDeliveryMap`: Bản đồ (Google Maps/Mapbox) hiển thị vị trí shipper di chuyển theo thời gian thực, có biểu tượng chiếc xe và đường đi dự kiến.
- `DeliveryMilestoneTimeline`: Trục thời gian dọc nằm cạnh bản đồ, sáng lên từng bước (Lấy hàng -> Đang giao -> Hoàn thành) kèm thời gian dự kiến (ETA).

### 37.2. Khám Phá Sản Phẩm Theo Khu Vực (Geospatial Discovery)
- `LocalAuctionRadar`: Giao diện radar quét các phiên đấu giá đang diễn ra trong bán kính 5km-10km xung quanh người dùng (hữu ích cho việc mua bán đồ cũ, giao dịch trực tiếp).
- `P2PNodeMap`: Bản đồ toàn cầu hiển thị các node mạng P2P đang hoạt động, phát sáng (glow) khi có dữ liệu truyền qua.

---

## 38. TRẢI NGHIỆM MUA SẮM THỰC TẾ TĂNG CƯỜNG (AR SHOPPING EXPERIENCE)
*Mang sản phẩm vào không gian thực của người dùng trước khi quyết định mua.*

### 38.1. Xem Mô Hình 3D Trong Không Gian (AR Object Placement)
- `ARSurfaceDetector`: Component sử dụng camera để nhận diện mặt phẳng (bàn, sàn nhà) và hiển thị lưới (grid) hướng dẫn người dùng đặt mô hình 3D của sản phẩm lên đó.
- `ARScaleController`: Thanh trượt cho phép người dùng phóng to/thu nhỏ mô hình 3D hoặc xem ở tỷ lệ thực tế 1:1 (True-to-scale).

### 38.2. Thử Đồ Ảo (Virtual Try-On)
- `FaceMeshTryOn`: Giao diện nhận diện khuôn mặt 3D để thử kính mắt, mũ, trang sức. Có nút chụp ảnh (Snapshot) và quay video ngắn.
- `WristTrackingTryOn`: Nhận diện cổ tay để thử đồng hồ, vòng tay, tự động điều chỉnh ánh sáng và bóng đổ (shadows) cho chân thực.

---

## 39. CHƯƠNG TRÌNH KHÁCH HÀNG THÂN THIẾT TRÒ CHƠI HÓA (GAMIFIED LOYALTY PROGRAM)
*Tăng tương tác và giữ chân người dùng thông qua các cơ chế giống trò chơi.*

### 39.1. Hệ Thống Cấp Độ & Phần Thưởng (Leveling & Rewards)
- `UserTierDashboard`: Bảng điều khiển hiển thị cấp độ hiện tại (Đồng, Bạc, Vàng, Kim Cương), thanh kinh nghiệm (XP bar) và các đặc quyền (Perks) tương ứng.
- `UnlockAnimationModal`: Hộp thoại xuất hiện với hiệu ứng pháo sáng rực rỡ khi người dùng lên cấp hoặc mở khóa một thành tựu (Achievement) mới.

### 39.2. Thử Thách & Bảng Xếp Hạng (Challenges & Leaderboards)
- `WeeklyChallengeCard`: Thẻ hiển thị các thử thách tuần (ví dụ: "Thắng 3 phiên đấu giá", "Đóng góp 10GB băng thông P2P") kèm thanh tiến trình.
- `GlobalRankingsTable`: Bảng xếp hạng những người dùng tích cực nhất, có thể lọc theo khu vực hoặc danh mục sản phẩm.

---

## 40. BẢNG ĐIỀU KHIỂN PHÂN TÍCH NÂNG CAO (ADVANCED ANALYTICS DASHBOARDS)
*Cung cấp cái nhìn sâu sắc về hiệu suất kinh doanh cho Seller và Admin.*

### 40.1. Phân Tích Hành Vi Người Mua (Buyer Behavior Analytics)
- `ConversionFunnelChart`: Biểu đồ hình phễu hiển thị tỷ lệ chuyển đổi từ lúc xem sản phẩm -> thêm vào giỏ -> đặt giá -> thanh toán thành công.
- `DropOffPointAnalyzer`: Biểu đồ chỉ ra chính xác bước nào trong quy trình đấu giá khiến người dùng từ bỏ (Drop-off) nhiều nhất.

### 40.2. Dự Báo & Tối Ưu Hóa Bằng AI (AI Forecasting & Optimization)
- `PricePredictionGraph`: Biểu đồ đường hiển thị giá dự đoán của một sản phẩm trong tương lai dựa trên dữ liệu lịch sử và xu hướng thị trường (AI-driven).
- `InventoryRestockAlerts`: Bảng cảnh báo thông minh cho Seller biết mặt hàng nào sắp hết và gợi ý số lượng cần nhập thêm dựa trên dự báo nhu cầu.

---

## 41. THƯƠNG MẠI XÃ HỘI & ĐỒNG TỔ CHỨC (SOCIAL COMMERCE & CO-HOSTING UI)
*Các component giúp tăng tính lan truyền và tương tác cộng đồng trong các phiên đấu giá.*

### 41.1. Giao Diện Livestream Đa Luồng (Multi-Streamer Grid)
- `SplitScreenLive`: Giao diện chia đôi hoặc chia tư màn hình khi nhiều Seller (hoặc Seller và KOL) cùng "Co-host" một phiên đấu giá.
- `GuestRequestQueue`: Danh sách hàng đợi những người xem xin phép được "lên mic" hoặc bật camera để đặt câu hỏi trực tiếp cho Seller.

### 41.2. Tương Tác & Quà Tặng Ảo (Tipping & Virtual Gifts)
- `GiftTrayOverlay`: Khay quà tặng ảo (Hoa hồng, Siêu xe, Tên lửa) trượt từ dưới lên để người xem mua bằng Token/Coin và tặng cho Seller.
- `DonationTicker`: Dòng chữ chạy ngang (Marquee) trên cùng màn hình vinh danh những người dùng vừa tặng quà hoặc tip tiền lớn nhất.

---

## 42. ĐẤU GIÁ BÁN BUÔN & B2B (B2B & WHOLESALE AUCTIONS)
*Giao diện chuyên biệt dành cho các doanh nghiệp, nhà bán buôn mua số lượng lớn.*

### 42.1. Đặt Giá Sỉ Đa Phân Loại (Bulk Bidding Matrix)
- `VariantBidMatrix`: Bảng ma trận cho phép người mua B2B nhập giá thầu và số lượng cho nhiều phân loại cùng lúc (ví dụ: Đấu giá 100 áo Đỏ size M, 50 áo Xanh size L trong cùng một lượt).
- `RFQBuilder` (Request for Quotation): Form tạo yêu cầu báo giá phức tạp, cho phép đính kèm file PDF/CAD mô tả kỹ thuật sản phẩm cần mua.

### 42.2. Hợp Đồng Ký Quỹ Thông Minh (Smart Contract Escrow UI)
- `EscrowMilestoneTracker`: Trục thời gian theo dõi tiến độ giải ngân tiền ký quỹ B2B (ví dụ: Giải ngân 30% khi ký hợp đồng, 70% khi nhận hàng).
- `DigitalSignaturePad`: Khu vực ký tên điện tử (E-signature) hoặc xác nhận bằng ví Web3 để chốt hợp đồng B2B ngay trên trình duyệt.

---

## 43. THƯƠNG MẠI ĐIỆN TỬ XANH & BỀN VỮNG (SUSTAINABILITY & GREEN E-COMMERCE)
*Các component thúc đẩy ý thức bảo vệ môi trường và kinh tế tuần hoàn.*

### 43.1. Theo Dõi Dấu Chân Carbon (Carbon Footprint Tracker)
- `EcoImpactBadge`: Nhãn dán hình chiếc lá hiển thị lượng khí thải CO2 tiết kiệm được khi mua đồ cũ (Second-hand) thay vì mua đồ mới.
- `CarbonOffsetToggle`: Nút gạt lúc thanh toán cho phép người mua quyên góp thêm 1-2$ để trồng cây hoặc bù đắp lượng carbon cho quá trình vận chuyển.

### 43.2. Vòng Đời Sản Phẩm (Product Lifecycle)
- `CircularEconomyTimeline`: Biểu đồ hiển thị lịch sử các đời chủ của một món đồ cũ (Đã qua tay 3 người, được sửa chữa 1 lần) được xác thực bằng Blockchain.
- `EcoPackagingSelector`: Tùy chọn đóng gói (Hộp tái chế, Không dùng nilon) trong bước Checkout, kèm hình ảnh minh họa vật liệu.

---

## 44. GIAO DIỆN KHÔNG GIAN & METAVERSE (SPATIAL COMPUTING & METAVERSE UI)
*Chuẩn bị cho các thiết bị kính thực tế ảo/hỗn hợp (Apple Vision Pro, Meta Quest).*

### 44.1. Bảng Điều Khiển Không Gian (Spatial Panels)
- `GlassmorphismWindow`: Các cửa sổ UI có hiệu ứng kính mờ (frosted glass), lơ lửng trong không gian 3D, tự động xoay theo góc nhìn của người dùng (Gaze-tracking).
- `VolumetricProductCard`: Thẻ sản phẩm 3D có chiều sâu, khi người dùng đưa tay (Hand-tracking) chạm vào sẽ có phản hồi xúc giác (Haptic feedback) hoặc âm thanh.

### 44.2. Phòng Trưng Bày Ảo (Virtual Showroom)
- `MetaverseAuctionHouse`: Môi trường 3D toàn cảnh (Panoramic 360) mô phỏng một sàn đấu giá thực tế. Người dùng có thể dùng Avatar để đi lại, xem sản phẩm và giơ tay (Raise hand gesture) để đặt giá.

---

## 45. CÔNG CỤ GỠ LỖI TÍCH HỢP CHO DEV (IN-APP DEVTOOLS & DEBUGGING)
*Các component ẩn chỉ dành cho Developer và Admin để kiểm tra hệ thống ngay trên môi trường Production.*

### 45.1. Lớp Phủ Hiệu Năng (Performance Profiler Overlay)
- `FPSMemoryGauge`: Đồng hồ nhỏ ở góc màn hình hiển thị số khung hình trên giây (FPS) và lượng RAM trình duyệt đang tiêu thụ (giúp phát hiện rò rỉ bộ nhớ khi xem livestream lâu).
- `P2PTrafficVisualizer`: Bảng console thu nhỏ in ra các log truyền nhận dữ liệu qua WebRTC/P2P theo thời gian thực.

### 45.2. Gỡ Lỗi Trạng Thái (State Debugger)
- `TimeTravelStateSlider`: Thanh trượt cho phép Dev tua lại (Rewind) trạng thái của Redux/Zustand store để xem UI thay đổi như thế nào trong quá khứ (rất hữu ích để tìm bug trong các phiên đấu giá diễn biến nhanh).
- `MockDataInjector`: Nút bấm cho phép bơm (inject) dữ liệu giả (ví dụ: Tạo giả 10.000 lượt bid cùng lúc) để test khả năng chịu tải của UI ngay trên trình duyệt.

---

## 46. CÔNG CỤ SÁNG TẠO NỘI DUNG (CREATOR & BROADCASTING STUDIO)
*Các component hỗ trợ Seller và KOL sản xuất nội dung chuyên nghiệp ngay trên trình duyệt.*

### 46.1. Trình Chỉnh Sửa Video Tích Hợp (In-Browser Video Editor)
- `ShortsTimelineEditor`: Giao diện cắt ghép video ngắn (Shorts/Reels) với trục thời gian (timeline), cho phép thêm nhạc nền, hiệu ứng chuyển cảnh và text trực tiếp trên web bằng WebAssembly.
- `AutoThumbnailGenerator`: Công cụ AI tự động trích xuất các khung hình đẹp nhất từ video và cho phép chèn chữ nghệ thuật (Typography) để làm ảnh bìa thu hút.

### 46.2. Hỗ Trợ Livestream Nâng Cao (Advanced Live Tools)
- `TeleprompterOverlay`: Máy nhắc chữ (Teleprompter) chạy chữ mờ trên màn hình livestream, tốc độ cuộn tự động điều chỉnh theo giọng nói của Seller (Voice-synced).
- `LivePollsAndQnA`: Component tạo bình chọn nhanh (Polls) hiển thị nổi trên luồng live, và tính năng ghim câu hỏi hay nhất của người xem lên màn hình chính.

---

## 47. QUẢN TRỊ QUAN HỆ KHÁCH HÀNG (SELLER CRM & MARKETING AUTOMATION)
*Giao diện giúp Seller quản lý và chăm sóc khách hàng tự động.*

### 47.1. Phân Khúc Khách Hàng (Customer Segmentation)
- `AudienceBuilder`: Giao diện kéo thả (Drag-and-drop) để tạo các tệp khách hàng dựa trên hành vi (ví dụ: "Đã mua > 3 lần", "Bỏ giỏ hàng tuần trước", "Thường xuyên bid thua").
- `CustomerProfileCard`: Thẻ hồ sơ chi tiết của một khách hàng, hiển thị lịch sử mua hàng, giá trị vòng đời (LTV - Lifetime Value) và các khiếu nại (nếu có).

### 47.2. Tự Động Hóa Tiếp Thị (Marketing Automation)
- `CampaignFlowCanvas`: Bảng vẽ sơ đồ cây (Node-based canvas) để thiết lập kịch bản gửi tin nhắn/email tự động (Ví dụ: Nếu khách bỏ giỏ -> Đợi 2h -> Gửi mã giảm giá 10%).
- `AABTestingDashboard`: Bảng điều khiển thiết lập và theo dõi kết quả các chiến dịch A/B Testing cho tiêu đề sản phẩm hoặc ảnh bìa.

---

## 48. GIAO DIỆN QUẢN LÝ KHO & VẬN HÀNH (WAREHOUSE & LOGISTICS UI)
*Dành cho các Seller lớn hoặc trung tâm phân phối của AmazeBid.*

### 48.1. Quản Lý Nhập/Xuất Kho (Inventory Operations)
- `BarcodeScannerViewport`: Giao diện mở camera điện thoại/máy tính bảng để quét mã vạch (Barcode) hoặc QR code, tự động cập nhật số lượng tồn kho với âm thanh "Bíp" phản hồi.
- `WarehousePickingMap`: Bản đồ 2D mô phỏng mặt bằng kho hàng, vẽ đường đi ngắn nhất (Optimized Routing) hướng dẫn nhân viên đi nhặt hàng (Picking) cho các đơn đã chốt.

### 48.2. Quản Lý Đội Xe & Vận Chuyển (Fleet & Dispatch)
- `DispatchKanbanBoard`: Bảng Kanban quản lý trạng thái các chuyến xe giao hàng (Chờ lấy -> Đang đi -> Hoàn thành), cho phép kéo thả đơn hàng vào từng chuyến xe.
- `ShippingLabelPrinter`: Component tạo và xem trước (Preview) tem vận chuyển hàng loạt, tích hợp nút in trực tiếp qua WebUSB API kết nối với máy in nhiệt.

---

## 49. QUẢN TRỊ DAO & BỎ PHIẾU PHI TẬP TRUNG (DAO GOVERNANCE & VOTING)
*Giao diện cho cộng đồng tham gia quyết định hướng đi của nền tảng.*

### 49.1. Đề Xuất & Thảo Luận (Proposals & Discussions)
- `ProposalDraftingForm`: Form tạo đề xuất thay đổi luật sàn (ví dụ: Giảm phí giao dịch), hỗ trợ soạn thảo Markdown và đính kèm mã Smart Contract (nếu có).
- `GovernanceForumThread`: Giao diện diễn đàn chuyên biệt cho các đề xuất, hiển thị rõ ai là người nắm giữ nhiều Token (Whales) và quan điểm của họ.

### 49.2. Bỏ Phiếu Bậc Hai (Quadratic Voting Panel)
- `QuadraticVotingInterface`: Giao diện bỏ phiếu đặc biệt, hiển thị trực quan sức mạnh lá phiếu (Voting Power) dựa trên số lượng Token đã khóa (Staked). Càng dồn nhiều phiếu cho một lựa chọn, chi phí Token càng tăng theo cấp số nhân.
- `LiveTallyDonutChart`: Biểu đồ Donut hiển thị kết quả kiểm phiếu theo thời gian thực ngay khi có người dùng ký giao dịch bỏ phiếu trên Blockchain.

---

## 50. QUẢN LÝ QUYỀN RIÊNG TƯ & ĐỒNG THUẬN (PRIVACY & CONSENT MANAGEMENT)
*Trao toàn quyền kiểm soát dữ liệu cá nhân cho người dùng theo chuẩn GDPR/CCPA.*

### 50.1. Trung Tâm Đồng Thuận (Consent Center)
- `GranularCookieToggles`: Bảng điều khiển chi tiết cho phép người dùng bật/tắt từng loại trình theo dõi (Trackers): Phân tích (Analytics), Tiếp thị (Marketing), hoặc Đóng góp mạng P2P.
- `DataBreachAlertBanner`: Banner cảnh báo khẩn cấp (màu đỏ) xuất hiện trên cùng màn hình nếu hệ thống phát hiện có rủi ro bảo mật, kèm nút đổi mật khẩu/khóa ví ngay lập tức.

### 50.2. Quyền Được Lãng Quên (Right to be Forgotten)
- `AccountErasureWizard`: Luồng nhiều bước (Multi-step flow) hướng dẫn người dùng xóa vĩnh viễn tài khoản.
- `P2PDataPurgeVisualizer`: Hiệu ứng đồ họa hiển thị quá trình hệ thống đang gửi lệnh "Xóa" đến các Node P2P khác để gỡ bỏ hoàn toàn dấu vết kỹ thuật số của người dùng khỏi mạng lưới phi tập trung.

---
*File đặc tả này đảm bảo đội ngũ Frontend nắm bắt toàn bộ tầm nhìn của hệ thống, từ các trang cơ bản đến các giao diện tương tác phức tạp phục vụ cho kiến trúc phi tập trung và AI tại chỗ.*
