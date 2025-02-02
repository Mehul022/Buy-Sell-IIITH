const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session'); 
const MongoStore = require('connect-mongo');
const app = express();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const DB_URI = 'mongodb+srv://Mehul:Mehul293645@techmartiiith.47mlw.mongodb.net/?retryWrites=true&w=majority&appName=TechMartIIITh';
const API_KEY = "AIzaSyCN0BByLHITqEzt3EQ-BLawAVaN7CQ-x1U";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const xml2js = require('xml2js');
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: DB_URI,
        ttl: 24 * 60 * 60
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3001'],
    credentials: true
}));

// const RECAPTCHA_SECRET_KEY = '6LeL8boqAAAAADYNo6XHBvxhryPouo5HcPNMivab';

mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    age: { type: Number, required: true },
    contactNumber: { type: String, required: true },
    password: { type: String, required: true },
    reviews: [{ type: String, required: true }],
});

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
});
const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId,ref:'Product', required: true },
    quantity: { type: Number, required: true, min: 1 }
});
const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quantity: { type: Number, required: true },
    otp: { type: String, required: true },
    isDelivered: { type: Boolean, default: false },
    orderDate: { type: Date, default: Date.now }
});
const CAS_URL = 'https://login.iiit.ac.in/cas';
const SERVICE_URL = 'http://localhost:3000/api/cas/validate';

const Order = mongoose.model('Order', orderSchema);
const Cart = mongoose.model('Cart', cartSchema);
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);

const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ message: 'Please log in to continue' });
    }
};

/**
 * Generate a response from the AI model
 * @param {string} prompt - User query or message
 * @param {string[]} sessionHistory - Previous chat history of the session
 * @returns {Promise<string>} - AI's response text
 */
const getAIResponse = async (prompt, sessionHistory) => {
    try {
        const fullPrompt = sessionHistory.join("\n") + `\nUser: ${prompt}\nAI:`;
        const result = await model.generateContent(fullPrompt);
        return result.response.text();
    } catch (error) {
        console.error("Error generating AI response:", error);
        return "I'm sorry, I couldn't process your request. Please try again later.";
    }
};

app.post("/api/chat", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
    }
    if (!req.session.chatHistory) {
        req.session.chatHistory = [];
    }
    try {
        const response = await getAIResponse(prompt, req.session.chatHistory);
        req.session.chatHistory.push(`User: ${prompt}`);
        req.session.chatHistory.push(`AI: ${response}`);
        res.json({ response });
    } catch (error) {
        console.error("Error handling chat request:", error);
        res.status(500).json({ error: "Failed to process chat request." });
    }
});

app.post("/api/chat/reset", (req, res) => {
    if (req.session) {
        req.session.chatHistory = [];
    }
    res.json({ message: "Chat history reset successfully." });
});


