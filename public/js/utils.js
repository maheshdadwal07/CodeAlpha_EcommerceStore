// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Utility object containing helper functions
 */
const Utils = {
  /**
   * Debounce function to limit how often a function can fire
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @param {boolean} immediate - Whether to execute immediately
   * @returns {Function} Debounced function
   */
  debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  },

  /**
   * Throttle function to limit how often a function can fire
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  /**
   * Format currency
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (default: INR)
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount, currency = "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  /**
   * Format date
   * @param {Date|string} date - Date to format
   * @param {Object} options - Intl.DateTimeFormat options
   * @returns {string} Formatted date string
   */
  formatDate(date, options = {}) {
    const defaultOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Intl.DateTimeFormat("en-IN", {
      ...defaultOptions,
      ...options,
    }).format(new Date(date));
  },

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Whether email is valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone number (Indian format)
   * @param {string} phone - Phone number to validate
   * @returns {boolean} Whether phone is valid
   */
  isValidPhone(phone) {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ""));
  },

  /**
   * Generate a random ID
   * @param {number} length - Length of ID (default: 8)
   * @returns {string} Random ID
   */
  generateId(length = 8) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Sanitize HTML to prevent XSS
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string
   */
  sanitizeHtml(str) {
    const temp = document.createElement("div");
    temp.textContent = str;
    return temp.innerHTML;
  },

  /**
   * Get query parameter from URL
   * @param {string} param - Parameter name
   * @returns {string|null} Parameter value
   */
  getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  },

  /**
   * Set query parameter in URL
   * @param {string} param - Parameter name
   * @param {string} value - Parameter value
   */
  setQueryParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({ path: url.href }, "", url.href);
  },

  /**
   * Remove query parameter from URL
   * @param {string} param - Parameter name
   */
  removeQueryParam(param) {
    const url = new URL(window.location);
    url.searchParams.delete(param);
    window.history.pushState({ path: url.href }, "", url.href);
  },

  /**
   * Show/hide loading spinner
   * @param {boolean} show - Whether to show spinner
   */
  toggleLoading(show) {
    const spinner = document.getElementById("loading-spinner");
    if (spinner) {
      spinner.style.display = show ? "flex" : "none";
    }
  },

  /**
   * Scroll to element smoothly
   * @param {string|Element} element - Element or selector
   * @param {number} offset - Offset from top (default: 0)
   */
  scrollToElement(element, offset = 0) {
    const el =
      typeof element === "string" ? document.querySelector(element) : element;
    if (el) {
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  },

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        return true;
      } catch (err) {
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    }
  },

  /**
   * Create element with attributes and content
   * @param {string} tag - HTML tag name
   * @param {Object} attributes - Element attributes
   * @param {string|Element|Array} content - Element content
   * @returns {Element} Created element
   */
  createElement(tag, attributes = {}, content = "") {
    const element = document.createElement(tag);

    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === "className") {
        element.className = value;
      } else if (key === "dataset") {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else {
        element.setAttribute(key, value);
      }
    });

    // Set content
    if (Array.isArray(content)) {
      content.forEach((child) => {
        if (typeof child === "string") {
          element.appendChild(document.createTextNode(child));
        } else {
          element.appendChild(child);
        }
      });
    } else if (typeof content === "string") {
      element.textContent = content;
    } else if (content instanceof Element) {
      element.appendChild(content);
    }

    return element;
  },

  /**
   * Check if element is in viewport
   * @param {Element} element - Element to check
   * @param {number} threshold - Threshold percentage (0-1)
   * @returns {boolean} Whether element is in viewport
   */
  isInViewport(element, threshold = 0) {
    const rect = element.getBoundingClientRect();
    const height = window.innerHeight || document.documentElement.clientHeight;
    const width = window.innerWidth || document.documentElement.clientWidth;

    return (
      rect.top >= -rect.height * threshold &&
      rect.left >= -rect.width * threshold &&
      rect.bottom <= height + rect.height * threshold &&
      rect.right <= width + rect.width * threshold
    );
  },

  /**
   * Local storage wrapper with JSON support and error handling
   */
  storage: {
    /**
     * Set item in localStorage
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @returns {boolean} Success status
     */
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error("Failed to save to localStorage:", error);
        return false;
      }
    },

    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if key doesn't exist
     * @returns {any} Stored value or default
     */
    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.error("Failed to read from localStorage:", error);
        return defaultValue;
      }
    },

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error("Failed to remove from localStorage:", error);
        return false;
      }
    },

    /**
     * Clear all localStorage
     * @returns {boolean} Success status
     */
    clear() {
      try {
        localStorage.clear();
        return true;
      } catch (error) {
        console.error("Failed to clear localStorage:", error);
        return false;
      }
    },
  },

  /**
   * Session storage wrapper with JSON support and error handling
   */
  session: {
    /**
     * Set item in sessionStorage
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @returns {boolean} Success status
     */
    set(key, value) {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error("Failed to save to sessionStorage:", error);
        return false;
      }
    },

    /**
     * Get item from sessionStorage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if key doesn't exist
     * @returns {any} Stored value or default
     */
    get(key, defaultValue = null) {
      try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.error("Failed to read from sessionStorage:", error);
        return defaultValue;
      }
    },

    /**
     * Remove item from sessionStorage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    remove(key) {
      try {
        sessionStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error("Failed to remove from sessionStorage:", error);
        return false;
      }
    },

    /**
     * Clear all sessionStorage
     * @returns {boolean} Success status
     */
    clear() {
      try {
        sessionStorage.clear();
        return true;
      } catch (error) {
        console.error("Failed to clear sessionStorage:", error);
        return false;
      }
    },
  },
};

