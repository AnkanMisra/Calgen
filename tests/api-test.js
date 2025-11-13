import http from 'http';
import https from 'https';
import { performance } from 'perf_hooks';

// Configuration
const API_BASE = 'http://localhost:3000';
const MAX_CONCURRENT_REQUESTS = 5;
const TEST_TIMEOUT = 60000; // 60 seconds

// Test utilities
class TestSuite {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '[FAIL]' : type === 'success' ? '[PASS]' : type === 'warning' ? '[WARN]' : '[INFO]';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async makeRequest(method, url, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = client.request(options, (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          const endTime = performance.now();
          const responseTime = Math.round(endTime - startTime);

          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            responseTime: responseTime
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(TEST_TIMEOUT, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  addResult(testName, success, details = {}) {
    this.results.push({
      testName,
      success,
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      ...details
    });
  }

  async runTest(testName, testFunction) {
    try {
      this.log(`[TEST] Running test: ${testName}`);
      const result = await testFunction();
      this.addResult(testName, true, result);
      this.log(`Test passed: ${testName}`, 'success');
      return result;
    } catch (error) {
      this.addResult(testName, false, { error: error.message });
      this.log(`Test failed: ${testName} - ${error.message}`, 'error');
      throw error;
    }
  }

  printSummary() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalTime = Date.now() - this.startTime;

    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${(totalTime / 1000).toFixed(2)}s`);

    if (failedTests > 0) {
      console.log('\nFailed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.testName}: ${r.error}`));
    }

    console.log('\nDetailed Results:');
    this.results.forEach(r => {
      const status = r.success ? '[PASS]' : '[FAIL]';
      const duration = ((r.duration || 0) / 1000).toFixed(2);
      console.log(`  ${status} ${r.testName} (${duration}s)`);
    });
  }
}

// Test suite implementation
class CalendarAPITestSuite extends TestSuite {
  constructor() {
    super();
    this.authToken = null;
  }

  // Authentication tests
  async testAuthStatus() {
    const response = await this.makeRequest('GET', `${API_BASE}/api/auth/status`);

    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }

    const data = JSON.parse(response.body);
    this.log(`Authentication status: ${data.authenticated ? 'Authenticated' : 'Not authenticated'}`);

