const { supabase } = require('./services/supabaseClient');

async function check() {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, first_name, last_name, role');

        if (error) throw error;

        console.log('--- USER LIST ---');
        users.forEach(u => {
            console.log(`${u.first_name} ${u.last_name} | ID: ${u.id} | Role: ${u.role}`);
        });

    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit(0);
}

check();
