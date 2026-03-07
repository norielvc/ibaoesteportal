const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugORGeneration() {
  try {
    console.log('🔍 Debugging OR Generation Issue...\n');
    
    // Check the latest OR record
    const { data: latestOR, error: orError } = await supabase
      .from('official_receipts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (orError) {
      console.error('❌ Error fetching OR records:', orError);
      return;
    }
    
    if (!latestOR || latestOR.length === 0) {
      console.log('❌ No OR records found');
      return;
    }
    
    const or = latestOR[0];
    console.log('📋 Latest OR Record:');
    console.log(`   OR Number: ${or.or_number}`);
    console.log(`   Request ID: ${or.request_id}`);
    console.log(`   Amount: ₱${or.amount}`);
    console.log(`   Payor: ${or.payor_name}`);
    console.log(`   Business: ${or.business_name}`);
    console.log(`   Created: ${or.created_at}`);
    
    // Check if the OR file exists
    const fs = require('fs');
    const path = require('path');
    
    const receiptsDir = path.join(__dirname, 'generated-receipts');
    const files = fs.readdirSync(receiptsDir);
    
    console.log(`\n📁 Generated OR Files (${files.length}):`);
    files.forEach((file, i) => {
      console.log(`   ${i + 1}. ${file}`);
    });
    
    // Find the file for this OR
    const orFile = files.find(f => f.includes(or.or_number.replace('-', '_')));
    
    if (orFile) {
      console.log(`\n✅ Found OR file: ${orFile}`);
      
      const filePath = path.join(receiptsDir, orFile);
      const stats = fs.statSync(filePath);
      console.log(`   File size: ${stats.size} bytes`);
      console.log(`   File modified: ${stats.mtime}`);
      
      // Test file serving URL
      const fileURL = `http://localhost:5005/api/official-receipts/files/${orFile}`;
      console.log(`   File URL: ${fileURL}`);
      
      // Test if file content is valid
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('<!DOCTYPE html>') && content.includes('Official Receipt')) {
        console.log('   ✅ File content is valid HTML OR');
      } else {
        console.log('   ❌ File content may be invalid');
      }
      
    } else {
      console.log(`\n❌ OR file not found for OR number: ${or.or_number}`);
      console.log('   Expected pattern:', or.or_number.replace('-', '_'));
    }
    
    // Check the request status
    const { data: request, error: reqError } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('id', or.request_id)
      .single();
    
    if (reqError) {
      console.error('❌ Error fetching request:', reqError);
    } else {
      console.log(`\n📋 Request Status: ${request.status}`);
      console.log(`   Reference: ${request.reference_number}`);
      console.log(`   Type: ${request.certificate_type}`);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugORGeneration();