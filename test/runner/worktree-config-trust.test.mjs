// Command values (invariantChecks.commands, worktreeSetup.commands) come from the main checkout's config whatever
// root the caller passes: a worker's edit to its own linked worktree's config never changes what the merge gate or
// the worktree setup executes. The rule's owner is the config crate's snapshot; this is the one wiring proof at the
// Node readers that pass a linked worktree's root.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { initFixtureRepo } from '../helpers/git-fixture.mjs';
import { writeProjectConfig } from '../helpers/config-fixture.mjs';
import { readInvariantCheckCommands } from '../../src/runner/merge.mjs';
import { runWorktreeSetupCommands } from '../../src/runner/worktree.mjs';

// The facade layers the machine's own global file under the project file; a test never reads the real one.
process.env.HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-config-trust-home-'));

const mkdtemp = (name) => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), name)));
const touch = (file) => `${JSON.stringify(process.execPath)} -e "require('node:fs').writeFileSync('${file}', 'x')"`;

function mainWithLinkedWorktree() {
  const main = initFixtureRepo(mkdtemp('fgos-config-trust-main-'));
  writeProjectConfig(main, { invariantChecks: { commands: ['main-check'] }, worktreeSetup: { commands: [touch('ran-main.txt')] } });
  const linked = path.join(mkdtemp('fgos-config-trust-linked-'), 'wt');
  execFileSync('git', ['worktree', 'add', '-q', '-b', 'trust-wt', linked], { cwd: main });
  // What a worker could do: rewrite the config inside its own checkout.
  writeProjectConfig(linked, { invariantChecks: { commands: ['worker-check'] }, worktreeSetup: { commands: [touch('ran-worker.txt')] } });
  return { main, linked };
}

test('a linked worktree root still reads the main checkout invariant-check commands', () => {
  const { main, linked } = mainWithLinkedWorktree();
  assert.deepEqual(readInvariantCheckCommands(linked), ['main-check']);
  assert.deepEqual(readInvariantCheckCommands(main), ['main-check']);
});

test('a linked worktree root still runs the main checkout worktree-setup commands, never its own', () => {
  const { linked } = mainWithLinkedWorktree();
  runWorktreeSetupCommands(linked, linked);
  assert.equal(fs.existsSync(path.join(linked, 'ran-main.txt')), true);
  assert.equal(fs.existsSync(path.join(linked, 'ran-worker.txt')), false);
});

test('a directory that is not a repository reads its own commands', () => {
  const dir = mkdtemp('fgos-config-trust-plain-');
  writeProjectConfig(dir, { invariantChecks: { commands: ['own-check'] }, worktreeSetup: { commands: [touch('ran-own.txt')] } });
  assert.deepEqual(readInvariantCheckCommands(dir), ['own-check']);
  runWorktreeSetupCommands(dir, dir);
  assert.equal(fs.existsSync(path.join(dir, 'ran-own.txt')), true);
});
