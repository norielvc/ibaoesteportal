const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findUser() {
    console.log('Searching for user "Luffy"...');

    const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role')
        .ilike('first_name', '%Luffy%');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Found users:', data);
}

findUser();
