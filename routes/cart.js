const express = require("express");
const Joi = require("joi");
const User = require("../models/User");
const Product = require("../models/Product");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Validation schemas
const addToCartSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).max(10).default(1),
  options: Joi.object().optional(),
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(0).max(10).required(),
});

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "cart.product",
        select: "name price images slug inStock isActive category brand",
      })
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Filter out inactive products and calculate totals
    const activeCartItems = user.cart.filter(
      (item) =>
        item.product && item.product.isActive && item.product.inStock > 0
    );

    // Calculate cart totals
    const subtotal = activeCartItems.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);

    const tax = subtotal * 0.1; // 10% tax
    const shipping = subtotal > 50 ? 0 : 10; // Free shipping over $50
    const total = subtotal + tax + shipping;

    // Count total items
    const totalItems = activeCartItems.reduce((total, item) => {
      return total + item.quantity;
    }, 0);

    res.json({
      success: true,
      data: {
        cart: {
          items: activeCartItems,
          totals: {
            subtotal: Math.round(subtotal * 100) / 100,
            tax: Math.round(tax * 100) / 100,
            shipping: Math.round(shipping * 100) / 100,
            total: Math.round(total * 100) / 100,
          },
          totalItems,
        },
      },
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching cart",
    });
  }
});

// @route   POST /api/cart/add
// @desc    Add item to cart
// @access  Private
router.post("/add", auth, async (req, res) => {
  try {
    const { error } = addToCartSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        })),
      });
    }

    const { productId, quantity = 1, options } = req.body;

    // Check if product exists and is available
    const product = await Product.findById(productId).select(
      "name price inStock isActive"
    );
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message: "Product is not available",
      });
    }

    if (product.inStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.inStock} items available in stock`,
      });
    }

    // Get user and update cart
    const user = await User.findById(req.user._id);

    // Check if item already exists in cart
    const existingItemIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      const newQuantity = user.cart[existingItemIndex].quantity + quantity;

      if (newQuantity > product.inStock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more items. Only ${product.inStock} available in stock`,
        });
      }

      if (newQuantity > 10) {
        return res.status(400).json({
          success: false,
          message: "Maximum 10 items allowed per product",
        });
      }

      user.cart[existingItemIndex].quantity = newQuantity;
      user.cart[existingItemIndex].updatedAt = new Date();
    } else {
      // Add new item to cart
      user.cart.push({
        product: productId,
        quantity,
        options,
        addedAt: new Date(),
      });
    }

    await user.save();

    // Populate product details for response
    await user.populate({
      path: "cart.product",
      select: "name price images slug inStock",
    });

    // Calculate new cart totals
    const cartTotals = await calculateCartTotals(user.cart);

    res.json({
      success: true,
      message: "Item added to cart successfully",
      data: {
        cart: {
          items: user.cart,
          totals: cartTotals,
          totalItems: user.cart.reduce(
            (total, item) => total + item.quantity,
            0
          ),
        },
      },
    });
  } catch (error) {
    console.error("Add to cart error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error adding item to cart",
    });
  }
});

// @route   PUT /api/cart/item/:productId
// @desc    Update cart item quantity
// @access  Private
router.put("/item/:productId", auth, async (req, res) => {
  try {
    const { error } = updateCartItemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        })),
      });
    }

    const { productId } = req.params;
    const { quantity } = req.body;

    // Get user
    const user = await User.findById(req.user._id);

    // Find cart item
    const cartItemIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (cartItemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    if (quantity === 0) {
      // Remove item from cart
      user.cart.splice(cartItemIndex, 1);
    } else {
      // Check product availability
      const product = await Product.findById(productId).select(
        "inStock isActive"
      );
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: "Product is not available",
        });
      }

      if (product.inStock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.inStock} items available in stock`,
        });
      }

      // Update quantity
      user.cart[cartItemIndex].quantity = quantity;
      user.cart[cartItemIndex].updatedAt = new Date();
    }

    await user.save();

    // Populate product details for response
    await user.populate({
      path: "cart.product",
      select: "name price images slug inStock",
    });

    // Calculate new cart totals
    const cartTotals = await calculateCartTotals(user.cart);

    res.json({
      success: true,
      message:
        quantity === 0 ? "Item removed from cart" : "Cart updated successfully",
      data: {
        cart: {
          items: user.cart,
          totals: cartTotals,
          totalItems: user.cart.reduce(
            (total, item) => total + item.quantity,
            0
          ),
        },
      },
    });
  } catch (error) {
    console.error("Update cart error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating cart",
    });
  }
});

// @route   DELETE /api/cart/item/:productId
// @desc    Remove item from cart
// @access  Private
router.delete("/item/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;

    // Get user
    const user = await User.findById(req.user._id);

    // Find and remove cart item
    const cartItemIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (cartItemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    user.cart.splice(cartItemIndex, 1);
    await user.save();

    // Populate product details for response
    await user.populate({
      path: "cart.product",
      select: "name price images slug inStock",
    });

    // Calculate new cart totals
    const cartTotals = await calculateCartTotals(user.cart);

    res.json({
      success: true,
      message: "Item removed from cart successfully",
      data: {
        cart: {
          items: user.cart,
          totals: cartTotals,
          totalItems: user.cart.reduce(
            (total, item) => total + item.quantity,
            0
          ),
        },
      },
    });
  } catch (error) {
    console.error("Remove from cart error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error removing item from cart",
    });
  }
});

// @route   DELETE /api/cart/clear
// @desc    Clear entire cart
// @access  Private
router.delete("/clear", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    user.cart = [];
    await user.save();

    res.json({
      success: true,
      message: "Cart cleared successfully",
      data: {
        cart: {
          items: [],
          totals: {
            subtotal: 0,
            tax: 0,
            shipping: 0,
            total: 0,
          },
          totalItems: 0,
        },
      },
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error clearing cart",
    });
  }
});

// @route   GET /api/cart/count
// @desc    Get cart items count
// @access  Private
router.get("/count", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "cart.product",
        select: "isActive inStock",
      })
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Count only active and in-stock items
    const activeCartItems = user.cart.filter(
      (item) =>
        item.product && item.product.isActive && item.product.inStock > 0
    );

    const totalItems = activeCartItems.reduce((total, item) => {
      return total + item.quantity;
    }, 0);

    res.json({
      success: true,
      data: { count: totalItems },
    });
  } catch (error) {
    console.error("Get cart count error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching cart count",
    });
  }
});

// Helper function to calculate cart totals
async function calculateCartTotals(cartItems) {
  const activeItems = cartItems.filter(
    (item) => item.product && item.product.isActive && item.product.inStock > 0
  );

  const subtotal = activeItems.reduce((total, item) => {
    return total + item.product.price * item.quantity;
  }, 0);

  const tax = subtotal * 0.1; // 10% tax
  const shipping = subtotal > 50 ? 0 : 10; // Free shipping over $50
  const total = subtotal + tax + shipping;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

module.exports = router;
