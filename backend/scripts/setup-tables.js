const supabase = require('../services/supabaseClient');

async function setupTables() {
  console.log('🚀 Setting up Supabase tables...');

  try {
    // Create facilities table
    console.log('📋 Creating facilities table...');
    const { error: facilitiesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS facilities (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          icon VARCHAR(50) DEFAULT 'Building2',
          color VARCHAR(50) DEFAULT 'bg-blue-500',
          images TEXT[] DEFAULT ARRAY['/background.jpg'],
          features TEXT[] DEFAULT ARRAY[]::TEXT[],
          order_index INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (facilitiesError) {
      console.error('❌ Error creating facilities table:', facilitiesError);
    } else {
      console.log('✅ Facilities table created successfully');
    }

    // Create events table
    console.log('📋 Creating events table...');
    const { error: eventsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS events (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          date VARCHAR(100),
          image TEXT DEFAULT '/background.jpg',
          order_index INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (eventsError) {
      console.error('❌ Error creating events table:', eventsError);
    } else {
      console.log('✅ Events table created successfully');
    }

    // Insert default facilities
    console.log('📋 Inserting default facilities...');
    const { error: insertFacilitiesError } = await supabase
      .from('facilities')
      .insert([
        {
          name: 'Health Center',
          description: 'Primary healthcare services for residents',
          icon: 'Heart',
          color: 'bg-red-500',
          images: ['/background.jpg', '/background.jpg', '/background.jpg'],
          features: ['Free Checkups', 'Vaccination', 'First Aid'],
          order_index: 0
        },
        {
          name: 'Multi-purpose Hall',
          description: 'Events, meetings, and community gatherings',
          icon: 'Building2',
          color: 'bg-blue-500',
          images: ['/background.jpg', '/background.jpg', '/background.jpg'],
          features: ['500 Capacity', 'AC Equipped', 'Stage'],
          order_index: 1
        },
        {
          name: 'Daycare Center',
          description: 'Early childhood education and care',
          icon: 'Baby',
          color: 'bg-pink-500',
          images: ['/background.jpg', '/background.jpg', '/background.jpg'],
          features: ['Ages 3-5', 'Free Education', 'Meals'],
          order_index: 2
        },
        {
          name: 'Barangay Hall',
          description: 'Administrative services and assistance',
          icon: 'Home',
          color: 'bg-green-500',
          images: ['/background.jpg', '/background.jpg', '/background.jpg'],
          features: ['Documents', 'Assistance', 'Info Desk'],
          order_index: 3
        },
        {
          name: 'Sports Complex',
          description: 'Basketball court and fitness area',
          icon: 'Award',
          color: 'bg-orange-500',
          images: ['/background.jpg', '/background.jpg', '/background.jpg'],
          features: ['Basketball', 'Volleyball', 'Gym'],
          order_index: 4
        }
      ]);

    if (insertFacilitiesError) {
      console.error('❌ Error inserting facilities:', insertFacilitiesError);
    } else {
      console.log('✅ Default facilities inserted successfully');
    }

    // Insert default events
    console.log('📋 Inserting default events...');
    const { error: insertEventsError } = await supabase
      .from('events')
      .insert([
        {
          title: 'Barangay Clean-Up Drive 2026',
          description: 'Join us this Saturday for our monthly community clean-up initiative. Together, we can keep Iba O\' Este beautiful!',
          date: 'January 5, 2026',
          image: '/background.jpg',
          order_index: 0
        },
        {
          title: 'Free Medical Mission',
          description: 'Free check-ups, medicines, and health consultations for all residents. Bring your Barangay ID.',
          date: 'January 10, 2026',
          image: '/background.jpg',
          order_index: 1
        },
        {
          title: 'Livelihood Training Program',
          description: 'Register now for free skills training in food processing, handicrafts, and more!',
          date: 'January 15, 2026',
          image: '/background.jpg',
          order_index: 2
        }
      ]);

    if (insertEventsError) {
      console.error('❌ Error inserting events:', insertEventsError);
    } else {
      console.log('✅ Default events inserted successfully');
    }

    console.log('🎉 Setup completed successfully!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupTables();