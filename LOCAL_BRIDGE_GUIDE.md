# Hướng dẫn Cài đặt Local Bridge (AmazeAvatar Pro)

Tính năng **Local Bridge** cho phép bạn kết nối bảng điều khiển AmazeAvatar Studio Pro trên nền web với các phần mềm Livestream chuyên nghiệp trên máy tính của bạn (OBS Studio và VSeeFace).

Điều này giúp bạn tạo ra một cỗ máy Livestream hoàn toàn tự động: AI (Gemini) suy nghĩ trên Web -> Ra lệnh cho VSeeFace nhép môi/biểu cảm -> OBS đổi cảnh/hiện sản phẩm.

---

## Yêu cầu chuẩn bị
1. Máy tính đã cài đặt **Node.js**.
2. Phần mềm **OBS Studio** (phiên bản mới nhất có sẵn WebSocket).
3. Phần mềm **VSeeFace** (dành cho Avatar 3D VRM).

---

## Bước 1: Khởi chạy Local Bridge Script
1. Tạo một thư mục mới trên máy tính của bạn (ví dụ: `amaze-bridge`).
2. Tải file `local-bridge.js` từ hệ thống và lưu vào thư mục này.
3. Mở Terminal (hoặc Command Prompt) tại thư mục đó và chạy các lệnh sau:
   ```bash
   npm init -y
   npm install express cors obs-websocket-js
   ```
4. Mở file `local-bridge.js` bằng Notepad hoặc VS Code, tìm dòng `const OBS_PASSWORD = 'your_obs_password_here';` và thay bằng mật khẩu OBS của bạn (xem Bước 2).
5. Khởi chạy script:
   ```bash
   node local-bridge.js
   ```
   *Nếu thấy thông báo "AmazeAvatar Local Bridge is running on port 3001", bạn đã thành công.*

---

## Bước 2: Cấu hình OBS Studio
1. Mở OBS Studio.
2. Trên thanh menu, chọn **Tools** -> **WebSocket Server Settings**.
3. Tích chọn **Enable WebSocket server**.
4. Đảm bảo **Server Port** là `4455`.
5. Tích chọn **Enable Authentication** và đặt một mật khẩu (nhớ nhập mật khẩu này vào file `local-bridge.js` ở Bước 1).
6. Nhấn **Apply** và **OK**.

---

## Bước 3: Cấu hình VSeeFace
1. Mở VSeeFace và load nhân vật 3D (.vrm) của bạn.
2. Vào **Settings** -> **General Settings**.
3. Cuộn xuống phần **OSC/VMC receiver**.
4. Tích chọn **Enable OSC/VMC receiver**.
5. Đảm bảo **Port** là `3333`.

---

## Bước 4: Trải nghiệm
1. Quay lại trang web AmazeAvatar Studio Pro.
2. Vào tab **4. Phát sóng**.
3. Nhấn **Bắt đầu Livestream**.
4. Thử chat với Avatar các câu lệnh như:
   * *"Ghim sản phẩm này lên màn hình đi"* -> OBS sẽ tự động hiện hình ảnh sản phẩm.
   * *"Đổi sang cảnh ngoài trời đi"* -> OBS sẽ chuyển Scene.
   * *"Kể chuyện cười đi"* -> VSeeFace sẽ tự động kích hoạt biểu cảm "Fun" (Vui vẻ).

Chúc bạn có những buổi Livestream bùng nổ doanh số cùng AmazeAvatar!
