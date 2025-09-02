const Message = require('../models/Message');
const User = require('../models/User');

// Send a message
const sendMessage = async (req, res) => {
    try {
        const { receiverId, content, messageType = 'text' } = req.body;
        const senderId = req.user.userId;

        // Check if users are matched
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if (!sender || !receiver) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify they are matched
        const areMatched = sender.matches.includes(receiverId) && receiver.matches.includes(senderId);
        if (!areMatched) {
            return res.status(403).json({ message: 'You can only message matched users' });
        }

        // Create message
        const message = new Message({
            sender: senderId,
            receiver: receiverId,
            content,
            messageType
        });

        await message.save();

        // Populate sender info for response
        await message.populate('sender', 'name');

        // Send real-time notification
        const io = req.app.get('io');
        if (io) {
            // Send the new message with complete information
            io.to(`user_${receiverId}`).emit('new_message', {
                type: 'new_message',
                message: {
                    id: message._id,
                    content: message.content,
                    messageType: message.messageType,
                    sender: {
                        id: sender._id,
                        name: sender.name
                    },
                    receiver: receiverId,
                    createdAt: message.createdAt
                }
            });
            
            // Update notification count for receiver
            const unreadMessages = await Message.countDocuments({
                receiver: receiverId,
                read: false
            });
            
            io.to(`user_${receiverId}`).emit('notification_update', {
                type: 'messages',
                count: unreadMessages
            });
        }

        res.status(201).json({
            message: 'Message sent successfully',
            data: message
        });

    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get conversation with a user
const getConversation = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId;

        // Check if users are matched
        const currentUser = await User.findById(currentUserId);
        const otherUser = await User.findById(userId);

        if (!currentUser || !otherUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify they are matched
        const areMatched = currentUser.matches.includes(userId) && otherUser.matches.includes(currentUserId);
        if (!areMatched) {
            return res.status(403).json({ message: 'You can only view conversations with matched users' });
        }

        // Get messages between users
        const messages = await Message.find({
            $or: [
                { sender: currentUserId, receiver: userId },
                { sender: userId, receiver: currentUserId }
            ]
        })
        .populate('sender', 'name')
        .populate('receiver', 'name')
        .sort({ createdAt: 1 })
        .limit(50);

        res.json(messages);

    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Mark messages as read
const markAsRead = async (req, res) => {
    try {
        const { senderId } = req.params;
        const receiverId = req.user.userId;

        await Message.updateMany(
            { sender: senderId, receiver: receiverId, read: false },
            { read: true }
        );
        
        // Send real-time notification count update
        const io = req.app.get('io');
        if (io) {
            const unreadMessages = await Message.countDocuments({
                receiver: receiverId,
                read: false
            });
            
            io.to(`user_${receiverId}`).emit('notification_update', {
                type: 'messages',
                count: unreadMessages
            });
        }

        res.json({ message: 'Messages marked as read' });

    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.userId;

        const unreadCount = await Message.aggregate([
            {
                $match: {
                    receiver: new require('mongoose').Types.ObjectId(userId),
                    read: false
                }
            },
            {
                $group: {
                    _id: '$sender',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json(unreadCount);

    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    sendMessage,
    getConversation,
    markAsRead,
    getUnreadCount
};


