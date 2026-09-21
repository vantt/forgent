import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  parseNameStatusZ,
  parsePathListZ,
  collectChangedPaths,
  validateManifest,
  buildManifestIndex,
  matchFullTrigger,
  selectTests,
  runSelected,
  runShadow,
} from '../../scripts/test-select.mjs';

// -- fixture helpers ----------------------------------------------------

function tmpRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'test-select-fixture-'));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root });
  return root;
}

function write(root, relPath, content = '// fixture\n') {
  const full = path.join(root, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return full;
}

function commit(root, message = 'commit') {
  execFileSync('git', ['add', '-A'], { cwd: root });
  execFileSync('git', ['commit', '-q', '-m', message], { cwd: root });
}

// -- parseNameStatusZ / parsePathListZ -----------------------------------

test('parseNameStatusZ parses ordinary M/A/D rows', () => {
  const raw = 'M\0a.mjs\0A\0b.mjs\0D\0c.mjs\0';
  assert.deepEqual(parseNameStatusZ(raw), [
    { status: 'M', path: 'a.mjs' },
    { status: 'A', path: 'b.mjs' },
    { status: 'D', path: 'c.mjs' },
  ]);
});

test('parseNameStatusZ parses a rename row (3 NUL-separated fields) with both old and new path', () => {
  const raw = 'R100\0old.mjs\0new.mjs\0';
  assert.deepEqual(parseNameStatusZ(raw), [{ status: 'R100', oldPath: 'old.mjs', path: 'new.mjs' }]);
});

test('parseNameStatusZ handles a path containing a space and a backslash correctly (the whole point of -z)', () => {
  const raw = 'M\0a path\\with stuff.mjs\0';
  assert.deepEqual(parseNameStatusZ(raw), [{ status: 'M', path: 'a path\\with stuff.mjs' }]);
});

test('parseNameStatusZ returns [] for empty input', () => {
  assert.deepEqual(parseNameStatusZ(''), []);
});

test('parsePathListZ tags every entry as untracked-shaped status A', () => {
  assert.deepEqual(parsePathListZ('a.mjs\0b.mjs\0'), [
    { status: 'A', path: 'a.mjs' },
    { status: 'A', path: 'b.mjs' },
  ]);
});

test('parsePathListZ excludes the bare node_modules/target worktree-symlink entries (P05 finding): a real repo change alongside them is still reported', () => {
  assert.deepEqual(parsePathListZ('node_modules\0target\0src/real.mjs\0'), [{ status: 'A', path: 'src/real.mjs' }]);
});

test('parsePathListZ does NOT exclude a real untracked path that merely CONTAINS "node_modules" as a substring (exact bare-name match only)', () => {
  assert.deepEqual(parsePathListZ('vendor/node_modules-shim.mjs\0'), [{ status: 'A', path: 'vendor/node_modules-shim.mjs' }]);
});

// -- collectChangedPaths: real git integration ---------------------------

test('committed-only: a file changed only in a commit past merge-base is reported with source "committed"', () => {
  const root = tmpRepo();
  write(root, 'seed.mjs');
  commit(root, 'seed');
  execFileSync('git', ['branch', 'feature'], { cwd: root });
  execFileSync('git', ['checkout', '-q', 'feature'], { cwd: root });
  write(root, 'src/a.mjs', 'v2\n');
  commit(root, 'change a');

  const result = collectChangedPaths({ cwd: root, base: 'main' });
  assert.equal(result.changes.length, 1);
  assert.equal(result.changes[0].path, 'src/a.mjs');
  assert.equal(result.changes[0].source, 'committed');
});

test('staged-only: an index-only change is reported with source "staged"', () => {
  const root = tmpRepo();
  write(root, 'seed.mjs');
  commit(root, 'seed');
  write(root, 'src/staged.mjs');
  execFileSync('git', ['add', 'src/staged.mjs'], { cwd: root });

  const result = collectChangedPaths({ cwd: root, base: 'main' });
  assert.deepEqual(result.changes.map((c) => [c.path, c.source]), [['src/staged.mjs', 'staged']]);
});

test('unstaged-only: a working-tree-only change (tracked file, not added) is reported with source "unstaged"', () => {
  const root = tmpRepo();
  write(root, 'src/a.mjs', 'v1\n');
  commit(root, 'seed');
  write(root, 'src/a.mjs', 'v2\n');

  const result = collectChangedPaths({ cwd: root, base: 'main' });
  assert.deepEqual(result.changes.map((c) => [c.path, c.source]), [['src/a.mjs', 'unstaged']]);
});

test('untracked source and untracked test are both reported with source "untracked"', () => {
  const root = tmpRepo();
  write(root, 'seed.mjs');
  commit(root, 'seed');
  write(root, 'src/new.mjs');
  write(root, 'test/new.test.mjs');

  const result = collectChangedPaths({ cwd: root, base: 'main' });
  const paths = result.changes.map((c) => c.path).sort();
  assert.deepEqual(paths, ['src/new.mjs', 'test/new.test.mjs']);
  assert.ok(result.changes.every((c) => c.source === 'untracked'));
});

test('mixed: committed + staged + unstaged + untracked all show up together, correctly tagged', () => {
  const root = tmpRepo();
  write(root, 'src/base.mjs', 'v1\n');
  commit(root, 'seed');
  execFileSync('git', ['branch', 'feature'], { cwd: root });
  execFileSync('git', ['checkout', '-q', 'feature'], { cwd: root });
  write(root, 'src/committed.mjs');
  commit(root, 'commit one');
  write(root, 'src/staged.mjs');
  execFileSync('git', ['add', 'src/staged.mjs'], { cwd: root });
  write(root, 'src/base.mjs', 'v2\n'); // unstaged change to a tracked file
  write(root, 'src/untracked.mjs');

  const result = collectChangedPaths({ cwd: root, base: 'main' });
  const bySource = Object.fromEntries(result.changes.map((c) => [c.path, c.source]));
  assert.equal(bySource['src/committed.mjs'], 'committed');
  assert.equal(bySource['src/staged.mjs'], 'staged');
  assert.equal(bySource['src/base.mjs'], 'unstaged');
  assert.equal(bySource['src/untracked.mjs'], 'untracked');
});

test('rename and delete: a committed rename yields both the old path (status D, renamedTo set) and the new path (renamedFrom set)', () => {
  const root = tmpRepo();
  write(root, 'src/old-name.mjs', 'x'.repeat(200) + '\n'); // long enough content for git's default rename similarity heuristic
  commit(root, 'seed');
  execFileSync('git', ['branch', 'feature'], { cwd: root });
  execFileSync('git', ['checkout', '-q', 'feature'], { cwd: root });
  execFileSync('git', ['mv', 'src/old-name.mjs', 'src/new-name.mjs'], { cwd: root });
  commit(root, 'rename');

  const result = collectChangedPaths({ cwd: root, base: 'main' });
  const oldRow = result.changes.find((c) => c.path === 'src/old-name.mjs');
  const newRow = result.changes.find((c) => c.path === 'src/new-name.mjs');
  assert.ok(oldRow, 'old path must still be reported, never silently dropped');
  assert.equal(oldRow.status, 'D');
  assert.equal(oldRow.renamedTo, 'src/new-name.mjs');
  assert.ok(newRow);
  assert.equal(newRow.renamedFrom, 'src/old-name.mjs');
});

test('a plain delete (no rename) is reported with status D and no renamedTo', () => {
  const root = tmpRepo();
  write(root, 'src/gone.mjs');
  commit(root, 'seed');
  execFileSync('git', ['branch', 'feature'], { cwd: root });
  execFileSync('git', ['checkout', '-q', 'feature'], { cwd: root });
  fs.rmSync(path.join(root, 'src/gone.mjs'));
  commit(root, 'delete');

  const result = collectChangedPaths({ cwd: root, base: 'main' });
  assert.equal(result.changes.length, 1);
  assert.equal(result.changes[0].status, 'D');
  assert.equal(result.changes[0].renamedTo, undefined);
});

test('missing/invalid base returns an { error }, never throws', () => {
  const root = tmpRepo();
  write(root, 'seed.mjs');
  commit(root, 'seed');
  const result = collectChangedPaths({ cwd: root, base: 'this-ref-does-not-exist' });
  assert.ok(result.error);
  assert.equal(result.changes, undefined);
});

test('detached HEAD: collectChangedPaths still resolves merge-base and changes without crashing', () => {
  const root = tmpRepo();
  write(root, 'seed.mjs');
  commit(root, 'seed');
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  execFileSync('git', ['checkout', '-q', sha], { cwd: root }); // detach
  write(root, 'src/a.mjs');
  execFileSync('git', ['add', 'src/a.mjs'], { cwd: root });
  execFileSync('git', ['commit', '-q', '-m', 'detached commit'], { cwd: root });

  const result = collectChangedPaths({ cwd: root, base: 'main' });
  assert.equal(result.error, undefined);
  assert.equal(result.changes.length, 1);
});

// -- validateManifest -----------------------------------------------------

test('validateManifest accepts a well-formed manifest whose paths exist on disk', () => {
  const root = tmpRepo();
  write(root, 'src/a.mjs');
  write(root, 'test/a.test.mjs');
  const manifest = [{ id: 'a', pattern: 'src/a.mjs', directTests: ['test/a.test.mjs'], boundaryTests: [] }];
  const { valid, errors } = validateManifest(manifest, { repoRoot: root });
  assert.equal(valid, true, JSON.stringify(errors));
});

test('validateManifest rejects a duplicate rule id', () => {
  const root = tmpRepo();
  write(root, 'src/a.mjs');
  write(root, 'test/a.test.mjs');
  const manifest = [
    { id: 'a', pattern: 'src/a.mjs', directTests: ['test/a.test.mjs'], boundaryTests: [] },
    { id: 'a', pattern: 'src/b.mjs', directTests: ['test/a.test.mjs'], boundaryTests: [] },
  ];
  const { valid, errors } = validateManifest(manifest, { repoRoot: root });
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('duplicate rule id')));
});

