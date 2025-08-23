const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        skillsKnown: [String],
        skillsWanted: [String],
        swipes: [{
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            direction: { type: String, enum: ['left', 'right'] },
        }],
        matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);


