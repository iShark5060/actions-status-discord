# Discord Status

Post GitHub Actions CI status to Discord as embeds.

[![CI](https://github.com/iShark5060/actions-discord-status/actions/workflows/ci.yml/badge.svg)](https://github.com/iShark5060/actions-discord-status/actions/workflows/ci.yml)

> **Fork notice:** Maintained fork of [sarisia/actions-status-discord](https://github.com/sarisia/actions-status-discord) by Sarisia (MIT License).

> **Always reference a published version tag** (e.g. `@v1`). The bundled action code (`dist/index.js`) is only committed to release tags, so referencing `@main` will not work.

![Discord embed example](https://user-images.githubusercontent.com/33576079/212482263-31456af9-6a9f-4110-82ad-cd3df738bddb.png)

## Usage

### Minimum

```yaml
- uses: iShark5060/actions-discord-status@v1
  if: always()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
```

### Full options

```yaml
- uses: iShark5060/actions-discord-status@v1
  if: always()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    status: ${{ job.status }}
    content: 'Hey <@USER_ID>'
    title: deploy
    description: Build and deploy to GitHub Pages
    image: ${{ secrets.EMBED_IMAGE }}
    color: 0x0000ff
    url: https://github.com/iShark5060/actions-discord-status
    username: GitHub Actions
    avatar_url: ${{ secrets.AVATAR_URL }}
```

### No detail

```yaml
- uses: iShark5060/actions-discord-status@v1
  if: always()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    nodetail: true
    title: 'New version of `software` is ready!'
    description: |
      Version `${{ github.event.release.tag_name }}`
      Click [here](${{ github.event.release.html_url }}) to download!
    color: 0xff91a4
```

## Inputs

| Input            | Required | Default                  | Description                                              |
| ---------------- | -------- | ------------------------ | -------------------------------------------------------- |
| `webhook`        | No       | `env.DISCORD_WEBHOOK`    | Discord webhook URL. **Do not append `/github` suffix.** |
| `status`         | No       | `${{ job.status }}`      | Job or workflow conclusion.                              |
| `content`        | No       | —                        | Message outside the embed (use for `@mentions`).         |
| `title`          | No       | `${{ github.workflow }}` | Embed title.                                             |
| `description`    | No       | —                        | Embed description.                                       |
| `image`          | No       | —                        | Embed image URL.                                         |
| `color`          | No       | status color             | Embed color as hex (e.g. `0xFFFFFF`).                    |
| `url`            | No       | —                        | Title link URL.                                          |
| `username`       | No       | —                        | Webhook username override.                               |
| `avatar_url`     | No       | —                        | Webhook avatar override.                                 |
| `nofail`         | No       | `true`                   | When `false`, webhook failures fail the step.            |
| `nocontext`      | No       | `false`                  | Suppress repository/ref/event fields.                    |
| `noprefix`       | No       | `false`                  | Do not prefix title with status.                         |
| `nodetail`       | No       | `false`                  | Sets both `nocontext` and `noprefix`.                    |
| `notimestamp`    | No       | `false`                  | Omit embed timestamp.                                    |
| `ack_no_webhook` | No       | `false`                  | Suppress missing-webhook errors.                         |

## Outputs

| Output    | Description                                       |
| --------- | ------------------------------------------------- |
| `payload` | JSON Discord webhook payload for post-processing. |

## Tips

### Multiple webhooks

Separate webhook URLs with newlines in the secret value. Failed deliveries do not cancel other webhooks.

### Full payload control

Set a step `id`, read `${{ steps.<id>.outputs.payload }}`, modify the JSON, and POST it yourself (e.g. with `actions/github-script`).

### Markdown

`title` and `description` support Discord markdown.

## FAQ

**`Error: Webhook response: 400: {"sender":["This field is required"]}`**

Do not append `/github` to your webhook URL.

## License

MIT. See [LICENSE](LICENSE).
