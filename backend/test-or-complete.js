const express = require('express');
const path = require('path');
const fs = require('fs');

// Test the complete OR file serving
const testORFileServing = () => {
  console.log('Testing complete OR file serving...');
  
  // Simulate the file serving route
  const filename = 'OR_26-000001_2026-03-05T10-49-02-158Z.html';
  const filePath = path.resolve(__dirname, 'generated-receipts', filename);
  
  console.log('Testing file:', filename);
  console.log('File path:', filePath);
  console.log('File exists:', fs.existsSync(filePath));
  
  if (fs.existsSync(filePath)) {
    console.log('✅ File serving should work');
    
    // Read a sample of the file content
    const content = fs.readFileSync(filePath, 'utf8');
    console.log('File content preview (first 200 chars):');
    console.log(content.substring(0, 200) + '...');
    
    // Check if it's valid HTML
    if (content.includes('<!DOCTYPE html>') && content.includes('Official Receipt')) {
      console.log('✅ File appears to be valid OR HTML');
    } else {
      console.log('❌ File does not appear to be valid OR HTML');
    }
  } else {
    console.log('❌ File does not exist');
  }
  
  // Test URL construction
  const baseURL = 'http://localhost:5005/api';
  const fileURL = `${baseURL}/official-receipts/files/${filename}`;
  console.log('Expected file URL:', fileURL);
};

testORFileServing();