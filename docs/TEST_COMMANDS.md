# 🧪 Interactive Test Suite - Run Tests Directly

**⚠️ IMPORTANT:** Before running any tests, make sure your server is running:
```bash
pnpm run dev
```

And you've completed authentication by visiting: `http://localhost:3000/auth`

---

## 🚀 Quick Health Check

### Test 1: API Connectivity
```bash
curl -s -w "HTTP Status: %{http_code}\nResponse Time: %{time_total}s" http://localhost:3000/api/auth/status
```

**Expected:** `HTTP Status: 200` and response time < 2 seconds

### Test 2: Authentication Status
```bash
curl -s http://localhost:3000/api/auth/status | jq .
```

**Expected:** Shows `"authenticated": true`

---

## 📦 Event Creation Tests

### Test 3: Small Event Batch (5 events)
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  -d '{
    "startDate": "2025-11-14",
    "endDate": "2025-11-21",
    "count": 5,
    "userInput": "gym workouts and fitness activities"
  }' \
  http://localhost:3000/api/events | jq '.successful, .failed, .totalTime'
```

**Expected:** `successful: 5`, `failed: 0`, response time < 10 seconds

### Test 4: Medium Event Batch (10 events)
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  -d '{
    "startDate": "2025-11-14",
    "endDate": "2025-11-21",
    "count": 10,
    "userInput": "work meetings, coding sessions, and study time"
  }' \
  http://localhost:3000/api/events | jq '.successful, .failed, .totalTime'
```

**Expected:** `successful: 8-10`, `failed: 0-2`, response time < 15 seconds

### Test 5: Large Event Batch (20 events)
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  -d '{
    "startDate": "2025-11-14",
    "endDate": "2025-11-28",
    "count": 20,
    "userInput": "comprehensive daily routine including exercise, work, study, and leisure activities"
  }' \
  http://localhost:3000/api/events | jq '.successful, .failed, .totalTime'
```

**Expected:** `successful: 15-20`, `failed: 0-5`, response time < 30 seconds

---

## 🛡️ Error Handling Tests

### Test 6: Missing Required Fields
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -d '{"count": 5}' \
  http://localhost:3000/api/events
```

**Expected:** `HTTP Status: 400` with error message about missing fields

### Test 7: Invalid Date Range
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -d '{
    "startDate": "2025-11-21",
    "endDate": "2025-11-14",
    "count": 5,
    "userInput": "test"
  }' \
  http://localhost:3000/api/events
```

**Expected:** `HTTP Status: 400` with error about invalid date range

### Test 8: Event Count Over Limit
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -d '{
    "startDate": "2025-11-14",
    "endDate": "2025-11-21",
    "count": 50,
    "userInput": "test"
  }' \
  http://localhost:3000/api/events
```

**Expected:** `HTTP Status: 400` with error about event count limit

---

## ⚡ Rate Limiting & Performance Tests

### Test 9: Rapid Requests (Rate Limiting Test)
```bash
echo "Making 5 rapid requests to test rate limiting..."
for i in {1..5}; do
  echo "Request $i:"
  curl -s -w "Time: %{time_total}s, Status: %{http_code}\n" \
    http://localhost:3000/api/auth/status
  sleep 0.1
done
```

**Expected:** All requests succeed, or some show rate limiting (which is good!)

### Test 10: Performance Benchmark
```bash
echo "Running performance benchmark (5 requests)..."
total_time=0
for i in {1..5}; do
  start_time=$(date +%s%N)
  curl -s http://localhost:3000/api/auth/status > /dev/null
  end_time=$(date +%s%N)
  elapsed=$((($end_time - $start_time) / 1000000))
  total_time=$((total_time + elapsed))
  echo "Request $i: ${elapsed}ms"
done
avg_time=$((total_time / 5))
echo "Average response time: ${avg_time}ms"
```

**Expected:** Average response time < 500ms

