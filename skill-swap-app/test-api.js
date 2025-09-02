const axios = require('axios');

// Simple API test script to debug dashboard stats
async function testApiEndpoints() {
  const baseURL = 'http://localhost:3000/api';
  
  // You'll need to replace this with an actual JWT token from a logged-in user
  const authToken = 'your-jwt-token-here'; // Replace with actual token
  
  const config = {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  };

  try {
    console.log('🧪 Testing API endpoints...\n');

    // Test matches endpoint
    console.log('📊 Testing /api/swipe/matches...');
    try {
      const matchesResponse = await axios.get(`${baseURL}/swipe/matches`, config);
      console.log('✅ Matches API working');
      console.log('📈 Matches data:', matchesResponse.data);
      console.log('📊 Total matches:', Array.isArray(matchesResponse.data) ? matchesResponse.data.length : 0);
    } catch (error) {
      console.log('❌ Matches API error:', error.response?.data || error.message);
    }

    console.log('\n');

    // Test meetings endpoint
    console.log('📅 Testing /api/meetings/my-meetings...');
    try {
      const meetingsResponse = await axios.get(`${baseURL}/meetings/my-meetings`, config);
      console.log('✅ Meetings API working');
      console.log('📈 Meetings data:', meetingsResponse.data);
      console.log('📊 Total meetings:', Array.isArray(meetingsResponse.data) ? meetingsResponse.data.length : 0);
      
      if (Array.isArray(meetingsResponse.data)) {
        const meetings = meetingsResponse.data;
        const pending = meetings.filter(m => m.status === 'pending').length;
        const accepted = meetings.filter(m => m.status === 'accepted').length;
        const completed = meetings.filter(m => m.status === 'completed').length;
        
        console.log('📋 Meeting breakdown:');
        console.log(`  - Pending: ${pending}`);
        console.log(`  - Accepted: ${accepted}`);
        console.log(`  - Completed: ${completed}`);
      }
    } catch (error) {
      console.log('❌ Meetings API error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.log('❌ General error:', error.message);
  }
}

// Instructions for use
console.log(`
🚀 API Test Script
==================

To use this script:
1. Make sure your backend server is running (npm run dev in backend folder)
2. Log in to your frontend and get a JWT token from browser dev tools (Application/Local Storage)
3. Replace 'your-jwt-token-here' with the actual token
4. Run: node test-api.js

This will help debug why dashboard stats might be showing 0.
`);

// Uncomment to run (after adding a real JWT token)
// testApiEndpoints();

module.exports = { testApiEndpoints };