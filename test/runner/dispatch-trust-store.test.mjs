import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { readTrust, seedTrust, removeTrust, TrustStoreError } from '../../src/runner/dispatch/trust-store.mjs';

// Phase 01 group B. Every test here runs against a FIXTURE store, never the real
// ~/.claude.json -- the module takes the store path as an argument precisely so a
// test can never reach the operator's own file.
//
// The behaviour under test was not invented: a fresh git worktree is a path the
// agent CLI has never seen, so it meets a folder-trust dialog and the dispatch
// stops before doing anything. Seeding that trust is what removes the wall, and
// seeding it WRONGLY would mean fgOS silently vouching for a directory nobody
// vouched for. Hence B1's rule that trust is derived from an already-trusted
// repo root and never invented.

function fixtureStore(contents) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-trust-fixture-'));
  const file = path.join(dir, 'claude.json');
  fs.writeFileSync(file, JSON.stringify(contents, null, 2));
  return { dir, file, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

const trustedRoot = '/home/someone/projects/repo';
function storeWithTrustedRoot(extra = {}) {
  return {
    someUnrelatedKey: true,
    projects: {
      [trustedRoot]: { hasTrustDialogAccepted: true, allowedTools: [] },
      '/home/someone/projects/untrusted': { hasTrustDialogAccepted: false, allowedTools: [] },
      ...extra,
    },
  };
}

test('readTrust reports true, false, and absent as three different answers', () => {
  const f = fixtureStore(storeWithTrustedRoot());
  try {
    assert.equal(readTrust(f.file, trustedRoot), true);
    assert.equal(readTrust(f.file, '/home/someone/projects/untrusted'), false);
    assert.equal(readTrust(f.file, '/never/seen'), null, 'an unseen path is absent, not untrusted');
  } finally { f.cleanup(); }
});

test('B1: seedTrust refuses when the repo root is not itself trusted -- trust is derived, never invented', () => {
  const f = fixtureStore(storeWithTrustedRoot());
  try {
    assert.throws(
      () => seedTrust(f.file, { projectPath: '/tmp/wt-1', repoRoot: '/home/someone/projects/untrusted' }),
      (err) => {
        assert.ok(err instanceof TrustStoreError);
        assert.equal(err.code, 'untrusted-root');
        return true;
      },
    );
    const after = JSON.parse(fs.readFileSync(f.file, 'utf8'));
    assert.equal(after.projects['/tmp/wt-1'], undefined, 'a refused seed must write nothing at all');
  } finally { f.cleanup(); }
});

test('B1: seedTrust refuses a root that is absent from the store, not just one marked false', () => {
  const f = fixtureStore(storeWithTrustedRoot());
  try {
    assert.throws(
      () => seedTrust(f.file, { projectPath: '/tmp/wt-2', repoRoot: '/home/someone/projects/never-seen' }),
      (err) => err instanceof TrustStoreError && err.code === 'untrusted-root',
    );
  } finally { f.cleanup(); }
});

test('B1: seedTrust refuses a relative project path -- an ambiguous key would trust the wrong directory', () => {
  const f = fixtureStore(storeWithTrustedRoot());
  try {
    assert.throws(
      () => seedTrust(f.file, { projectPath: 'relative/worktree', repoRoot: trustedRoot }),
      (err) => err instanceof TrustStoreError && err.code === 'invalid-path',
    );
  } finally { f.cleanup(); }
});

test('B1: seedTrust writes the entry when the root is trusted', () => {
  const f = fixtureStore(storeWithTrustedRoot());
  try {
    seedTrust(f.file, { projectPath: '/tmp/wt-3', repoRoot: trustedRoot });
    const after = JSON.parse(fs.readFileSync(f.file, 'utf8'));
    assert.equal(after.projects['/tmp/wt-3'].hasTrustDialogAccepted, true);
    assert.equal(after.someUnrelatedKey, true, 'unrelated top-level keys survive the write');
    assert.equal(after.projects[trustedRoot].hasTrustDialogAccepted, true, 'existing entries survive');
  } finally { f.cleanup(); }
});

test('B2: seedTrust fails loud when the store shape is not what it expects, rather than guessing', () => {
  for (const [label, contents] of [
    ['no projects key', { unrelated: 1 }],
    ['projects is not an object', { projects: [] }],
    ['the root entry carries no trust field at all', { projects: { [trustedRoot]: { allowedTools: [] } } }],
  ]) {
    const f = fixtureStore(contents);
    try {
      assert.throws(
        () => seedTrust(f.file, { projectPath: '/tmp/wt-4', repoRoot: trustedRoot }),
        (err) => err instanceof TrustStoreError && (err.code === 'schema-drift' || err.code === 'untrusted-root'),
        `expected a typed refusal for: ${label}`,
      );
    } finally { f.cleanup(); }
  }
});

test('B2: a malformed store is a typed error, never a silent overwrite of the operator file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-trust-bad-'));
  const file = path.join(dir, 'claude.json');
  fs.writeFileSync(file, '{ this is not json');
  try {
    assert.throws(
      () => seedTrust(file, { projectPath: '/tmp/wt-5', repoRoot: trustedRoot }),
      (err) => err instanceof TrustStoreError && err.code === 'unreadable-store',
    );
    assert.equal(fs.readFileSync(file, 'utf8'), '{ this is not json', 'the file is left byte-identical');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('B2: seedTrust is idempotent -- seeding twice leaves exactly one entry and succeeds both times', () => {
  const f = fixtureStore(storeWithTrustedRoot());
  try {
    seedTrust(f.file, { projectPath: '/tmp/wt-6', repoRoot: trustedRoot });
    const first = JSON.parse(fs.readFileSync(f.file, 'utf8'));
    seedTrust(f.file, { projectPath: '/tmp/wt-6', repoRoot: trustedRoot });
    const second = JSON.parse(fs.readFileSync(f.file, 'utf8'));
    assert.deepEqual(second, first, 'a repeat seed changes nothing');
  } finally { f.cleanup(); }
});

test('B3: removeTrust deletes only its own entry and reports whether there was one', () => {
  const f = fixtureStore(storeWithTrustedRoot());
  try {
    seedTrust(f.file, { projectPath: '/tmp/wt-7', repoRoot: trustedRoot });
    const before = Object.keys(JSON.parse(fs.readFileSync(f.file, 'utf8')).projects).length;

    assert.equal(removeTrust(f.file, '/tmp/wt-7'), true);
    const after = JSON.parse(fs.readFileSync(f.file, 'utf8'));
    assert.equal(after.projects['/tmp/wt-7'], undefined);
    assert.equal(Object.keys(after.projects).length, before - 1, 'exactly one entry goes');
    assert.equal(after.projects[trustedRoot].hasTrustDialogAccepted, true, 'the operator root is untouched');

    assert.equal(removeTrust(f.file, '/tmp/wt-7'), false, 'removing an absent entry is false, not an error');
  } finally { f.cleanup(); }
});

test('B3: a seed followed by a remove returns the store to its exact prior contents', () => {
  const f = fixtureStore(storeWithTrustedRoot());
  try {
    const original = fs.readFileSync(f.file, 'utf8');
    seedTrust(f.file, { projectPath: '/tmp/wt-8', repoRoot: trustedRoot });
    removeTrust(f.file, '/tmp/wt-8');
    assert.deepEqual(
      JSON.parse(fs.readFileSync(f.file, 'utf8')),
      JSON.parse(original),
      'teardown leaves no residue -- this is what keeps the store from growing without bound',
    );
  } finally { f.cleanup(); }
});

test('B4: the write is atomic -- no partial file is observable and no stray temp file is left behind', () => {
  const f = fixtureStore(storeWithTrustedRoot());
  try {
    seedTrust(f.file, { projectPath: '/tmp/wt-9', repoRoot: trustedRoot });
    const leftovers = fs.readdirSync(f.dir).filter((n) => n !== 'claude.json');
    assert.deepEqual(leftovers, [], `atomic write must leave no temp file, found: ${leftovers.join(', ')}`);
    JSON.parse(fs.readFileSync(f.file, 'utf8')); // parses => never left half-written
  } finally { f.cleanup(); }
});
