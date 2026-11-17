// test/runner/dispatch/tool-providers.test.mjs -- which tool executors serve a capability and whether each is there now.
// The one owner of the `for` read and of the live presence probe; `decide` and the doctor only ask it.
import '../../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { initFixtureRepo } from '../../helpers/git-fixture.mjs';
import { forEntriesOf, servedCapabilitiesOf, toolProvidersOf } from '../../../src/runner/dispatch/tool-providers.mjs';

function tmpDir() {
  return fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-tool-providers-')));
}

/** A PATH directory holding one executable per name. */
function pathWith(...names) {
  const dir = tmpDir();
  for (const name of names) fs.writeFileSync(path.join(dir, name), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  return dir;
}

const mcpTool = (extra = {}) => ({
  kind: 'tool',
  for: ['impact-analysis'],
  scanTarget: '.index',
  invocations: [{ via: 'mcp', command: 'mcp:index', tools: { 'impact-analysis': 'mcp__index__impact' } }],
  ...extra,
});

test('forEntriesOf returns the raw for list of any executor kind and [] when it declares none', () => {
  assert.deepEqual(forEntriesOf({ kind: 'agent', for: ['judge'] }), ['judge']);
  assert.deepEqual(forEntriesOf({ kind: 'tool' }), []);
  assert.deepEqual(forEntriesOf({ for: 'not-a-list' }), []);
  assert.deepEqual(forEntriesOf(undefined), []);
});

test('servedCapabilitiesOf lists what a tool executor serves and nothing for an agent executor, whatever its for says', () => {
  assert.deepEqual(servedCapabilitiesOf({ kind: 'tool', for: ['a', 'b'] }), ['a', 'b']);
  assert.deepEqual(servedCapabilitiesOf({ kind: 'agent', for: ['a'] }), []);
  assert.deepEqual(servedCapabilitiesOf({ for: ['a'] }), []);
});

test('toolProvidersOf finds a cli tool named by an absolute path', () => {
  const dir = pathWith('abs-tool');
  const cfg = { executors: { t: { kind: 'tool', for: ['x'], invocations: [{ via: 'cli', command: path.join(dir, 'abs-tool') }] } } };
  assert.equal(toolProvidersOf(cfg, { capability: 'x', pathEnv: '' })[0].status, 'present');
  const gone = { executors: { t: { kind: 'tool', for: ['x'], invocations: [{ via: 'cli', command: path.join(dir, 'nope') }] } } };
  assert.equal(toolProvidersOf(gone, { capability: 'x', pathEnv: '' })[0].status, 'missing');
});

test('toolProvidersOf probes an mcp tool by its scanTarget: missing, present, and stale when its index is behind HEAD', () => {
  const repo = initFixtureRepo(tmpDir(), { branch: 'main' });
  const cfg = { executors: { index: mcpTool() } };
  const ask = () => toolProvidersOf(cfg, { capability: 'impact-analysis', repoRoot: repo });

  assert.equal(ask()[0].status, 'missing');

  fs.mkdirSync(path.join(repo, '.index'));
  assert.equal(ask()[0].status, 'present');

  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
  fs.writeFileSync(path.join(repo, '.index', 'meta.json'), JSON.stringify({ lastCommit: head }));
  assert.equal(ask()[0].status, 'present', 'an index recording HEAD is current');

  fs.writeFileSync(path.join(repo, '.index', 'meta.json'), JSON.stringify({ lastCommit: '0'.repeat(40) }));
  assert.equal(ask()[0].status, 'stale');

  fs.writeFileSync(path.join(repo, '.index', 'meta.json'), '{ not json');
  assert.equal(ask()[0].status, 'present', 'an unreadable index record never reports staleness it did not see');
});

