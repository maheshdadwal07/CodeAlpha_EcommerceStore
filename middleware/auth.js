const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Authentication middleware
 */
const auth = async (req, res, next) => {
  try {
    const token =
      req.header("Authorization")?.replace("Bearer ", "") || req.session?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      });
    }

    if (user.isLocked) {
      return res.status(401).json({
        success: false,
        message: "Account is locked. Please contact support.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired.",
      });
    }

    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

/**
 * Optional authentication middleware
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token =
      req.header("Authorization")?.replace("Bearer ", "") || req.session?.token;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (user && !user.isLocked) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};

/**
 * Admin authorization middleware
 */
const adminAuth = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
  next();
};

/**
 * Validation middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
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
    next();
  };
};

module.exports = {
  auth,
  optionalAuth,
  adminAuth,
  validate,
};