### Test 11: Concurrent Requests
```bash
echo "Testing concurrent requests..."
(
  curl -s -X POST -H "Content-Type: application/json" \
       -d '{"startDate": "2025-11-14", "endDate": "2025-11-21", "count": 3, "userInput": "concurrent test 1"}' \
       http://localhost:3000/api/events | jq -r '.successful' &
  
  curl -s -X POST -H "Content-Type: application/json" \
       -d '{"startDate": "2025-11-14", "endDate": "2025-11-21", "count": 3, "userInput": "concurrent test 2"}' \
       http://localhost:3000/api/events | jq -r '.successful' &
  
  wait
  echo "Concurrent requests completed"
)
```

**Expected:** Both requests succeed, may take longer due to batching

---

## 📅 Date Range Validation Tests

### Test 12: Single Day Range
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -d '{
    "startDate": "2025-11-14",
    "endDate": "2025-11-14",
    "count": 3,
    "userInput": "single day activities"
  }' \
  http://localhost:3000/api/events | jq '.successful, .failed'
```

**Expected:** `successful: 3`, `failed: 0`

### Test 13: Week Range
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -d '{
    "startDate": "2025-11-14",
    "endDate": "2025-11-21",
    "count": 8,
    "userInput": "weekly planning activities"
  }' \
  http://localhost:3000/api/events | jq '.successful, .failed'
```

**Expected:** `successful: 6-8`, `failed: 0-2`

### Test 14: Large Date Range (2 weeks)
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -d '{
    "startDate": "2025-11-14",
    "endDate": "2025-11-28",
    "count": 15,
    "userInput": "two week planning and activities"
  }' \
  http://localhost:3000/api/events | jq '.successful, .failed'
```

**Expected:** `successful: 12-15`, `failed: 0-3`

---

## 🤖 AI Service Tests

### Test 15: Different AI Input Types
```bash
# Test 1: Work-related events
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"startDate": "2025-11-14", "endDate": "2025-11-21", "count": 3, "userInput": "professional work meetings and presentations"}' \
  http://localhost:3000/api/events | jq '.successful'

echo "Waiting 2 seconds..."
sleep 2

# Test 2: Fitness events
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"startDate": "2025-11-14", "endDate": "2025-11-21", "count": 3, "userInput": "gym workouts and fitness training"}' \
  http://localhost:3000/api/events | jq '.successful'

echo "Waiting 2 seconds..."
sleep 2

# Test 3: Academic events
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"startDate": "2025-11-14", "endDate": "2025-11-21", "count": 3, "userInput": "study sessions and exam preparation"}' \
  http://localhost:3000/api/events | jq '.successful'

echo "Waiting 2 seconds..."
sleep 2

# Test 4: Social events
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"startDate": "2025-11-14", "endDate": "2025-11-21", "count": 3, "userInput": "social gatherings and family events"}' \
  http://localhost:3000/api/events | jq '.successful'

echo "Waiting 2 seconds..."
sleep 2

# Test 5: Hobby events
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"startDate": "2025-11-14", "endDate": "2025-11-21", "count": 3, "userInput": "hobby projects and personal development"}' \
  http://localhost:3000/api/events | jq '.successful'
```

**Expected:** All 5 tests should show `successful: 3`

---

## 🔍 Event Management Tests

### Test 16: List Created Events
```bash
curl -s -w "\nHTTP Status: %{http_code}\n" \
  http://localhost:3000/api/events/created | jq '.total, .events | length'
```

**Expected:** Shows total number of events created by this app

### Test 17: Delete All Events (⚠️ WARNING: This will delete all events!)
```bash
echo "⚠️ WARNING: This will delete all events created by this app!"
echo "Type 'yes' to continue or anything else to cancel:"
read confirmation

if [ "$confirmation" = "yes" ]; then
  curl -s -X POST \
    -w "\nHTTP Status: %{http_code}\n" \
    http://localhost:3000/api/events | jq '.successfully_deleted, .failed_deletions'