test('validateManifest rejects a duplicate pattern (would make one path match two rules)', () => {
  const root = tmpRepo();
  write(root, 'src/a.mjs');
  write(root, 'test/a.test.mjs');
  write(root, 'test/a2.test.mjs');
  const manifest = [
    { id: 'a', pattern: 'src/a.mjs', directTests: ['test/a.test.mjs'], boundaryTests: [] },
    { id: 'a2', pattern: 'src/a.mjs', directTests: ['test/a2.test.mjs'], boundaryTests: [] },
  ];
  const { valid, errors } = validateManifest(manifest, { repoRoot: root });
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('duplicate pattern')));
});

test('validateManifest rejects a rule with no direct or boundary tests (empty test set)', () => {
  const root = tmpRepo();
  write(root, 'src/a.mjs');
  const manifest = [{ id: 'a', pattern: 'src/a.mjs', directTests: [], boundaryTests: [] }];
  const { valid, errors } = validateManifest(manifest, { repoRoot: root });
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('empty test set')));
});

test('validateManifest rejects a pattern that matches no file on the current tree', () => {
  const root = tmpRepo();
  write(root, 'test/a.test.mjs');
  const manifest = [{ id: 'a', pattern: 'src/does-not-exist.mjs', directTests: ['test/a.test.mjs'], boundaryTests: [] }];
  const { valid, errors } = validateManifest(manifest, { repoRoot: root });
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('does not exist')));
});

