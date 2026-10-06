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
  assert.deepEqual(resolveAlias(table, 'docs/specs/*.md'), { resolved: false });
  assert.deepEqual(resolveAlias(table, 'docs/specs/unknown.md'), { resolved: false });
  const retired = resolveAlias(table, 'docs/old-note.md');
  assert.equal(retired.toOwner, null);
  assert.equal(retired.evidenceRef, 'abc1234');
  const anchorOnly = tableOf(entry({ fromPath: 'docs/specs/runner.md#merge' }));
  assert.deepEqual(resolveAlias(anchorOnly, 'docs/specs/runner.md'), { resolved: false });
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
