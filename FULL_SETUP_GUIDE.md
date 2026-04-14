
# Hướng Dẫn Toàn Diện: Full Stack, Hosting, Domain & Gemini API

Tài liệu này sẽ hướng dẫn bạn chuyển đổi từ phiên bản "Chạy thử" sang một **Hệ thống thực tế (Production)**.

---

## PHẦN 1: Kiến Trúc Hệ Thống (Mô hình hoạt động)

Để chạy dự án này chuyên nghiệp, bạn không cài tất cả vào một chỗ. Chúng ta sẽ tách ra làm 3 phần nằm ở 3 nơi khác nhau (Best Practice):

1.  **Frontend (Giao diện):** Chứa code ReactJS.
    *   *Nơi để:* **Vercel** (Miễn phí, tốc độ cao nhất toàn cầu).
2.  **Backend (Server xử lý & Socket.io):** Chứa code Node.js/Express.
    *   *Nơi để:* **Render** hoặc **Railway** (Có gói miễn phí/giá rẻ, hỗ trợ chạy 24/7).
3.  **Database (Dữ liệu):** Chứa thông tin User, Sản phẩm.
    *   *Nơi để:* **MongoDB Atlas** (Cloud Database tốt nhất hiện nay).

---

## PHẦN 2: Thiết lập Database (MongoDB Atlas)

Đây là bước đầu tiên cần làm để có chỗ chứa dữ liệu.

