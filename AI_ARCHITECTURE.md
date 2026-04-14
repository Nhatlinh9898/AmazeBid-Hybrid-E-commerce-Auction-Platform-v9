# 🏗️ AmazeBid AI Architecture: 4-Layer Absolute Stability

Tài liệu này mô tả kiến trúc AI hiện đại được triển khai trong hệ thống AmazeBid, tập trung vào tính ổn định tuyệt đối, khả năng mở rộng và bảo mật dữ liệu.

---

## 🌟 Tổng quan kiến trúc (4 Layers)

Hệ thống chuyển dịch từ mô hình "Cloud-First" sang **"Local-First, Cloud-Augmented"**. Trong đó, Backend đóng vai trò là "Trái tim" quyết định trạng thái cuối cùng của dữ liệu.

### 0. Decentralized P2P Mesh Layer (GunDB)
*   **Vai trò**: Nền tảng kết nối phi tập trung.
*   **Nhiệm vụ**: Đồng bộ dữ liệu trực tiếp giữa các trình duyệt người dùng (Peer-to-Peer).
*   **Lợi ích**: Hệ thống vẫn hoạt động ngay cả khi Server trung tâm offline. Giảm tải băng thông cho Server.

### 1. Edge AI Layer (WebGPU / WASM)
*   **Vai trò**: Tận dụng tài nguyên người dùng (Zero Cost Compute).
*   **Nhiệm vụ**: Thực hiện Rewrite, phân tích dữ liệu ngay tại máy khách.
*   **Đặc điểm**: Ưu tiên số 1 trong Pipeline xử lý.

### 2. Cloud AI Augmentation Layer (Gemini / Cloud Models)
... (giữ nguyên)

### 2. Local Compute Core (Backend ACL - Local AI)
*   **Vai trò**: Bộ ổn định tuyệt đối (Absolute Stability Engine).
*   **Nhiệm vụ**: 
    *   Nhận dữ liệu thô từ Cloud.
    *   **Rewrite** toàn bộ nội dung theo Style (Gen Z, Luxury, Professional...).
    *   Sửa lỗi logic, định dạng và ép Schema tuyệt đối.
*   **Công nghệ**: Tích hợp **Ollama** (Llama 3, Mistral, Phi-3).

### 3. Validation & Normalization Layer
*   **Vai trò**: Chốt chặn dữ liệu (Data Guard).
*   **Nhiệm vụ**: Chuẩn hóa Media (Images/Videos), kiểm tra tính hợp lệ của Schema trước khi lưu vào Database.

### 4. Cloud Sync Layer
*   **Vai trò**: Đồng bộ hóa (Synchronization).
*   **Nhiệm vụ**: Tạo các bản "Delta" sạch từ Local Core để đồng bộ lên Cloud Sync, đảm bảo tính nhất quán trên toàn hệ thống.

---

## 🛠️ Hướng dẫn cấu hình Local AI (Ollama)

Hệ thống hỗ trợ tích hợp trực tiếp với các mô hình AI chạy tại máy chủ Local để tăng tính bảo mật và ổn định.

### 1. Cài đặt Ollama
Tải và cài đặt tại: [ollama.com](https://ollama.com)

### 2. Tải mô hình
Mở terminal và chạy:
```bash
ollama run llama3
```

### 3. Cấu hình biến môi trường (.env)
Thiết lập các biến sau để kích hoạt Local AI:
```env
LOCAL_AI_ENABLED=true
LOCAL_AI_URL=http://localhost:11434
LOCAL_AI_MODEL=llama3
```

---

## 🚀 Lợi ích chiến lược

1.  **AI-Agnostic**: Bạn có thể nâng cấp Gemini lên bất kỳ phiên bản nào (1.5, 2.0, 3.0...) mà không bao giờ sợ làm hỏng giao diện hay logic nghiệp vụ.
2.  **Tính ổn định 100%**: Local Core là nơi quyết định cuối cùng, loại bỏ hoàn toàn sự "ảo giác" (hallucination) về định dạng của Cloud AI.
3.  **Bảo mật**: Việc Rewrite phong cách diễn ra nội bộ, giảm thiểu việc gửi dữ liệu nhạy cảm đi nhiều lần.
4.  **Tốc độ**: Giảm độ trễ bằng cách sử dụng Cloud AI cho các tác vụ nặng và Local AI cho các tác vụ tinh chỉnh văn bản.

---

## 🔄 Luồng dữ liệu (Data Flow)

1.  **User Input** → Gửi yêu cầu lên Backend.
2.  **Backend** → Gọi **Cloud AI** (Gemini) lấy dữ liệu thô (Raw JSON).
3.  **Backend** → Gửi Raw JSON sang **Local AI** (Ollama) để Rewrite theo Style.
4.  **Local Core** → Ép Schema, sửa lỗi và trả về **Canonical Output**.
5.  **Database** → Lưu trữ dữ liệu đã chuẩn hóa.
6.  **UI** → Hiển thị kết quả ổn định tuyệt đối cho người dùng.

---
*Tài liệu được tạo tự động bởi AI Architect System.*
