const Meeting = require('../models/Meeting');
const User = require('../models/User');

// Create a new meeting request
const createMeeting = async (req, res) => {
    try {
        const {
            participantId,
            title,
            description,
            skillToTeach,
            skillToLearn,
            scheduledDate,
            duration = 60,
            meetingType = 'video_call',
            location
        } = req.body;

        const initiatorId = req.user.userId;

        // Check if users are matched
        const initiator = await User.findById(initiatorId);
        const participant = await User.findById(participantId);

        if (!initiator || !participant) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify they are matched
        const areMatched = initiator.matches.includes(participantId) && participant.matches.includes(initiatorId);
        if (!areMatched) {
            return res.status(403).json({ message: 'You can only schedule meetings with matched users' });
        }

        // Validate scheduled date is in the future
        const meetingDate = new Date(scheduledDate);
        if (meetingDate <= new Date()) {
            return res.status(400).json({ message: 'Meeting date must be in the future' });
        }

        // Create meeting
        const meeting = new Meeting({
            initiator: initiatorId,
            participant: participantId,
            title,
            description,
            skillToTeach,
            skillToLearn,
            scheduledDate: meetingDate,
            duration,
            meetingType,
            location
        });

        await meeting.save();

        // Populate user info for response
        await meeting.populate('initiator', 'name skillsKnown skillsWanted');
        await meeting.populate('participant', 'name skillsKnown skillsWanted');

        // Send real-time notification to participant
        const io = req.app.get('io');
        if (io) {
            // Notify participant about new meeting request
            io.to(`user_${participantId}`).emit('meeting_request', {
                type: 'meeting_request',
                meeting: {
                    id: meeting._id,
                    title: meeting.title,
                    skillToTeach: meeting.skillToTeach,
                    skillToLearn: meeting.skillToLearn,
                    scheduledDate: meeting.scheduledDate,
                    initiator: {
                        id: initiator._id,
                        name: initiator.name
                    }
                }
            });
            
            // Send notification count update to participant
            const pendingMeetings = await Meeting.countDocuments({
                participant: participantId,
                status: 'pending'
            });
            
            io.to(`user_${participantId}`).emit('notification_update', {
                type: 'meetings',
                count: pendingMeetings
            });
        }

        res.status(201).json({
            message: 'Meeting request sent successfully',
            meeting
        });

    } catch (error) {
        console.error('Create meeting error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user's meetings (as initiator or participant)
const getMyMeetings = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { status } = req.query;

        let query = {
            $or: [
                { initiator: userId },
                { participant: userId }
            ]
        };

        if (status) {
            query.status = status;
        }

        const meetings = await Meeting.find(query)
            .populate('initiator', 'name skillsKnown skillsWanted')
            .populate('participant', 'name skillsKnown skillsWanted')
            .sort({ scheduledDate: 1 });

        res.json(meetings);

    } catch (error) {
        console.error('Get meetings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Accept a meeting request
const acceptMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const userId = req.user.userId;

        const meeting = await Meeting.findById(meetingId);

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        // Check if user is the participant
        if (meeting.participant.toString() !== userId) {
            return res.status(403).json({ message: 'You can only accept meetings sent to you' });
        }

        if (meeting.status !== 'pending') {
            return res.status(400).json({ message: 'Meeting is not pending' });
        }

        meeting.status = 'accepted';
        await meeting.save();

        // Send real-time notification to initiator
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${meeting.initiator}`).emit('meeting_accepted', {
                type: 'meeting_accepted',
                meeting: {
                    id: meeting._id,
                    title: meeting.title,
                    scheduledDate: meeting.scheduledDate
                }
            });
            
            // Update notification counts for both users
            const pendingMeetingsParticipant = await Meeting.countDocuments({
                participant: userId,
                status: 'pending'
            });
            
            io.to(`user_${userId}`).emit('notification_update', {
                type: 'meetings',
                count: pendingMeetingsParticipant
            });
        }

        res.json({
            message: 'Meeting accepted successfully',
            meeting
        });

    } catch (error) {
        console.error('Accept meeting error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Decline a meeting request
const declineMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const userId = req.user.userId;

        const meeting = await Meeting.findById(meetingId);

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        // Check if user is the participant
        if (meeting.participant.toString() !== userId) {
            return res.status(403).json({ message: 'You can only decline meetings sent to you' });
        }

        if (meeting.status !== 'pending') {
            return res.status(400).json({ message: 'Meeting is not pending' });
        }

        meeting.status = 'declined';
        await meeting.save();

        // Send real-time notification to initiator
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${meeting.initiator}`).emit('meeting_declined', {
                type: 'meeting_declined',
                meeting: {
                    id: meeting._id,
                    title: meeting.title
                }
            });
            
            // Update notification counts for participant
            const pendingMeetingsParticipant = await Meeting.countDocuments({
                participant: userId,
                status: 'pending'
            });
            
            io.to(`user_${userId}`).emit('notification_update', {
                type: 'meetings',
                count: pendingMeetingsParticipant
            });
        }

        res.json({
            message: 'Meeting declined successfully',
            meeting
        });

    } catch (error) {
        console.error('Decline meeting error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Cancel a meeting
const cancelMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const userId = req.user.userId;

        const meeting = await Meeting.findById(meetingId);

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        // Check if user is the initiator or participant
        if (meeting.initiator.toString() !== userId && meeting.participant.toString() !== userId) {
            return res.status(403).json({ message: 'You can only cancel your own meetings' });
        }

        if (meeting.status === 'completed' || meeting.status === 'cancelled') {
            return res.status(400).json({ message: 'Meeting cannot be cancelled' });
        }

        meeting.status = 'cancelled';
        await meeting.save();

        // Send real-time notification to the other user
        const io = req.app.get('io');
        if (io) {
            const otherUserId = meeting.initiator.toString() === userId ? meeting.participant : meeting.initiator;
            io.to(`user_${otherUserId}`).emit('meeting_cancelled', {
                type: 'meeting_cancelled',
                meeting: {
                    id: meeting._id,
                    title: meeting.title
                }
            });
            
            // Update notification counts for both users
            const pendingMeetingsOther = await Meeting.countDocuments({
                participant: otherUserId,
                status: 'pending'
            });
            
            const pendingMeetingsCurrent = await Meeting.countDocuments({
                participant: userId,
                status: 'pending'
            });
            
            io.to(`user_${otherUserId}`).emit('notification_update', {
                type: 'meetings',
                count: pendingMeetingsOther
            });
            
            io.to(`user_${userId}`).emit('notification_update', {
                type: 'meetings',
                count: pendingMeetingsCurrent
            });
        }

        res.json({
            message: 'Meeting cancelled successfully',
            meeting
        });

    } catch (error) {
        console.error('Cancel meeting error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Complete a meeting
const completeMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const userId = req.user.userId;

        const meeting = await Meeting.findById(meetingId);

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        // Check if user is the initiator or participant
        if (meeting.initiator.toString() !== userId && meeting.participant.toString() !== userId) {
            return res.status(403).json({ message: 'You can only complete your own meetings' });
        }

        if (meeting.status !== 'accepted') {
            return res.status(400).json({ message: 'Meeting must be accepted to complete' });
        }

        meeting.status = 'completed';
        await meeting.save();

        res.json({
            message: 'Meeting completed successfully',
            meeting
        });

    } catch (error) {
        console.error('Complete meeting error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createMeeting,
    getMyMeetings,
    acceptMeeting,
    declineMeeting,
    cancelMeeting,
    completeMeeting
};


