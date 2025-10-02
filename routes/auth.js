const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const Joi = require("joi");
const User = require("../models/User");
const { auth, validate } = require("../middleware/auth");

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const registerSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]"
      )
    )
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),
  phone: Joi.string()
    .pattern(/^[+]?[1-9]?\d{10,14}$/)
    .optional(),
  dateOfBirth: Joi.date().max("now").optional(),
  gender: Joi.string()
    .valid("male", "female", "other", "prefer-not-to-say")
    .optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  rememberMe: Joi.boolean().optional(),
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  phone: Joi.string()
    .pattern(/^[+]?[1-9]?\d{10,14}$/)
    .optional(),
  dateOfBirth: Joi.date().max("now").optional(),
  gender: Joi.string()
    .valid("male", "female", "other", "prefer-not-to-say")
    .optional(),
  preferences: Joi.object({
    newsletter: Joi.boolean().optional(),
    emailNotifications: Joi.boolean().optional(),
    smsNotifications: Joi.boolean().optional(),
  }).optional(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]"
      )
    )
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),
});

// Generate JWT token
const generateToken = (userId, rememberMe = false) => {
  const expiresIn = rememberMe ? "30d" : "7d";
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        phone,
        dateOfBirth,
        gender,
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }

      // Create new user
      const user = new User({
        firstName,
        lastName,
        email: email.toLowerCase(),
        password,
        phone,
        dateOfBirth,
        gender,
      });

      await user.save();

      // Generate token
      const token = generateToken(user._id);

      // Set session
      req.session.token = token;
      req.session.userId = user._id;

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          token,
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
          },
        },
      });
    } catch (error) {
      console.error("Registration error:", error);

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error creating user account",
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message:
          "Account is locked due to too many failed login attempts. Please contact support.",
      });
    }

    // Validate password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      // Increment login attempts
      await user.incrementLoginAttempts();

      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, rememberMe);

    // Set session
    req.session.token = token;
    req.session.userId = user._id;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Error during login",
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post("/logout", auth, async (req, res) => {
  try {
    // Clear session
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({
          success: false,
          message: "Error during logout",
        });
      }

      res.clearCookie("connect.sid");
      res.json({
        success: true,
        message: "Logout successful",
      });
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Error during logout",
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -loginAttempts -lockUntil")
      .populate("addresses")
      .populate("wishlist", "name price images slug");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user profile",
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put(
  "/profile",
  auth,
  validate(updateProfileSchema),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Update allowed fields
      const allowedUpdates = [
        "firstName",
        "lastName",
        "phone",
        "dateOfBirth",
        "gender",
        "preferences",
      ];
      const updates = Object.keys(req.body)
        .filter((key) => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {});

      Object.assign(user, updates);
      user.updatedAt = new Date();

      await user.save();

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            preferences: user.preferences,
          },
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating profile",
      });
    }
  }
);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put(
  "/change-password",
  auth,
  validate(changePasswordSchema),
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(
        currentPassword
      );
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Update password
      user.password = newPassword;
      user.updatedAt = new Date();
      await user.save();

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Error changing password",
      });
    }
  }
);

// @route   POST /api/auth/verify-token
// @desc    Verify JWT token
// @access  Public
router.post("/verify-token", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (user.isLocked) {
      return res.status(401).json({
        success: false,
        message: "Account is locked",
      });
    }

    res.json({
      success: true,
      message: "Token is valid",
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
      },
    });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    console.error("Token verification error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying token",
    });
  }
});

module.exports = router;
