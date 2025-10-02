const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters"],
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [200, "Short description cannot exceed 200 characters"],
    },

    // Pricing
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
      validate: {
        validator: function (v) {
          return Number.isFinite(v) && v >= 0;
        },
        message: "Price must be a valid positive number",
      },
    },
    originalPrice: {
      type: Number,
      min: [0, "Original price cannot be negative"],
      validate: {
        validator: function (v) {
          return !v || (Number.isFinite(v) && v >= this.price);
        },
        message:
          "Original price must be greater than or equal to current price",
      },
    },

    // Category and Classification
    category: {
      type: String,
      required: [true, "Product category is required"],
      enum: [
        "Electronics",
        "Clothing",
        "Books",
        "Home & Garden",
        "Sports & Outdoors",
        "Health & Beauty",
        "Toys & Games",
        "Automotive",
        "Food & Beverages",
        "Other",
      ],
    },
    subcategory: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [50, "Brand name cannot exceed 50 characters"],
    },
    model: {
      type: String,
      trim: true,
      maxlength: [50, "Model cannot exceed 50 characters"],
    },

    // Images
    images: [
      {
        url: {
          type: String,
          required: true,
          validate: {
            validator: function (v) {
              return (
                /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v) ||
                /^\/uploads\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v)
              );
            },
            message: "Image URL must be a valid image file",
          },
        },
        alt: {
          type: String,
          default: function () {
            return this.parent().name;
          },
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Inventory Management
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    inStock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: [0, "Low stock threshold cannot be negative"],
    },

    // Product Specifications
    specifications: {
      weight: {
        value: Number,
        unit: {
          type: String,
          enum: ["kg", "g", "lb", "oz"],
        },
      },
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
          type: String,
          enum: ["cm", "in", "m"],
        },
      },
      color: [String],
      size: [String],
      material: String,
    },

    // Product Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isOnSale: {
      type: Boolean,
      default: false,
    },

    // SEO and Marketing
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    metaTitle: String,
    metaDescription: String,

    // Reviews and Ratings
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          trim: true,
          maxlength: [500, "Review comment cannot exceed 500 characters"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Analytics
    viewCount: {
      type: Number,
      default: 0,
    },
    purchaseCount: {
      type: Number,
      default: 0,
    },

    // Timestamps
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for discount percentage
productSchema.virtual("discountPercentage").get(function () {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(
      ((this.originalPrice - this.price) / this.originalPrice) * 100
    );
  }
  return 0;
});

// Virtual for average rating
productSchema.virtual("averageRating").get(function () {
  if (this.reviews.length === 0) return 0;
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  return Math.round((sum / this.reviews.length) * 10) / 10;
});

// Virtual for review count
productSchema.virtual("reviewCount").get(function () {
  return this.reviews.length;
});

// Virtual for stock status
productSchema.virtual("stockStatus").get(function () {
  if (this.inStock === 0) return "out-of-stock";
  if (this.inStock <= this.lowStockThreshold) return "low-stock";
  return "in-stock";
});

// Virtual for primary image
productSchema.virtual("primaryImage").get(function () {
  const primary = this.images.find((img) => img.isPrimary);
  return primary || this.images[0] || null;
});

// Pre-save middleware to generate slug
productSchema.pre("save", function (next) {
  if (this.isModified("name") || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .trim();

    // Add timestamp if slug might not be unique
    if (!this._id) {
      this.slug += "-" + Date.now();
    }
  }
  next();
});

// Pre-save middleware to ensure only one primary image
productSchema.pre("save", function (next) {
  const primaryImages = this.images.filter((img) => img.isPrimary);
  if (primaryImages.length > 1) {
    // Keep only the first primary image
    this.images.forEach((img, index) => {
      if (index > 0) img.isPrimary = false;
    });
  } else if (primaryImages.length === 0 && this.images.length > 0) {
    // Set first image as primary if none is set
    this.images[0].isPrimary = true;
  }
  next();
});

// Instance method to add review
productSchema.methods.addReview = function (userId, rating, comment) {
  // Check if user already reviewed this product
  const existingReview = this.reviews.find(
    (review) => review.user.toString() === userId.toString()
  );

  if (existingReview) {
    // Update existing review
    existingReview.rating = rating;
    existingReview.comment = comment;
    existingReview.createdAt = new Date();
  } else {
    // Add new review
    this.reviews.push({
      user: userId,
      rating,
      comment,
      createdAt: new Date(),
    });
  }

  return this.save();
};

// Instance method to update stock
productSchema.methods.updateStock = function (
  quantity,
  operation = "decrease"
) {
  if (operation === "decrease") {
    this.inStock = Math.max(0, this.inStock - quantity);
    this.purchaseCount += quantity;
  } else if (operation === "increase") {
    this.inStock += quantity;
  }
  return this.save();
};

// Instance method to increment view count
productSchema.methods.incrementViews = function () {
  this.viewCount += 1;
  return this.updateOne({ $inc: { viewCount: 1 } });
};

// Static method to find featured products
productSchema.statics.findFeatured = function (limit = 10) {
  return this.find({ isFeatured: true, isActive: true })
    .limit(limit)
    .sort({ createdAt: -1 });
};

// Static method to find products by category
productSchema.statics.findByCategory = function (category, options = {}) {
  const query = { category, isActive: true };
  return this.find(query)
    .limit(options.limit || 20)
    .skip(options.skip || 0)
    .sort(options.sort || { createdAt: -1 });
};

// Static method to search products
productSchema.statics.searchProducts = function (searchTerm, options = {}) {
  return this.find({
    $text: { $search: searchTerm },
    isActive: true,
  })
    .select({ score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" } })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

module.exports = mongoose.model("Product", productSchema);
