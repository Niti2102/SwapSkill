const User = require('../models/User');

// Handle user swipe (left or right)
const swipeUser = async (req, res) => {
    try {
        const { targetUserId, direction } = req.body;
        const currentUserId = req.user.userId;

        // Validate direction
        if (!['left', 'right'].includes(direction)) {
            return res.status(400).json({ message: 'Direction must be left or right' });
        }

        // Check if target user exists
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: 'Target user not found' });
        }

        // Check if already swiped
        const currentUser = await User.findById(currentUserId);
        const existingSwipe = currentUser.swipes.find(swipe => 
            swipe.userId.toString() === targetUserId
        );

        if (existingSwipe) {
            return res.status(400).json({ message: 'Already swiped on this user' });
        }

        // Add swipe to current user
        currentUser.swipes.push({
            userId: targetUserId,
            direction: direction
        });

        await currentUser.save();

        // If swiped right, check for mutual match
        if (direction === 'right') {
            const isMatch = await checkForMatch(currentUserId, targetUserId);
            
            if (isMatch) {
                // Add both users to each other's matches
                await User.findByIdAndUpdate(currentUserId, {
                    $addToSet: { matches: targetUserId }
                });
                
                await User.findByIdAndUpdate(targetUserId, {
                    $addToSet: { matches: currentUserId }
                });

                return res.json({
                    message: 'It\'s a match! 🎉',
                    isMatch: true,
                    matchedUser: {
                        id: targetUser._id,
                        name: targetUser.name,
                        skillsKnown: targetUser.skillsKnown,
                        skillsWanted: targetUser.skillsWanted
                    }
                });
            }
        }

        res.json({
            message: `Swiped ${direction}`,
            isMatch: false
        });

    } catch (error) {
        console.error('Swipe error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Check if two users have complementary skills (match)
const checkForMatch = async (user1Id, user2Id) => {
    try {
        const user1 = await User.findById(user1Id);
        const user2 = await User.findById(user2Id);

        console.log('Checking match between:', user1.name, 'and', user2.name);
        console.log('User1 skills known:', user1.skillsKnown);
        console.log('User1 skills wanted:', user1.skillsWanted);
        console.log('User2 skills known:', user2.skillsKnown);
        console.log('User2 skills wanted:', user2.skillsWanted);

        // Check if user1's skills match user2's wanted skills
        const user1CanTeachUser2 = user1.skillsKnown.some(skill => 
            user2.skillsWanted.includes(skill)
        );

        // Check if user2's skills match user1's wanted skills
        const user2CanTeachUser1 = user2.skillsKnown.some(skill => 
            user1.skillsWanted.includes(skill)
        );

        // Check if user2 has already swiped right on user1
        const user2SwipedRight = user2.swipes.find(swipe => 
            swipe.userId.toString() === user1Id && swipe.direction === 'right'
        );

        console.log('User1 can teach User2:', user1CanTeachUser2);
        console.log('User2 can teach User1:', user2CanTeachUser1);
        console.log('User2 swiped right on User1:', !!user2SwipedRight);

        const isMatch = user1CanTeachUser2 && user2CanTeachUser1 && user2SwipedRight;
        console.log('Final match result:', isMatch);

        return isMatch;
    } catch (error) {
        console.error('Match check error:', error);
        return false;
    }
};

// Get users to swipe on (excluding already swiped and matched users)
const getUsersToSwipe = async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const currentUser = await User.findById(currentUserId);

        // Get IDs of users already swiped on
        const swipedUserIds = currentUser.swipes.map(swipe => swipe.userId);
        
        // Get IDs of matched users
        const matchedUserIds = currentUser.matches;

        // Get users to swipe on (exclude self, swiped, and matched users)
        const usersToSwipe = await User.find({
            _id: { 
                $nin: [currentUserId, ...swipedUserIds, ...matchedUserIds] 
            }
        }).select('-password -swipes -matches');

        res.json(usersToSwipe);
    } catch (error) {
        console.error('Get users to swipe error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user's matches
const getMatches = async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const currentUser = await User.findById(currentUserId).populate('matches', '-password -swipes');

        res.json(currentUser.matches);
    } catch (error) {
        console.error('Get matches error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    swipeUser,
    getUsersToSwipe,
    getMatches
};
