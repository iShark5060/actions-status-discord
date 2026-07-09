# Actions Status Discord

Post GitHub Actions status to Discord as a beautiful embed.

> **Fork notice:** This repository is a maintained fork of [sarisia/actions-status-discord](https://github.com/sarisia/actions-status-discord) by [**Sarisia**](https://github.com/sarisia). The original project is no longer maintained. All credit for the original action goes to Sarisia (Copyright © 2020).

![image](https://user-images.githubusercontent.com/33576079/212482263-31456af9-6a9f-4110-82ad-cd3df738bddb.png)

- :sushi: **_Super Easy!_** Works perfectly out of the box, also super customizable!
- :sushi: **_OS & Arch-agnostic!_** Tested against all GitHub-hosted runners including Ubuntu ARM and macOS Apple Silicon.
- :sushi: **_Fast!_** JavaScript action — no Docker container required.

## Usage

> **Always reference a published version tag** (e.g. `@v1`), which is the default in the examples below. The bundled action code (`lib/index.mjs`) is only committed to release tags, so referencing an unreleased ref like `@main` will not work.

### Minimum

```yaml
- uses: iShark5060/actions-status-discord@v1
  if: always()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
```

![image](https://user-images.githubusercontent.com/33576079/212482274-7d4ee492-69b5-4d61-844d-b1af05e4380a.png)

### Full options

```yaml
- uses: iShark5060/actions-status-discord@v1
  if: always()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    status: ${{ job.status }}
    content: 'Hey <@316911818725392384>'
    title: 'deploy'
    description: 'Build and deploy to GitHub Pages'
    image: ${{ secrets.EMBED_IMAGE }}
    color: 0x0000ff
    url: 'https://github.com/iShark5060/actions-status-discord'
    username: GitHub Actions
    avatar_url: ${{ secrets.AVATAR_URL }}
```

![image](https://user-images.githubusercontent.com/33576079/212482303-c5813211-95be-4599-ac3d-e93cdd6d33c5.png)

### No detail

```yaml
- uses: iShark5060/actions-status-discord@v1
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

![image](https://user-images.githubusercontent.com/33576079/212482315-52429bbd-b7b9-456a-8ee8-ee26aa2a0fb1.png)

For `if` parameter, see
[GitHub Actions Reference](https://help.github.com/en/actions/reference/context-and-expression-syntax-for-github-actions#job-status-check-functions)

## Configuration

### Environment Variables

| Key             | Value                                                                       | Description                                                                                                                                                                 |
| --------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DISCORD_WEBHOOK | Discord webhook endpoind like:<br>`https://discordapp.com/api/webhooks/...` | You can provide webhook via inputs either.<br>**DO NOT APPEND [`/github` SUFFIX](https://discord.com/developers/docs/resources/webhook#execute-githubcompatible-webhook)!** |

### Inputs

#### General customizations

| Key         | Required | Value                                           | Default                 | Description                                                                                                                                                                                                                                           |
| ----------- | -------- | ----------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| webhook     | No       | String                                          | `env.DISCORD_WEBHOOK`   | Discord webhook endpoind like:<br>`https://discordapp.com/api/webhooks/...`<br>This overrides `env.DISCORD_WEBHOOK`.<br>**DO NOT APPEND [`/github` SUFFIX](https://discord.com/developers/docs/resources/webhook#execute-githubcompatible-webhook)!** |
| status      | No       | `Success`, `Failure`, `Cancelled`, or `Skipped` | `${{ job.status }}`     | Job or workflow conclusion. See [Document for `job` context](https://help.github.com/en/actions/reference/context-and-expression-syntax-for-github-actions#job-context)                                                                               |
| content     | No       | String                                          |                         | Content. Shown as an message outside of the embed. See [Mention to user/role](#mention-to-user/role)                                                                                                                                                  |
| title       | No       | String                                          | `${{ github.workflow}}` | String included in embed title.                                                                                                                                                                                                                       |
| description | No       | String                                          |                         | Description included in message                                                                                                                                                                                                                       |
| image       | No       | String                                          |                         | Image attached to the message                                                                                                                                                                                                                         |
| color       | No       | Hex string like: `0xFFFFFF`                     |                         | Overrides Discord embed color                                                                                                                                                                                                                         |
| url         | No       | String                                          |                         | URL to jump when the title is clicked                                                                                                                                                                                                                 |
| username    | No       | String                                          |                         | Overrides Discord webhook username                                                                                                                                                                                                                    |
| avatar_url  | No       | String                                          |                         | Overrides Discord webhook avatar url                                                                                                                                                                                                                  |

#### Advanced usages

| Key            | Required | Value             | Default | Description                                                                                                                     |
| -------------- | -------- | ----------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| nofail         | No       | `true` or `false` | `true`  | This action won't make workflow failed by default. If set to `false`, this action will set status failed when failed to notify. |
| nocontext      | No       | `true` or `false` | `false` | Set `true` to suppress GitHub context fields (`Repository`, `Ref`, etc).                                                        |
| noprefix       | No       | `true` or `false` | `false` | Set `true` to avoid appending job status (`Success: `, etc.) to title                                                           |
| nodetail       | No       | `true` or `false` | `false` | Set `true` will set both `nocontext` and `noprefix` to `true`                                                                   |
| notimestamp    | No       | `true` or `false` | `false` | Set `true` to avoid appending timestamp                                                                                         |
| ack_no_webhook | No       | `true` or `false` | `false` | Set `true` to suppress error which raised when webhook is not set                                                               |

<details>
<summary>Show deprecated</summary>

| Key | Required | Value  | Default | Description                                                                                           |
| --- | -------- | ------ | ------- | ----------------------------------------------------------------------------------------------------- |
| job | No       | String |         | **Deprecated. Will be removed in v2**<br>Job name included in message title. Overrides `title` input. |

</details>

### Outputs

| Key     | Description                                                                |
| ------- | -------------------------------------------------------------------------- |
| payload | Discord webhook payload. See [Full payload control](#full-payload-control) |

## Tips

### Using markdown

Some fields support markdown syntax.

```yaml
- uses: iShark5060/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    nodetail: true
    title: 'New version of `software` is ready!'
    description: |
      Version `${{ github.event.release.tag_name }}`
      Click [here](${{ github.event.release.html_url }}) to download!
    color: 0xff91a4
```

![image](https://user-images.githubusercontent.com/33576079/212482315-52429bbd-b7b9-456a-8ee8-ee26aa2a0fb1.png)

### Mention to user/role

Since `@mention` inside the embed does not generate ping to users,
you can use `content` input to mention users/roles:

```yaml
- uses: iShark5060/actions-status-discord@v1
  if: always()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    content: 'Hey <@316911818725392384>'
```

See the [Discord Developer Docs](https://discord.com/developers/docs/reference#message-formatting) for available formats.

### Trigger multiple webhooks

You can set multiple webhooks separated with EOL (line break, `\n`) to Secrets.

For example, set Secrets to:

```
https://discordapp.com/api/webhooks/...
https://media.guilded.gg/webhooks/...
https://this-is-invalid-webhook-endpoint.invalid/...
```

will trigger these 3 webhooks simultaneously.

If some of these webhooks are failed, other deliveries will **NOT** be cancelled.

If the option `nofail` is set to `false` and any of one fail, the action will set
workflow status to `Failure`.

### Full payload control

You can modify payload before sending to Discord:

```yaml
- uses: iShark5060/actions-status-discord@v1
  if: always()
  id: webhook # set id to reference output payload later
  with:
    nofail: false
    ack_no_webhook: true # set this to suppress error which is raised when nofail is disabled and webhook is not set
    # webhook is not set here!

- uses: actions/github-script@v7
  env:
    WEBHOOK_PAYLOAD: ${{ steps.webhook.outputs.payload }}
    WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK }}
  with:
    script: |
      const { WEBHOOK_PAYLOAD, WEBHOOK_URL } = process.env

      const payload = JSON.parse(WEBHOOK_PAYLOAD)

      // modify payload as you like
      delete payload.embeds[0].color

      // send to Discord (fetch is available on the action runtime, no install needed)
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`)
      }
```

[See actions/github-script docs](https://github.com/actions/github-script)

### GHES, Gitea and Forgejo

This actions may work with [GHES](https://docs.github.com/en/enterprise-server@3.8/admin/github-actions/managing-access-to-actions-from-githubcom/about-using-actions-in-your-enterprise), [Gitea](https://blog.gitea.io/2022/12/feature-preview-gitea-actions/) and [Forgejo](https://forgejo.org/2023-02-27-forgejo-actions/), but not tested against yet.

If you have any issues, please let us know in Discussions or Issues.

### Guilded webhook support

As [Guilded](https://guilded.gg) supports [Discord Webhooks API](https://discord.com/developers/docs/resources/webhook#execute-webhook),
you can use Guilded webhook endpoint in the same way as Discord webhook.

## FAQ

### `Error: Webhook response: 400: {"sender":["This field is required"]}`

Do not append `/github` suffix to your webhook URL. See [Inputs](#inputs) section.

## Questions? Bugs?

Feel free to ask in [Discussions](https://github.com/iShark5060/actions-status-discord/discussions),
or report bugs in [Issues](https://github.com/iShark5060/actions-status-discord/issues)!

## Credits

This action was originally created by [**Sarisia**](https://github.com/sarisia) as [sarisia/actions-status-discord](https://github.com/sarisia/actions-status-discord). This fork is maintained by [iShark5060](https://github.com/iShark5060) for personal and community use.
