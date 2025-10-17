const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");
const Product = require("./models/Product");
const Cart = require("./models/Cart");
const Order = require("./models/Order");

async function clearDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("🔗 Connected to MongoDB");

    // Clear all collections
    await User.deleteMany({});
    console.log("✅ Cleared Users");

    await Product.deleteMany({});
    console.log("✅ Cleared Products");

    await Cart.deleteMany({});
    console.log("✅ Cleared Carts");

    await Order.deleteMany({});
    console.log("✅ Cleared Orders");

    console.log("\n🎉 Database completely cleared!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    process.exit(1);
  }
}

clearDatabase();
