const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAssignmentTypes() {
    console.log('Checking distinct request types in workflow_assignments...');

    // Fetch all rows
    const { data, error } = await supabase
        .from('workflow_assignments')
        .select('request_type');

    if (error) {
        console.error('Error fetching assignments:', error);
        return;
    }

    const types = new Set(data.map(d => d.request_type));
    console.log('Existing request types in workflow_assignments:', Array.from(types));
}

checkAssignmentTypes();
