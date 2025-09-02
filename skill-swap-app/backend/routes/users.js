const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middlewares/auth');
const upload = require('../config/multer');
const path = require('path');
const fs = require('fs');

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

// Upload profile picture - Protected
const uploadProfilePicture = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Get current user to check for existing profile picture
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete old profile picture if it exists
        if (currentUser.profilePicture) {
            const oldFilePath = path.join(__dirname, '../uploads/profile-pictures', currentUser.profilePicture);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        // Update user with new profile picture filename
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePicture: req.file.filename },
            { new: true }
        ).select('-password');

        res.json({
            message: 'Profile picture uploaded successfully',
            user: updatedUser,
            profilePictureUrl: `/api/users/profile-picture/${req.file.filename}`
        });
    } catch (error) {
        console.error('Upload profile picture error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get profile picture - Public
const getProfilePicture = async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '../uploads/profile-pictures', filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Profile picture not found' });
        }

        res.sendFile(filePath);
    } catch (error) {
        console.error('Get profile picture error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete profile picture - Protected
const deleteProfilePicture = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.profilePicture) {
            return res.status(400).json({ message: 'No profile picture to delete' });
        }

        // Delete file from filesystem
        const filePath = path.join(__dirname, '../uploads/profile-pictures', user.profilePicture);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Update user to remove profile picture
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePicture: null },
            { new: true }
        ).select('-password');

        res.json({
            message: 'Profile picture deleted successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Delete profile picture error:', error);
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
router.get('/profile-picture/:filename', getProfilePicture);

// Protected routes (require JWT token)
router.get('/me', auth, getCurrentUser);
router.put('/profile', auth, updateProfile);
router.post('/profile-picture', auth, upload.single('profilePicture'), uploadProfilePicture);
router.delete('/profile-picture', auth, deleteProfilePicture);

module.exports = router;
