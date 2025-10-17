let cart = null;

// Load Order Summary
async function loadOrderSummary() {
  if (!isAuthenticated()) {
    window.location.href = "/login.html";
    return;
  }

  try {
    cart = await apiRequest("/cart");

    if (!cart.items || cart.items.length === 0) {
      showNotification("Your cart is empty", "error");
      setTimeout(() => (window.location.href = "/products.html"), 1500);
      return;
    }

    const orderItems = document.getElementById("orderItems");
    const subtotal = document.getElementById("subtotal");
    const total = document.getElementById("total");

    const totalAmount = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    orderItems.innerHTML = cart.items
      .map(
        (item) => `
            <div class="order-item">
                <img src="${item.product.image}" alt="${item.product.name}" 
                     style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;">
                <div style="flex: 1;">
                    <div style="font-weight: 600;">${item.product.name}</div>
                    <div style="color: var(--text-light); font-size: 0.9rem;">
                        Qty: ${item.quantity} × ${formatPrice(
          item.product.price
        )}
                    </div>
                </div>
                <div style="font-weight: 700;">
                    ${formatPrice(item.product.price * item.quantity)}
                </div>
            </div>
        `
      )
      .join("");

    subtotal.textContent = formatPrice(totalAmount);
    total.textContent = formatPrice(totalAmount);

    // Load user profile for pre-filling address
    try {
      const user = await apiRequest("/auth/profile");
      if (user.address) {
        document.getElementById("street").value = user.address.street || "";
        document.getElementById("city").value = user.address.city || "";
        document.getElementById("state").value = user.address.state || "";
        document.getElementById("zipCode").value = user.address.zipCode || "";
        document.getElementById("country").value =
          user.address.country || "India";
      }
    } catch (error) {
      console.log("Could not load user profile");
    }
  } catch (error) {
    console.error("Error loading order summary:", error);
    showNotification("Error loading order details", "error");
  }
}

// Handle Checkout Form
document.addEventListener("DOMContentLoaded", () => {
  loadOrderSummary();

  const checkoutForm = document.getElementById("checkoutForm");

  checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const shippingAddress = {
      street: document.getElementById("street").value,
      city: document.getElementById("city").value,
      state: document.getElementById("state").value,
      zipCode: document.getElementById("zipCode").value,
      country: document.getElementById("country").value,
    };

    const paymentMethod = document.querySelector(
      'input[name="payment"]:checked'
    ).value;

    try {
      const order = await apiRequest("/orders/create", {
        method: "POST",
        body: JSON.stringify({
          shippingAddress,
          paymentMethod,
        }),
      });

      showNotification("Order placed successfully! 🎉", "success");
      updateCartCount();

      setTimeout(() => {
        window.location.href = `/orders.html`;
      }, 2000);
    } catch (error) {
      showNotification(error.message, "error");
    }
  });
});
