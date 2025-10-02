const express = require('express');
const Joi = require('joi');
const Product = require('../models/Product');
const User = require('../models/User');
const { auth, optionalAuth, adminAuth, validate } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createProductSchema = Joi.object({
    name: Joi.string().min(3).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    shortDescription: Joi.string().max(300).optional(),
    price: Joi.number().min(0).required(),
    originalPrice: Joi.number().min(0).optional(),
    category: Joi.string().required(),
    subcategory: Joi.string().optional(),
    brand: Joi.string().optional(),
    sku: Joi.string().required(),
    inStock: Joi.number().integer().min(0).required(),
    minStockLevel: Joi.number().integer().min(0).optional(),
    images: Joi.array().items(Joi.object({
        url: Joi.string().uri().required(),
        alt: Joi.string().required(),
        isPrimary: Joi.boolean().default(false)
    })).min(1).required(),
    specifications: Joi.object().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    isActive: Joi.boolean().default(true),
    isFeatured: Joi.boolean().default(false),
    seo: Joi.object({
        title: Joi.string().optional(),
        description: Joi.string().optional(),
        keywords: Joi.array().items(Joi.string()).optional()
    }).optional()
});

const updateProductSchema = createProductSchema.fork(
    ['name', 'description', 'price', 'sku', 'inStock', 'images'], 
    schema => schema.optional()
);

const reviewSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().min(10).max(1000).required()
});

// @route   GET /api/products
// @desc    Get all products with filtering and pagination
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            category,
            subcategory,
            brand,
            minPrice,
            maxPrice,
            rating,
            inStock,
            featured,
            sort = 'createdAt',
            order = 'desc',
            search
        } = req.query;
        
        // Build filter object
        const filter = { isActive: true };
        
        if (category) filter.category = new RegExp(category, 'i');
        if (subcategory) filter.subcategory = new RegExp(subcategory, 'i');
        if (brand) filter.brand = new RegExp(brand, 'i');
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }
        if (rating) filter.averageRating = { $gte: parseFloat(rating) };
        if (inStock === 'true') filter.inStock = { $gt: 0 };
        if (featured === 'true') filter.isFeatured = true;
        
        // Search functionality
        if (search) {
            filter.$or = [
                { name: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') },
                { tags: { $in: [new RegExp(search, 'i')] } },
                { category: new RegExp(search, 'i') },
                { brand: new RegExp(search, 'i') }
            ];
        }
        
        // Sort options
        const sortOptions = {};
        switch (sort) {
            case 'price':
                sortOptions.price = order === 'desc' ? -1 : 1;
                break;
            case 'rating':
                sortOptions.averageRating = order === 'desc' ? -1 : 1;
                break;
            case 'name':
                sortOptions.name = order === 'desc' ? -1 : 1;
                break;
            case 'newest':
                sortOptions.createdAt = -1;
                break;
            case 'oldest':
                sortOptions.createdAt = 1;
                break;
            case 'popular':
                sortOptions.viewCount = -1;
                break;
            default:
                sortOptions.createdAt = order === 'desc' ? -1 : 1;
        }
        
        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        // Execute query
        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate('reviews.user', 'firstName lastName')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Product.countDocuments(filter)
        ]);
        
        // Calculate pagination info
        const totalPages = Math.ceil(total / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;
        
        res.json({
            success: true,
            data: {
                products,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalProducts: total,
                    hasNextPage,
                    hasPrevPage,
                    limit: limitNum
                }
            }
        });
        
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products'
        });
    }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
    try {
        const { limit = 8 } = req.query;
        
        const products = await Product.find({ 
            isActive: true, 
            isFeatured: true,
            inStock: { $gt: 0 }
        })
        .populate('reviews.user', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();
        
        res.json({
            success: true,
            data: { products }
        });
        
    } catch (error) {
        console.error('Get featured products error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching featured products'
        });
    }
});

// @route   GET /api/products/categories
// @desc    Get product categories
// @access  Public
router.get('/categories', async (req, res) => {
    try {
        const categories = await Product.aggregate([
            { $match: { isActive: true } },
            { $group: { 
                _id: '$category', 
                count: { $sum: 1 },
                subcategories: { $addToSet: '$subcategory' }
            }},
            { $project: {
                category: '$_id',
                count: 1,
                subcategories: { $filter: {
                    input: '$subcategories',
                    cond: { $ne: ['$$this', null] }
                }}
            }},
            { $sort: { category: 1 } }
        ]);
        
        res.json({
            success: true,
            data: { categories }
        });
        
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching categories'
        });
    }
});

