const path = require('path');
const fs = require('fs');

// Test the file serving logic
const testFileServing = () => {
  console.log('Testing OR file serving logic...');
  
  // Get the receipts directory
  const receiptsDir = path.resolve(__dirname, 'generated-receipts');
  console.log('Receipts directory:', receiptsDir);
  
  // Check if directory exists
  if (!fs.existsSync(receiptsDir)) {
    console.error('Receipts directory does not exist!');
    return;
  }
  
  // List files in directory
  const files = fs.readdirSync(receiptsDir);
  console.log('Files in receipts directory:', files);
  
  if (files.length === 0) {
    console.log('No OR files found');
    return;
  }
  
  // Test path resolution for first file
  const testFile = files[0];
  const testFilePath = path.resolve(__dirname, 'generated-receipts', testFile);
  
  console.log('Test file:', testFile);
  console.log('Test file path:', testFilePath);
  console.log('File exists:', fs.existsSync(testFilePath));
  
  if (fs.existsSync(testFilePath)) {
    const stats = fs.statSync(testFilePath);
    console.log('File size:', stats.size, 'bytes');
    console.log('File modified:', stats.mtime);
  }
};

testFileServing();