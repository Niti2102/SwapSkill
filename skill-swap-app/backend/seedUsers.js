const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skill-swap-app', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`🔗 MongoDB Connected: ${conn.connection.host}`);
    console.log(`📄 Database Name: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

const sampleUsers = [
  {
    name: 'Nitish M',
    email: 'nitishm.2102@gmail.com',
    password: 'password123',
    skillsKnown: ['JavaScript', 'React', 'Cooking'],
    skillsWanted: ['Python', 'Painting', 'Guitar']
  },
  {
    name: 'Nivethaa M',
    email: 'nivethaa0310@gmail.com',
    password: 'password123',
    skillsKnown: ['Python', 'Painting', 'Guitar'],
    skillsWanted: ['JavaScript', 'React', 'Cooking']
  },
  {
    name: 'Malai',
    email: 'malaitkm@gmail.com',
    password: 'password123',
    skillsKnown: ['Java', 'Photography', 'Spanish'],
    skillsWanted: ['JavaScript', 'Cooking', 'Guitar']
  },
  {
    name: 'Rukkumani',
    email: 'rukku@gmail.com',
    password: 'password123',
    skillsKnown: ['Cooking', 'Guitar', 'JavaScript'],
    skillsWanted: ['Java', 'Photography', 'Spanish']
  },
  {
    name: 'Rocky',
    email: 'rocky@gmail.com',
    password: 'password123',
    skillsKnown: ['Painting', 'Spanish', 'React'],
    skillsWanted: ['Java', 'Photography', 'Python']
  },
  {
    name: 'Anand',
    email: 'anand@gmail.com',
    password: 'password123',
    skillsKnown: ['Python', 'Guitar', 'Photography'],
    skillsWanted: ['JavaScript', 'React', 'Cooking']
  },
  {
    name: 'Divya',
    email: 'divya@gmail.com',
    password: 'password123',
    skillsKnown: ['JavaScript', 'Cooking', 'Spanish'],
    skillsWanted: ['Python', 'Guitar', 'React']
  },
  {
    name: 'Hari',
    email: 'hari@gmail.com',
    password: 'password123',
    skillsKnown: ['React', 'Photography', 'Python'],
    skillsWanted: ['JavaScript', 'Cooking', 'Spanish']
  },
  {
    name: 'Meena',
    email: 'meena@gmail.com',
    password: 'password123',
    skillsKnown: ['Java', 'Cooking', 'React'],
    skillsWanted: ['Spanish', 'Python', 'Painting']
  },
  {
    name: 'Suresh',
    email: 'suresh@gmail.com',
    password: 'password123',
    skillsKnown: ['Guitar', 'JavaScript', 'Painting'],
    skillsWanted: ['Java', 'Photography', 'React']
  },
  {
    name: 'Priya',
    email: 'priya@gmail.com',
    password: 'password123',
    skillsKnown: ['Photography', 'Python', 'React'],
    skillsWanted: ['Cooking', 'Spanish', 'Java']
  },
  {
    name: 'Arjun',
    email: 'arjun@gmail.com',
    password: 'password123',
    skillsKnown: ['Cooking', 'JavaScript', 'Guitar'],
    skillsWanted: ['Python', 'React', 'Painting']
  },
  {
    name: 'Sneha',
    email: 'sneha@gmail.com',
    password: 'password123',
    skillsKnown: ['Spanish', 'Painting', 'JavaScript'],
    skillsWanted: ['Python', 'Photography', 'React']
  },
  {
    name: 'Vikram',
    email: 'vikram@gmail.com',
    password: 'password123',
    skillsKnown: ['Java', 'Python', 'Cooking'],
    skillsWanted: ['React', 'Spanish', 'Photography']
  },
  {
    name: 'Aishwarya',
    email: 'aish@gmail.com',
    password: 'password123',
    skillsKnown: ['React', 'Guitar', 'Photography'],
    skillsWanted: ['Python', 'Cooking', 'Spanish']
  }
];

const seedUsers = async () => {
  console.log('🌱 Starting user seeding process...');
  
  try {
    await connectDB();
    console.log('🔍 User model loaded:', !!User);
    const existingUsers = await User.find();
    console.log(`📊 Current users in database: ${existingUsers.length}`);
    const deleteResult = await User.deleteMany({ email: { $in: sampleUsers.map(u => u.email) } });
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} existing sample users`);
    console.log('👥 Creating new sample users...');
    for (let i = 0; i < sampleUsers.length; i++) {
      const userData = sampleUsers[i];
      console.log(`🔄 Processing user ${i + 1}/${sampleUsers.length}: ${userData.name}`); 
      try {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        console.log(`  ✅ Password hashed for ${userData.name}`);
        const user = new User({
          ...userData,
          password: hashedPassword
        });
        await user.validate();
        console.log(`  ✅ User validation passed for ${userData.name}`);
        const savedUser = await user.save();
        console.log(`  ✅ User saved with ID: ${savedUser._id}`);
        console.log(`     Created user: ${userData.name} (${userData.email})`);
        
      } catch (userError) {
        console.error(`  ❌ Error creating user ${userData.name}:`, userError.message);
        if (userError.errors) {
          Object.keys(userError.errors).forEach(key => {
            console.error(`    - ${key}: ${userError.errors[key].message}`);
          });
        }
      }
    }
    const finalUsers = await User.find();
    console.log(`📊 Final user count in database: ${finalUsers.length}`);
    
    const sampleUserEmails = sampleUsers.map(u => u.email);
    const createdSampleUsers = await User.find({ email: { $in: sampleUserEmails } });
    console.log(`🎯 Sample users actually created: ${createdSampleUsers.length}`);
    
    if (createdSampleUsers.length > 0) {
      console.log('\n✅ Sample users created successfully!');
      console.log('\n📝 You can now test the matching system:');
      console.log('1. Register with your account');
      console.log('2. Go to Swipe page');
      console.log('3. You should see these sample users to swipe on');
      console.log('4. Try swiping right on users with complementary skills!');
    } else {
      console.log('\n⚠️ No sample users were created - please check the errors above');
    }
    
  } catch (error) {
    console.error('❌ Error in seeding process:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  } finally {
    console.log('🔌 Closing database connection...');
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
};

seedUsers();


