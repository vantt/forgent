import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { parseEtime, parsePs, treeOf, findOverdue } from '../../scripts/lib/test-file-watchdog.mjs';
import { discoverTestFiles, buildTestArgv, buildTestEnv, runTests, runSelectedTests, KEEP_TMP_ENV, REPO_ROOT, DEFAULT_TEST_ROOT, snapshotFgos, diffFgosSnapshots, SENSITIVE_FGOS_FILES } from '../../scripts/run-tests.mjs';

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

  const scriptUrl = new URL('../../scripts/run-tests.mjs', import.meta.url).href;
  const driver = path.join(root, 'drive.mjs');
  fs.writeFileSync(
    driver,
    `import { runTests } from ${JSON.stringify(scriptUrl)};\n` +
      `const { status } = runTests({ root: ${JSON.stringify(root)}, cwd: ${JSON.stringify(root)}, stdio: 'ignore' });\n` +
      'process.exitCode = status;\n',
  );

  const result = spawnSyncNode(driver);
  assert.equal(result.status, 0);
});

test('the script itself, spawned for real, refuses (non-zero, no crash) over an empty tree', () => {
  const root = tmpFixtureRoot();
  const scriptUrl = new URL('../../scripts/run-tests.mjs', import.meta.url).href;
  const driver = path.join(root, 'drive.mjs');
  fs.writeFileSync(
    driver,
    `import { runTests } from ${JSON.stringify(scriptUrl)};\n` +
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
const realQueueLibPath = fileURLToPath(new URL('../../scripts/lib/full-suite-queue.mjs', import.meta.url));
const mirroredRoots = [];

after(() => {
  for (const root of mirroredRoots) fs.rmSync(root, { recursive: true, force: true });
});

function mirroredRepoRoot(prefix) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  mirroredRoots.push(root);
  fs.mkdirSync(path.join(root, 'scripts', 'lib'), { recursive: true });
  fs.mkdirSync(path.join(root, 'test'), { recursive: true }); // empty: zero test files
  fs.copyFileSync(realScriptPath, path.join(root, 'scripts', 'run-tests.mjs'));
  fs.copyFileSync(realLibPath, path.join(root, 'scripts', 'lib', 'is-main-module.mjs'));
  fs.copyFileSync(realQueueLibPath, path.join(root, 'scripts', 'lib', 'full-suite-queue.mjs'));
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

test('the real entrypoint still fires when invoked through a symlink pointing at it (import.meta.url resolves to the symlink\'s real target, argv[1] stays the symlink path)', () => {
  const root = mirroredRepoRoot('run-tests-symlink-cli-');
  const link = path.join(root, 'run-tests-link.mjs');
  fs.symlinkSync(path.join(root, 'scripts', 'run-tests.mjs'), link);
  const result = spawnSync(process.execPath, [link], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /discovered 0 test files/);
});

test('buildTestEnv drops an inherited NODE_TEST_CONTEXT so a nested node --test really runs its files', () => {
  const env = buildTestEnv({ PATH: '/usr/bin', NODE_TEST_CONTEXT: 'child-v8', KEEP: 'yes' });
  assert.equal('NODE_TEST_CONTEXT' in env, false);
  assert.equal(env.KEEP, 'yes');
  assert.equal(env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS, '1');
});

// --- per-run temp dir: every fixture the suite mkdtemps lands under one
// directory that is removed when the run ends, so leaked fixtures can never
// pile up in the OS temp dir across runs.

function tempBase() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'run-tests-tmpbase-'));
}

test('runSelectedTests points the child at a fresh per-run temp dir and removes it when the run ends', () => {
  const base = tempBase();
  let seen;
  const result = runSelectedTests(['a.test.mjs'], {
    cwd: base,
    env: { TMPDIR: base },
    spawn: (_exec, _argv, opts) => {
      seen = opts.env;
      fs.writeFileSync(path.join(opts.env.TMPDIR, 'leaked-fixture'), 'x'); // a test that never cleans up
      return { status: 0 };
    },
  });
  assert.equal(result.status, 0);
  assert.equal(path.dirname(seen.TMPDIR), fs.realpathSync(base));
  assert.match(path.basename(seen.TMPDIR), /^fgos-test-run-/);
  assert.equal(seen.TMP, seen.TMPDIR);
  assert.equal(seen.TEMP, seen.TMPDIR);
  assert.equal(fs.existsSync(seen.TMPDIR), false, 'the per-run dir and everything leaked into it is gone');
  fs.rmSync(base, { recursive: true, force: true });
});

