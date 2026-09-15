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