app.post('/signup', async (req, res) => {
    const { firstName, lastName, email, age, contactNumber, password, recaptchaToken } = req.body;
    try {
        const recaptchaResponse = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=6Lc5z7oqAAAAAIsvrCUo0yB4f316Hou_7iIj-Ty-&response=${recaptchaToken}`
        );
        if (!recaptchaResponse.data.success) {
            return res.status(400).json({ message: 'Invalid reCAPTCHA' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already registered.' });
        }
        req.session.pendingEmail = email;
        req.session.pendingUser = { firstName, lastName, email, age, contactNumber, password };
        const serviceURL = encodeURIComponent('http://localhost:3000/api/Signup/cas/validate');
        return res.json({ redirectUrl: `https://login.iiit.ac.in/cas/login?service=${serviceURL}` });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({
            message: 'An error occurred during signup. Please try again.',
            details: error.message
        });
    }
});
app.get('/api/Signup/cas/validate', async (req, res) => {
    const ticket = req.query.ticket;
    const serviceURL = 'http://localhost:3000/api/Signup/cas/validate';
    if (!ticket) {
        return res.redirect('/');
    }
    try {
        const validateURL = `https://login.iiit.ac.in/cas/serviceValidate?ticket=${ticket}&service=${encodeURIComponent(serviceURL)}`;
        const response = await axios.get(validateURL);
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);
        if (result['cas:serviceResponse']['cas:authenticationSuccess']) {
            const casUser = result['cas:serviceResponse']['cas:authenticationSuccess'][0]['cas:user'][0];
            const pendingEmail = req.session.pendingEmail;
            const pendingUser=req.session.pendingUser;
            req.session.pendingEmail = undefined;
            req.session.pendingUser = undefined;
            if (!pendingEmail) {
                return res.redirect('/');
            }
            // console.log(casUser);
            // console.log(pendingEmail);
            if (casUser === pendingEmail) {
                
                const hashedPassword = await bcrypt.hash(pendingUser.password, 10);
                const newUser = new User({
                    firstName: pendingUser.firstName,
                    lastName: pendingUser.lastName,
                    email: pendingUser.email,
                    age: pendingUser.age,
                    contactNumber: pendingUser.contactNumber,
                    password: hashedPassword
                });
                await newUser.save();
                req.session.userId = newUser._id;
                return res.redirect('/home');
            }
        }
        return res.redirect('/');
    } catch (error) {
        console.error('CAS validation error:', error);
        return res.redirect('/');
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password, recaptchaToken } = req.body;
    try {
        const recaptchaResponse = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=6Lc5z7oqAAAAAIsvrCUo0yB4f316Hou_7iIj-Ty-&response=${recaptchaToken}`
        );
        if (!recaptchaResponse.data.success) {
            return res.status(400).json({ message: 'Invalid reCAPTCHA' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        req.session.pendingEmail = email;
        const serviceURL = encodeURIComponent('http://localhost:3000/api/cas/validate');
        return res.json({ redirectUrl: `https://login.iiit.ac.in/cas/login?service=${serviceURL}` });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add this new endpoint to clear the session
app.post('/api/clear-session', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err);
            res.status(500).json({ message: 'Failed to clear session' });
        } else {
            res.json({ message: 'Session cleared' });
        }
    });
});

app.get('/api/cas/validate', async (req, res) => {
    const ticket = req.query.ticket;
    const serviceURL = 'http://localhost:3000/api/cas/validate';
    if (!ticket) {
        return res.redirect('/login');
    }
    try {
        const validateURL = `https://login.iiit.ac.in/cas/serviceValidate?ticket=${ticket}&service=${encodeURIComponent(serviceURL)}`;
        const response = await axios.get(validateURL);
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);
        if (result['cas:serviceResponse']['cas:authenticationSuccess']) {
            const casUser = result['cas:serviceResponse']['cas:authenticationSuccess'][0]['cas:user'][0];
            const pendingEmail = req.session.pendingEmail;
            req.session.pendingEmail = undefined;
            if (!pendingEmail ) {
                return res.redirect('/login');
            }
            // console.log(casUser);
            // console.log(pendingEmail);
            if (casUser === pendingEmail) {
                const user = await User.findOne({ email: pendingEmail });
                if (!user) {
                    return res.redirect('/login');
                }
                req.session.userId = user._id;
                return res.redirect('/home');
            }
        }
        return res.redirect('/login');
    } catch (error) {
        console.error('CAS validation error:', error);
        return res.redirect('/login');
    }
});

app.get('/check-auth', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.session.userId });
        res.json({
            isAuthenticated: true,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error checking authentication status' });
    }
});

app.get('/api/user/me', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not logged in' });
        }
        const user = await User.findById(userId, 'firstName lastName');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ firstName: user.firstName, lastName: user.lastName });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

app.get('/api/products/search', async (req, res) => {
    const query = req.query.q.toLowerCase();
    const products = await Product.find({
        name: { $regex: query, $options: 'i' }
    }).limit(18);
    res.json(products);
});

app.get('/api/products/initial', async (req, res) => {
    try {
        const products = await Product.find()
            .limit(18)
            .sort({ createdAt: -1 }); // Sort by most recent or any other criteria
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch initial products' });
    }
});

app.get('/api/profile', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.session.userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            age: user.age,
            contactNumber: user.contactNumber,
            userId: String(user._id)
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Error fetching profile data' });
    }
});