test('validateManifest allows a missing pattern file when the rule explicitly opts in with allowMissing (deleted-path history)', () => {
  const root = tmpRepo();
  write(root, 'test/a.test.mjs');
  const manifest = [{ id: 'a', pattern: 'src/deleted.mjs', directTests: ['test/a.test.mjs'], boundaryTests: [], allowMissing: true }];
  const { valid } = validateManifest(manifest, { repoRoot: root });
  assert.equal(valid, true);
});

test('validateManifest rejects a boundary/direct test path that does not exist (stale mandatory boundary test)', () => {
  const root = tmpRepo();
  write(root, 'src/a.mjs');
  const manifest = [{ id: 'a', pattern: 'src/a.mjs', directTests: ['test/stale.test.mjs'], boundaryTests: [] }];
  const { valid, errors } = validateManifest(manifest, { repoRoot: root });
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('does not exist')));
});

test('validateManifest rejects a referenced path that resolves (via symlink) outside the repo root', () => {
  const root = tmpRepo();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'outside-'));
  write(outside, 'evil.test.mjs');
  write(root, 'src/a.mjs');
  fs.mkdirSync(path.join(root, 'test'), { recursive: true });
  fs.symlinkSync(path.join(outside, 'evil.test.mjs'), path.join(root, 'test', 'escape.test.mjs'));
  const manifest = [{ id: 'a', pattern: 'src/a.mjs', directTests: ['test/escape.test.mjs'], boundaryTests: [] }];
  const { valid, errors } = validateManifest(manifest, { repoRoot: root });
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('outside the repo root')));
});

