// The tier ladder `$comment` of a project runner config: `fgos setup` refreshes one that differs from the
// ladder, leaves a config with no `$comment` alone, and writes a fresh project config in the seat-binding
// schema. The ladder text comes from the real crate; the `seat-binding-config` doctor row reads the same text.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { DOCTOR_CHECKS } from '../../src/setup/checks.mjs';
import { createSeatBindingClient } from '../../src/seat-binding/client.mjs';
import { ladderCommentLines, refreshTierLadderComment } from '../../src/setup/tier-ladder-comment.mjs';
import { writeProjectConfig } from '../helpers/config-fixture.mjs';

const BIN = path.resolve(import.meta.dirname, '../../bin/fgos.mjs');
const ladderLines = () => ladderCommentLines(createSeatBindingClient().tierLadder().definitions);
const row = DOCTOR_CHECKS.find((check) => check.id === 'seat-binding-config').check;
const mkDir = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));
const projectWith = (config) => {
  const dir = mkDir('fgos-ladder-project-');
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  writeProjectConfig(dir, config);
  return dir;
};
const readConfig = (dir) => JSON.parse(fs.readFileSync(path.join(dir, '.fgos', 'config.json'), 'utf8'));

function setup(cwd) {
  const home = mkDir('fgos-ladder-home-');
  const env = { ...process.env, HOME: home, USERPROFILE: home, FGOS_SESSION_ID: 'tier-ladder-comment-test', FGOS_CLAUDE_COMMAND: '/nonexistent/fgos-test-claude-binary' };
  const result = spawnSync(process.execPath, [BIN, 'setup'], { cwd, env, encoding: 'utf8' });
  assert.equal(result.status, 0, `setup failed: ${result.stderr}`);
  return { home, data: JSON.parse(result.stdout).data };
}

test('a stale runner $comment is replaced by the ladder, every other section is kept, and a missing or current one is left alone', () => {
  const ladder = ladderLines();
  const runner = { timeoutMs: 5000, modelPolicies: { claude: { standard: 'sonnet' } } };
  const dir = projectWith({ other: { kept: true }, runner: { ...runner, $comment: ['stale'] } });
  assert.equal(refreshTierLadderComment(dir, { ladder: () => ladder }).status, 'refreshed');
  assert.deepEqual(readConfig(dir), { other: { kept: true }, runner: { ...runner, $comment: ladder } });
  assert.equal(refreshTierLadderComment(dir, { ladder: () => ladder }).status, 'unchanged');

  const bare = projectWith({ runner });
  assert.equal(refreshTierLadderComment(bare, { ladder: () => assert.fail('the ladder is read only to compare') }).status, 'absent');
  assert.deepEqual(readConfig(bare), { runner });
  assert.equal(refreshTierLadderComment(projectWith({}), { ladder: () => ladder }).status, 'absent');
});

test('the config doctor row reports a $comment that differs from the ladder without failing, and stays quiet for a current or missing one', () => {
  const dir = projectWith({ runner: { $comment: ladderLines() } });
  assert.doesNotMatch(row(dir).message, /differs/);
  assert.equal(row(projectWith({ runner: { timeoutMs: 1 } })).passed, true);
  assert.equal(row(projectWith({})).passed, true);
  const stale = row(projectWith({ runner: { $comment: ['stale'] } }));
  assert.equal(stale.passed, true);
  assert.match(stale.message, /\$comment differs from the tier ladder/);
});

test('setup refreshes a stale runner $comment in the project config', () => {
  const dir = projectWith({ runner: { $comment: ['a stale line'] } });
  const { data } = setup(dir);
  assert.equal(data.tierLadderComment.status, 'refreshed');
  assert.deepEqual(readConfig(dir).runner.$comment, ladderLines());
});

test('setup on a project with no config writes a fresh one in the seat-binding schema, and the global file it creates carries no seat-binding key', () => {
  const dir = mkDir('fgos-setup-fresh-');
  const { home, data } = setup(dir);
  assert.equal(data.tierLadderComment.status, 'absent');
  assert.equal(readConfig(dir).runner.patterns.seatBinding.schema, 1);
  const global = JSON.parse(fs.readFileSync(path.join(home, '.fgos', 'config.json'), 'utf8'));
  assert.equal(global.runner.patterns?.seatBinding, undefined);
  assert.equal(global.runner.rigorToTier, undefined);
});
