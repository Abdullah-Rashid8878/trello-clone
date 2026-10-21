// Purpose: Verify JWT Token and attach user id to request object
const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT Secret key ko environment variables se load kar rahe hain security ke liye
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * fetchuser middleware function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const fetchuser = (req, res, next) => {
    // Step 1: Request headers se 'auth-token' ko fetch karo
    const token = req.header('auth-token');

    // Step 2: Check karo agar token exist hi nahi karta hai
    if (!token) {
        return res.status(401).send({ error: "Please authenticate using a valid token" });
    }

    try {
        // Step 3: Token ko verify karo JWT_SECRET aur jwt.verify() method ka use karke
        const data = jwt.verify(token, JWT_SECRET);

        // Step 4: Agar token valid hai, toh user data ko req.user mein save kar do
        req.user = data.user;

        // Step 5: next() function call karo taaki agla route handler/controller execute ho sake
        next();
        
    } catch (error) {
        // Agar token expire ho gaya ya invalid hai, toh catch block chalega
        return res.status(401).send({ error: "Please authenticate using a valid token" });
    }
};

// Is middleware ko export kar rahe hain taaki routes mein use kiya ja sake
module.exports = fetchuser;