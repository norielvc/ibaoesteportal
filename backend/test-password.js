const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testPassword() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/admin_dashboard';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Import the User model
    const User = require('./models/User');

    // Find the admin user
    const admin = await User.findOne({ email: 'admin@example.com' }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }

    console.log('✅ Admin user found');
    console.log('Email:', admin.email);
    console.log('Stored password hash:', admin.password);
    console.log('Password length:', admin.password.length);

    // Test password comparison
    const testPassword = 'admin123';
    console.log('\n🔍 Testing password:', testPassword);

    // Test with bcrypt directly
    const isValidDirect = await bcrypt.compare(testPassword, admin.password);
    console.log('Direct bcrypt.compare result:', isValidDirect);

    // Test with model method
    const isValidModel = await admin.comparePassword(testPassword);
    console.log('Model comparePassword result:', isValidModel);

    // Test with wrong password
    const isValidWrong = await admin.comparePassword('wrongpassword');
    console.log('Wrong password test:', isValidWrong);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testPassword();