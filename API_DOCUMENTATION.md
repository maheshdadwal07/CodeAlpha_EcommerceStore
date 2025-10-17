# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

### Register User

```http
POST /api/auth/register
```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Login User

```http
POST /api/auth/login
```

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

## Products

### Get All Products

```http
GET /api/products?category=Electronics&sort=price&order=asc&search=phone&limit=10&page=1
```

**Query Parameters:**

- `category` (optional) - Filter by category
- `sort` (optional) - Sort field (price, rating, name)
- `order` (optional) - Sort order (asc, desc)
- `search` (optional) - Search in product name
- `limit` (optional) - Items per page (default: 12)
- `page` (optional) - Page number (default: 1)

**Response (200):**

```json
{
  "products": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "iPhone 15 Pro Max",
      "price": 159900,
      "category": "Electronics",
      "description": "Latest iPhone with A17 Pro chip",
      "image": "https://images.unsplash.com/...",
      "rating": 4.8,
      "reviews": 1250,
      "stock": 50
    }
  ],
  "totalPages": 3,
  "currentPage": 1,
  "totalProducts": 33
}
```

### Get Product by ID

```http
GET /api/products/:id
```

**Response (200):**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "iPhone 15 Pro Max",
  "price": 159900,
  "category": "Electronics",
  "description": "Latest iPhone with A17 Pro chip and titanium design",
  "image": "https://images.unsplash.com/...",
  "rating": 4.8,
  "reviews": 1250,
  "stock": 50,
  "features": ["A17 Pro chip", "48MP camera", "Titanium design"]
}
```

### Get Products by Category

```http
GET /api/products/category/:category
```

**Example:** `GET /api/products/category/Electronics`

**Response (200):**

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "iPhone 15 Pro Max",
    "price": 159900,
    "category": "Electronics",
    "image": "https://images.unsplash.com/...",
    "rating": 4.8
  }
]
```

---

## Shopping Cart (Protected Routes)

**Authentication Required:** Include JWT token in header:

```
Authorization: Bearer <token>
```

### Get User Cart

```http
GET /api/cart
```

**Response (200):**

```json
{
  "items": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "product": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "iPhone 15 Pro Max",
        "price": 159900,
        "image": "https://images.unsplash.com/..."
      },
      "quantity": 2,
      "price": 159900
    }
  ],
  "subtotal": 319800,
  "shipping": 0,
  "total": 319800
}
```

### Add Item to Cart

```http
POST /api/cart
```

**Request Body:**

```json
{
  "productId": "507f1f77bcf86cd799439012",
  "quantity": 2
}
```

**Response (201):**

```json
{
  "message": "Product added to cart",
  "cart": {
    "items": [...],
    "subtotal": 319800,
    "total": 319800
  }
}
```

### Update Cart Item

```http
PUT /api/cart/:itemId
```

**Request Body:**

```json
{
  "quantity": 3
}
```

**Response (200):**

```json
{
  "message": "Cart updated",
  "cart": {
    "items": [...],
    "subtotal": 479700,
    "total": 479700
  }
}
```

### Remove Cart Item

```http
DELETE /api/cart/:itemId
```

**Response (200):**

```json
{
  "message": "Item removed from cart",
  "cart": {
    "items": [...],
    "subtotal": 0,
    "total": 0
  }
}
```

---

## Orders (Protected Routes)

### Get User Orders

```http
GET /api/orders
```

**Response (200):**

```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "orderNumber": "ORD-1698234567890",
    "items": [
      {
        "product": {
          "name": "iPhone 15 Pro Max",
          "image": "https://images.unsplash.com/..."
        },
        "quantity": 1,
        "price": 159900
      }
    ],
    "total": 159900,
    "status": "pending",
    "shippingAddress": {
      "fullName": "John Doe",
      "address": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "phone": "9876543210"
    },
    "createdAt": "2025-10-17T10:30:00.000Z"
  }
]
```

### Create Order

```http
POST /api/orders
```

**Request Body:**

```json
{
  "shippingAddress": {
    "fullName": "John Doe",
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "phone": "9876543210"
  },
  "paymentMethod": "COD"
}
```

**Response (201):**

```json
{
  "message": "Order placed successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439013",
    "orderNumber": "ORD-1698234567890",
    "items": [...],
    "total": 159900,
    "status": "pending"
  }
}
```

### Get Single Order

```http
GET /api/orders/:id
```

**Response (200):**

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "orderNumber": "ORD-1698234567890",
  "items": [...],
  "total": 159900,
  "status": "pending",
  "shippingAddress": {...},
  "paymentMethod": "COD",
  "createdAt": "2025-10-17T10:30:00.000Z",
  "updatedAt": "2025-10-17T10:30:00.000Z"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Invalid input data"
}
```

### 401 Unauthorized

```json
{
  "error": "No token provided"
}
```

### 404 Not Found

```json
{
  "error": "Product not found"
}
```

### 500 Server Error

```json
{
  "error": "Internal server error"
}
```

---

## Product Categories

Available categories:

- `Electronics`
- `Clothing`
- `Books`
- `Home & Kitchen`
- `Sports`
- `Beauty`
- `Toys`

## Order Status

Possible order statuses:

- `pending` - Order placed, waiting for processing
- `processing` - Order being prepared
- `shipped` - Order dispatched
- `delivered` - Order delivered
- `cancelled` - Order cancelled

## Rate Limiting

No rate limiting currently implemented. For production, consider:

- 100 requests per 15 minutes per IP
- 1000 requests per hour for authenticated users

## Notes

- All prices are in paise (₹159900 = ₹1,599.00)
- Timestamps are in ISO 8601 format
- All POST/PUT requests require `Content-Type: application/json`
- Protected routes require valid JWT token
- Tokens expire after 30 days