    return {
      statusCode: response.statusCode,
      authenticated: data.authenticated,
      responseTime: response.responseTime
    };
  }

  // API endpoint availability tests
  async testEndpointAvailability() {
    const endpoints = [
      '/api/auth/status',
      '/api/events/created'
    ];

    const results = {};
    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest('GET', `${API_BASE}${endpoint}`);
        results[endpoint] = {
          available: response.statusCode < 500,
          statusCode: response.statusCode,
          responseTime: response.responseTime
        };
      } catch (error) {
        results[endpoint] = {
          available: false,
          error: error.message
        };
      }
    }

    return results;
  }

  // Rate limiting tests
  async testRateLimiting() {
    this.log('Testing rate limiting with rapid requests...');

    const requests = [];
    const startTime = Date.now();

    // Make 10 requests rapidly
    for (let i = 0; i < 10; i++) {
      requests.push(
        this.makeRequest('GET', `${API_BASE}/api/auth/status`)
          .then(res => ({ index: i, success: true, ...res }))
          .catch(err => ({ index: i, success: false, error: err.message }))
      );
    }

    const results = await Promise.all(requests);
    const endTime = Date.now();

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const avgResponseTime = successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length;

    return {
      totalRequests: requests.length,
      successful: successful.length,
      failed: failed.length,
      totalTime: endTime - startTime,
      avgResponseTime: Math.round(avgResponseTime),
      rateLimitDetected: failed.some(f => f.error?.includes('429') || f.error?.includes('rate limit'))
    };
  }

  // AI service reliability tests
  async testAIServiceReliability() {
    this.log('Testing AI service reliability...');

    const testCases = [
      { input: 'work meetings', count: 5 },
      { input: 'gym workouts', count: 3 },
      { input: 'study sessions', count: 7 }
    ];

    const results = [];

    for (const testCase of testCases) {
      try {
        const startTime = Date.now();
        const response = await this.makeRequest('POST', `${API_BASE}/api/events`, {
          startDate: '2025-11-14',
          endDate: '2025-11-21',
          count: testCase.count,
          userInput: testCase.input
        });

        const endTime = Date.now();
        const data = JSON.parse(response.body);

        results.push({
          input: testCase.input,
          requested: testCase.count,
          successful: data.successful || 0,
          failed: data.failed || 0,
          totalTime: endTime - startTime,
          statusCode: response.statusCode,
          responseTime: response.responseTime
        });

      } catch (error) {
        results.push({
          input: testCase.input,
          requested: testCase.count,
          successful: 0,
          failed: testCase.count,
          error: error.message
        });
      }
    }

    return results;
  }

  // Batch processing tests
  async testBatchProcessing() {
    this.log('Testing batch processing with different event counts...');

    const testCounts = [5, 10, 15, 20];
    const results = [];

    for (const count of testCounts) {
      try {
        this.log(`  Testing batch size: ${count} events`);

        const startTime = Date.now();
        const response = await this.makeRequest('POST', `${API_BASE}/api/events`, {
          startDate: '2025-11-14',
          endDate: '2025-11-21',
          count: count,
          userInput: 'batch testing events'
        });

        const endTime = Date.now();
        const data = JSON.parse(response.body);

        results.push({
          count: count,
          successful: data.successful || 0,
          failed: data.failed || 0,
          totalTime: endTime - startTime,
          avgTimePerEvent: Math.round((endTime - startTime) / count),
          successRate: ((data.successful || 0) / count * 100).toFixed(1),
          statusCode: response.statusCode
        });

        // Wait a bit between batches to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 3000));

      } catch (error) {
        results.push({
          count: count,
          successful: 0,
          failed: count,
          error: error.message,
          totalTime: Date.now() - startTime
        });
      }
    }

    return results;
  }

  // Date calculation validation tests
  async testDateCalculations() {
    this.log('Testing date calculation robustness...');

    const testCases = [
      {
        name: 'Single day range',
        startDate: '2025-11-14',
        endDate: '2025-11-14',
        count: 5
      },
      {
        name: 'Multi-day range',
        startDate: '2025-11-14',
        endDate: '2025-11-21',
        count: 10
      },
      {
        name: 'Large date range',
        startDate: '2025-11-14',
        endDate: '2025-12-31',
        count: 15
      },
      {
        name: 'Edge case - 1 month',
        startDate: '2025-11-14',
        endDate: '2025-12-14',
        count: 8
      }
    ];

    const results = [];

    for (const testCase of testCases) {
      try {
        this.log(`  Testing: ${testCase.name}`);

        const response = await this.makeRequest('POST', `${API_BASE}/api/events`, {
          startDate: testCase.startDate,
          endDate: testCase.endDate,
          count: testCase.count,
          userInput: 'date testing events'
        });

        const data = JSON.parse(response.body);

        results.push({
          testCase: testCase.name,
          startDate: testCase.startDate,
          endDate: testCase.endDate,
          requested: testCase.count,
          successful: data.successful || 0,
          failed: data.failed || 0,
          dateErrors: data.failed || 0, // Assuming date errors are included in failed
          statusCode: response.statusCode
        });

      } catch (error) {
        results.push({
          testCase: testCase.name,
          startDate: testCase.startDate,
          endDate: testCase.endDate,
          requested: testCase.count,
          successful: 0,
          failed: testCase.count,
          error: error.message
        });
      }
    }

    return results;
  }

  // Concurrent load testing
  async testConcurrentLoad() {
    this.log('Testing concurrent load handling...');

    const concurrentRequests = 3;
    const eventsPerRequest = 5;
    const requests = [];

    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(
        this.makeRequest('POST', `${API_BASE}/api/events`, {
          startDate: '2025-11-14',
          endDate: '2025-11-21',
          count: eventsPerRequest,
          userInput: `concurrent test ${i + 1}`
        }).then(res => ({
          requestId: i,
          statusCode: res.statusCode,
          responseTime: res.responseTime,
          data: JSON.parse(res.body)
        })).catch(err => ({
          requestId: i,
          error: err.message
        }))
      );
    }

    const results = await Promise.all(requests);

    const successful = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);
    const totalSuccessful = successful.reduce((sum, r) => sum + (r.data?.successful || 0), 0);
    const totalRequested = concurrentRequests * eventsPerRequest;

    return {
      concurrentRequests,
      eventsPerRequest,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      totalSuccessful,
      totalRequested,
      successRate: ((totalSuccessful / totalRequested) * 100).toFixed(1),
      avgResponseTime: successful.length > 0 ?
        Math.round(successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length) : 0
    };
  }

  // Error handling tests
  async testErrorHandling() {
    this.log('Testing error handling...');

    const errorTestCases = [
      {
        name: 'Missing required fields',
        data: { count: 5 }
      },
      {
        name: 'Invalid date range',
        data: {
          startDate: '2025-11-21',
          endDate: '2025-11-14', // End before start
          count: 5,
          userInput: 'test'
        }
      },
      {
        name: 'Event count too high',
        data: {
          startDate: '2025-11-14',
          endDate: '2025-11-21',
          count: 50, // Over limit
          userInput: 'test'
        }
      },
      {
        name: 'Empty user input',
        data: {
          startDate: '2025-11-14',
          endDate: '2025-11-21',
          count: 5,
          userInput: ''
        }
      }
    ];

    const results = [];

    for (const testCase of errorTestCases) {
      try {
        const response = await this.makeRequest('POST', `${API_BASE}/api/events`, testCase.data);

        results.push({
          testCase: testCase.name,
          statusCode: response.statusCode,
          isError: response.statusCode >= 400,
          data: JSON.parse(response.body)
        });

      } catch (error) {
        results.push({
          testCase: testCase.name,
          statusCode: 0,
          isError: true,
          error: error.message
        });
      }
    }

    return results;
  }

  // Performance benchmark
  async testPerformanceBenchmark() {
    this.log('Running performance benchmark...');

    const benchmarkRequests = 10;
    const responseTimes = [];
    const successfulRequests = [];

    for (let i = 0; i < benchmarkRequests; i++) {
      try {
        const response = await this.makeRequest('GET', `${API_BASE}/api/auth/status`);

        if (response.statusCode === 200) {
          responseTimes.push(response.responseTime);
          successfulRequests.push(i);
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        this.log(`  Benchmark request ${i + 1} failed: ${error.message}`);
      }
    }

    if (responseTimes.length === 0) {
      throw new Error('All benchmark requests failed');
    }

    responseTimes.sort((a, b) => a - b);

    return {
      totalRequests: benchmarkRequests,
      successfulRequests: successfulRequests.length,
      failedRequests: benchmarkRequests - successfulRequests.length,
      avgResponseTime: Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length),
      minResponseTime: responseTimes[0],
      maxResponseTime: responseTimes[responseTimes.length - 1],
      medianResponseTime: responseTimes[Math.floor(responseTimes.length / 2)],
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)],
      p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)]
    };
  }
}

