const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Get user's cart
router.get("/", auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.userId }).populate(
      "items.product"
    );

    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
      await cart.save();
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Add item to cart
router.post("/add", auth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    let cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    cart.updatedAt = Date.now();
    await cart.save();
    await cart.populate("items.product");

    res.json({ message: "Item added to cart", cart });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update cart item quantity
router.put("/update/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not in cart" });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.updatedAt = Date.now();
    await cart.save();
    await cart.populate("items.product");

    res.json({ message: "Cart updated", cart });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Remove item from cart
router.delete("/remove/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    cart.updatedAt = Date.now();
    await cart.save();
    await cart.populate("items.product");

    res.json({ message: "Item removed from cart", cart });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Clear cart
router.delete("/clear", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    cart.updatedAt = Date.now();
    await cart.save();

    res.json({ message: "Cart cleared", cart });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
