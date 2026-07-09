# Action Structure

## How the GitHub Action Works

The Actions Status Discord action is a **JavaScript GitHub Action** that runs on Node.js, packaged as a single ES module file. Unlike Docker container actions, JavaScript actions are faster to start and have access to the runner environment.

## Execution Flow

### 1. Input Processing

```typescript
// src/input.ts
const inputs = getInputs();
```

- Reads action inputs from `with:` parameters
- Validates required fields and webhook URLs
- Parses environment variables (especially `DISCORD_WEBHOOK`)
- Handles deprecated inputs with warnings

### 2. Context Gathering

```typescript
// src/context.ts
const ctx = getContext();
```

- Reads GitHub context from `GITHUB_EVENT_PATH` environment variable
- Extracts repository information (`owner/repo`)
- Captures workflow metadata (run ID, actor, workflow name)
- Loads event-specific payload data

### 3. Payload Generation

```typescript
// src/main.ts
const payload = getPayload(inputs);
```

- Maps GitHub job status to Discord embed colors
- Applies user customizations (title, description, color, etc.)
- Formats GitHub event details based on event type
- Adds contextual fields (Repository, Ref, Actor, Event)
- Applies timestamp if not disabled

### 4. Validation and Truncation

```typescript
// src/validate.ts
fitContent(content);
fitEmbed(embed);
```

- Ensures content respects Discord API limits
- Automatically truncates fields that exceed limits
- Logs warnings for truncated content

### 5. Webhook Delivery

```typescript
// src/main.ts
const results = await Promise.allSettled(
  inputs.webhooks.map((w) => wrapWebhook(w.trim(), payload)),
);
```

- Sends HTTP POST requests to Discord webhook endpoints
- Supports multiple webhooks (separated by newlines)
- Uses `Promise.allSettled()` for independent delivery
- Handles failures gracefully based on `nofail` setting

### 6. Output Setting

```typescript
// src/main.ts
setOutput('payload', payloadStr);
```

- Exports the generated payload as action output
- Allows other steps to modify or reuse the payload

## Key Components

### Main Entry Point (`src/main.ts`)

The central orchestrator that:

1. Coordinates the execution flow
2. Handles error catching and logging
3. Manages webhook delivery
4. Sets action outputs

### Input System (`src/input.ts`)

```typescript
interface Inputs {
  webhooks: string[];
  status: 'Success' | 'Failure' | 'Cancelled' | 'Skipped';
  // ... other inputs
}
```

- Type-safe input parsing
- Default value application
- Environment variable fallbacks
- Deprecated parameter handling

### Context Handler (`src/context.ts`)

```typescript
interface Context {
  payload: { [key: string]: any };
  eventName: string;
  ref: string;
  workflow: string;
  actor: string;
  // ... other fields
}
```

- Abstracts GitHub Actions context
- Handles missing or malformed context gracefully
- Provides consistent interface for event data

### Event Formatter (`src/format.ts`)

```typescript
const formatters: Record<string, Formatter> = {
  push: pushFormatter,
  pull_request: pullRequestFormatter,
  release: releaseFormatter,
};
```

- Specialized formatting for different GitHub events
- Extracts relevant information from event payloads
- Creates human-readable descriptions

## Error Handling Strategy

### Graceful Degradation

- Missing webhooks: Warning or error based on `ack_no_webhook`
- Invalid inputs: Default to safe values
- Network failures: Continue with other webhooks if `nofail=true`

### Logging Levels

- **Info**: Normal operation messages
- **Warning**: Non-critical issues (truncated content, deprecated inputs)
- **Error**: Critical failures (network errors, invalid configuration)
- **Debug**: Detailed payload dumps (grouped for readability)

## Performance Characteristics

### Fast Startup

- JavaScript action (no Docker pull)
- Small bundle size (~single file)
- Minimal dependencies

### Parallel Delivery

- Multiple webhooks delivered concurrently
- Independent error handling per webhook
- No blocking between webhooks

### Memory Efficient

- Streamlined processing pipeline
- No large external dependencies
- Efficient string handling