// Main test runner
async function runAllTests() {
  console.log('========================================');
  console.log('  Calendar API Test Suite');
  console.log('========================================');
  console.log(`Target API: ${API_BASE}`);
  console.log(`Test Timeout: ${TEST_TIMEOUT}ms`);
  console.log(`Max Concurrent: ${MAX_CONCURRENT_REQUESTS}`);
  console.log('========================================');

  const testSuite = new CalendarAPITestSuite();

  try {
    // Basic connectivity and authentication
    await testSuite.runTest('API Connectivity', () => testSuite.testAuthStatus());
    await testSuite.runTest('Endpoint Availability', () => testSuite.testEndpointAvailability());

    // Performance and reliability tests
    await testSuite.runTest('Performance Benchmark', () => testSuite.testPerformanceBenchmark());
    await testSuite.runTest('Rate Limiting Test', () => testSuite.testRateLimiting());

    // Core functionality tests
    await testSuite.runTest('AI Service Reliability', () => testSuite.testAIServiceReliability());
    await testSuite.runTest('Date Calculation Validation', () => testSuite.testDateCalculations());

    // Advanced tests
    await testSuite.runTest('Batch Processing Test', () => testSuite.testBatchProcessing());
    await testSuite.runTest('Concurrent Load Test', () => testSuite.testConcurrentLoad());

    // Error handling
    await testSuite.runTest('Error Handling Test', () => testSuite.testErrorHandling());

  } catch (error) {
    testSuite.log(`❌ Test suite failed: ${error.message}`, 'error');
  }

  testSuite.printSummary();

  console.log('\nRecommendations:');
  console.log(' - Review any failed tests for issues');
  console.log(' - Monitor response times and success rates');
  console.log(' - Check rate limiting behavior under load');
  console.log(' - Verify error handling for edge cases');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { CalendarAPITestSuite, runAllTests };
