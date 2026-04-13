const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listUsersWithCodes() {
    const { data: users, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, employee_code, role');
        
    if (error) {
        console.error('Error fetching users:', error);
        return;
    }
    
    console.log('--- SUPABASE USERS ---');
    users.forEach(u => {
        console.log(`[${u.id}] ${u.first_name} ${u.last_name} (${u.role}) - Code: ${u.employee_code || 'MISSING'}`);
    });
}

listUsersWithCodes();