test('runSelectedTests keeps the per-run temp dir when FGOS_TEST_KEEP_TMP=1, and says where', () => {
  const base = tempBase();
  const logs = [];
  const result = runSelectedTests(['a.test.mjs'], {
    cwd: base,
    env: { TMPDIR: base, [KEEP_TMP_ENV]: '1' },
    spawn: () => ({ status: 0 }),
    log: (msg) => logs.push(msg),
  });
  assert.equal(fs.existsSync(result.runTemp), true);
  assert.match(logs.join('\n'), new RegExp(result.runTemp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  fs.rmSync(base, { recursive: true, force: true });
});

test('runSelectedTests removes the per-run temp dir even when spawning the suite throws', () => {
  const base = tempBase();
  let runTemp;
  assert.throws(() => runSelectedTests(['a.test.mjs'], {
    cwd: base,
    env: { TMPDIR: base },
    spawn: (_exec, _argv, opts) => { runTemp = opts.env.TMPDIR; throw new Error('spawn blew up'); },
  }), /spawn blew up/);
  assert.equal(fs.existsSync(runTemp), false);
  fs.rmSync(base, { recursive: true, force: true });
});

// ─── .fgos Store Leak Guardrail Tests ─────────────────────────────────────────

test('snapshotFgos captures files in .fgos including observe/, excluding secrets', () => {
  const base = tempBase();
  const fgosDir = path.join(base, '.fgos');
  fs.mkdirSync(path.join(fgosDir, 'observe', 'friction'), { recursive: true });
  fs.mkdirSync(path.join(fgosDir, 'coordination'), { recursive: true });
  fs.writeFileSync(path.join(fgosDir, 'config.json'), '{"runner":{}}');
  fs.writeFileSync(path.join(fgosDir, 'observe', 'friction', 'data.json'), '{"friction":1}');
  fs.writeFileSync(path.join(fgosDir, 'secrets.local.env'), 'SECRET_TOKEN=abc');
  fs.writeFileSync(path.join(fgosDir, 'secrets.env'), 'SECRET_KEY=xyz');

  const snap = snapshotFgos(base);
  assert.equal(snap.has('config.json'), true);
  assert.equal(snap.has(path.join('observe', 'friction', 'data.json')), true);
  assert.equal(snap.has('secrets.local.env'), false, 'secrets.local.env must be excluded from snapshot');
  assert.equal(snap.has('secrets.env'), false, 'secrets.env must be excluded from snapshot');
  assert.equal(snap.get('config.json').size, 13);

  fs.rmSync(base, { recursive: true, force: true });
});

test('diffFgosSnapshots correctly computes added, modified, deleted, and respects allowedMutations', () => {
  const before = new Map([
    ['config.json', { mtimeMs: 1000, size: 20 }],
    ['state.json', { mtimeMs: 1000, size: 50 }],
    ['to-delete.json', { mtimeMs: 1000, size: 30 }],
  ]);
  const after = new Map([
    ['config.json', { mtimeMs: 1000, size: 20 }], // unchanged
    ['state.json', { mtimeMs: 2000, size: 60 }], // modified
    ['new-run.json', { mtimeMs: 2000, size: 100 }], // added
    ['allowed-new.json', { mtimeMs: 2000, size: 10 }], // allowed added
  ]);

  const allowed = new Set(['allowed-new.json']);
  const diff = diffFgosSnapshots(before, after, allowed);

  assert.equal(diff.leaked, true);
  assert.deepEqual(diff.added, ['new-run.json']);
  assert.deepEqual(diff.modified, ['state.json']);
  assert.deepEqual(diff.deleted, ['to-delete.json']);
});

test('runSelectedTests passes cleanly with status 0 when no .fgos store leak occurs', () => {
  const base = tempBase();
  const fgosDir = path.join(base, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  fs.writeFileSync(path.join(fgosDir, 'config.json'), '{"runner":{}}');

  const result = runSelectedTests(['a.test.mjs'], {
    cwd: base,
    spawn: () => ({ status: 0 }),
  });

  assert.equal(result.status, 0);
  assert.equal(result.fgosDiff.leaked, false);
  assert.deepEqual(result.fgosDiff.added, []);
  assert.deepEqual(result.fgosDiff.modified, []);
  assert.deepEqual(result.fgosDiff.deleted, []);
  fs.rmSync(base, { recursive: true, force: true });
});

test('runSelectedTests fails with exit 1 and reports error when test suite leaks a file into .fgos', () => {
  const base = tempBase();
  const fgosDir = path.join(base, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  fs.writeFileSync(path.join(fgosDir, 'config.json'), '{"runner":{}}');

  const logs = [];
  const result = runSelectedTests(['a.test.mjs'], {
    cwd: base,
    spawn: () => {
      // Simulate a test leaking a file into .fgos/dispatch-runs/claude/123/run.json
      const leakDir = path.join(fgosDir, 'dispatch-runs', 'claude', '123');
      fs.mkdirSync(leakDir, { recursive: true });
      fs.writeFileSync(path.join(leakDir, 'run.json'), '{"leaked":true}');
      return { status: 0 }; // test claimed it passed
    },
    log: (msg) => logs.push(msg),
  });

  assert.equal(result.status, 1, 'suite MUST fail if test leaked into .fgos');
  assert.equal(result.fgosDiff.leaked, true);
  assert.equal(result.fgosDiff.added.includes(path.join('dispatch-runs', 'claude', '123', 'run.json')), true);
  assert.match(logs.join('\n'), /leaked unexpected files/);
  assert.match(logs.join('\n'), /dispatch-runs.*run\.json/);

  fs.rmSync(base, { recursive: true, force: true });
});

test('runSelectedTests fails when a test leaks into .fgos/observe/ store', () => {
  const base = tempBase();
  const fgosDir = path.join(base, '.fgos');
  fs.mkdirSync(path.join(fgosDir, 'observe', 'friction'), { recursive: true });

  const logs = [];
  const result = runSelectedTests(['observe.test.mjs'], {
    cwd: base,
    spawn: () => {
      // Simulate leaking into .fgos/observe/friction/leak.json
      fs.writeFileSync(path.join(fgosDir, 'observe', 'friction', 'leak.json'), '{"bad":true}');
      return { status: 0 };
    },
    log: (msg) => logs.push(msg),
  });

  assert.equal(result.status, 1, 'suite MUST fail if test leaked into .fgos/observe/');
  assert.equal(result.fgosDiff.leaked, true);
  assert.equal(result.fgosDiff.added.includes(path.join('observe', 'friction', 'leak.json')), true);
  assert.match(logs.join('\n'), /observe.*leak\.json/);

  fs.rmSync(base, { recursive: true, force: true });
});

test('runSelectedTests permits allowed mutations without failing the suite', () => {
  const base = tempBase();
  const fgosDir = path.join(base, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });

  const allowed = new Set(['allowed.log']);
  const result = runSelectedTests(['a.test.mjs'], {
    cwd: base,
    allowedFgosMutations: allowed,
    spawn: () => {
      fs.writeFileSync(path.join(fgosDir, 'allowed.log'), 'ok');
      return { status: 0 };
    },
  });

  assert.equal(result.status, 0);
  assert.equal(result.fgosDiff.leaked, false);
  fs.rmSync(base, { recursive: true, force: true });
});

// --- Per-file time limit ----------------------------------------------------

test('parseEtime reads ps elapsed-time formats', () => {
  assert.equal(parseEtime('00:07'), 7000);
  assert.equal(parseEtime('12:34'), (12 * 60 + 34) * 1000);
  assert.equal(parseEtime('01:02:03'), ((1 * 60 + 2) * 60 + 3) * 1000);
  assert.equal(parseEtime('2-03:04:05'), (((2 * 24 + 3) * 60 + 4) * 60 + 5) * 1000);
  assert.ok(Number.isNaN(parseEtime('garbage')));
});

test('findOverdue picks only in-tree test-file processes past their own limit; treeOf lists children first', () => {
  const procs = parsePs([
    '  100     1    10:00 node run-tests.mjs',
    '  200   100    10:00 node --test test/a.test.mjs test/b.test.mjs',
    '  300   200    09:00 /usr/bin/node test/a.test.mjs',
    '  400   300    08:59 sleep 99999',
    '  500   200    00:05 /usr/bin/node test/b.test.mjs',
    '  600     1    99:00 /usr/bin/node test/a.test.mjs',
  ].join('\n'));
  const limits = { 'test/a.test.mjs': 60_000, 'test/b.test.mjs': 60_000 };
  const overdue = findOverdue(procs, 100, limits);
  assert.deepEqual(overdue.map((o) => [o.pid, o.file]), [[300, 'test/a.test.mjs']]);
  assert.deepEqual(treeOf(procs, 300), [400, 300]);
});

for (const pauseAfterKill of [false, true]) {
  test(pauseAfterKill
    ? 'timeout evidence survives the nested runner finishing while the watchdog is paused after killing a file'
    : 'a hung test file is killed with its whole process tree, named, and the rest of the suite still runs', async (t) => {
    const root = tmpFixtureRoot();
    const runnerPidFile = path.join(root, 'runner.pid');
    const grandchildPidFile = path.join(root, 'grandchild.pid');
    const okMarker = path.join(root, 'ok.ran');
    const acknowledged = path.join(root, 'parent-read');
    const killGapMarker = path.join(root, 'kill-gap');
    const supervisorPidFile = path.join(root, 'supervisor.pid');
    const supervisorExited = path.join(root, 'supervisor.exited');
    const env = { ...process.env };
    t.after(async () => {
      try {
        // Release the real supervisor even if an assertion or spawn failed.
        fs.writeFileSync(acknowledged, '1');
        for (const pidFile of [grandchildPidFile, runnerPidFile]) {
          if (!fs.existsSync(pidFile)) continue;
          const pid = Number(fs.readFileSync(pidFile, 'utf8'));
          if (Number.isInteger(pid) && pid > 0) {
            try { process.kill(pid, 'SIGKILL'); } catch (err) {
              if (err.code !== 'ESRCH') throw err;
            }
          }
        }
        if (fs.existsSync(supervisorPidFile)) {
          const deadline = Date.now() + 60_000;
          while (!fs.existsSync(supervisorExited) && Date.now() < deadline) await delay(10);
          if (!fs.existsSync(supervisorExited)) {
            const pid = Number(fs.readFileSync(supervisorPidFile, 'utf8'));
            try { process.kill(pid, 'SIGKILL'); } catch (err) {
              if (err.code !== 'ESRCH') throw err;
            }
            assert.fail('the watchdog must exit after the parent acknowledges its result');
          }
        }
      } finally {
        fs.rmSync(root, { recursive: true, force: true });
      }
    });
    if (pauseAfterKill) {
      // Hold the real SIGKILL boundary until runTests has read the journal.
      // No fake process table, source pin, or production-only testing seam:
      // the nested runner, supervisor, and detached child all run for real.
      const watchdogPath = fileURLToPath(new URL('../../scripts/lib/test-file-watchdog.mjs', import.meta.url));
      const preload = write(root, 'pause-watchdog.mjs', `
import fs from 'node:fs';
if (process.argv[1] === ${JSON.stringify(watchdogPath)}) {
  fs.writeFileSync(${JSON.stringify(supervisorPidFile)}, String(process.pid));
  process.on('exit', () => fs.writeFileSync(${JSON.stringify(supervisorExited)}, '1'));
  const kill = process.kill;
  process.kill = function(pid, signal) {
    const isRunner = signal === 'SIGKILL'
      && fs.existsSync(${JSON.stringify(runnerPidFile)})
      && pid === Number(fs.readFileSync(${JSON.stringify(runnerPidFile)}, 'utf8'));
    const result = kill.call(process, pid, signal);
    if (isRunner) {
      fs.writeFileSync(${JSON.stringify(killGapMarker)}, '1');
      const deadline = Date.now() + 60_000;
      while (!fs.existsSync(${JSON.stringify(acknowledged)}) && Date.now() < deadline) {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
      }
      if (!fs.existsSync(${JSON.stringify(acknowledged)})) throw new Error('parent never acknowledged the journal read');
    }
    return result;
  };
}
`);
      env.NODE_OPTIONS = `${env.NODE_OPTIONS || ''} --import=${JSON.stringify(pathToFileURL(preload).href)}`.trim();
    }
    write(
      root,
      'a-hang.test.mjs',
      "import { test } from 'node:test';\nimport { spawn } from 'node:child_process';\nimport fs from 'node:fs';\n" +
        `fs.writeFileSync(${JSON.stringify(runnerPidFile)}, String(process.pid));\n` +
        "const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: 'ignore' });\n" +
        `fs.writeFileSync(${JSON.stringify(grandchildPidFile)}, String(child.pid));\n` +
        "test('passes, then the process never exits', () => {});\nsetInterval(() => {}, 1000);\n",
    );
    write(
      root,
      'b-ok.test.mjs',
      `import { test } from 'node:test';\nimport fs from 'node:fs';\ntest('ok', () => fs.writeFileSync(${JSON.stringify(okMarker)}, '1'));\n`,
    );
    const logs = [];
    const started = Date.now();
    let nested;
    let invocation;
    let result;
    try {
      try {
        result = runTests({
          root,
          cwd: root,
          env,
          stdio: 'pipe',
          fileTimeoutMs: 2000,
          watchdogPollMs: 300,
          watchdog: true,
          spawn(execPath, argv, opts) {
            invocation = {
              execPath, argv, cwd: opts.cwd,
              env: Object.fromEntries(['NODE_TEST_CONTEXT', 'NODE_OPTIONS', 'UV_THREADPOOL_SIZE', 'TMPDIR', 'FGOS_HOST_BIN']
                .map((key) => [key, opts.env[key] ?? null])),
            };
            nested = spawnSync(execPath, argv, { ...opts, encoding: 'utf8' });
            return nested;
          },
          log: (m) => logs.push(m),
        });
      } finally {
        fs.writeFileSync(acknowledged, '1');
      }
      assert.equal(nested.error, undefined, 'the nested runner must spawn successfully');
      assert.equal(nested.signal, null, 'the nested runner itself must not be killed');
      assert.notEqual(result.status, 0);
      assert.ok(Date.now() - started < 60_000, 'a hung file must not hold the run');
      assert.deepEqual(result.timedOut.map((hit) => hit.file), ['a-hang.test.mjs']);
      assert.match(logs.join('\n'), /a-hang\.test\.mjs: timed out/);
      assert.ok(fs.existsSync(okMarker), 'the other file still ran');
      const grandchildPid = Number(fs.readFileSync(grandchildPidFile, 'utf8'));
      assert.throws(() => process.kill(grandchildPid, 0), { code: 'ESRCH' }, 'the detached grandchild was killed too');
      if (pauseAfterKill) assert.ok(fs.existsSync(killGapMarker), 'the post-kill scheduling gap was exercised');
      assert.equal(fs.existsSync(result.runTemp), false, 'the run temp dir was cleaned up');
    } catch (err) {
      t.diagnostic(JSON.stringify({
        node: process.version, platform: process.platform, parallelism: os.availableParallelism(),
        loadavg: os.loadavg(), freeMemory: os.freemem(), durationMs: Date.now() - started,
        invocation, status: nested?.status, signal: nested?.signal, pid: nested?.pid,
        error: nested?.error && { message: nested.error.message, code: nested.error.code, syscall: nested.error.syscall },
        timedOut: result?.timedOut, logs, otherFileRan: fs.existsSync(okMarker),
      }));
      t.diagnostic(`nested stdout:\n${nested?.stdout ?? '(not captured)'}`);
      t.diagnostic(`nested stderr:\n${nested?.stderr ?? '(not captured)'}`);
      throw err;
    }
  });
}
