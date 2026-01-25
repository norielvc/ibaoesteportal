const bcrypt = require('bcryptjs');
const { supabase } = require('../services/supabaseClient');
require('dotenv').config();

const sampleUsers = [
  {
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    password: 'admin123',
    role: 'admin',
    status: 'active'
  },
  {
    email: 'user@example.com',
    first_name: 'John',
    last_name: 'Doe',
    password: 'user123',
    role: 'user',
    status: 'active'
  },
  {
    email: 'jane.smith@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    password: 'Password123',
    role: 'user',
    status: 'active'
  },
  {
    email: 'mike.johnson@example.com',
    first_name: 'Mike',
    last_name: 'Johnson',
    password: 'Password123',
    role: 'user',
    status: 'active'
  },
  {
    email: 'sarah.wilson@example.com',
    first_name: 'Sarah',
    last_name: 'Wilson',
    password: 'Password123',
    role: 'user',
    status: 'inactive'
  },
  {
    email: 'david.brown@example.com',
    first_name: 'David',
    last_name: 'Brown',
    password: 'Password123',
    role: 'admin',
    status: 'active'
  }
];

const seedDatabase = async () => {
  try {
    console.log('🔗 Connecting to Supabase...');

    // Clear existing users
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('Error clearing users:', deleteError);
    } else {
      console.log('🗑️  Cleared existing users');
    }

    // Hash passwords and insert users
    const usersToInsert = await Promise.all(
      sampleUsers.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 12);
        return {
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          password_hash: hashedPassword,
          role: user.role,
          status: user.status
        };
      })
    );

    const { data, error } = await supabase
      .from('users')
      .insert(usersToInsert)
      .select();

    if (error) {
      console.error('❌ Error seeding database:', error);
      process.exit(1);
    }

    console.log(`✅ Successfully seeded ${data.length} users`);
    console.log('\n📋 Default Login Credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('User: user@example.com / user123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedDatabase();