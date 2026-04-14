# Hệ thống Lưu ký (Escrow) và Ví Người Bán

Tài liệu này mô tả kiến trúc và luồng hoạt động của hệ thống Lưu ký (Escrow) và Ví Người Bán (Seller Wallet) trong nền tảng AmazeBid.

## 1. Mục đích
- **Bảo vệ Người Mua:** Đảm bảo tiền của người mua được an toàn cho đến khi họ nhận được hàng đúng như mô tả.
- **Bảo vệ Người Bán:** Đảm bảo người mua đã thanh toán trước khi giao hàng.
- **Bảo vệ Nền tảng:** Tự động trích xuất phí hoa hồng (Platform Fee) một cách minh bạch và chính xác.
- **Tuân thủ Pháp luật (KYC):** Yêu cầu người bán xác minh danh tính trước khi rút tiền để phòng chống rửa tiền và gian lận.

## 2. Cấu trúc Dữ liệu (Data Structure)

### 2.1. Ví Người Dùng (User Wallet)
Mỗi người dùng (đặc biệt là người bán) sẽ có một ví điện tử đi kèm tài khoản:
- `balance` (Số dư khả dụng): Số tiền có thể rút về ngân hàng hoặc dùng để mua hàng.
- `pendingBalance` (Số dư tạm giữ): Số tiền từ các đơn hàng đã thanh toán nhưng chưa hoàn tất giao hàng.
- `kycStatus`: Trạng thái xác minh danh tính (`unverified`, `pending`, `verified`, `rejected`).
- `bankAccount`: Thông tin tài khoản ngân hàng đã được mã hóa (Mô phỏng).

### 2.2. Trạng thái Lưu ký của Đơn hàng (Order Escrow Status)
Mỗi đơn hàng sẽ có trạng thái lưu ký:
- `held`: Tiền đang bị giữ trong hệ thống (Pending).
- `released`: Tiền đã được giải phóng cho người bán (sau khi trừ phí).
- `refunded`: Tiền đã được hoàn trả cho người mua (nếu có tranh chấp).

## 3. Luồng Hoạt động (Workflow)

### Bước 1: Thanh toán Đơn hàng (Checkout)
1. Người mua thanh toán đơn hàng trị giá `$100`.
2. Hệ thống ghi nhận đơn hàng.
3. `$100` được cộng vào `pendingBalance` (Số dư tạm giữ) của Người Bán.
4. Trạng thái Escrow của đơn hàng là `held`.

### Bước 2: Giải phóng Lưu ký (Release Escrow)
1. Người mua xác nhận "Đã nhận hàng" (hoặc hệ thống tự động xác nhận sau 7 ngày).
2. Hệ thống tính toán phí sàn (VD: 5% = `$5`).
3. Hệ thống trừ `$100` khỏi `pendingBalance` của Người Bán.
4. Hệ thống cộng `$95` vào `balance` (Số dư khả dụng) của Người Bán.
5. Hệ thống cộng `$5` vào `SystemWallet` (Ví Sàn) của Admin.
6. Trạng thái Escrow của đơn hàng chuyển thành `released`.

### Bước 3: Rút tiền (Withdrawal)
1. Người bán yêu cầu rút `$50` từ Số dư khả dụng.
2. Hệ thống kiểm tra `kycStatus` (Phải là `verified`).
3. Hệ thống kiểm tra `bankAccount` (Phải được liên kết).
4. Nếu hợp lệ, trừ `$50` khỏi `balance` và tạo lệnh chuyển khoản (Mô phỏng).

## 4. Bảo mật và Mã hóa
- **Mã hóa Dữ liệu (Encryption at Rest):** Thông tin tài khoản ngân hàng và dữ liệu KYC (CCCD/CMND) được mã hóa AES-256 trong cơ sở dữ liệu.
- **Truyền tải An toàn (Encryption in Transit):** Mọi API gọi liên quan đến ví và thanh toán đều qua HTTPS/TLS.
- **Xác thực 2 Lớp (2FA):** Yêu cầu mã OTP khi thực hiện thay đổi thông tin ngân hàng hoặc rút tiền.
