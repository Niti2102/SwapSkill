const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middlewares/auth');

// Get all users (for skill matching) - Public
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get users by skills (for matching) - Public
const getUsersBySkills = async (req, res) => {
    try {
        const { skills } = req.query;
        if (!skills) {
            return res.status(400).json({ message: 'Skills parameter is required' });
        }

        const skillsArray = skills.split(',');
        const users = await User.find({
            skillsKnown: { $in: skillsArray }
        }).select('-password');

        res.json(users);
    } catch (error) {
        console.error('Get users by skills error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user profile - Protected
const updateProfile = async (req, res) => {
    try {
        const { name, skillsKnown, skillsWanted } = req.body;
        const userId = req.user.userId; // Get from JWT token

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, skillsKnown, skillsWanted },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(updatedUser);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get current user's profile - Protected
const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Public routes
router.get('/', getAllUsers);
router.get('/skills', getUsersBySkills);

// Protected routes (require JWT token)
router.get('/me', auth, getCurrentUser);
router.put('/profile', auth, updateProfile);

module.exports = router;
