const { supabase } = require('./services/supabaseClient');
const fs = require('fs');
const path = require('path');

async function applyCoCohabitationFix() {
    const sqlPath = path.join(__dirname, 'scripts', 'add-cohabitation-columns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Applying Co-habitation SQL schema changes...');

    const { error } = await supabase.rpc('exec_sql', {
        sql: sql
    });

    if (error) {
        console.error('❌ Error applying SQL:', error.message);
        if (error.details) console.error('Details:', error.details);
    } else {
        console.log('✅ Co-habitation columns and configuration added successfully.');
    }
}

applyCoCohabitationFix();