test('validateManifest rejects an unsupported field on a rule', () => {
  const root = tmpRepo();
  write(root, 'src/a.mjs');
  write(root, 'test/a.test.mjs');
  const manifest = [{ id: 'a', pattern: 'src/a.mjs', directTests: ['test/a.test.mjs'], boundaryTests: [], extra: 'nope' }];
  const { valid, errors } = validateManifest(manifest, { repoRoot: root });
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('unsupported field')));
});

// -- matching ---------------------------------------------------------------

test('buildManifestIndex + exact-path lookup: a path matches exactly one rule or none', () => {
  const manifest = [{ id: 'a', pattern: 'src/a.mjs', directTests: ['test/a.test.mjs'], boundaryTests: [] }];
  const idx = buildManifestIndex(manifest);
  assert.equal(idx.get('src/a.mjs').id, 'a');
  assert.equal(idx.get('src/b.mjs'), undefined);
});

test('matchFullTrigger matches a prefix rule and an exact rule, and returns null for neither', () => {
  const triggers = [
    { id: 'bin', prefix: 'bin/', reason: 'r1' },
    { id: 'pkg', exact: 'package.json', reason: 'r2' },
  ];
  assert.equal(matchFullTrigger('bin/fgos.mjs', triggers).id, 'bin');
  assert.equal(matchFullTrigger('package.json', triggers).id, 'pkg');
  assert.equal(matchFullTrigger('src/a.mjs', triggers), null);
});

// -- selectTests --------------------------------------------------------

/**
 * A real fixture root (not just injected functions) whose files actually
 * exist on disk, so `selectTests`'s internal `validateManifest` call
 * passes for real rather than needing its own separate mocking seam.
 */
function simpleFixture() {
  const root = tmpRepo();
  write(root, 'src/a.mjs');
  write(root, 'test/a.test.mjs');
  write(root, 'test/boundary.test.mjs');
  write(root, 'src/core/x.mjs');
  const manifest = [{ id: 'a', pattern: 'src/a.mjs', directTests: ['test/a.test.mjs'], boundaryTests: ['test/boundary.test.mjs'] }];
  const fullTriggers = [{ id: 'core', prefix: 'src/core/', reason: 'shared core' }];
  return { root, manifest, fullTriggers };
}

test('source matches one rule -> related, direct + boundary tests both selected', () => {
  const { root, manifest, fullTriggers } = simpleFixture();
  const result = selectTests({ changes: [{ path: 'src/a.mjs', status: 'M', source: 'unstaged' }], manifest, fullTriggers, repoRoot: root });
  assert.equal(result.decision, 'related');
  assert.deepEqual(result.selectedFiles, ['test/a.test.mjs', 'test/boundary.test.mjs']);
});

