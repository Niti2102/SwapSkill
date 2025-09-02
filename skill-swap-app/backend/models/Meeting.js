const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
    {
        initiator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        participant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        skillToTeach: {
            type: String,
            required: true
        },
        skillToLearn: {
            type: String,
            required: true
        },
        scheduledDate: {
            type: Date,
            required: true
        },
        duration: {
            type: Number, // in minutes
            default: 60
        },
        meetingType: {
            type: String,
            enum: ['video_call', 'in_person', 'chat_session'],
            default: 'video_call'
        },
        location: {
            type: String,
            trim: true
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined', 'completed', 'cancelled'],
            default: 'pending'
        },
        meetingLink: {
            type: String,
            trim: true
        },
        notes: {
            type: String,
            trim: true
        }
    },
    { timestamps: true }
);

// Index for efficient querying
meetingSchema.index({ initiator: 1, participant: 1, scheduledDate: 1 });
meetingSchema.index({ status: 1, scheduledDate: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);


