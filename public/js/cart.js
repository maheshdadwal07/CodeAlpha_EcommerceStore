// ===================================
// SHOPPING CART MANAGEMENT
// ===================================

/**
 * Shopping cart manager
 */
const Cart = {
  items: [],
  total: 0,
  itemCount: 0,

  /**
   * Initialize cart
   */
  async init() {
    try {
      // Load cart from server if authenticated, otherwise from localStorage
      if (Auth.isAuthenticated) {
        await this.loadServerCart();
      } else {
        this.loadLocalCart();
      }

      this.updateCartCount();
      this.bindEvents();
    } catch (error) {
      console.error("Cart initialization failed:", error);
      this.loadLocalCart();
    }
  },

  /**
   * Load cart from server
   */
  async loadServerCart() {
    try {
      const response = await CartAPI.getCart();
      this.items = response.items || [];
      this.calculateTotals();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Load cart from localStorage
   */
  loadLocalCart() {
    const savedCart = Utils.storage.get("cart", { items: [], total: 0 });
    this.items = savedCart.items || [];
    this.calculateTotals();
  },

  /**
   * Save cart to localStorage
   */
  saveLocalCart() {
    Utils.storage.set("cart", {
      items: this.items,
      total: this.total,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Add item to cart
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to add
   * @param {Object} productData - Product data (for local cart)
   * @returns {Promise<boolean>} Success status
   */
  async addItem(productId, quantity = 1, productData = null) {
    try {
      Utils.toggleLoading(true);

      if (Auth.isAuthenticated) {
        // Add to server cart
        const response = await CartAPI.addToCart(productId, quantity);
        this.items = response.items || [];
        this.calculateTotals();
      } else {
        // Add to local cart
        const existingItem = this.items.find(
          (item) => item.product._id === productId
        );

        if (existingItem) {
          existingItem.quantity += quantity;
          if (existingItem.quantity > 10) {
            existingItem.quantity = 10;
            Toast.warning("Maximum quantity per item is 10");
          }
        } else {
          if (productData) {
            this.items.push({
              product: productData,
              quantity: Math.min(quantity, 10),
              addedAt: new Date().toISOString(),
            });
          } else {
            // Fetch product data
            const product = await ProductsAPI.getProduct(productId);
            this.items.push({
              product: product.product,
              quantity: Math.min(quantity, 10),
              addedAt: new Date().toISOString(),
            });
          }
        }

        this.calculateTotals();
        this.saveLocalCart();
      }

      this.updateCartCount();
      this.updateCartUI();

      Toast.success("Item added to cart!");
      return true;
    } catch (error) {
      handleAPIError(error);
      return false;
    } finally {
      Utils.toggleLoading(false);
    }
  },

  /**
   * Update item quantity
   * @param {string} productId - Product ID
   * @param {number} quantity - New quantity
   * @returns {Promise<boolean>} Success status
   */
  async updateItem(productId, quantity) {
    try {
      if (quantity <= 0) {
        return this.removeItem(productId);
      }

      if (quantity > 10) {
        quantity = 10;
        Toast.warning("Maximum quantity per item is 10");
      }

      if (Auth.isAuthenticated) {
        // Update server cart
        const response = await CartAPI.updateCartItem(productId, quantity);
        this.items = response.items || [];
        this.calculateTotals();
      } else {
        // Update local cart
        const item = this.items.find((item) => item.product._id === productId);
        if (item) {
          item.quantity = quantity;
          this.calculateTotals();
          this.saveLocalCart();
        }
      }

      this.updateCartCount();
      this.updateCartUI();

      return true;
    } catch (error) {
      handleAPIError(error);
      return false;
    }
  },

  /**
   * Remove item from cart
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>} Success status
   */
  async removeItem(productId) {
    try {
      if (Auth.isAuthenticated) {
        // Remove from server cart
        const response = await CartAPI.removeFromCart(productId);
        this.items = response.items || [];
        this.calculateTotals();
      } else {
        // Remove from local cart
        this.items = this.items.filter(
          (item) => item.product._id !== productId
        );
        this.calculateTotals();
        this.saveLocalCart();
      }

      this.updateCartCount();
      this.updateCartUI();

      Toast.info("Item removed from cart");
      return true;
    } catch (error) {
      handleAPIError(error);
      return false;
    }
  },

  /**
   * Clear entire cart
   * @returns {Promise<boolean>} Success status
   */
  async clearCart() {
    try {
      if (Auth.isAuthenticated) {
        // Clear server cart
        await CartAPI.clearCart();
      }

      // Clear local cart
      this.items = [];
      this.calculateTotals();
      this.saveLocalCart();

      this.updateCartCount();
      this.updateCartUI();

      Toast.info("Cart cleared");
      return true;
    } catch (error) {
      handleAPIError(error);
      return false;
    }
  },

  /**
   * Clear local cart only
   */
  clearLocalCart() {
    this.items = [];
    this.calculateTotals();
    this.saveLocalCart();
    this.updateCartCount();
    this.updateCartUI();
  },

  /**
   * Calculate cart totals
   */
  calculateTotals() {
    this.itemCount = this.items.reduce(
      (total, item) => total + item.quantity,
      0
    );
    this.total = this.items.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  },

  /**
   * Update cart count in UI
   */
  updateCartCount() {
    const cartCountElements = document.querySelectorAll(
      "#cart-count, #mobile-cart-count"
    );
    cartCountElements.forEach((el) => {
      if (el) {
        el.textContent = this.itemCount.toString();
        el.style.display = this.itemCount > 0 ? "inline" : "none";
      }
    });
  },

  /**
   * Update cart UI (for cart page)
   */
  updateCartUI() {
    const cartContainer = document.getElementById("cart-items");
    if (!cartContainer) return;

    if (this.items.length === 0) {
      cartContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Your cart is empty</h3>
                    <p>Add some products to get started!</p>
                    <a href="/products" class="cta-button">Shop Now</a>
                </div>
            `;
      return;
    }

    cartContainer.innerHTML = this.items
      .map(
        (item) => `
            <div class="cart-item" data-product-id="${item.product._id}">
                <div class="item-image">
                    <img src="${
                      item.product.images?.[0]?.url || "/images/placeholder.png"
                    }" 
                         alt="${item.product.name}" loading="lazy">
                </div>
                <div class="item-details">
                    <h3 class="item-name">${Utils.sanitizeHtml(
                      item.product.name
                    )}</h3>
                    <p class="item-price">${Utils.formatCurrency(
                      item.product.price
                    )}</p>
                </div>
                <div class="item-quantity">
                    <button class="quantity-btn minus" data-action="decrease">-</button>
                    <input type="number" class="quantity-input" value="${
                      item.quantity
                    }" 
                           min="1" max="10" data-product-id="${
                             item.product._id
                           }">
                    <button class="quantity-btn plus" data-action="increase">+</button>
                </div>
                <div class="item-total">
                    ${Utils.formatCurrency(item.product.price * item.quantity)}
                </div>
                <button class="remove-btn" data-product-id="${
                  item.product._id
                }">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `
      )
      .join("");

    // Update cart summary
    this.updateCartSummary();
  },

  /**
   * Update cart summary
   */
  updateCartSummary() {
    const summaryContainer = document.getElementById("cart-summary");
    if (!summaryContainer) return;

    const subtotal = this.total;
    const tax = subtotal * 0.18; // 18% GST
    const shipping = subtotal > 500 ? 0 : 50; // Free shipping above ₹500
    const total = subtotal + tax + shipping;

    summaryContainer.innerHTML = `
            <div class="summary-row">
                <span>Subtotal (${this.itemCount} items):</span>
                <span>${Utils.formatCurrency(subtotal)}</span>
            </div>
            <div class="summary-row">
                <span>Tax (GST):</span>
                <span>${Utils.formatCurrency(tax)}</span>
            </div>
            <div class="summary-row">
                <span>Shipping:</span>
                <span>${
                  shipping === 0 ? "Free" : Utils.formatCurrency(shipping)
                }</span>
            </div>
            <hr>
            <div class="summary-row total">
                <span>Total:</span>
                <span>${Utils.formatCurrency(total)}</span>
            </div>
            <button class="checkout-btn" ${
              this.items.length === 0 ? "disabled" : ""
            }>
                Proceed to Checkout
            </button>
        `;
  },

  /**
   * Bind cart-related events
   */
  bindEvents() {
    // Add to cart buttons
    document.addEventListener("click", async (e) => {
      if (e.target.matches(".add-to-cart-btn, .add-to-cart-btn *")) {
        e.preventDefault();

        const button = e.target.closest(".add-to-cart-btn");
        const productId = button.dataset.productId;
        const quantity = parseInt(button.dataset.quantity) || 1;

        if (productId) {
          await this.addItem(productId, quantity);
        }
      }
    });

    // Cart quantity controls
    document.addEventListener("click", async (e) => {
      if (e.target.matches(".quantity-btn")) {
        const action = e.target.dataset.action;
        const cartItem = e.target.closest(".cart-item");
        const productId = cartItem?.dataset.productId;
        const quantityInput = cartItem?.querySelector(".quantity-input");

        if (productId && quantityInput) {
          let newQuantity = parseInt(quantityInput.value);

          if (action === "increase") {
            newQuantity++;
          } else if (action === "decrease") {
            newQuantity--;
          }

          quantityInput.value = newQuantity;
          await this.updateItem(productId, newQuantity);
        }
      }
    });

    // Quantity input change
    document.addEventListener("change", async (e) => {
      if (e.target.matches(".quantity-input")) {
        const productId = e.target.dataset.productId;
        const quantity = parseInt(e.target.value);

        if (productId && quantity >= 0) {
          await this.updateItem(productId, quantity);
        }
      }
    });

    // Remove item buttons
    document.addEventListener("click", async (e) => {
      if (e.target.matches(".remove-btn, .remove-btn *")) {
        e.preventDefault();

        const button = e.target.closest(".remove-btn");
        const productId = button.dataset.productId;

        if (productId) {
          const confirmed = confirm(
            "Are you sure you want to remove this item?"
          );
          if (confirmed) {
            await this.removeItem(productId);
          }
        }
      }
    });

    // Checkout button
    document.addEventListener("click", (e) => {
      if (e.target.matches(".checkout-btn")) {
        e.preventDefault();

        if (this.items.length === 0) {
          Toast.warning("Your cart is empty");
          return;
        }

        Auth.requireAuth(() => {
          window.location.href = "/checkout";
        }, "Please log in to proceed to checkout");
      }
    });
  },

  /**
   * Get cart data for checkout
   * @returns {Object} Cart data
   */
  getCartData() {
    return {
      items: this.items,
      itemCount: this.itemCount,
      subtotal: this.total,
      tax: this.total * 0.18,
      shipping: this.total > 500 ? 0 : 50,
      total: this.total + this.total * 0.18 + (this.total > 500 ? 0 : 50),
    };
  },
};

// ===================================
// INITIALIZATION
// ===================================

// Initialize cart when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Wait for Auth to initialize first
  setTimeout(() => {
    Cart.init();
  }, 100);
});

// Export Cart object
window.Cart = Cart;
