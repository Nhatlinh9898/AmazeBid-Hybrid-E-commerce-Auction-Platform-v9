---
name: ai-smart-import
description: 
  Chuyên gia về tính năng Nhập liệu thông minh với AI (AI Smart Import) của hệ thống AmazeBid.
  Sử dụng khi người dùng yêu cầu giải thích, bảo trì, hoặc mở rộng tính năng tự động điền thông tin sản phẩm từ hình ảnh, hóa đơn, hoặc file danh sách.
---

# AI Smart Import Expertise

Chuyên gia về hệ thống Nhập liệu thông minh với AI (AI Smart Import) trên nền tảng AmazeBid.

## Overview
Skill này cung cấp kiến thức về kiến trúc, luồng dữ liệu và cách mở rộng tính năng AI Smart Import. Tính năng này cho phép người bán hàng (Sellers) dễ dàng thêm sản phẩm vật lý vào hệ thống bằng cách tải lên hình ảnh sản phẩm, ảnh chụp hóa đơn nhập hàng, hoặc file danh sách (CSV/Excel). AI sẽ tự động phân tích và điền các thông tin cần thiết như tên, mô tả chuẩn SEO, danh mục, giá bán, giá vốn và số lượng.

## 1. Architecture & Components

### Frontend UI (`components/SellModal.tsx`)
- **Vị trí**: Nằm trong tab `Hàng của tôi (Vật lý)` của form Đăng bán sản phẩm.
- **Giao diện**: Hiển thị một banner nổi bật "Nhập liệu thông minh với AI". Khi click vào, mở ra 3 tùy chọn:
  1. **Quét Hóa Đơn (Invoice)**: Dành cho ảnh chụp hóa đơn.
  2. **Chụp Ảnh SP (Image)**: Dành cho ảnh chụp trực tiếp sản phẩm.
  3. **Tải File (File)**: Dành cho file danh sách hàng loạt (CSV/Excel).
- **Trạng thái (State)**: 
  - `showAiImport`: Quản lý việc hiển thị UI của tính năng.
  - `aiImportLoading`: Hiển thị màn hình chờ (loading spinner) khi AI đang xử lý.
- **Tích hợp**: Sau khi AI trả về kết quả, các trường trong `formData` (title, description, category, price, costPrice, totalStock) sẽ được tự động điền. Nếu có `costPrice` và `totalStock`, hệ thống sẽ tự động chuyển `pricingStrategy` sang `AUTO` để tính toán điểm hòa vốn và lợi nhuận.

### Service Layer (`services/aiImportService.ts`)
- **Nhiệm vụ**: Chịu trách nhiệm giao tiếp trực tiếp với Google Gemini API để phân tích dữ liệu đầu vào.
- **Model sử dụng**: `gemini-3.1-flash-preview` (tối ưu cho tốc độ và khả năng đọc hiểu đa phương tiện - Multimodal).
- **Định dạng trả về**: Sử dụng `responseSchema` (Structured Output) để ép buộc AI trả về một object JSON chứa chính xác các trường cần thiết: `title`, `description`, `category`, `price`, `costPrice`, `totalStock`.
- **Các hàm chính**:
  - `analyzeInvoice(base64Image, mimeType)`: Phân tích ảnh hóa đơn.
  - `analyzeProductImage(base64Image, mimeType)`: Phân tích ảnh sản phẩm.
  - `analyzeInventoryFile(fileContent)`: Phân tích nội dung text từ file.

## 2. Data Flow (Luồng dữ liệu)

1. **User Action**: Người dùng chọn 1 trong 3 phương thức nhập liệu và tải file/ảnh lên.
2. **Preprocessing**: Frontend chuyển đổi file/ảnh thành định dạng Base64 (đối với ảnh) hoặc Text (đối với file CSV/Excel).
3. **API Call**: Frontend gọi hàm tương ứng trong `aiImportService.ts`.
4. **AI Processing**: Gemini API nhận prompt + dữ liệu (ảnh/text), phân tích ngữ cảnh và trích xuất thông tin dựa trên JSON Schema đã định nghĩa.
5. **Response Handling**: `aiImportService` parse chuỗi JSON trả về thành object `AIImportResult` và trả về cho UI.
6. **UI Update**: `SellModal.tsx` nhận dữ liệu, tắt trạng thái loading và cập nhật `formData`. Các input trên form sẽ tự động hiển thị dữ liệu mới.

## 3. Procedural Workflows (Quy trình mở rộng)

### Mở rộng hỗ trợ định dạng file mới (VD: PDF)
1. Cập nhật UI trong `SellModal.tsx` để chấp nhận file `.pdf`.
2. Thêm thư viện đọc PDF ở client-side (VD: `pdf.js`) để trích xuất text hoặc chuyển đổi trang đầu tiên thành hình ảnh (Base64).
3. Truyền dữ liệu đã xử lý vào hàm `analyzeInventoryFile` hoặc `analyzeInvoice` trong `aiImportService.ts`.

### Tối ưu hóa Prompt cho từng ngành hàng cụ thể
1. Mở rộng tham số đầu vào của các hàm trong `aiImportService.ts` để nhận thêm `industryHint` (VD: "Thời trang", "Điện tử").
2. Chèn `industryHint` vào System Instruction của Gemini để AI tạo ra mô tả (description) và danh mục (category) chính xác hơn với đặc thù ngành hàng.

### Xử lý nhập hàng loạt (Bulk Import)
1. Thay đổi `responseSchema` trong `analyzeInventoryFile` từ `Type.OBJECT` sang `Type.ARRAY` chứa danh sách các `Type.OBJECT`.
2. Cập nhật UI để hiển thị một bảng (table) preview danh sách các sản phẩm được AI trích xuất.
3. Cho phép người dùng chọn/bỏ chọn các sản phẩm trước khi thêm hàng loạt vào hệ thống.

## 4. Troubleshooting (Xử lý sự cố thường gặp)

- **Lỗi Parse JSON**: Nếu AI trả về JSON không hợp lệ (hiếm gặp khi dùng `responseSchema`), service đã có khối `try...catch` để bắt lỗi. Cần kiểm tra lại prompt xem có quá phức tạp không.
- **Lỗi Quota/Rate Limit (429)**: Nếu gọi API liên tục, Gemini có thể báo lỗi 429. Cần implement cơ chế Retry với Exponential Backoff hoặc hiển thị thông báo thân thiện yêu cầu người dùng thử lại sau.
- **Dữ liệu trích xuất không chính xác**: Kiểm tra chất lượng ảnh tải lên (bị mờ, chói sáng) hoặc điều chỉnh lại System Prompt trong `aiImportService.ts` để cung cấp thêm ví dụ (Few-shot prompting) cho AI.
