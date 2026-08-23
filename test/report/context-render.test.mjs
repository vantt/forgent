// test/report/context-render.test.mjs — tsk-1lv-3 (D3): CONTEXT.md's
// "## Locked decisions" table becomes a RENDER from state.decisions,
// closing the gap tsk-1ud left. Split across the pure transform
// (decisionDIdAndText/renderLockedDecisionsTable), the pure splice
// (replaceLockedDecisionsSection, src/intake/plan.mjs), and the CLI verb
// wiring (`fgos context-render <id>`) that ties them to a real file.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { decisionDIdAndText, renderLockedDecisionsTable } from '../../src/report/context-render.mjs';
import { replaceLockedDecisionsSection } from '../../src/intake/plan.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function tmpRepoRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-context-render-'));
}

function run(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

function initCwd() {
  const cwd = tmpRepoRoot();
  assert.equal(run(cwd, ['init']).status, 0);
  return cwd;
}

// --- decisionDIdAndText (pure) ---

test('decisionDIdAndText: splits a "D<n>: <summary>" convention string', () => {
  assert.deepEqual(decisionDIdAndText('D1: locked something real'), { dId: 'D1', rest: 'locked something real' });
  assert.deepEqual(decisionDIdAndText('D14: sửa phạm vi D6/D8'), { dId: 'D14', rest: 'sửa phạm vi D6/D8' });
});

test('decisionDIdAndText: text with no D-ID prefix renders with a null dId, text preserved verbatim', () => {
  assert.deepEqual(decisionDIdAndText('no prefix here'), { dId: null, rest: 'no prefix here' });
});

test('decisionDIdAndText: tolerates non-string input (empty rest, null dId), never throws', () => {
  assert.deepEqual(decisionDIdAndText(undefined), { dId: null, rest: '' });
  assert.deepEqual(decisionDIdAndText(null), { dId: null, rest: '' });
});

// --- renderLockedDecisionsTable (pure) ---

test('renderLockedDecisionsTable: empty input renders a header-only table (never a bare empty string)', () => {
  const md = renderLockedDecisionsTable([]);
  assert.equal(md, '| D-ID | Quyết định |\n|---|---|\n');
});

test('renderLockedDecisionsTable: renders one row per real decision, D-ID split from text', () => {
  const md = renderLockedDecisionsTable([
    { text: 'D1: locked something real', kind: 'design' },
    { text: 'D2: locked something else', kind: 'design' },
  ]);
  assert.equal(md, '| D-ID | Quyết định |\n|---|---|\n| D1 | locked something real |\n| D2 | locked something else |\n');
});

test('renderLockedDecisionsTable: excludes kind:engine bookkeeping sharing the same item id', () => {
  const md = renderLockedDecisionsTable([
    { text: 'D1: real locked decision', kind: 'design' },
    { text: 'decompose verdict: need-human', kind: 'engine', source: 'resolvePlan' },
  ]);
  assert.equal(md, '| D-ID | Quyết định |\n|---|---|\n| D1 | real locked decision |\n');
});

test('renderLockedDecisionsTable: escapes a pipe in decision text', () => {
  const md = renderLockedDecisionsTable([{ text: 'D1: uses a | pipe', kind: 'design' }]);
  assert.match(md, /uses a \\\| pipe/);
});

// --- replaceLockedDecisionsSection (pure, src/intake/plan.mjs) ---

test('replaceLockedDecisionsSection: replaces the table content, preserves every other section byte-for-byte', () => {
  const context = [
    '# CONTEXT: Foo',
    '',
    '## Feature boundary',
    '',
    'blah blah',
    '',
    '## Locked decisions',
    '',
    '| D-ID | Quyết định |',
    '|---|---|',
    '| D1 | old hand-typed row |',
    '',
    '## Pinned terms',
    '',
    '- term',
    '',
  ].join('\n');
  const table = '| D-ID | Quyết định |\n|---|---|\n| D1 | new rendered row |\n';
  const out = replaceLockedDecisionsSection(context, table);
  assert.match(out, /## Feature boundary\n\nblah blah/);
  assert.match(out, /new rendered row/);
  assert.doesNotMatch(out, /old hand-typed row/);
  assert.match(out, /## Pinned terms\n\n- term/);
});

test('replaceLockedDecisionsSection: idempotent -- re-rendering the same table twice produces byte-identical output', () => {
  const context = ['# CONTEXT: Foo', '', '## Locked decisions', '', '| D-ID | Quyết định |', '|---|---|', '| D1 | x |', '', '## Pinned terms', '', '- term', ''].join('\n');
  const table = '| D-ID | Quyết định |\n|---|---|\n| D1 | x |\n';
  const once = replaceLockedDecisionsSection(context, table);
  const twice = replaceLockedDecisionsSection(once, table);
  assert.equal(once, twice);
});

test('replaceLockedDecisionsSection: works when "## Locked decisions" is the last section (no trailing heading)', () => {
  const context = ['# CONTEXT: Foo', '', '## Locked decisions', '', '| D-ID | Quyết định |', '|---|---|', '| D1 | old |', ''].join('\n');
  const table = '| D-ID | Quyết định |\n|---|---|\n| D1 | new |\n';
  const out = replaceLockedDecisionsSection(context, table);
  assert.match(out, /new/);
  assert.doesNotMatch(out, /\| D1 \| old \|/);
});

test('replaceLockedDecisionsSection: throws a clear error when the heading is missing', () => {
  assert.throws(
    () => replaceLockedDecisionsSection('# CONTEXT: Foo\n\nno such heading here\n', 'table'),
    /no "## Locked decisions" heading found/,
  );
});

// --- CLI: `fgos context-render <id>` ---

function writeContextSkeleton(cwd, docsRef) {
  const contextPath = path.join(cwd, docsRef, 'CONTEXT.md');
  fs.mkdirSync(path.dirname(contextPath), { recursive: true });
  fs.writeFileSync(
    contextPath,
    ['# CONTEXT: Foo', '', '## Feature boundary', '', 'boundary text', '', '## Locked decisions', '', '## Pinned terms', '', '- term', ''].join('\n'),
  );
  return contextPath;
}

test('CLI: context-render refuses (validation, exit 4) when CONTEXT.md does not exist yet', () => {
  const cwd = initCwd();
  assert.equal(
    run(cwd, ['add', '--id', 'host-item', '--title', 'Host', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--description', 'fixture']).status,
    0,
  );
  const result = run(cwd, ['context-render', 'host-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /CONTEXT\.md does not exist/);
});

test('CLI: context-render renders locked D-IDs into an existing CONTEXT.md, in place', () => {
  const cwd = initCwd();
  assert.equal(
    run(cwd, ['add', '--id', 'host-item', '--title', 'Host', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--description', 'fixture']).status,
    0,
  );
  const docsRef = 'docs/history/host-item';
  writeContextSkeleton(cwd, docsRef);
  assert.equal(
    run(cwd, ['decision', '--id', 'host-item', '--text', 'D1: locked something real', '--rationale', 'r', '--relation', 'none']).status,
    0,
  );

  const result = run(cwd, ['context-render', 'host-item']);
  assert.equal(result.status, 0);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.changed, true);
  assert.equal(data.rowCount, 1);

  const content = fs.readFileSync(path.join(cwd, docsRef, 'CONTEXT.md'), 'utf8');
  assert.match(content, /\| D1 \| locked something real \|/);
  assert.match(content, /## Feature boundary\n\nboundary text/, 'other sections untouched');
  assert.match(content, /## Pinned terms\n\n- term/, 'other sections untouched');
});

test('CLI: context-render uses docsRef when the item declares one, not the default docs/history/<id>', () => {
  const cwd = initCwd();
  assert.equal(
    run(cwd, ['add', '--id', 'host-item', '--title', 'Host', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--description', 'fixture', '--docs-ref', 'docs/history/custom-feature']).status,
    0,
  );
  writeContextSkeleton(cwd, 'docs/history/custom-feature');
  assert.equal(
    run(cwd, ['decision', '--id', 'host-item', '--text', 'D1: locked something real', '--rationale', 'r', '--relation', 'none']).status,
    0,
  );

  const result = run(cwd, ['context-render', 'host-item']);
  assert.equal(result.status, 0);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.path, 'docs/history/custom-feature/CONTEXT.md');
});

test('CLI: context-render is idempotent -- a second call with no new decisions reports changed:false', () => {
  const cwd = initCwd();
  assert.equal(
    run(cwd, ['add', '--id', 'host-item', '--title', 'Host', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--description', 'fixture']).status,
    0,
  );
  const docsRef = 'docs/history/host-item';
  writeContextSkeleton(cwd, docsRef);
  assert.equal(
    run(cwd, ['decision', '--id', 'host-item', '--text', 'D1: locked something real', '--rationale', 'r', '--relation', 'none']).status,
    0,
  );
  assert.equal(run(cwd, ['context-render', 'host-item']).status, 0);

  const result = run(cwd, ['context-render', 'host-item']);
  assert.equal(result.status, 0);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.changed, false);
});

test('CLI: context-render on an item with ZERO logged decisions is idempotent across repeated calls -- B2 tsk-1lv round-2 regression (the header+separator this verb itself writes must never count as a "real row" the F6 guard refuses to overwrite)', () => {
  const cwd = initCwd();
  assert.equal(
    run(cwd, ['add', '--id', 'host-item', '--title', 'Host', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--description', 'fixture']).status,
    0,
  );
  const docsRef = 'docs/history/host-item';
  writeContextSkeleton(cwd, docsRef);

  const first = run(cwd, ['context-render', 'host-item']);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(JSON.parse(first.stdout).data.changed, true);

  const second = run(cwd, ['context-render', 'host-item']);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(JSON.parse(second.stdout).data.changed, false);

  const third = run(cwd, ['context-render', 'host-item']);
  assert.equal(third.status, 0, third.stderr);
});

test('CLI: context-render excludes another item\'s decisions -- only rows scoped to THIS id appear', () => {
  const cwd = initCwd();
  assert.equal(
    run(cwd, ['add', '--id', 'host-item', '--title', 'Host', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--description', 'fixture']).status,
    0,
  );
  assert.equal(
    run(cwd, ['add', '--id', 'other-item', '--title', 'Other', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--description', 'fixture']).status,
    0,
  );
  writeContextSkeleton(cwd, 'docs/history/host-item');
  assert.equal(
    run(cwd, ['decision', '--id', 'host-item', '--text', 'D1: host decision', '--rationale', 'r', '--relation', 'none']).status,
    0,
  );
  assert.equal(
    run(cwd, ['decision', '--id', 'other-item', '--text', 'D1: unrelated decision', '--rationale', 'r', '--relation', 'none']).status,
    0,
  );

  const result = run(cwd, ['context-render', 'host-item']);
  assert.equal(result.status, 0);
  const content = fs.readFileSync(path.join(cwd, 'docs/history/host-item/CONTEXT.md'), 'utf8');
  assert.match(content, /host decision/);
  assert.doesNotMatch(content, /unrelated decision/);
});

test('CLI: context-render refuses (validation, exit 4) rather than blank a hand-typed table with no matching state.decisions yet -- F6 tsk-1lv regression', () => {
  const cwd = initCwd();
  assert.equal(
    run(cwd, ['add', '--id', 'host-item', '--title', 'Host', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--description', 'fixture']).status,
    0,
  );
  const docsRef = 'docs/history/host-item';
  const contextPath = path.join(cwd, docsRef, 'CONTEXT.md');
  fs.mkdirSync(path.dirname(contextPath), { recursive: true });
  fs.writeFileSync(
    contextPath,
    [
      '# CONTEXT: Foo', '', '## Feature boundary', '', 'boundary text', '',
      '## Locked decisions', '',
      '| D-ID | Quyết định |', '|---|---|',
      '| D1 | a pre-tsk-1lv-3 hand-typed row, never logged via fgos decision |',
      '', '## Pinned terms', '', '- term', '',
    ].join('\n'),
  );

  const result = run(cwd, ['context-render', 'host-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /refusing to render an empty table over an existing/);

  const after = fs.readFileSync(contextPath, 'utf8');
  assert.match(after, /a pre-tsk-1lv-3 hand-typed row, never logged via fgos decision/, 'the hand-typed row must survive the refused write untouched');
});

test('CLI: context-render finds CONTEXT.md via resolveContentRoot when the item declares a docsRef that only exists relative to process.cwd(), not --dir -- F5 tsk-1lv regression', () => {
  const stateRoot = initCwd();
  assert.equal(
    run(stateRoot, ['add', '--id', 'host-item', '--title', 'Host', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--description', 'fixture']).status,
    0,
  );
  // Simulate the worktree-workflow case resolveContentRoot exists for
  // (tsk-1ni D1): CONTEXT.md lives under a SEPARATE directory (standing in
  // for an item's own fgw/<id> worktree), not under the state root passed
  // via --dir. Running WITH cwd set to that separate directory is the
  // resolveContentRoot candidate #1 (process.cwd()) this test exercises.
  const contentRoot = tmpRepoRoot();
  const docsRef = 'docs/history/host-item';
  writeContextSkeleton(contentRoot, docsRef);
  assert.equal(
    run(stateRoot, ['decision', '--id', 'host-item', '--text', 'D1: locked from a separate content root', '--rationale', 'r', '--relation', 'none']).status,
    0,
  );

  const result = spawnSync(process.execPath, [FGOS, 'context-render', 'host-item', '--dir', stateRoot], { cwd: contentRoot, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.changed, true);

  const content = fs.readFileSync(path.join(contentRoot, docsRef, 'CONTEXT.md'), 'utf8');
  assert.match(content, /\| D1 \| locked from a separate content root \|/);
  assert.ok(!fs.existsSync(path.join(stateRoot, docsRef)), 'must never fall back to writing a stale copy at the state root when the real content root resolves elsewhere');
});
