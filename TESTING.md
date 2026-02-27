# Testing Guide for Kubeflow Kale UI Tests

This guide explains how to run the UI tests and verify they're working correctly.

There are currently five UI tests:
1. **Activation Message:** Extension console log on startup
2. **Panel Visibility:** Kale tab and panel appear in sidebar
3. **Enable/Disable Toggle:** Inline metadata shows/hides on cells
4. **Cell Tagging:** Tag a cell → see it in UI → verify in JSON file
5. **Cell Dependencies:** Tag two cells with dependency relationship

---

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

#### Generic Run

```bash
cd ui-tests
jlpm playwright test
```

**Expected output:** You should see 5 tests run:
1. ✓ emit an activation console message
2. ✓ show Kale panel in left sidebar
3. ✓ toggle Kale enable switch and show inline metadata
4. ✓ tag a cell and persist to notebook JSON
5. ✓ create cell dependency and persist to notebook JSON

#### Run in UI Mode (Recommended for Development)

```bash
cd ui-tests
jlpm playwright test --ui
```

This opens an interactive browser where you can:
- See tests run in real-time
- Inspect each step
- Debug failures visually
- Replay individual tests

#### Run a Single Test

```bash
cd ui-tests
jlpm playwright test -g "should tag a cell"
```

#### Run in Debug Mode

```bash
cd ui-tests
jlpm playwright test --debug
```

This pauses execution and lets you step through each test action.

---

## Troubleshooting

**"Browser not found"**
```bash
cd labextension/ui-tests
jlpm playwright install
```

**Port 8889 in use**
Kill existing JupyterLab instance:
```bash
lsof -ti:8889 | xargs kill -9
```

**Tests timeout**
Increase timeout in test file:
```typescript
test.setTimeout(60000); // 60 seconds
```

or run single test:
```bash
jlpm playwright test -g "activation" --timeout=60000
```