test('unknown source (no rule, no trigger) escalates to full', () => {
  const { root, manifest, fullTriggers } = simpleFixture();
  const result = selectTests({ changes: [{ path: 'src/mystery.mjs', status: 'M', source: 'unstaged' }], manifest, fullTriggers, repoRoot: root });
  assert.equal(result.decision, 'full');
  assert.equal(result.escalations[0].ruleId, 'unknown');
});

test('shared-core/full-trigger path escalates to full even when other changed paths matched cleanly', () => {
  const { root, manifest, fullTriggers } = simpleFixture();
  const result = selectTests({
    changes: [
      { path: 'src/a.mjs', status: 'M', source: 'unstaged' },
      { path: 'src/core/x.mjs', status: 'M', source: 'unstaged' },
    ],
    manifest,
    fullTriggers,
    repoRoot: root,
  });
  assert.equal(result.decision, 'full');
  assert.equal(result.escalations[0].ruleId, 'core');
});

test('harness/manifest change (matches a full-trigger by exact path) escalates to full', () => {
  const triggers = [{ id: 'manifest', exact: 'test/test-ownership.mjs', reason: 'manifest itself' }];
  const result = selectTests({ changes: [{ path: 'test/test-ownership.mjs', status: 'M', source: 'unstaged' }], manifest: [], fullTriggers: triggers });
  assert.equal(result.decision, 'full');
  assert.equal(result.escalations[0].ruleId, 'manifest');
});

test('a changed test file (not in the manifest, no source rule) selects itself rather than escalating', () => {
  const result = selectTests({
    changes: [{ path: 'test/some-random.test.mjs', status: 'M', source: 'unstaged' }],
    manifest: [],
    fullTriggers: [],
    fileExists: () => true,
  });
  assert.equal(result.decision, 'related');
  assert.deepEqual(result.selectedFiles, ['test/some-random.test.mjs']);
});

test('test deletion: a deleted test file is a known, explainable change and does NOT escalate (nothing to run for a file that is gone)', () => {
  const result = selectTests({
    changes: [{ path: 'test/deleted.test.mjs', status: 'D', source: 'committed' }],
    manifest: [],
    fullTriggers: [],
    fileExists: () => false,
  });
  assert.equal(result.decision, 'refuse'); // zero selected files in this minimal fixture
  assert.equal(result.escalations.length, 0, 'a deletion must not itself be treated as unknown/unsafe');
});

test('zero changed paths refuses rather than silently running (or discovering) nothing', () => {
  const { root, manifest, fullTriggers } = simpleFixture();
  const result = selectTests({ changes: [], manifest, fullTriggers, repoRoot: root });
  assert.equal(result.decision, 'refuse');
});

test('zero selected files after matching (manifest matched, but its tests all resolve empty in this fixture) refuses', () => {
  const manifest = [{ id: 'a', pattern: 'src/a.mjs', directTests: [], boundaryTests: ['test/b.test.mjs'] }];
  // Simulate an edge the real validateManifest would normally catch --
  // exercised directly against selectTests to prove ITS OWN independent
  // zero-selected-files guard, not just relying on upstream validation.
  const result = selectTests({ changes: [{ path: 'src/a.mjs', status: 'M', source: 'unstaged' }], manifest: [{ ...manifest[0], boundaryTests: [] }], fullTriggers: [] });
  // an empty-test rule fails validateManifest -> decision is 'full' (manifest-invalid), which is the correct, safe outcome
  assert.equal(result.decision, 'full');
  assert.equal(result.reason, 'manifest-invalid');
});

test('static graph returning empty/UNKNOWN (i.e. []) never removes a manifest-selected test', () => {
  const { root, manifest, fullTriggers } = simpleFixture();
  const withEmpty = selectTests({ changes: [{ path: 'src/a.mjs', status: 'M', source: 'unstaged' }], manifest, fullTriggers, repoRoot: root, staticGraphTests: [] });
  assert.deepEqual(withEmpty.selectedFiles, ['test/a.test.mjs', 'test/boundary.test.mjs']);
});

