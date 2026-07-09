# Discord Webhook Format

## Overview

This document details how the Actions Status Discord action integrates with Discord's webhook API, including payload structure, formatting rules, and API limitations.

## Discord Webhook API

### Basic Webhook Structure

```
https://discord.com/api/webhooks/{webhook.id}/{webhook.token}
```

**Important**: Do NOT append `/github` suffix. The action uses the standard Discord webhook endpoint, not the GitHub-compatible one.

### HTTP Request Format

```typescript
const res = await fetch(webhook, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

### Response Handling

- **Success**: HTTP 200-299 status codes
- **Failure**: HTTP 400+ status codes or network errors
- **Rate limiting**: HTTP 429 with Retry-After header

## Payload Structure

### Basic Payload Template

```json
{
  "content": "Optional message content",
  "username": "Optional webhook username override",
  "avatar_url": "Optional avatar URL override",
  "embeds": [
    {
      "title": "Embed title",
      "description": "Embed description",
      "url": "URL for title click",
      "color": 4289797,
      "timestamp": "2023-01-01T00:00:00.000Z",
      "image": {
        "url": "https://example.com/image.png"
      },
      "fields": [
        {
          "name": "Field name",
          "value": "Field value",
          "inline": false
        }
      ]
    }
  ]
}
```

### Generated Payload Example

```json
{
  "embeds": [
    {
      "title": "Success: Test Workflow",
      "color": 4289797,
      "timestamp": "2023-12-01T12:00:00.000Z",
      "fields": [
        {
          "name": "Repository",
          "value": "[owner/repo](https://github.com/owner/repo)"
        },
        {
          "name": "Ref",
          "value": "refs/heads/main"
        },
        {
          "name": "Actor",
          "value": "github-actor"
        },
        {
          "name": "Event - push",
          "value": "[`abc123`](https://github.com/owner/repo/commit/abc123) Commit message"
        }
      ]
    }
  ]
}
```

## Embed Configuration

### Color System

The action maps GitHub statuses to Discord embed colors:

| Status    | Color (Decimal) | Color (Hex) | Description          |
| --------- | --------------- | ----------- | -------------------- |
| Success   | 4289797         | 0x28A745    | GitHub success green |
| Failure   | 14431557        | 0xDC3545    | GitHub failure red   |
| Cancelled | 7107965         | 0x6C757D    | GitHub neutral gray  |
| Skipped   | 7107965         | 0x6C757D    | GitHub neutral gray  |

**Custom colors**: Users can override with `color: 0xRRGGBB` input.

### Field Structure

The action generates contextual fields based on GitHub event data:

```typescript
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
    value: eventDetail,
  },
];
```

### Timestamp Handling

```typescript
if (!inputs.notimestamp) {
  embed.timestamp = new Date().toISOString();
}
```

- **Format**: ISO 8601 (e.g., "2023-12-01T12:00:00.000Z")
- **Time zone**: UTC
- **Optional**: Can be disabled with `notimestamp: true`

## Discord API Limits

### Character Limits

The action enforces Discord's API limits:

| Field                  | Maximum Length  | Action Behavior      |
| ---------------------- | --------------- | -------------------- |
| Webhook content        | 2000 characters | Truncates with `...` |
| Embed title            | 256 characters  | Truncates with `...` |
| Embed description      | 4096 characters | Truncates with `...` |
| Field name             | 256 characters  | Truncates with `...` |
| Field value            | 1024 characters | Truncates with `...` |
| Webhook username       | 80 characters   | Passed to Discord    |
| Total embed characters | 6000 characters | Discord enforces     |

### Validation Implementation

```typescript
// src/validate.ts
export function truncStr(msg: string, length: number) {
  return msg.slice(0, length - 3) + '...';
}

