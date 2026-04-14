# Kiến trúc Luồng Tạm giữ tiền (Escrow) và Ví Người Bán

Tài liệu này giải thích chi tiết về cách hệ thống xử lý thanh toán, lưu ký tiền (Escrow) và bảo mật thông tin tài khoản ngân hàng.

## 1. Rút tiền về tài khoản ngân hàng (Withdrawal Verification)

Khi người dùng (Người bán hoặc Admin) thực hiện rút tiền từ Ví Sàn về tài khoản ngân hàng thực tế, hệ thống cần các yếu tố xác minh sau để đảm bảo an toàn, chống rửa tiền (AML) và chống gian lận:

*   **Xác minh danh tính (KYC - Know Your Customer):** Người dùng phải hoàn thành KYC (tải lên CCCD/Passport và ảnh chân dung) trước khi được phép rút tiền.
*   **Xác thực hai yếu tố (2FA/OTP):** Mỗi lệnh rút tiền đều yêu cầu mã OTP gửi về Email hoặc ứng dụng Authenticator để xác nhận chính chủ đang thực hiện giao dịch.
*   **Kiểm tra tính hợp lệ của tài khoản ngân hàng:** Tên chủ tài khoản ngân hàng phải khớp với tên đã đăng ký KYC trên hệ thống.
*   **Thời gian chờ xử lý (Cool-down period):** Các khoản tiền vừa nhận từ giao dịch bán hàng có thể bị giữ lại (hold) trong 24-72 giờ để phòng ngừa các khiếu nại (chargeback) hoặc hoàn tiền từ người mua.

## 2. Thiết lập liên kết tài khoản ngân hàng của Admin/Seller

Để thiết lập liên kết với tài khoản ngân hàng, hệ thống sử dụng quy trình sau:

*   **Nhập thông tin:** Người dùng nhập Tên ngân hàng, Số tài khoản, và Tên chủ tài khoản.
*   **Mã hóa dữ liệu (Encryption):** Thông tin tài khoản ngân hàng **BẮT BUỘC** phải được mã hóa (ví dụ: AES-256) trước khi lưu vào cơ sở dữ liệu. Không bao giờ lưu bản rõ (plaintext) số tài khoản ngân hàng.
*   **Sử dụng Cổng thanh toán (Payment Gateway):** Trong thực tế, hệ thống nên tích hợp với các cổng thanh toán như Stripe Connect hoặc PayPal Payouts. Thay vì tự lưu trữ thông tin ngân hàng nhạy cảm (giảm thiểu rủi ro tuân thủ PCI-DSS), hệ thống sẽ tạo một "Connected Account" trên Stripe, và Stripe sẽ chịu trách nhiệm lưu trữ và xác minh tài khoản ngân hàng.

## 3. Tính năng thanh toán giữa Người mua và Người bán (Escrow Flow)

Để bảo vệ cả người mua và người bán, hệ thống áp dụng luồng **Tạm giữ tiền (Escrow)**:

1.  **Đặt hàng (Checkout):** Khi người mua thanh toán, tiền sẽ bị trừ khỏi Ví Người Mua (hoặc thẻ tín dụng) và được chuyển vào **Trạng thái Tạm giữ (Escrow Balance)** của Người bán. Tiền này nằm trên Ví của hệ thống (Ví Trung Gian), người bán chưa thể rút.
2.  **Giao hàng:** Người bán tiến hành giao hàng. Trạng thái đơn hàng chuyển sang `SHIPPED`.
3.  **Xác nhận nhận hàng:** Người mua nhận được hàng và bấm "Xác nhận đã nhận" (hoặc hệ thống tự động xác nhận sau 3-7 ngày nếu không có khiếu nại).
4.  **Giải phóng tiền (Release Escrow):** Hệ thống chuyển tiền từ `Escrow Balance` sang `Available Balance` (Số dư khả dụng) trong Ví Người Bán. Lúc này, người bán có thể rút tiền về ngân hàng.

### Xác minh đăng ký tài khoản có cần được lưu ký không và có cần mã hóa không?

*   **Lưu ký (Escrow):** Việc xác minh tài khoản không liên quan trực tiếp đến lưu ký tiền, nhưng *chỉ những tài khoản đã xác minh (KYC)* mới được phép nhận tiền giải phóng từ Escrow và rút tiền.
*   **Mã hóa (Encryption):** **CÓ, RẤT CẦN THIẾT.** Mọi thông tin xác minh (CCCD, số điện thoại, số tài khoản ngân hàng) đều là Dữ liệu Cá nhân Nhạy cảm (PII). Chúng phải được mã hóa ở cấp độ cơ sở dữ liệu (Encryption at rest) và mã hóa đường truyền (TLS/SSL - Encryption in transit).

---

## Kế hoạch Tích hợp (Implementation)

1.  **Cập nhật Mô hình Ví (Wallet Model):** Thêm trường `escrowBalance` bên cạnh `balance` (số dư khả dụng).
2.  **Giao diện Ví Người Bán (Seller Wallet UI):** Hiển thị rõ ràng Số dư khả dụng và Số dư đang tạm giữ.
3.  **API Giải phóng tiền (Release Escrow API):** Xử lý logic chuyển tiền từ Escrow sang Available khi đơn hàng hoàn tất.
4.  **Giao diện Quản lý Ngân hàng:** Cho phép thêm/sửa thông tin ngân hàng với các trường dữ liệu được bảo mật.
