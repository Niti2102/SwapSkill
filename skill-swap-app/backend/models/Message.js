const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        messageType: {
            type: String,
            enum: ['text', 'meeting_request', 'skill_offer'],
            default: 'text'
        },
        read: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// Index for efficient querying of conversations
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);


