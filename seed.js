const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");
const Product = require("./models/Product");

const products = [
  {
    name: "Apple iPhone 15 Pro Max",
    description:
      "6.7-inch Super Retina XDR display with ProMotion. A17 Pro chip for incredible performance. Pro camera system with 48MP main camera. Titanium design. Action button for quick shortcuts. USB-C connectivity with 10Gbps transfer speeds.",
    price: 159900,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&q=80",
    stock: 50,
    rating: 4.9,
    reviews: 3245,
    featured: true,
  },
  {
    name: "Apple Watch Ultra 2",
    description:
      "49mm titanium case. Brightest Apple display ever. Precision dual-frequency GPS. Up to 36 hours battery life. Water resistant to 100m. Advanced health and fitness features.",
    price: 89900,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&q=80",
    stock: 35,
    rating: 4.8,
    reviews: 876,
    featured: true,
  },
  {
    name: "AirPods Pro (2nd Gen)",
    description:
      "Active Noise Cancellation. Adaptive Audio. Personalized Spatial Audio. Up to 6 hours listening time. MagSafe charging case. Precision finding with U1 chip.",
    price: 26900,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=500&q=80",
    stock: 100,
    rating: 4.7,
    reviews: 2156,
    featured: true,
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    description:
      "6.8-inch Dynamic AMOLED 2X display. Snapdragon 8 Gen 3 processor. 200MP camera with AI-powered photography. S Pen included. All-day battery life with fast charging.",
    price: 134999,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500&q=80",
    stock: 45,
    rating: 4.7,
    reviews: 987,
    featured: true,
  },
  {
    name: "Sony WH-1000XM5 Headphones",
    description:
      "Industry-leading noise cancellation. Crystal clear hands-free calling. Up to 30-hour battery life. Multipoint connection. Premium comfort and sound quality.",
    price: 34990,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&q=80",
    stock: 120,
    rating: 4.9,
    reviews: 2341,
    featured: true,
  },
  {
    name: "MacBook Air M3",
    description:
      "13.6-inch Liquid Retina display. Apple M3 chip with 8-core CPU. Up to 18 hours battery life. 8GB unified memory. 256GB SSD storage. Midnight color.",
    price: 119900,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80",
    stock: 35,
    rating: 4.9,
    reviews: 1876,
    featured: true,
  },
  {
    name: "iPad Pro 12.9-inch",
    description:
      "12.9-inch Liquid Retina XDR display. M2 chip. 128GB storage. Wi-Fi 6E. All-day battery life. Apple Pencil and Magic Keyboard support.",
    price: 112900,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&q=80",
    stock: 40,
    rating: 4.8,
    reviews: 1543,
    featured: false,
  },
  {
    name: "Nike Air Max 90",
    description:
      "Classic running shoe with iconic design. Max Air cushioning for all-day comfort. Durable rubber outsole. Premium leather and textile upper. Available in multiple colors.",
    price: 13995,
    category: "Clothing",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
    stock: 200,
    rating: 4.6,
    reviews: 3421,
    featured: true,
  },
  {
    name: "Levi's 501 Original Jeans",
    description:
      "The original straight fit jeans since 1873. 100% cotton denim. Button fly. Sits at waist. Straight leg. Classic 5-pocket styling. Available in various washes.",
    price: 5999,
    category: "Clothing",
    image:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80",
    stock: 150,
    rating: 4.5,
    reviews: 2876,
    featured: false,
  },
  {
    name: "Adidas Ultraboost 22",
    description:
      "Premium running shoes with BOOST midsole. Primeknit+ upper for adaptive fit. Continental rubber outsole. Responsive cushioning. Perfect for daily runs.",
    price: 18995,
    category: "Clothing",
    image:
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500&q=80",
    stock: 80,
    rating: 4.7,
    reviews: 1654,
    featured: false,
  },
  {
    name: "The Pragmatic Programmer",
    description:
      "Your Journey to Mastery, 20th Anniversary Edition. Essential reading for software developers. Covers best practices, design patterns, and career development.",
    price: 3999,
    category: "Books",
    image:
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&q=80",
    stock: 100,
    rating: 4.8,
    reviews: 5432,
    featured: true,
  },
  {
    name: "Clean Code",
    description:
      "A Handbook of Agile Software Craftsmanship by Robert C. Martin. Learn how to write code that is clean, maintainable, and elegant.",
    price: 3799,
    category: "Books",
    image:
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80",
    stock: 95,
    rating: 4.9,
    reviews: 6789,
    featured: true,
  },
  {
    name: "Atomic Habits",
    description:
      "An Easy & Proven Way to Build Good Habits & Break Bad Ones by James Clear. #1 New York Times bestseller. Transform your life one habit at a time.",
    price: 699,
    category: "Books",
    image:
      "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&q=80",
    stock: 200,
    rating: 4.8,
    reviews: 9876,
    featured: false,
  },
  {
    name: "Instant Pot Duo 7-in-1",
    description:
      "Electric pressure cooker combines 7 appliances in one. 6-quart capacity. Pressure cooker, slow cooker, rice cooker, steamer, sauté, yogurt maker, and warmer.",
    price: 9999,
    category: "Home & Kitchen",
    image:
      "https://images.unsplash.com/photo-1585515320310-259814833e62?w=500&q=80",
    stock: 60,
    rating: 4.7,
    reviews: 4321,
    featured: false,
  },
  {
    name: "Ninja Professional Blender",
    description:
      "1000-watt motor. Total crushing technology. 72 oz professional blender jar. Perfect for smoothies, frozen drinks, and food processing.",
    price: 7999,
    category: "Home & Kitchen",
    image:
      "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=500&q=80",
    stock: 75,
    rating: 4.6,
    reviews: 3210,
    featured: false,
  },
  {
    name: "Dyson V15 Detect Cordless Vacuum",
    description:
      "Laser reveals invisible dust. Intelligent suction adjustment. 60-minute run time. HEPA filtration. Complete whole-home deep clean.",
    price: 59990,
    category: "Home & Kitchen",
    image:
      "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500&q=80",
    stock: 30,
    rating: 4.8,
    reviews: 1987,
    featured: true,
  },
  {
    name: "Wilson Evolution Basketball",
    description:
      "Official size and weight. Composite leather cover. Cushion Core Technology. Laid-in composite channels. Best indoor basketball available.",
    price: 5999,
    category: "Sports",
    image:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&q=80",
    stock: 100,
    rating: 4.9,
    reviews: 5678,
    featured: false,
  },
  {
    name: "Fitbit Charge 6",
    description:
      "Advanced fitness tracker with built-in GPS. Heart rate monitoring. Sleep tracking. 7+ day battery life. Water resistant to 50m. Google apps integration.",
    price: 16990,
    category: "Sports",
    image:
      "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&q=80",
    stock: 85,
    rating: 4.5,
    reviews: 2345,
    featured: false,
  },
  {
    name: "Yoga Mat Pro",
    description:
      "Extra thick 6mm cushioning. Non-slip surface on both sides. Eco-friendly TPE material. Includes carrying strap. Perfect for yoga, pilates, and fitness.",
    price: 2499,
    category: "Sports",
    image:
      "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&q=80",
    stock: 150,
    rating: 4.6,
    reviews: 1876,
    featured: false,
  },
  {
    name: "La Roche-Posay Sunscreen SPF 50",
    description:
      "Broad spectrum UVA/UVB protection. Water resistant 80 minutes. Anthelios Melt-in Milk. Oil-free, non-greasy formula. Dermatologist recommended.",
    price: 1999,
    category: "Beauty",
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80",
    stock: 200,
    rating: 4.7,
    reviews: 4567,
    featured: false,
  },
  {
    name: "CeraVe Moisturizing Cream",
    description:
      "Daily face and body moisturizer. With hyaluronic acid and ceramides. 24-hour hydration. Non-comedogenic. Fragrance-free. Developed with dermatologists.",
    price: 999,
    category: "Beauty",
    image:
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&q=80",
    stock: 180,
    rating: 4.8,
    reviews: 8765,
    featured: false,
  },
  {
    name: "LEGO Star Wars Millennium Falcon",
    description:
      "Ultimate Collector Series. 7,541 pieces. Highly detailed model. Removable cockpit canopy. Rotating turrets. Display stand included. Ages 16+",
    price: 84999,
    category: "Toys",
    image:
      "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500&q=80",
    stock: 25,
    rating: 4.9,
    reviews: 3456,
    featured: true,
  },
  {
    name: "PlayStation 5 Console",
    description:
      "Ultra-high speed SSD. Integrated I/O. Stunning graphics up to 4K 120fps. Ray tracing. 3D Audio. DualSense wireless controller included.",
    price: 54990,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&q=80",
    stock: 40,
    rating: 4.8,
    reviews: 6789,
    featured: true,
  },
  {
    name: "Nintendo Switch OLED",
    description:
      "7-inch OLED screen with vivid colors. Enhanced audio. 64GB internal storage. Adjustable stand. Dock with wired LAN port. Play at home or on the go.",
    price: 34999,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=500&q=80",
    stock: 55,
    rating: 4.7,
    reviews: 4321,
    featured: false,
  },
  {
    name: "Canon EOS R6 Mark II",
    description:
      "24.2MP full-frame sensor. 40fps continuous shooting. 4K 60p video. In-body image stabilization. Dual card slots. Professional mirrorless camera.",
    price: 239999,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80",
    stock: 20,
    rating: 4.9,
    reviews: 876,
    featured: false,
  },
  {
    name: "The North Face Nuptse Jacket",
    description:
      "Iconic puffer jacket with 700-fill down. Water-repellent finish. Stowable hood. Secure zip hand pockets. Available in multiple colors.",
    price: 34999,
    category: "Clothing",
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80",
    stock: 70,
    rating: 4.8,
    reviews: 2345,
    featured: false,
  },
  {
    name: "Puma RS-X Sneakers",
    description:
      "Retro-inspired running shoes. Bold color blocking. Comfortable foam midsole. Durable rubber outsole. Perfect for casual wear and light workouts.",
    price: 9499,
    category: "Clothing",
    image:
      "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=500&q=80",
    stock: 90,
    rating: 4.5,
    reviews: 1234,
    featured: false,
  },
  {
    name: "Uniqlo Heattech Inner Wear",
    description:
      "Ultra-warm thermal technology. Moisture-wicking fabric. Odor control. Stretchy and comfortable fit. Perfect for winter layering.",
    price: 1299,
    category: "Clothing",
    image:
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500&q=80",
    stock: 200,
    rating: 4.6,
    reviews: 3421,
    featured: false,
  },
  {
    name: "Ray-Ban Aviator Sunglasses",
    description:
      "Classic aviator design. UV protection lenses. Metal frame with adjustable nose pads. Iconic teardrop shape. Comes with protective case.",
    price: 16999,
    category: "Clothing",
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&q=80",
    stock: 75,
    rating: 4.7,
    reviews: 2876,
    featured: false,
  },
  {
    name: "Casio G-Shock Digital Watch",
    description:
      "Shock resistant. 200m water resistant. LED backlight. World time. Stopwatch and countdown timer. Durable resin band.",
    price: 9999,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
    stock: 60,
    rating: 4.8,
    reviews: 4567,
    featured: false,
  },
  {
    name: "Kindle Paperwhite (11th Gen)",
    description:
      "6.8-inch glare-free display. Adjustable warm light. Waterproof (IPX8). Weeks of battery life. 16GB storage for thousands of books.",
    price: 15999,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1592503254549-d83d24a4dfab?w=500&q=80",
    stock: 80,
    rating: 4.6,
    reviews: 5432,
    featured: false,
  },
  {
    name: "Logitech MX Master 3S Mouse",
    description:
      "Ergonomic design. 8K DPI sensor. Quiet clicks. Multi-device connectivity. USB-C fast charging. Works on glass surfaces.",
    price: 10999,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80",
    stock: 95,
    rating: 4.9,
    reviews: 3210,
    featured: false,
  },
  {
    name: "Mechanical Keyboard RGB",
    description:
      "Cherry MX switches. Customizable RGB backlighting. Aluminum frame. Programmable keys. N-key rollover. Detachable USB-C cable.",
    price: 12999,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80",
    stock: 70,
    rating: 4.7,
    reviews: 2341,
    featured: false,
  },
];

const users = [
  {
    name: "Demo User",
    email: "demo@example.com",
    password: "demo123",
    phone: "+91 9876543210",
    address: {
      street: "123 MG Road",
      city: "Bangalore",
      state: "Karnataka",
      zipCode: "560001",
      country: "India",
    },
  },
  {
    name: "John Doe",
    email: "john@example.com",
    password: "john123",
    phone: "+91 9988776655",
    address: {
      street: "456 Park Street",
      city: "Mumbai",
      state: "Maharashtra",
      zipCode: "400001",
      country: "India",
    },
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("🔗 Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log("🗑️  Cleared existing data");

    // Create users
    const createdUsers = [];
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword,
      });
      await user.save();
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.email}`);
    }

    // Create products
    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Created ${createdProducts.length} products`);

    console.log("\n🎉 Database seeded successfully!");
    console.log("\n📧 Demo User Credentials:");
    console.log("   Email: demo@example.com");
    console.log("   Password: demo123");
    console.log("\n📧 Additional User:");
    console.log("   Email: john@example.com");
    console.log("   Password: john123");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
