const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skill-swap-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const sampleUsers = [
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'password123',
    skillsKnown: ['JavaScript', 'React', 'Cooking'],
    skillsWanted: ['Python', 'Painting', 'Guitar']
  },
  {
    name: 'Bob Smith',
    email: 'bob@example.com',
    password: 'password123',
    skillsKnown: ['Python', 'Painting', 'Guitar'],
    skillsWanted: ['JavaScript', 'React', 'Cooking']
  },
  {
    name: 'Carol Davis',
    email: 'carol@example.com',
    password: 'password123',
    skillsKnown: ['Java', 'Photography', 'Spanish'],
    skillsWanted: ['JavaScript', 'Cooking', 'Guitar']
  },
  {
    name: 'David Wilson',
    email: 'david@example.com',
    password: 'password123',
    skillsKnown: ['Cooking', 'Guitar', 'JavaScript'],
    skillsWanted: ['Java', 'Photography', 'Spanish']
  },
  {
    name: 'Eva Brown',
    email: 'eva@example.com',
    password: 'password123',
    skillsKnown: ['Painting', 'Spanish', 'React'],
    skillsWanted: ['Java', 'Photography', 'Python']
  }
];

const seedUsers = async () => {
  try {
    // Clear existing users (except the one you registered)
    await User.deleteMany({ email: { $in: sampleUsers.map(u => u.email) } });
    
    // Create sample users
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      
      await user.save();
      console.log(`Created user: ${userData.name} (${userData.email})`);
    }
    
    console.log('\n✅ Sample users created successfully!');
    console.log('\n📝 You can now test the matching system:');
    console.log('1. Register with your account');
    console.log('2. Go to Swipe page');
    console.log('3. You should see these sample users to swipe on');
    console.log('4. Try swiping right on users with complementary skills!');
    
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedUsers();


