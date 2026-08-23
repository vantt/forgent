// test/report/decision-index.test.mjs — tsk-1lv-2 (D4): docs/decisions/
// index.md is a generated projection of state.decisions' scope-carrying
// (platform/repo-wide) records -- never hand-edited, mirrors
// enduser-index-generate.mjs's own generate+drift shape. Split across the
// pure transform (buildDecisionIndexMarkdown), the compute-without-write
// half (computeDecisionIndex, shared by the write path and --check), and
// the CLI verb wiring (`fgos decision-index[--check]`).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  buildDecisionIndexMarkdown,
  computeDecisionIndex,
  generateDecisionIndex,
  indexPathFor,
} from '../../src/report/decision-index.mjs';
import { addDecision } from '../../src/state/store.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function tmpRepoRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-decision-index-'));
}

function run(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

function initCwd() {
  const cwd = tmpRepoRoot();
  assert.equal(run(cwd, ['init']).status, 0);
  return cwd;
}

// --- buildDecisionIndexMarkdown (pure) ---

test('buildDecisionIndexMarkdown: empty input renders the "no decisions yet" placeholder, never a bare empty table', () => {
  const md = buildDecisionIndexMarkdown([]);
  assert.match(md, /No platform\/repo-wide decisions recorded yet/);
  assert.doesNotMatch(md, /\| Scope \|/);
});

test('buildDecisionIndexMarkdown: excludes a record with no scope field (item-scoped D-IDs stay out)', () => {
  const md = buildDecisionIndexMarkdown([{ text: 'D1: item decision', rationale: 'r', id: 'item-a', ts: '2026-01-01T00:00:00.000Z' }]);
  assert.match(md, /No platform\/repo-wide decisions recorded yet/);
});

test('buildDecisionIndexMarkdown: excludes kind:engine bookkeeping even if it somehow carries a scope', () => {
  const md = buildDecisionIndexMarkdown([{ text: 'engine bookkeeping', rationale: 'r', kind: 'engine', scope: 'repo', ts: '2026-01-01T00:00:00.000Z' }]);
  assert.match(md, /No platform\/repo-wide decisions recorded yet/);
});

test('buildDecisionIndexMarkdown: includes a scope-carrying record as a table row', () => {
  const md = buildDecisionIndexMarkdown([
    { text: 'D1: repo-wide naming convention', rationale: 'because reasons', scope: 'repo', ts: '2026-01-01T00:00:00.000Z' },
  ]);
  assert.match(md, /\| repo \| D1: repo-wide naming convention \| because reasons \| 2026-01-01T00:00:00\.000Z \|/);
});

test('buildDecisionIndexMarkdown: sorted by scope then chronologically, deterministic across repeat calls', () => {
  const decisions = [
    { text: 'B second', rationale: 'r', scope: 'runner', ts: '2026-01-02T00:00:00.000Z' },
    { text: 'A first', rationale: 'r', scope: 'cli', ts: '2026-01-01T00:00:00.000Z' },
    { text: 'C same scope, earlier', rationale: 'r', scope: 'runner', ts: '2026-01-01T00:00:00.000Z' },
  ];
  const md1 = buildDecisionIndexMarkdown(decisions);
  const md2 = buildDecisionIndexMarkdown([...decisions].reverse());
  assert.equal(md1, md2, 'output must not depend on input order');
  const cliIdx = md1.indexOf('| cli |');
  const runnerCIdx = md1.indexOf('C same scope, earlier');
  const runnerBIdx = md1.indexOf('B second');
  assert.ok(cliIdx < runnerCIdx, 'cli scope sorts before runner scope');
  assert.ok(runnerCIdx < runnerBIdx, 'within the same scope, earlier ts sorts first');
});

test('buildDecisionIndexMarkdown: escapes a pipe and collapses embedded newlines in cell content', () => {
  const md = buildDecisionIndexMarkdown([
    { text: 'uses a | pipe', rationale: "line one\nline two", scope: 'repo', ts: '2026-01-01T00:00:00.000Z' },
  ]);
  assert.match(md, /uses a \\\| pipe/);
  assert.match(md, /line one line two/);
});

// --- computeDecisionIndex / generateDecisionIndex (I/O, in-process) ---

test('computeDecisionIndex: reports changed:true against a nonexistent index file, and returns the would-be content without writing it', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-decision-index-io-'));
  const fgosDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  addDecision(fgosDir, { text: 'D1: repo-wide thing', rationale: 'r', scope: 'repo' });

  const { changed, nextContent } = computeDecisionIndex(repoRoot, fgosDir);
  assert.equal(changed, true);
  assert.match(nextContent, /D1: repo-wide thing/);
  assert.equal(fs.existsSync(indexPathFor(repoRoot)), false, 'compute never writes');
});

