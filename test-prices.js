const mongoose = require("mongoose");
require("dotenv").config();

const Product = require("./models/Product");

async function testPrices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB\n");

    const products = await Product.find().limit(10).select("name price");

    console.log("📊 Current Prices in Database:\n");
    products.forEach((p) => {
      console.log(`${p.name}: ₹${p.price.toLocaleString("en-IN")}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testPrices();
