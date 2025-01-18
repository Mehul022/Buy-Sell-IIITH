const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session'); // Add express-session
const MongoStore = require('connect-mongo'); // Add connect-mongo for session storage
const uuid = require('uuid');
const app = express();

const DB_URI = 'mongodb+srv://Mehul:Mehul293645@techmartiiith.47mlw.mongodb.net/?retryWrites=true&w=majority&appName=TechMartIIITh';
// Session configuration - Add this before other middleware
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
    origin: ['http://localhost:3001', 'http://localhost:3000'], // Allow both ports
    credentials: true
}));

// const RECAPTCHA_SECRET_KEY = '6LeL8boqAAAAADYNo6XHBvxhryPouo5HcPNMivab';

mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    age: { type: Number, required: true },
    contactNumber: { type: String, required: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ message: 'Please log in to continue' });
    }
};

app.post('/signup', async (req, res) => {
    const { firstName, lastName, email, age, contactNumber, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already registered.' });
        }

        const userId = uuid.v4();
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            userId,
            firstName,
            lastName,
            email,
            age,
            contactNumber,
            password: hashedPassword
        });

        await newUser.save();

        // Set session after successful signup
        req.session.userId = userId;

        res.status(201).json({ message: 'Signup successful!' });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({
            message: 'An error occurred during signup. Please try again.',
            details: error.message
        });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Set session after successful login
        req.session.userId = user.userId;

        res.status(200).json({
            message: 'Login successful!',
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'An error occurred during login.' });
    }
});

// New route to check session status
app.get('/check-auth', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.session.userId });
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

// New route for logout
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

// Add this to your server.js file

// Get user profile endpoint
app.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.session.userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Send user data without sensitive information
        res.json({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            age: user.age,
            contactNumber: user.contactNumber,
            userId: user.userId
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Error fetching profile data' });
    }
});

// Update user profile endpoint
app.put('/profile', isAuthenticated, async (req, res) => {
    try {
        const { firstName, lastName, email, age, contactNumber } = req.body;

        const user = await User.findOne({ userId: req.session.userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if email is being changed and if it's already in use
        if (email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email is already in use' });
            }
        }

        // Update user data
        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;
        user.age = age;
        user.contactNumber = contactNumber;

        await user.save();

        // Log the profile update
        await logUserActivity(req.session.userId, 'profile_update', {
            updatedFields: Object.keys(req.body)
        }, req);

        res.json({
            message: 'Profile updated successfully',
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                age: user.age,
                contactNumber: user.contactNumber,
                userId: user.userId
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile' });
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