test('generateDecisionIndex: writes the file on first call, then reports changed:false and does not rewrite on a second call with nothing new', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-decision-index-io-'));
  const fgosDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  addDecision(fgosDir, { text: 'D1: repo-wide thing', rationale: 'r', scope: 'repo' });

  const first = generateDecisionIndex(repoRoot, fgosDir);
  assert.equal(first.changed, true);
  assert.equal(fs.existsSync(indexPathFor(repoRoot)), true);
  const mtimeAfterFirst = fs.statSync(indexPathFor(repoRoot)).mtimeMs;

  const second = generateDecisionIndex(repoRoot, fgosDir);
  assert.equal(second.changed, false);
  assert.equal(fs.statSync(indexPathFor(repoRoot)).mtimeMs, mtimeAfterFirst, 'unchanged content must not rewrite the file');
});

test('generateDecisionIndex: refuses to overwrite an index with real rows when the freshly-computed content has none -- F12 tsk-1lv regression (a store with no decisions read, e.g. a worktree missing .fgos/ per ADR0020)', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-decision-index-io-'));
  const emptyFgosDir = path.join(repoRoot, '.fgos-nonexistent');
  const populatedFgosDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(populatedFgosDir, { recursive: true });
  addDecision(populatedFgosDir, { text: 'D1: repo-wide thing', rationale: 'r', scope: 'repo' });
  const first = generateDecisionIndex(repoRoot, populatedFgosDir);
  assert.equal(first.changed, true);
  const before = fs.readFileSync(indexPathFor(repoRoot), 'utf8');

  assert.throws(
    () => generateDecisionIndex(repoRoot, emptyFgosDir),
    /refusing to overwrite/,
  );

  const after = fs.readFileSync(indexPathFor(repoRoot), 'utf8');
  assert.equal(after, before, 'the real index must survive the refused write untouched');
});

test('generateDecisionIndex: an empty-to-empty regenerate (nothing was ever recorded) is not a refusal -- there is no real content to lose', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-decision-index-io-'));
  const fgosDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });

  const first = generateDecisionIndex(repoRoot, fgosDir);
  assert.equal(first.changed, true);
  const second = generateDecisionIndex(repoRoot, fgosDir);
  assert.equal(second.changed, false);
});

// --- CLI: `fgos decision-index` / `--check` ---

test('CLI: decision-index generates docs/decisions/index.md from a scope-carrying decision', () => {
  const cwd = initCwd();
  assert.equal(
    run(cwd, ['decision', '--text', 'D1: repo-wide thing', '--rationale', 'r', '--relation', 'none', '--scope', 'repo']).status,
    0,
  );
  const result = run(cwd, ['decision-index']);
  assert.equal(result.status, 0);
  const content = fs.readFileSync(path.join(cwd, 'docs', 'decisions', 'index.md'), 'utf8');
  assert.match(content, /D1: repo-wide thing/);
});

test('CLI: decision-index --check exits 0 and writes nothing when the on-disk index already matches', () => {
  const cwd = initCwd();
  assert.equal(
    run(cwd, ['decision', '--text', 'D1: repo-wide thing', '--rationale', 'r', '--relation', 'none', '--scope', 'repo']).status,
    0,
  );
  assert.equal(run(cwd, ['decision-index']).status, 0);
  const before = fs.readFileSync(path.join(cwd, 'docs', 'decisions', 'index.md'), 'utf8');

  const result = run(cwd, ['decision-index', '--check']);
  assert.equal(result.status, 0);
  const after = fs.readFileSync(path.join(cwd, 'docs', 'decisions', 'index.md'), 'utf8');
  assert.equal(before, after);
});

test('CLI: decision-index --check is refused (validation, exit 4) when the on-disk index is stale (a new scoped decision landed since the last generate)', () => {
  const cwd = initCwd();
  assert.equal(run(cwd, ['decision-index']).status, 0, 'generate once against an empty log -- the placeholder content');
  assert.equal(
    run(cwd, ['decision', '--text', 'D1: repo-wide thing', '--rationale', 'r', '--relation', 'none', '--scope', 'repo']).status,
    0,
  );
  const result = run(cwd, ['decision-index', '--check']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /stale/);
});

test('CLI: decision-index --check never writes even when it refuses', () => {
  const cwd = initCwd();
  assert.equal(run(cwd, ['decision-index']).status, 0);
  const beforeAll = fs.readFileSync(path.join(cwd, 'docs', 'decisions', 'index.md'), 'utf8');
  assert.equal(
    run(cwd, ['decision', '--text', 'D1: repo-wide thing', '--rationale', 'r', '--relation', 'none', '--scope', 'repo']).status,
    0,
  );
  run(cwd, ['decision-index', '--check']);
  const afterRefusal = fs.readFileSync(path.join(cwd, 'docs', 'decisions', 'index.md'), 'utf8');
  assert.equal(beforeAll, afterRefusal, '--check must never write, even when it detects and reports drift');
});
