let currentPage = 1;
let currentFilters = {
  category: "All",
  search: "",
  sort: "newest",
};

// Get URL Parameters
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    category: params.get("category") || "All",
    search: params.get("search") || "",
    sort: params.get("sort") || "newest",
    page: parseInt(params.get("page")) || 1,
  };
}

// Load Products
async function loadProducts() {
  const grid = document.getElementById("productsGrid");
  grid.innerHTML = '<div class="loading">Loading products...</div>';

  try {
    const params = new URLSearchParams({
      category: currentFilters.category,
      search: currentFilters.search,
      sort: currentFilters.sort,
      page: currentPage,
      limit: 12,
    });

    const data = await apiRequest(`/products?${params}`);

    if (data.products.length === 0) {
      grid.innerHTML = '<p class="loading">No products found</p>';
      return;
    }

    grid.innerHTML = data.products
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

    // Render Pagination
    renderPagination(data.currentPage, data.totalPages);
  } catch (error) {
    grid.innerHTML = '<p class="loading">Error loading products</p>';
    console.error("Error loading products:", error);
  }
}

// Render Pagination
function renderPagination(current, total) {
  const pagination = document.getElementById("pagination");

  if (total <= 1) {
    pagination.innerHTML = "";
    return;
  }

  let html = "";

  if (current > 1) {
    html += `<button onclick="changePage(${current - 1})">Previous</button>`;
  }

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 2 && i <= current + 2)) {
      html += `<button onclick="changePage(${i})" class="${
        i === current ? "active" : ""
      }">${i}</button>`;
    } else if (i === current - 3 || i === current + 3) {
      html += "<button disabled>...</button>";
    }
  }

  if (current < total) {
    html += `<button onclick="changePage(${current + 1})">Next</button>`;
  }

  pagination.innerHTML = html;
}

// Change Page
function changePage(page) {
  currentPage = page;
  loadProducts();
  window.scrollTo({ top: 0, behavior: "smooth" });
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

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = getUrlParams();
  currentFilters = {
    category: urlParams.category,
    search: urlParams.search,
    sort: urlParams.sort,
  };
  currentPage = urlParams.page;

  // Set filter values
  const categoryFilter = document.getElementById("categoryFilter");
  const sortFilter = document.getElementById("sortFilter");
  const searchInput = document.getElementById("searchInput");

  if (categoryFilter) {
    categoryFilter.value = currentFilters.category;
    categoryFilter.addEventListener("change", (e) => {
      currentFilters.category = e.target.value;
      currentPage = 1;
      loadProducts();
    });
  }

  if (sortFilter) {
    sortFilter.value = currentFilters.sort;
    sortFilter.addEventListener("change", (e) => {
      currentFilters.sort = e.target.value;
      currentPage = 1;
      loadProducts();
    });
  }

  if (searchInput) {
    searchInput.value = currentFilters.search;

    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) {
      searchBtn.addEventListener("click", () => {
        currentFilters.search = searchInput.value.trim();
        currentPage = 1;
        loadProducts();
      });
    }

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        currentFilters.search = searchInput.value.trim();
        currentPage = 1;
        loadProducts();
      }
    });
  }

  loadProducts();
});
