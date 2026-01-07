const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

// Sample users data
const sampleUsers = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    status: 'active',
    loginCount: 25,
    lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  },
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'user@example.com',
    password: 'user123',
    role: 'user',
    status: 'active',
    loginCount: 12,
    lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: 'Password123',
    role: 'user',
    status: 'active',
    loginCount: 8,
    lastLogin: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  },
  {
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@example.com',
    password: 'Password123',
    role: 'user',
    status: 'active',
    loginCount: 15,
    lastLogin: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
  },
  {
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah.wilson@example.com',
    password: 'Password123',
    role: 'user',
    status: 'inactive',
    loginCount: 3,
    lastLogin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
  },
  {
    firstName: 'David',
    lastName: 'Brown',
    email: 'david.brown@example.com',
    password: 'Password123',
    role: 'admin',
    status: 'active',
    loginCount: 45,
    lastLogin: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
  },
  {
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@example.com',
    password: 'Password123',
    role: 'user',
    status: 'suspended',
    loginCount: 2,
    lastLogin: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 days ago
  },
  {
    firstName: 'Robert',
    lastName: 'Miller',
    email: 'robert.miller@example.com',
    password: 'Password123',
    role: 'user',
    status: 'active',
    loginCount: 22,
    lastLogin: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
  },
  {
    firstName: 'Lisa',
    lastName: 'Anderson',
    email: 'lisa.anderson@example.com',
    password: 'Password123',
    role: 'user',
    status: 'active',
    loginCount: 7,
    lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
  },
  {
    firstName: 'James',
    lastName: 'Taylor',
    email: 'james.taylor@example.com',
    password: 'Password123',
    role: 'user',
    status: 'active',
    loginCount: 18,
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  }
];

// Generate additional users with varied creation dates
const generateAdditionalUsers = () => {
  const additionalUsers = [];
  const firstNames = ['Alex', 'Chris', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage'];
  const lastNames = ['Garcia', 'Martinez', 'Lopez', 'Gonzalez', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen'];
  
  for (let i = 0; i < 20; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    
    // Random creation date within the last 6 months
    const createdAt = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
    
    additionalUsers.push({
      firstName,
      lastName,
      email,
      password: 'Password123',
      role: Math.random() > 0.9 ? 'admin' : 'user',
      status: Math.random() > 0.8 ? (Math.random() > 0.5 ? 'inactive' : 'suspended') : 'active',
      loginCount: Math.floor(Math.random() * 50),
      lastLogin: new Date(createdAt.getTime() + Math.random() * (Date.now() - createdAt.getTime())),
      createdAt
    });
  }
  
  return additionalUsers;
};

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/admin_dashboard');

    console.log('✅ Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Combine sample users with additional generated users
    const allUsers = [...sampleUsers, ...generateAdditionalUsers()];

    // Create users (let the model handle password hashing)
    // Insert users with different creation dates
    for (const userData of allUsers) {
      const user = new User(userData);
      if (userData.createdAt) {
        user.createdAt = userData.createdAt;
      }
      await user.save();
    }

    console.log(`✅ Successfully seeded ${allUsers.length} users`);
    console.log('\n📋 Default Login Credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('User: user@example.com / user123');
    console.log('\n🎯 User Statistics:');
    
    const stats = await User.getStats();
    console.log(`Total Users: ${stats.totalUsers}`);
    console.log(`Active Users: ${stats.activeUsers}`);
    console.log(`Admin Users: ${stats.adminUsers}`);
    console.log(`Regular Users: ${stats.regularUsers}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();