# Advanced Configuration

## Complete Input Reference

The Actions Status Discord action offers extensive customization options. This document covers all available inputs and their advanced usage.

## Input Categories

### 1. Webhook Configuration

### 2. Message Content

### 3. Embed Customization

### 4. Behavior Control

### 5. Output Configuration

## Webhook Configuration

### `webhook`

**Type**: String  
**Required**: No (falls back to `env.DISCORD_WEBHOOK`)  
**Default**: `env.DISCORD_WEBHOOK` environment variable

```yaml
webhook: ${{ secrets.DISCORD_WEBHOOK }}
```

**Features**:

- Overrides `DISCORD_WEBHOOK` environment variable
- Supports multiple webhooks (separated by newlines)
- **Important**: Do NOT append `/github` suffix

**Multiple Webhooks Example**:

```yaml
webhook: |
  https://discord.com/api/webhooks/123/abc
  https://discord.com/api/webhooks/456/def
  https://canary.discord.com/api/webhooks/789/ghi
```

## Message Content

### `status`

**Type**: Enum (`Success`, `Failure`, `Cancelled`, `Skipped`)  
**Required**: No  
**Default**: `${{ job.status }}`

```yaml
status: ${{ job.status }}
# Or manually set:
status: Success
```

**Color Mapping**:

- `Success`: Green (0x28A745)
- `Failure`: Red (0xDC3545)
- `Cancelled`: Gray (0x6C757D)
- `Skipped`: Gray (0x6C757D)

**Advanced Usage**:

```yaml
# Custom status logic
status: ${{ github.event.pull_request.merged && 'Success' || 'Failure' }}
```

### `content`

**Type**: String  
**Required**: No  
**Default**: Empty

```yaml
content: 'Hey <@316911818725392384>'
```

**Features**:

- Shown as message outside the embed
- Supports Discord mention syntax
- Maximum 2000 characters (automatically truncated)

**Mention Examples**:

```yaml
# User mention
content: '<@123456789012345678>'

# Role mention
content: '<@&123456789012345678>'

# Channel mention
content: '<#123456789012345678>'

# Everyone/here
content: '@everyone Build failed!'

# Multiple mentions
content: |
  <@USER_ID> <@&ROLE_ID>
  Please review the failed build.
```

### `title`

**Type**: String  
**Required**: No  
**Default**: `${{ github.workflow }}`

```yaml
title: 'Production Deployment'
```

**Behavior**:

- Included in embed title
- Gets status prefix unless `noprefix: true`
- Maximum 256 characters (auto-truncated)

**Markdown Support**:

```yaml
title: 'New version of `${{ github.event.release.tag_name }}`'
```

### `description`

**Type**: String  
**Required**: No  
**Default**: Empty

```yaml
description: |
  **Build completed successfully!**

  Commit: [${{ github.sha }}](...)
  Branch: ${{ github.ref }}
  Triggered by: ${{ github.actor }}
```

**Features**:

- Included in embed description
- Supports full Discord markdown
- Maximum 4096 characters (auto-truncated)
- Multi-line strings with `|`

## Embed Customization

### `color`

**Type**: Hex string  
**Required**: No  
**Default**: Based on status

```yaml
color: 0x0000ff # Blue
color: 0xff0000 # Red
color: 0x00ff00 # Green
color: 0xffff00 # Yellow
color: 0xff00ff # Magenta
```

**Format**: `0xRRGGBB` (hexadecimal, 0x prefix required)

**Color Override Examples**:

```yaml
# Success with custom blue color
status: Success
color: 0x0000ff

# Warning state (between success and failure)
status: Success
color: 0xffff00
```

### `url`

**Type**: String  
**Required**: No  
**Default**: Empty

```yaml
url: 'https://github.com/iShark5060/actions-status-discord'
url: ${{ github.event.release.html_url }}
url: ${{ github.event.pull_request.html_url }}
```

**Behavior**:

- Makes embed title clickable
- Should be a valid URL
- No character limit (but should be reasonable)

### `image`

**Type**: String  
**Required**: No  
**Default**: Empty

```yaml
image: ${{ secrets.EMBED_IMAGE }}
image: 'https://example.com/status-success.png'
```

**Requirements**:

- Must be a valid image URL
- Discord will fetch and display the image
- Recommended: HTTPS URLs

### `username`

**Type**: String  
**Required**: No  
**Default**: Webhook's configured username

```yaml
username: 'GitHub Actions Bot'
username: '${{ github.repository }} CI'
```

**Override Behavior**:

- Temporarily overrides webhook username
- Only affects this message
- Maximum 80 characters (Discord limit)

### `avatar_url`

**Type**: String  
**Required**: No  
**Default**: Webhook's configured avatar

```yaml
avatar_url: ${{ secrets.AVATAR_URL }}
avatar_url: 'https://github.com/identicons/${{ github.actor }}.png'
```

