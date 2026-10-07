import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_ALIAS_TABLE_PATH, validateAliasTable, resolveAlias, runCli } from '../../scripts/doc-alias-resolver.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function entry(overrides = {}) {
  return {
    aliasId: 'runner-spec',
    fromPath: 'docs/specs/runner.md',
    toOwner: 'docs/platform/runner/README.md',
    toAnchor: null,
    kind: 'moved',
    evidenceRef: null,
    immutableRefs: ['D-ADR0030'],
    recordedAt: '2026-10-06',
    ...overrides,
  };
}
const tableOf = (...entries) => ({ version: 1, description: 'fixture', entries });
const types = (table, opts) => validateAliasTable(table, opts).map((f) => f.type);

test('the committed table is empty and validates clean', () => {
  const table = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, DEFAULT_ALIAS_TABLE_PATH), 'utf8'));
  assert.deepEqual(table.entries, []);
  assert.deepEqual(validateAliasTable(table), []);
});

test('a well-formed table validates clean, including a retirement with evidence', () => {
  const retired = entry({ aliasId: 'old-note', fromPath: 'docs/old-note.md', toOwner: null, kind: 'retired-with-evidence', evidenceRef: 'abc1234' });
  assert.deepEqual(validateAliasTable(tableOf(entry(), retired)), []);
});

test('rejects a duplicate fromPath', () => {
  assert.ok(types(tableOf(entry(), entry({ aliasId: 'runner-spec-2' }))).includes('duplicate-from-path'));
});

test('rejects an owner outside docs/platform unless the alias is a retirement', () => {
  assert.ok(types(tableOf(entry({ toOwner: 'docs/specs/other.md' }))).includes('owner-outside-platform'));
  const retired = entry({ kind: 'retired-with-evidence', toOwner: null, evidenceRef: 'plans/x/evidence.md' });
  assert.ok(!types(tableOf(retired)).includes('owner-outside-platform'));
  assert.ok(types(tableOf(entry({ kind: 'retired-with-evidence', toOwner: null }))).includes('missing-evidence'));
});

test('rejects an alias chain and reports a loop as a cycle', () => {
  const a = entry({ aliasId: 'a', fromPath: 'docs/a.md', toOwner: 'docs/platform/b.md' });
  const b = entry({ aliasId: 'b', fromPath: 'docs/platform/b.md', toOwner: 'docs/platform/c.md' });
  assert.deepEqual(types(tableOf(a, b)), ['alias-chain']);
  const loopA = entry({ aliasId: 'a', fromPath: 'docs/platform/a.md', toOwner: 'docs/platform/b.md' });
  const loopB = entry({ aliasId: 'b', fromPath: 'docs/platform/b.md', toOwner: 'docs/platform/a.md' });
  assert.deepEqual(types(tableOf(loopA, loopB)), ['alias-cycle', 'alias-cycle']);
  const self = entry({ fromPath: 'docs/platform/a.md', toOwner: 'docs/platform/a.md' });
  assert.deepEqual(types(tableOf(self)), ['alias-cycle']);
});

test('rejects an anchor without an owner', () => {
  assert.ok(types(tableOf(entry({ toOwner: null, toAnchor: 'intro' }))).includes('anchor-without-owner'));
});

test('rejects a bad kind and schema violations', () => {
  assert.ok(types(tableOf(entry({ kind: 'copied' }))).includes('bad-kind'));
  assert.ok(types(tableOf(entry({ recordedAt: 'yesterday' }))).includes('schema'));
  const { aliasId, ...missing } = entry();
  assert.ok(types(tableOf(missing)).includes('schema'));
  assert.ok(types(tableOf(entry({ fromPath: '/abs/path.md' }))).includes('schema'));
  assert.ok(types({ version: 2, description: 'x', entries: [] }).includes('wrong-version'));
});

