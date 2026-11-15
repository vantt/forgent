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

test('toolProvidersOf reads every for entry: an executor serving two capabilities answers both', () => {
  const cfg = { executors: { multi: { kind: 'tool', for: ['first', 'second'], invocations: [{ via: 'cli', command: 'multi' }] } } };
  const env = pathWith('multi');
  assert.deepEqual(toolProvidersOf(cfg, { capability: 'first', pathEnv: env }).map((p) => p.executorId), ['multi']);
  assert.deepEqual(toolProvidersOf(cfg, { capability: 'second', pathEnv: env }).map((p) => p.executorId), ['multi']);
  assert.deepEqual(toolProvidersOf(cfg, { capability: 'third', pathEnv: env }), []);
});

test('toolProvidersOf folds capability spellings: Impact Analysis, impact_analysis and impact-analysis are one name', () => {
  const cfg = { executors: { a: { kind: 'tool', for: ['Impact Analysis'] }, b: { kind: 'tool', for: ['impact_analysis'] } } };
  for (const asked of ['impact-analysis', 'IMPACT_ANALYSIS', ' Impact Analysis ']) {
    assert.deepEqual(toolProvidersOf(cfg, { capability: asked }).map((p) => p.executorId), ['a', 'b'], asked);
  }
  assert.deepEqual(toolProvidersOf(cfg, { capability: '' }), []);
  assert.deepEqual(toolProvidersOf(cfg, { capability: '---' }), []);
});

test('toolProvidersOf ignores the for of an agent executor', () => {
  const cfg = { executors: { reviewer: { kind: 'agent', for: ['code:review'] } } };
  assert.deepEqual(toolProvidersOf(cfg, { capability: 'code:review' }), []);
});

test('toolProvidersOf finds a cli tool on the given PATH as present and as missing when it is not there', () => {
  const cfg = { executors: { herdr: { kind: 'tool', for: ['pane-labeling'], invocations: [{ via: 'cli', command: 'fgos-herdr-probe' }] } } };
  assert.deepEqual(toolProvidersOf(cfg, { capability: 'pane-labeling', pathEnv: pathWith('fgos-herdr-probe') }), [
    { executorId: 'herdr', capability: 'pane-labeling', status: 'present', command: 'fgos-herdr-probe' },
  ]);
  assert.equal(toolProvidersOf(cfg, { capability: 'pane-labeling', pathEnv: pathWith('another-tool') })[0].status, 'missing');
  assert.equal(toolProvidersOf(cfg, { capability: 'pane-labeling', pathEnv: '' })[0].status, 'missing');
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

test('toolProvidersOf reports unknown for a tool with nothing to probe', () => {
  const cfg = {
    executors: {
      bare: { kind: 'tool', for: ['x'] },
      noTarget: { kind: 'tool', for: ['x'], invocations: [{ via: 'mcp', command: 'mcp:t' }] },
      other: { kind: 'tool', for: ['x'], invocations: [{ via: 'herdr-spawn' }] },
    },
  };
  assert.deepEqual(toolProvidersOf(cfg, { capability: 'x' }).map((p) => [p.executorId, p.status]), [['bare', 'unknown'], ['noTarget', 'unknown'], ['other', 'unknown']]);
});

test('toolProvidersOf takes mcpTool from the mcp invocation and command from the cli invocation', () => {
  const cfg = {
    executors: {
      both: {
        kind: 'tool',
        for: ['impact-analysis'],
        invocations: [
          { via: 'cli', command: 'impact-cli' },
          { via: 'mcp', command: 'mcp:impact', tools: { 'Impact Analysis': 'mcp__impact__run', other: 'mcp__impact__other' } },
        ],
      },
    },
  };
  const [provider] = toolProvidersOf(cfg, { capability: 'impact-analysis', pathEnv: pathWith('impact-cli') });
  assert.equal(provider.mcpTool, 'mcp__impact__run');
  assert.equal(provider.command, 'impact-cli');
  assert.equal(provider.status, 'present');
});

test('toolProvidersOf lists providers in the config order', () => {
  const cfg = { executors: { second: { kind: 'tool', for: ['x'] }, first: { kind: 'tool', for: ['x'] } } };
  assert.deepEqual(toolProvidersOf(cfg, { capability: 'x' }).map((p) => p.executorId), ['second', 'first']);
});

test('toolProvidersOf without a capability lists every tool executor once per capability it serves', () => {
  const cfg = {
    executors: {
      multi: { kind: 'tool', for: ['a', 'b', 'A'] },
      single: { kind: 'tool', for: ['c'] },
      agent: { kind: 'agent', for: ['d'] },
      none: { kind: 'tool' },
    },
  };
  assert.deepEqual(toolProvidersOf(cfg).map((p) => [p.executorId, p.capability]), [['multi', 'a'], ['multi', 'b'], ['single', 'c']]);
});

test('toolProvidersOf answers [] for a config with no executors', () => {
  assert.deepEqual(toolProvidersOf({}, { capability: 'x' }), []);
  assert.deepEqual(toolProvidersOf(undefined), []);
});
