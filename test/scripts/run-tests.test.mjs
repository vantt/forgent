import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { discoverTestFiles, buildTestArgv, runTests, REPO_ROOT, DEFAULT_TEST_ROOT } from '../../scripts/run-tests.mjs';

function tmpFixtureRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'run-tests-fixture-'));
}

function write(root, relPath, content = '// fixture\n') {
  const full = path.join(root, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return full;
}

// --- R1/R2: recursive discovery, sorted, de-duplicated ---------------------

test('discovers every *.test.mjs nested under the root, sorted and de-duplicated', () => {
  const root = tmpFixtureRoot();
  const b = write(root, 'b.test.mjs');
  const nested = write(root, 'nested/deep/c.test.mjs');
  const a = write(root, 'a.test.mjs');
  // Decoys R1/adversarial: contains ".test.mjs" but is not that exact
  // suffix, or is a wrong extension entirely -- neither should be picked up.
  write(root, 'a.test.mjs.bak');
  write(root, 'not-a-test.mjs');
  write(root, 'test.mjs.test.mjsx');

  const files = discoverTestFiles(root);
  assert.deepEqual(files, [a, b, nested].sort());
  // Idempotent / de-duplicated: calling twice never doubles anything.
  assert.deepEqual(discoverTestFiles(root), files);
});

test('a path containing spaces and a decoy directory named like a test file are both handled correctly', () => {
  const root = tmpFixtureRoot();
  const spaced = write(root, 'has space/weird name.test.mjs');
  // A directory literally named "looks-like.test.mjs" must never be treated
  // as a file match (adversarial: name-based checks alone could conflate
  // the two without an isDirectory/isFile split).
  fs.mkdirSync(path.join(root, 'looks-like.test.mjs'));

  const files = discoverTestFiles(root);
  assert.deepEqual(files, [spaced]);
});

test('does not follow a symlinked directory (no traversal cycle, no escaping the root)', () => {
  const root = tmpFixtureRoot();
  const real = write(root, 'real/x.test.mjs');
  const outside = tmpFixtureRoot();
  write(outside, 'outside.test.mjs');
  fs.symlinkSync(outside, path.join(root, 'linked-dir'), 'dir');
  // A self-referential symlink would recurse forever if directories were
  // followed -- proves the guard actually short-circuits, not just happens
  // to avoid this particular fixture's shape.
  fs.symlinkSync(root, path.join(root, 'self'), 'dir');

  const files = discoverTestFiles(root);
  assert.deepEqual(files, [real]);
});

test('a symlinked FILE ending in .test.mjs is still discovered', () => {
  const root = tmpFixtureRoot();
  const real = write(root, 'real.test.mjs');
  const linkPath = path.join(root, 'linked.test.mjs');
  fs.symlinkSync(real, linkPath, 'file');

  const files = discoverTestFiles(root);
  assert.deepEqual(files, [real, linkPath].sort());
});

// --- R7: discovered count matches a fixture tree AND the real repo ---------

test('discovered count matches an independently-built manual inventory of the same fixture tree', () => {
  const root = tmpFixtureRoot();
  const expected = [];
  for (const rel of ['one.test.mjs', 'group/two.test.mjs', 'group/sub/three.test.mjs', 'group/sub/four.test.mjs']) {
    expected.push(write(root, rel));
  }
  expected.sort();

  assert.deepEqual(discoverTestFiles(root), expected);
  assert.equal(discoverTestFiles(root).length, expected.length);
});

test('discovered count against the real repository inventory matches an independent fs walk', () => {
  // Independently re-implemented (never imports discoverTestFiles' own
  // walk) so this proves the two agree instead of trivially matching
  // itself.
  function manualWalk(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.isSymbolicLink()) continue;
        out.push(...manualWalk(full));
      } else if (entry.name.endsWith('.test.mjs')) {
        out.push(full);
      }
    }
    return out;
  }

  const expected = manualWalk(DEFAULT_TEST_ROOT).sort();
  const actual = discoverTestFiles(DEFAULT_TEST_ROOT);
  assert.deepEqual(actual, expected);
  assert.ok(actual.length > 0, 'expected at least one real test file under test/');
});

test('DEFAULT_TEST_ROOT resolves to <repo>/test', () => {
  assert.equal(DEFAULT_TEST_ROOT, path.join(REPO_ROOT, 'test'));
  assert.ok(fs.existsSync(DEFAULT_TEST_ROOT));
});

// --- buildTestArgv: ordering ------------------------------------------------

test('buildTestArgv places forwarded flags before the full file list, both after --test', () => {
  const argv = buildTestArgv(['test/a.test.mjs', 'test/b.test.mjs'], ['--test-reporter=tap', '--test-concurrency=1']);
  assert.deepEqual(argv, ['--test', '--test-reporter=tap', '--test-concurrency=1', 'test/a.test.mjs', 'test/b.test.mjs']);
});

test('buildTestArgv with no forwarded args is just --test plus the files', () => {
  assert.deepEqual(buildTestArgv(['x.test.mjs']), ['--test', 'x.test.mjs']);
});

// --- runTests: env merge, argv shape, zero-file refusal ---------------------

