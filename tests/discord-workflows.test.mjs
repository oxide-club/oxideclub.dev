import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
const read = path => readFile(new URL(path, import.meta.url), 'utf8');
const hasSources = ['challenges', 'notes'].every(repo => existsSync(new URL(`../../${repo}/.git`, import.meta.url)));
test('content workflows never check out fork code or interpolate PR fields in shell', { skip: !hasSources }, async () => {
  for (const repo of ['challenges', 'notes']) {
    const workflow = parse(await read(`../../${repo}/.github/workflows/discord-contributions.yml`));
    assert.deepEqual(workflow.on.pull_request_target.branches, ['main']);
    assert.ok(workflow.on.pull_request_target.types.includes('synchronize'));
    assert.deepEqual(workflow.permissions, {});
    const job = workflow.jobs.notify;
    assert.equal(job.permissions.contents, 'write');
    assert.equal(job.permissions['pull-requests'], 'read');
    const checkout = job.steps.find(step => step.uses?.startsWith('actions/checkout@'));
    assert.equal(checkout.with.ref, '${{ github.event.pull_request.base.sha }}');
    assert.equal(checkout.with.repository, '${{ github.repository }}');
    assert.equal(checkout.with['persist-credentials'], false);
    const run = job.steps.find(step => step.run?.includes('contributions.mjs'));
    assert.equal(run.env.DISCORD_CONTRIBUTIONS_WEBHOOK_URL, '${{ secrets.DISCORD_CONTRIBUTIONS_WEBHOOK_URL }}');
    assert.doesNotMatch(run.run, /\$\{\{/);
  }
});
test('vendored notifier modules are identical across all three repositories', { skip: !hasSources }, async () => {
  for (const name of ['client', 'state', 'contributions']) {
    const canonical = await read(`../scripts/discord/${name}.mjs`);
    for (const repo of ['challenges', 'notes']) assert.equal(await read(`../../${repo}/scripts/discord/${name}.mjs`), canonical);
  }
});
