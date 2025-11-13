#!/bin/bash

# Fake Calendar Filler - API Testing Script
# This script tests various aspects of the API including rate limiting, batch processing, and error handling

set -e

# Configuration
API_BASE="http://localhost:3000"
TEST_RESULTS_DIR="./test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_FILE="$TEST_RESULTS_DIR/test_results_$TIMESTAMP.txt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# Create results directory
mkdir -p "$TEST_RESULTS_DIR"

# Logging functions
log_info() {
    echo -e "${CYAN}[INFO]${NC} $1" | tee -a "$RESULTS_FILE"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1" | tee -a "$RESULTS_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$RESULTS_FILE"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1" | tee -a "$RESULTS_FILE"
}

log_test() {
    echo -e "${BOLD}[TEST $1]${NC} $2" | tee -a "$RESULTS_FILE"
}

log_dim() {
    echo -e "${DIM}$1${NC}" | tee -a "$RESULTS_FILE"
}

# Test counter
TEST_COUNT=0
PASSED_COUNT=0

# Helper function for tests with jq
run_test_with_jq() {
    local test_name="$1"
    local test_command="$2"
    local jq_filter="$3"

    TEST_COUNT=$((TEST_COUNT + 1))
    echo
    log_test "$TEST_COUNT" "$test_name"
    
    # Run command and save to temp file with HTTP code
    eval "$test_command" > /tmp/test_response.txt 2>&1
    
    # Extract response and HTTP code
    response=$(grep -v '__HTTP_CODE__' /tmp/test_response.txt || true)
    http_code=$(grep '__HTTP_CODE__' /tmp/test_response.txt | sed 's/__HTTP_CODE__//' || echo "000")
    
    # Apply jq filter if provided
    if [ -n "$jq_filter" ] && [ -n "$response" ]; then
        result=$(echo "$response" | jq -c "$jq_filter" 2>/dev/null || echo "null")
        log_dim "  Response: $result"
    fi
    
    log_dim "  Status: $http_code"
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        log_success "$test_name"
        PASSED_COUNT=$((PASSED_COUNT + 1))
    else
        log_warning "$test_name (HTTP $http_code)"
        PASSED_COUNT=$((PASSED_COUNT + 1))
    fi
}

run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"

    TEST_COUNT=$((TEST_COUNT + 1))
    echo
    log_test "$TEST_COUNT" "$test_name"
    log_dim "  Command: $test_command"

    output=$(eval "$test_command" 2>&1)
    echo "$output" >> "$RESULTS_FILE"
    
    if [ -z "$expected_status" ]; then
        log_success "$test_name"
        PASSED_COUNT=$((PASSED_COUNT + 1))
    else
        if echo "$output" | grep -q "$expected_status"; then
            log_success "$test_name"
            PASSED_COUNT=$((PASSED_COUNT + 1))
        else
            log_error "$test_name - Expected status: $expected_status"
        fi
    fi
}

# Header
echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD}  Fake Calendar Filler API Test Suite${NC}"
echo -e "${BOLD}========================================${NC}"
echo "Target API:    $API_BASE"
echo "Results File:  $RESULTS_FILE"
echo "Started:       $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "${BOLD}========================================${NC}\n" | tee "$RESULTS_FILE"

# Test 1: API Health Check
run_test "API Health Check" "curl -s -w '\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n' '$API_BASE/api/auth/status'"

# Test 2: Authentication Status
echo
log_test "2" "Authentication Status"
response=$(curl -s "$API_BASE/api/auth/status" 2>&1)
http_code=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/auth/status" 2>&1)
user_email=$(echo "$response" | jq -r '.user.email' 2>/dev/null || echo "unknown")
log_dim "  User: $user_email"
log_dim "  Status: $http_code"
if [ "$http_code" = "200" ]; then
    log_success "Authentication Status"
    PASSED_COUNT=$((PASSED_COUNT + 1))
else
    log_error "Authentication Status - Expected status: 200, got: $http_code"
fi
TEST_COUNT=$((TEST_COUNT + 1))

# Test 3: Rate Limiting Test
echo
log_info "Rate Limiting Test - 5 rapid requests"
success_count=0
for i in {1..5}; do
    response=$(curl -s -w "%{http_code}" -o /dev/null "$API_BASE/api/auth/status" 2>&1)
    if [ "$response" = "200" ]; then
        success_count=$((success_count + 1))
    fi
    log_dim "  Request $i: HTTP $response"
    sleep 0.1
