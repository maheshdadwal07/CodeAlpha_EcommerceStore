// ===================================
// PRODUCTS MANAGEMENT
// ===================================

/**
 * Products manager
 */
const Products = {
  currentProducts: [],
  currentFilters: {},
  currentSort: "newest",
  currentPage: 1,
  totalPages: 1,
  isLoading: false,

  /**
   * Initialize products
   */
  init() {
    this.bindEvents();
    this.loadFeaturedProducts();
    this.setupProductFilters();
    this.setupProductSearch();
  },

  /**
   * Load featured products for home page
   */
  async loadFeaturedProducts() {
    const featuredContainer = document.getElementById("featured-products");
    if (!featuredContainer) return;

    try {
      this.showProductSkeleton(featuredContainer, 8);

      const response = await ProductsAPI.getFeaturedProducts(8);
      const products = response.products || [];

      this.renderProducts(products, featuredContainer);
    } catch (error) {
      console.error("Failed to load featured products:", error);
      featuredContainer.innerHTML = `
                <div class="error-message">
                    <p>Failed to load products. Please try again later.</p>
                </div>
            `;
    }
  },

  /**
   * Load products with filters
   * @param {Object} filters - Filter parameters
   * @param {boolean} append - Whether to append to existing products
   */
  async loadProducts(filters = {}, append = false) {
    if (this.isLoading) return;

    try {
      this.isLoading = true;

      const params = {
        ...this.currentFilters,
        ...filters,
        sort: this.currentSort,
        page: this.currentPage,
        limit: 20,
      };

      const response = await ProductsAPI.getProducts(params);
      const products = response.products || [];

      if (append) {
        this.currentProducts = [...this.currentProducts, ...products];
      } else {
        this.currentProducts = products;
      }

      this.totalPages = response.totalPages || 1;

      const container =
        document.getElementById("products-grid") ||
        document.getElementById("featured-products");

      if (container) {
        this.renderProducts(this.currentProducts, container);
      }
    } catch (error) {
      handleAPIError(error);
    } finally {
      this.isLoading = false;
    }
  },

  /**
   * Search products
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   */
  async searchProducts(query, filters = {}) {
    if (!query.trim()) {
      this.loadProducts(filters);
      return;
    }

    try {
      this.isLoading = true;

      const response = await ProductsAPI.searchProducts(query, {
        ...filters,
        sort: this.currentSort,
        page: this.currentPage,
        limit: 20,
      });

      const products = response.products || [];
      this.currentProducts = products;
      this.totalPages = response.totalPages || 1;

      const container = document.getElementById("products-grid");
      if (container) {
        this.renderProducts(products, container);
      }

      // Update search results info
      this.updateSearchResultsInfo(query, products.length, response.total);
    } catch (error) {
      handleAPIError(error);
    } finally {
      this.isLoading = false;
    }
  },

  /**
   * Load products by category
   * @param {string} category - Category name
   * @param {Object} filters - Additional filters
   */
  async loadProductsByCategory(category, filters = {}) {
    try {
      this.isLoading = true;

      const params = {
        ...filters,
        sort: this.currentSort,
        page: this.currentPage,
        limit: 20,
      };

      const response = await ProductsAPI.getProductsByCategory(
        category,
        params
      );
      const products = response.products || [];

      this.currentProducts = products;
      this.totalPages = response.totalPages || 1;

      const container = document.getElementById("products-grid");
      if (container) {
        this.renderProducts(products, container);
      }
    } catch (error) {
      handleAPIError(error);
    } finally {
      this.isLoading = false;
    }
  },

  /**
   * Render products in container
   * @param {Array} products - Products to render
   * @param {Element} container - Container element
   */
  renderProducts(products, container) {
    if (!products || products.length === 0) {
      container.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-search"></i>
                    <h3>No products found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;
      return;
    }

    container.innerHTML = products
      .map((product) => this.createProductCard(product))
      .join("");
  },

  /**
   * Create product card HTML
   * @param {Object} product - Product data
   * @returns {string} Product card HTML
   */
  createProductCard(product) {
    const primaryImage =
      product.images?.find((img) => img.isPrimary) || product.images?.[0];
    const imageUrl = primaryImage?.url || "/images/placeholder.png";
    const discount = product.originalPrice
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100
        )
      : 0;

    return `
            <div class="product-card" data-product-id="${product._id}">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${Utils.sanitizeHtml(
      product.name
    )}" loading="lazy">
                    ${
                      discount > 0
                        ? `<div class="product-badge">${discount}% OFF</div>`
                        : ""
                    }
                    <div class="product-actions">
                        <button class="action-btn wishlist-btn" data-product-id="${
                          product._id
                        }" 
                                title="Add to Wishlist">
                            <i class="far fa-heart"></i>
                        </button>
                        <button class="action-btn quick-view-btn" data-product-id="${
                          product._id
                        }" 
                                title="Quick View">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="product-content">
                    <h3 class="product-title">
                        <a href="/product/${product.slug || product._id}">
                            ${Utils.sanitizeHtml(product.name)}
                        </a>
                    </h3>
                    <p class="product-description">
                        ${Utils.sanitizeHtml(
                          product.shortDescription ||
                            product.description?.substring(0, 100) + "..."
                        )}
                    </p>
                    ${this.renderProductRating(product)}
                    <div class="product-price">
                        <div class="price">
                            <span class="current-price">${Utils.formatCurrency(
                              product.price
                            )}</span>
                            ${
                              product.originalPrice
                                ? `<span class="original-price">${Utils.formatCurrency(
                                    product.originalPrice
                                  )}</span>`
                                : ""
                            }
                        </div>
                        ${
                          discount > 0
                            ? `<div class="discount">${discount}% OFF</div>`
                            : ""
                        }
                    </div>
                    <button class="add-to-cart-btn" data-product-id="${
                      product._id
                    }" 
                            ${product.inStock === 0 ? "disabled" : ""}>
                        <i class="fas fa-shopping-cart"></i>
                        ${
                          product.inStock === 0 ? "Out of Stock" : "Add to Cart"
                        }
                    </button>
                </div>
            </div>
        `;
  },

  /**
   * Render product rating
   * @param {Object} product - Product data
   * @returns {string} Rating HTML
   */
  renderProductRating(product) {
    if (!product.reviews || product.reviews.length === 0) {
      return `
                <div class="product-rating">
                    <div class="stars">
                        ${[1, 2, 3, 4, 5]
                          .map(() => '<i class="star empty fas fa-star"></i>')
                          .join("")}
                    </div>
                    <span class="rating-text">No reviews</span>
                </div>
            `;
    }

    const avgRating = product.averageRating || 0;
    const reviewCount = product.reviews.length;

    return `
            <div class="product-rating">
                <div class="stars">
                    ${[1, 2, 3, 4, 5]
                      .map(
                        (star) =>
                          `<i class="star ${
                            star <= avgRating ? "" : "empty"
                          } fas fa-star"></i>`
                      )
                      .join("")}
                </div>
                <span class="rating-text">${avgRating.toFixed(
                  1
                )} (${reviewCount} reviews)</span>
            </div>
        `;
  },

  /**
   * Show product skeleton loading
   * @param {Element} container - Container element
   * @param {number} count - Number of skeletons to show
   */
  showProductSkeleton(container, count = 8) {
    const skeletons = Array(count)
      .fill()
      .map(
        () => `
            <div class="product-skeleton">
                <div class="skeleton-image"></div>
                <div class="skeleton-content">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-price"></div>
                    <div class="skeleton-button"></div>
                </div>
            </div>
        `
      )
      .join("");

    container.innerHTML = skeletons;
  },

  /**
   * Setup product filters
   */
  setupProductFilters() {
    // Category filters
    document.addEventListener("click", (e) => {
      if (e.target.matches(".category-card")) {
        const category = e.target.dataset.category;
        if (category) {
          window.location.href = `/products?category=${encodeURIComponent(
            category
          )}`;
        }
      }
    });

    // Sort dropdown
    const sortSelect = document.getElementById("sort-select");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        this.currentSort = e.target.value;
        this.currentPage = 1;
        this.loadProducts();
      });
    }

    // Price range filter
    const priceFilter = document.getElementById("price-filter");
    if (priceFilter) {
      priceFilter.addEventListener(
        "change",
        Utils.debounce((e) => {
          const [minPrice, maxPrice] = e.target.value.split("-");
          this.currentFilters.minPrice = minPrice;
          this.currentFilters.maxPrice = maxPrice;
          this.currentPage = 1;
          this.loadProducts();
        }, 500)
      );
    }
  },

  /**
   * Setup product search
   */
  setupProductSearch() {
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("search-input");
    const suggestionsContainer = document.getElementById("search-suggestions");

    if (!searchForm || !searchInput) return;

    // Search form submission
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query) {
        window.location.href = `/products?q=${encodeURIComponent(query)}`;
      }
    });

    // Search suggestions
    if (suggestionsContainer) {
      const showSuggestions = Utils.debounce(async (query) => {
        if (query.length < 2) {
          suggestionsContainer.style.display = "none";
          return;
        }

        try {
          const response = await ProductsAPI.searchProducts(query, {
            limit: 5,
          });
          const products = response.products || [];

          if (products.length > 0) {
            suggestionsContainer.innerHTML = products
              .map(
                (product) => `
                            <div class="suggestion-item" data-product-id="${
                              product._id
                            }">
                                <img src="${
                                  product.images?.[0]?.url ||
                                  "/images/placeholder.png"
                                }" 
                                     alt="${product.name}" loading="lazy">
                                <div class="suggestion-content">
                                    <h4>${Utils.sanitizeHtml(product.name)}</h4>
                                    <p>${Utils.formatCurrency(
                                      product.price
                                    )}</p>
                                </div>
                            </div>
                        `
              )
              .join("");
            suggestionsContainer.style.display = "block";
          } else {
            suggestionsContainer.style.display = "none";
          }
        } catch (error) {
          console.error("Search suggestions error:", error);
          suggestionsContainer.style.display = "none";
        }
      }, 300);

      searchInput.addEventListener("input", (e) => {
        showSuggestions(e.target.value);
      });

      // Hide suggestions when clicking outside
      document.addEventListener("click", (e) => {
        if (!searchForm.contains(e.target)) {
          suggestionsContainer.style.display = "none";
        }
      });

      // Handle suggestion clicks
      suggestionsContainer.addEventListener("click", (e) => {
        const suggestionItem = e.target.closest(".suggestion-item");
        if (suggestionItem) {
          const productId = suggestionItem.dataset.productId;
          // Navigate to product page or trigger search
          window.location.href = `/product/${productId}`;
        }
      });
    }
  },

  /**
   * Update search results info
   * @param {string} query - Search query
   * @param {number} count - Number of results shown
   * @param {number} total - Total number of results
   */
  updateSearchResultsInfo(query, count, total) {
    const infoContainer = document.getElementById("search-results-info");
    if (infoContainer) {
      infoContainer.innerHTML = `
                <p>Showing ${count} of ${total} results for "<strong>${Utils.sanitizeHtml(
        query
      )}</strong>"</p>
            `;
    }
  },

  /**
   * Setup infinite scroll for products page
   */
  setupInfiniteScroll() {
    let isScrollLoading = false;

    window.addEventListener(
      "scroll",
      Utils.throttle(() => {
        if (isScrollLoading || this.isLoading) return;

        const { scrollTop, scrollHeight, clientHeight } =
          document.documentElement;

        if (scrollTop + clientHeight >= scrollHeight - 1000) {
          if (this.currentPage < this.totalPages) {
            isScrollLoading = true;
            this.currentPage++;
            this.loadProducts({}, true).finally(() => {
              isScrollLoading = false;
            });
          }
        }
      }, 200)
    );
  },

  /**
   * Bind product-related events
   */
  bindEvents() {
    // Wishlist buttons
    document.addEventListener("click", async (e) => {
      if (e.target.matches(".wishlist-btn, .wishlist-btn *")) {
        e.preventDefault();

        const button = e.target.closest(".wishlist-btn");
        const productId = button.dataset.productId;

        Auth.requireAuth(async () => {
          try {
            await WishlistAPI.addToWishlist(productId);
            button.classList.add("active");
            button.querySelector("i").className = "fas fa-heart";
            Toast.success("Added to wishlist!");
          } catch (error) {
            handleAPIError(error);
          }
        }, "Please log in to add items to your wishlist");
      }
    });

    // Quick view buttons
    document.addEventListener("click", (e) => {
      if (e.target.matches(".quick-view-btn, .quick-view-btn *")) {
        e.preventDefault();

        const button = e.target.closest(".quick-view-btn");
        const productId = button.dataset.productId;

        this.showQuickView(productId);
      }
    });
  },

  /**
   * Show quick view modal
   * @param {string} productId - Product ID
   */
  async showQuickView(productId) {
    try {
      Utils.toggleLoading(true);

      const response = await ProductsAPI.getProduct(productId);
      const product = response.product;

      const quickViewContent = this.createQuickViewContent(product);
      Modal.show(quickViewContent, { className: "quick-view-modal" });
    } catch (error) {
      handleAPIError(error);
    } finally {
      Utils.toggleLoading(false);
    }
  },

  /**
   * Create quick view content
   * @param {Object} product - Product data
   * @returns {string} Quick view HTML
   */
  createQuickViewContent(product) {
    const primaryImage =
      product.images?.find((img) => img.isPrimary) || product.images?.[0];
    const imageUrl = primaryImage?.url || "/images/placeholder.png";
    const discount = product.originalPrice
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100
        )
      : 0;

    return `
            <div class="quick-view">
                <div class="quick-view-image">
                    <img src="${imageUrl}" alt="${Utils.sanitizeHtml(
      product.name
    )}">
                </div>
                <div class="quick-view-details">
                    <h2>${Utils.sanitizeHtml(product.name)}</h2>
                    <div class="price-section">
                        <span class="current-price">${Utils.formatCurrency(
                          product.price
                        )}</span>
                        ${
                          product.originalPrice
                            ? `<span class="original-price">${Utils.formatCurrency(
                                product.originalPrice
                              )}</span>`
                            : ""
                        }
                        ${
                          discount > 0
                            ? `<span class="discount">${discount}% OFF</span>`
                            : ""
                        }
                    </div>
                    ${this.renderProductRating(product)}
                    <p class="description">${Utils.sanitizeHtml(
                      product.description
                    )}</p>
                    <div class="stock-status ${
                      product.inStock > 0 ? "in-stock" : "out-of-stock"
                    }">
                        ${
                          product.inStock > 0
                            ? `<i class="fas fa-check"></i> ${product.inStock} in stock`
                            : '<i class="fas fa-times"></i> Out of stock'
                        }
                    </div>
                    <div class="quick-view-actions">
                        <button class="add-to-cart-btn" data-product-id="${
                          product._id
                        }" 
                                ${product.inStock === 0 ? "disabled" : ""}>
                            <i class="fas fa-shopping-cart"></i>
                            Add to Cart
                        </button>
                        <button class="wishlist-btn" data-product-id="${
                          product._id
                        }">
                            <i class="far fa-heart"></i>
                            Add to Wishlist
                        </button>
                        <a href="/product/${
                          product.slug || product._id
                        }" class="view-details-btn">
                            View Full Details
                        </a>
                    </div>
                </div>
            </div>
        `;
  },
};

// ===================================
// INITIALIZATION
// ===================================

// Initialize products when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  Products.init();

  // Setup infinite scroll if on products page
  if (window.location.pathname.includes("/products")) {
    Products.setupInfiniteScroll();
  }
});

// Export Products object
window.Products = Products;