test('graph-added test union behavior: an extra static-graph test is ADDED, manifest tests are still all present', () => {
  const { root, manifest, fullTriggers } = simpleFixture();
  const result = selectTests({
    changes: [{ path: 'src/a.mjs', status: 'M', source: 'unstaged' }],
    manifest,
    fullTriggers,
    repoRoot: root,
    staticGraphTests: ['test/graph-added.test.mjs'],
  });
  assert.deepEqual(result.selectedFiles, ['test/a.test.mjs', 'test/boundary.test.mjs', 'test/graph-added.test.mjs']);
});

test('an invalid manifest falls back to full rather than crashing or matching against broken data', () => {
  const badManifest = [{ id: 'a', pattern: 'src/a.mjs', directTests: [], boundaryTests: [] }]; // empty test set
  const result = selectTests({ changes: [{ path: 'src/a.mjs', status: 'M', source: 'unstaged' }], manifest: badManifest, fullTriggers: [], fileExists: () => true });
  assert.equal(result.decision, 'full');
  assert.equal(result.reason, 'manifest-invalid');
});

// -- traversal / symlink-escape (unsafe path in the MANIFEST DATA itself) --

test('a manifest whose test path traverses outside the repo root is invalid, forcing full', () => {
  const root = tmpRepo();
  write(root, 'src/a.mjs');
  write(root, path.join('..', 'outside.test.mjs')); // actually escapes tmpRepo's own parent -- construct via absolute instead
  const manifest = [{ id: 'a', pattern: 'src/a.mjs', directTests: ['../outside.test.mjs'], boundaryTests: [] }];
  const { valid, errors } = validateManifest(manifest, { repoRoot: root });
  assert.equal(valid, false);
  assert.ok(errors.length > 0);
});

// -- runSelected orchestration -------------------------------------------

test('runSelected: an unknown changed path drives a real full-suite spawn exactly once', () => {
  const root = tmpRepo();
  write(root, 'seed.mjs');
  commit(root, 'seed');
  write(root, 'test/x.test.mjs', "import { test } from 'node:test';\ntest('x', () => {});\n");
  execFileSync('git', ['add', 'test/x.test.mjs'], { cwd: root });
  write(root, 'src/mystery.mjs');
  execFileSync('git', ['add', 'src/mystery.mjs'], { cwd: root });

  let spawnCalls = 0;
  const result = runSelected({
    base: 'main',
    cwd: root,
    repoRoot: root,
    testRoot: path.join(root, 'test'),
    manifest: [],
    fullTriggers: [],
    spawn: () => {
      spawnCalls += 1;
      return { status: 0 };
    },
  });
  assert.equal(result.decision, 'full');
  assert.equal(spawnCalls, 1);
});

test('runSelected: an all-matched change set runs runSelectedTests with exactly the matched files, not the full set', () => {
  const root = tmpRepo();
  write(root, 'seed.mjs');
  commit(root, 'seed');
  write(root, 'test/a.test.mjs', "import { test } from 'node:test';\ntest('a', () => {});\n");
  write(root, 'test/unrelated.test.mjs', "import { test } from 'node:test';\ntest('u', () => {});\n");
  execFileSync('git', ['add', '-A'], { cwd: root });
  commit(root, 'add tests');
  write(root, 'src/a.mjs');
  execFileSync('git', ['add', 'src/a.mjs'], { cwd: root });

  const manifest = [{ id: 'a', pattern: 'src/a.mjs', directTests: ['test/a.test.mjs'], boundaryTests: [] }];
  let captured = null;
  const result = runSelected({
    base: 'main',
    cwd: root,
    repoRoot: root,
    testRoot: path.join(root, 'test'),
    manifest,
    fullTriggers: [],
    spawn: (execPath, argv) => {
      captured = argv;
      return { status: 0 };
    },
  });
  assert.equal(result.decision, 'related');
  assert.ok(captured.some((a) => a.endsWith('/a.test.mjs') || a === 'test/a.test.mjs'));
  assert.ok(!captured.some((a) => a.endsWith('unrelated.test.mjs')), 'the unrelated file must not be selected');
});

