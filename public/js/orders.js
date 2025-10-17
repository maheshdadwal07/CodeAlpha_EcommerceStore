// Load Orders
async function loadOrders() {
  if (!isAuthenticated()) {
    window.location.href = "/login.html";
    return;
  }

  const ordersContent = document.getElementById("ordersContent");
  const noOrders = document.getElementById("noOrders");

  try {
    const orders = await apiRequest("/orders/my-orders");

    if (orders.length === 0) {
      ordersContent.style.display = "none";
      noOrders.style.display = "block";
      return;
    }

    noOrders.style.display = "none";
    ordersContent.style.display = "block";

    ordersContent.innerHTML = orders
      .map(
        (order) => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <h3>Order #${order._id.slice(-8).toUpperCase()}</h3>
                        <p style="color: var(--text-light); font-size: 0.9rem;">
                            Placed on ${formatDate(order.createdAt)}
                        </p>
                    </div>
                    <div>
                        <span class="order-status status-${order.orderStatus.toLowerCase()}">
                            ${order.orderStatus}
                        </span>
                    </div>
                </div>

                <div class="order-items">
                    ${order.items
                      .map(
                        (item) => `
                        <div class="order-item">
                            <img src="${
                              item.product?.image || "/images/placeholder.jpg"
                            }" 
                                 alt="${item.name}" 
                                 style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                            <div style="flex: 1;">
                                <h4>${item.name}</h4>
                                <p style="color: var(--text-light);">Quantity: ${
                                  item.quantity
                                }</p>
                                <p style="color: var(--primary-color); font-weight: 600;">
                                    ${formatPrice(item.price)} each
                                </p>
                            </div>
                            <div style="font-weight: 700; font-size: 1.1rem;">
                                ${formatPrice(item.price * item.quantity)}
                            </div>
                        </div>
                    `
                      )
                      .join("")}
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; 
                            padding-top: 1rem; margin-top: 1rem; border-top: 2px solid var(--border-color);">
                    <div>
                        <strong>Payment Method:</strong> ${order.paymentMethod}
                        <br>
                        <strong>Delivery Address:</strong> 
                        ${order.shippingAddress.street}, ${
          order.shippingAddress.city
        }, 
                        ${order.shippingAddress.state} - ${
          order.shippingAddress.zipCode
        }
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.9rem; color: var(--text-light);">Total Amount</div>
                        <div style="font-size: 1.75rem; font-weight: 700; color: var(--primary-color);">
                            ${formatPrice(order.totalAmount)}
                        </div>
                        ${
                          order.orderStatus === "Pending" ||
                          order.orderStatus === "Processing"
                            ? `
                            <button class="btn-remove" style="margin-top: 1rem;" 
                                    onclick="cancelOrder('${order._id}')">
                                Cancel Order
                            </button>
                        `
                            : ""
                        }
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error loading orders:", error);
    ordersContent.innerHTML = '<p class="loading">Error loading orders</p>';
  }
}

// Cancel Order
async function cancelOrder(orderId) {
  if (!confirm("Are you sure you want to cancel this order?")) return;

  try {
    await apiRequest(`/orders/${orderId}/cancel`, {
      method: "PUT",
    });

    showNotification("Order cancelled successfully", "success");
    loadOrders();
  } catch (error) {
    showNotification(error.message, "error");
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadOrders();
});
