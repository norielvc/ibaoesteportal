const mongoose = require('mongoose');
require('dotenv').config();

// Connect and check users
async function checkUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/admin_dashboard';
    console.log('🔗 Connecting to:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      password: String,
      role: String,
      status: String
    }));

    const users = await User.find({}, 'firstName lastName email role status');
    console.log('\n📋 Users in database:');
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      users.forEach(user => {
        console.log(`- ${user.email} (${user.role}) - ${user.firstName} ${user.lastName} [${user.status}]`);
      });
    }

    const admin = await User.findOne({ email: 'admin@example.com' });
    if (admin) {
      console.log('\n✅ Admin user found:', admin.email);
      console.log('   Status:', admin.status);
      console.log('   Role:', admin.role);
    } else {
      console.log('\n❌ Admin user not found');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsers();