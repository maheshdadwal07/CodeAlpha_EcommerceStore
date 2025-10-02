const express = require("express");
const Joi = require("joi");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const { auth, adminAuth, validate } = require("../middleware/auth");

const router = express.Router();

// Validation schemas
const createOrderSchema = Joi.object({
  shippingAddress: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string()
      .pattern(/^[+]?[1-9]?\d{10,14}$/)
      .required(),
    street: Joi.string().min(5).max(200).required(),
    city: Joi.string().min(2).max(100).required(),
    state: Joi.string().min(2).max(100).required(),
    zipCode: Joi.string().min(3).max(20).required(),
    country: Joi.string().default("United States"),
  }).required(),
  paymentMethod: Joi.string()
    .valid("credit_card", "paypal", "stripe")
    .required(),
  notes: Joi.object({
    customer: Joi.string().max(500).optional(),
  }).optional(),
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled"
    )
    .required(),
  notes: Joi.string().max(500).optional(),
});

const addTrackingSchema = Joi.object({
  trackingNumber: Joi.string().required(),
  carrier: Joi.string().required(),
  estimatedDelivery: Joi.date().min("now").optional(),
});

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Build filter
    const filter = { user: req.user._id };
    if (status) {
      filter["status.current"] = status;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get orders
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("items.product", "name images slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalOrders: total,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "name images slug price")
      .populate("user", "firstName lastName email")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if user owns the order or is admin
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this order",
      });
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    console.error("Get order error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error fetching order",
    });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post("/", auth, validate(createOrderSchema), async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, notes } = req.body;

    // Get user with cart
    const user = await User.findById(req.user._id).populate({
      path: "cart.product",
      select: "name price images slug inStock isActive",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Validate cart items availability
    const unavailableItems = [];
    const orderItems = [];

    for (const cartItem of user.cart) {
      const product = cartItem.product;

      if (!product || !product.isActive) {
        unavailableItems.push(
          `${product?.name || "Unknown product"} is no longer available`
        );
        continue;
      }

      if (product.inStock < cartItem.quantity) {
        unavailableItems.push(
          `${product.name} - only ${product.inStock} available, but ${cartItem.quantity} requested`
        );
        continue;
      }

      orderItems.push({
        product: product._id,
        quantity: cartItem.quantity,
        price: product.price,
        total: product.price * cartItem.quantity,
      });
    }

    if (unavailableItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some items are not available",
        unavailableItems,
      });
    }

    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1; // 10% tax
    const shipping = subtotal > 50 ? 0 : 10; // Free shipping over $50
    const total = subtotal + tax + shipping;

    // Create order
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totals: {
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        shipping: Math.round(shipping * 100) / 100,
        total: Math.round(total * 100) / 100,
      },
      shippingAddress,
      payment: {
        method: paymentMethod,
        status: "pending",
      },
      status: {
        current: "pending",
        history: [
          {
            status: "pending",
            timestamp: new Date(),
            note: "Order created",
          },
        ],
      },
      notes,
    });

    await order.save();

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { inStock: -item.quantity },
      });
    }

    // Clear user's cart
    user.cart = [];
    await user.save();

    // Populate order for response
    await order.populate([
      { path: "items.product", select: "name images slug" },
      { path: "user", select: "firstName lastName email" },
    ]);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: { order },
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating order",
    });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Admin only)
