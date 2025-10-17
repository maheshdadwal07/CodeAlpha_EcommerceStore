// API Base URL
const API_URL = "http://localhost:5000/api";

// Helper Functions
function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

function setAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
}

function isAuthenticated() {
  return !!getToken();
}

// API Request Helper
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// Format Price
function formatPrice(price) {
  return `₹${price.toLocaleString("en-IN")}`;
}

// Format Date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Show Notification
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === "success" ? "#48bb78" : "#f56565"};
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add animation styles
if (!document.querySelector("#notification-styles")) {
  const style = document.createElement("style");
  style.id = "notification-styles";
  style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
  document.head.appendChild(style);
}

// Generate Star Rating
function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  let stars = "★".repeat(fullStars);
  if (hasHalf) stars += "☆";
  stars += "☆".repeat(5 - Math.ceil(rating));
  return stars;
}

// Update Cart Count
async function updateCartCount() {
  if (!isAuthenticated()) {
    const cartCount = document.getElementById("cartCount");
    if (cartCount) cartCount.textContent = "0";
    return;
  }

  try {
    const cart = await apiRequest("/cart");
    const count =
      cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const cartCount = document.getElementById("cartCount");
    if (cartCount) cartCount.textContent = count;
  } catch (error) {
    console.error("Error updating cart count:", error);
  }
}

// Update Navigation
function updateNavigation() {
  const loginLink = document.getElementById("loginLink");
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userDropdown = document.getElementById("userDropdown");

  if (isAuthenticated()) {
    const user = getUser();
    if (loginLink) loginLink.style.display = "none";
    if (userMenuBtn) {
      userMenuBtn.style.display = "block";
      userMenuBtn.textContent = `👤 ${user.name}`;
    }
    if (userDropdown) userDropdown.style.display = "block";
  } else {
    if (loginLink) loginLink.style.display = "block";
    if (userMenuBtn) userMenuBtn.style.display = "none";
  }
}

// User Menu Toggle
document.addEventListener("DOMContentLoaded", () => {
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userDropdown = document.getElementById("userDropdown");

  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("show");
    });

    document.addEventListener("click", () => {
      userDropdown.classList.remove("show");
    });
  }

  // Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }

  // Hamburger Menu
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");

  // Create overlay for mobile menu
  let menuOverlay = document.querySelector(".menu-overlay");
  if (!menuOverlay && hamburger && navLinks) {
    menuOverlay = document.createElement("div");
    menuOverlay.className = "menu-overlay";
    document.body.appendChild(menuOverlay);
  }

  if (hamburger && navLinks && menuOverlay) {
    const toggleMenu = (isOpen) => {
      hamburger.classList.toggle("active", isOpen);
      navLinks.classList.toggle("active", isOpen);
      menuOverlay.classList.toggle("active", isOpen);
      document.body.style.overflow = isOpen ? "hidden" : "";
    };

    hamburger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isActive = !hamburger.classList.contains("active");
      toggleMenu(isActive);
    });

    // Close menu when clicking on overlay
    menuOverlay.addEventListener("click", () => {
      toggleMenu(false);
    });

    // Close menu when clicking on a link
    const navLinkElements = navLinks.querySelectorAll(
      ".nav-link, .btn-primary"
    );
    navLinkElements.forEach((link) => {
      link.addEventListener("click", () => {
        toggleMenu(false);
      });
    });

    // Close menu on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && hamburger.classList.contains("active")) {
        toggleMenu(false);
      }
    });

    // Prevent closing when clicking inside nav-links
    navLinks.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  // Update UI
  updateNavigation();
  updateCartCount();
});
