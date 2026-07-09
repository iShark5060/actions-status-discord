# Basic Usage

## Getting Started

This guide covers the most common configurations for the Actions Status Discord action. For a quick start, use the minimum configuration and then customize as needed.

## Minimum Configuration

### Basic Setup

```yaml
- name: Notify Discord
  uses: iShark5060/actions-status-discord@v1
  if: always()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
```

**What this does**:

- Sends status to Discord when job completes (success or failure)
- Uses default embed colors based on job status
- Includes GitHub context (repository, ref, actor, event)
- Appends status prefix to title (e.g., "Success: Workflow Name")

### Required Components

1. **Discord Webhook**: Create in Discord server settings
2. **GitHub Secret**: Add webhook URL as `DISCORD_WEBHOOK`
3. **Action Step**: Add to your workflow with `if: always()`

## Common Configurations

### Simple Success/Failure Notification

```yaml
- name: Notify Discord
  uses: iShark5060/actions-status-discord@v1
  if: always()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    title: 'Build Status'
    description: 'CI build completed for ${{ github.ref }}'
```

### Release Notifications

```yaml
- name: Notify Discord on Release
  uses: iShark5060/actions-status-discord@v1
  if: always()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    nodetail: true
    title: 'New Release: ${{ github.event.release.tag_name }}'
    description: |
      **${{ github.event.release.name }}**

      ${{ github.event.release.body }}

      [Download here](${{ github.event.release.html_url }})
    color: 0xff91a4
```

### Deployment Notifications

```yaml
- name: Notify Discord Deployment
  uses: iShark5060/actions-status-discord@v1
  if: always()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    title: 'Deployment to Production'
    description: 'Version ${{ github.sha }} deployed successfully'
    color: 0x00ff00
    url: 'https://your-app.com'
```

## Configuration Examples by Use Case

### CI Pipeline Notification

```yaml
- name: Notify CI Results
  uses: iShark5060/actions-status-discord@v1
  if: always()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    title: 'CI Pipeline'
    description: |
      **Branch**: ${{ github.ref }}
      **Commit**: [${{ github.sha }}](${{ github.server_url }}/${{ github.repository }}/commit/${{ github.sha }})
      **Triggered by**: ${{ github.actor }}
```

### Pull Request Status

```yaml
- name: Notify PR Status
  uses: iShark5060/actions-status-discord@v1
  if: always()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    title: 'PR #${{ github.event.pull_request.number }}'
    description: |
      **${{ github.event.pull_request.title }}**

      By: ${{ github.event.pull_request.user.login }}
      Changes: ${{ github.event.pull_request.changed_files }} files
    url: ${{ github.event.pull_request.html_url }}
```

### Scheduled Job Results

```yaml
- name: Notify Scheduled Job
  uses: iShark5060/actions-status-discord@v1
  if: always()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    title: 'Daily Backup'
    description: 'Database backup completed at $(date -u)'
    nocontext: true # Suppress GitHub context for scheduled jobs
```

## Important Configuration Patterns

### 1. Always Run Notifications

```yaml
if: always() # Send notification regardless of job success/failure
```

**Why**: Ensures notifications are sent even when jobs fail.

### 2. Webhook from Secrets

```yaml
webhook: ${{ secrets.DISCORD_WEBHOOK }}
```

**Best Practice**: Store webhook URLs in GitHub Secrets for security.

### 3. Status-Based Colors

```yaml
# Colors are automatically set based on job status:
# Success: Green (0x28A745)
# Failure: Red (0xDC3545)
# Cancelled: Gray (0x6C757D)
# Skipped: Gray (0x6C757D)
```

### 4. Dynamic Content

```yaml
description: 'Build for ${{ github.ref }} completed'
title: '${{ github.workflow }}'
```

**Available Context**:

- `${{ github.ref }}`: Branch or tag ref
- `${{ github.sha }}`: Commit SHA
- `${{ github.workflow }}`: Workflow name
- `${{ github.actor }}`: User who triggered
- `${{ github.repository }}`: Repository name

## Conditional Notifications

### Notify Only on Failure

```yaml
- name: Notify on Failure
  uses: iShark5060/actions-status-discord@v1
  if: failure()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    title: 'Build Failed'
    content: '<@&ROLE_ID> Build requires attention!'
```

### Notify Only on Success

```yaml
- name: Notify on Success
  uses: iShark5060/actions-status-discord@v1
  if: success()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    title: 'Deployment Successful'
    description: 'Production deployment completed'
```

### Different Notifications for Different Outcomes

```yaml
# Success notification
- name: Notify Success
  uses: iShark5060/actions-status-discord@v1
  if: success()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    title: '✅ Build Passed'

# Failure notification
- name: Notify Failure
  uses: iShark5060/actions-status-discord@v1
  if: failure()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    title: '❌ Build Failed'
    content: '<@USER_ID> Please check the build!'
```

## Quick Reference Table

| Use Case           | Key Configuration                          | Notes                                  |
| ------------------ | ------------------------------------------ | -------------------------------------- |
| **Basic CI**       | `if: always()`, `webhook`                  | Minimum viable setup                   |
| **Releases**       | `nodetail: true`, custom title/description | Clean release announcements            |
| **Deployments**    | Custom color, URL link                     | Track deployment events                |
| **PR Updates**     | Dynamic title, PR URL                      | Monitor pull request status            |
| **Scheduled Jobs** | `nocontext: true`                          | Hide GitHub context for automated jobs |
| **Error Alerts**   | `if: failure()`, `content` with mentions   | Alert specific users/roles             |

## Next Steps

After mastering basic usage, explore:

- [Advanced Configuration](../workflows/advanced-configuration.md) for all input options
- [Webhook Management](../workflows/webhook-management.md) for multiple webhooks
- Custom payload modifications for unique use cases
