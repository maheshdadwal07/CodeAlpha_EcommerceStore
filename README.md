# 🛍️ CodeAlpha E-commerce Store

A full-stack **E-commerce web application** built as part of the CodeAlpha Internship (Task 1).  
This project provides complete online shopping features including product listings, shopping cart, order management, and user authentication.

## 🚀 Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Express.js (Node.js)
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT & bcrypt
- **Session Management:** Express Session with MongoDB store
- **Security:** Helmet, CORS, Rate Limiting

## 📋 Features

- ✅ User Registration & Login
- ✅ Product Catalog with Search & Filter
- ✅ Shopping Cart Management
- ✅ Order Processing & History
- ✅ Product Details Pages
- ✅ Responsive Design
- ✅ Secure Authentication
- ✅ Session Management

## 📂 Project Structure

```
CodeAlpha_EcommerceStore/
│── server.js           # Main application entry point
│── package.json        # Dependencies & scripts
│── .env.example        # Environment variables template
│── .gitignore         # Git ignore rules
│── README.md          # Project documentation
├── public/            # Static frontend files (HTML, CSS, JS)
├── routes/            # Express routes (auth, products, cart, orders)
├── models/            # Mongoose models (User, Product, Order)
└── controllers/       # Business logic for routes
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v16.0.0 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm (v8.0.0 or higher)

### Step 1: Clone the Repository

```bash
git clone https://github.com/maheshdadwal07/CodeAlpha_EcommerceStore.git
cd CodeAlpha_EcommerceStore
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Configuration

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file with your configuration:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/ecommerce_store
   JWT_SECRET=your_super_secret_jwt_key_here
   SESSION_SECRET=your_super_secret_session_key_here
   ```

### Step 4: Database Setup

- **Local MongoDB:** Make sure MongoDB is running on your system
- **MongoDB Atlas:** Replace `MONGODB_URI` with your Atlas connection string

### Step 5: Start the Application

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### Step 6: Access the Application

- **Frontend:** http://localhost:3000
- **Health Check:** http://localhost:3000/health
- **API Base:** http://localhost:3000/api

## 🔧 Development Scripts

```bash
npm start       # Start production server
npm run dev     # Start development server with nodemon
npm test        # Run tests (to be implemented)
```

## 🔐 Security Features

- **Helmet:** Security headers
- **Rate Limiting:** Prevent abuse
- **CORS:** Cross-origin resource sharing
- **Session Security:** HttpOnly cookies
- **Input Validation:** Data sanitization
- **JWT Authentication:** Secure token-based auth

## 📊 API Endpoints (Coming Soon)

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product details
- `POST /api/cart/add` - Add item to cart
- `GET /api/cart` - Get user's cart
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user's orders

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

**Mahesh Dadwal**

- GitHub: [@maheshdadwal07](https://github.com/maheshdadwal07)
- Project: CodeAlpha Internship Task 1

---

⭐ **Star this repository if you found it helpful!**

- **Database:** MongoDB


