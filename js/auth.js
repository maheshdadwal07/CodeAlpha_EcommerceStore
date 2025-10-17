// Handle Login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorDiv = document.getElementById("loginError");

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      setAuth(data.token, data.user);
      showNotification("Login successful!", "success");

      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.classList.add("show");
    }
  });
}

// Handle Registration
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const errorDiv = document.getElementById("registerError");

    errorDiv.classList.remove("show");

    if (password !== confirmPassword) {
      errorDiv.textContent = "Passwords do not match";
      errorDiv.classList.add("show");
      return;
    }

    if (password.length < 6) {
      errorDiv.textContent = "Password must be at least 6 characters";
      errorDiv.classList.add("show");
      return;
    }

    try {
      const data = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, phone }),
      });

      setAuth(data.token, data.user);
      showNotification("Registration successful!", "success");

      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.classList.add("show");
    }
  });
}

// Redirect if already logged in
document.addEventListener("DOMContentLoaded", () => {
  if (
    isAuthenticated() &&
    (window.location.pathname === "/login.html" ||
      window.location.pathname === "/register.html")
  ) {
    window.location.href = "/";
  }
});
