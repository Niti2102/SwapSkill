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

                // Send real-time match notification to both users
                const io = req.app.get('io');
                if (io) {
                    // Notify current user
                    io.to(`user_${currentUserId}`).emit('match', {
                        type: 'new_match',
                        message: 'It\'s a match! 🎉',
                        matchedUser: {
                            id: targetUser._id,
                            name: targetUser.name,
                            skillsKnown: targetUser.skillsKnown,
                            skillsWanted: targetUser.skillsWanted
                        }
                    });

                    // Notify target user
                    io.to(`user_${targetUserId}`).emit('match', {
                        type: 'new_match',
                        message: 'It\'s a match! 🎉',
                        matchedUser: {
                            id: currentUser._id,
                            name: currentUser.name,
                            skillsKnown: currentUser.skillsKnown,
                            skillsWanted: currentUser.skillsWanted
                        }
                    });
                }

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

        console.log('\n=== 🔍 MATCH CHECK DEBUG ===');
        console.log(`Checking match between: ${user1.name} (ID: ${user1Id}) and ${user2.name} (ID: ${user2Id})`);
        console.log(`${user1.name} skills known:`, user1.skillsKnown);
        console.log(`${user1.name} skills wanted:`, user1.skillsWanted);
        console.log(`${user2.name} skills known:`, user2.skillsKnown);
        console.log(`${user2.name} skills wanted:`, user2.skillsWanted);

        // Ensure arrays exist
        const user1SkillsKnown = user1.skillsKnown || [];
        const user1SkillsWanted = user1.skillsWanted || [];
        const user2SkillsKnown = user2.skillsKnown || [];
        const user2SkillsWanted = user2.skillsWanted || [];

        // Check if user1's skills match user2's wanted skills
        const user1CanTeachUser2 = user1SkillsKnown.some(skill => 
            user2SkillsWanted.includes(skill)
        );

        // Check if user2's skills match user1's wanted skills
        const user2CanTeachUser1 = user2SkillsKnown.some(skill => 
            user1SkillsWanted.includes(skill)
        );

        console.log(`${user1.name} can teach ${user2.name}:`, user1CanTeachUser2);
        console.log(`${user2.name} can teach ${user1.name}:`, user2CanTeachUser1);

        // Match conditions:
        // 1. STRICT: Both users can teach each other (mutual benefit)
        // 2. LENIENT: At least one user can teach the other
        // 3. DEMO: Any right swipe is a match (for testing)
        
        // Using LENIENT condition for better user experience
        const isMatch = user1CanTeachUser2 || user2CanTeachUser1;
        
        console.log('🎯 Match result:', isMatch ? '✅ MATCH!' : '❌ No match');
        console.log('=== END MATCH CHECK ===\n');

        return isMatch;
    } catch (error) {
        console.error('❌ Match check error:', error);
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
        const currentUser = await User.findById(currentUserId);

        // Get actual matches (both users swiped right)
        const actualMatches = await User.find({
            _id: { $in: currentUser.matches }
        }).select('-password -swipes');

        // Get potential matches (you swiped right, skills are complementary)
        const rightSwipes = currentUser.swipes.filter(swipe => swipe.direction === 'right');
        const potentialMatches = [];

        for (const swipe of rightSwipes) {
            const targetUser = await User.findById(swipe.userId).select('-password -swipes');
            if (targetUser) {
                // Check if skills are complementary
                const user1CanTeachUser2 = currentUser.skillsKnown.some(skill => 
                    targetUser.skillsWanted.includes(skill)
                );
                const user2CanTeachUser1 = targetUser.skillsKnown.some(skill => 
                    currentUser.skillsWanted.includes(skill)
                );

                if (user1CanTeachUser2 && user2CanTeachUser1) {
                    potentialMatches.push({
                        ...targetUser.toObject(),
                        isPotentialMatch: true
                    });
                }
            }
        }

        // Combine actual matches and potential matches
        const allMatches = [...actualMatches, ...potentialMatches];
        
        console.log('Matches found:', {
            actualMatches: actualMatches.length,
            potentialMatches: potentialMatches.length,
            total: allMatches.length
        });

        res.json(allMatches);
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
