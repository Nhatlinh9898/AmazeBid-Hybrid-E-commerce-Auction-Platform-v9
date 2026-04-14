# Hướng dẫn Bảo mật & Quản trị Hệ thống AmazeBid

Tài liệu này tóm tắt các thiết lập bảo mật và cấu hình tài khoản Admin cao nhất cho hệ thống của bạn.

## 1. Thông tin Đăng nhập Admin (Mặc định)

Hiện tại, hệ thống được cấu hình mặc định với các thông tin sau:
- **Email Admin:** `Nhatlinhckm2016@gmail.com`
- **Mật khẩu:** `admin123`

## 2. Cấu hình Biến môi trường (.env)

Để thay đổi hoặc thiết lập tài khoản Admin, bạn hãy truy cập vào phần **Settings** trong AI Studio và cập nhật các biến sau:

```env
# Email của tài khoản Admin cao nhất
VITE_ADMIN_EMAIL=Nhatlinhckm2016@gmail.com

# Mật khẩu Admin (Hỗ trợ văn bản thuần hoặc mã hash Bcrypt)
ADMIN_PASSWORD=admin123
```

## 3. Kiến trúc Bảo mật 3 Lớp

Hệ thống đã được nâng cấp để bảo mật tuyệt đối thông tin Admin thông qua lớp dịch vụ trung gian `SecurityService.ts`.

### Lớp 1: Trừu tượng hóa (Abstraction)
Mã nguồn xử lý API (`routes/v3.ts`) không còn chứa bất kỳ email hay mật khẩu nào. Việc so sánh được thực hiện thông qua hàm `SecurityService.verifyAdmin()`. Điều này ngăn chặn việc lộ thông tin khi xem mã nguồn.

### Lớp 2: Bảo mật phía Máy chủ (Server-side Only)
Toàn bộ logic kiểm tra mật khẩu diễn ra trên Server. Trình duyệt của người dùng (Client-side) không thể thấy được các biến môi trường hay cách thức so sánh, kể cả khi sử dụng chức năng "Inspect Element".

### Lớp 3: Hỗ trợ Mã hóa (Bcrypt Hashing)
Hệ thống hỗ trợ so sánh mật khẩu đã được mã hóa. Bạn có thể thay thế `admin123` bằng một chuỗi hash Bcrypt để đảm bảo ngay cả khi tệp cấu hình bị lộ, mật khẩu thật vẫn an toàn.

## 4. Cách truy cập Trang Quản trị

1. Đăng nhập bằng Email Admin đã thiết lập.
2. Sau khi đăng nhập thành công, các nút chức năng sau sẽ xuất hiện trên thanh điều hướng (Navbar):
   - **Admin:** Quản lý ví, phê duyệt sản phẩm.
   - **AI Tasks:** Quản lý các tác vụ thông minh.
   - **AI Worker:** Điều hành công nhân AI chạy ngầm.

## 5. Bảo mật Tài khoản Người dùng (User Security)

Hệ thống áp dụng các tiêu chuẩn bảo mật nghiêm ngặt cho toàn bộ người dùng thông thường:

### Mã hóa Mật khẩu (Password Hashing)
- Mật khẩu người dùng được mã hóa bằng thuật toán **Bcrypt** trước khi lưu vào cơ sở dữ liệu.
- Hệ thống **không bao giờ** lưu mật khẩu dưới dạng văn bản thuần. Ngay cả quản trị viên cũng không thể xem được mật khẩu của người dùng.

### Bảo vệ Dữ liệu API
- Khi người dùng đăng nhập, thông tin mật khẩu (dù đã mã hóa) sẽ được **loại bỏ hoàn toàn** khỏi dữ liệu phản hồi từ Server.
- Trình duyệt chỉ nhận được thông tin công khai (tên, email, avatar), đảm bảo không có rò rỉ dữ liệu qua các công cụ phân tích mạng.

### Kiểm tra Trùng lặp
- Hệ thống tự động kiểm tra email khi đăng ký để ngăn chặn việc tạo tài khoản trùng lặp hoặc giả mạo.

## 6. Quản lý Phiên đăng nhập & Bảo mật JWT (Session Management)

Hệ thống sử dụng **JSON Web Tokens (JWT)** để quản lý phiên đăng nhập an toàn và linh hoạt.

