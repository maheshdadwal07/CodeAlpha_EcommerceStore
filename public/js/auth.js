// ===================================
// AUTHENTICATION MANAGEMENT
// ===================================

/**
 * Authentication manager
 */
const Auth = {
  currentUser: null,
  isAuthenticated: false,

  /**
   * Initialize authentication
   */
  async init() {
    try {
      // Check if user is logged in
      const token = API.getAuthToken();
      if (token) {
        await this.loadCurrentUser();
      }

      this.updateUI();
      this.bindEvents();
    } catch (error) {
      console.error("Auth initialization failed:", error);
      this.logout();
    }
  },

  /**
   * Load current user profile
   */
  async loadCurrentUser() {
    try {
      const userData = await AuthAPI.getProfile();
      this.currentUser = userData.user;
      this.isAuthenticated = true;

      // Update cart count
      if (window.Cart) {
        Cart.updateCartCount();
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} Login result
   */
  async login(credentials) {
    try {
      Utils.toggleLoading(true);

      const response = await AuthAPI.login(credentials);

      this.currentUser = response.user;
      this.isAuthenticated = true;

      this.updateUI();
      Toast.success("Login successful!");

      // Redirect to intended page or home
      const redirectTo = Utils.getQueryParam("redirect") || "/";
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 1000);

      return response;
    } catch (error) {
      handleAPIError(error);
      throw error;
    } finally {
      Utils.toggleLoading(false);
    }
  },

  /**
   * Register new user
   * @param {Object} userData - Registration data
   * @returns {Promise<Object>} Registration result
   */
  async register(userData) {
    try {
      Utils.toggleLoading(true);

      const response = await AuthAPI.register(userData);

      this.currentUser = response.user;
      this.isAuthenticated = true;

      this.updateUI();
      Toast.success("Registration successful! Welcome to CodeAlpha Store!");

      // Redirect to home
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);

      return response;
    } catch (error) {
      handleAPIError(error);
      throw error;
    } finally {
      Utils.toggleLoading(false);
    }
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      await AuthAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      this.currentUser = null;
      this.isAuthenticated = false;

      this.updateUI();

      // Clear cart
      if (window.Cart) {
        Cart.clearLocalCart();
      }

      Toast.info("You have been logged out");

      // Redirect to home if on protected page
      if (this.isProtectedPage()) {
        window.location.href = "/";
      }
    }
  },

  /**
   * Update profile
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Update result
   */
  async updateProfile(userData) {
    try {
      Utils.toggleLoading(true);

      const response = await AuthAPI.updateProfile(userData);

      this.currentUser = response.user;
      this.updateUI();

      Toast.success("Profile updated successfully!");

      return response;
    } catch (error) {
      handleAPIError(error);
      throw error;
    } finally {
      Utils.toggleLoading(false);
    }
  },

  /**
   * Change password
   * @param {Object} passwordData - Password data
   * @returns {Promise<Object>} Change result
   */
  async changePassword(passwordData) {
    try {
      Utils.toggleLoading(true);

      const response = await AuthAPI.changePassword(passwordData);

      Toast.success("Password changed successfully!");

      return response;
    } catch (error) {
      handleAPIError(error);
      throw error;
    } finally {
      Utils.toggleLoading(false);
    }
  },

  /**
   * Update UI based on authentication state
   */
  updateUI() {
    const userNameEl = document.getElementById("user-name");
    const authLinksEl = document.getElementById("auth-links");
    const userLinksEl = document.getElementById("user-links");

    if (this.isAuthenticated && this.currentUser) {
      // Update user name
      if (userNameEl) {
        userNameEl.textContent = this.currentUser.firstName || "Account";
      }

      // Show/hide menu items
      if (authLinksEl) authLinksEl.style.display = "none";
      if (userLinksEl) userLinksEl.style.display = "block";
    } else {
      // Reset to default state
      if (userNameEl) {
        userNameEl.textContent = "Account";
      }

      // Show/hide menu items
      if (authLinksEl) authLinksEl.style.display = "block";
      if (userLinksEl) userLinksEl.style.display = "none";
    }
  },

  /**
   * Bind authentication-related events
   */
  bindEvents() {
    // Logout button
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.logout();
      });
    }

    // User menu toggle
    const userMenuToggle = document.getElementById("user-menu-toggle");
    const userMenu = userMenuToggle?.closest(".user-menu");

    if (userMenuToggle && userMenu) {
      userMenuToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        userMenu.classList.toggle("open");
      });

      // Close menu when clicking outside
      document.addEventListener("click", (e) => {
        if (!userMenu.contains(e.target)) {
          userMenu.classList.remove("open");
        }
      });
    }
  },

  /**
   * Check if current page requires authentication
   * @returns {boolean} Whether page is protected
   */
  isProtectedPage() {
    const protectedPaths = ["/profile", "/orders", "/checkout"];
    return protectedPaths.some((path) =>
      window.location.pathname.startsWith(path)
    );
  },

  /**
   * Require authentication for current action
   * @param {Function} callback - Callback to execute if authenticated
   * @param {string} message - Message to show if not authenticated
   */
  requireAuth(callback, message = "Please log in to continue") {
    if (this.isAuthenticated) {
      callback();
    } else {
      Toast.warning(message);
      // Redirect to login with current page as redirect target
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = `/login?redirect=${encodeURIComponent(
        currentPath
      )}`;
    }
  },
};

