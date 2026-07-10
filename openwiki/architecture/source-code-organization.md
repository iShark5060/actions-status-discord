# Source Code Organization

## Directory Structure

```
src/
├── index.ts          # Primary action logic and orchestration
├── input.ts         # Input parsing and validation
├── context.ts       # GitHub context handling
├── format.ts        # GitHub event formatting
├── validate.ts      # Discord payload validation
├── constants.ts     # API limits and status mappings
└── utils.ts         # Logging and utility functions
```

## File Details

### `index.ts` - Primary Action Logic

**Purpose**: Orchestrates the entire action execution flow.

**Key Functions**:

- `run()`: Main async entry point called by GitHub Actions
- `getPayload(inputs)`: Generates Discord webhook payload
- `wrapWebhook(webhook, payload)`: Sends HTTP request to Discord

**Responsibilities**:

- Error catching and logging
- Webhook delivery management
- Output setting
- Payload generation coordination

### `input.ts` - Input Processing

**Purpose**: Parses and validates action inputs.

**Key Interfaces**:

```typescript
interface Inputs {
  webhooks: string[];
  status: 'Success' | 'Failure' | 'Cancelled' | 'Skipped';
  title?: string;
  description?: string;
  color?: string;
  // ... other fields
}

const statusOpts: Record<Inputs['status'], { color: number }> = {
  Success: { color: 0x28a745 },
  Failure: { color: 0xdc3545 },
  Cancelled: { color: 0x6c757d },
  Skipped: { color: 0x6c757d },
};
```

**Key Functions**:

- `getInputs()`: Main input parser
- `getStatus(input)`: Validates and normalizes status
- `getColor(input)`: Parses hex color strings

**Features**:

- Environment variable fallback for webhook
- Deprecated parameter handling with warnings
- Type-safe parsing with defaults

### `context.ts` - GitHub Context Handling

**Purpose**: Abstracts GitHub Actions context and event data.

**Key Interface**:

```typescript
interface Context {
  payload: { [key: string]: any };
  eventName: string;
  ref: string;
  workflow: string;
  actor: string;
  serverUrl: string;
  runId: number;
  repo: {
    owner: string;
    repo: string;
  };
}
```

**Key Functions**:

- `getContext()`: Reads GitHub context from environment
- `readPayload()`: Loads event payload from file
- `readRepo(payload)`: Extracts repository information

**Data Sources**:

- `GITHUB_EVENT_PATH`: Event payload JSON file
- `GITHUB_REPOSITORY`: `owner/repo` string
- `GITHUB_*` environment variables

### `format.ts` - Event Formatting

**Purpose**: Creates human-readable descriptions for GitHub events.

**Formatter Registry**:

```typescript
const formatters: Record<string, Formatter> = {
  push: pushFormatter,
  pull_request: pullRequestFormatter,
  release: releaseFormatter,
};
```

**Event-Specific Formatters**:

- **Push events**: `[commit-hash](url) commit-message`
- **Pull requests**: `[#PR-number](url) PR-title`
- **Releases**: `**release-name**\nrelease-body`

**Fallback**: "No further information" for unhandled events

### `validate.ts` - Payload Validation

**Purpose**: Ensures Discord API compliance.

**Key Functions**:

- `fitEmbed(embed)`: Validates and truncates embed fields
- `fitContent(content)`: Validates and truncates message content
- `truncStr(msg, length)`: Truncates strings with ellipsis

**Discord Limits Enforced**:

- Embed title: 256 characters
- Embed description: 4096 characters
- Field name: 256 characters
- Field value: 1024 characters
- Webhook content: 2000 characters

### `constants.ts` - API Constants

**Purpose**: Centralizes Discord API limits and status mappings.

**Key Constants**:

```typescript
// Discord Embed limits
export const MAX_EMBED_TITLE_LENGTH = 256;
export const MAX_EMBED_DESCRIPTION_LENGTH = 4096;
export const MAX_EMBED_FIELD_NAME_LENGTH = 256;
export const MAX_EMBED_FIELD_VALUE_LENGTH = 1024;

// Discord Webhook limits
export const MAX_WEBHOOK_CONTENT_LENGTH = 2000;
```

### `utils.ts` - Utility Functions

**Purpose**: Provides logging and helper utilities.

**Key Functions**:

- `logDebug(message)`: Debug-level logging
- `logInfo(message)`: Info-level logging
- `logWarning(message)`: Warning-level logging
- `logError(message)`: Error-level logging

**Logging Characteristics**:

- Uses `@actions/core` logging functions
- Properly handles grouped output
- Consistent formatting across all modules

## Module Dependencies

```
main.ts
├── input.ts
├── context.ts
├── format.ts
├── validate.ts
├── constants.ts
└── utils.ts
```

## TypeScript Configuration

### `tsconfig.json` Highlights

- **Target**: `ES2022` for modern JavaScript features
- **Module**: `ESNext` for ES module output
- **Module Resolution**: `Node` for Node.js compatibility
- **Strict**: Enabled for type safety
- **Out Dir**: `lib` for compiled output

### Build Process

1. TypeScript compilation to JavaScript
2. ncc bundling into single file
3. Rename to `.mjs` for ES module compatibility
4. Verification with `node --check`

## Testing Support

### Test Files Location

- `/tests/*.test.ts`: Test suites for each module
- `/tests/payload/`: Sample GitHub event payloads
- `vitest.config.ts`: Test runner configuration

### Test Coverage

Each source file has a corresponding test file:

- `input.test.ts` → `input.ts`
- `format.test.ts` → `format.ts`
- `validate.test.ts` → `validate.ts`
- `main.test.ts` → Integration tests
