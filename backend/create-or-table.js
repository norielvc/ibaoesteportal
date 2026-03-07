const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createORTable() {
  try {
    console.log('Creating official_receipts table...');
    
    // Read the SQL file
    const sql = fs.readFileSync('./CREATE_OFFICIAL_RECEIPTS_TABLE.sql', 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error creating table:', error);
      
      // Try alternative approach - execute each statement separately
      console.log('Trying alternative approach...');
      
      const statements = sql.split(';').filter(s => s.trim().length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log('Executing:', statement.substring(0, 50) + '...');
          const { error: stmtError } = await supabase.rpc('exec_sql', { 
            sql_query: statement.trim() + ';' 
          });
          
          if (stmtError) {
            console.error('Statement error:', stmtError);
          } else {
            console.log('✅ Statement executed successfully');
          }
        }
      }
    } else {
      console.log('✅ Table created successfully');
    }
    
    // Verify table exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'official_receipts');
    
    if (tableError) {
      console.error('Error checking table:', tableError);
    } else if (tables && tables.length > 0) {
      console.log('✅ official_receipts table exists');
    } else {
      console.log('❌ official_receipts table not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createORTable();