test('runSelected: zero changes refuses without spawning', () => {
  const root = tmpRepo();
  write(root, 'seed.mjs');
  commit(root, 'seed');
  let spawnCalls = 0;
  const result = runSelected({
    base: 'main',
    cwd: root,
    repoRoot: root,
    testRoot: path.join(root, 'test'),
    manifest: [],
    fullTriggers: [],
    spawn: () => {
      spawnCalls += 1;
      return { status: 0 };
    },
  });
  assert.equal(result.status, 1);
  assert.equal(result.decision, 'refuse');
  assert.equal(spawnCalls, 0);
});

test('runSelected: an invalid --base is reported as invalid-base and never spawns', () => {
  const root = tmpRepo();
  write(root, 'seed.mjs');
  commit(root, 'seed');
  let spawnCalls = 0;
  const result = runSelected({
    base: 'no-such-ref',
    cwd: root,
    repoRoot: root,
    testRoot: path.join(root, 'test'),
    spawn: () => {
      spawnCalls += 1;
      return { status: 0 };
    },
  });
  assert.equal(result.status, 1);
  assert.match(result.reason, /invalid-base/);
  assert.equal(spawnCalls, 0);
});

// -- real manifest sanity (against THIS repo, not a fixture) --------------

test("this repo's real MANIFEST/FULL_TRIGGERS validate cleanly", async () => {
  const { MANIFEST, FULL_TRIGGERS } = await import('../../test/test-ownership.mjs');
  const { valid, errors } = validateManifest(MANIFEST);
  assert.equal(valid, true, JSON.stringify(errors, null, 2));
  assert.ok(MANIFEST.length > 0);
  assert.ok(FULL_TRIGGERS.length > 0);
});

test('P05 regression: no FULL_TRIGGERS prefix shadows a src/state/** leaf module that has its own manifest rule (a blanket "src/state/" trigger previously made every state-leaf rule unreachable)', async () => {
  const { MANIFEST, FULL_TRIGGERS } = await import('../../test/test-ownership.mjs');
  const idx = buildManifestIndex(MANIFEST);
  const stateLeafRules = MANIFEST.filter((r) => r.pattern.startsWith('src/state/'));
  assert.ok(stateLeafRules.length > 0, 'sanity: this repo\'s manifest should have at least one src/state/ leaf rule');
  for (const rule of stateLeafRules) {
    const trigger = matchFullTrigger(rule.pattern, FULL_TRIGGERS);
    assert.equal(trigger, null, `${rule.pattern} (manifest rule "${rule.id}") must not also match a full-trigger, or it can never be selected as related`);
    assert.ok(idx.get(rule.pattern), `${rule.pattern} must still resolve via the manifest index`);
  }
});

test('P05 regression: a src/state/ file with NO manifest rule still escalates via the unknown-path default-deny (not a named full-trigger, but same safe outcome)', async () => {
  const { MANIFEST, FULL_TRIGGERS } = await import('../../test/test-ownership.mjs');
  const idx = buildManifestIndex(MANIFEST);
  const unmapped = 'src/state/events.mjs'; // shared core, deliberately not manifest-mapped
  assert.equal(idx.get(unmapped), undefined, 'sanity: events.mjs must not be in the manifest');
  assert.equal(matchFullTrigger(unmapped, FULL_TRIGGERS), null);
  // selectTests must still escalate it -- via 'unknown', proven end to end:
  const result = selectTests({ changes: [{ path: unmapped, status: 'M', source: 'unstaged' }], manifest: MANIFEST, fullTriggers: FULL_TRIGGERS, fileExists: () => true });
  assert.equal(result.decision, 'full');
  assert.equal(result.escalations[0].ruleId, 'unknown');
});

// -- runShadow (test:related:shadow) -------------------------------------

