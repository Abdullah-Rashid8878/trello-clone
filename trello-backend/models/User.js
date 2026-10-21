// Purpose: Mongoose Schema & Model for Application Users (Authentication)
const mongoose = require('mongoose');
const { Schema } = mongoose;

// User Schema define kar rahe hain
const UserSchema = new Schema({
    // User ka pura naam (Required field hai)
    name: {
        type: String,
        required: true
    },
    
    // User ki email address (Required aur unique honi chahiye taaki duplicate accounts na banein)
    email: {
        type: String,
        required: true,
        unique: true
    },
    
    // User ka password (Yeh hamesha bcrypt se hash karke save kiya jata hai production mein)
    password: {
        type: String,
        required: true
    },
    
    // Account kab create hua tha uska timestamp
    date: {
        type: Date,
        default: Date.now
    }
});

// Is schema ko Mongoose model ('user') mein convert karke export kar rahe hain
module.exports = mongoose.model('user', UserSchema);