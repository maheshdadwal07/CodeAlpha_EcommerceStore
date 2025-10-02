const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // Order Identification
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },

    // Customer Information
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required for order"],
    },

    // Order Items
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: {
          type: String,
          required: true, // Store product name for historical purposes
        },
        price: {
          type: Number,
          required: true, // Store price at time of purchase
          min: [0, "Price cannot be negative"],
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, "Quantity must be at least 1"],
        },
        image: {
          type: String, // Store primary image URL for historical purposes
        },
        sku: String, // Store SKU for tracking
      },
    ],

    // Pricing Breakdown
    subtotal: {
      type: Number,
      required: true,
      min: [0, "Subtotal cannot be negative"],
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, "Tax cannot be negative"],
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: [0, "Shipping cost cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },
    total: {
      type: Number,
      required: true,
      min: [0, "Total cannot be negative"],
    },

    // Shipping Information
    shippingAddress: {
      firstName: {
        type: String,
        required: true,
        trim: true,
      },
      lastName: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
      street: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      zipCode: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        trim: true,
        default: "India",
      },
    },

    // Billing Information (optional - can be same as shipping)
    billingAddress: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: "India",
      },
      sameAsShipping: {
        type: Boolean,
        default: true,
      },
    },

    // Order Status and Tracking
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "out-for-delivery",
        "delivered",
        "cancelled",
        "returned",
        "refunded",
      ],
      default: "pending",
    },

    // Payment Information
    paymentMethod: {
      type: String,
      enum: [
        "cash-on-delivery",
        "credit-card",
        "debit-card",
        "upi",
        "net-banking",
        "wallet",
      ],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    paymentId: String, // Payment gateway transaction ID

    // Shipping and Delivery
    shippingMethod: {
      type: String,
      enum: ["standard", "express", "overnight", "pickup"],
      default: "standard",
    },
    trackingNumber: String,
    estimatedDelivery: Date,
    actualDelivery: Date,

    // Order Timeline
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    // Additional Information
    notes: {
      customer: String, // Customer notes/instructions
      admin: String, // Internal admin notes
    },

    // Discounts and Coupons
    coupon: {
      code: String,
      discount: Number,
      type: {
        type: String,
        enum: ["percentage", "fixed"],
      },
    },

    // Refund Information
    refund: {
      amount: {
        type: Number,
        min: [0, "Refund amount cannot be negative"],
      },
      reason: String,
      status: {
        type: String,
        enum: ["requested", "approved", "rejected", "processed"],
      },
      requestedAt: Date,
      processedAt: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "items.product": 1 });

// Virtual for full customer name
orderSchema.virtual("customerName").get(function () {
  return `${this.shippingAddress.firstName} ${this.shippingAddress.lastName}`;
});

// Virtual for total items count
orderSchema.virtual("totalItems").get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for order age in days
orderSchema.virtual("orderAge").get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual to check if order can be cancelled
orderSchema.virtual("canBeCancelled").get(function () {
  return ["pending", "confirmed"].includes(this.status);
});

// Virtual to check if order can be returned
orderSchema.virtual("canBeReturned").get(function () {
  const deliveredDate = this.actualDelivery || this.estimatedDelivery;
  if (!deliveredDate || this.status !== "delivered") return false;

  const daysSinceDelivery = Math.floor(
    (Date.now() - deliveredDate) / (1000 * 60 * 60 * 24)
  );
  return daysSinceDelivery <= 30; // 30-day return policy
});

// Pre-save middleware to generate order number
orderSchema.pre("save", async function (next) {
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model("Order").countDocuments();
    const orderNum = (count + 1).toString().padStart(6, "0");
    this.orderNumber = `ORD-${new Date().getFullYear()}-${orderNum}`;
  }
  next();
});

// Pre-save middleware to calculate totals
orderSchema.pre("save", function (next) {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Calculate total
  this.total = this.subtotal + this.tax + this.shippingCost - this.discount;

  // Ensure total is not negative
  this.total = Math.max(0, this.total);

  next();
});

// Pre-save middleware to update status history
orderSchema.pre("save", function (next) {
  if (this.isModified("status") && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: `Order status changed to ${this.status}`,
    });
  }
  next();
});

// Pre-save middleware to copy shipping to billing if same
orderSchema.pre("save", function (next) {
  if (this.billingAddress.sameAsShipping) {
    this.billingAddress = {
      ...this.shippingAddress,
      sameAsShipping: true,
    };
  }
  next();
});

// Instance method to update status
orderSchema.methods.updateStatus = function (newStatus, note, updatedBy) {
  this.status = newStatus;

  // Add to status history
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note: note || `Order status updated to ${newStatus}`,
    updatedBy: updatedBy,
  });

  // Update specific timestamps
  if (newStatus === "delivered") {
    this.actualDelivery = new Date();
  }

  return this.save();
};

// Instance method to cancel order
orderSchema.methods.cancelOrder = function (reason, cancelledBy) {
  if (!this.canBeCancelled) {
    throw new Error("Order cannot be cancelled at this stage");
  }

  return this.updateStatus(
    "cancelled",
    `Order cancelled: ${reason}`,
    cancelledBy
  );
};

// Instance method to request refund
orderSchema.methods.requestRefund = function (amount, reason) {
  this.refund = {
    amount: amount || this.total,
    reason: reason,
    status: "requested",
    requestedAt: new Date(),
  };

  return this.save();
};

// Instance method to add tracking number
orderSchema.methods.addTracking = function (trackingNumber, carrier) {
  this.trackingNumber = trackingNumber;
  this.updateStatus(
    "shipped",
    `Order shipped with tracking: ${trackingNumber}`
  );
  return this.save();
};

// Static method to find orders by user
orderSchema.statics.findByUser = function (userId, options = {}) {
  return this.find({ user: userId })
    .populate("items.product", "name images")
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function (status, options = {}) {
  return this.find({ status })
    .populate("user", "firstName lastName email")
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0);
};

// Static method to get order statistics
orderSchema.statics.getOrderStats = function (startDate, endDate) {
  const matchStage = {};
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$total" },
        averageOrderValue: { $avg: "$total" },
        statusBreakdown: {
          $push: "$status",
        },
      },
    },
  ]);
};

module.exports = mongoose.model("Order", orderSchema);
