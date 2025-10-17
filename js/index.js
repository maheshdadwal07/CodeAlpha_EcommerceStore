// Load Featured Products
async function loadFeaturedProducts() {
  const grid = document.getElementById("featuredGrid");

  try {
    const products = await apiRequest("/products/featured");

    if (products.length === 0) {
      grid.innerHTML = '<p class="loading">No featured products available</p>';
      return;
    }

    grid.innerHTML = products
      .map(
        (product) => `
            <div class="product-card" onclick="window.location.href='/product-details.html?id=${
              product._id
            }'">
                <img src="${product.image}" alt="${
          product.name
        }" class="product-image">
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <h3 class="product-name" title="${product.name}">${
          product.name
        }</h3>
                    <div class="product-rating">
                        <span class="stars">${generateStars(
                          product.rating
                        )}</span>
                        <span class="reviews">(${product.reviews})</span>
                    </div>
                    <div class="product-price">${formatPrice(
                      product.price
                    )}</div>
                    <div class="product-actions">
                        <button class="btn-add-cart" onclick="addToCart(event, '${
                          product._id
                        }')">
                            Add to Cart
                        </button>
                        <button class="btn-view" onclick="viewProduct(event, '${
                          product._id
                        }')">
                            View
                        </button>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  } catch (error) {
    grid.innerHTML = '<p class="loading">Error loading products</p>';
    console.error("Error loading featured products:", error);
  }
}

// Add to Cart
async function addToCart(event, productId) {
  event.stopPropagation();

  if (!isAuthenticated()) {
    showNotification("Please login to add items to cart", "error");
    setTimeout(() => (window.location.href = "/login.html"), 1500);
    return;
  }

  try {
    await apiRequest("/cart/add", {
      method: "POST",
      body: JSON.stringify({ productId, quantity: 1 }),
    });

    showNotification("Product added to cart!", "success");
    updateCartCount();
  } catch (error) {
    showNotification(error.message, "error");
  }
}

// View Product
function viewProduct(event, productId) {
  event.stopPropagation();
  window.location.href = `/product-details.html?id=${productId}`;
}

// Category Click
document.addEventListener("DOMContentLoaded", () => {
  const categoryCards = document.querySelectorAll(".category-card");

  categoryCards.forEach((card) => {
    card.addEventListener("click", () => {
      const category = card.dataset.category;
      window.location.href = `/products.html?category=${encodeURIComponent(
        category
      )}`;
    });
  });

  // Search functionality
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");

  if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", () => {
      const query = searchInput.value.trim();
      if (query) {
        window.location.href = `/products.html?search=${encodeURIComponent(
          query
        )}`;
      }
    });

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const query = searchInput.value.trim();
        if (query) {
          window.location.href = `/products.html?search=${encodeURIComponent(
            query
          )}`;
        }
      }
    });
  }

  // Load featured products
  loadFeaturedProducts();
});
