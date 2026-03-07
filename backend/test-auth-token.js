const jwt = require('jsonwebtoken');
require('dotenv').config();

// Create a test token for debugging
function createTestToken() {
  const payload = {
    _id: 'ca847635-fd64-4e69-9cc7-01998200ddfe', // Franky Dono's ID
    email: 'frankydono612@gmail.com',
    role: 'admin',
    first_name: 'Franky',
    last_name: 'Dono'
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  console.log('Test token created:', token);
  return token;
}

// Test the physical inspection API with the token
async function testPhysicalInspectionAPI() {
  const token = createTestToken();
  
  try {
    const response = await fetch('http://localhost:5005/api/physical-inspection/request/d0228bd9-8324-4da0-a189-e8f5616395e8', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testPhysicalInspectionAPI();