// @route   GET /api/products/search
// @desc    Search products with advanced options
// @access  Public
router.get('/search', async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;
        
        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }
        
        const searchRegex = new RegExp(q, 'i');
        
        const products = await Product.find({
            isActive: true,
            $or: [
                { name: searchRegex },
                { description: searchRegex },
                { tags: { $in: [searchRegex] } },
                { category: searchRegex },
                { brand: searchRegex }
            ]
        })
        .select('name price images slug category averageRating')
        .limit(parseInt(limit))
        .lean();
        
        res.json({
            success: true,
            data: { 
                products,
                total: products.length,
                query: q
            }
        });
        
    } catch (error) {
        console.error('Search products error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching products'
        });
    }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('reviews.user', 'firstName lastName')
            .lean();
            
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        if (!product.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Product not available'
            });
        }
        
        // Increment view count
        await Product.findByIdAndUpdate(req.params.id, { 
            $inc: { viewCount: 1 } 
        });
        
        // Get related products
        const relatedProducts = await Product.find({
            _id: { $ne: product._id },
            category: product.category,
            isActive: true
        })
        .select('name price images slug averageRating')
        .limit(4)
        .lean();
        
        res.json({
            success: true,
            data: { 
                product,
                relatedProducts
            }
        });
        
    } catch (error) {
        console.error('Get product error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error fetching product'
        });
    }
});

// @route   POST /api/products
// @desc    Create new product (Admin only)
// @access  Private/Admin
router.post('/', auth, adminAuth, validate(createProductSchema), async (req, res) => {
    try {
        const productData = req.body;
        
        // Check if SKU already exists
        const existingProduct = await Product.findOne({ sku: productData.sku });
        if (existingProduct) {
            return res.status(400).json({
                success: false,
                message: 'Product with this SKU already exists'
            });
        }
        
        const product = new Product(productData);
        await product.save();
        
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: { product }
        });
        
    } catch (error) {
        console.error('Create product error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Product with this SKU already exists'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error creating product'
        });
    }
});

// @route   PUT /api/products/:id
// @desc    Update product (Admin only)
// @access  Private/Admin
router.put('/:id', auth, adminAuth, validate(updateProductSchema), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        // Check SKU uniqueness if updating SKU
        if (req.body.sku && req.body.sku !== product.sku) {
            const existingProduct = await Product.findOne({ sku: req.body.sku });
            if (existingProduct) {
                return res.status(400).json({
                    success: false,
                    message: 'Product with this SKU already exists'
                });
            }
        }
        
        // Update product
        Object.assign(product, req.body);
        product.updatedAt = new Date();
        
        await product.save();
        
        res.json({
            success: true,
            message: 'Product updated successfully',
            data: { product }
        });
        
    } catch (error) {
        console.error('Update product error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error updating product'
        });
    }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (Admin only)
// @access  Private/Admin
router.delete('/:id', auth, adminAuth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        // Soft delete - just set isActive to false
        product.isActive = false;
        product.updatedAt = new Date();
        await product.save();
        
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete product error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error deleting product'
        });
    }
});

// @route   POST /api/products/:id/reviews
// @desc    Add product review
// @access  Private
router.post('/:id/reviews', auth, validate(reviewSchema), async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const productId = req.params.id;
        const userId = req.user._id;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        // Check if user already reviewed this product
        const existingReview = product.reviews.find(
            review => review.user.toString() === userId.toString()
        );
        
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this product'
            });
        }
        
        // Add review
        const review = {
            user: userId,
            rating,
            comment,
            createdAt: new Date()
        };
        
        product.reviews.push(review);
        await product.save();
        
        // Populate the user data for response
        await product.populate('reviews.user', 'firstName lastName');
        
        res.status(201).json({
            success: true,
            message: 'Review added successfully',
            data: { 
                review: product.reviews[product.reviews.length - 1]
            }
        });
        
    } catch (error) {
        console.error('Add review error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error adding review'
        });
    }
});

// @route   PUT /api/products/:productId/reviews/:reviewId
// @desc    Update product review
// @access  Private
router.put('/:productId/reviews/:reviewId', auth, validate(reviewSchema), async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const { productId, reviewId } = req.params;
        const userId = req.user._id;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        const review = product.reviews.id(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }
        
        // Check if user owns the review
        if (review.user.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this review'
            });
        }
        
        // Update review
        review.rating = rating;
        review.comment = comment;
        review.updatedAt = new Date();
        
        await product.save();
        
        res.json({
            success: true,
            message: 'Review updated successfully',
            data: { review }
        });
        
    } catch (error) {
        console.error('Update review error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error updating review'
        });
    }
});

// @route   DELETE /api/products/:productId/reviews/:reviewId
// @desc    Delete product review
// @access  Private
router.delete('/:productId/reviews/:reviewId', auth, async (req, res) => {
    try {
        const { productId, reviewId } = req.params;
        const userId = req.user._id;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        const review = product.reviews.id(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }
        
        // Check if user owns the review or is admin
        if (review.user.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this review'
            });
        }
        
        // Remove review
        product.reviews.pull(reviewId);
        await product.save();
        
        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete review error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error deleting review'
        });
    }
});

module.exports = router;