# 🧪 CalGen - Testing Guide

This comprehensive testing suite helps you validate API rate limiting, batch processing, event creation, and overall system reliability.

## 🚀 Quick Start

### Prerequisites
- Server running on `http://localhost:3000`
- Node.js installed (for advanced tests)
- curl installed (for basic tests)

## 📋 Available Tests

### 1. **Basic Bash Tests** (Recommended for quick checks)
```bash
# Run all tests with detailed output
bash scripts/run-tests.sh

# Results will be saved to ./test-results/test_results_TIMESTAMP.txt
```

### 2. **Advanced Node.js Tests** (Comprehensive analysis)
```bash
# Interactive mode - choose specific tests
node scripts/test-runner.js

# Run all tests automatically
node scripts/test-runner.js --all

# Run specific tests
node scripts/test-runner.js --health      # API health check
node scripts/test-runner.js --small       # Small event creation (5 events)
node scripts/test-runner.js --medium      # Medium event creation (10 events)
node scripts/test-runner.js --large       # Large event creation (20 events)
```

### 3. **API Suite Tests** (Programmatic testing)
```bash
# Run comprehensive JavaScript test suite
node tests/api-test.js
```

## 🎯 What These Tests Check

### ✅ **API Health & Connectivity**
- Server response status
- Authentication status
- Basic endpoint availability

### ⏱️ **Rate Limiting & Performance**
- **Rate Limit Detection**: Rapid requests to test API rate limiting
- **Response Time Analysis**: Average, min, max, P95, P99 response times
- **Concurrent Load**: Multiple simultaneous requests
- **Performance Benchmark**: Consistent response time measurement

### 📦 **Batch Processing**
- **Small Batch**: 5 events creation test
- **Medium Batch**: 10 events creation test  
- **Large Batch**: 20 events creation test
- **Success Rate Analysis**: % of events successfully created

### 📅 **Date Calculation Validation**
- **Single Day**: Events within one day
- **Week Range**: Events across 7 days
- **Large Range**: Events across multiple weeks
- **Edge Cases**: Invalid date ranges and boundaries

### 🤖 **AI Service Reliability**
- **Different Input Types**: Work, gym, study, social events
- **Content Quality**: AI-generated event titles and descriptions
- **Fallback Testing**: Behavior when AI services fail
- **Error Recovery**: Retry logic and graceful degradation

### 🛡️ **Error Handling**
- **Missing Fields**: Required field validation
- **Invalid Data**: Date ranges, event counts
- **Edge Cases**: Unusual input scenarios
- **API Errors**: Network failures, service unavailable

## 📊 Test Results Analysis

### **Success Criteria:**
- ✅ **API Health**: 200 status response
- ✅ **Event Creation**: >90% success rate
- ✅ **Response Time**: <2s for most operations
- ✅ **Error Handling**: Proper 400/500 status codes
- ✅ **Rate Limiting**: Graceful handling of high traffic

### **Performance Benchmarks:**
- 🏆 **Excellent**: <500ms average response time
- ✅ **Good**: 500ms - 1s average response time
- ⚠️ **Needs Improvement**: >1s average response time

### **Success Rate Categories:**
- 🏆 **Excellent**: >95% tests passing
- ✅ **Good**: 85-95% tests passing
- ⚠️ **Needs Work**: 70-85% tests passing
- ❌ **Critical**: <70% tests passing

## 🔧 Troubleshooting Common Issues

### **Tests Failing with Connection Errors**
```bash
# Check if server is running
curl http://localhost:3000/api/auth/status

# Start the server
pnpm run dev
```

### **Rate Limit Errors (429)**
- This is **expected behavior** and indicates your rate limiting is working
- Wait a few seconds between test runs
- Check if batch delays are properly implemented

### **Authentication Errors (401)**
```bash
# Authorize the application
curl http://localhost:3000/auth
# Complete the OAuth flow in your browser
```

### **Event Creation Failures**
- Check Google Calendar API quota
- Verify authentication tokens are valid
- Review server logs for detailed error messages

## 📈 Advanced Testing Scenarios

