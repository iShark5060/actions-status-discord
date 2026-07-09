# Testing Strategy

## Overview

The Actions Status Discord action employs a comprehensive testing strategy covering unit tests, integration tests, and end-to-end validation. This document outlines the testing approach, test structure, and how to run and extend tests.

## Test Architecture

### Test Framework

- **Test Runner**: Vitest (modern, Vite-native test runner)
- **Assertion Style**: Expect-based assertions
- **Mocking**: Vitest's built-in mocking capabilities
- **Coverage**: Integrated code coverage reporting

### Test Directory Structure

```
test/
├── format.test.ts      # Event formatting tests
├── input.test.ts       # Input parsing tests
├── main.test.ts        # Integration and end-to-end tests
├── validate.test.ts    # Validation logic tests
└── payload/           # Sample GitHub event payloads
    ├── push_branch.json
    ├── push_tag.json
    ├── pull_request.json
    └── release/
```

## Test Categories

### 1. Unit Tests

**Purpose**: Test individual functions and modules in isolation.

**Coverage**:

- `format.test.ts` → `src/format.ts`
- `input.test.ts` → `src/input.ts`
- `validate.test.ts` → `src/validate.ts`

**Example**:

```typescript
// test/format.test.ts
describe('formatEvent', () => {
  it('formats push events', () => {
    const payload = { head_commit: { id: 'abc123', url: '...', message: 'test' } };
    expect(formatEvent('push', payload)).toBe('[`abc123`](...) test');
  });
});
```

### 2. Integration Tests

**Purpose**: Test module interactions and complete workflows.

**Coverage**:

- `main.test.ts` → Complete action flow
- Cross-module interactions
- Error handling scenarios

**Example**:

```typescript
// test/main.test.ts
describe('getPayload', () => {
  it('generates payload with context', () => {
    const inputs = {/* mock inputs */};
    const payload = getPayload(inputs);
    expect(payload).toHaveProperty('embeds');
    expect(payload.embeds[0]).toHaveProperty('color');
  });
});
```

### 3. Payload-Based Tests

**Purpose**: Test with real GitHub event payloads.

**Test Data**: `test/payload/` directory contains actual GitHub event JSON:

- `push_branch.json`: Push to branch
- `push_tag.json`: Push tag creation
- `pull_request.json`: Pull request events
- `release/`: Various release scenarios

**Usage**:

```typescript
import pushPayload from './payload/push_branch.json';

describe('with real payload', () => {
  it('handles push events', () => {
    const result = formatEvent('push', pushPayload);
    expect(result).toContain('commit');
  });
});
```

## Running Tests

### Basic Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode (development)
pnpm test --watch

# Run specific test file
pnpm test test/input.test.ts

# Run tests matching pattern
pnpm test --testNamePattern="format"
```

### CI Configuration

Tests run in GitHub Actions CI with:

```yaml
- name: Run tests
  run: pnpm test
```

### Coverage Reporting

```bash
# Generate coverage report
pnpm test --coverage

# Coverage output formats
# - Text summary in terminal
# - HTML report in coverage/
# - LCOV report for CI integration
```

## Test Utilities and Mocks

### Environment Mocking

Vitest provides environment isolation and mocking:

```typescript
// Mock GitHub Actions core module
vi.mock('@actions/core', () => ({
  getInput: vi.fn(),
  setOutput: vi.fn(),
  // ... other mocked functions
}));
```

### Process Environment Mocking

```typescript
// Set environment variables for tests
beforeEach(() => {
  process.env.GITHUB_REPOSITORY = 'owner/repo';
  process.env.GITHUB_EVENT_PATH = './test/payload/push_branch.json';
});
```

### HTTP Request Mocking

```typescript
// Mock fetch for webhook tests
global.fetch = vi.fn();
fetch.mockResolvedValue({
  ok: true,
  status: 200,
  text: () => Promise.resolve('OK'),
});
```

## Test Coverage Areas

### Input Validation Tests (`input.test.ts`)

- **Input parsing**: Valid and invalid inputs
- **Default values**: Missing input handling
- **Environment fallbacks**: `DISCORD_WEBHOOK` env var
- **Status validation**: Valid status values
- **Color parsing**: Hex color validation
- **Deprecated inputs**: Warning behavior

### Event Formatting Tests (`format.test.ts`)

- **Push events**: Commit hash and message formatting
- **Pull requests**: PR number and title formatting
- **Release events**: Release name and body formatting
- **Unknown events**: Fallback message
- **Error handling**: Malformed payload resilience

### Validation Tests (`validate.test.ts`)

- **Character limits**: Discord API compliance
- **Truncation logic**: Ellipsis addition
- **Warning generation**: Truncation warnings
- **Edge cases**: Empty strings, exact limits

### Integration Tests (`main.test.ts`)

- **Payload generation**: Complete embed creation
- **Context integration**: GitHub context merging
- **Webhook delivery**: Multiple webhook handling
- **Error scenarios**: Network failures, invalid responses
- **Output setting**: Payload output generation

## Test Data Management

### Sample Payloads

The `test/payload/` directory serves multiple purposes:

1. **Realistic testing**: Actual GitHub event structures
2. **Regression prevention**: Capture specific event formats
3. **Documentation**: Examples of event data structures
4. **Edge case coverage**: Various event scenarios

### Payload Sources

- **GitHub API documentation**: Standard event formats
- **Actual workflows**: Real events from repository history
- **Edge cases**: Special scenarios (large bodies, special characters)

### Maintaining Test Data

```bash
# Update test payloads when GitHub API changes
# Capture new event types as needed
# Verify payloads remain valid JSON
```

## Testing Best Practices

### 1. Isolate Tests

```typescript
// GOOD: Each test independent
describe('getStatus', () => {
  beforeEach(() => {
    // Reset mocks and state
  });

  it('handles success', () => {
    /* ... */
  });
  it('handles failure', () => {
    /* ... */
  });
});
```

### 2. Use Descriptive Test Names

```typescript
// BAD
it('works', () => {
  /* ... */
});

