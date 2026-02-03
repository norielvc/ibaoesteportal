const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyWorkflowTable() {
    console.log('🔍 Verifying workflow_configurations table...');

    // Check if table exists by selecting from it
    const { data, error } = await supabase
        .from('workflow_configurations')
        .select('count')
        .limit(1);

    if (error) {
        console.log('❌ Error accessing workflow_configurations:', error.message);
        if (error.message.includes('relation "workflow_configurations" does not exist')) {
            console.log('⚠️ Table missing. You must create it.');
            await createTable();
        }
    } else {
        console.log('✅ Table workflow_configurations exists and is accessible.');
    }
}

async function createTable() {
    console.log('🛠️ Creating workflow_configurations table...');

    // We can't run DDL via client easily without RPC, but we can try RPC or warn user.
    // However, I will try to use the setup-settings approach if available.
    // For now, I'll just log instructions if I can't create it.

    // Try via RPC if a catch-all exec exists (unlikely in prod).
    // Instead, I will write a SQL file that the user (or I) should run if needed.
    // But since I have access to previous scripts, I might be able to use an existing RPC 'create_workflow_configurations_table' mentioned in check-workflow-configurations-table.js.

    const { error } = await supabase.rpc('create_workflow_configurations_table');
    if (error) {
        console.log('❌ RPC create_workflow_configurations_table failed:', error.message);
        console.log('SQL to run:');
        console.log(`
            CREATE TABLE IF NOT EXISTS workflow_configurations (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              certificate_type VARCHAR(100) NOT NULL UNIQUE,
              workflow_config JSONB NOT NULL,
              is_active BOOLEAN DEFAULT true,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
    } else {
        console.log('✅ Table created via RPC.');
    }
}

verifyWorkflowTable();
