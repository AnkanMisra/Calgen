#!/usr/bin/env node

// Test script to verify event creation fix
// Using Node.js built-in fetch (available in Node 18+)

// Test configuration
const SERVER_URL = 'http://localhost:3000';
const TEST_EVENT_REQUEST = {
  startDate: '2025-11-14',
  endDate: '2025-11-16',
  count: 10,
  userInput: 'Test Workout, Study, Coding, Meeting, Walking',
  timezone: 'Asia/Kolkata',
  earliestStartTime: 8
};

async function runTest() {
  console.log('[TEST] Starting Event Creation Test...');
  console.log('Expected: 10 events should be created');
  console.log('Previous result: 6/10 events (4 events were skipped)');
  console.log('');

  try {
    // Test the event creation endpoint
    console.log('[INFO] Sending request to create 10 events...');
    console.log('Request:', JSON.stringify(TEST_EVENT_REQUEST, null, 2));
    console.log('');

    const response = await fetch(`${SERVER_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_EVENT_REQUEST)
    });

    const data = await response.json();

    console.log('[INFO] Results:');
    console.log('Response Status:', response.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));
    console.log('');

    // Analyze results
    if (data.success && data.events) {
      const createdCount = data.events.length;
      const requestedCount = TEST_EVENT_REQUEST.count;

      console.log('[PASS] Analysis:');
      console.log(`   • Requested: ${requestedCount} events`);
      console.log(`   • Created: ${createdCount} events`);
      console.log(`   • Success Rate: ${((createdCount / requestedCount) * 100).toFixed(1)}%`);

      if (createdCount === requestedCount) {
        console.log('[PASS] SUCCESS: All 10 events were created!');
        console.log('[PASS] The const reassignment bug has been fixed!');
      } else {
        console.log(`[WARN] ISSUE: Only ${createdCount}/${requestedCount} events created`);
        console.log(`[FAIL] ${requestedCount - createdCount} events are still being skipped`);
      }
    } else {
      console.log('[FAIL] API Error:');
      console.log('   Success:', data.success);
      console.log('   Error:', data.error || data.message);
    }

  } catch (error) {
    console.error('[FAIL] Test Failed with error:', error.message);
    console.error('   Make sure the server is running on http://localhost:3000');
  }
}

// Run the test
runTest();