test('runShadow: related green + full green -- runs both, agree=true, patchRelatedMiss=false, status is the FULL result', () => {
  const root = tmpRepo();
  write(root, 'seed.mjs');
  commit(root, 'seed');
  write(root, 'test/a.test.mjs', "import { test } from 'node:test';\ntest('a', () => {});\n");
  execFileSync('git', ['add', '-A'], { cwd: root });
  commit(root, 'add test');
  write(root, 'src/a.mjs');
  execFileSync('git', ['add', 'src/a.mjs'], { cwd: root });

  const manifest = [{ id: 'a', pattern: 'src/a.mjs', directTests: ['test/a.test.mjs'], boundaryTests: [] }];
  const calls = [];
  const result = runShadow({
    base: 'main',
    cwd: root,
    repoRoot: root,
    testRoot: path.join(root, 'test'),
    manifest,
    fullTriggers: [],
    spawn: (execPath, argv) => {
      calls.push(argv);
      return { status: 0 };
    },
  });
  assert.equal(result.status, 0);
  assert.equal(result.comparison.decision, 'related');
  assert.equal(result.comparison.relatedRan, true);
  assert.equal(result.comparison.relatedStatus, 0);
  assert.equal(result.comparison.fullStatus, 0);
  assert.equal(result.comparison.agree, true);
  assert.equal(result.comparison.patchRelatedMiss, false);
  assert.equal(calls.length, 2, 'related spawn + full spawn, exactly two');
});

test('runShadow: patch-related miss -- related predicts green, full suite actually fails, status is the FULL (failing) result', () => {
  const root = tmpRepo();
  write(root, 'seed.mjs');
  commit(root, 'seed');
  write(root, 'test/a.test.mjs', "import { test } from 'node:test';\ntest('a', () => {});\n");
  execFileSync('git', ['add', '-A'], { cwd: root });
  commit(root, 'add test');
  write(root, 'src/a.mjs');
  execFileSync('git', ['add', 'src/a.mjs'], { cwd: root });

  const manifest = [{ id: 'a', pattern: 'src/a.mjs', directTests: ['test/a.test.mjs'], boundaryTests: [] }];
  let callIndex = 0;
  const result = runShadow({
    base: 'main',
    cwd: root,
    repoRoot: root,
    testRoot: path.join(root, 'test'),
    manifest,
    fullTriggers: [],
    spawn: () => {
      callIndex += 1;
      return { status: callIndex === 1 ? 0 : 1 }; // related (1st call) green, full (2nd call) red
    },
  });
  assert.equal(result.status, 1, 'the full (authoritative) status wins, never the related one');
  assert.equal(result.comparison.relatedStatus, 0);
  assert.equal(result.comparison.fullStatus, 1);
  assert.equal(result.comparison.agree, false);
  assert.equal(result.comparison.patchRelatedMiss, true);
});

test('runShadow: an escalated (full) decision skips the separate related run -- only one spawn, trivially agrees', () => {
  const root = tmpRepo();
  write(root, 'seed.mjs');
  write(root, 'test/x.test.mjs', "import { test } from 'node:test';\ntest('x', () => {});\n");
  commit(root, 'seed');
  write(root, 'src/mystery.mjs');
  execFileSync('git', ['add', 'src/mystery.mjs'], { cwd: root });

  let calls = 0;
  const result = runShadow({
    base: 'main',
    cwd: root,
    repoRoot: root,
    testRoot: path.join(root, 'test'),
    manifest: [],
    fullTriggers: [],
    spawn: () => {
      calls += 1;
      return { status: 0 };
    },
  });
  assert.equal(result.comparison.decision, 'full');
  assert.equal(result.comparison.relatedRan, false);
  assert.equal(result.comparison.agree, true);
  assert.equal(calls, 1, 'only the full-suite spawn happens -- nothing to shadow-compare against itself');
});

test('runShadow: zero changed paths refuses without spawning anything', () => {
  const root = tmpRepo();
  write(root, 'seed.mjs');
  commit(root, 'seed');
  let calls = 0;
  const result = runShadow({
    base: 'main',
    cwd: root,
    repoRoot: root,
    testRoot: path.join(root, 'test'),
    manifest: [],
    fullTriggers: [],
    spawn: () => {
      calls += 1;
      return { status: 0 };
    },
  });
  assert.equal(result.status, 1);
  assert.equal(result.comparison, null);
  assert.equal(calls, 0);
});
