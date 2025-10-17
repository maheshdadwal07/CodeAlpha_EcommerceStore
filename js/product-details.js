let product = null;
let quantity = 1;

// Get Product ID from URL
function getProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

// Load Product Details
async function loadProductDetails() {
  const productId = getProductId();

  if (!productId) {
    window.location.href = "/products.html";
    return;
  }

  const container = document.getElementById("productDetails");

  try {
    product = await apiRequest(`/products/${productId}`);

    container.innerHTML = `
            <div class="details-grid">
                <div class="details-image-container">
                    <img src="${product.image}" alt="${
      product.name
    }" class="details-image">
                </div>
                <div class="details-info">
                    <div class="product-category">${product.category}</div>
                    <h1>${product.name}</h1>
                    
                    <div class="product-rating">
                        <span class="stars">${generateStars(
                          product.rating
                        )}</span>
                        <span class="reviews">(${
                          product.reviews
                        } reviews)</span>
                    </div>

                    <div class="product-price">${formatPrice(
                      product.price
                    )}</div>

                    <div class="stock-status ${
                      product.stock > 0 ? "in-stock" : "out-of-stock"
                    }">
                        ${
                          product.stock > 0
                            ? `✓ In Stock (${product.stock} available)`
                            : "✗ Out of Stock"
                        }
                    </div>

                    <p class="details-description">${product.description}</p>

                    ${
                      product.stock > 0
                        ? `
                        <div class="quantity-selector">
                            <label>Quantity:</label>
                            <button onclick="decreaseQuantity()">−</button>
                            <input type="number" id="quantityInput" value="1" min="1" max="${product.stock}" readonly>
                            <button onclick="increaseQuantity()">+</button>
                        </div>

                        <div class="product-actions">
                            <button class="btn-add-cart" onclick="addToCartFromDetails()">
                                <span style="font-size: 1.1em;">🛒</span> ADD TO CART
                            </button>
                            <button class="btn-buy-now" onclick="buyNow()">
                                <span style="font-size: 1.1em;">⚡</span> BUY NOW
                            </button>
                        </div>
                    `
                        : ""
                    }
                </div>
            </div>
        `;
  } catch (error) {
    container.innerHTML =
      '<p class="loading">Error loading product details</p>';
    console.error("Error loading product:", error);
  }
}

// Quantity Controls
function increaseQuantity() {
  const input = document.getElementById("quantityInput");
  if (quantity < product.stock) {
    quantity++;
    input.value = quantity;
  }
}

function decreaseQuantity() {
  const input = document.getElementById("quantityInput");
  if (quantity > 1) {
    quantity--;
    input.value = quantity;
  }
}

// Add to Cart from Details
async function addToCartFromDetails() {
  if (!isAuthenticated()) {
    showNotification("Please login to add items to cart", "error");
    setTimeout(() => (window.location.href = "/login.html"), 1500);
    return;
  }

  try {
    await apiRequest("/cart/add", {
      method: "POST",
      body: JSON.stringify({ productId: product._id, quantity }),
    });

    showNotification(`${quantity} item(s) added to cart!`, "success");
    updateCartCount();
    quantity = 1;
    document.getElementById("quantityInput").value = 1;
  } catch (error) {
    showNotification(error.message, "error");
  }
}

// Buy Now
async function buyNow() {
  if (!isAuthenticated()) {
    showNotification("Please login to continue", "error");
    setTimeout(() => (window.location.href = "/login.html"), 1500);
    return;
  }

  try {
    await apiRequest("/cart/add", {
      method: "POST",
      body: JSON.stringify({ productId: product._id, quantity }),
    });

    window.location.href = "/checkout.html";
  } catch (error) {
    showNotification(error.message, "error");
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadProductDetails();
});
