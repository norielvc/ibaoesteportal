const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCohabitation() {
    console.log('--- Debugging Cohabitation System ---');

    // 1. Check columns in certificate_requests
    console.log('\n1. Checking certificate_requests structure...');
    const { data: certData, error: certError } = await supabase
        .from('certificate_requests')
        .select('*')
        .limit(1);

    if (certError) {
        console.error('Error fetching certificate_requests:', certError.message);
    } else if (certData && certData.length > 0) {
        const columns = Object.keys(certData[0]);
        console.log('Available columns in certificate_requests:', columns);

        const expectedColumns = [
            'partner_full_name', 'partner_age', 'partner_sex',
            'partner_date_of_birth', 'no_of_children',
            'living_together_years', 'living_together_months'
        ];

        expectedColumns.forEach(col => {
            if (!columns.includes(col)) {
                console.log(`❌ MISSING COLUMN: ${col}`);
            } else {
                console.log(`✅ Found column: ${col}`);
            }
        });
    }

    // 2. Check workflow_configurations
    console.log('\n2. Checking workflow_configurations for barangay_cohabitation...');
    const { data: configData, error: configError } = await supabase
        .from('workflow_configurations')
        .select('*')
        .eq('certificate_type', 'barangay_cohabitation')
        .single();

    if (configError) {
        console.error('Error fetching workflow config:', configError.message);
    } else {
        console.log('✅ Workflow config found for barangay_cohabitation');
        // console.log(JSON.stringify(configData, null, 2));
    }

    // 3. Check for existing cohabitation records
    console.log('\n3. Checking for existing cohabitation records...');
    const { data: records, error: recordsError } = await supabase
        .from('certificate_requests')
        .select('reference_number, certificate_type')
        .eq('certificate_type', 'barangay_cohabitation');

    if (recordsError) {
        console.error('Error fetching records:', recordsError.message);
    } else {
        console.log(`Found ${records.length} cohabitation records.`);
    }
}

debugCohabitation();
