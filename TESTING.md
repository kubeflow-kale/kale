# Testing Guide for Kubeflow Kale UI Tests

This guide explains how to run the UI tests and verify they're working correctly.

## Running the Tests

### Step 1: Build the Extension

From the `labextension` directory:

```bash
cd labextension
jlpm install
jlpm build:prod
```

### Step 2: Install Test Dependencies (One-time setup)

```bash
cd ui-tests
jlpm install
jlpm playwright install
cd ..
```

### Step 3: Run the Tests

```bash
cd ui-tests
jlpm playwright test
```

**Expected output:** You should see 5 tests run:
1. ✓ should emit an activation console message
2. ✓ should show Kale panel in left sidebar
3. ✓ should toggle Kale enable switch and show inline metadata
4. ✓ should tag a cell and persist to notebook JSON
5. ✓ should create cell dependency and persist to notebook JSON

### Alternative: Run with UI Mode (Recommended for Development)

```bash
cd ui-tests
jlpm playwright test --ui
```

This opens an interactive browser where you can:
- See tests run in real-time
- Inspect each step
- Debug failures visually
- Replay individual tests

### Run a Single Test

```bash
cd ui-tests
jlpm playwright test -g "should tag a cell"
```

### Debug Mode

```bash
cd ui-tests
jlpm playwright test --debug
```

This pauses execution and lets you step through each test action.

---

## Verifying Tests Are Working Correctly

### Method 1: Check Test Output

When tests pass, you'll see:
```
Running 5 tests using 1 worker

  ✓ 1 kubeflow-kale-labextension.spec.ts:28:1 › should emit an activation console message (2s)
  ✓ 2 kubeflow-kale-labextension.spec.ts:46:1 › should show Kale panel in left sidebar (3s)
  ✓ 3 kubeflow-kale-labextension.spec.ts:66:1 › should toggle Kale enable switch... (5s)
  ✓ 4 kubeflow-kale-labextension.spec.ts:95:1 › should tag a cell and persist... (8s)
  ✓ 5 kubeflow-kale-labextension.spec.ts:163:1 › should create cell dependency... (10s)

  5 passed (28s)
```

### Method 2: Intentionally Break the Code

Let's verify the tests actually catch bugs. Try breaking the extension:

#### Test A: Break the Activation Message

1. Edit `labextension/src/index.ts`
2. Change the activation message:
   ```typescript
   console.log('JupyterLab extension kubeflow-kale-labextension is BROKEN!');
   ```
3. Rebuild: `jlpm build:prod`
4. Run test: `cd ui-tests && jlpm playwright test -g "activation"`
5. **Expected:** ❌ Test should FAIL with message about missing activation log

#### Test B: Break the Tag Persistence

1. Edit `labextension/src/lib/TagsUtils.ts`
2. In the `setKaleCellTags` function, comment out the line that adds tags
3. Rebuild: `jlpm build:prod`
4. Run test: `cd ui-tests && jlpm playwright test -g "tag a cell"`
5. **Expected:** ❌ Test should FAIL because tags won't be in notebook JSON

#### Test C: Break the Enable Switch

1. Edit `labextension/src/widgets/cell-metadata/InlineCellsMetadata.tsx`
2. Comment out the code that shows inline metadata when enabled
3. Rebuild: `jlpm build:prod`
4. Run test: `cd ui-tests && jlpm playwright test -g "toggle Kale"`
5. **Expected:** ❌ Test should FAIL because inline metadata won't appear

**Remember to revert these changes after testing!**

### Method 3: Check Test Artifacts

After running tests, check the `.galata-root` directory:

```bash
ls -la ../.galata-root/
```

You should see test notebooks created:
- `test-tagging.ipynb`
- `test-dependencies.ipynb`

Examine the notebook JSON:

```bash
cat ../.galata-root/test-tagging.ipynb | python -m json.tool | grep -A 5 "tags"
```

You should see:
```json
"tags": [
    "step:load_data"
]
```

### Method 4: Visual Verification with Headed Mode

Run tests with visible browser:

```bash
cd ui-tests
jlpm playwright test --headed --workers=1
```

You'll see:
- Browser window opening
- Notebooks being created
- Cells being tagged
- Metadata appearing/disappearing

This confirms the tests interact with the real UI.

### Method 5: Check Coverage of Critical Paths

Our tests verify these critical user workflows:

**✓ Extension loads properly**
- Test: "should emit an activation console message"
- Validates: Extension initialization

**✓ UI is accessible**
- Test: "should show Kale panel in left sidebar"
- Validates: Panel rendering, sidebar integration

**✓ Enable/disable functionality**
- Test: "should toggle Kale enable switch"
- Validates: UI state management, inline metadata lifecycle

**✓ Metadata editing persists**
- Test: "should tag a cell and persist to notebook JSON"
- Validates: Cell tagging, file I/O, data persistence

**✓ Dependencies work end-to-end**
- Test: "should create cell dependency"
- Validates: Multi-cell tagging, dependency tracking, complex metadata

---

## Troubleshooting

### Tests Fail with "Browser not found"

```bash
cd ui-tests
jlpm playwright install
```

### Tests Timeout

Increase timeout in test file:
```typescript
test.setTimeout(60000); // 60 seconds
```

### Port 8889 Already in Use

Kill existing JupyterLab instance:
```bash
lsof -ti:8889 | xargs kill -9
```

### Galata Root Cleanup Issues

Manually remove:
```bash
rm -rf ../.galata-root
```

---

## What Each Test Validates

### Test 1: Activation Message
- **What:** Extension console log on startup
- **Why:** Ensures extension loads without errors
- **Critical:** Yes - if this fails, extension didn't load

### Test 2: Panel Visibility
- **What:** Kale tab and panel appear in sidebar
- **Why:** Users need to access the UI
- **Critical:** Yes - core UI accessibility

### Test 3: Enable/Disable Toggle
- **What:** Inline metadata shows/hides on cells
- **Why:** Main UI interaction for enabling Kale
- **Critical:** Yes - primary user workflow

### Test 4: Cell Tagging
- **What:** Tag a cell → see it in UI → verify in JSON file
- **Why:** Core feature - converting cells to pipeline steps
- **Critical:** YES - most important feature
- **Validates:**
  - UI interaction (clicking edit button)
  - Form input (typing step name)
  - Visual feedback (chip appears)
  - Persistence (tags in .ipynb file)

### Test 5: Cell Dependencies
- **What:** Tag two cells with dependency relationship
- **Why:** Pipeline steps need dependencies
- **Critical:** YES - required for multi-step pipelines
- **Validates:**
  - Multiple cell tagging
  - Dependency selection UI
  - Dependency indicator rendering
  - Complex tag structure in JSON (`prev:` tags)

---

## CI Integration

To run tests in CI/CD pipelines:

```yaml
- name: Install dependencies
  run: |
    cd labextension
    jlpm install

- name: Build extension
  run: |
    cd labextension
    jlpm build:prod

- name: Install test dependencies
  run: |
    cd labextension/ui-tests
    jlpm install
    jlpm playwright install --with-deps

- name: Run tests
  run: |
    cd labextension/ui-tests
    jlpm playwright test

- name: Upload test artifacts
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: labextension/ui-tests/playwright-report/
```

---

## Next Steps

After verifying these tests work:

1. **Add to CI/CD pipeline** - Run on every PR
2. **Expand coverage** - Add tests for deployment workflow (when KFP available)
3. **Add visual regression** - Screenshot testing for UI consistency
4. **Performance tests** - Test with large notebooks (100+ cells)
5. **Error scenario tests** - Invalid inputs, edge cases