1.  Truy cập [mongodb.com/atlas](https://www.mongodb.com/atlas) và đăng ký tài khoản (Free).
2.  Tạo một **Cluster** mới (Chọn gói **Shared - FREE**).
3.  Chọn Provider (AWS/Google) và Region (Nên chọn Singapore hoặc HongKong cho nhanh về VN).
4.  **Tạo User Database:**
    *   Vào tab "Database Access" -> "Add New Database User".
    *   Tạo username/password (Ví dụ: `admin` / `matkhaukho123`). **Lưu lại mật khẩu này**.
5.  **Cho phép kết nối:**
    *   Vào tab "Network Access" -> "Add IP Address".
    *   Chọn **"Allow Access from Anywhere"** (0.0.0.0/0). (Để Server ở Render có thể kết nối vào).
6.  **Lấy chuỗi kết nối (Connection String):**
    *   Bấm nút **"Connect"** ở Cluster -> Chọn **"Drivers"**.
    *   Copy chuỗi dạng: `mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`.
    *   Thay `<password>` bằng mật khẩu bạn tạo ở bước 4.

---

## PHẦN 3: Triển khai Backend (Server) lên Render

1.  **Chuẩn bị code:**
    *   Đảm bảo bạn đã viết code Backend (theo file `BACKEND_GUIDE.md`) và đẩy lên GitHub (trong thư mục `server/` hoặc một repo riêng).
2.  **Đăng ký Render:** Truy cập [render.com](https://render.com) -> Login bằng GitHub.
3.  **Tạo Web Service:**
    *   Bấm **"New +"** -> **"Web Service"**.
    *   Chọn Repository chứa code Backend của bạn.
4.  **Cấu hình:**
    *   **Name:** `amazebid-api` (hoặc tên tùy thích).
    *   **Region:** Singapore.
    *   **Build Command:** `npm install`
    *   **Start Command:** `node server.js`
5.  **Environment Variables (Biến môi trường):**
    *   Bấm vào nút "Advanced" hoặc tab "Environment". Thêm các biến sau:
        *   `MONGO_URI`: (Dán chuỗi kết nối MongoDB ở Phần 2 vào đây).
        *   `JWT_SECRET`: (Gõ bừa một chuỗi dài bảo mật).
        *   `GEMINI_API_KEY`: (Key AI của bạn - xem Phần 5).
6.  **Deploy:** Bấm "Create Web Service".
    *   Sau vài phút, Render sẽ cho bạn một đường link, ví dụ: `https://amazebid-api.onrender.com`. Đây là **API URL** của bạn.

---

## PHẦN 4: Triển khai Frontend & Kết nối Tên Miền (Domain)

### 4.1. Đăng ký Tên miền (Domain)
Bạn cần mua một tên miền (VD: `amazebid.com` hoặc `amazebid.store`).
*   **Mua ở đâu tốt nhất?**
    *   **Namecheap** hoặc **Porkbun**: Giá rẻ, giao diện tiếng Anh dễ dùng, ít bị spam quảng cáo, cập nhật DNS nhanh.
    *   **Mắt Bão / PA Vietnam**: Nếu bạn cần hóa đơn đỏ VAT tại Việt Nam và hỗ trợ tiếng Việt.
*   **Giá cả:** Tên miền `.com` khoảng $10-$15/năm. `.store` hoặc `.online` thường rẻ hơn ($2-$5 năm đầu).

### 4.2. Cấu hình Frontend trên Vercel
1.  Vào dự án Frontend trên Vercel (như đã làm ở `DEPLOYMENT_GUIDE.md`).
2.  Vào **Settings** -> **Environment Variables**.
3.  Thêm biến mới để Frontend biết Server nằm ở đâu:
    *   Key: `REACT_APP_API_URL`
    *   Value: `https://amazebid-api.onrender.com/api` (Link lấy từ Phần 3).
4.  Redeploy lại dự án (Vào tab Deployments -> Redeploy).

### 4.3. Trỏ Tên miền về Vercel
1.  Tại Vercel: Vào **Settings** -> **Domains**.
2.  Nhập tên miền bạn vừa mua (VD: `amazebid.store`) -> Bấm **Add**.
3.  Vercel sẽ hiện ra các thông số DNS cần cấu hình (Thường là A Record và CNAME).
4.  **Quay lại trang quản lý tên miền (Nơi bạn mua domain):**
    *   Tìm mục **DNS Management** hoặc **Advanced DNS**.
    *   Thêm bản ghi (Record) theo yêu cầu của Vercel. Ví dụ:
        *   Type: `A` | Host: `@` | Value: `76.76.21.21` (IP của Vercel).
        *   Type: `CNAME` | Host: `www` | Value: `cname.vercel-dns.com`.
5.  Đợi khoảng 15-30 phút, Vercel sẽ tự động cấp chứng chỉ bảo mật **SSL (HTTPS)** và trang web của bạn sẽ chạy chính thức trên tên miền riêng.

---

## PHẦN 5: Đăng ký & Tối ưu Google Gemini API

Đây là phần "trí tuệ" của ứng dụng.

### 5.1. Cách lấy API Key
1.  Truy cập [Google AI Studio](https://aistudio.google.com/).
2.  Đăng nhập bằng tài khoản Google.
3.  Bấm nút **"Get API key"** -> **"Create API key in new project"**.
4.  Copy chuỗi ký tự bắt đầu bằng `AIza...`.

### 5.2. Chọn gói (Tier) nào là tốt nhất?
*   **Free Tier (Miễn phí):**
    *   Đủ cho việc phát triển và demo (như hiện tại).
    *   Giới hạn: 15 request/phút (RPM).
    *   Nhược điểm: Dữ liệu bạn gửi lên *có thể* được Google dùng để train AI (không bảo mật tuyệt đối cho dữ liệu nhạy cảm).
*   **Pay-as-you-go (Trả phí):**
    *   Cần liên kết thẻ Visa vào Google Cloud Platform (GCP).
    *   Lợi ích: Giới hạn cao hơn nhiều (RPM không giới hạn, tính tiền theo triệu token).
    *   **Quan trọng:** Dữ liệu được bảo mật, Google cam kết không dùng để train AI.
    *   **Để dùng tính năng Video (Veo) hoặc Tạo ảnh chất lượng cao (Imagen 3), bạn bắt buộc phải dùng gói trả phí.**

### 5.3. Bảo mật API Key (Cực kỳ quan trọng)
Hiện tại code Frontend đang dùng key trực tiếp. Khi ra thực tế:
1.  **Tuyệt đối không để API Key trong code Frontend** (React). Hacker có thể F12 và lấy trộm key để dùng chùa, làm bạn tốn tiền.
2.  **Cách làm đúng:**
    *   Lưu `GEMINI_API_KEY` trong **Environment Variables** của Backend (Render).
    *   Frontend gọi về Backend: `POST https://amazebid-api.onrender.com/api/ai/ask`.
    *   Backend gọi sang Google Gemini và trả kết quả về.
    *   Như vậy, người dùng chỉ thấy API của bạn, không bao giờ thấy API Key của Google.

---

## TỔNG KẾT QUY TRÌNH CHẠY DỰ ÁN (Run Project)

Sau khi thiết lập xong, quy trình vận hành hàng ngày sẽ như sau:

1.  **Code trên máy tính (Local):**
    *   Chạy Frontend: `npm start` (Cổng 3000).
    *   Chạy Backend: `node server.js` (Cổng 5000).
    *   Hai cái này nói chuyện với nhau qua `localhost`.

2.  **Cập nhật tính năng:**
    *   Sửa code -> Commit -> Push lên GitHub.

3.  **Tự động cập nhật (CI/CD):**
    *   Ngay khi bạn Push code:
        *   **Vercel** tự động phát hiện thay đổi Frontend -> Build -> Deploy ra tên miền `amazebid.store`.
        *   **Render** tự động phát hiện thay đổi Backend -> Restart Server.

Hệ thống của bạn bây giờ đã là một ứng dụng **Cloud Native** hoàn chỉnh, tự động hóa và chuyên nghiệp.
