// Purpose: Mongoose Schema & Model for Board Invitations
const mongoose = require('mongoose');
const { Schema } = mongoose;
const crypto = require('crypto'); // Node.js ka built-in crypto module secure token generate karne ke liye

// Invite Schema define kar rahe hain
const InviteSchema = new Schema({
    // Jisko invitation bheja ja raha hai uski email address
    email: {
        type: String,
        required: true
    },
    
    // Yeh invitation kis Board ke liye hai (Foreign key reference to Board model)
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'board',
        required: true
    },
    
    // Yeh invitation kis User ne bheja hai (Foreign key reference to User model)
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    
    // User ko board par kya permissions milengi (Role-based access control)
    role: {
        type: String,
        enum: ['Editor', 'Viewer'], // Sirf yehi do roles allow honge
        default: 'Editor'
    },
    
    // Unique secure token jo email link mein bheja jayega verification ke liye
    token: {
        type: String,
        // Default function ke through crypto se 20 bytes ka random hex string generate ho raha hai
        default: () => crypto.randomBytes(20).toString('hex'),
        unique: true
    },
    
    // Invitation kab create hua tha uska timestamp
    date: {
        type: Date,
        default: Date.now
    }
});

// Is schema ko Mongoose model mein convert karke export kar rahe hain
module.exports = mongoose.model('invite', InviteSchema);