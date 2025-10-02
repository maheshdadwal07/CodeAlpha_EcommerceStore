const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

// Sample data
const sampleUsers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    role: 'user',
    phone: '+1234567890',
    isEmailVerified: true
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: 'password123',
    role: 'user',
    phone: '+1234567891',
    isEmailVerified: true
  },
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@codealpha.com',
    password: 'admin123',
    role: 'admin',
    phone: '+1234567892',
    isEmailVerified: true
  }
];

const sampleProducts = [
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless Bluetooth headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.',
    price: 199.99,
    category: 'Electronics',
    subcategory: 'Audio',
    brand: 'AudioTech',
    sku: 'AT-WBH-001',
    stock: 50,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500'
    ],
    tags: ['wireless', 'bluetooth', 'headphones', 'noise-cancelling'],
    specifications: {
      'Battery Life': '30 hours',
      'Connectivity': 'Bluetooth 5.0',
      'Weight': '250g',
      'Noise Cancellation': 'Active'
    },
    isActive: true,
    isFeatured: true
  },
  {
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable and sustainable organic cotton t-shirt available in multiple colors. Made from 100% organic cotton.',
    price: 29.99,
    category: 'Clothing',
    subcategory: 'T-Shirts',
    brand: 'EcoWear',
    sku: 'EW-CT-001',
    stock: 100,
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500'
    ],
    tags: ['organic', 'cotton', 't-shirt', 'sustainable'],
    specifications: {
      'Material': '100% Organic Cotton',
      'Fit': 'Regular',
      'Care': 'Machine Washable',
      'Origin': 'Made in USA'
    },
    variants: [
      { size: 'S', color: 'White', stock: 20 },
      { size: 'M', color: 'White', stock: 25 },
      { size: 'L', color: 'White', stock: 25 },
      { size: 'S', color: 'Black', stock: 15 },
      { size: 'M', color: 'Black', stock: 15 }
    ],
    isActive: true,
    isFeatured: false
  },
  {
    name: 'Smart Fitness Watch',
    description: 'Advanced fitness tracking watch with heart rate monitor, GPS, and smartphone connectivity. Track your workouts and health metrics.',
    price: 299.99,
    category: 'Electronics',
    subcategory: 'Wearables',
    brand: 'FitTech',
    sku: 'FT-SFW-001',
    stock: 30,
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500'
    ],
    tags: ['smartwatch', 'fitness', 'health', 'gps'],
    specifications: {
      'Display': '1.4 inch AMOLED',
      'Battery': '7 days',
      'Water Resistance': '50M',
      'Sensors': 'Heart Rate, GPS, Accelerometer'
    },
    isActive: true,
    isFeatured: true
  },
  {
    name: 'Ceramic Coffee Mug Set',
    description: 'Beautiful set of 4 ceramic coffee mugs with unique designs. Perfect for your morning coffee or as a gift.',
    price: 49.99,
    category: 'Home & Kitchen',
    subcategory: 'Drinkware',
    brand: 'CeramicCraft',
    sku: 'CC-CMS-001',
    stock: 25,
    images: [
      'https://images.unsplash.com/photo-1514228742987-fd0711b0e201?w=500',
      'https://images.unsplash.com/photo-1506472585949-9ac4fe40a3e8?w=500'
    ],
    tags: ['ceramic', 'coffee', 'mug', 'set'],
    specifications: {
      'Material': 'High-quality Ceramic',
      'Capacity': '12 oz per mug',
      'Set Includes': '4 mugs',
      'Dishwasher Safe': 'Yes'
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: 'Leather Laptop Bag',
    description: 'Professional genuine leather laptop bag with multiple compartments. Fits laptops up to 15.6 inches.',
    price: 129.99,
    category: 'Accessories',
    subcategory: 'Bags',
    brand: 'LeatherCraft',
    sku: 'LC-LLB-001',
    stock: 20,
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500'
    ],
    tags: ['leather', 'laptop', 'bag', 'professional'],
    specifications: {
      'Material': 'Genuine Leather',
      'Laptop Size': 'Up to 15.6 inches',
      'Compartments': '3 main compartments',
      'Dimensions': '16" x 12" x 4"'
    },
    isActive: true,
    isFeatured: false
  },
  {
    name: 'Yoga Exercise Mat',
    description: 'Non-slip yoga mat made from eco-friendly materials. Perfect for yoga, pilates, and general exercise.',
    price: 39.99,
    category: 'Sports & Fitness',
    subcategory: 'Exercise Equipment',
    brand: 'YogaFlow',
    sku: 'YF-YEM-001',
    stock: 40,
    images: [
      'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=500',
      'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=500'
    ],
    tags: ['yoga', 'exercise', 'mat', 'eco-friendly'],
    specifications: {
      'Material': 'TPE (Eco-friendly)',
      'Thickness': '6mm',
      'Size': '68" x 24"',
      'Features': 'Non-slip, Lightweight'
    },
    isActive: true,
    isFeatured: true
  }
];

// Database seeding function
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_store',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('✅ Connected to database');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});

    // Seed users
    console.log('👥 Creating users...');
    const users = [];
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      await user.save();
      users.push(user);
      console.log(`✅ Created user: ${user.email}`);
    }

    // Seed products
    console.log('📦 Creating products...');
    for (const productData of sampleProducts) {
      const product = new Product(productData);
      await product.save();
      console.log(`✅ Created product: ${product.name}`);
    }

    // Create a sample order
    console.log('📋 Creating sample order...');
    const products = await Product.find().limit(2);
    const customer = users.find(u => u.role === 'user');
    
    if (products.length > 0 && customer) {
      const order = new Order({
        user: customer._id,
        items: products.map(product => ({
          product: product._id,
          quantity: Math.floor(Math.random() * 3) + 1,
          price: product.price
        })),
        shippingAddress: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'USA',
          phone: customer.phone
        },
        paymentMethod: 'credit_card',
        status: 'delivered'
      });

      // Calculate totals
      order.subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      order.tax = order.subtotal * 0.08; // 8% tax
      order.shipping = order.subtotal > 50 ? 0 : 9.99; // Free shipping over $50
      order.total = order.subtotal + order.tax + order.shipping;

      await order.save();
      console.log(`✅ Created sample order for ${customer.email}`);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Products: ${sampleProducts.length}`);
    console.log(`   Orders: 1`);
    console.log('');
    console.log('👤 Test Accounts:');
    console.log('   Customer: john.doe@example.com / password123');
    console.log('   Customer: jane.smith@example.com / password123');
    console.log('   Admin: admin@codealpha.com / admin123');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleUsers, sampleProducts };