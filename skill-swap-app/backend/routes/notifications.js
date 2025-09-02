const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const {
    getNotificationCounts,
    markMeetingNotificationsRead,
    markMessageNotificationsRead
} = require('../controllers/notificationController');

// @route   GET /api/notifications/counts
// @desc    Get notification counts for current user
// @access  Private
router.get('/counts', auth, getNotificationCounts);

// @route   PUT /api/notifications/meetings/read
// @desc    Mark meeting notifications as seen
// @access  Private
router.put('/meetings/read', auth, markMeetingNotificationsRead);

// @route   PUT /api/notifications/messages/read
// @desc    Mark message notifications as read
// @access  Private
router.put('/messages/read', auth, markMessageNotificationsRead);

module.exports = router;