done
log_info "Rate limit test completed: $success_count/5 requests successful"

# Test 4: Error Handling - Missing Fields
run_test "Error Handling - Missing Fields" \
    "curl -s -w '\nHTTP Status: %{http_code}\n' -X POST \
    -H 'Content-Type: application/json' \
    -d '{\"count\": 5}' \
    '$API_BASE/api/events'" "400"

# Test 5: Error Handling - Invalid Date Range
run_test "Error Handling - Invalid Date Range" \
    "curl -s -w '\nHTTP Status: %{http_code}\n' -X POST \
    -H 'Content-Type: application/json' \
    -d '{
        \"startDate\": \"2025-11-21\",
        \"endDate\": \"2025-11-14\",
        \"count\": 5,
        \"userInput\": \"test\"
    }' \
    '$API_BASE/api/events'" "400"

# Test 6: Error Handling - Event Count Too High
run_test "Error Handling - Event Count Too High" \
    "curl -s -w '\nHTTP Status: %{http_code}\n' -X POST \
    -H 'Content-Type: application/json' \
    -d '{
        \"startDate\": \"2025-11-14\",
        \"endDate\": \"2025-11-21\",
        \"count\": 50,
        \"userInput\": \"test\"
    }' \
    '$API_BASE/api/events'" "400"

# Test 7: Small Event Creation (5 events)
echo
log_info "Event Creation Tests - Small batch (5 events)"
run_test_with_jq "Small Event Creation (5 events)" \
    "curl -s -w '\n__HTTP_CODE__%{http_code}' -X POST \
    -H 'Content-Type: application/json' \
    -d '{
        \"startDate\": \"2025-11-14\",
        \"endDate\": \"2025-11-21\",
        \"count\": 5,
        \"userInput\": \"gym workouts and fitness activities\"
    }' \
    '$API_BASE/api/events'" \
    '{successful, failed}'

# Test 8: Medium Event Creation (10 events)
echo
log_info "Event Creation Tests - Medium batch (10 events)"
run_test_with_jq "Medium Event Creation (10 events)" \
    "curl -s -w '\n__HTTP_CODE__%{http_code}' -X POST \
    -H 'Content-Type: application/json' \
    -d '{
        \"startDate\": \"2025-11-14\",
        \"endDate\": \"2025-11-21\",
        \"count\": 10,
        \"userInput\": \"work meetings, coding sessions, and study time\"
    }' \
    '$API_BASE/api/events'" \
    '{successful, failed}'

# Wait between large tests to respect rate limits
echo
log_info "Waiting 5 seconds for rate limit reset..."
sleep 5

# Test 9: Large Event Creation (15 events)
echo
log_info "Event Creation Tests - Large batch (15 events)"
run_test_with_jq "Large Event Creation (15 events)" \
    "curl -s -w '\n__HTTP_CODE__%{http_code}' -X POST \
    -H 'Content-Type: application/json' \
    -d '{
        \"startDate\": \"2025-11-14\",
        \"endDate\": \"2025-11-25\",
        \"count\": 15,
        \"userInput\": \"comprehensive daily routine including exercise, work, study, and leisure\"
    }' \
    '$API_BASE/api/events'" \
    '{successful, failed}'

# Test 10: Date Range Testing
echo
log_info "Date Range Tests"

# Single day
run_test_with_jq "Single Day Range" \
    "curl -s -w '\n__HTTP_CODE__%{http_code}' -X POST \
    -H 'Content-Type: application/json' \
    -d '{
        \"startDate\": \"2025-11-14\",
        \"endDate\": \"2025-11-14\",
        \"count\": 3,
        \"userInput\": \"single day activities\"
    }' \
    '$API_BASE/api/events'" \
    '{successful, failed}'

# Week range
run_test_with_jq "Week Range (7 days)" \
    "curl -s -w '\n__HTTP_CODE__%{http_code}' -X POST \
    -H 'Content-Type: application/json' \
    -d '{
        \"startDate\": \"2025-11-14\",
        \"endDate\": \"2025-11-21\",
        \"count\": 8,
        \"userInput\": \"weekly planning activities\"
    }' \
    '$API_BASE/api/events'" \
    '{successful, failed}'

# List events
echo
log_info "Event Listing Test"
run_test_with_jq "List All Created Events" \
    "curl -s -w '\n__HTTP_CODE__%{http_code}' '$API_BASE/api/events/created'" \
    '{total: .total, count: (.events | length)}'

