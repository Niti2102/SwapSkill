const Meeting = require('../models/Meeting');
const Message = require('../models/Message');

// Get notification counts for a user
const getNotificationCounts = async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log('📊 Getting notification counts for user:', userId);

        // Count pending meetings where user is participant (not organizer)
        const pendingMeetings = await Meeting.countDocuments({
            participant: userId,
            status: 'pending'
        });
        console.log('📅 Pending meetings for user:', pendingMeetings);

        // Count unread messages where user is receiver
        const unreadMessages = await Message.countDocuments({
            receiver: userId,
            read: false
        });
        console.log('📨 Unread messages for user:', unreadMessages);

        const result = {
            meetings: pendingMeetings,
            messages: unreadMessages
        };
        
        console.log('📊 Final notification counts:', result);
        res.json(result);

    } catch (error) {
        console.error('❌ Get notification counts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Mark meeting notifications as seen (when user visits meetings page)
const markMeetingNotificationsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // This could update a separate notification table if needed
        // For now, we'll just return success as the counts are calculated dynamically
        
        res.json({ message: 'Meeting notifications marked as seen' });

    } catch (error) {
        console.error('Mark meeting notifications read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Mark message notifications as seen (when user visits chat page)
const markMessageNotificationsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { chatPartnerId } = req.body;

        if (chatPartnerId) {
            // Mark specific conversation messages as read
            await Message.updateMany({
                receiver: userId,
                sender: chatPartnerId,
                read: false
            }, {
                read: true
            });
        } else {
            // Mark all messages as read
            await Message.updateMany({
                receiver: userId,
                read: false
            }, {
                read: true
            });
        }

        res.json({ message: 'Message notifications marked as read' });

    } catch (error) {
        console.error('Mark message notifications read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getNotificationCounts,
    markMeetingNotificationsRead,
    markMessageNotificationsRead
};