**Requirements**:

- Must be a valid image URL
- Recommended: Square aspect ratio
- Will be displayed as 128x128 pixels

## Behavior Control

### `nofail`

**Type**: Boolean (`true`/`false`)  
**Required**: No  
**Default**: `true`

```yaml
nofail: true # Action won't fail workflow on error (default)
nofail: false # Action will fail workflow on error
```

**Use Cases**:

- `true`: Notifications are best-effort, don't break CI
- `false`: Ensure notifications are delivered, fail if not

### `nocontext`

**Type**: Boolean (`true`/`false`)  
**Required**: No  
**Default**: `false`

```yaml
nocontext: true # Hide GitHub context fields
```

**What it hides**:

- Repository field
- Ref field
- Actor field
- Event field

**Use Cases**:

- Scheduled jobs where context isn't relevant
- Custom embeds with alternative information layout

### `noprefix`

**Type**: Boolean (`true`/`false`)  
**Required**: No  
**Default**: `false`

```yaml
noprefix: true # Don't add "Success: " prefix to title
```

**Example**:

```yaml
# With noprefix: false (default)
title: 'Deploy'
# Result: "Success: Deploy"

# With noprefix: true
title: 'Deploy'
# Result: "Deploy"
```

### `nodetail`

**Type**: Boolean (`true`/`false`)  
**Required**: No  
**Default**: `false`

```yaml
nodetail: true # Equivalent to nocontext: true AND noprefix: true
```

**Convenience Option**:

- Sets both `nocontext: true` and `noprefix: true`
- Useful for clean, simple notifications

### `notimestamp`

**Type**: Boolean (`true`/`false`)  
**Required**: No  
**Default**: `false`

```yaml
notimestamp: true # Don't add timestamp to embed
```

**Timestamp Behavior**:

- Default: Adds current ISO timestamp
- With `notimestamp: true`: No timestamp field

### `ack_no_webhook`

**Type**: Boolean (`true`/`false`)  
**Required**: No  
**Default**: `false`

```yaml
ack_no_webhook: true # Don't error when no webhook is provided
```

**Use with `nofail: false`**:

```yaml
nofail: false
ack_no_webhook: true
# Will succeed even if no webhook is set
```

## Deprecated Inputs

### `job` (Deprecated)

**Type**: String  
**Status**: Will be removed in v2  
**Alternative**: Use `title` instead

```yaml
# Deprecated
job: 'Build'

# Use instead
title: 'Build'
```

## Output Configuration

### `payload` Output

The action provides a `payload` output containing the generated Discord webhook payload.

**Accessing the output**:

```yaml
- uses: iShark5060/actions-status-discord@v1
  id: discord
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}

- name: Use payload
  run: |
    echo "${{ steps.discord.outputs.payload }}" | jq .
```

**Payload modification example**:

```yaml
- uses: iShark5060/actions-status-discord@v1
  id: discord
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}

- uses: actions/github-script@v7
  env:
    PAYLOAD: ${{ steps.discord.outputs.payload }}
  with:
    script: |
      const payload = JSON.parse(process.env.PAYLOAD);
      // Modify payload
      payload.embeds[0].footer = { text: 'Custom footer' };
      // Send to another service
      await fetch('https://api.example.com/webhook', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
```

## Input Validation Rules

### Webhook Validation

- Must be valid URL
- Must start with `http://` or `https://`
- Multiple webhooks separated by newlines

### Color Validation

- Must match `0x[0-9A-Fa-f]{6}` pattern
- Case-insensitive hex digits
- No shorthand colors (must be 6 digits)

### Status Validation

- Must be one of: `Success`, `Failure`, `Cancelled`, `Skipped`
- Case-sensitive
- Falls back to `Success` if invalid

## Best Practices

### 1. Use Secrets for Sensitive Data

```yaml
webhook: ${{ secrets.DISCORD_WEBHOOK }}
image: ${{ secrets.EMBED_IMAGE }}
avatar_url: ${{ secrets.AVATAR_URL }}
```

### 2. Set Reasonable Defaults

```yaml
if: always() # Always notify
nofail: true # Don't break CI on notification failure
```

### 3. Use Markdown for Readability

```yaml
description: |
  **Build Summary**

  - ✅ Tests passed: 42
  - 📦 Artifacts: 3 created
  - 🚀 Deployment: Ready
```

### 4. Test Configurations

- Use workflow_dispatch to test
- Start with minimal config, then add options
- Check Discord channel for results

## Edge Cases and Limitations

### Character Limits

- Discord imposes strict character limits
- Action automatically truncates with warnings
- Check logs for truncation warnings

### Rate Limiting

- Discord has rate limits on webhooks
- Multiple rapid notifications may be throttled
- Consider batching or delaying notifications

### URL Validation

- Discord validates image/avatar URLs
- Invalid URLs may cause embeds to fail
- Test image URLs before deploying
