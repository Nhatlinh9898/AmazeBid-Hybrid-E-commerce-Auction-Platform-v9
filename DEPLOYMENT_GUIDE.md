
# Hướng Dẫn Triển Khai & Cài Đặt AmazeBid (Phiên bản Frontend)

Tài liệu này hướng dẫn bạn cách đưa trang web AmazeBid lên internet **miễn phí** trong vòng 5 phút mà **không cần viết Backend**.

Phiên bản hiện tại của ứng dụng hoạt động độc lập (Standalone). Dữ liệu (giỏ hàng, lịch sử đấu giá giả lập) sẽ được lưu tạm thời trên trình duyệt của người dùng.

---

## Cách 1: Triển khai lên Vercel (Khuyên dùng - Nhanh nhất)

Vercel là nền tảng tốt nhất cho các ứng dụng React.

### Bước 1: Đẩy mã nguồn lên GitHub
1.  Tạo một tài khoản tại [github.com](https://github.com).
2.  Tạo một **Repository** mới (Ví dụ: `amazebid-app`).
3.  Mở Terminal tại thư mục dự án của bạn và chạy các lệnh sau:
    ```bash
    git init
    git add .
    git commit -m "First commit"
    git branch -M main
    git remote add origin https://github.com/<username-cua-ban>/amazebid-app.git
    git push -u origin main
    ```

### Bước 2: Kết nối với Vercel
1.  Truy cập [vercel.com](https://vercel.com) và đăng nhập bằng GitHub.
2.  Bấm nút **"Add New..."** -> **"Project"**.
3.  Tìm repository `amazebid-app` bạn vừa tạo và bấm **"Import"**.
4.  Ở màn hình cấu hình:
    *   **Framework Preset:** Chọn `Create React App` (hoặc Vite nếu bạn dùng Vite).
    *   **Environment Variables:** Nếu bạn có API Key của Google Gemini, hãy thêm vào đây:
        *   Key: `REACT_APP_GEMINI_API_KEY` (hoặc tên biến bạn dùng trong code).
        *   Value: `AIzaSy...` (Key của bạn).
5.  Bấm **"Deploy"**.

### Kết quả
Sau khoảng 1 phút, Vercel sẽ cung cấp cho bạn một đường link (ví dụ: `https://amazebid-app.vercel.app`). Bạn có thể gửi link này cho bất kỳ ai.

---

## Cách 2: Triển khai lên Netlify (Thay thế)

### Bước 1: Kéo thả (Manual Deploy)
Nếu bạn không muốn dùng GitHub, bạn có thể build thủ công.
1.  Tại thư mục dự án, chạy lệnh:
    ```bash
    npm run build
    ```
    *(Lệnh này sẽ tạo ra một thư mục `build` hoặc `dist` chứa file tĩnh).*
2.  Truy cập [app.netlify.com](https://app.netlify.com).
3.  Kéo thả thư mục `build` vừa tạo vào khu vực **"Drag and drop your site output folder here"**.

### Kết quả
Netlify sẽ ngay lập tức cung cấp một đường link (ví dụ: `https://chipper-sunflower-123.netlify.app`).

---

## Cách 3: Hướng Dẫn "Cài Đặt" App (PWA)

Vì ứng dụng đã được cấu hình PWA (`manifest.json` và `service-worker.js`), sau khi có đường link từ Vercel hoặc Netlify, bạn có thể cài đặt nó như sau:

### 1. Trên điện thoại Android (Chrome)
1.  Mở link web trên trình duyệt Chrome.
2.  Một thanh thông báo **"Thêm AmazeBid vào màn hình chính"** có thể hiện ra ở dưới cùng. Bấm vào đó.
3.  Nếu không thấy, bấm vào dấu 3 chấm (Menu) ở góc trên bên phải -> chọn **"Cài đặt ứng dụng"** hoặc **"Thêm vào màn hình chính"**.
4.  **Kết quả:** Icon AmazeBid sẽ xuất hiện trên màn hình điện thoại như một App bình thường. Khi mở lên sẽ không còn thanh địa chỉ của trình duyệt.

### 2. Trên iPhone/iPad (Safari - iOS)
1.  Mở link web trên trình duyệt Safari.
2.  Bấm vào nút **Chia sẻ** (biểu tượng hình vuông có mũi tên đi lên) ở giữa thanh dưới cùng.
3.  Kéo xuống và chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
4.  Bấm **"Thêm"**.

### 3. Trên Máy tính (Chrome/Edge)
1.  Mở link web.
2.  Nhìn lên thanh địa chỉ (bên phải), bạn sẽ thấy một biểu tượng **Màn hình máy tính có mũi tên tải xuống**.
3.  Bấm vào đó và chọn **"Cài đặt"**.
4.  Ứng dụng sẽ mở ra trong một cửa sổ riêng biệt, có icon trên Desktop và Taskbar.

---

## Lưu ý Quan trọng về Dữ liệu

Vì đây là phiên bản **Frontend Only** (chưa kết nối Backend thật):

1.  **Dữ liệu cục bộ:** Nếu bạn "Đăng bán" một sản phẩm trên điện thoại của bạn, **chỉ có bạn** nhìn thấy sản phẩm đó. Người khác vào web sẽ không thấy.
2.  **Đấu giá giả lập:** Các lượt trả giá từ "Bot" hoặc người dùng khác hiện tại là do máy tính tự tạo ra để mô phỏng trải nghiệm.
3.  **Mất dữ liệu:** Nếu bạn xóa lịch sử duyệt web hoặc đổi thiết bị, giỏ hàng và các thiết lập cá nhân sẽ mất.

Để dữ liệu đồng bộ giữa mọi người (Ví dụ: Bạn đăng bán -> Tôi nhìn thấy ngay), bạn cần thực hiện phần **Backend** theo hướng dẫn trong file `BACKEND_GUIDE.md`.