export function fitEmbed(embed: any): any {
  if (embed.title && embed.title.length > MAX_EMBED_TITLE_LENGTH) {
    logWarning(`embed title must be shorter than ${MAX_EMBED_TITLE_LENGTH}`);
    embed.title = truncStr(embed.title, MAX_EMBED_TITLE_LENGTH);
  }
  // ... other field validations
}
```

## Markdown Support

### Supported Discord Markdown

Discord supports a subset of Markdown in embeds:

| Format        | Syntax                     | Example                        |
| ------------- | -------------------------- | ------------------------------ |
| Bold          | `**text**`                 | `**Important**`                |
| Italic        | `*text*` or `_text_`       | `*emphasis*`                   |
| Underline     | `__text__`                 | `__underlined__`               |
| Strikethrough | `~~text~~`                 | `~~old~~`                      |
| Inline code   | `` `code` ``               | `` `const x = 1` ``            |
| Code block    | ` ```language\ncode\n``` ` | Multiline code                 |
| Link          | `[text](url)`              | `[GitHub](https://github.com)` |
| Spoiler       | `                          |                                | text |     | `   | `   |     | spoiler |     | `   |

### GitHub-Specific Formatting

The action applies special formatting for GitHub elements:

```typescript
// Commit references
`[\`${commitHash.substring(0, 7)}\`](${commitUrl}) ${commitMessage}`
// Pull request references
`[\`#${prNumber}\`](${prUrl}) ${prTitle}`
// Repository links
`[${owner}/${repo}](${repoUrl})`;
```

## Rate Limiting and Performance

### Discord Rate Limits

- **Default**: ~30 requests per minute per webhook
- **Burst**: Some allowance for short bursts
- **Response**: HTTP 429 with Retry-After header

### Action Handling

The action doesn't implement retry logic but:

1. Uses `Promise.allSettled()` for multiple webhooks
2. Continues other webhooks if one is rate limited
3. Logs rate limit errors clearly

### Performance Considerations

- **Concurrent delivery**: Multiple webhooks sent in parallel
- **Minimal payload**: Only necessary fields included
- **Efficient parsing**: Streamlined JSON generation

## Webhook Management

### Multiple Webhook Support

The action supports multiple webhooks separated by newlines:

```typescript
// Input parsing
const webhooks = input.webhook
  .split('\n')
  .map((w) => w.trim())
  .filter((w) => w.length > 0);

// Concurrent delivery
const results = await Promise.allSettled(webhooks.map((w) => wrapWebhook(w, payload)));
```

### Error Handling per Webhook

```typescript
const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');

if (failures.length > 0) {
  for (const failure of failures) {
    logError(failure.reason.message);
  }
  if (!inputs.nofail) {
    // Fail the action if configured
  }
}
```

## Custom Webhook Endpoints

### Supported Services

While designed for Discord, the action works with any webhook-compatible service:

1. **Discord**: `https://discord.com/api/webhooks/...`
2. **Discord Canary**: `https://canary.discord.com/api/webhooks/...`
3. **Discord PTB**: `https://ptb.discord.com/api/webhooks/...`
4. **Guilded**: `https://media.guilded.gg/webhooks/...`
5. **Custom endpoints**: Any service accepting Discord-style webhooks

### Compatibility Notes

- **Payload format**: Discord-specific embed structure
- **Response codes**: Expects 2xx for success
- **Authentication**: Webhook token in URL
- **Content-Type**: Must accept `application/json`

## Testing Webhook Integration

### Local Testing Methods

1. **Request bin services**: Capture and inspect payloads
2. **Local HTTP server**: Development testing
3. **Discord test server**: Real integration testing
4. **Mock endpoints**: Unit testing

### Example Test Server

```bash
# Simple Node.js test server
node -e "
const http = require('http');
const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        console.log('Received:', body);
        res.writeHead(200);
        res.end('OK');
    });
});
server.listen(8080);
"
```

## Security Considerations

### Webhook URL Security

- **Tokens in URLs**: Webhook tokens are secret
- **GitHub Secrets**: Always store webhooks in secrets
- **URL validation**: Basic validation before sending
- **Error messages**: Don't expose full URLs in logs

### Payload Security

- **No sensitive data**: GitHub tokens, secrets not included
- **User input sanitization**: Basic validation of user content
- **Size limits**: Prevent excessively large payloads
- **Content filtering**: Basic safety checks

## Troubleshooting

### Common Discord API Issues

#### 1. "Invalid Webhook" Error

- **Cause**: Webhook deleted or URL incorrect
- **Solution**: Regenerate webhook in Discord, update secret

#### 2. "Missing Permissions" Error

- **Cause**: Bot lacks send permissions in channel
- **Solution**: Check Discord channel permissions

#### 3. "Embed Disabled" Error

- **Cause**: Embeds disabled in server settings
- **Solution**: Enable embeds in Discord server settings

#### 4. Rate Limit Errors

- **Cause**: Too many rapid requests
- **Solution**: Reduce notification frequency, implement delays

### Debugging Steps

1. **Test webhook manually**:
   ```bash
   curl -X POST https://discord.com/api/webhooks/... \
     -H "Content-Type: application/json" \
     -d '{"content": "test"}'
   ```
2. **Check Discord audit log**: Webhook usage history
3. **Enable debug logging**: `ACTIONS_STEP_DEBUG: true`
4. **Inspect generated payload**: Action outputs payload for inspection

## Related Documentation

- [GitHub Context](github-context.md): Source data for webhook payloads
- [Webhook Management](../workflows/webhook-management.md): Managing multiple webhooks
- [Advanced Configuration](../workflows/advanced-configuration.md): Customizing webhook behavior
