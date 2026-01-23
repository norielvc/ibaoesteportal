const supabase = require('../services/supabaseClient');

async function testFacilities() {
  console.log('🧪 Testing facilities table...');

  try {
    // Try to fetch facilities
    const { data, error } = await supabase
      .from('facilities')
      .select('*');

    if (error) {
      console.error('❌ Error fetching facilities:', error);
      
      // Try to create the table by inserting data
      console.log('📋 Attempting to create facilities table by inserting data...');
      const { data: insertData, error: insertError } = await supabase
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
          }
        ]);

      if (insertError) {
        console.error('❌ Error creating facilities table:', insertError);
        console.log('ℹ️  Please create the facilities table manually in Supabase dashboard using the SQL from create-facilities-table.sql');
      } else {
        console.log('✅ Facilities table created and data inserted');
      }
    } else {
      console.log('✅ Facilities table exists with', data.length, 'records');
      console.log('📋 Facilities:', data);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFacilities();