import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';

const workflow = async (name) =>
  parse(
    await readFile(
      new URL(`../.github/workflows/${name}.yml`, import.meta.url),
      'utf8',
    ),
  );

test('deployment publishes the production artifact gated by all checks without rebuilding', async () => {
  const check = await workflow('check');
  const deploy = await workflow('deploy');
  assert.equal(check.on.workflow_call.inputs.production.default, false);
  assert.equal(check.on.workflow_call.inputs.production.type, 'boolean');
  assert.equal(deploy.jobs.check.uses, './.github/workflows/check.yml');
  assert.equal(deploy.jobs.check.with.production, true);
  assert.equal(deploy.jobs.deploy.needs, 'check');
  const steps = check.jobs.check.steps;
  const build = steps.findIndex((s) => s.run === 'npm run build:production');
  assert.ok(build >= 0);
  assert.equal(steps[build].if, '${{ inputs.production }}');
  assert.equal(
    steps.find((s) => s.run === 'npm run build').if,
    '${{ !inputs.production }}',
  );
  assert.equal(
    steps.find((s) => s.run === 'npm run test:browser').env.SITE_RELEASE,
    "${{ inputs.production && 'production' || 'preview' }}",
  );
  const upload = steps.findIndex((s) => s.with?.name === 'tested-site');
  assert.ok(upload > build);
  for (const command of [
    'npm test',
    'npm run check',
    'npm run test:browser',
    'npm run test:community',
    'npm run test:notes',
    'npm run test:meetings',
    'npm run test:labs',
  ]) {
    const index = steps.findIndex((s) => s.run === command);
    assert.ok(
      index >= 0 && index < upload,
      `${command} must gate the artifact`,
    );
    if (command.startsWith('npm run test:')) assert.ok(index > build);
    assert.equal(steps[index].if, undefined);
    assert.ok(!steps[index]['continue-on-error']);
  }
  assert.equal(steps[upload].if, '${{ inputs.production }}');
  assert.equal(steps[upload].with.path, 'dist/');
  assert.equal(steps[upload].with['if-no-files-found'], 'error');
  assert.equal(steps[upload].with['include-hidden-files'], true);
  assert.ok(!check.jobs.check['continue-on-error']);
  const publication = deploy.jobs.deploy.steps;
  const download = publication.findIndex((s) =>
    s.uses?.startsWith('actions/download-artifact@'),
  );
  const publish = publication.findIndex((s) => s.run === 'npx wrangler deploy');
  assert.ok(download >= 0 && publish > download);
  assert.equal(publication[download].with.name, steps[upload].with.name);
  assert.equal(publication[download].with.path, 'dist');
  for (const step of publication) {
    assert.doesNotMatch(
      step.run || '',
      /content:sync|npm (?:run )?(?:build|test|check|deploy)/,
    );
  }
  assert.equal(publication[publish].if, undefined);
});

test('postdeploy verification gates the successful job required by announcements', async () => {
  const deploy = await workflow('deploy');
  const steps = deploy.jobs.deploy.steps;
  const publish = steps.findIndex((s) => s.run === 'npx wrangler deploy');
  const verify = steps.findIndex((s) => s.run === 'npm run verify:deployment');
  assert.ok(publish >= 0 && verify > publish);
  assert.equal(steps[verify].if, undefined);
  assert.ok(!steps[verify]['continue-on-error']);
  assert.ok(!deploy.jobs.deploy['continue-on-error']);
  assert.equal(deploy.jobs.announce.needs, 'deploy');
  assert.equal(deploy.jobs.announce.if, undefined);
});