// ===================================
// TOAST NOTIFICATION SYSTEM
// ===================================

/**
 * Toast notification system
 */
const Toast = {
  container: null,

  /**
   * Initialize toast container
   */
  init() {
    this.container = document.getElementById("toast-container");
    if (!this.container) {
      this.container = Utils.createElement("div", {
        id: "toast-container",
        className: "toast-container",
      });
      document.body.appendChild(this.container);
    }
  },

  /**
   * Show toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type (success, error, warning, info)
   * @param {number} duration - Duration in milliseconds (default: 5000)
   */
  show(message, type = "info", duration = 5000) {
    if (!this.container) this.init();

    const toastId = Utils.generateId();
    const icons = {
      success: "fas fa-check-circle",
      error: "fas fa-exclamation-circle",
      warning: "fas fa-exclamation-triangle",
      info: "fas fa-info-circle",
    };

    const toast = Utils.createElement("div", {
      className: `toast ${type}`,
      id: toastId,
    });

    const icon = Utils.createElement("i", {
      className: `toast-icon ${icons[type] || icons.info}`,
    });

    const content = Utils.createElement(
      "div",
      {
        className: "toast-content",
      },
      message
    );

    const closeBtn = Utils.createElement(
      "button",
      {
        className: "toast-close",
        type: "button",
      },
      "×"
    );

    closeBtn.addEventListener("click", () => this.hide(toastId));

    toast.appendChild(icon);
    toast.appendChild(content);
    toast.appendChild(closeBtn);

    this.container.appendChild(toast);

    // Auto hide after duration
    if (duration > 0) {
      setTimeout(() => this.hide(toastId), duration);
    }

    return toastId;
  },

  /**
   * Hide toast notification
   * @param {string} toastId - Toast ID
   */
  hide(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
      toast.style.animation = "slideOutRight 0.3s ease-out forwards";
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
  },

  /**
   * Show success toast
   * @param {string} message - Success message
   * @param {number} duration - Duration in milliseconds
   */
  success(message, duration = 5000) {
    return this.show(message, "success", duration);
  },

  /**
   * Show error toast
   * @param {string} message - Error message
   * @param {number} duration - Duration in milliseconds
   */
  error(message, duration = 7000) {
    return this.show(message, "error", duration);
  },

  /**
   * Show warning toast
   * @param {string} message - Warning message
   * @param {number} duration - Duration in milliseconds
   */
  warning(message, duration = 6000) {
    return this.show(message, "warning", duration);
  },

  /**
   * Show info toast
   * @param {string} message - Info message
   * @param {number} duration - Duration in milliseconds
   */
  info(message, duration = 5000) {
    return this.show(message, "info", duration);
  },

  /**
   * Clear all toasts
   */
  clear() {
    if (this.container) {
      this.container.innerHTML = "";
    }
  },
};

// ===================================
// MODAL SYSTEM
// ===================================

/**
 * Modal system
 */
