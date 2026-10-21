// ==========================================
// Model: Card.js
// Purpose: Mongoose Schema & Model for Cards (Tasks) in Trello/Jira clone
// ==========================================

const mongoose = require('mongoose');

// Card Schema define kar rahe hain
const cardSchema = new mongoose.Schema({
    // Card ka title (Jaise: "Design Landing Page") - Yeh required hai
    title: {
        type: String,
        required: true
    },
    
    // Card ki detailed description ya notes - Default blank string rahegi
    description: {
        type: String,
        default: ""
    },
    
    // 1. Due Date Field - Task kab complete karna hai uska deadline date
    dueDate: {
        type: Date,
        default: null
    },
    
    // 2. Labels / Tags Field - Tasks ko categorise karne ke liye (Jaise: Urgent, Bug, Feature)
    labels: [
        {
            type: String
        }
    ],
    
    // 3. Board Field - Yeh card kis Board ke andar aata hai (Foreign key reference to Board model)
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board'
    },
    
    // 4. List Field - Yeh card kis List/Column ke andar hai (Jaise: To-Do, In-Progress, Done) - Required hai
    list: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'List',
        required: true
    },
    
    // 5. Attachments Field - Cards ke sath files/documents attach karne ke liye sub-document array
    attachments: [
        {
            filename: String,   // File ka asli naam (e.g., "screenshot.png")
            filepath: String,   // Server par file kahan stored hai uska path
            uploadedAt: { 
                type: Date, 
                default: Date.now // File kab upload hui thi uska timestamp
            }
        }
    ],
    
    // Card kab create hua tha uska automatic timestamp
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Is schema ko Mongoose model mein convert karke export kar rahe hain
module.exports = mongoose.model('Card', cardSchema);