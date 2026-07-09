import { endGroup, startGroup, setOutput } from '@actions/core';

import { getContext } from './context';
import { formatEvent } from './format';
import { getInputs, Inputs, statusOpts } from './input';
import { logDebug, logError, logInfo } from './utils';
import { fitContent, fitEmbed } from './validate';

async function run() {
  try {
    logInfo('Getting inputs...');
    const inputs = getInputs();

    logInfo('Generating payload...');
    const payload = getPayload(inputs);
    const payloadStr = JSON.stringify(payload, null, 2);
    startGroup(
      'Dump payload (You can access the payload as `${{ steps.<step_id>.outputs.payload }}` in latter steps)',
    );
    logInfo(payloadStr);
    endGroup();

    logInfo(
      `Triggering ${inputs.webhooks.length} webhook${inputs.webhooks.length > 1 ? 's' : ''}...`,
    );
    const results = await Promise.allSettled(
      inputs.webhooks.map((w) => wrapWebhook(w.trim(), payload)),
    );
    const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failures.length > 0) {
      for (const failure of failures) {
        const message =
          failure.reason instanceof Error ? failure.reason.message : String(failure.reason);
        logError(message);
      }
      return;
    }

    // set output
    setOutput('payload', payloadStr);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    logError(`Unexpected failure: ${message}`);
  }
}

async function wrapWebhook(webhook: string, payload: object): Promise<void> {
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Webhook response: ${res.status}: ${body}`);
  }
}

export function getPayload(inputs: Readonly<Inputs>): object {
  const ctx = getContext();
  const { owner, repo } = ctx.repo;
  const { eventName, ref, workflow, actor, payload, serverUrl, runId } = ctx;
  const repoURL = `${serverUrl}/${owner}/${repo}`;
  const workflowURL = `${repoURL}/actions/runs/${runId}`;

  logDebug(JSON.stringify(payload));

  const eventFieldTitle = `Event - ${eventName}`;
  const eventDetail = formatEvent(eventName, payload);

  let embed: { [key: string]: any } = {
    color: inputs.color === undefined ? statusOpts[inputs.status].color : inputs.color,
  };

  if (!inputs.notimestamp) {
    embed.timestamp = new Date().toISOString();
  }

  // title
  if (inputs.title) {
    embed.title = inputs.title;
  }

  if (inputs.url) {
    embed.url = inputs.url;
  }

  if (inputs.image) {
    embed.image = {
      url: inputs.image,
    };
  }

  if (!inputs.noprefix) {
    embed.title = statusOpts[inputs.status].status + (embed.title ? `: ${embed.title}` : '');
  }

  if (inputs.description) {
    embed.description = inputs.description;
  }

  if (!inputs.nocontext) {
    embed.fields = [
      {
        name: 'Repository',
        value: `[${owner}/${repo}](${repoURL})`,
        inline: true,
      },
      {
        name: 'Ref',
        value: ref,
        inline: true,
      },
      {
        name: eventFieldTitle,
        value: eventDetail,
        inline: false,
      },
      {
        name: 'Triggered by',
        value: actor,
        inline: true,
      },
      {
        name: 'Workflow',
        value: `[${workflow}](${workflowURL})`,
        inline: true,
      },
    ];
  }

  let discord_payload: any = {
    embeds: [fitEmbed(embed)],
  };
  logDebug(`embed: ${JSON.stringify(embed)}`);

  if (inputs.username) {
    discord_payload.username = inputs.username;
  }
  if (inputs.avatar_url) {
    discord_payload.avatar_url = inputs.avatar_url;
  }
  if (inputs.content) {
    discord_payload.content = fitContent(inputs.content);
  }

  return discord_payload;
}

// Skip auto-execution under the test runner so importing this module for unit
// tests does not trigger a real webhook run.
if (!process.env.VITEST) {
  run();
}