const Modal = {
  overlay: null,
  content: null,
  currentModal: null,

  /**
   * Initialize modal system
   */
  init() {
    this.overlay = document.getElementById("modal-overlay");
    this.content = document.getElementById("modal-content");

    if (!this.overlay || !this.content) {
      console.error("Modal elements not found");
      return;
    }

    // Close modal when clicking overlay
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // Close modal with Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.currentModal) {
        this.close();
      }
    });
  },

  /**
   * Show modal
   * @param {string|Element} content - Modal content
   * @param {Object} options - Modal options
   */
  show(content, options = {}) {
    if (!this.overlay) this.init();

    const { closable = true, className = "", onClose = null } = options;

    // Set content
    if (typeof content === "string") {
      this.content.innerHTML = content;
    } else if (content instanceof Element) {
      this.content.innerHTML = "";
      this.content.appendChild(content);
    }

    // Add custom class
    if (className) {
      this.content.className = `modal-content ${className}`;
    }

    // Show modal
    this.overlay.classList.add("active");
    this.currentModal = {
      closable,
      onClose,
    };

    // Prevent body scroll
    document.body.style.overflow = "hidden";
  },

  /**
   * Close modal
   */
  close() {
    if (!this.overlay || !this.currentModal) return;

    if (!this.currentModal.closable) return;

    this.overlay.classList.remove("active");

    // Call onClose callback
    if (this.currentModal.onClose) {
      this.currentModal.onClose();
    }

    this.currentModal = null;

    // Restore body scroll
    document.body.style.overflow = "";

    // Clear content after animation
    setTimeout(() => {
      if (this.content) {
        this.content.innerHTML = "";
        this.content.className = "modal-content";
      }
    }, 300);
  },
};

// ===================================
// FORM VALIDATION
// ===================================

/**
 * Form validation system
 */
const FormValidator = {
  /**
   * Validation rules
   */
  rules: {
    required: (value) => value.trim() !== "",
    email: (value) => Utils.isValidEmail(value),
    phone: (value) => Utils.isValidPhone(value),
    minLength: (value, length) => value.length >= length,
    maxLength: (value, length) => value.length <= length,
    pattern: (value, pattern) => new RegExp(pattern).test(value),
    match: (value, matchValue) => value === matchValue,
  },

  /**
   * Error messages
   */
  messages: {
    required: "This field is required",
    email: "Please enter a valid email address",
    phone: "Please enter a valid phone number",
    minLength: "Must be at least {length} characters",
    maxLength: "Must be no more than {length} characters",
    pattern: "Invalid format",
    match: "Fields do not match",
  },

  /**
   * Validate field
   * @param {Element} field - Form field element
   * @param {Object} validations - Validation rules
   * @returns {Object} Validation result
   */
  validateField(field, validations) {
    const value = field.value;
    const errors = [];

    for (const [rule, param] of Object.entries(validations)) {
      if (this.rules[rule]) {
        const isValid =
          typeof param === "boolean"
            ? param && this.rules[rule](value)
            : this.rules[rule](value, param);

        if (!isValid) {
          let message = this.messages[rule] || "Invalid value";
          if (typeof param !== "boolean") {
            message = message.replace("{length}", param);
          }
          errors.push(message);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  },

  /**
   * Show field error
   * @param {Element} field - Form field element
   * @param {Array} errors - Error messages
   */
  showFieldError(field, errors) {
    this.clearFieldError(field);

    field.classList.add("error");

    const errorDiv = Utils.createElement(
      "div",
      {
        className: "field-error",
        "data-field": field.name || field.id,
      },
      errors[0]
    ); // Show first error

    field.parentNode.appendChild(errorDiv);
  },

  /**
   * Clear field error
   * @param {Element} field - Form field element
   */
  clearFieldError(field) {
    field.classList.remove("error");

    const existingError = field.parentNode.querySelector(".field-error");
    if (existingError) {
      existingError.remove();
    }
  },

  /**
   * Validate form
   * @param {Element} form - Form element
   * @param {Object} validationConfig - Validation configuration
   * @returns {Object} Validation result
   */
  validateForm(form, validationConfig) {
    let isFormValid = true;
    const errors = {};

    for (const [fieldName, validations] of Object.entries(validationConfig)) {
      const field = form.querySelector(`[name="${fieldName}"]`);
      if (field) {
        const result = this.validateField(field, validations);

        if (!result.isValid) {
          isFormValid = false;
          errors[fieldName] = result.errors;
          this.showFieldError(field, result.errors);
        } else {
          this.clearFieldError(field);
        }
      }
    }

    return {
      isValid: isFormValid,
      errors: errors,
    };
  },
};

// ===================================
// INITIALIZE UTILITIES
// ===================================

// Initialize systems when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  Toast.init();
  Modal.init();
});

// Export utils for use in other modules
window.Utils = Utils;
window.Toast = Toast;
window.Modal = Modal;
window.FormValidator = FormValidator;
