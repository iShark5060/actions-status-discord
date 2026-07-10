# GitHub Context

## Overview

The Actions Status Discord action leverages GitHub Actions' context system to gather information about workflows, repositories, events, and executions. This document explains how GitHub context is accessed, processed, and integrated into Discord notifications.

## GitHub Context Sources

### Environment Variables

GitHub Actions provides context through environment variables:

| Variable            | Description                          | Example                                               |
| ------------------- | ------------------------------------ | ----------------------------------------------------- |
| `GITHUB_EVENT_PATH` | Path to JSON file with event payload | `/home/runner/work/_temp/_github_workflow/event.json` |
| `GITHUB_REPOSITORY` | Repository owner and name            | `iShark5060/actions-status-discord`                   |
| `GITHUB_WORKFLOW`   | Workflow name                        | `CI`                                                  |
| `GITHUB_ACTOR`      | User who triggered the workflow      | `github-actor`                                        |
| `GITHUB_REF`        | Branch or tag ref                    | `refs/heads/main`                                     |
| `GITHUB_SHA`        | Commit SHA                           | `abc123def456`                                        |
| `GITHUB_RUN_ID`     | Unique run identifier                | `123456789`                                           |
| `GITHUB_SERVER_URL` | GitHub server URL                    | `https://github.com`                                  |

### Event Payload File

The `GITHUB_EVENT_PATH` points to a JSON file containing detailed event-specific data:

```json
// Example push event payload
{
  "ref": "refs/heads/main",
  "repository": {
    "full_name": "owner/repo",
    "html_url": "https://github.com/owner/repo"
  },
  "head_commit": {
    "id": "abc123",
    "message": "Commit message",
    "url": "https://github.com/owner/repo/commit/abc123"
  }
}
```

## Context Processing

### Context Interface (`src/context.ts`)

The action defines a structured interface for GitHub context:

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

### Context Extraction Functions

#### 1. Reading Event Payload

```typescript
function readPayload(): { [key: string]: any } {
  const path = process.env.GITHUB_EVENT_PATH;
  if (path && existsSync(path)) {
    return JSON.parse(readFileSync(path, { encoding: 'utf8' }));
  }
  return {};
}
```

#### 2. Extracting Repository Info

```typescript
function readRepo(payload: { [key: string]: any }): { owner: string; repo: string } {
  if (process.env.GITHUB_REPOSITORY) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
    return { owner, repo };
  }
  if (payload.repository) {
    const [owner, repo] = payload.repository.full_name.split('/');
    return { owner, repo };
  }
  return { owner: '??', repo: '??' };
}
```

#### 3. Main Context Getter

```typescript
export function getContext(): Context {
  const payload = readPayload();
  return {
    payload,
    eventName: process.env.GITHUB_EVENT_NAME || 'unknown',
    ref: process.env.GITHUB_REF || '??',
    workflow: process.env.GITHUB_WORKFLOW || '??',
    actor: process.env.GITHUB_ACTOR || '??',
    serverUrl: process.env.GITHUB_SERVER_URL || 'https://github.com',
    runId: parseInt(process.env.GITHUB_RUN_ID || '0', 10),
    repo: readRepo(payload),
  };
}
```

## Context Integration

### Embed Field Generation

GitHub context is transformed into Discord embed fields:

```typescript
// Generated fields in embed
embed.fields = [
  {
    name: 'Repository',
    value: `[${owner}/${repo}](${repoURL})`,
  },
  {
    name: 'Ref',
    value: ref,
  },
  {
    name: 'Actor',
    value: actor,
  },
  {
    name: `Event - ${eventName}`,
    value: eventDetail, // Formatted by format.ts
  },
];
```

### URL Construction

```typescript
const repoURL = `${serverUrl}/${owner}/${repo}`;
const workflowURL = `${repoURL}/actions/runs/${runId}`;
```

### Event-Specific Formatting

Different GitHub events receive specialized formatting:

```typescript
// src/format.ts
const formatters: Record<string, Formatter> = {
  push: pushFormatter,
  pull_request: pullRequestFormatter,
  release: releaseFormatter,
};

function pushFormatter(payload: any): string {
  return `[\`${payload.head_commit.id.substring(0, 7)}\`](${payload.head_commit.url}) ${payload.head_commit.message}`;
}
```

## Context Suppression Options

### `nocontext: true`

When `nocontext` is enabled, all GitHub context fields are omitted from the embed:

```yaml
with:
  nocontext: true
```

**Result**: No Repository, Ref, Actor, or Event fields in the embed.

### `nodetail: true`

Convenience option that sets both `nocontext: true` and `noprefix: true`:

```yaml
with:
  nodetail: true
```

**Use cases**:

- Simple notifications without GitHub metadata
- Custom embeds with alternative information
- Scheduled jobs where context is less relevant

## Event Types and Context

### Supported GitHub Events

The action handles various GitHub event types with specialized formatting:

#### 1. Push Events

```typescript
// Context extraction
const commitHash = payload.head_commit.id;
const commitMessage = payload.head_commit.message;
const commitUrl = payload.head_commit.url
// Formatting
`[\`${commitHash.substring(0, 7)}\`](${commitUrl}) ${commitMessage}`;
```

#### 2. Pull Request Events

```typescript
// Context extraction
const prNumber = payload.pull_request.number;
const prTitle = payload.pull_request.title;
const prUrl = payload.pull_request.html_url
// Formatting
`[\`#${prNumber}\`](${prUrl}) ${prTitle}`;
```

#### 3. Release Events

```typescript
// Context extraction
const releaseName = payload.release.name;
const releaseBody = payload.release.body;