app.put('/api/profile', isAuthenticated, async (req, res) => {
    try {
        const { firstName, lastName, email, age, contactNumber } = req.body;
        const user = await User.findOne({ _id: req.session.userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email is already in use' });
            }
        }
        console.log(user);
        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;
        user.age = age;
        user.contactNumber = contactNumber;
        await user.save();
        res.json({
            message: 'Profile updated successfully',
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                age: user.age,
                contactNumber: user.contactNumber,
                userId: String(user._id)
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

app.post('/api/sell', async (req, res) => {
    try {
        const { name, price, description, category } = req.body;
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }
        const newProduct = new Product({
            name,
            price,
            description,
            category,
            sellerId: req.session.userId
        });
        await newProduct.save();
        res.status(201).json({ message: 'Product added successfully!' });
    } catch (error) {
        console.error('Error saving product:', error);
        res.status(500).json({ message: 'Error saving product.', details: error.message });
    }
});

app.get('/api/home', isAuthenticated, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 18;
    const startIndex = (page - 1) * limit;
    const category = req.query.category;
    const priceRange = req.query.priceRange;
    try {
        let query = { sellerId: { $ne: req.session.userId } };
        if (category !== 'all') {
            query.category = category;
        }
        if (priceRange !== 'all') {
            const [min, max] = priceRange.split('-');
            if (max) {
                query.price = { $gte: parseInt(min), $lte: parseInt(max) };
            } else {
                query.price = { $gte: parseInt(min) };
            }
        }
        const totalProducts = await Product.countDocuments(query);
        const products = await Product.find(query)
            .skip(startIndex)
            .limit(limit)
            .exec();
        res.json({
            products,
            totalPages: Math.ceil(totalProducts / limit),
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products.' });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        res.json({ categories });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories.' });
    }
});

app.get('/api/product/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const seller = await User.findOne({ _id: product.sellerId });
        if (!seller) {
            return res.status(404).json({ message: 'Seller not found' });
        }
        res.json({
            product,
            seller: {
                firstName: seller.firstName,
                lastName: seller.lastName,
                email: seller.email,
                reviews:seller.reviews
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product details' });
    }
});

app.get('/api/cart', isAuthenticated, async (req, res) => {
    try {
        const cartItems = await Cart.find({
            userId: req.session.userId
        });
        // console.log('Raw Cart Items:', cartItems);
        if (cartItems.length > 0) {
            const cartItemsWithProducts = await Cart.aggregate([
                {
                    $match: { userId: new mongoose.Types.ObjectId(req.session.userId) } 
                },
                {
                    $lookup: {
                        from: 'products', 
                        localField: 'productId', 
                        foreignField: '_id', 
                        as: 'product'
                    }
                },
                {
                    $unwind: '$product'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'product.sellerId', 
                        foreignField: '_id',
                        as: 'seller'
                    }
                },
                {
                    $unwind: '$seller'
                },
                {
                    $project: {
                        _id: 1, 
                        userId: 1,
                        productId: 1,
                        quantity: 1,
                        'product.name': 1,
                        'product.price': 1,
                        'product.description': 1,
                        'product.category': 1,
                        'seller.firstName': 1,
                        'seller.lastName': 1,
                        'seller.email': 1
                    }
                }
            ]);
            // console.log('Aggregated Cart Items:', cartItemsWithProducts);
            res.json(cartItemsWithProducts);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Cart Fetch Error:', error);
        res.status(500).json({
            message: 'Error fetching cart items',
            error: error.toString()
        });
    }
});
app.post('/api/cart/add', isAuthenticated, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const existingCartItem = await Cart.findOne({
            userId: req.session.userId,
            productId
        });
        if (existingCartItem) {
            existingCartItem.quantity += quantity;
            await existingCartItem.save();
        } else {
            await Cart.create({
                userId: req.session.userId,
                productId,
                quantity
            });
        }
        res.status(201).json({ message: 'Added to cart successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error adding to cart' });
    }
});


app.get('/api/cart/check', isAuthenticated, async (req, res) => {
    try {
        const { productId } = req.query;
        const cartItem = await Cart.findOne({
            userId: req.session.userId,
            productId
        });
        res.json({ inCart: !!cartItem });
    } catch (error) {
        res.status(500).json({ message: 'Error checking cart status' });
    }
});

app.put('/api/cart/update', isAuthenticated, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        if (quantity < 1) {
            return res.status(400).json({ message: 'Quantity must be at least 1' });
        }
        // console.log(req.session.userId);
        // console.log(productId);
        const cartItem = await Cart.findOneAndUpdate(
            {
                userId: req.session.userId, 
                productId:(productId)
            },
            { quantity },
            {
                new: true,
                runValidators: true
            }
        ).populate('productId');
        if (!cartItem) {
            return res.status(404).json({
                message: 'Cart item not found',
                details: {
                    userId: req.session.userId,
                    productId: productId
                }
            });
        }
        res.json(cartItem);
    } catch (error) {
        console.error('Cart update error:', error);
        res.status(500).json({
            message: 'Error updating cart item',
            error: error.message
        });
    }
});

