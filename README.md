# 🛍️ ShopEase - Modern E-Commerce Platform

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen" alt="Node">
  <img src="https://img.shields.io/badge/MongoDB-4.4%2B-green" alt="MongoDB">
  <img src="https://img.shields.io/badge/Express-4.18.2-lightgrey" alt="Express">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
  <img src="https://img.shields.io/badge/CodeAlpha-Internship-orange" alt="CodeAlpha">
</p>

<p align="center">
  A full-stack e-commerce web application built with **Node.js**, **Express.js**, **MongoDB**, and **Vanilla JavaScript**. 
  <br>
  Features a modern, responsive UI with gradient designs, smooth animations, and complete shopping functionality.
  <br>
  <strong>🎓 CodeAlpha Web Development Internship Project</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-demo">Demo</a>
</p>

---

## 🌐 Live Demo & Deployment

> **⚠️ Important:** This is a full-stack application with Node.js backend. GitHub Pages only hosts static files.
> For full functionality, deploy on platforms like **Render**, **Railway**, or **Cyclic**.

### 📖 Deployment Options:
- 📘 [Complete Deployment Guide](./DEPLOYMENT_GUIDE.md) - Render, Railway, Cyclic
- 🎬 [Video Demo](#) - Coming soon
- 📸 [Screenshots](#) - See project in action

### 🔑 Demo Credentials:
```
Admin Account:
Email: admin@shopease.com
Password: admin123

Customer Account:
Email: customer@shopease.com
Password: customer123
```

---

## ✨ Features

### 🎯 Core Functionality

- **User Authentication** - JWT-based secure login/registration system
- **Product Catalog** - Browse 33+ products across 7 categories
- **Shopping Cart** - Add, remove, update quantities with real-time calculations
- **Order Management** - Place orders and track order history
- **Search & Filter** - Find products by name, category, and price range
- **Responsive Design** - Optimized for mobile, tablet (iPad), and desktop

### 🎨 UI/UX Features

- Modern gradient design with glassmorphism effects
- Smooth animations and transitions
- Interactive category cards with hover effects
- Mobile-friendly hamburger menu with overlay
- Sticky navbar with search functionality
- Product cards with ratings and quick actions
- Real-time cart count updates

### 📱 Responsive Breakpoints

- 📱 **Mobile**: 320px - 480px (iPhone SE, iPhone 12/13/14)
- 📱 **Large Mobile**: 481px - 768px (iPhone Pro Max, Android)
- 📱 **Tablet**: 769px - 1024px (iPad Mini, iPad Air, iPad Pro)
- 💻 **Desktop**: 1025px+ (Laptops, Desktops)

## 🛠️ Tech Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **bcryptjs** - Password hashing
- **JWT** - Authentication tokens
- **CORS** - Cross-origin resource sharing

### Frontend

- **HTML5** - Markup
- **CSS3** - Styling with modern design
- **JavaScript (ES6+)** - Frontend logic
- **Fetch API** - HTTP requests

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** (optional) - [Download](https://git-scm.com/)

## 🚀 Installation & Setup

### Step 1: Install MongoDB

**Windows:**

1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Install with default settings
3. MongoDB will run automatically as a service

**To start MongoDB manually:**

```powershell
# Start MongoDB service
net start MongoDB

# Or run mongod directly
mongod --dbpath "C:\data\db"
```

### Step 2: Install Dependencies

Open PowerShell in the project directory and run:

```powershell
npm install
```

This will install all required packages:

- express
- mongoose
- bcryptjs
- jsonwebtoken
- cors
- dotenv
- express-validator

### Step 3: Configure Environment Variables

The `.env` file is already created with default settings:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your_super_secret_jwt_key_change_in_production
NODE_ENV=development
```

⚠️ **For production**, change the `JWT_SECRET` to a strong random string!

### Step 4: Seed the Database

Load demo products and users into the database:

```powershell
npm run seed
```

This will create:

- **33 products** across 7 categories (Electronics, Clothing, Books, Home & Kitchen, Sports, Beauty, Toys)
- **2 demo users** with realistic data

**Demo Login Credentials:**

**Admin User:**

```
Email: admin@shopease.com
Password: admin123
```

**Customer User:**

```
Email: customer@shopease.com
Password: customer123
```

### Step 5: Start the Server

```powershell
npm start
```

Or for development with auto-restart:

```powershell
npm run dev
```

The server will start at: **http://localhost:5000**

## 🎮 Usage

1. **Open your browser** and go to `http://localhost:5000`
2. **Browse products** on the home page
3. **Login** using demo credentials or register a new account
4. **Add products** to cart
5. **Proceed to checkout** and place an order
6. **View orders** in "My Orders" section

## 📁 Project Structure

```
ecom/
├── models/              # Database models
│   ├── User.js         # User schema
│   ├── Product.js      # Product schema
│   ├── Cart.js         # Cart schema
│   └── Order.js        # Order schema
├── routes/             # API routes
│   ├── auth.js         # Authentication routes
│   ├── products.js     # Product routes
│   ├── cart.js         # Cart routes
│   └── orders.js       # Order routes
├── middleware/         # Custom middleware
│   └── auth.js         # JWT authentication
├── public/             # Frontend files
│   ├── css/
│   │   └── style.css   # All styles
│   ├── js/
│   │   ├── utils.js    # Utility functions
│   │   ├── index.js    # Home page logic
│   │   ├── products.js # Products page logic
│   │   ├── product-details.js
│   │   ├── cart.js
│   │   ├── checkout.js
│   │   ├── orders.js
│   │   └── auth.js     # Login/Register logic
│   ├── index.html
│   ├── products.html
│   ├── product-details.html
│   ├── cart.html
│   ├── checkout.html
│   ├── orders.html
│   ├── login.html
│   └── register.html
├── .env                # Environment variables
├── .gitignore
├── package.json
├── server.js           # Main server file
└── seed.js             # Database seeding script
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (Protected)

### Products

- `GET /api/products` - Get all products (with filters)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:id` - Get single product

### Cart

- `GET /api/cart` - Get user's cart (Protected)
- `POST /api/cart/add` - Add item to cart (Protected)
- `PUT /api/cart/update/:productId` - Update quantity (Protected)
- `DELETE /api/cart/remove/:productId` - Remove item (Protected)
- `DELETE /api/cart/clear` - Clear cart (Protected)

### Orders

- `POST /api/orders/create` - Create order (Protected)
- `GET /api/orders/my-orders` - Get user's orders (Protected)
- `GET /api/orders/:id` - Get single order (Protected)
- `PUT /api/orders/:id/cancel` - Cancel order (Protected)

## 🎨 Features Showcase

### Product Categories

- 📱 Electronics (Phones, Laptops, Cameras, Gaming)
- 👕 Clothing (Shoes, Jeans, Jackets)
- 📚 Books (Programming, Self-help)
- 🏠 Home & Kitchen (Appliances, Gadgets)
- ⚽ Sports (Fitness, Equipment)
- 💄 Beauty (Skincare)
- 🧸 Toys (LEGO, Games)

### Sample Products

- Apple iPhone 15 Pro
- Samsung Galaxy S24 Ultra
- MacBook Air M3
- PlayStation 5
- Nike Air Max 90
- Clean Code (Book)
- And 18 more professional products!

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Protected API routes
- Input validation
- CORS enabled

## 🎯 Task Completion Checklist

✅ **Product Listings** - Complete with filters and search  
✅ **Shopping Cart** - Add/Remove/Update functionality  
✅ **Product Details Page** - Full product information  
✅ **Order Processing** - Complete checkout flow  
✅ **User Registration/Login** - JWT authentication  
✅ **Database** - MongoDB with models for products, users, orders  
✅ **Professional Demo Data** - 24 products + 2 users  
✅ **Responsive Design** - Works on all devices  
✅ **Clean UI** - Modern, professional design

## 🐛 Troubleshooting

### MongoDB Connection Error

```powershell
# Make sure MongoDB is running
net start MongoDB
```

### Port Already in Use

Change the PORT in `.env` file:

```
PORT=3000
```

### Module Not Found Error

```powershell
npm install
```

## � Additional Documentation

- 📖 [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- 🚀 [Deployment Guide](./DEPLOYMENT.md) - Deploy to production
- 🤝 [Contributing Guidelines](./CONTRIBUTING.md) - How to contribute
- 📝 [Changelog](./CHANGELOG.md) - Version history
- ⚖️ [License](./LICENSE) - MIT License

## 🎯 Project Highlights

### Design System

- **Colors**: Purple gradient theme (#667eea to #764ba2)
- **Typography**: Inter (body) + Poppins (headings)
- **Effects**: Glassmorphism, smooth transitions, hover animations
- **Spacing**: Consistent padding and margins throughout

### Code Quality

- ✅ Clean, modular code structure
- ✅ Comprehensive comments
- ✅ RESTful API design
- ✅ Error handling
- ✅ Input validation
- ✅ Security best practices

### Performance

- ✅ Optimized MongoDB queries
- ✅ Efficient CSS (2500+ lines)
- ✅ Fast page loads
- ✅ Smooth animations
- ✅ Responsive images

## 🐛 Troubleshooting

### MongoDB Connection Error

```bash
# Start MongoDB service
net start MongoDB

# Or check if running
mongod --version
```

### Port Already in Use

```bash
# Kill process on port 5000
npx kill-port 5000
```

### Dependencies Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📞 Support & Contact

For issues or questions:

- 📧 Email: maheshdadwal07@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/shopease/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/shopease/discussions)

## 🙏 Acknowledgments

- **CodeAlpha Internship** - For the opportunity
- **Unsplash** - For product images
- **Google Fonts** - For Inter & Poppins fonts
- **MongoDB** - For excellent database
- **Express.js** - For robust backend framework

4. Run seed script again if needed (`npm run seed`)

## 📄 License

This project is created for educational purposes.

---

**Happy Coding! 🚀**

Made with ❤️ for your class project