test('checks owner existence against a repo root when given', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'alias-owner-'));
  try {
    assert.ok(types(tableOf(entry()), { repoRoot: root }).includes('owner-missing'));
    fs.mkdirSync(path.join(root, 'docs/platform/runner'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs/platform/runner/README.md'), '# R\n');
    assert.deepEqual(validateAliasTable(tableOf(entry()), { repoRoot: root }), []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('resolves an exact path, a path with anchor, and reports an unknown ref', () => {
  const table = tableOf(
    entry(),
    entry({ aliasId: 'runner-merge', fromPath: 'docs/specs/runner.md#merge', toOwner: 'docs/platform/runner/merge.md', toAnchor: 'overview', kind: 'split' }),
    entry({ aliasId: 'old-note', fromPath: 'docs/old-note.md', toOwner: null, kind: 'retired-with-evidence', evidenceRef: 'abc1234' }),
  );
  assert.deepEqual(resolveAlias(table, 'docs/specs/runner.md'), { resolved: true, toOwner: 'docs/platform/runner/README.md', toAnchor: null, kind: 'moved', via: 'runner-spec' });
  assert.equal(resolveAlias(table, 'docs/specs/runner.md#merge').via, 'runner-merge');
  assert.equal(resolveAlias(table, 'docs/specs/runner.md#other').via, 'runner-spec');
  assert.equal(resolveAlias(table, 'docs/specs/runner.md#other').precision, 'bare-path');
  assert.deepEqual(resolveAlias(table, 'docs/specs/*.md'), { resolved: false, reason: 'no-alias' });
  assert.deepEqual(resolveAlias(table, 'docs/specs/unknown.md'), { resolved: false, reason: 'no-alias' });
  const retired = resolveAlias(table, 'docs/old-note.md');
  assert.equal(retired.toOwner, null);
  assert.equal(retired.evidenceRef, 'abc1234');
  const anchorOnly = tableOf(entry({ fromPath: 'docs/specs/runner.md#merge' }));
  assert.deepEqual(resolveAlias(anchorOnly, 'docs/specs/runner.md'), { resolved: false, reason: 'no-alias' });
});

test('runCli validates, resolves and sets the exit code', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'alias-cli-'));
  const logs = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...a) => logs.push(a.join(' '));
  console.error = (...a) => logs.push(a.join(' '));
  try {
    const good = path.join(dir, 'good.json');
    const bad = path.join(dir, 'bad.json');
    fs.mkdirSync(path.join(dir, 'docs/platform/runner'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'docs/platform/runner/README.md'), '# R\n');
    const constitutionArgs = ['--constitution', path.join(REPO_ROOT, 'plans/260925-documentation-authority-unification/minimum-constitution.json')];
    fs.writeFileSync(good, JSON.stringify(tableOf(entry())));
    fs.writeFileSync(bad, JSON.stringify(tableOf(entry(), entry({ aliasId: 'dup' }))));
    assert.equal(runCli(['--table', good, ...constitutionArgs], dir), 0);
    assert.equal(runCli(['--table', good, ...constitutionArgs, '--resolve', 'docs/specs/runner.md'], dir), 0);
    assert.ok(logs.some((l) => l.includes('docs/platform/runner/README.md')));
    assert.equal(runCli(['--table', good, ...constitutionArgs, '--resolve', 'docs/nope.md'], dir), 1);
    assert.equal(runCli(['--table', bad, ...constitutionArgs], dir), 1);
    fs.writeFileSync(path.join(dir, 'ownerless.json'), JSON.stringify(tableOf(entry({ toOwner: 'docs/platform/nowhere/README.md' }))));
    assert.equal(runCli(['--table', path.join(dir, 'ownerless.json'), ...constitutionArgs], dir), 1, 'the CLI checks that owners exist');
    logs.length = 0;
    assert.equal(runCli(['--table', good, ...constitutionArgs, '--json', '--resolve', 'docs/specs/runner.md'], dir), 0);
    assert.equal(JSON.parse(logs.join('\n')).resolution.via, 'runner-spec');
    assert.equal(runCli(['--table', path.join(dir, 'missing.json'), ...constitutionArgs], dir), 1);
  } finally {
    console.log = origLog;
    console.error = origErr;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a split alias must name the old anchor, and a chain through an anchored alias is found', () => {
  assert.ok(types(tableOf(entry({ kind: 'split' }))).includes('split-without-anchor'));
  const parts = [entry({ aliasId: 'one', kind: 'split', fromPath: 'docs/specs/runner.md#one', toOwner: 'docs/platform/a/README.md' }), entry({ aliasId: 'two', kind: 'split', fromPath: 'docs/specs/runner.md#two', toOwner: 'docs/platform/b/README.md' })];
  assert.deepEqual(types(tableOf(...parts)), []);
  const hop = entry({ aliasId: 'hop', fromPath: 'docs/platform/a/README.md#intro', toOwner: 'docs/platform/c/README.md' });
  const chained = entry({ aliasId: 'one', fromPath: 'docs/specs/runner.md#one', toOwner: 'docs/platform/a/README.md', toAnchor: 'intro' });
  assert.deepEqual(types(tableOf(chained, hop)), ['alias-chain']);
  const unrelated = entry({ aliasId: 'other', fromPath: 'docs/platform/a/README.md#other', toOwner: 'docs/platform/c/README.md' });
  assert.deepEqual(types(tableOf(chained, unrelated)), [], 'an alias on a different anchor of the owner is not a chain');
});

test('toAnchor must be a heading of the owner document', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'alias-anchor-'));
  try {
    fs.mkdirSync(path.join(root, 'docs/platform/runner'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs/platform/runner/README.md'), '# Runner\n\n## Dispatch Lifecycle\n\nBody text that is long enough to count as a block.\n');
    assert.deepEqual(types(tableOf(entry({ toAnchor: 'dispatch-lifecycle' })), { repoRoot: root }), []);
    assert.deepEqual(types(tableOf(entry({ toAnchor: 'nonexistent-anchor' })), { repoRoot: root }), ['anchor-missing']);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

const OLD_DOC = ['# Runner', '', 'Intro paragraph that is long enough to be a unit.', '', '## Merge & Rules', '', 'Merge paragraph that is long enough to be a unit.', '', '### Deep part', '', 'Deep paragraph that is long enough to be a unit.', ''].join('\n');

function withOldDocument(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'alias-old-'));
  try {
    fs.mkdirSync(path.join(root, 'docs/specs'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs/specs/runner.md'), OLD_DOC);
    fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const sectionTable = () => tableOf(
  entry({ aliasId: 'runner-merge', fromPath: 'docs/specs/runner.md#merge-rules', toOwner: 'docs/platform/runner/merge.md', toAnchor: null, kind: 'split' }),
  entry({ aliasId: 'runner-bare', fromPath: 'docs/specs/runner.md', toOwner: 'docs/platform/runner/README.md', kind: 'redirected' }),
);

test('a line reference maps through the old document to the section alias and says it is approximate', () => {
  withOldDocument((root) => {
    const table = sectionTable();
    const deep = resolveAlias(table, 'docs/specs/runner.md:11', { repoRoot: root });
    assert.deepEqual([deep.resolved, deep.via, deep.precision, deep.viaAnchor], [true, 'runner-merge', 'line-to-section', 'merge-rules']);
    assert.equal(resolveAlias(table, 'docs/specs/runner.md:7-9', { repoRoot: root }).via, 'runner-merge');
    assert.equal(resolveAlias(table, 'docs/specs/runner.md#L7', { repoRoot: root }).via, 'runner-merge');
    assert.equal(resolveAlias(table, 'docs/specs/runner.md:3', { repoRoot: root }).via, 'runner-bare');
    assert.deepEqual(resolveAlias(table, 'docs/specs/runner.md:99', { repoRoot: root }), { resolved: false, reason: 'line-out-of-range' });
    assert.deepEqual(resolveAlias(table, 'docs/specs/runner.md:7'), { resolved: false, reason: 'line-reference-needs-old-document' });
  });
});

test('an unknown anchor is unresolved when the old document is readable, GitHub spelling and deeper anchors resolve', () => {
  withOldDocument((root) => {
    const table = sectionTable();
    assert.deepEqual(resolveAlias(table, 'docs/specs/runner.md#no-such-heading', { repoRoot: root }), { resolved: false, reason: 'unknown-anchor' });
    assert.equal(resolveAlias(table, 'docs/specs/runner.md#merge-rules', { repoRoot: root }).via, 'runner-merge');
    assert.equal(resolveAlias(table, 'docs/specs/runner.md#merge--rules', { repoRoot: root }).via, 'runner-merge');
    const deeper = resolveAlias(table, 'docs/specs/runner.md#deep-part', { repoRoot: root });
    assert.deepEqual([deeper.via, deeper.precision, deeper.viaAnchor], ['runner-merge', 'ancestor-section', 'merge-rules']);
    assert.equal(resolveAlias(table, 'docs/specs/runner.md#runner', { repoRoot: root }).via, 'runner-bare');
  });
});

test('a relative link is normalized against the consumer and a missing consumer is explicit', () => {
  const table = sectionTable();
  assert.equal(resolveAlias(table, '../specs/runner.md', { consumerPath: 'docs/history/note.md' }).via, 'runner-bare');
  assert.deepEqual(resolveAlias(table, '../specs/runner.md'), { resolved: false, reason: 'relative-reference-needs-consumer' });
  assert.deepEqual(resolveAlias(table, '../../../x.md', { consumerPath: 'docs/a.md' }), { resolved: false, reason: 'relative-reference-leaves-repository' });
});

test('fromPath anchors are checked against the old document when it exists', () => {
  withOldDocument((root) => {
    const owner = path.join(root, 'docs/platform/runner');
    fs.mkdirSync(owner, { recursive: true });
    fs.writeFileSync(path.join(owner, 'merge.md'), '# M\n');
    fs.writeFileSync(path.join(owner, 'README.md'), '# R\n');
    assert.deepEqual(validateAliasTable(sectionTable(), { repoRoot: root }), []);
    const bad = tableOf(entry({ aliasId: 'bad', fromPath: 'docs/specs/runner.md#nope', toOwner: 'docs/platform/runner/merge.md', kind: 'split' }));
    assert.deepEqual(types(bad, { repoRoot: root }), ['from-anchor-missing']);
    const gone = tableOf(entry({ aliasId: 'gone', fromPath: 'docs/specs/retired.md#x', toOwner: 'docs/platform/runner/merge.md', kind: 'split' }));
    assert.deepEqual(types(gone, { repoRoot: root }), []);
  });
});

test('references outside the repository, inverted ranges and a fixed revision are handled explicitly', () => {
  withOldDocument((root) => {
    const table = sectionTable();
    for (const ref of ['/etc/x.md', 'docs/../../x.md', 'docs//specs/runner.md']) assert.deepEqual(resolveAlias(table, ref, { repoRoot: root }), { resolved: false, reason: 'invalid-path' }, ref);
    assert.deepEqual(resolveAlias(table, 'docs/specs/runner.md:9-3', { repoRoot: root }), { resolved: false, reason: 'invalid-line-range' });
  });
});

test('the CLI fails an approximate resolution under --exact and names the precision otherwise', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'alias-exact-'));
  const log = console.log;
  const err = console.error;
  console.log = () => {};
  console.error = () => {};
  try {
    fs.mkdirSync(path.join(dir, 'docs/specs'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'docs/platform/runner'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'docs/specs/runner.md'), OLD_DOC);
    fs.writeFileSync(path.join(dir, 'docs/platform/runner/spec.md'), '# S\n');
    fs.writeFileSync(path.join(dir, 'docs/platform/runner/README.md'), '# R\n');
    fs.writeFileSync(path.join(dir, 'table.json'), JSON.stringify(tableOf(entry({ aliasId: 'runner-merge', fromPath: 'docs/specs/runner.md#merge-rules', toOwner: 'docs/platform/runner/spec.md', kind: 'split' }), entry({ aliasId: 'runner-bare', fromPath: 'docs/specs/runner.md', kind: 'redirected' }))));
    const constitution = ['--constitution', path.join(REPO_ROOT, 'plans/260925-documentation-authority-unification/minimum-constitution.json')];
    const base = ['--table', path.join(dir, 'table.json'), ...constitution];
    assert.equal(runCli([...base, '--resolve', 'docs/specs/runner.md:11'], dir), 0);
    assert.equal(runCli([...base, '--exact', '--resolve', 'docs/specs/runner.md:11'], dir), 1);
    assert.equal(runCli([...base, '--exact', '--resolve', 'docs/specs/runner.md#merge-rules'], dir), 0);
  } finally {
    console.log = log;
    console.error = err;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
