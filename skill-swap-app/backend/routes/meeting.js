const express = require('express');
const router = express.Router();
const {
    createMeeting,
    getMyMeetings,
    acceptMeeting,
    declineMeeting,
    cancelMeeting,
    completeMeeting
} = require('../controllers/meetingController');
const auth = require('../middlewares/auth');

// All meeting routes require authentication
router.use(auth);

// Create a new meeting request
router.post('/create', createMeeting);

// Get user's meetings
router.get('/my-meetings', getMyMeetings);

// Accept a meeting request
router.put('/accept/:meetingId', acceptMeeting);

// Decline a meeting request
router.put('/decline/:meetingId', declineMeeting);

// Cancel a meeting
router.put('/cancel/:meetingId', cancelMeeting);

// Complete a meeting
router.put('/complete/:meetingId', completeMeeting);

module.exports = router;