// ===================================
// LOGIN FORM HANDLING
// ===================================

/**
 * Handle login form submission
 */
function handleLoginForm() {
  const loginForm = document.getElementById("login-form");
  if (!loginForm) return;

  const validationConfig = {
    email: {
      required: true,
      email: true,
    },
    password: {
      required: true,
      minLength: 6,
    },
  };

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate form
    const validation = FormValidator.validateForm(loginForm, validationConfig);
    if (!validation.isValid) {
      return;
    }

    // Get form data
    const formData = new FormData(loginForm);
    const credentials = {
      email: formData.get("email"),
      password: formData.get("password"),
      rememberMe: formData.get("rememberMe") === "on",
    };

    try {
      await Auth.login(credentials);
    } catch (error) {
      // Error already handled by Auth.login
    }
  });
}

// ===================================
// REGISTRATION FORM HANDLING
// ===================================

/**
 * Handle registration form submission
 */
function handleRegistrationForm() {
  const registerForm = document.getElementById("register-form");
  if (!registerForm) return;

  const validationConfig = {
    firstName: {
      required: true,
      minLength: 2,
      maxLength: 50,
    },
    lastName: {
      required: true,
      minLength: 2,
      maxLength: 50,
    },
    email: {
      required: true,
      email: true,
    },
    password: {
      required: true,
      minLength: 6,
    },
    confirmPassword: {
      required: true,
      match: registerForm.querySelector('[name="password"]')?.value,
    },
  };

  // Update confirm password validation when password changes
  const passwordField = registerForm.querySelector('[name="password"]');
  const confirmPasswordField = registerForm.querySelector(
    '[name="confirmPassword"]'
  );

  if (passwordField && confirmPasswordField) {
    passwordField.addEventListener("input", () => {
      validationConfig.confirmPassword.match = passwordField.value;
    });
  }

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Update validation config with current password
    if (passwordField) {
      validationConfig.confirmPassword.match = passwordField.value;
    }

    // Validate form
    const validation = FormValidator.validateForm(
      registerForm,
      validationConfig
    );
    if (!validation.isValid) {
      return;
    }

    // Get form data
    const formData = new FormData(registerForm);
    const userData = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      await Auth.register(userData);
    } catch (error) {
      // Error already handled by Auth.register
    }
  });
}

// ===================================
// INITIALIZATION
// ===================================

// Initialize authentication when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  Auth.init();
  handleLoginForm();
  handleRegistrationForm();
});

// Export Auth object
window.Auth = Auth;
