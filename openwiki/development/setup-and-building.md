# Setup and Building

## Development Environment Setup

This guide covers setting up a local development environment for the Actions Status Discord action, including build tools, dependencies, and workflow.

## Prerequisites

### Required Software

- **Node.js**: Version 18 or higher (24 recommended)
- **pnpm**: Version 8 or higher (11.10.0 in package.json)
- **Git**: For version control
- **Code Editor**: VS Code recommended (with TypeScript support)

### Optional Software

- **Discord**: For testing webhook deliveries
- **GitHub CLI**: For GitHub API interactions
- **jq**: For JSON processing in shell

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/iShark5060/actions-status-discord.git
cd actions-status-discord
```

### 2. Install Dependencies

```bash
pnpm install
```

**What this installs**:

- **Production dependencies**: `@actions/core`
- **Development dependencies**: TypeScript, @vercel/ncc, vitest
- **Type definitions**: `@types/node`

### 3. Verify Installation

```bash
# Check Node.js version
node --version

# Check pnpm version
pnpm --version

# Verify dependencies
pnpm list --depth=0
```

## Development Workflow

### 1. Make Code Changes

Edit TypeScript files in the `src/` directory:

- `src/index.ts`: Main action logic
- `src/input.ts`: Input parsing
- `src/context.ts`: GitHub context
- `src/format.ts`: Event formatting
- `src/validate.ts`: Validation logic
- `src/constants.ts`: Constants
- `src/utils.ts`: Utilities

### 2. Run Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test tests/input.test.ts

# Watch mode (development)
pnpm test --watch
```

### 3. Build Action

```bash
# Build the action bundle
pnpm run build
```

**Build output**: Creates `dist/index.js` bundled file

### 4. Verify Build

```bash
# Check syntax
node --check dist/index.js

# Test locally (requires GitHub context simulation)
# See "Local Testing" section below
```

## Local Testing

### Simulating GitHub Actions Environment

GitHub Actions provides specific environment variables and files. To test locally, you can simulate this environment:

#### 1. Create Test Environment Script

```bash
#!/bin/bash
# test-env.sh

# GitHub context environment variables
export GITHUB_EVENT_PATH="tests/payload/push_branch.json"
export GITHUB_REPOSITORY="owner/repo"
export GITHUB_WORKFLOW="Test Workflow"
export GITHUB_ACTOR="test-user"
export GITHUB_REF="refs/heads/main"
export GITHUB_SHA="abc123def456"
export GITHUB_RUN_ID="123456789"
export GITHUB_SERVER_URL="https://github.com"

# Action inputs as environment variables
export INPUT_WEBHOOK="https://discord.com/api/webhooks/test/test"
export INPUT_STATUS="Success"
export INPUT_TITLE="Test Notification"
export INPUT_DESCRIPTION="This is a test from local development"

# Run the action
node dist/index.js
```

#### 2. Manual Environment Setup

```bash
# Set required environment variables
export GITHUB_EVENT_PATH="tests/payload/push_branch.json"
export GITHUB_REPOSITORY="iShark5060/actions-status-discord"

# Run the action
node dist/index.js
```

#### 3. Using Test Payloads

The repository includes sample payloads in `tests/payload/`:

- `push_branch.json`: Push to branch event
- `push_tag.json`: Push tag event
- `pull_request.json`: Pull request event
- `release/`: Release event payloads

### Testing with Mock Webhooks

#### 1. Local HTTP Server

```bash
# Start a local server to capture webhook requests
npx http-server -p 8080 --cors -c-1

# Or using Python
python3 -m http.server 8080
```

#### 2. Use Request Bin Service

```bash
# Create a temporary webhook URL
# Use services like:
# - https://webhook.site
# - https://requestbin.com
# - https://pipedream.com

export INPUT_WEBHOOK="https://webhook.site/your-unique-id"
```

#### 3. Discord Test Server

Create a dedicated Discord server for testing with webhooks in a test channel.

## Building from Source

### Manual Build Steps

If you need to understand or replicate the build process:

#### 1. TypeScript Compilation

```bash
# Compile TypeScript (outputs to lib/)
npx tsc

# Check without emitting
npx tsc --noEmit
```

#### 2. ncc Bundling

