const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkWorkflowConfig() {
  console.log('🔍 Checking Workflow Configuration\n');
  
  const { data: configs } = await supabase
    .from('workflow_configurations')
    .select('*');
  
  console.log(`Found ${configs.length} workflow configurations:\n`);
  
  configs.forEach(config => {
    console.log(`📋 ${config.certificate_type}`);
    console.log(`   ID: ${config.id}`);
    console.log(`   Steps: ${JSON.stringify(config.steps, null, 2)}`);
    console.log('');
  });
}

checkWorkflowConfig().catch(console.error);
