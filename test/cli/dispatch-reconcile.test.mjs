import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const repo = path.resolve(new URL('../..', import.meta.url).pathname);
const run = (root, args) => spawnSync(process.execPath, ['bin/fgos.mjs', ...args, '--dir', root], { cwd: repo, encoding: 'utf8' });
test('CLI exposes only the narrow reconcile plan and refuses forbidden actions', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-reconcile-cli-')); fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(root, '.fgos', 'dispatch.lock'), JSON.stringify({ pid: 99999999, startTime: '1' }));
  const planned = run(root, ['dispatch', 'reconcile', 'plan']); assert.equal(planned.status, 0, planned.stderr); assert.equal(JSON.parse(planned.stdout).data.outcome, 'planned');
  const refused = run(root, ['dispatch', 'reconcile', 'plan', '--action', 'resume-driver']); assert.equal(refused.status, 0, refused.stderr); assert.equal(JSON.parse(refused.stdout).data.outcome, 'refused');
});

test('CLI apply refuses a same-byte outside-root target tampered into a plan', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-reconcile-cli-')); fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  const bytes = JSON.stringify({ pid: 99999999, startTime: '1' });
  const guard = path.join(root, '.fgos', 'dispatch.lock'); fs.writeFileSync(guard, bytes);
  const outside = path.join(path.dirname(root), `${path.basename(root)}-outside-lock`); fs.writeFileSync(outside, bytes);
  const planned = run(root, ['dispatch', 'reconcile', 'plan']); assert.equal(planned.status, 0, planned.stderr);
  const plan = JSON.parse(planned.stdout).data; plan.proposedAction.path = outside;
  const applied = run(root, ['dispatch', 'reconcile', 'apply', '--plan', JSON.stringify(plan)]);
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(JSON.parse(applied.stdout).data.outcome, 'plan-stale');
  assert.equal(fs.existsSync(outside), true, 'outside same-byte file must never be unlinked');
  assert.equal(fs.existsSync(guard), true, 'canonical guard must remain after refusal');
});
