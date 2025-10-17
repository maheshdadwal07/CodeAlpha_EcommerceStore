let cart = null;

// Load Cart
async function loadCart() {
  if (!isAuthenticated()) {
    window.location.href = "/login.html";
    return;
  }

  const cartContent = document.getElementById("cartContent");
  const emptyCart = document.getElementById("emptyCart");

  try {
    cart = await apiRequest("/cart");

    if (!cart.items || cart.items.length === 0) {
      cartContent.style.display = "none";
      emptyCart.style.display = "block";
      return;
    }

    emptyCart.style.display = "none";
    cartContent.style.display = "grid";

    const total = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    cartContent.innerHTML = `
            <div class="cart-items">
                <h3>Cart Items (${cart.items.length})</h3>
                ${cart.items
                  .map(
                    (item) => `
                    <div class="cart-item">
                        <img src="${item.product.image}" alt="${
                      item.product.name
                    }" class="cart-item-image">
                        <div class="cart-item-info">
                            <h3>${item.product.name}</h3>
                            <p class="product-category">${
                              item.product.category
                            }</p>
                            <p class="cart-item-price">${formatPrice(
                              item.product.price
                            )}</p>
                        </div>
                        <div class="quantity-selector">
                            <button onclick="updateQuantity('${
                              item.product._id
                            }', ${item.quantity - 1})">−</button>
                            <input type="number" value="${
                              item.quantity
                            }" min="1" max="${item.product.stock}" readonly>
                            <button onclick="updateQuantity('${
                              item.product._id
                            }', ${item.quantity + 1})">+</button>
                        </div>
                        <div class="cart-item-actions">
                            <div style="font-weight: 800; font-size: 1.5rem; font-family: 'Poppins', sans-serif;">
                                ${formatPrice(
                                  item.product.price * item.quantity
                                )}
                            </div>
                            <button class="btn-remove" onclick="removeFromCart('${
                              item.product._id
                            }')">
                                🗑️ Remove
                            </button>
                        </div>
                    </div>
                `
                  )
                  .join("")}
            </div>

            <div class="cart-summary">
                <h3>📋 Order Summary</h3>
                <div class="summary-row">
                    <span>📦 Items (${cart.items.length}):</span>
                    <span>${cart.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    )}</span>
                </div>
                <div class="summary-row">
                    <span>💰 Subtotal:</span>
                    <span>${formatPrice(total)}</span>
                </div>
                <div class="summary-row">
                    <span>🚚 Shipping:</span>
                    <span style="color: #48bb78; font-weight: 700;">FREE</span>
                </div>
                <div class="summary-row total">
                    <span>💳 Total:</span>
                    <span>${formatPrice(total)}</span>
                </div>
                <button class="btn-checkout" onclick="proceedToCheckout()">
                    🚀 Proceed to Checkout
                </button>
                <button class="btn-remove" onclick="clearCart()" style="width: 100%; margin-top: 1rem;">
                    🗑️ Clear Cart
                </button>
            </div>
        `;
  } catch (error) {
    console.error("Error loading cart:", error);
    showNotification("Error loading cart", "error");
  }
}

// Update Quantity
async function updateQuantity(productId, newQuantity) {
  if (newQuantity < 1) {
    removeFromCart(productId);
    return;
  }

  try {
    await apiRequest(`/cart/update/${productId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity: newQuantity }),
    });

    loadCart();
    updateCartCount();
  } catch (error) {
    showNotification(error.message, "error");
  }
}

// Remove from Cart
async function removeFromCart(productId) {
  if (!confirm("Remove this item from cart?")) return;

  try {
    await apiRequest(`/cart/remove/${productId}`, {
      method: "DELETE",
    });

    showNotification("Item removed from cart", "success");
    loadCart();
    updateCartCount();
  } catch (error) {
    showNotification(error.message, "error");
  }
}

// Clear Cart
async function clearCart() {
  if (!confirm("Clear all items from cart?")) return;

  try {
    await apiRequest("/cart/clear", {
      method: "DELETE",
    });

    showNotification("Cart cleared", "success");
    loadCart();
    updateCartCount();
  } catch (error) {
    showNotification(error.message, "error");
  }
}

// Proceed to Checkout
function proceedToCheckout() {
  window.location.href = "/checkout.html";
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadCart();
});
