# 🧪 One-Click Test Runner

## 🚀 Run All Tests Automatically

```bash
# Simple test runner
bash scripts/run-tests.sh
```

## 🎮 Interactive Test Menu

```bash
# Interactive mode with menu
node scripts/test-runner.js
```

## 📊 Quick Test Results

Test results are automatically saved to:
- `./test-results/test_results_TIMESTAMP.txt` (from bash tests)
- `./test-results-detailed.json` (from Node.js tests)

## 🎯 Quick Status Check

```bash
# Check if everything is working
curl -s http://localhost:3000/api/auth/status | jq '.authenticated'
```

**Expected:** `true`