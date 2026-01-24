const supabase = require('../services/supabaseClient');

async function createOfficialsTable() {
  console.log('🚀 Creating barangay_officials table directly...');

  try {
    // Create the table using raw SQL
    console.log('📋 Creating table structure...');
    
    const { data, error } = await supabase
      .from('barangay_officials')
      .select('*')
      .limit(1);

    if (!error) {
      console.log('✅ Table already exists, proceeding with data insertion...');
    } else {
      console.log('❌ Table does not exist. Creating via SQL...');
      
      // Since we can't use exec_sql, let's try creating through the REST API
      // We'll need to create this table manually in Supabase dashboard
      console.log(`
Please create the table manually in Supabase Dashboard:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Run this SQL:

CREATE TABLE barangay_officials (
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

Then run this script again to insert the data.
      `);
      return;
    }

    // If we reach here, table exists, so insert data
    const officialsData = [
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
    ];

    // Clear existing data first
    console.log('🗑️ Clearing existing officials data...');
    const { error: deleteError } = await supabase
      .from('barangay_officials')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.log('⚠️ Could not clear existing data:', deleteError.message);
    }

    // Insert new data
    console.log('📋 Inserting officials data...');
    const { data: insertData, error: insertError } = await supabase
      .from('barangay_officials')
      .insert(officialsData);

    if (insertError) {
      console.error('❌ Error inserting officials:', insertError);
    } else {
      console.log('✅ Barangay officials inserted successfully');
      console.log(`📊 Inserted ${officialsData.length} officials`);
      
      // Verify insertion
      const { data: verifyData, error: verifyError } = await supabase
        .from('barangay_officials')
        .select('name, position')
        .order('order_index');

      if (!verifyError && verifyData) {
        console.log('📋 Verification - Officials in database:');
        verifyData.forEach((official, index) => {
          console.log(`${index + 1}. ${official.name} - ${official.position}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
createOfficialsTable();