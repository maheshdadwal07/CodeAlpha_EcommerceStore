// ===================================
// MAIN APPLICATION CONTROLLER
// ===================================

/**
 * Main application controller
 */
const App = {
  isInitialized: false,

  /**
   * Initialize the application
   */
  async init() {
    if (this.isInitialized) return;

    try {
      // Show loading spinner
      Utils.toggleLoading(true);

      // Initialize core systems
      await this.initializeSystems();

      // Setup global event listeners
      this.setupGlobalEvents();

      // Setup mobile navigation
      this.setupMobileNavigation();

      // Setup newsletter form
      this.setupNewsletterForm();

      // Setup page-specific functionality
      this.setupPageSpecific();

      // Setup intersection observers
      this.setupIntersectionObservers();

      // Mark as initialized
      this.isInitialized = true;

      // Hide loading spinner
      Utils.toggleLoading(false);

      console.log("🚀 CodeAlpha E-commerce Store initialized successfully!");
    } catch (error) {
      console.error("❌ Application initialization failed:", error);
      Utils.toggleLoading(false);
      Toast.error("Failed to initialize application. Please refresh the page.");
    }
  },

  /**
   * Initialize core systems
   */
  async initializeSystems() {
    // Initialize authentication first
    if (window.Auth) {
      await Auth.init();
    }

    // Initialize cart after auth
    if (window.Cart) {
      await Cart.init();
    }

    // Initialize products
    if (window.Products) {
      Products.init();
    }
  },

  /**
   * Setup global event listeners
   */
  setupGlobalEvents() {
    // Handle form submissions with loading states
    document.addEventListener("submit", (e) => {
      const form = e.target;
      if (form.classList.contains("no-loading")) return;

      const submitButton = form.querySelector('[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        const originalText = submitButton.textContent;
        submitButton.textContent = "Processing...";

        // Re-enable after 5 seconds (fallback)
        setTimeout(() => {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }, 5000);
      }
    });

    // Handle external links
    document.addEventListener("click", (e) => {
      const link = e.target.closest('a[href^="http"]');
      if (link && !link.href.includes(window.location.hostname)) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    });

    // Handle keyboard navigation
    document.addEventListener("keydown", (e) => {
      // Close modals with Escape key
      if (e.key === "Escape") {
        if (window.Modal && Modal.currentModal) {
          Modal.close();
        }

        // Close search suggestions
        const suggestions = document.getElementById("search-suggestions");
        if (suggestions) {
          suggestions.style.display = "none";
        }
      }
    });

    // Handle online/offline status
    window.addEventListener("online", () => {
      Toast.success("Connection restored");
    });

    window.addEventListener("offline", () => {
      Toast.warning("You are offline. Some features may not work.");
    });

    // Handle page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        // Refresh cart count when page becomes visible
        if (window.Cart && Auth.isAuthenticated) {
          Cart.updateCartCount();
        }
      }
    });
  },

  /**
   * Setup mobile navigation
   */
  setupMobileNavigation() {
    const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
    const mobileNav = document.getElementById("mobile-nav");

    if (mobileMenuToggle && mobileNav) {
      mobileMenuToggle.addEventListener("click", () => {
        mobileNav.classList.toggle("active");
        mobileMenuToggle.classList.toggle("active");

        // Prevent body scroll when menu is open
        if (mobileNav.classList.contains("active")) {
          document.body.style.overflow = "hidden";
        } else {
          document.body.style.overflow = "";
        }
      });

      // Close mobile menu when clicking links
      mobileNav.addEventListener("click", (e) => {
        if (e.target.matches("a")) {
          mobileNav.classList.remove("active");
          mobileMenuToggle.classList.remove("active");
          document.body.style.overflow = "";
        }
      });

      // Close mobile menu on resize
      window.addEventListener("resize", () => {
        if (window.innerWidth > 768) {
          mobileNav.classList.remove("active");
          mobileMenuToggle.classList.remove("active");
          document.body.style.overflow = "";
        }
      });
    }
  },

  /**
   * Setup newsletter form
   */
  setupNewsletterForm() {
    const newsletterForm = document.getElementById("newsletter-form");
    if (!newsletterForm) return;

    newsletterForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const emailInput = newsletterForm.querySelector("#newsletter-email");
      const email = emailInput.value.trim();

      if (!Utils.isValidEmail(email)) {
        Toast.error("Please enter a valid email address");
        return;
      }

      try {
        // Mock newsletter subscription (replace with actual API call)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        Toast.success("Thank you for subscribing to our newsletter!");
        emailInput.value = "";
      } catch (error) {
        Toast.error("Failed to subscribe. Please try again.");
      }
    });
  },

  /**
   * Setup page-specific functionality
   */
  setupPageSpecific() {
    const pathname = window.location.pathname;

    // Home page
    if (pathname === "/" || pathname === "/index.html") {
      this.setupHomePage();
    }

    // Products page
    else if (pathname.startsWith("/products")) {
      this.setupProductsPage();
    }

    // Product detail page
    else if (pathname.startsWith("/product/")) {
      this.setupProductDetailPage();
    }

    // Cart page
    else if (pathname.startsWith("/cart")) {
      this.setupCartPage();
    }

    // Checkout page
    else if (pathname.startsWith("/checkout")) {
      this.setupCheckoutPage();
    }

    // Profile pages
    else if (
      pathname.startsWith("/profile") ||
      pathname.startsWith("/orders")
    ) {
      this.setupProfilePages();
    }
  },

  /**
   * Setup home page functionality
   */
  setupHomePage() {
    // Add smooth scrolling to CTA buttons
    const ctaButtons = document.querySelectorAll(".cta-button");
    ctaButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        if (button.getAttribute("href") === "#featured") {
          e.preventDefault();
          Utils.scrollToElement("#featured-products", 100);
        }
      });
    });

    // Animate hero section on load
    const heroText = document.querySelector(".hero-text");
    if (heroText) {
      heroText.style.opacity = "0";
      heroText.style.transform = "translateY(30px)";

      setTimeout(() => {
        heroText.style.transition = "opacity 0.8s ease, transform 0.8s ease";
        heroText.style.opacity = "1";
        heroText.style.transform = "translateY(0)";
      }, 100);
    }
  },

  /**
   * Setup products page functionality
   */
  setupProductsPage() {
    // Initialize filters from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get("category");
    const query = urlParams.get("q");

    if (query) {
      // Set search input value
      const searchInput = document.getElementById("search-input");
      if (searchInput) {
        searchInput.value = query;
      }

      // Perform search
      if (window.Products) {
        Products.searchProducts(query);
      }
    } else if (category) {
      // Load products by category
      if (window.Products) {
        Products.loadProductsByCategory(category);
      }
    } else {
      // Load all products
      if (window.Products) {
        Products.loadProducts();
      }
    }
  },

  /**
   * Setup product detail page functionality
   */
  setupProductDetailPage() {
    // Image gallery
    this.setupProductImageGallery();

    // Quantity selector
    this.setupQuantitySelector();

    // Reviews section
    this.setupReviewsSection();

    // Related products
    this.loadRelatedProducts();
  },

  /**
   * Setup cart page functionality
   */
  setupCartPage() {
    if (window.Cart) {
      Cart.updateCartUI();
    }
  },

  /**
   * Setup checkout page functionality
   */
  setupCheckoutPage() {
    // Require authentication
    if (!Auth.isAuthenticated) {
      window.location.href =
        "/login?redirect=" + encodeURIComponent(window.location.pathname);
      return;
    }

    // Setup checkout form
    this.setupCheckoutForm();
  },

  /**
   * Setup profile pages functionality
   */
  setupProfilePages() {
    // Require authentication
    if (!Auth.isAuthenticated) {
      window.location.href =
        "/login?redirect=" + encodeURIComponent(window.location.pathname);
      return;
    }

    // Setup profile tabs
    this.setupProfileTabs();
  },

  /**
   * Setup intersection observers for animations
   */
  setupIntersectionObservers() {
    if (!("IntersectionObserver" in window)) return;

    // Animate elements on scroll
    const animateOnScroll = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    // Observe elements with animation classes
    document
      .querySelectorAll(".fade-in, .slide-in, .scale-in")
      .forEach((el) => {
        animateOnScroll.observe(el);
      });

    // Lazy load images
    const lazyImageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove("lazy");
          lazyImageObserver.unobserve(img);
        }
      });
    });

    document.querySelectorAll("img[data-src]").forEach((img) => {
      lazyImageObserver.observe(img);
    });
  },

  /**
   * Setup product image gallery
   */
  setupProductImageGallery() {
    const thumbnails = document.querySelectorAll(".thumbnail-img");
    const mainImage = document.querySelector(".main-product-image");

    if (thumbnails.length === 0 || !mainImage) return;

    thumbnails.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        mainImage.src = thumb.src;
        mainImage.alt = thumb.alt;

        // Update active thumbnail
        thumbnails.forEach((t) => t.classList.remove("active"));
        thumb.classList.add("active");
      });
    });
  },

  /**
   * Setup quantity selector
   */
  setupQuantitySelector() {
    const quantityContainer = document.querySelector(".quantity-selector");
    if (!quantityContainer) return;

    const decreaseBtn = quantityContainer.querySelector(".quantity-decrease");
    const increaseBtn = quantityContainer.querySelector(".quantity-increase");
    const quantityInput = quantityContainer.querySelector(".quantity-input");

    if (decreaseBtn && increaseBtn && quantityInput) {
      decreaseBtn.addEventListener("click", () => {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
          quantityInput.value = currentValue - 1;
        }
      });

      increaseBtn.addEventListener("click", () => {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue < 10) {
          quantityInput.value = currentValue + 1;
        }
      });

      quantityInput.addEventListener("change", () => {
        let value = parseInt(quantityInput.value);
        if (isNaN(value) || value < 1) value = 1;
        if (value > 10) value = 10;
        quantityInput.value = value;
      });
    }
  },

  /**
   * Setup reviews section
   */
  setupReviewsSection() {
    const reviewForm = document.getElementById("review-form");
    if (!reviewForm) return;

    // Star rating selection
    const starRating = reviewForm.querySelector(".star-rating");
    if (starRating) {
      const stars = starRating.querySelectorAll(".star");
      const ratingInput = reviewForm.querySelector('[name="rating"]');

      stars.forEach((star, index) => {
        star.addEventListener("click", () => {
          const rating = index + 1;
          ratingInput.value = rating;

          stars.forEach((s, i) => {
            s.classList.toggle("active", i < rating);
          });
        });
      });
    }

    // Review form submission
    reviewForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      Auth.requireAuth(async () => {
        const formData = new FormData(reviewForm);
        const reviewData = {
          rating: parseInt(formData.get("rating")),
          comment: formData.get("comment"),
        };

        const productId = reviewForm.dataset.productId;

        try {
          await ProductsAPI.addReview(productId, reviewData);
          Toast.success("Review submitted successfully!");
          reviewForm.reset();
          // Reload reviews section
          window.location.reload();
        } catch (error) {
          handleAPIError(error);
        }
      }, "Please log in to leave a review");
    });
  },

  /**
   * Load related products
   */
  async loadRelatedProducts() {
    const relatedContainer = document.getElementById("related-products");
    if (!relatedContainer) return;

    try {
      // Get current product category or use random products
      const category = relatedContainer.dataset.category;
      const response = category
        ? await ProductsAPI.getProductsByCategory(category, { limit: 4 })
        : await ProductsAPI.getFeaturedProducts(4);

      const products = response.products || [];

      if (products.length > 0) {
        relatedContainer.innerHTML = products
          .map((product) => Products.createProductCard(product))
          .join("");
      }
    } catch (error) {
      console.error("Failed to load related products:", error);
    }
  },

  /**
   * Setup checkout form
   */
  setupCheckoutForm() {
    const checkoutForm = document.getElementById("checkout-form");
    if (!checkoutForm) return;

    // Load cart summary
    this.updateCheckoutSummary();

    // Form validation and submission
    const validationConfig = {
      firstName: { required: true },
      lastName: { required: true },
      email: { required: true, email: true },
      phone: { required: true, phone: true },
      address: { required: true },
      city: { required: true },
      state: { required: true },
      zipCode: { required: true },
      paymentMethod: { required: true },
    };

    checkoutForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const validation = FormValidator.validateForm(
        checkoutForm,
        validationConfig
      );
      if (!validation.isValid) {
        Toast.error("Please fill in all required fields correctly");
        return;
      }

      const formData = new FormData(checkoutForm);
      const orderData = {
        shippingAddress: {
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          street: formData.get("address"),
          city: formData.get("city"),
          state: formData.get("state"),
          zipCode: formData.get("zipCode"),
        },
        paymentMethod: formData.get("paymentMethod"),
        notes: {
          customer: formData.get("notes"),
        },
      };

      try {
        Utils.toggleLoading(true);

        const response = await OrdersAPI.createOrder(orderData);

        Toast.success("Order placed successfully!");

        // Clear cart
        if (window.Cart) {
          Cart.clearCart();
        }

        // Redirect to order confirmation
        setTimeout(() => {
          window.location.href = `/orders/${response.order._id}`;
        }, 1000);
      } catch (error) {
        handleAPIError(error);
      } finally {
        Utils.toggleLoading(false);
      }
    });
  },

  /**
   * Update checkout summary
   */
  updateCheckoutSummary() {
    if (!window.Cart) return;

    const summaryContainer = document.getElementById("checkout-summary");
    if (!summaryContainer) return;

    const cartData = Cart.getCartData();

    summaryContainer.innerHTML = `
            <h3>Order Summary</h3>
            <div class="summary-items">
                ${cartData.items
                  .map(
                    (item) => `
                    <div class="summary-item">
                        <span>${Utils.sanitizeHtml(item.product.name)} × ${
                      item.quantity
                    }</span>
                        <span>${Utils.formatCurrency(
                          item.product.price * item.quantity
                        )}</span>
                    </div>
                `
                  )
                  .join("")}
            </div>
            <div class="summary-totals">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>${Utils.formatCurrency(cartData.subtotal)}</span>
                </div>
                <div class="summary-row">
                    <span>Tax:</span>
                    <span>${Utils.formatCurrency(cartData.tax)}</span>
                </div>
                <div class="summary-row">
                    <span>Shipping:</span>
                    <span>${
                      cartData.shipping === 0
                        ? "Free"
                        : Utils.formatCurrency(cartData.shipping)
                    }</span>
                </div>
                <div class="summary-row total">
                    <span>Total:</span>
                    <span>${Utils.formatCurrency(cartData.total)}</span>
                </div>
            </div>
        `;
  },

  /**
   * Setup profile tabs
   */
  setupProfileTabs() {
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabPanes = document.querySelectorAll(".tab-pane");

    if (tabButtons.length === 0 || tabPanes.length === 0) return;

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetTab = button.dataset.tab;

        // Update active tab button
        tabButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        // Update active tab pane
        tabPanes.forEach((pane) => {
          pane.classList.remove("active");
          if (pane.id === targetTab) {
            pane.classList.add("active");
          }
        });
      });
    });
  },
};

// ===================================
// PERFORMANCE MONITORING
// ===================================

/**
 * Simple performance monitoring
 */
const Performance = {
  startTime: performance.now(),

  /**
   * Log performance metrics
   */
  logMetrics() {
    const loadTime = performance.now() - this.startTime;
    console.log(`📊 App initialization took ${loadTime.toFixed(2)}ms`);

    // Log navigation timing if available
    if (performance.getEntriesByType) {
      const navigation = performance.getEntriesByType("navigation")[0];
      if (navigation) {
        console.log(
          `📊 Page load took ${
            navigation.loadEventEnd - navigation.loadEventStart
          }ms`
        );
      }
    }
  },
};

// ===================================
// APPLICATION STARTUP
// ===================================

// Initialize app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    App.init().then(() => {
      Performance.logMetrics();
    });
  });
} else {
  // DOM is already ready
  App.init().then(() => {
    Performance.logMetrics();
  });
}

// Export App object for global access
window.App = App;

// Add global error handler
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
  Toast.error(
    "An unexpected error occurred. Please refresh the page if problems persist."
  );
});

// Add unhandled promise rejection handler
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  Toast.error("An unexpected error occurred. Please try again.");
});