// GOOD
it('parses hex color with 0x prefix', () => {
  /* ... */
});
it('falls back to success for invalid status', () => {
  /* ... */
});
```

### 3. Test Edge Cases

```typescript
// Test boundaries and error conditions
it('handles empty webhook list', () => {
  /* ... */
});
it('truncates title at 256 characters', () => {
  /* ... */
});
it('handles missing event payload file', () => {
  /* ... */
});
```

### 4. Mock External Dependencies

```typescript
// Mock network calls, file system, etc.
vi.mock('fs');
vi.mock('@actions/core');
global.fetch = vi.fn();
```

## Continuous Integration

### GitHub Actions Workflow

Tests run in CI on:

- **Push to main**: Automated regression testing
- **Pull requests**: Pre-merge validation
- **Manual triggers**: On-demand testing

### CI Configuration (`test.yml`)

```yaml
- name: Run tests
  run: pnpm test

- name: Build action
  run: pnpm run build

- name: Verify action bundle
  run: node --check lib/index.mjs
```

### Quality Gates

- **All tests must pass**: No test failures
- **Build must succeed**: Bundle creation works
- **Bundle must be valid**: JavaScript syntax check passes

## Adding New Tests

### Step-by-Step Process

1. **Identify test need**: New feature, bug fix, edge case
2. **Choose test type**: Unit, integration, or both
3. **Create/modify test file**: Existing or new `.test.ts` file
4. **Write test cases**: Descriptive names, clear assertions
5. **Run tests locally**: Verify they pass
6. **Update CI if needed**: New dependencies or setup

### Example: Testing New Input Parameter

```typescript
// 1. Add test case to input.test.ts
describe('newParameter', () => {
  it('parses newParameter correctly', () => {
    process.env.INPUT_NEWPARAMETER = 'test-value';
    const inputs = getInputs();
    expect(inputs.newParameter).toBe('test-value');
  });

  it('uses default when newParameter not provided', () => {
    delete process.env.INPUT_NEWPARAMETER;
    const inputs = getInputs();
    expect(inputs.newParameter).toBe('default-value');
  });
});

// 2. Update main.test.ts if affects payload generation
describe('payload with newParameter', () => {
  it('includes newParameter in payload', () => {
    const inputs = { newParameter: 'value' /* ... */ };
    const payload = getPayload(inputs);
    expect(payload).toHaveProperty('newParameterField', 'value');
  });
});
```

## Debugging Test Failures

### Common Issues and Solutions

#### 1. Mock Issues

```bash
# Error: Module not found or mock not working
# Solution: Check vi.mock() calls, ensure proper import paths
```

#### 2. Environment Variable Conflicts

```bash
# Error: Wrong environment state between tests
# Solution: Use beforeEach/afterEach to reset state
```

#### 3. Asynchronous Test Failures

```bash
# Error: Tests pass/fail inconsistently
# Solution: Ensure proper async/await usage, mock async functions
```

#### 4. Coverage Gaps

```bash
# Issue: New code not covered by tests
# Solution: Run coverage report, add missing test cases
```

### Debug Commands

```bash
# Run with verbose output
pnpm test --reporter=verbose

# Debug specific test file
pnpm test test/input.test.ts --debug

# Run with Node.js debugger
node --inspect-brk node_modules/.bin/vitest run
```

## Performance Considerations

### Test Execution Time

- **Unit tests**: Fast (milliseconds each)
- **Integration tests**: Moderate (network mocking)
- **End-to-end**: Slowest (actual HTTP calls if not mocked)

### Optimization Strategies

1. **Mock expensive operations**: Network, file system
2. **Parallel test execution**: Vitest runs tests in parallel
3. **Selective test runs**: Run only changed tests during development
4. **CI caching**: Cache node_modules and test artifacts

## Future Test Improvements

### Potential Enhancements

1. **Snapshot testing**: For Discord embed structures
2. **Visual regression tests**: Discord render comparisons
3. **Performance benchmarks**: Bundle size, execution time
4. **Security tests**: Input sanitization, injection prevention

### Integration Test Expansion

1. **More event types**: Additional GitHub events
2. **Error scenarios**: Network partitions, rate limiting
3. **Concurrency tests**: Multiple simultaneous webhooks
4. **Memory usage**: Long-running process stability

## Related Documentation

- [Setup and Building](setup-and-building.md): Development environment setup
- [Release Process](release-process.md): Testing in release workflow
- [Architecture](../architecture/): Understanding code structure for testing
