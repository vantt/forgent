import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  parseCanaryArgs,
  readCanaryFileList,
  resolveCanaryFiles,
  runCanary,
} from '../../scripts/run-test-canary.mjs';

function tmpFixtureRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'run-test-canary-fixture-'));
}

function write(root, relPath, content = "import { test } from 'node:test';\ntest('ok', () => {});\n") {
  const full = path.join(root, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return full;
}

// --- parseCanaryArgs: positional/flag/from-file split -----------------------

test('parseCanaryArgs splits positional files from flag-shaped forwarded args', () => {
  const { files, forwardedArgs, fromFile } = parseCanaryArgs(['test/a.test.mjs', '--test-reporter=tap', 'test/b.test.mjs']);
  assert.deepEqual(files, ['test/a.test.mjs', 'test/b.test.mjs']);
  assert.deepEqual(forwardedArgs, ['--test-reporter=tap']);
  assert.equal(fromFile, null);
});

test('parseCanaryArgs consumes --from-file and its value, never treating the value as a file or flag', () => {
  const { files, forwardedArgs, fromFile } = parseCanaryArgs(['--from-file', '/tmp/list.txt', '--concurrency=1']);
  assert.deepEqual(files, []);
  assert.deepEqual(forwardedArgs, ['--concurrency=1']);
  assert.equal(fromFile, '/tmp/list.txt');
});

// --- readCanaryFileList -------------------------------------------------

test('readCanaryFileList ignores blank lines and #-comment lines', () => {
  const root = tmpFixtureRoot();
  const listPath = path.join(root, 'list.txt');
  fs.writeFileSync(listPath, '\ntest/a.test.mjs\n# a comment\n\ntest/b.test.mjs\n');
  assert.deepEqual(readCanaryFileList(listPath), ['test/a.test.mjs', 'test/b.test.mjs']);
});

test('readCanaryFileList returns [] (never throws) for a missing file', () => {
  assert.deepEqual(readCanaryFileList('/nonexistent/path/list.txt'), []);
});

// --- R2/proof-1: empty canary set refuses -----------------------------------

test('an empty canary set (no positional args, no --from-file) refuses without spawning anything', () => {
  const root = tmpFixtureRoot();
  let spawnCalled = false;
  const result = runCanary({
    rawArgs: [],
    testRoot: root,
    cwd: root,
    spawn: () => {
      spawnCalled = true;
      return { status: 0 };
    },
  });
  assert.equal(result.status, 1);
  assert.equal(result.fullSuiteRan, false);
  assert.equal(spawnCalled, false, 'a no-argument call must never spawn anything, never an implicit full run');
  assert.match(result.message, /no canary files given/);
});

test('a --from-file pointing at a missing file also refuses without spawning (empty resolved set)', () => {
  const root = tmpFixtureRoot();
  let spawnCalled = false;
  const result = runCanary({
    rawArgs: ['--from-file', path.join(root, 'does-not-exist.txt')],
    testRoot: root,
    cwd: root,
    spawn: () => {
      spawnCalled = true;
      return { status: 0 };
    },
  });
  assert.equal(result.status, 1);
  assert.equal(spawnCalled, false);
});

// --- proof-2: missing/outside/symlink-escape path refuses -------------------

test('resolveCanaryFiles rejects a missing path', () => {
  const root = tmpFixtureRoot();
  const { valid, invalid } = resolveCanaryFiles(['nope.test.mjs'], { testRoot: root, cwd: root });
  assert.deepEqual(valid, []);
  assert.equal(invalid.length, 1);
  assert.equal(invalid[0].reason, 'missing');
});

test('resolveCanaryFiles rejects a path outside the test root via explicit traversal', () => {
  const root = tmpFixtureRoot();
  const outside = tmpFixtureRoot();
  const f = write(outside, 'evil.test.mjs');
  const { valid, invalid } = resolveCanaryFiles([f], { testRoot: root, cwd: root });
  assert.deepEqual(valid, []);
  assert.equal(invalid.length, 1);
  assert.match(invalid[0].reason, /outside test root/);
});

test('resolveCanaryFiles rejects a symlink whose real target escapes the test root', () => {
  const root = tmpFixtureRoot();
  const outside = tmpFixtureRoot();
  write(outside, 'real.test.mjs');
  const linkPath = path.join(root, 'escape.test.mjs');
  fs.symlinkSync(path.join(outside, 'real.test.mjs'), linkPath, 'file');
  const { valid, invalid } = resolveCanaryFiles([linkPath], { testRoot: root, cwd: root });
  assert.deepEqual(valid, []);
  assert.equal(invalid.length, 1);
  assert.match(invalid[0].reason, /outside test root/);
});

test('resolveCanaryFiles rejects a path not ending in .test.mjs', () => {
  const root = tmpFixtureRoot();
  const f = write(root, 'not-a-test.mjs');
  const { valid, invalid } = resolveCanaryFiles([f], { testRoot: root, cwd: root });
  assert.deepEqual(valid, []);
  assert.match(invalid[0].reason, /does not end in \.test\.mjs/);
});

test('resolveCanaryFiles rejects a directory even if its name ends in .test.mjs', () => {
  const root = tmpFixtureRoot();
  fs.mkdirSync(path.join(root, 'dir.test.mjs'));
  const { valid, invalid } = resolveCanaryFiles([path.join(root, 'dir.test.mjs')], { testRoot: root, cwd: root });
  assert.deepEqual(valid, []);
  assert.match(invalid[0].reason, /not a file/);
});

test('one invalid path among several refuses the WHOLE set, not just the bad one (fail-safe, never a silently-narrowed run)', () => {
  const root = tmpFixtureRoot();
  const good = write(root, 'good.test.mjs');
  let spawnCalled = false;
  const result = runCanary({
    rawArgs: [good, path.join(root, 'missing.test.mjs')],
    testRoot: root,
    cwd: root,
    spawn: () => {
      spawnCalled = true;
      return { status: 0 };
    },
  });
  assert.equal(result.status, 1);
  assert.equal(spawnCalled, false);
  assert.equal(result.invalid.length, 1);
});

// --- proof-3: duplicates collapse deterministically -------------------------

test('resolveCanaryFiles collapses the same file given twice (same string) to one entry', () => {
  const root = tmpFixtureRoot();
  const f = write(root, 'a.test.mjs');
  const { valid } = resolveCanaryFiles([f, f], { testRoot: root, cwd: root });
  assert.deepEqual(valid, [f]);
});

test('resolveCanaryFiles collapses a real path and a symlink to the same real file into one entry', () => {
  const root = tmpFixtureRoot();
  const real = write(root, 'real.test.mjs');
  const linkPath = path.join(root, 'linked.test.mjs');
  fs.symlinkSync(real, linkPath, 'file');
  const { valid } = resolveCanaryFiles([real, linkPath], { testRoot: root, cwd: root });
  assert.equal(valid.length, 1);
});

test('resolveCanaryFiles returns a sorted, deterministic order regardless of input order', () => {
  const root = tmpFixtureRoot();
  const b = write(root, 'b.test.mjs');
  const a = write(root, 'a.test.mjs');
  const { valid } = resolveCanaryFiles([b, a], { testRoot: root, cwd: root });
  assert.deepEqual(valid, [a, b].sort());
});

// --- proof-4: failing canary prevents full invocation -----------------------

test('a red canary returns its own status and NEVER invokes the full-suite spawn', () => {
  const root = tmpFixtureRoot();
  const f = write(root, 'a.test.mjs');
  write(root, 'unrelated.test.mjs'); // would be part of a full-suite discovery if it ever ran
  let spawnCallCount = 0;
  const result = runCanary({
    rawArgs: [f],
    testRoot: root,
    cwd: root,
    spawn: () => {
      spawnCallCount += 1;
      return { status: 1 }; // canary fails
    },
  });
  assert.equal(result.status, 1);
  assert.equal(result.fullSuiteRan, false);
  assert.equal(spawnCallCount, 1, 'only the canary spawn happened, never a second (full-suite) spawn');
  assert.match(result.message, /canary red/);
});

// --- proof-5: green canary invokes full suite exactly once ------------------

test('a green canary invokes the full-suite spawn exactly once, not twice, not zero times', () => {
  const root = tmpFixtureRoot();
  const f = write(root, 'a.test.mjs');
  write(root, 'unrelated.test.mjs');
  const calls = [];
  const result = runCanary({
    rawArgs: [f],
    testRoot: root,
    cwd: root,
    spawn: (execPath, argv) => {
      calls.push(argv);
      return { status: 0 };
    },
  });
  assert.equal(result.status, 0);
  assert.equal(result.fullSuiteRan, true);
  assert.equal(calls.length, 2, 'exactly one canary spawn + one full-suite spawn');
  // second call is the full-suite invocation: it must include BOTH files.
  const fullCallArgv = calls[1];
  assert.ok(fullCallArgv.some((a) => a.endsWith('a.test.mjs')));
  assert.ok(fullCallArgv.some((a) => a.endsWith('unrelated.test.mjs')));
  assert.equal(result.fullFileCount, 2);
});

test('canary files are intentionally re-run inside the full suite (documented, not a bug)', () => {
  const root = tmpFixtureRoot();
  const f = write(root, 'a.test.mjs');
  const calls = [];
  const result = runCanary({
    rawArgs: [f],
    testRoot: root,
    cwd: root,
    spawn: (execPath, argv) => {
      calls.push(argv);
      return { status: 0 };
    },
  });
  assert.equal(calls[0].some((a) => a.endsWith('a.test.mjs')), true, 'canary run includes a.test.mjs');
  assert.equal(calls[1].some((a) => a.endsWith('a.test.mjs')), true, 'full run includes it again');
  assert.match(result.message, /intentionally re-run/);
});

// --- proof-6: forwarded args cannot replace selected files -----------------

test('a forwarded flag never becomes a canary file, and never leaks into the full-suite spawn', () => {
  const root = tmpFixtureRoot();
  const f = write(root, 'a.test.mjs');
  const calls = [];
  const result = runCanary({
    rawArgs: [f, '--test-reporter=tap'],
    testRoot: root,
    cwd: root,
    spawn: (execPath, argv) => {
      calls.push(argv);
      return { status: 0 };
    },
  });
  assert.equal(result.canaryFiles.length, 1, 'the reporter flag did not become a second canary file');
  assert.ok(calls[0].includes('--test-reporter=tap'), 'canary run received the forwarded flag');
  assert.ok(!calls[1].includes('--test-reporter=tap'), 'the full-suite run is unchanged -- it never receives canary-only forwarded flags');
});

// --- proof-7: no shell-string / glob interpolation --------------------------

test('spawn always receives argv as a literal array, never a shell command string', () => {
  const root = tmpFixtureRoot();
  const f = write(root, 'a.test.mjs');
  let sawArrayArgv = true;
  runCanary({
    rawArgs: [f],
    testRoot: root,
    cwd: root,
    spawn: (execPath, argv) => {
      if (!Array.isArray(argv)) sawArrayArgv = false;
      return { status: 0 };
    },
  });
  assert.equal(sawArrayArgv, true);
});

// --- performance acceptance ---------------------------------------------

test('wrapper overhead (validation + orchestration, excluding actual test execution) has a median under 250ms over 10 injected-spawn runs', () => {
  const root = tmpFixtureRoot();
  const f = write(root, 'a.test.mjs');
  write(root, 'unrelated.test.mjs');
  const samples = [];
  for (let i = 0; i < 10; i += 1) {
    const start = process.hrtime.bigint();
    runCanary({
      rawArgs: [f],
      testRoot: root,
      cwd: root,
      spawn: () => ({ status: 0 }), // instant, isolates wrapper overhead from real test execution
    });
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
    samples.push(elapsedMs);
  }
  samples.sort((a, b) => a - b);
  const median = samples[Math.floor(samples.length / 2)];
  assert.ok(median < 250, `median wrapper overhead ${median.toFixed(2)}ms must be under 250ms (samples: ${samples.map((s) => s.toFixed(2)).join(', ')})`);
});

test('a failing canary demonstrably returns before a full-suite run would even start (full spawn never called)', () => {
  const root = tmpFixtureRoot();
  const f = write(root, 'a.test.mjs');
  let fullSuiteSpawnHappened = false;
  const result = runCanary({
    rawArgs: [f],
    testRoot: root,
    cwd: root,
    spawn: (execPath, argv) => {
      // A real full-suite invocation would include more than just the canary file.
      if (argv.length > 2) fullSuiteSpawnHappened = true;
      return { status: 1 };
    },
  });
  assert.equal(result.status, 1);
  assert.equal(fullSuiteSpawnHappened, false);
});

// --- Integration: the script's own CLI entrypoint, spawned for real --------

test('the script itself, spawned as a real process, refuses over zero args with a non-zero exit and JSON output', () => {
  const root = tmpFixtureRoot();
  const scriptPath = fileURLToPath(new URL('../../scripts/run-test-canary.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [scriptPath], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 1);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.phase, 'validation');
});

test('the script itself, spawned for real, runs a green canary then the real full suite over a tiny fixture tree', () => {
  const root = tmpFixtureRoot();
  const f = write(root, 'ok.test.mjs');
  write(root, 'other.test.mjs');
  const scriptPath = fileURLToPath(new URL('../../scripts/run-test-canary.mjs', import.meta.url));
  const driver = path.join(root, 'drive.mjs');
  fs.writeFileSync(
    driver,
    `import { runCanary } from ${JSON.stringify(scriptPath)};\n` +
      `const result = runCanary({ rawArgs: [${JSON.stringify(f)}], testRoot: ${JSON.stringify(root)}, cwd: ${JSON.stringify(root)}, stdio: 'ignore' });\n` +
      'console.log(JSON.stringify(result));\n' +
      'process.exitCode = result.status;\n',
  );
  const result = spawnSync(process.execPath, [driver], { encoding: 'utf8' });
  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.fullSuiteRan, true);
  assert.equal(parsed.fullFileCount, 2);
});
