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

// `dispatch execute` and `dispatch log` are gone: one task runs through `fgos run`, planned work
// through a Workflow. The compatibility alias refuses them as unknown subcommands and records nothing.

const repo = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const FGOS = path.join(repo, 'bin', 'fgos.mjs');
const DISPATCH = path.join(repo, 'src', 'runner', 'dispatch.mjs');

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

function run(script, args, cwd) {
  const env = { ...process.env };
  delete env.CLAUDE_CODE_SESSION_ID;
  return spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8', env });
}

function eventLines(fgosDir) {
  const dir = path.join(fgosDir, 'events');
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).reduce((n, f) => n + fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(Boolean).length, 0);
}

for (const sub of ['execute', 'log', 'fanout-batch', 'decide']) {
  test(`node src/runner/dispatch.mjs ${sub} is an unknown subcommand`, () => {
    const { root, fgosDir } = mkStore();
    const before = eventLines(fgosDir);
    const out = run(DISPATCH, [sub, 'cand1', '--prompt', 'hi', '--id', 'a', '--provider', 'p', '--command', 'c'], root);
    assert.equal(out.status, 1);
    assert.match(out.stderr, new RegExp(`unknown subcommand "${sub}"`));
    assert.equal(eventLines(fgosDir), before);
  });
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
