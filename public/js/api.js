// ===================================
// API CLIENT
// ===================================

/**
 * API client for making HTTP requests
 */
const API = {
  baseURL: "/api",
  defaultHeaders: {
    "Content-Type": "application/json",
  },

  /**
   * Get authentication token from storage
   * @returns {string|null} Auth token
   */
  getAuthToken() {
    return Utils.storage.get("authToken") || Utils.session.get("authToken");
  },

  /**
   * Set authentication token
   * @param {string} token - Auth token
   * @param {boolean} persistent - Whether to use localStorage (default: sessionStorage)
   */
  setAuthToken(token, persistent = false) {
    if (persistent) {
      Utils.storage.set("authToken", token);
    } else {
      Utils.session.set("authToken", token);
    }
  },

  /**
   * Remove authentication token
   */
  removeAuthToken() {
    Utils.storage.remove("authToken");
    Utils.session.remove("authToken");
  },

  /**
   * Get headers with authentication
   * @param {Object} customHeaders - Additional headers
   * @returns {Object} Headers object
   */
  getHeaders(customHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...customHeaders };
    const token = this.getAuthToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  },

  /**
   * Make HTTP request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} API response
   */
  async request(endpoint, options = {}) {
    const {
      method = "GET",
      body = null,
      headers = {},
      ...fetchOptions
    } = options;

    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseURL}${endpoint}`;

    const config = {
      method,
      headers: this.getHeaders(headers),
      ...fetchOptions,
    };

    // Add body for non-GET requests
    if (body && method !== "GET") {
      if (body instanceof FormData) {
        // Remove Content-Type for FormData (browser will set it)
        delete config.headers["Content-Type"];
        config.body = body;
      } else {
        config.body = JSON.stringify(body);
      }
    }

    try {
      const response = await fetch(url, config);

      // Handle different response types
      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new APIError(
          data.message || data.error || "Request failed",
          response.status,
          data
        );
      }

      return {
        data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      // Handle network errors
      throw new APIError("Network error. Please check your connection.", 0, {
        originalError: error.message,
      });
    }
  },

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} API response
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "GET" });
  },

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @param {Object} options - Request options
   * @returns {Promise<Object>} API response
   */
  async post(endpoint, body = null, options = {}) {
    return this.request(endpoint, { ...options, method: "POST", body });
  },

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @param {Object} options - Request options
   * @returns {Promise<Object>} API response
   */
  async put(endpoint, body = null, options = {}) {
    return this.request(endpoint, { ...options, method: "PUT", body });
  },

  /**
   * PATCH request
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @param {Object} options - Request options
   * @returns {Promise<Object>} API response
   */
  async patch(endpoint, body = null, options = {}) {
    return this.request(endpoint, { ...options, method: "PATCH", body });
  },

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} API response
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "DELETE" });
  },
};

/**
 * Custom API Error class
 */
class APIError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.data = data;
  }
}

// ===================================
// API ENDPOINTS
// ===================================

/**
 * Authentication API endpoints
 */
const AuthAPI = {
  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} User data and token
   */
  async login(credentials) {
    try {
      const response = await API.post("/auth/login", credentials);

      if (response.data.token) {
        API.setAuthToken(response.data.token, credentials.rememberMe);
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User data and token
   */
  async register(userData) {
    try {
      const response = await API.post("/auth/register", userData);

      if (response.data.token) {
        API.setAuthToken(response.data.token);
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Logout user
   * @returns {Promise<Object>} Logout response
   */
  async logout() {
    try {
      const response = await API.post("/auth/logout");
      API.removeAuthToken();
      return response.data;
    } catch (error) {
      // Even if logout fails on server, remove local token
      API.removeAuthToken();
      throw error;
    }
  },

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile data
   */
  async getProfile() {
    try {
      const response = await API.get("/auth/me");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user data
   */
  async updateProfile(userData) {
    try {
      const response = await API.put("/auth/profile", userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Change password
   * @param {Object} passwordData - Current and new password
   * @returns {Promise<Object>} Success response
   */
  async changePassword(passwordData) {
    try {
      const response = await API.put("/auth/change-password", passwordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Forgot password
   * @param {string} email - User email
   * @returns {Promise<Object>} Success response
   */
  async forgotPassword(email) {
    try {
      const response = await API.post("/auth/forgot-password", { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Reset password
   * @param {Object} resetData - Reset token and new password
   * @returns {Promise<Object>} Success response
   */
  async resetPassword(resetData) {
    try {
      const response = await API.post("/auth/reset-password", resetData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

/**
 * Products API endpoints
 */
const ProductsAPI = {
  /**
   * Get all products with filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Products data
   */
  async getProducts(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `/products?${queryString}` : "/products";
      const response = await API.get(endpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get single product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Product data
   */
  async getProduct(productId) {
    try {
      const response = await API.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Search products
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} Search results
   */
  async searchProducts(query, filters = {}) {
    try {
      const params = { q: query, ...filters };
      const queryString = new URLSearchParams(params).toString();
      const response = await API.get(`/products/search?${queryString}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get products by category
   * @param {string} category - Category name
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Products data
   */
  async getProductsByCategory(category, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString
        ? `/products/category/${category}?${queryString}`
        : `/products/category/${category}`;
      const response = await API.get(endpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get featured products
   * @param {number} limit - Number of products to fetch
   * @returns {Promise<Object>} Featured products
   */
  async getFeaturedProducts(limit = 10) {
    try {
      const response = await API.get(`/products/featured?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Add product review
   * @param {string} productId - Product ID
   * @param {Object} reviewData - Review data
   * @returns {Promise<Object>} Review response
   */
  async addReview(productId, reviewData) {
    try {
      const response = await API.post(
        `/products/${productId}/reviews`,
        reviewData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

/**
 * Cart API endpoints
 */
const CartAPI = {
  /**
   * Get user's cart
   * @returns {Promise<Object>} Cart data
   */
  async getCart() {
    try {
      const response = await API.get("/cart");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Add item to cart
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to add
   * @returns {Promise<Object>} Updated cart
   */
  async addToCart(productId, quantity = 1) {
    try {
      const response = await API.post("/cart/add", { productId, quantity });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update cart item quantity
   * @param {string} productId - Product ID
   * @param {number} quantity - New quantity
   * @returns {Promise<Object>} Updated cart
   */
  async updateCartItem(productId, quantity) {
    try {
      const response = await API.put(`/cart/item/${productId}`, { quantity });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Remove item from cart
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Updated cart
   */
  async removeFromCart(productId) {
    try {
      const response = await API.delete(`/cart/item/${productId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Clear entire cart
   * @returns {Promise<Object>} Empty cart
   */
  async clearCart() {
    try {
      const response = await API.delete("/cart/clear");
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

/**
 * Orders API endpoints
 */
const OrdersAPI = {
  /**
   * Create new order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Order response
   */
  async createOrder(orderData) {
    try {
      const response = await API.post("/orders", orderData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get user's orders
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Orders data
   */
  async getOrders(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `/orders?${queryString}` : "/orders";
      const response = await API.get(endpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get single order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order data
   */
  async getOrder(orderId) {
    try {
      const response = await API.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cancel order
   * @param {string} orderId - Order ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancellation response
   */
  async cancelOrder(orderId, reason) {
    try {
      const response = await API.post(`/orders/${orderId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Track order
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Tracking information
   */
  async trackOrder(orderId) {
    try {
      const response = await API.get(`/orders/${orderId}/track`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

/**
 * Wishlist API endpoints
 */
const WishlistAPI = {
  /**
   * Get user's wishlist
   * @returns {Promise<Object>} Wishlist data
   */
  async getWishlist() {
    try {
      const response = await API.get("/wishlist");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Add item to wishlist
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Updated wishlist
   */
  async addToWishlist(productId) {
    try {
      const response = await API.post(`/wishlist/add/${productId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Remove item from wishlist
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Updated wishlist
   */
  async removeFromWishlist(productId) {
    try {
      const response = await API.delete(`/wishlist/remove/${productId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// ===================================
// ERROR HANDLING
// ===================================

/**
 * Global error handler for API calls
 * @param {Error} error - Error object
 * @param {boolean} showToast - Whether to show error toast
 */
function handleAPIError(error, showToast = true) {
  console.error("API Error:", error);

  let message = "An unexpected error occurred";

  if (error instanceof APIError) {
    switch (error.status) {
      case 400:
        message = error.message || "Bad request";
        break;
      case 401:
        message = "Please log in to continue";
        // Redirect to login if needed
        if (window.location.pathname !== "/login") {
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        }
        break;
      case 403:
        message = "You do not have permission to perform this action";
        break;
      case 404:
        message = "The requested resource was not found";
        break;
      case 422:
        message = error.message || "Invalid data provided";
        break;
      case 429:
        message = "Too many requests. Please try again later";
        break;
      case 500:
        message = "Server error. Please try again later";
        break;
      default:
        message = error.message || "An error occurred";
    }
  } else {
    message = error.message || "Network error";
  }

  if (showToast) {
    Toast.error(message);
  }

  return message;
}

// Export API modules
window.API = API;
window.AuthAPI = AuthAPI;
window.ProductsAPI = ProductsAPI;
window.CartAPI = CartAPI;
window.OrdersAPI = OrdersAPI;
window.WishlistAPI = WishlistAPI;
window.APIError = APIError;
window.handleAPIError = handleAPIError;