test('runTests refuses with a non-zero status and an actionable message when zero files are discovered (R4)', () => {
  const emptyRoot = tmpFixtureRoot();
  let spawnCalled = false;
  const result = runTests({
    root: emptyRoot,
    spawn: () => {
      spawnCalled = true;
      return { status: 0 };
    },
  });
  assert.equal(spawnCalled, false, 'must never spawn node --test over an empty selection');
  assert.equal(result.status, 1);
  assert.match(result.message, /discovered 0 test files/);
  assert.match(result.message, new RegExp(emptyRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('runTests spawns node --test with the discovered files as argv elements and FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 merged into env, preserving other env vars (R2/R3)', () => {
  const root = tmpFixtureRoot();
  const f = write(root, 'x.test.mjs');
  let captured = null;
  const fakeEnv = { PATH: '/usr/bin', UNRELATED: 'kept' };

  const result = runTests({
    root,
    cwd: root,
    execPath: '/fake/node',
    env: fakeEnv,
    spawn: (execPath, argv, opts) => {
      captured = { execPath, argv, opts };
      return { status: 0 };
    },
  });

  assert.equal(result.status, 0);
  assert.equal(captured.execPath, '/fake/node');
  assert.deepEqual(captured.argv, ['--test', path.relative(root, f)]);
  assert.equal(captured.opts.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS, '1');
  assert.equal(captured.opts.env.PATH, '/usr/bin');
  assert.equal(captured.opts.env.UNRELATED, 'kept');
});

test('runTests forwards extra runner args without letting them replace the full file list (R5)', () => {
  const root = tmpFixtureRoot();
  write(root, 'one.test.mjs');
  write(root, 'nested/two.test.mjs');
  let captured = null;

  const result = runTests({
    root,
    cwd: root,
    // Simulates a caller trying to pass a single file path as an "extra
    // arg", the way `npm test -- test/one.test.mjs` would forward it --
    // it must land ALONGSIDE the full discovered set, never replace it.
    forwardedArgs: ['--test-only', 'one.test.mjs'],
    spawn: (execPath, argv) => {
      captured = argv;
      return { status: 0 };
    },
  });

  assert.equal(result.status, 0);
  assert.equal(result.files.length, 2, 'the full discovered set must still be present');
  for (const f of result.files) {
    assert.ok(captured.includes(f), `expected forwarded argv to still include ${f}`);
  }
  assert.ok(captured.includes('--test-only'));
});

test('runTests propagates a real child exit status', () => {
  const root = tmpFixtureRoot();
  write(root, 'x.test.mjs');
  const result = runTests({ root, spawn: () => ({ status: 7 }) });
  assert.equal(result.status, 7);
});

// --- Integration: the script's own CLI entrypoint, spawned for real -------

test('the script itself, spawned as a real process against a tiny fixture tree with a rewritten test root, actually runs node --test and exits 0', () => {
  const root = tmpFixtureRoot();
  write(root, 'ok.test.mjs', "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\ntest('ok', () => assert.ok(true));\n");

  const scriptPath = fileURLToPath(new URL('../../scripts/run-tests.mjs', import.meta.url));
  const driver = path.join(root, 'drive.mjs');
  fs.writeFileSync(
    driver,
    `import { runTests } from ${JSON.stringify(scriptPath)};\n` +
      `const { status } = runTests({ root: ${JSON.stringify(root)}, cwd: ${JSON.stringify(root)}, stdio: 'ignore' });\n` +
      'process.exitCode = status;\n',
  );

  const result = spawnSyncNode(driver);
  assert.equal(result.status, 0);
});

test('the script itself, spawned for real, refuses (non-zero, no crash) over an empty tree', () => {
  const root = tmpFixtureRoot();
  const scriptPath = fileURLToPath(new URL('../../scripts/run-tests.mjs', import.meta.url));
  const driver = path.join(root, 'drive.mjs');
  fs.writeFileSync(
    driver,
    `import { runTests } from ${JSON.stringify(scriptPath)};\n` +
      `const { status, message } = runTests({ root: ${JSON.stringify(path.join(root, 'empty'))}, stdio: 'ignore' });\n` +
      'if (message) console.error(message);\n' +
      'process.exitCode = status;\n',
  );
  fs.mkdirSync(path.join(root, 'empty'));

  const result = spawnSyncNode(driver);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /discovered 0 test files/);
});

function spawnSyncNode(scriptPath) {
  return spawnSync(process.execPath, [scriptPath], { encoding: 'utf8' });
}

// --- Integration: the real CLI entrypoint guard, proven by actually --------
// running `node scripts/run-tests.mjs` as its own process (never importing
// its exports) against a faithfully-mirrored "scripts/ + test/" layout. A
// broken `import.meta.url === \`file://${process.argv[1]}\`` guard makes the
// whole top-level `if` block silently never run: the process would exit 0
// with no stderr at all instead of refusing loudly, which is exactly the
// failure the tests above (driving `runTests` through an imported driver)
// can never catch.

const realScriptPath = fileURLToPath(new URL('../../scripts/run-tests.mjs', import.meta.url));
const realLibPath = fileURLToPath(new URL('../../scripts/lib/is-main-module.mjs', import.meta.url));

function mirroredRepoRoot(prefix) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(root, 'scripts', 'lib'), { recursive: true });
  fs.mkdirSync(path.join(root, 'test'), { recursive: true }); // empty: zero test files
  fs.copyFileSync(realScriptPath, path.join(root, 'scripts', 'run-tests.mjs'));
  fs.copyFileSync(realLibPath, path.join(root, 'scripts', 'lib', 'is-main-module.mjs'));
  return root;
}

test('the real entrypoint, run directly as `node scripts/run-tests.mjs` against an empty test/ dir, refuses with exit 1 and a message', () => {
  const root = mirroredRepoRoot('run-tests-cli-');
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', 'run-tests.mjs')], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /discovered 0 test files/);
});

test('the real entrypoint still fires when its own absolute path contains a space (URL-encoding mismatch, not just a Windows-only bug)', () => {
  const root = mirroredRepoRoot('run tests cli-');
  assert.match(root, / /, 'fixture root must actually contain a space to exercise this case');
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', 'run-tests.mjs')], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /discovered 0 test files/);
});
