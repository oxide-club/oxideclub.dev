import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';

test('deployment requires browser and integration checks on its own content snapshot', async () => {
  const workflow = parse(
    await readFile(
      new URL('../.github/workflows/deploy.yml', import.meta.url),
      'utf8',
    ),
  );
  const job = workflow.jobs.deploy;
  const steps = job.steps;
  const sync = steps.findIndex((step) => step.run === 'npm run content:sync');
  const build = steps.findIndex((step) => step.run === 'npm run build');
  const deploy = steps.findIndex((step) => step.run === 'npm run deploy');
  assert.ok(sync >= 0 && build > sync && deploy > build);
  assert.ok(!job['continue-on-error']);
  for (const command of [
    'npm run test:browser',
    'npm run test:community',
    'npm run test:notes',
    'npm run test:meetings',
    'npm run test:labs',
  ]) {
    const index = steps.findIndex((step) => step.run === command);
    assert.ok(
      index > build && index < deploy,
      `${command} must gate deployment after building its snapshot`,
    );
    assert.equal(
      steps[index].if,
      undefined,
      `${command} must not be conditional`,
    );
    assert.ok(
      !steps[index]['continue-on-error'],
      `${command} must block deployment on failure`,
    );
  }
  assert.equal(steps[deploy].if, undefined);
});

test('postdeploy verification gates the successful job required by announcements', async () => {
  const workflow = parse(
    await readFile(
      new URL('../.github/workflows/deploy.yml', import.meta.url),
      'utf8',
    ),
  );
  const steps = workflow.jobs.deploy.steps;
  const deploy = steps.findIndex((step) => step.run === 'npm run deploy');
  const verify = steps.findIndex(
    (step) => step.run === 'npm run verify:deployment',
  );
  assert.ok(verify > deploy);
  assert.equal(steps[verify].if, undefined);
  assert.ok(!steps[verify]['continue-on-error']);
  assert.ok(!workflow.jobs.deploy['continue-on-error']);
  assert.equal(workflow.jobs.announce.needs, 'deploy');
  assert.equal(workflow.jobs.announce.if, undefined);
});
