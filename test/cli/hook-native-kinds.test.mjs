import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync, execFileSync } from 'node:child_process';
import { initStore, addWork } from '../../src/state/store.mjs';
import { activateGitFixture } from '../helpers/git-fixture.mjs';
import { writeProjectConfig } from '../helpers/config-fixture.mjs';

const repo = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const FGOS = path.join(repo, 'bin', 'fgos.mjs');

function mkStore() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-retired-doors-'));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: root });
  const fgosDir = path.join(root, '.fgos');
  fs.mkdirSync(fgosDir);
  activateGitFixture(root);
  initStore(fgosDir);
  // A project with no executors of its own: the executors an earlier test wrote to the machine's file are not read.
  writeProjectConfig(root, { runner: { patterns: { seatBinding: { schema: 1 } } } });
  addWork(fgosDir, {
    id: 'cand1', title: 'x', kind: 'task', status: 'todo', domain: 'coding',
    workflowStep: 'executing', deps: [], refs: [], risk: 'light', verify: 'true',
  });
  return { root, fgosDir };
}

test('the legacy payload refuses the native hook kinds by name instead of answering them', () => {
  const { root } = mkStore();
  for (const kind of ['mailbox', 'mailbox-sync', 'dispatch-decide']) {
    // boundary: the refusal is the legacy payload's own exit status and streams, seen by the CLI that runs the hook line
    const out = spawnSync(process.execPath, [FGOS, 'hook', kind, '--cli', 'claude', '--event', 'stop'], {
      cwd: root,
      encoding: 'utf8',
      input: JSON.stringify({ hook_event_name: 'Stop', session_id: 'x' }),
    });
    assert.equal(out.status, 1, out.stderr);
    assert.equal(out.stdout, '');
    assert.match(out.stderr, new RegExp(`hook kind "${kind}" is served by the native fgos host`));
  }
});
