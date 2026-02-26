# Quick Test Guide

## Run Tests in 3 Steps

### 1. Build the Extension (from `labextension` directory)
```bash
cd labextension
jlpm install
jlpm build:prod
```

### 2. Install Test Dependencies (one-time, from `labextension/ui-tests`)
```bash
cd ui-tests
jlpm install
jlpm playwright install
```

### 3. Run Tests
```bash
jlpm playwright test
```

**Expected: 5 tests pass** ✅

---

## Quick Verification: Are Tests Actually Working?

### Option 1: Run with Visual Browser
```bash
cd labextension/ui-tests
jlpm playwright test --headed --workers=1
```
**Watch:** Browser opens, notebooks created, cells tagged, metadata appears

### Option 2: Break Something and See Test Fail

Edit `labextension/src/index.ts`, change line ~46:
```typescript
// Change this:
console.log('JupyterLab extension kubeflow-kale-labextension is activated!');

// To this:
console.log('BROKEN!');
```

Then:
```bash
cd labextension
jlpm build:prod
cd ui-tests
jlpm playwright test -g "activation"
```

**Expected: Test FAILS** ❌ (proving it's actually checking the code)

**Revert the change after testing!**

### Option 3: Check Test Artifacts

After running tests:
```bash
cat ../.galata-root/test-tagging.ipynb | grep -A 2 '"tags"'
```

**Expected output:**
```json
"tags": [
  "step:load_data"
]
```

This proves the test actually wrote tags to the notebook file.

---

## What These Tests Verify

1. ✅ Extension activates correctly
2. ✅ Kale panel appears in sidebar
3. ✅ Enable/disable toggle works
4. ✅ Tagging cells works AND persists to .ipynb file
5. ✅ Cell dependencies work AND persist to .ipynb file

---

## Troubleshooting

**"Browser not found"**
```bash
cd labextension/ui-tests
jlpm playwright install
```

**Port 8889 in use**
```bash
lsof -ti:8889 | xargs kill -9
```

**Tests timeout**
Increase timeout or run single test:
```bash
jlpm playwright test -g "activation" --timeout=60000
```

---

See `TESTING.md` for detailed documentation.
