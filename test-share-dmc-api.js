// Test script to debug the Shared DMC API issue
const fetch = require('node-fetch');

async function testShareDMCAPI() {
  try {
    console.log('Testing Shared DMC API...');
    
    // Test with sample parameters
    const testParams = new URLSearchParams({
      enquiryId: 'test-enquiry-1',
      customerId: 'test-customer-1'
    });
    
    const response = await fetch(`http://localhost:3000/api/share-dmc?${testParams.toString()}`);
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    // Check if response structure is correct
    if (data.success) {
      console.log('✅ API returned success');
      console.log('Data items:', data.data?.length || 0);
      console.log('Available DMCs:', data.availableDMCs?.length || 0);
    } else {
      console.log('❌ API returned failure');
      console.log('Error:', data.error);
      console.log('Details:', data.details);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Test without parameters
async function testShareDMCAPINoParams() {
  try {
    console.log('\nTesting Shared DMC API without parameters...');
    
    const response = await fetch('http://localhost:3000/api/share-dmc');
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run tests
testShareDMCAPI().then(() => testShareDMCAPINoParams());
