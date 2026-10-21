const mongoose = require('mongoose');
const { Schema } = mongoose;

// board schema - har board ek user ke under aata hai (owner)
const BoardSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },

    title: {
        type: String,
        required: true
    },

    description: {
        type: String,
        default: ""
    },

    // members ko role ke sath store kar rahe hain - editor board edit kar sakta hai, viewer sirf dekh sakta hai
    members: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user',
                required: true
            },
            role: {
                type: String,
                enum: ['Editor', 'Viewer'],
                default: 'Editor'
            }
        }
    ],

    // kisne kya action liya, uska chota sa log
    activityLog: [
        {
            action: {
                type: String,
                required: true
            },
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user'
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ],

    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('board', BoardSchema);