else
  echo "Deletion cancelled."
fi
```

**Expected:** Shows number of events successfully deleted

---

## 📊 Load Testing Scenarios

### Test 18: Progressive Load Test
```bash
echo "Progressive Load Test - Testing different event counts"
for count in 5 10 15 20 25; do
  echo "Testing $count events..."
  start_time=$(date +%s)
  
  result=$(curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"startDate\": \"2025-11-14\", \"endDate\": \"2025-11-25\", \"count\": $count, \"userInput\": \"load test $count events\"}" \
    http://localhost:3000/api/events)
  
  end_time=$(date +%s)
  duration=$((end_time - start_time))
  
  successful=$(echo $result | jq -r '.successful // 0')
  failed=$(echo $result | jq -r '.failed // 0')
  
  echo "  Events: $count, Successful: $successful, Failed: $failed, Duration: ${duration}s"
  
  # Wait between tests to respect rate limits
  sleep 3
done
```

### Test 19: Stress Test (⚠️ Advanced)
```bash
echo "Stress Test - Multiple concurrent batches"
echo "This will test system limits with 3 batches of 20 events each"

# Run 3 batches in parallel
for i in {1..3}; do
  (
    echo "Starting batch $i..."
    curl -s -X POST -H "Content-Type: application/json" \
      -d "{\"startDate\": \"2025-11-14\", \"endDate\": \"2025-12-01\", \"count\": 20, \"userInput\": \"stress test batch $i\"}" \
      http://localhost:3000/api/events > "stress_test_$i.json" 2>&1
    echo "Batch $i completed"
  ) &
done

# Wait for all to complete
wait

# Check results
echo "Stress Test Results:"
for i in {1..3}; do
  if [ -f "stress_test_$i.json" ]; then
    successful=$(cat "stress_test_$i.json" | jq -r '.successful // 0')
    failed=$(cat "stress_test_$i.json" | jq -r '.failed // 0')
    echo "  Batch $i: Successful: $successful, Failed: $failed"
    rm "stress_test_$i.json"
  else
    echo "  Batch $i: Failed - No response file"
  fi
done
```

---

## 🎯 Quick Diagnostic Commands

### Check Server Status
```bash
# Quick health check
curl -s http://localhost:3000/api/auth/status | jq '.authenticated'

# Check if server responds
curl -I http://localhost:3000
```

### View Current Events
```bash
# Count current events
curl -s http://localhost:3000/api/events/created | jq '.total'

# List first 5 events
curl -s http://localhost:3000/api/events/created | jq '.events[0:4]'
```

### Test AI Model
```bash
# Quick AI test with single event
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"startDate": "2025-11-14", "endDate": "2025-11-21", "count": 1, "userInput": "single test event"}' \
  http://localhost:3000/api/events | jq '.successful'
```

---

## 📋 Test Results Interpretation

### ✅ Success Indicators
- HTTP Status: 200 for successful requests
- HTTP Status: 400 for bad requests (expected)
- successful > failed for event creation
- Response time < 2 seconds for most operations
- No timeout errors
- Rate limiting working (shows 429 for rapid requests)

### ⚠️ Warning Signs
- Response times > 5 seconds
- successful < failed for event creation
- Frequent timeout errors
- Authentication errors (401)
- Server errors (500)

### ❌ Critical Issues
- Connection refused errors
- Server crashes during tests
- 0% success rate for event creation
- All requests timing out

---

## 🔧 Troubleshooting Quick Fixes

### Connection Issues
```bash
# Check if server is running
ps aux | grep node

# Restart server if needed
pnpm run dev
```

### Authentication Issues
```bash
# Re-authorize
curl http://localhost:3000/auth
```

### Rate Limit Issues
```bash
# Wait and retry
sleep 5
curl http://localhost:3000/api/auth/status
```

---

**🎉 Ready to Test!** Copy and paste any command above to run specific tests. Start with the Quick Health Check first, then proceed through the numbered tests.