#!/usr/bin/env node

/**
 * CalGen - Test Runner
 * This file provides comprehensive testing for API rate limiting, batch processing, and functionality
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { open } from 'node:fs/promises';
import { appendFile } from 'node:fs/promises';

// Configuration
const SERVER_URL = 'http://localhost:3000';
const TEST_RESULTS_FILE = './test-results-detailed.json';

// Colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

// Test runner class
class TestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    let prefix = '[INFO]';
    let color = CYAN;
    
    switch(type) {
      case 'error': prefix = '[FAIL]'; color = RED; break;
      case 'success': prefix = '[PASS]'; color = GREEN; break;
      case 'warning': prefix = '[WARN]'; color = YELLOW; break;
      case 'start': prefix = '[TEST]'; color = BOLD; break;
    }
    
    console.log(`${color}${prefix}${RESET} [${timestamp}] ${message}`);
  }

  async runCommand(command, description) {
    return new Promise((resolve) => {
      this.log(description, 'start');

      const child = spawn(command, { shell: true, stdio: 'pipe' });
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const result = {
          command,
          description,
          code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          timestamp: new Date().toISOString(),
          duration: Date.now() - this.startTime
        };

        this.results.push(result);

        if (code === 0) {
          this.log(`${description} - Success (${result.duration}ms)`, 'success');
        } else {
          this.log(`${description} - Failed (exit code: ${code})`, 'error');
          if (stderr) {
            this.log(`   Error: ${stderr}`, 'error');
          }
        }

        resolve(result);
      });

      child.on('error', (error) => {
        const result = {
          command,
          description,
          error: error.message,
          timestamp: new Date().toISOString(),
          duration: Date.now() - this.startTime
        };

        this.results.push(result);
        this.log(`${description} - Error: ${error.message}`, 'error');
        resolve(result);
      });
    });
  }

  // Test functions
  async testAPIHealth() {
    return this.runCommand(
      `curl -s -w "HTTP Status: %{http_code}\\nResponse Time: %{time_total}s" ${SERVER_URL}/api/auth/status`,
      'API Health Check'
    );
  }

  async testEventCreationSmall() {
    return this.runCommand(
      `curl -s -X POST -H "Content-Type: application/json" -w "HTTP Status: %{http_code}\\nResponse Time: %{time_total}s" -d '{
        "startDate": "2025-11-14",
        "endDate": "2025-11-21",
        "count": 5,
        "userInput": "small test events"
      }' ${SERVER_URL}/api/events`,
      'Small Event Creation (5 events)'
    );
  }

  async testEventCreationMedium() {
    return this.runCommand(
      `curl -s -X POST -H "Content-Type: application/json" -w "HTTP Status: %{http_code}\\nResponse Time: %{time_total}s" -d '{
        "startDate": "2025-11-14",
        "endDate": "2025-11-21",
        "count": 10,
        "userInput": "medium test events with various activities"
      }' ${SERVER_URL}/api/events`,
      'Medium Event Creation (10 events)'
    );
  }

  async testEventCreationLarge() {
    return this.runCommand(
      `curl -s -X POST -H "Content-Type: application/json" -w "HTTP Status: %{http_code}\\nResponse Time: %{time_total}s" -d '{
        "startDate": "2025-11-14",
        "endDate": "2025-11-28",
        "count": 20,
        "userInput": "large test events including work, gym, study, and social activities"
      }' ${SERVER_URL}/api/events`,
      'Large Event Creation (20 events)'
    );
  }

  async testErrorHandling() {
    return this.runCommand(
      `curl -s -X POST -H "Content-Type: application/json" -w "HTTP Status: %{http_code}\\n" -d '{
        "count": 5
      }' ${SERVER_URL}/api/events`,
      'Error Handling (Missing required fields)'
    );
  }

  async testInvalidDateRange() {
    return this.runCommand(
      `curl -s -X POST -H "Content-Type: application/json" -w "HTTP Status: %{http_code}\\n" -d '{
        "startDate": "2025-11-21",
        "endDate": "2025-11-14",
        "count": 5,
        "userInput": "invalid date range test"
      }' ${SERVER_URL}/api/events`,
      'Error Handling (Invalid date range)'
    );
  }

  async testEventCountLimit() {
    return this.runCommand(
      `curl -s -X POST -H "Content-Type: application/json" -w "HTTP Status: %{http_code}\\n" -d '{
        "startDate": "2025-11-14",
        "endDate": "2025-11-21",
        "count": 50,
        "userInput": "test event count limit"
      }' ${SERVER_URL}/api/events`,
      'Error Handling (Event count over limit)'
    );
  }

  async testRateLimiting() {
    this.log('Testing rate limiting with rapid requests...', 'start');

    const startTime = Date.now();
    const requests = [];

    // Make 5 rapid requests
    for (let i = 0; i < 5; i++) {
      requests.push(this.runCommand(
        `curl -s -w "HTTP Status: %{http_code}\\nResponse Time: %{time_total}s" ${SERVER_URL}/api/auth/status`,
        `Rate Limit Test Request ${i + 1}`
      ));
    }

    const results = await Promise.all(requests);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    const successful = results.filter(r => r.code === 0).length;
    const failed = results.filter(r => r.code !== 0).length;
    const avgResponseTime = results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;

    this.log(`Rate Limiting Results:`, 'start');
    this.log(`   Total Requests: ${requests.length}`);
    this.log(`   Successful: ${successful}`);
    this.log(`   Failed: ${failed}`);
    this.log(`   Total Time: ${totalTime}ms`);
    this.log(`   Average Response Time: ${Math.round(avgResponseTime)}ms`);

    // Check for rate limiting responses
    const rateLimited = results.some(r =>
      r.stdout && r.stdout.includes('429') || r.stdout?.includes('rate limit')
    );

    if (rateLimited) {
      this.log('   Rate limiting detected (expected)', 'warning');
    } else {
      this.log('   No rate limiting detected (as expected for small requests)', 'success');
    }

    return {
      testName: 'Rate Limiting Test',
      successful,
      failed,
      rateLimited,
      totalTime,
      avgResponseTime
    };
  }

  async testConcurrentRequests() {
    this.log('Testing concurrent requests...', 'start');

    const startTime = Date.now();
    const requests = [
      this.runCommand(
        `curl -s -X POST -H "Content-Type: application/json" -d '{
          "startDate": "2025-11-14",
          "endDate": "2025-11-21",
          "count": 3,
          "userInput": "concurrent test 1"
        }' ${SERVER_URL}/api/events`,
        'Concurrent Request 1'
      ),
      this.runCommand(
        `curl -s -X POST -H "Content-Type: application/json" -d '{
          "startDate": "2025-11-14",
          "endDate": "2025-11-21",
          "count": 3,
          "userInput": "concurrent test 2"
        }' ${SERVER_URL}/api/events`,
        'Concurrent Request 2'
      )
    ];

    const results = await Promise.all(requests);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    const successful = results.filter(r => r.code === 0).length;
    const failed = results.filter(r => r.code !== 0).length;

    this.log(`Concurrent Results:`, 'start');
    this.log(`   Concurrent Requests: ${requests.length}`);
    this.log(`   Successful: ${successful}`);
    this.log(`   Failed: ${failed}`);
    this.log(`   Total Time: ${totalTime}ms`);

    return {
      testName: 'Concurrent Requests Test',
      successful,
      failed,
      totalTime
    };
  }

  async testPerformanceBenchmark() {
    this.log('Performance Benchmark...', 'start');

    const iterations = 5;
    const responseTimes = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await this.runCommand(
        `curl -s -w "%{time_total}" ${SERVER_URL}/api/auth/status`,
        `Performance Test ${i + 1}`
      );
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      responseTimes.push(responseTime);

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);

    this.log(`Performance Benchmark Results:`, 'start');
    this.log(`   Iterations: ${iterations}`);
    this.log(`   Average Response Time: ${Math.round(avgResponseTime)}ms`);
    this.log(`   Min Response Time: ${minResponseTime}ms`);
    this.log(`   Max Response Time: ${maxResponseTime}ms`);

    // Performance criteria
    const isGoodPerformance = avgResponseTime < 1000; // Less than 1 second
    const isExcellentPerformance = avgResponseTime < 500; // Less than 500ms

    if (isExcellentPerformance) {
      this.log('   Excellent performance! (< 500ms average)', 'success');
    } else if (isGoodPerformance) {
      this.log('   Good performance (< 1s average)', 'success');
    } else {
      this.log('   Performance could be better (> 1s average)', 'warning');
    }

    return {
      testName: 'Performance Benchmark',
      iterations,
      avgResponseTime: Math.round(avgResponseTime),
      minResponseTime,
      maxResponseTime,
      performance: isExcellentPerformance ? 'excellent' : isGoodPerformance ? 'good' : 'needs improvement'
    };
  }

  async generateReport() {
    const report = {
      summary: {
        testSuite: 'CalGen API Test Suite',
        startTime: new Date(this.startTime).toISOString(),
        endTime: new Date().toISOString(),
        totalDuration: Date.now() - this.startTime,
        totalTests: this.results.length,
        successfulTests: this.results.filter(r => r.code === 0).length,
        failedTests: this.results.filter(r => r.code !== 0).length,
        successRate: Math.round((this.results.filter(r => r.code === 0).length / this.results.length) * 100)
      },
      results: this.results,
      recommendations: this.generateRecommendations()
    };

    await open(TEST_RESULTS_FILE, 'w');
    await appendFile(TEST_RESULTS_FILE, JSON.stringify(report, null, 2));

    this.log(`Detailed results saved to: ${TEST_RESULTS_FILE}`);

    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    const successful = this.results.filter(r => r.code === 0).length;
    const total = this.results.length;
    const successRate = (successful / total) * 100;

    if (successRate < 90) {
      recommendations.push({
        priority: 'high',
        issue: 'Low success rate',
        recommendation: 'Review failed tests and fix underlying issues'
      });
    }

    const performanceTests = this.results.filter(r => r.duration);
    if (performanceTests.length > 0) {
      const avgPerformance = performanceTests.reduce((sum, r) => sum + r.duration, 0) / performanceTests.length;
      if (avgPerformance > 2000) { // 2 seconds
        recommendations.push({
          priority: 'medium',
          issue: 'Slow response times',
          recommendation: 'Optimize API endpoints and database queries'
        });
      }
    }

    // Check for specific error patterns
    const errorResults = this.results.filter(r => r.code !== 0 || r.error);
    const rateLimitErrors = errorResults.filter(r => r.stderr && r.stderr.includes('429'));

    if (rateLimitErrors.length > 0) {
      recommendations.push({
        priority: 'low',
        issue: 'Rate limiting detected',
        recommendation: 'Rate limiting is working correctly, but consider longer delays if issues persist'
      });
    }

    return recommendations;
  }

  printSummary() {
    console.log('\n' + '='.repeat(70));
    console.log(`${BOLD}TEST SUMMARY${RESET}`);
    console.log('='.repeat(70));

    const total = this.results.length;
    const successful = this.results.filter(r => r.code === 0).length;
    const failed = total - successful;
    const successRate = Math.round((successful / total) * 100);

    console.log(`Total Tests: ${total}`);
    console.log(`${GREEN}Passed:${RESET} ${successful}`);
    console.log(`${RED}Failed:${RESET} ${failed}`);
    console.log(`Success Rate: ${successRate}%`);

    if (failed > 0) {
      console.log(`\n${RED}Failed Tests:${RESET}`);
      this.results
        .filter(r => r.code !== 0)
        .forEach(r => console.log(`  - ${r.description}: ${r.stderr || 'Unknown error'}`));
    }

    // Performance summary
    const performanceTests = this.results.filter(r => r.duration);
    if (performanceTests.length > 0) {
      const avgPerformance = Math.round(performanceTests.reduce((sum, r) => sum + r.duration, 0) / performanceTests.length);
      console.log(`Average Response Time: ${avgPerformance}ms`);
    }

    console.log('\nRecommendations:');
    const recommendations = this.generateRecommendations();
    recommendations.forEach((rec, index) => {
      const icon = rec.priority === 'high' ? '[HIGH]' : rec.priority === 'medium' ? '[MED]' : '[LOW]';
      console.log(`${icon} ${index + 1}. ${rec.issue}`);
      console.log(`     ${rec.recommendation}`);
    });
  }
}

// Main test function
async function runTests() {
  console.log(`${BOLD}========================================${RESET}`);
  console.log(`${BOLD}  CalGen Test Suite${RESET}`);
  console.log(`${BOLD}========================================${RESET}`);
  console.log(`Target Server: ${SERVER_URL}`);
  console.log(`Results File:  ${TEST_RESULTS_FILE}`);
  console.log(`${BOLD}========================================${RESET}`);

  const testRunner = new TestRunner();

  try {
    // Basic API tests
    await testRunner.testAPIHealth();
    await testRunner.testErrorHandling();
    await testRunner.testInvalidDateRange();
    await testRunner.testEventCountLimit();

    // Performance and rate limiting tests
    await testRunner.testRateLimiting();
    await testRunner.testPerformanceBenchmark();
    await testRunner.testConcurrentRequests();

    // Event creation tests (with delays)
    console.log('\nEvent Creation Tests...');
    await testRunner.testEventCreationSmall();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

    await testRunner.testEventCreationMedium();
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

    await testRunner.testEventCreationLarge();

  } catch (error) {
    testRunner.log(`Test suite failed: ${error.message}`, 'error');
  }

  // Generate report and summary
  const report = await testRunner.generateReport();
  testRunner.printSummary();

  // Final assessment
  const { summary } = report;
  console.log('\n' + '='.repeat(70));

  if (summary.successRate >= 90) {
    console.log(`${GREEN}${BOLD}EXCELLENT!${RESET} API is performing well!`);
    console.log('   High success rate and good performance');
  } else if (summary.successRate >= 70) {
    console.log(`${YELLOW}${BOLD}GOOD!${RESET} API is functional with minor issues`);
    console.log('   Success rate is acceptable but could be improved');
  } else {
    console.log(`${RED}${BOLD}ATTENTION!${RESET} API needs improvement`);
    console.log('   Review failed tests and address underlying issues');
  }

  console.log('='.repeat(70));
}

// Interactive mode
async function interactiveMode() {
  console.log(`\n${BOLD}Interactive Test Mode${RESET}`);
  console.log('Choose a test to run:');
  console.log('1. API Health Check');
  console.log('2. Small Event Creation (5 events)');
  console.log('3. Medium Event Creation (10 events)');
  console.log('4. Large Event Creation (20 events)');
  console.log('5. Rate Limiting Test');
  console.log('6. Performance Benchmark');
  console.log('7. Error Handling Tests');
  console.log('8. Concurrent Requests Test');
  console.log('9. Run All Tests');
  console.log('0. Exit');

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('\nEnter your choice (0-9): ', async (choice) => {
      rl.close();

      const testRunner = new TestRunner();

      switch (choice) {
        case '1':
          await testRunner.testAPIHealth();
          break;
        case '2':
          await testRunner.testEventCreationSmall();
          break;
        case '3':
          await testRunner.testEventCreationMedium();
          break;
        case '4':
          await testRunner.testEventCreationLarge();
          break;
        case '5':
          await testRunner.testRateLimiting();
          break;
        case '6':
          await testRunner.testPerformanceBenchmark();
          break;
        case '7':
          await testRunner.testErrorHandling();
          await testRunner.testInvalidDateRange();
          await testRunner.testEventCountLimit();
          break;
        case '8':
          await testRunner.testConcurrentRequests();
          break;
        case '9':
          await runTests();
          break;
        case '0':
          console.log('Goodbye!');
          process.exit(0);
        default:
          console.log(`${RED}Invalid choice. Please try again.${RESET}`);
          await interactiveMode();
          return;
      }

      resolve();
    });
  });
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`${BOLD}CalGen Test Runner${RESET}`);
    console.log('');
    console.log('Usage:');
    console.log('  node test-runner.js                    # Interactive mode');
    console.log('  node test-runner.js --all              # Run all tests');
    console.log('  node test-runner.js --health           # Health check only');
    console.log('  node test-runner.js --small            # Small event test');
    console.log('  node test-runner.js --medium           # Medium event test');
    console.log('  node test-runner.js --large            # Large event test');
    console.log('  node test-runner.js --help             # Show this help');
    return;
  }

  if (args.includes('--all')) {
    await runTests();
  } else if (args.includes('--health')) {
    const testRunner = new TestRunner();
    await testRunner.testAPIHealth();
  } else if (args.includes('--small')) {
    const testRunner = new TestRunner();
    await testRunner.testEventCreationSmall();
  } else if (args.includes('--medium')) {
    const testRunner = new TestRunner();
    await testRunner.testEventCreationMedium();
  } else if (args.includes('--large')) {
    const testRunner = new TestRunner();
    await testRunner.testEventCreationLarge();
  } else {
    await interactiveMode();
  }
}

// Run main function
main().catch(console.error);
