# Webhook Management

## Overview

The Actions Status Discord action supports advanced webhook management features including multiple webhooks, error handling strategies, and payload customization. This document covers how to effectively manage Discord webhooks in your workflows.

## Multiple Webhooks

### Basic Multiple Webhook Setup

You can send notifications to multiple Discord channels or servers by providing multiple webhook URLs separated by newlines:

```yaml
- uses: iShark5060/actions-status-discord@v1
  with:
    webhook: |
      https://discord.com/api/webhooks/123/abc
      https://discord.com/api/webhooks/456/def
      https://canary.discord.com/api/webhooks/789/ghi
```

### Configuration Methods

#### 1. Direct Input (Simple)

```yaml
webhook: |
  https://discord.com/api/webhooks/123/abc
  https://discord.com/api/webhooks/456/def
```

#### 2. GitHub Secret (Secure)

```yaml
# In GitHub Secrets: DISCORD_WEBHOOKS
# Value:
# https://discord.com/api/webhooks/123/abc
# https://discord.com/api/webhooks/456/def

webhook: ${{ secrets.DISCORD_WEBHOOKS }}
```

#### 3. Environment Variable

```yaml
# In workflow environment
env:
  DISCORD_WEBHOOK: |
    https://discord.com/api/webhooks/123/abc
    https://discord.com/api/webhooks/456/def
```

### Webhook Processing

**How multiple webhooks work**:

1. Webhooks are split by newline (`\n`)
2. Each webhook is trimmed of whitespace
3. Empty lines are filtered out
4. All valid webhooks are sent to concurrently
5. Results are collected independently

**Concurrency Model**:

```typescript
// Simplified implementation
const results = await Promise.allSettled(
  inputs.webhooks.map((w) => wrapWebhook(w.trim(), payload)),
);
```

## Error Handling Strategies

### `nofail` Configuration

#### `nofail: true` (Default)

```yaml
nofail: true
```

- Action never fails the workflow
- Failed webhooks are logged as errors
- Other webhooks continue processing
- Useful for non-critical notifications

#### `nofail: false`

```yaml
nofail: false
```

- Action fails workflow if ANY webhook fails
- All webhooks attempt delivery first
- If any fail, workflow marked as failed
- Useful for critical notifications

### Error Scenarios

#### 1. Invalid Webhook URL

```
Error: Webhook response: 404: Not Found
```

**Cause**: Webhook URL is invalid or deleted  
**Action**: Check URL, regenerate webhook in Discord

#### 2. Rate Limited

```
Error: Webhook response: 429: Too Many Requests
```

**Cause**: Discord rate limiting  
**Action**: Reduce notification frequency, implement delays

#### 3. Network Failure

```
Error: Webhook response: fetch failed
```

**Cause**: Network issues, DNS problems  
**Action**: Retry logic in workflow, check network connectivity

### `ack_no_webhook` Parameter

Use with `nofail: false` when webhook might be optional:

```yaml
nofail: false
ack_no_webhook: true
# No webhook provided - action succeeds
# Webhook fails - action fails
```

## Webhook Types and Endpoints

### Standard Discord Webhooks

```
https://discord.com/api/webhooks/{webhook.id}/{webhook.token}
```

### Discord Canary (Testing)

```
https://canary.discord.com/api/webhooks/{webhook.id}/{webhook.token}
```

### Discord PTB (Public Test Build)

```
https://ptb.discord.com/api/webhooks/{webhook.id}/{webhook.token}
```

### Guilded (Alternative Service)

```
https://media.guilded.gg/webhooks/{webhook.id}/{webhook.token}
```

**Note**: The action supports any webhook-compatible endpoint, not just Discord.

## Webhook Management Patterns

### 1. Development/Production Separation

```yaml
# Different webhooks for different environments
webhook: |
  # Development channel
  ${{ secrets.DISCORD_WEBHOOK_DEV }}

  # Production alerts channel
  ${{ github.ref == 'refs/heads/main' && secrets.DISCORD_WEBHOOK_PROD || '' }}
```

### 2. Team-Based Notifications

```yaml
# Send to different team channels
webhook: |
  # Frontend team
  ${{ contains(github.event.pull_request.labels.*.name, 'frontend') && secrets.DISCORD_WEBHOOK_FRONTEND || '' }}

  # Backend team  
  ${{ contains(github.event.pull_request.labels.*.name, 'backend') && secrets.DISCORD_WEBHOOK_BACKEND || '' }}

  # All teams
  ${{ secrets.DISCORD_WEBHOOK_ALL }}
```