// @access  Private/Admin
router.put(
  "/:id/status",
  auth,
  adminAuth,
  validate(updateOrderStatusSchema),
  async (req, res) => {
    try {
      const { status, notes } = req.body;

      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Validate status transition
      const currentStatus = order.status.current;
      const validTransitions = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["processing", "cancelled"],
        processing: ["shipped", "cancelled"],
        shipped: ["delivered"],
        delivered: [],
        cancelled: [],
      };

      if (!validTransitions[currentStatus].includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot change status from ${currentStatus} to ${status}`,
        });
      }

      // Update status
      order.status.current = status;
      order.status.history.push({
        status,
        timestamp: new Date(),
        note: notes || `Status changed to ${status}`,
      });

      // Update specific status timestamps
      if (status === "confirmed") {
        order.status.confirmed = new Date();
      } else if (status === "shipped") {
        order.status.shipped = new Date();
      } else if (status === "delivered") {
        order.status.delivered = new Date();
      } else if (status === "cancelled") {
        order.status.cancelled = new Date();

        // Restore product stock if cancelled
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { inStock: item.quantity },
          });
        }
      }

      order.updatedAt = new Date();
      await order.save();

      res.json({
        success: true,
        message: `Order status updated to ${status}`,
        data: { order },
      });
    } catch (error) {
      console.error("Update order status error:", error);

      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error updating order status",
      });
    }
  }
);

// @route   PUT /api/orders/:id/tracking
// @desc    Add tracking information (Admin only)
// @access  Private/Admin
router.put(
  "/:id/tracking",
  auth,
  adminAuth,
  validate(addTrackingSchema),
  async (req, res) => {
    try {
      const { trackingNumber, carrier, estimatedDelivery } = req.body;

      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (order.status.current !== "shipped") {
        return res.status(400).json({
          success: false,
          message: "Can only add tracking to shipped orders",
        });
      }

      // Update tracking info
      order.tracking = {
        number: trackingNumber,
        carrier,
        estimatedDelivery,
        updatedAt: new Date(),
      };

      order.updatedAt = new Date();
      await order.save();

      res.json({
        success: true,
        message: "Tracking information added successfully",
        data: { order },
      });
    } catch (error) {
      console.error("Add tracking error:", error);

      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error adding tracking information",
      });
    }
  }
);

// @route   POST /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.post("/:id/cancel", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if user owns the order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this order",
      });
    }

    // Check if order can be cancelled
    if (!["pending", "confirmed"].includes(order.status.current)) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled at this stage",
      });
    }

    // Update status to cancelled
    order.status.current = "cancelled";
    order.status.cancelled = new Date();
    order.status.history.push({
      status: "cancelled",
      timestamp: new Date(),
      note: "Cancelled by customer",
    });

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { inStock: item.quantity },
      });
    }

    order.updatedAt = new Date();
    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: { order },
    });
  } catch (error) {
    console.error("Cancel order error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error cancelling order",
    });
  }
});

// @route   GET /api/orders/admin/all
// @desc    Get all orders (Admin only)
// @access  Private/Admin
router.get("/admin/all", auth, adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      dateFrom,
      dateTo,
      search,
    } = req.query;

    // Build filter
    const filter = {};

    if (status) {
      filter["status.current"] = status;
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Search in order ID or customer name/email
    if (search) {
      // For order ID search
      if (search.match(/^[0-9a-fA-F]{24}$/)) {
        filter._id = search;
      } else {
        // Search in user details - we'll need to use populate and match
        filter["$or"] = [
          { "shippingAddress.firstName": new RegExp(search, "i") },
          { "shippingAddress.lastName": new RegExp(search, "i") },
          { "shippingAddress.email": new RegExp(search, "i") },
        ];
      }
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get orders
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "firstName lastName email")
        .populate("items.product", "name images slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalOrders: total,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
    });
  }
});

// @route   GET /api/orders/admin/stats
// @desc    Get order statistics (Admin only)
// @access  Private/Admin
router.get("/admin/stats", auth, adminAuth, async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: "$status.current",
          count: { $sum: 1 },
          totalValue: { $sum: "$totals.total" },
        },
      },
    ]);

    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { "status.current": { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totals.total" } } },
    ]);

    // Recent orders
    const recentOrders = await Order.find()
      .populate("user", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      data: {
        stats,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        recentOrders,
      },
    });
  } catch (error) {
    console.error("Get order stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order statistics",
    });
  }
});

module.exports = router;
