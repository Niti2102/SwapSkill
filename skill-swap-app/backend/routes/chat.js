const express = require('express');
const router = express.Router();
const { sendMessage, getConversation, markAsRead, getUnreadCount } = require('../controllers/chatController');
const auth = require('../middlewares/auth');

// All chat routes require authentication
router.use(auth);

// Send a message
router.post('/send', sendMessage);

// Get conversation with a user
router.get('/conversation/:userId', getConversation);

// Mark messages as read
router.put('/read/:senderId', markAsRead);

// Get unread message count
router.get('/unread', getUnreadCount);

module.exports = router;