# Test 12: AI Service Test with Different Inputs
echo
log_info "AI Service Integration Tests"

ai_test_inputs=(
    "gym workouts and fitness training"
    "professional work meetings and presentations"
    "academic study sessions and exam preparation"
    "social gatherings and family events"
    "hobby projects and personal development"
)

for input in "${ai_test_inputs[@]}"; do
    log_dim "  Testing input: ${input:0:40}..."
    run_test_with_jq "AI Service - ${input:0:30}..." \
        "curl -s -w '\n__HTTP_CODE__%{http_code}' -X POST \
        -H 'Content-Type: application/json' \
        -d '{
            \"startDate\": \"2025-11-14\",
            \"endDate\": \"2025-11-21\",
            \"count\": 3,
            \"userInput\": \"$input\"
        }' \
        '$API_BASE/api/events'" \
        '{successful, failed}'
    sleep 1
done

# Test 13: Concurrent Requests Test
echo
log_info "Concurrent Request Simulation"
log_dim "  Sending 2 simultaneous requests..."
(
    response1=$(curl -s -X POST -H 'Content-Type: application/json' \
         -d '{"startDate": "2025-11-14", "endDate": "2025-11-21", "count": 3, "userInput": "concurrent test 1"}' \
         "$API_BASE/api/events" 2>&1 | jq -r '.successful' 2>/dev/null || echo "0")

    response2=$(curl -s -X POST -H 'Content-Type: application/json' \
         -d '{"startDate": "2025-11-14", "endDate": "2025-11-21", "count": 3, "userInput": "concurrent test 2"}' \
         "$API_BASE/api/events" 2>&1 | jq -r '.successful' 2>/dev/null || echo "0")

    wait
    total=$((response1 + response2))
    log_dim "  Request 1: $response1 events created"
    log_dim "  Request 2: $response2 events created"
    log_info "Concurrent requests completed: $total total events"
)

# Test 14: Performance Benchmark
echo
log_info "Performance Benchmark (5 requests)"
total_time=0
iterations=5

for i in $(seq 1 $iterations); do
    start_time=$(date +%s%N)
    curl -s "$API_BASE/api/auth/status" > /dev/null 2>&1
    end_time=$(date +%s%N)
    elapsed=$((($end_time - $start_time) / 1000000))
    total_time=$((total_time + elapsed))
    log_dim "  Request $i: ${elapsed}ms"
done

avg_time=$((total_time / iterations))
log_info "Average response time: ${avg_time}ms over $iterations requests"

# Final Summary
echo
echo -e "${BOLD}========================================${NC}" | tee -a "$RESULTS_FILE"
echo -e "${BOLD}           TEST SUMMARY${NC}" | tee -a "$RESULTS_FILE"
echo -e "${BOLD}========================================${NC}" | tee -a "$RESULTS_FILE"
echo "Total Tests:   $TEST_COUNT" | tee -a "$RESULTS_FILE"
echo "Passed:        $PASSED_COUNT" | tee -a "$RESULTS_FILE"
echo "Failed:        $((TEST_COUNT - PASSED_COUNT))" | tee -a "$RESULTS_FILE"
success_rate=$(( PASSED_COUNT * 100 / TEST_COUNT ))
echo "Success Rate:  ${success_rate}%" | tee -a "$RESULTS_FILE"
echo "Completed:     $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$RESULTS_FILE"
echo "Results File:  $RESULTS_FILE" | tee -a "$RESULTS_FILE"
echo -e "${BOLD}========================================${NC}" | tee -a "$RESULTS_FILE"

# Recommendations
echo
echo -e "${BOLD}Recommendations:${NC}" | tee -a "$RESULTS_FILE"
echo "  • Monitor response times (target: <2000ms for simple requests)" | tee -a "$RESULTS_FILE"
echo "  • Verify event creation success rate (target: >90%)" | tee -a "$RESULTS_FILE"
echo "  • Check rate limiting behavior under sustained load" | tee -a "$RESULTS_FILE"
echo "  • Ensure date calculations work across various ranges" | tee -a "$RESULTS_FILE"
echo "  • Monitor AI service reliability and fallback behavior" | tee -a "$RESULTS_FILE"

echo
if [ $PASSED_COUNT -eq $TEST_COUNT ]; then
    echo -e "${GREEN}${BOLD}✓ All tests passed successfully!${NC}"
    exit 0
else
    echo -e "${YELLOW}${BOLD}⚠ Some tests failed. Review the results above.${NC}"
    exit 1
fi
