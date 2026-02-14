const { supabase } = require('../services/supabaseClient');

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

    // Create barangay_officials table
    console.log('📋 Creating barangay_officials table...');
    const { error: officialsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS barangay_officials (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          position VARCHAR(100) NOT NULL,
          position_type VARCHAR(50) NOT NULL,
          committee VARCHAR(255),
          description TEXT,
          order_index INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (officialsError) {
      console.error('❌ Error creating barangay_officials table:', officialsError);
    } else {
      console.log('✅ Barangay officials table created successfully');
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

    // Insert default events sparingly
    console.log('📋 Checking for existing events...');
    const { count, error: countError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });

    if (!countError && (count === 0 || count === null)) {
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
    } else {
      console.log('✅ Events already exist, skipping insertion');
    }

    // Insert barangay officials
    console.log('📋 Inserting barangay officials...');
    const { error: insertOfficialsError } = await supabase
      .from('barangay_officials')
      .insert([
        {
          name: 'ALEXANDER C. MANIO',
          position: 'Punong Barangay',
          position_type: 'captain',
          committee: null,
          description: 'Leading the barangay with vision and dedication to community development and public service.',
          order_index: 1
        },
        {
          name: 'ROYCE ANN C. GALVEZ',
          position: 'Secretary',
          position_type: 'secretary',
          committee: null,
          description: 'Managing administrative functions and maintaining official records of the barangay.',
          order_index: 2
        },
        {
          name: 'MA. LUZ S. REYES',
          position: 'Treasurer',
          position_type: 'treasurer',
          committee: null,
          description: 'Managing barangay finances and ensuring proper allocation of resources.',
          order_index: 3
        },
        {
          name: 'JOHN RUZZEL C. SANTOS',
          position: 'SK Chairman',
          position_type: 'sk_chairman',
          committee: null,
          description: 'Leading youth programs and representing the voice of young residents in the barangay.',
          order_index: 4
        },
        {
          name: 'JOELITO C. MANIO',
          position: 'Kagawad 1',
          position_type: 'kagawad',
          committee: 'Committee on Health',
          description: 'Overseeing health programs and medical services for the community\'s well-being.',
          order_index: 5
        },
        {
          name: 'ENGELBERT M. INDUCTIVO',
          position: 'Kagawad 2',
          position_type: 'kagawad',
          committee: 'Committee on Education',
          description: 'Promoting educational programs and youth development initiatives in the barangay.',
          order_index: 6
        },
        {
          name: 'NORMANDO T. SANTOS',
          position: 'Kagawad 3',
          position_type: 'kagawad',
          committee: 'Committee on Peace & Order',
          description: 'Ensuring community safety and maintaining peace and order in the barangay.',
          order_index: 7
        },
        {
          name: 'JOPHET M. TURLA',
          position: 'Kagawad 4',
          position_type: 'kagawad',
          committee: 'Committee on Infrastructure',
          description: 'Overseeing infrastructure development and public works projects.',
          order_index: 8
        },
        {
          name: 'JOHN BRYAN C. CRUZ',
          position: 'Kagawad 5',
          position_type: 'kagawad',
          committee: 'Committee on Environment',
          description: 'Promoting environmental protection and sustainable development programs.',
          order_index: 9
        },
        {
          name: 'ARNEL D. BERNARDINO',
          position: 'Kagawad 6',
          position_type: 'kagawad',
          committee: 'Committee on Agriculture',
          description: 'Supporting agricultural programs and livelihood development for farmers.',
          order_index: 10
        },
        {
          name: 'LORENA G. LOPEZ',
          position: 'Kagawad 7',
          position_type: 'kagawad',
          committee: 'Committee on Social Services',
          description: 'Managing social welfare programs and community assistance initiatives.',
          order_index: 11
        }
      ]);

    if (insertOfficialsError) {
      console.error('❌ Error inserting officials:', insertOfficialsError);
    } else {
      console.log('✅ Barangay officials inserted successfully');
    }

    console.log('🎉 Setup completed successfully!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupTables();