const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
const { auth } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "wishlist",
        match: { isActive: true },
        select:
          "name price originalPrice images slug category averageRating inStock",
      })
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Filter out any null products (in case some were deleted)
    const wishlist = user.wishlist.filter((product) => product !== null);

    res.json({
      success: true,
      data: {
        wishlist,
        count: wishlist.length,
      },
    });
  } catch (error) {
    console.error("Get wishlist error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching wishlist",
    });
  }
});

// @route   POST /api/wishlist/add/:productId
// @desc    Add product to wishlist
// @access  Private
router.post("/add/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists and is active
    const product = await Product.findById(productId).select("name isActive");
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

    // Get user
    const user = await User.findById(req.user._id);

    // Check if product is already in wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: "Product is already in your wishlist",
      });
    }

    // Add to wishlist
    user.wishlist.push(productId);
    await user.save();

    res.json({
      success: true,
      message: "Product added to wishlist successfully",
      data: {
        wishlistCount: user.wishlist.length,
      },
    });
  } catch (error) {
    console.error("Add to wishlist error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error adding product to wishlist",
    });
  }
});

// @route   DELETE /api/wishlist/remove/:productId
// @desc    Remove product from wishlist
// @access  Private
router.delete("/remove/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;

    // Get user
    const user = await User.findById(req.user._id);

    // Check if product is in wishlist
    const productIndex = user.wishlist.indexOf(productId);
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in wishlist",
      });
    }

    // Remove from wishlist
    user.wishlist.splice(productIndex, 1);
    await user.save();

    res.json({
      success: true,
      message: "Product removed from wishlist successfully",
      data: {
        wishlistCount: user.wishlist.length,
      },
    });
  } catch (error) {
    console.error("Remove from wishlist error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error removing product from wishlist",
    });
  }
});

// @route   POST /api/wishlist/toggle/:productId
// @desc    Toggle product in wishlist (add if not present, remove if present)
// @access  Private
router.post("/toggle/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists and is active
    const product = await Product.findById(productId).select("name isActive");
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

    // Get user
    const user = await User.findById(req.user._id);

    // Check if product is in wishlist
    const productIndex = user.wishlist.indexOf(productId);
    let action;

    if (productIndex === -1) {
      // Add to wishlist
      user.wishlist.push(productId);
      action = "added";
    } else {
      // Remove from wishlist
      user.wishlist.splice(productIndex, 1);
      action = "removed";
    }

    await user.save();

    res.json({
      success: true,
      message: `Product ${action} ${
        action === "added" ? "to" : "from"
      } wishlist successfully`,
      data: {
        action,
        inWishlist: action === "added",
        wishlistCount: user.wishlist.length,
      },
    });
  } catch (error) {
    console.error("Toggle wishlist error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating wishlist",
    });
  }
});

// @route   DELETE /api/wishlist/clear
// @desc    Clear entire wishlist
// @access  Private
router.delete("/clear", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    user.wishlist = [];
    await user.save();

    res.json({
      success: true,
      message: "Wishlist cleared successfully",
      data: {
        wishlistCount: 0,
      },
    });
  } catch (error) {
    console.error("Clear wishlist error:", error);
    res.status(500).json({
      success: false,
      message: "Error clearing wishlist",
    });
  }
});

// @route   GET /api/wishlist/count
// @desc    Get wishlist items count
// @access  Private
router.get("/count", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "wishlist",
        match: { isActive: true },
        select: "_id",
      })
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Filter out any null products and count
    const activeWishlistItems = user.wishlist.filter(
      (product) => product !== null
    );

    res.json({
      success: true,
      data: {
        count: activeWishlistItems.length,
      },
    });
  } catch (error) {
    console.error("Get wishlist count error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching wishlist count",
    });
  }
});

// @route   POST /api/wishlist/move-to-cart/:productId
// @desc    Move product from wishlist to cart
// @access  Private
router.post("/move-to-cart/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity = 1 } = req.body;

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

    // Get user
    const user = await User.findById(req.user._id);

    // Check if product is in wishlist
    const productIndex = user.wishlist.indexOf(productId);
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in wishlist",
      });
    }

    // Check if item already exists in cart
    const existingCartItemIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingCartItemIndex > -1) {
      // Update quantity if item exists in cart
      const newQuantity = user.cart[existingCartItemIndex].quantity + quantity;

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

      user.cart[existingCartItemIndex].quantity = newQuantity;
      user.cart[existingCartItemIndex].updatedAt = new Date();
    } else {
      // Add new item to cart
      user.cart.push({
        product: productId,
        quantity,
        addedAt: new Date(),
      });
    }

    // Remove from wishlist
    user.wishlist.splice(productIndex, 1);

    await user.save();

    res.json({
      success: true,
      message: "Product moved from wishlist to cart successfully",
      data: {
        wishlistCount: user.wishlist.length,
        cartCount: user.cart.reduce((total, item) => total + item.quantity, 0),
      },
    });
  } catch (error) {
    console.error("Move to cart error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error moving product to cart",
    });
  }
});

module.exports = router;
