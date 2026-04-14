
# Hướng Dẫn Xây Dựng Backend - AmazeBid System

Tài liệu này hướng dẫn chi tiết cách xây dựng hệ thống Backend (Server & Database) để thay thế dữ liệu giả lập (Mock Data) hiện tại trên Frontend.

## 1. Công nghệ đề xuất (Tech Stack)

Để tương thích tốt nhất với Frontend ReactJS hiện tại và xử lý tính năng đấu giá Real-time, chúng ta sử dụng **MERN Stack**:

*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB (Sử dụng Mongoose ODM)
*   **Real-time Engine:** Socket.io (Quan trọng cho Đấu giá & Livestream)
*   **Authentication:** JWT (JSON Web Token)

---

## 2. Cấu trúc Thư mục Dự án (Backend)

```bash
server/
├── config/
│   └── db.js           # Kết nối MongoDB
├── models/             # Định nghĩa Database Schemas
│   ├── User.js
│   ├── Product.js
│   ├── Bid.js
│   └── Order.js
├── routes/             # Định nghĩa API Endpoints
│   ├── authRoutes.js
│   ├── productRoutes.js
│   └── orderRoutes.js
├── controllers/        # Logic xử lý
├── middleware/         # Xác thực Token (authMiddleware)
├── socket/             # Logic Real-time
│   └── auctionHandler.js
├── .env                # Biến môi trường (DB_URI, JWT_SECRET)
└── server.js           # Entry point
```

---

## 3. Thiết kế Cơ sở dữ liệu (Database Schema)

Dưới đây là các Schema Mongoose cần thiết để khớp với `types.ts` ở Frontend.

### 3.1. User Schema (`models/User.js`)
```javascript
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hash bằng bcrypt
  phone: { type: String },
  balance: { type: Number, default: 0 }, // Số dư ví
  avatar: { type: String },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  socialAccounts: [{
    provider: String, // google, facebook
    id: String
  }]
}, { timestamps: true });
```

### 3.2. Product Schema (`models/Product.js`)
```javascript
const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  image: String,
  category: String,
  type: { type: String, enum: ['FIXED_PRICE', 'AUCTION'], default: 'FIXED_PRICE' },
  
  // Giá
  price: { type: Number, required: true }, // Giá gốc hoặc Giá khởi điểm
  
  // Đấu giá
  currentBid: { type: Number, default: 0 },
  bidCount: { type: Number, default: 0 },
  endTime: { type: Date }, // Thời gian kết thúc đấu giá
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Affiliate
  isAffiliate: { type: Boolean, default: false },
  affiliateLink: String,
  
  status: { type: String, default: 'AVAILABLE' }
}, { timestamps: true });
```

### 3.3. Bid Schema (`models/Bid.js`) - Lịch sử đấu giá
```javascript
const bidSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, required: true },
}, { timestamps: true });
```

---

## 4. Triển khai Real-time với Socket.io

Đây là phần quan trọng nhất để tính năng đấu giá hoạt động mượt mà.

### Logic tại `server.js`:

```javascript
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // Cho phép Frontend kết nối
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 1. Người dùng tham gia vào "phòng" của một sản phẩm cụ thể
  socket.on('join_product_room', (productId) => {
    socket.join(productId);
  });

  // 2. Xử lý khi có người đặt giá (Bid)
  socket.on('place_bid', async (data) => {
    const { productId, userId, amount } = data;
    
    // TODO: Kiểm tra Database xem giá mới có > giá hiện tại không
    // const product = await Product.findById(productId);
    // if (amount <= product.currentBid) return socket.emit('error', 'Giá quá thấp');

    // Cập nhật DB
    // await Product.updateOne({ _id: productId }, { currentBid: amount, $inc: { bidCount: 1 } });
    // await Bid.create({ productId, userId, amount });

    // 3. Gửi thông báo cập nhật giá mới cho TẤT CẢ mọi người đang xem sản phẩm này
    io.to(productId).emit('new_bid_update', {
      productId,
      newPrice: amount,
      bidderName: "Tên Người Dùng (Lấy từ DB)",
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(5000, () => console.log('Server running on port 5000'));
```

---

## 5. API Endpoints (RESTful)

Frontend sẽ gọi các API này thông qua file `services/api.ts` đã tạo.

### Auth Module (`/api/auth`)
*   `POST /register`: Tạo user mới.
*   `POST /login`: Kiểm tra password, trả về JWT Token.
*   `POST /login-phone`: (Mock OTP) Kiểm tra số điện thoại, nếu chưa có thì tạo user mới.
*   `GET /profile`: Trả về thông tin user dựa trên Token gửi lên Header.

### Product Module (`/api/products`)
*   `GET /`: Lấy danh sách sản phẩm (Hỗ trợ query `?category=Electronics&type=AUCTION`).
*   `GET /:id`: Lấy chi tiết sản phẩm + Lịch sử đấu giá (`Bid.find({ productId: id })`).
*   `POST /`: Đăng bán sản phẩm mới (Cần Token).

### Order Module (`/api/orders`)
*   `POST /`: Tạo đơn hàng từ giỏ hàng.
*   `GET /me`: Lấy danh sách đơn mua/bán của user hiện tại.
*   `PUT /:id/status`: Cập nhật trạng thái đơn (Shipped, Delivered...).

---

## 6. Tích hợp AI (Gemini) ở Backend (Bảo mật)

Hiện tại Frontend đang gọi trực tiếp Google Gemini API. Để bảo mật API Key, bạn nên chuyển logic này về Backend.

**Quy trình mới:**
1.  Frontend gửi text prompt lên: `POST /api/ai/generate-content`.
2.  Backend (Node.js) sử dụng thư viện `@google/genai` với `process.env.API_KEY` (được ẩn trên server).
3.  Backend trả về kết quả text/image cho Frontend.

```javascript
// routes/aiRoutes.js
const { GoogleGenAI } = require("@google/genai");
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/generate-content', async (req, res) => {
  const { prompt } = req.body;
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const result = await model.generateContent(prompt);
  res.json({ text: result.response.text() });
});
```

---

## 7. Các bước chạy Backend

1.  Cài đặt dependencies:
    ```bash
    npm install express mongoose socket.io cors dotenv jsonwebtoken bcryptjs
    ```
2.  Tạo file `.env`:
    ```env
    PORT=5000
    MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/amazebid
    JWT_SECRET=ma_bao_mat_cua_ban
    GEMINI_API_KEY=AIzaSy...
    ```
3.  Khởi chạy:
    ```bash
    node server.js
    ```
4.  Cập nhật file `.env` ở Frontend (nếu có) hoặc sửa `services/api.ts` để trỏ về `http://localhost:5000/api`.