app.delete('/api/cart/:productId', isAuthenticated, async (req, res) => {
    try {
        const result = await Cart.findOneAndDelete({
            userId: req.session.userId,
            productId: new mongoose.Types.ObjectId(req.params.productId)
        });
        if (result) {
            res.json({
                message: 'Removed from cart successfully',
                deletedItem: result
            });
        } else {
            res.status(404).json({
                message: 'Item not found in cart',
                details: {
                    userId: req.session.userId,
                    productId: req.params.productId
                }
            });
        }
    } catch (error) {
        console.error('Cart removal error:', error);
        res.status(500).json({
            message: 'Error removing from cart',
            error: error.message
        });
    }
});

app.post('/api/orders', isAuthenticated, async (req, res) => {
    const { cartItems } = req.body;
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const orders = await Promise.all(cartItems.map(async (item) => {
            const product = await Product.findById(item.productId);
            otp = Math.floor(100000 + Math.random() * 900000).toString()
            const hashedOtp = await bcrypt.hash(otp, 10);
            const order = new Order({
                userId: req.session.userId,
                productId: item.productId,
                sellerId: product.sellerId, 
                quantity: item.quantity,
                otp: hashedOtp
            });
            await order.save({ session });
            return order;
        }));
        await Cart.deleteMany({ userId: req.session.userId }).session(session);
        await session.commitTransaction();
        session.endSession();
        res.status(201).json({
            message: 'Orders placed successfully',
            orders
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Order placement error:', error);
        res.status(500).json({
            message: 'Error placing orders',
            error: error.message
        });
    }
});

app.post('/api/reviews/add', async (req, res) => {
    try {
        const { orderId, review } = req.body;
        const order = await Order.findById(orderId)
            .populate('sellerId')
            .populate('productId');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        await User.findByIdAndUpdate(
            order.sellerId._id,
            { $push: { reviews: review } }
        );

        res.status(200).json({ message: 'Review added successfully' });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ message: 'Error adding review' });
    }
});

app.post('/api/orders/:orderId/regenerate-otp', async (req, res) => {
    try {
        const { orderId } = req.params;
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(newOtp, 10);
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { otp: hashedOtp },
            { new: true }
        );
        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json({
            message: 'OTP regenerated successfully',
            otp: newOtp
        });
    } catch (error) {
        console.error('Error regenerating OTP:', error);
        res.status(500).json({ message: 'Error regenerating OTP' });
    }
});

app.get('/api/seller/undelivered-orders', async (req, res) => {
    try {
        const sellerId = req.session.userId;
        const undeliveredOrders = await Order.find({
            sellerId: sellerId,
            isDelivered: false
        }).populate('productId') .populate('userId');
        // console.log(undeliveredOrders);
        res.status(200).json(undeliveredOrders);
    } catch (error) {
        console.error('Error fetching undelivered orders:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/seller/confirm-delivery', async (req, res) => {
    const { orderId, otp } = req.body;
    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        const isMatch = await bcrypt.compare(otp, order.otp);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }
        order.isDelivered = true;
        await order.save();
        res.status(200).json({ message: 'Delivery confirmed successfully' });
    } catch (error) {
        console.error('Error confirming delivery:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/orders/bought', isAuthenticated, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.session.userId })
            .populate('productId') .populate('sellerId')
            .sort({ orderDate: -1 });
        // console.log('bought items',orders);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching bought orders:', error);
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
});

app.get('/api/orders/sold', isAuthenticated, async (req, res) => {
    try {
        const orders = await Order.find({ sellerId: req.session.userId, isDelivered: true })
            .populate('productId')
            .populate('userId')
            .sort({ orderDate: -1 });
        // console.log('sold items',orders);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching sold orders:', error);
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
});

app.use(express.static(path.join(__dirname, '../frontend/my-app/build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/my-app/build', 'index.html'));
});

const PORT = 3000
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});