### Thời hạn Phiên đăng nhập (Session Duration)
Người dùng có thể lựa chọn thời gian duy trì đăng nhập khi đăng nhập bằng Email/Mật khẩu:
- **24 Giờ**: Mặc định cho tính bảo mật tiêu chuẩn.
- **7 Ngày**: Tiện lợi cho người dùng thường xuyên.
- **30 Ngày**: Thời hạn tối đa cho các thiết bị tin cậy.

### Thu hồi Phiên đăng nhập (Reset Token)
Nếu người dùng nghi ngờ tài khoản bị xâm nhập hoặc muốn đăng xuất khỏi tất cả các thiết bị:
- **Token Versioning**: Mỗi người dùng có một `tokenVersion` được lưu trong cơ sở dữ liệu.
- **Chức năng Reset**: Nút "Reset Sessions" trong Hồ sơ người dùng (tab Bảo mật) sẽ tăng phiên bản này lên.
- **Hiệu lực**: Tất cả các JWT hiện có (chứa phiên bản cũ) sẽ trở nên vô hiệu ngay lập tức. Người dùng sẽ bị buộc phải đăng nhập lại trên mọi thiết bị.

### Chi tiết Kỹ thuật
- **JWT Secret**: Được ký bằng `JWT_SECRET` từ biến môi trường.
- **Xác thực Backend**: Mọi yêu cầu API đều kiểm tra `tokenVersion` trong JWT so với phiên bản hiện tại trong DB.
- **Lưu trữ Client**: JWT được lưu trong `localStorage` dưới tên `auth_token`.

## 7. Quy trình Khôi phục Khẩn cấp (Emergency Recovery)

Trong trường hợp tài khoản Admin hoặc người dùng bị chiếm quyền, bạn có thể sử dụng **Master Recovery Key** để lấy lại quyền kiểm soát.

### Bước 1: Thiết lập Master Key
Truy cập **Settings** -> **Secrets** và thiết lập biến môi trường:
- `MASTER_RECOVERY_KEY`: (Ví dụ: `AmazeBid-Secret-2026-XYZ`)
- **Lưu ý:** Đây là mã tối mật, chỉ người chủ ứng dụng mới được biết.

### Bước 2: Thực hiện Khôi phục
Sử dụng công cụ API (như Postman) hoặc yêu cầu tôi tạo một giao diện khôi phục để gọi endpoint:
- **URL:** `/api/auth/emergency-reset`
- **Method:** `POST`
- **Body (JSON):**
  ```json
  {
    "email": "email_bi_hack@gmail.com",
    "newPassword": "mat_khau_moi_sieu_manh",
    "recoveryKey": "gia_tri_cua_MASTER_RECOVERY_KEY"
  }
  ```

### Bước 3: Kết quả
Hệ thống sẽ:
1. Đặt lại mật khẩu mới cho tài khoản đó.
2. Tăng `tokenVersion`, khiến hacker bị **đăng xuất ngay lập tức** trên tất cả các thiết bị.
3. Bạn có thể dùng mật khẩu mới để đăng nhập lại.

## 8. Quản lý Chặn IP (IP Blocking)

Hệ thống hỗ trợ chặn các địa chỉ IP có dấu hiệu tấn công hoặc vi phạm chính sách.

### Cách thực hiện:
1. Truy cập **Admin Portal** -> **Cài đặt Bảo mật**.
2. Nhập địa chỉ IP cần chặn vào ô "Nhập địa chỉ IP".
3. Nhấn **Chặn IP**.

### Lưu ý:
- Khi một IP bị chặn, tất cả các yêu cầu từ IP đó sẽ nhận được lỗi `403 Forbidden`.
- Mọi hành động chặn/bỏ chặn đều được ghi lại trong **Log Bảo mật**.
- Hãy cẩn thận khi chặn IP để tránh chặn nhầm người dùng hợp lệ hoặc chính bản thân Admin (hệ thống sử dụng IP thật từ header `x-forwarded-for`).

## 9. Lưu ý quan trọng

- **Quyền hạn vĩnh viễn:** Tài khoản khớp với `VITE_ADMIN_EMAIL` luôn là tài khoản có quyền cao nhất, không thể bị xóa bởi các người dùng khác.
- **Bảo mật mật khẩu:** Khuyến khích đổi mật khẩu mặc định ngay sau khi hệ thống đi vào hoạt động chính thức.
- **Không chia sẻ .env:** Luôn giữ kín các giá trị trong phần Settings của bạn.

---
*Tài liệu này được tạo tự động để hỗ trợ quản trị viên hệ thống AmazeBid.*
