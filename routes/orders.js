const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const User = require("../models/User");

// Create order from cart
router.post("/create", auth, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    const cart = await Cart.findOne({ user: req.userId }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Check stock availability
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.product.name}`,
        });
      }
    }

    // Calculate total
    let totalAmount = 0;
    const orderItems = cart.items.map((item) => {
      const itemTotal = item.product.price * item.quantity;
      totalAmount += itemTotal;
      return {
        product: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
      };
    });

    // Create order
    const order = new Order({
      user: req.userId,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || "COD",
    });

    await order.save();

    // Update product stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity },
      });
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    await order.populate("items.product");

    res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get user's orders
router.get("/my-orders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get order by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.userId,
    }).populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Cancel order
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.orderStatus === "Shipped" || order.orderStatus === "Delivered") {
      return res.status(400).json({
        message: "Cannot cancel shipped or delivered orders",
      });
    }

    order.orderStatus = "Cancelled";
    await order.save();

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    res.json({ message: "Order cancelled successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
