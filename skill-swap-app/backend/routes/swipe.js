const express = require('express');
const router = express.Router();
const { swipeUser, getUsersToSwipe, getMatches } = require('../controllers/swipeController');
const auth = require('../middlewares/auth');

// All swipe routes require authentication
router.use(auth);

// Swipe on a user (left or right)
router.post('/swipe', swipeUser);

// Get users available for swiping
router.get('/users', getUsersToSwipe);

// Get user's matches
router.get('/matches', getMatches);

module.exports = router;