```bash
# Bundle with esbuild (creates dist/index.js)
npx esbuild src/index.ts --bundle --platform=node --format=cjs --target=node24 --outfile=dist/index.js --minify
```

#### 3. Output Verification

```bash
# esbuild outputs directly to dist/index.js in CommonJS format
# No additional conversion steps needed



```

### Build Verification

```bash
# Verify the bundle is valid JavaScript
node --check dist/index.js

# Check file size
ls -lh dist/index.js

# Inspect bundle contents
head -50 dist/index.js
```

## Development Tools

### VS Code Configuration

Recommended extensions:

- **TypeScript and JavaScript Language Features**
- **ESLint** (if added later)
- **Prettier** (if added later)
- **GitLens** for version control

### Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Action",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/src/index.ts",
      "preLaunchTask": "tsc: build",
      "outFiles": ["${workspaceFolder}/lib/**/*.js"],
      "env": {
        "GITHUB_EVENT_PATH": "${workspaceFolder}/test/payload/push_branch.json",
        "GITHUB_REPOSITORY": "test/repo",
        "INPUT_WEBHOOK": "https://webhook.site/test"
      }
    }
  ]
}
```

### Package Management

#### Updating Dependencies

```bash
# Check for updates
pnpm run deps

# Update specific package
pnpm update package-name

# Update all packages (careful!)
pnpm update --latest
```

#### Dependency Analysis

```bash
# List dependencies
pnpm list

# Check for vulnerabilities
pnpm audit

# Check license compliance
pnpm licenses list
```

## Testing Strategies

### Unit Testing

- **Location**: `tests/*.test.ts` files
- **Framework**: Vitest
- **Coverage**: Each source module has corresponding tests

### Integration Testing

- **Payload testing**: Using sample GitHub event payloads
- **End-to-end**: GitHub Actions workflow tests
- **Manual verification**: Discord webhook delivery

### Test Data Management

The `tests/payload/` directory contains:

- Realistic GitHub event payloads
- Multiple event types (push, PR, release)
- Edge cases and special scenarios

## CI/CD Integration

### Local CI Simulation

```bash
# Run the same commands as CI
pnpm install --frozen-lockfile
pnpm test
pnpm run build
node --check dist/index.js
```

### Pre-commit Hooks

Consider adding Husky for pre-commit checks:

```json
// package.json
{
  "scripts": {
    "prepare": "husky install",
    "pre-commit": "pnpm test && pnpm run build"
  }
}
```

## Common Development Tasks

### Adding New Input Parameter

1. Add to `action.yml` with description and default
2. Add to `src/input.ts` interface and parsing logic
3. Add to `src/index.ts` payload generation
4. Update tests in `tests/input.test.ts` and `tests/main.test.ts`
5. Update documentation in README.md and OpenWiki

### Modifying Event Formatting

1. Edit `src/format.ts` formatter functions
2. Add test cases in `tests/format.test.ts`
3. Test with sample payloads in `tests/payload/`
4. Verify Discord rendering

### Changing Status Colors

1. Update `src/input.ts` `statusOpts` mapping
2. Consider backward compatibility
3. Update documentation if colors are documented
4. Test with different status scenarios

## Troubleshooting Development Issues

### Build Failures

```bash
# Clear build artifacts
rm -rf lib/
rm -rf node_modules/.cache

# Fresh install
pnpm install --force

# Build with verbose output
npx esbuild src/index.ts --bundle --platform=node --format=cjs --target=node24 --outfile=dist/index.js --minify --verbose
```

### Test Failures

```bash
# Run tests with more detail
pnpm test --reporter=verbose

# Debug specific test
pnpm test --testNamePattern="test name"

# Update snapshots if needed
pnpm test --update
```

### TypeScript Errors

```bash
# Check TypeScript configuration
npx tsc --showConfig

# Check for type errors
npx tsc --noEmit

# Check specific file
npx tsc --noEmit src/index.ts
```

## Next Steps

After setting up your development environment:

1. Run the existing test suite: `pnpm test`
2. Build the action: `pnpm run build`
3. Test locally with sample payloads
4. Make small changes and verify
5. Consult [Testing Strategy](testing-strategy.md) for more details