### **Load Testing Pattern**
```bash
# Test different event counts
for count in 5 10 15 20 25 30; do
  echo "Testing $count events..."
  curl -X POST -H "Content-Type: application/json" \
    -d "{\"startDate\":\"2025-11-14\",\"endDate\":\"2025-11-21\",\"count\":$count,\"userInput\":\"load test $count\"}" \
    http://localhost:3000/api/events
  sleep 3  # Respect rate limits
done
```

### **Concurrent User Simulation**
```bash
# Simulate 3 users creating events simultaneously
(
  curl -X POST -H "Content-Type: application/json" \
    -d '{"startDate":"2025-11-14","endDate":"2025-11-21","count":5,"userInput":"user1"}' \
    http://localhost:3000/api/events &
  
  curl -X POST -H "Content-Type: application/json" \
    -d '{"startDate":"2025-11-14","endDate":"2025-11-21","count":5,"userInput":"user2"}' \
    http://localhost:3000/api/events &
  
  curl -X POST -H "Content-Type: application/json" \
    -d '{"startDate":"2025-11-14","endDate":"2025-11-21","count":5,"userInput":"user3"}' \
    http://localhost:3000/api/events &
  
  wait
)
```

### **Date Range Edge Cases**
```bash
# Test month boundaries
curl -X POST -H "Content-Type: application/json" \
  -d '{"startDate":"2025-01-28","endDate":"2025-02-04","count":10,"userInput":"month boundary test"}' \
  http://localhost:3000/api/events

# Test leap year handling (if applicable)
curl -X POST -H "Content-Type: application/json" \
  -d '{"startDate":"2024-02-28","endDate":"2024-03-01","count":5,"userInput":"leap year test"}' \
  http://localhost:3000/api/events
```

## 📋 Test Checklist Before Production

### **Functionality Tests** ✅
- [ ] API health check responds correctly
- [ ] Event creation works for small batches (1-5 events)
- [ ] Event creation works for medium batches (10-15 events)
- [ ] Event creation works for large batches (20-30 events)
- [ ] Error handling works for invalid inputs
- [ ] Date calculations work across various ranges

### **Performance Tests** ✅
- [ ] Response times <2s for most operations
- [ ] Rate limiting prevents API abuse
- [ ] Concurrent requests handled gracefully
- [ ] Memory usage stays reasonable
- [ ] No memory leaks during extended testing

### **Reliability Tests** ✅
- [ ] AI service failures have proper fallbacks
- [ ] Network errors handled gracefully
- [ ] Invalid data rejected with proper error messages
- [ ] Authentication flows work correctly
- [ ] Batch processing completes successfully

### **Edge Cases** ✅
- [ ] Single-day date ranges work
- [ ] Multi-week date ranges work
- [ ] Maximum event counts (30) handled
- [ ] Invalid event counts rejected
- [ ] Past dates properly rejected

## 🎯 Production Readiness Checklist

Your API is **Production Ready** when:

- ✅ **Success Rate**: >95% of tests pass
- ✅ **Performance**: <2s average response time
- ✅ **Reliability**: Graceful error handling and fallbacks
- ✅ **Security**: Proper authentication and input validation
- ✅ **Scalability**: Handles concurrent users effectively
- ✅ **Monitoring**: Comprehensive logging and error tracking

## 📞 Getting Help

If tests are failing or you need assistance:

1. **Check the logs**: Review detailed test output
2. **Verify server status**: Ensure server is running properly
3. **Check authentication**: Complete OAuth flow if needed
4. **Review rate limits**: Consider API quotas and limits
5. **Examine error messages**: Detailed errors often point to specific issues

## 🏆 Success Indicators

🎉 **Excellent Performance**: All tests pass, <500ms response times  
✅ **Good Performance**: Most tests pass, <2s response times  
⚠️ **Needs Work**: Some tests failing, >2s response times  
❌ **Critical Issues**: Many tests failing, slow response times

---

**Happy Testing!** 🧪

Remember: These tests are designed to validate your optimizations and ensure your application is ready for production use.