### 3. Critical/Non-Critical Channels

```yaml
webhook: |
  # Always notify general channel
  ${{ secrets.DISCORD_WEBHOOK_GENERAL }}

  # Only notify ops channel on failure
  ${{ failure() && secrets.DISCORD_WEBHOOK_OPS || '' }}
```

## Payload Customization with Webhooks

### Accessing Raw Payload

The action outputs the generated payload, allowing post-processing:

```yaml
- uses: iShark5060/actions-status-discord@v1
  id: discord
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}

- name: Custom webhook processing
  run: |
    PAYLOAD="${{ steps.discord.outputs.payload }}"

    # Send to additional services
    curl -X POST https://api.example.com/notify \
      -H "Content-Type: application/json" \
      -d "$PAYLOAD"

    # Log to external monitoring
    echo "$PAYLOAD" >> /tmp/webhook-logs.json
```

### Modifying Payload for Different Channels

```yaml
- uses: iShark5060/actions-status-discord@v1
  id: discord
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}

- name: Send customized to ops channel
  env:
    PAYLOAD: ${{ steps.discord.outputs.payload }}
    OPS_WEBHOOK: ${{ secrets.DISCORD_WEBHOOK_OPS }}
  run: |
    # Parse and modify payload for ops team
    PAYLOAD_JSON=$(echo "$PAYLOAD" | jq '
      .embeds[0].title = "[OPS] " + .embeds[0].title |
      .content = "<@&OPS_ROLE_ID> " + (.content // "")
    ')

    # Send to ops channel
    curl -X POST "$OPS_WEBHOOK" \
      -H "Content-Type: application/json" \
      -d "$PAYLOAD_JSON"
```

## Security Considerations

### Webhook URL Security

- **Never commit webhook URLs** to repository
- Use GitHub Secrets for all webhooks
- Regularly rotate webhook tokens
- Revoke compromised webhooks immediately

### Permission Management

- Create webhooks with minimal permissions
- Use read-only channels for notifications
- Separate webhooks for different sensitivity levels
- Audit webhook usage regularly

### Secret Rotation Workflow

```yaml
# Example workflow for secret rotation
- name: Test new webhook
  uses: iShark5060/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK_NEW }}
    ack_no_webhook: true # Don't fail if secret not set yet

- name: Rotate webhook (manual step)
  if: success()
  run: |
    # Update secret in GitHub
    # Update workflow to use new secret
    # Delete old webhook in Discord
```

## Performance Optimization

### Webhook Delivery Timing

- Actions run webhooks concurrently
- No guaranteed order of delivery
- Each webhook independent
- Network latency affects individual deliveries

### Rate Limit Considerations

- Discord limits: ~30 requests/minute per webhook
- Consider batching for high-frequency workflows
- Use delays between rapid notifications
- Monitor 429 (Too Many Requests) responses

### Monitoring and Logging

#### Enable Detailed Logging

```yaml
# GitHub Actions step
- name: Notify with debug
  uses: iShark5060/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
  env:
    ACTIONS_STEP_DEBUG: true # Enable debug logging
```

#### Monitor Delivery Status

```yaml
- name: Notify and capture result
  id: notify
  uses: iShark5060/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    nofail: false # Fail if delivery fails

- name: Log notification result
  if: always()
  run: |
    echo "Notification step status: ${{ steps.notify.outcome }}"
    echo "Payload: ${{ steps.notify.outputs.payload }}"
```

## Troubleshooting

### Common Issues

#### 1. Webhook Not Delivering

- Check webhook URL is correct
- Verify webhook still exists in Discord
- Check Discord channel permissions
- Look for errors in workflow logs

#### 2. Partial Delivery (Multiple Webhooks)

- Check each webhook URL individually
- Some may succeed while others fail
- Use `nofail: false` to catch all failures

#### 3. Payload Too Large

- Discord has size limits on embeds
- Action truncates with warnings
- Check logs for truncation messages
- Simplify embeds if hitting limits

#### 4. Formatting Issues

- Discord markdown may render differently
- Test with simple messages first
- Check Discord's supported markdown
- Avoid complex nested formatting

### Debugging Steps

1. **Minimal test**: Single webhook, minimal config
2. **Check secrets**: Verify secret contains correct URL
3. **Test manually**: Use curl to test webhook
4. **Review logs**: Check GitHub Actions step logs
5. **Discord audit**: Check Discord's webhook settings
