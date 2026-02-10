const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../backend/.env') });
const { supabase } = require('../services/supabaseClient');

async function checkResidentsColumns() {
    console.log('🚀 Checking residents table columns...');

    try {
        const { data, error } = await supabase
            .from('residents')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Error fetching residents:', error);
            return;
        }

        const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
        console.log('Existing columns:', columns);

        const neededColumns = ['is_deceased', 'date_of_death', 'cause_of_death', 'covid_related'];
        const missingColumns = neededColumns.filter(col => !columns.includes(col));

        if (missingColumns.length > 0) {
            console.log('⚠️ Missing columns:', missingColumns);
            console.log('Creating missing columns...');

            const { error: alterError } = await supabase.rpc('exec_sql', {
                sql: `
          DO $$
          BEGIN
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'residents' AND column_name = 'is_deceased') THEN
                  ALTER TABLE residents ADD COLUMN is_deceased BOOLEAN DEFAULT FALSE;
              END IF;

              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'residents' AND column_name = 'date_of_death') THEN
                  ALTER TABLE residents ADD COLUMN date_of_death TIMESTAMP WITH TIME ZONE;
              END IF;

              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'residents' AND column_name = 'cause_of_death') THEN
                  ALTER TABLE residents ADD COLUMN cause_of_death TEXT;
              END IF;

              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'residents' AND column_name = 'covid_related') THEN
                  ALTER TABLE residents ADD COLUMN covid_related BOOLEAN DEFAULT FALSE;
              END IF;
          END $$;
        `
            });

            if (alterError) {
                console.error('❌ Error adding columns:', alterError);
                console.log('⚠️ Please run the following SQL manually:');
                console.log(`
          ALTER TABLE residents ADD COLUMN IF NOT EXISTS is_deceased BOOLEAN DEFAULT FALSE;
          ALTER TABLE residents ADD COLUMN IF NOT EXISTS date_of_death TIMESTAMP WITH TIME ZONE;
          ALTER TABLE residents ADD COLUMN IF NOT EXISTS cause_of_death TEXT;
          ALTER TABLE residents ADD COLUMN IF NOT EXISTS covid_related BOOLEAN DEFAULT FALSE;
        `);
            } else {
                console.log('✅ Columns added successfully to residents table.');
            }
        } else {
            console.log('✅ All required columns exist.');
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

checkResidentsColumns();
