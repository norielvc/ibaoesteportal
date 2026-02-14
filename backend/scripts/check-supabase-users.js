const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkSupabaseUsers() {
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );

    console.log('Checking Supabase users...');
    const { data, error } = await supabase.from('users').select('*');

    if (error) {
        console.error('Error fetching users:', error);
    } else {
        console.log('Users found:', data.length);
        data.forEach(user => {
            console.log(`- ${user.email} (${user.role}): ${user.first_name} ${user.last_name} [${user.status}]`);
        });
    }
}

checkSupabaseUsers();
