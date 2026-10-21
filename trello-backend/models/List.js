// Purpose: Mongoose Schema & Model for Lists (Columns) in Kanban Board
const mongoose = require('mongoose');
const { Schema } = mongoose;

// List Schema define kar rahe hain
const ListSchema = new Schema({
    // Yeh list kis Board ke andar belong karti hai (Foreign key reference to Board model)
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'board',
        required: true
    },
    
    // List ka title ya naam (Jaise: "To Do", "Doing", "Completed")
    title: {
        type: String,
        required: true
    },
    
    // Position field - Drag and drop ya columns ki ordering/sorting ke liye
    position: {
        type: Number,
        default: 0
    },
    
    // List kab create hui thi uska timestamp
    date: {
        type: Date,
        default: Date.now
    }
});

// Is schema ko Mongoose model mein convert karke export kar rahe hain
module.exports = mongoose.model('list', ListSchema);