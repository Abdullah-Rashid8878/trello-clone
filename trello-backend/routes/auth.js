// Purpose: Express Router for User Authentication (Signup, Login, Get User, Update User)
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs'); // Password hashing ke liye
const jwt = require('jsonwebtoken'); // Authentication tokens generate karne ke liye
const { body, validationResult } = require('express-validator'); // Input data validation ke liye
const fetchuser = require('../middleware/fetchuser'); // Custom auth middleware
require('dotenv').config();

// JWT Secret key environment variables se load kar rahe hain
const JWT_SECRET = process.env.JWT_SECRET;


// ROUTE 1: Create a user using: POST "/api/auth/createuser". No login required

router.post('/createuser', [
    // Express Validator rules check kar rahe hain
    body('name', 'Enter a valid name').isLength({ min: 3 }),
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password must be at least 5 characters').isLength({ min: 5 }),
], async (req, res) => {
    let success = false;
    
    // Agar validation errors aate hain, toh bad request return karo
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }

    try {
        // Step 1: Check karo ki kya is email ke sath user already exist karta hai
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({ success, error: "Sorry a user with this email already exists" });
        }

        // Step 2: Bcrypt ka use karke secure salt aur hashed password generate karo
        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(req.body.password, salt);

        // Step 3: Naya user database mein create karo
        user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: secPass,
        });

        // Step 4: JWT payload prepare karo jisme user ka ID hoga
        const data = {
            user: {
                id: user.id
            }
        };

        // Step 5: JWT token sign karke client ko success response bhej do
        const authtoken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({ success, authtoken });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some Error occurred");
    }
});


// ROUTE 2: Authenticate a user using: POST "/api/auth/login". No login required

router.post('/login', [
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password cannot be blank').exists(),
], async (req, res) => {
    let success = false;
    
    // Validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
        // Step 1: Database mein email check karo
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success, error: "Please try to login with correct credentials" });
        }

        // Step 2: Entered password ko database ke hashed password ke sath compare karo
        const passwordCompare = await bcrypt.compare(password, user.password);
        if (!passwordCompare) {
            return res.status(400).json({ success, error: "Please try to login with correct credentials" });
        }

        // Step 3: JWT token generate karo agar credentials match ho jayein
        const data = {
            user: {
                id: user.id
            }
        };

        const authtoken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({ success, authtoken });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some Error occurred");
    }
});


// ROUTE 3: Get logged in user details using: POST "/api/auth/getuser". Login required

router.post('/getuser', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        // Password ko minus (-) karke baaki sari user details fetch kar rahe hain security ke liye
        const user = await User.findById(userId).select("-password");
        res.send(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some Error occurred");
    }
});


// ROUTE 4: Update user's name or password: PUT "/api/auth/updateuser". Login required

router.put('/updateuser', fetchuser, [
    body('name', 'Name must be at least 3 characters').optional().isLength({ min: 3 }),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, password } = req.body;
        const newUserData = {};
        if (name) newUserData.name = name;

        // Agar user password update karna chahta hai, toh naya password hash karo
        if (password) {
            const salt = await bcrypt.genSalt(10);
            newUserData.password = await bcrypt.hash(password, salt);
        }

        // User document ko update karke updated details return karo (password chhod kar)
        const user = await User.findByIdAndUpdate(req.user.id, { $set: newUserData }, { new: true }).select("-password");
        res.json({ success: true, user });
        
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some Error occurred");
    }
});

// Router module ko export kar rahe hain
module.exports = router;