// Formatting
const nameText = name ? `**${name}**` : ''`${nameText}${nameText && body ? '\n' : ''}${body || ''}`;
```

#### 4. Other Events

For unsupported event types, the action shows:

```
Event - {eventName}
No further information
```

## Context Validation and Fallbacks

### Missing Context Handling

The action includes fallback values for missing context:

```typescript
// Default values in context extraction
ref: process.env.GITHUB_REF || '??',
workflow: process.env.GITHUB_WORKFLOW || '??',
actor: process.env.GITHUB_ACTOR || '??',
eventName: process.env.GITHUB_EVENT_NAME || 'unknown',
```

### Error Resilience

- Missing event payload file: Empty object used
- Malformed JSON: Error caught, empty object used
- Missing environment variables: Default values used
- Repository parsing errors: Fallback to '??/??'

## Context Usage Examples

### Workflow URL Construction

```typescript
// Build workflow run URL
const workflowURL = `${serverUrl}/${owner}/${repo}/actions/runs/${runId}`;

// Used in debugging or custom implementations
```

### Commit References

```typescript
// Short commit hash (first 7 characters)
const shortSha = sha.substring(0, 7);

// Commit URL
const commitURL = `${serverUrl}/${owner}/${repo}/commit/${sha}`;
```

### Branch/Tag Detection

```typescript
// Check if ref is a tag
const isTag = ref.startsWith('refs/tags/');

// Extract branch name
const branchName = ref.replace('refs/heads/', '');
```

## Testing Context Handling

### Test Payloads

The `tests/payload/` directory contains sample GitHub event payloads for testing:

1. **push_branch.json**: Push to branch event
2. **push_tag.json**: Push tag creation event
3. **pull_request.json**: Pull request event
4. **release/**: Various release event payloads

### Unit Tests

```typescript
// tests/context.test.ts (example structure)
describe('getContext', () => {
  beforeEach(() => {
    process.env.GITHUB_REPOSITORY = 'owner/repo';
    process.env.GITHUB_EVENT_PATH = './tests/payload/push_branch.json';
  });

  it('extracts repository info', () => {
    const ctx = getContext();
    expect(ctx.repo.owner).toBe('owner');
    expect(ctx.repo.repo).toBe('repo');
  });
});
```

## Performance Considerations

### Context Loading

- **Event payload**: Read once and cached
- **Environment variables**: Accessed directly
- **Parsing overhead**: Minimal JSON parsing
- **Memory usage**: Payload kept in memory during execution

### Optimization

- **Lazy loading**: Context loaded when needed
- **Selective parsing**: Only needed fields extracted
- **Caching**: Context object reused
- **Stream processing**: Not needed for small payloads

## Security Implications

### Context Exposure

GitHub context may contain:

- Repository names and URLs (public)
- User names (public)
- Branch/tag names (public)
- Commit messages (may contain sensitive info)

### Safety Measures

1. **No secret exposure**: Action doesn't include secrets in context
2. **User-controlled content**: Commit messages, PR titles from users
3. **URLs only**: No direct access to repository contents
4. **Public information**: Most context is already public on GitHub

### User Content Considerations

- Commit messages may contain sensitive data
- PR titles and descriptions user-provided
- Release notes may include confidential information
- Action passes through user content unchanged

## Custom Context Extensions

### Extending Context

Developers can extend context handling by:

1. **Adding new fields**: Modify `Context` interface
2. **New event types**: Add formatters to `format.ts`
3. **Custom parsing**: Extract additional data from payload
4. **External integrations**: Combine with other APIs

### Example: Adding Deployment Context

```typescript
// Extended context
interface ExtendedContext extends Context {
  deployment?: {
    environment: string;
    task: string;
  };
}

// Extract from payload
if (payload.deployment) {
  context.deployment = {
    environment: payload.deployment.environment,
    task: payload.deployment.task,
  };
}
```

## Common Issues and Solutions

### 1. Missing Context Fields

- **Symptom**: Fields show as '??' in Discord
- **Cause**: Environment variables not set
- **Solution**: Check GitHub Actions version, event type

### 2. Event Payload Too Large

- **Symptom**: Memory issues, slow processing
- **Cause**: Large payloads (e.g., many commits in push)
- **Solution**: Action only extracts needed fields

### 3. Special Character Issues

- **Symptom**: Broken formatting in Discord
- **Cause**: Markdown conflicts in user content
- **Solution**: Basic sanitization, Discord handles escaping

### 4. Local Testing Difficulties

- **Symptom**: Context missing in local tests
- **Cause**: No GitHub Actions environment
- **Solution**: Mock environment variables, use test payloads

## Related Documentation

- [Discord Webhook Format](discord-webhook-format.md): How context becomes Discord embeds
- [Event Formatting](../architecture/source-code-organization.md#formatts---event-formatting): Context to human-readable text
- [Testing Strategy](../development/testing-strategy.md): Testing context handling
