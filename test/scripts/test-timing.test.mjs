import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  parseGnuTimeVRaw,
  parseGnuElapsed,
  parseGnuTimeV,
  median,
  minMax,
  hasGnuTimeV,
  gatherEnvironment,
  runOneSample,
  summarizeSamples,
  defaultTimedSpawn,
  isGitClean,
  parseJUnitTestcases,
  runProfile,
  summarizeProfile,
} from '../../scripts/test-timing.mjs';

const SAMPLE_TIME_V_OUTPUT = `\tCommand being timed: "node scripts/run-tests.mjs"
\tUser time (seconds): 2562.22
\tSystem time (seconds): 605.24
\tPercent of CPU this job got: 888%
\tElapsed (wall clock) time (h:mm:ss or m:ss): 5:56.51
\tAverage shared text size (kbytes): 0
\tMaximum resident set size (kbytes): 288088
\tExit status: 0
`;

// --- parseGnuTimeVRaw / parseGnuElapsed / parseGnuTimeV --------------------

test('parseGnuTimeVRaw splits every "Label: value" line into a flat map', () => {
  const raw = parseGnuTimeVRaw(SAMPLE_TIME_V_OUTPUT);
  assert.equal(raw['User time (seconds)'], '2562.22');
  assert.equal(raw['Exit status'], '0');
  assert.equal(raw['Command being timed'], '"node scripts/run-tests.mjs"');
});

test('parseGnuElapsed handles m:ss.ss', () => {
  assert.equal(parseGnuElapsed('5:56.51'), 5 * 60 + 56.51);
});

test('parseGnuElapsed handles h:mm:ss', () => {
  assert.equal(parseGnuElapsed('1:02:03'), 3600 + 2 * 60 + 3);
});

test('parseGnuElapsed returns null on unparsable input rather than throwing', () => {
  assert.equal(parseGnuElapsed('not-a-time'), null);
});

test('parseGnuTimeV extracts user/system/elapsed/rss/exit and labels the CPU scope as process-tree', () => {
  const parsed = parseGnuTimeV(SAMPLE_TIME_V_OUTPUT);
  assert.equal(parsed.userSeconds, 2562.22);
  assert.equal(parsed.systemSeconds, 605.24);
  assert.equal(parsed.elapsedSeconds, 5 * 60 + 56.51);
  assert.equal(parsed.maxRssKb, 288088);
  assert.equal(parsed.exitStatus, 0);
  assert.match(parsed.cpuScope, /process-tree/);
});

test('parseGnuTimeV never throws on empty or garbage input, returns nulls', () => {
  const parsed = parseGnuTimeV('');
  assert.equal(parsed.userSeconds, null);
  assert.equal(parsed.systemSeconds, null);
  assert.equal(parsed.elapsedSeconds, null);
});

// --- median / minMax --------------------------------------------------------

test('median of an odd-length array is the middle value after sorting', () => {
  assert.equal(median([5, 1, 3]), 3);
});

test('median of an even-length array averages the two middle values', () => {
  assert.equal(median([10, 20, 30, 40]), 25);
});

test('minMax reports the extremes regardless of input order', () => {
  assert.deepEqual(minMax([5, 1, 9, 3]), { min: 1, max: 9 });
});

// --- hasGnuTimeV -------------------------------------------------------------

test('hasGnuTimeV reflects the injected existence check, never touches the real filesystem when overridden', () => {
  assert.equal(hasGnuTimeV('/usr/bin/time', () => true), true);
  assert.equal(hasGnuTimeV('/usr/bin/time', () => false), false);
});

// --- isGitClean: symlinked build-artifact directories don't count as dirty ---

test('isGitClean is true on a genuinely empty git status', () => {
  assert.equal(isGitClean('/fake/cwd', () => ''), true);
});

test('isGitClean ignores the bare "?? node_modules" and "?? target" symlink entries this track deliberately creates', () => {
  assert.equal(isGitClean('/fake/cwd', () => '?? node_modules\n?? target\n'), true);
});

test('isGitClean still reports dirty for a real untracked directory with the same name shown WITH a trailing slash', () => {
  assert.equal(isGitClean('/fake/cwd', () => '?? target/\n'), false);
});

test('isGitClean still reports dirty for any real change alongside the symlink entries', () => {
  assert.equal(isGitClean('/fake/cwd', () => '?? node_modules\n?? target\n M src/foo.mjs\n'), false);
});

// --- gatherEnvironment -------------------------------------------------------

test('gatherEnvironment reports sha/node/platform/arch/cpuCount/loadavg from injected collaborators', () => {
  const env = gatherEnvironment({
    exec: () => 'deadbeef\n',
    loadavg: () => [1.1, 2.2, 3.3],
    cpus: () => [{}, {}, {}, {}],
  });
  assert.equal(env.sha, 'deadbeef');
  assert.equal(env.node, process.version);
  assert.equal(env.platform, process.platform);
  assert.equal(env.cpuCount, 4);
  assert.deepEqual(env.loadavg, [1.1, 2.2, 3.3]);
  assert.ok(!Number.isNaN(Date.parse(env.timestamp)));
});

// --- runOneSample: adversarial checks (mocked spawn, no real suite run) ----

test('runOneSample marks a sample invalid when the snapshot was dirty before the run, even if the command exits 0', () => {
  const sample = runOneSample({
    hasTime: false,
    spawn: () => ({ status: 0 }),
    checkClean: () => false,
    environment: () => ({}),
  });
  assert.equal(sample.status, 0);
  assert.equal(sample.before.clean, false);
  assert.equal(sample.valid, false, 'a dirty-before-run snapshot must invalidate the sample even on a clean exit');
});

test('runOneSample marks a sample invalid when the snapshot went dirty DURING the run (before was clean, after is not)', () => {
  let call = 0;
  const sample = runOneSample({
    hasTime: false,
    spawn: () => ({ status: 0 }),
    checkClean: () => {
      call += 1;
      return call === 1; // clean before, dirty after
    },
    environment: () => ({}),
  });
  assert.equal(sample.before.clean, true);
  assert.equal(sample.after.clean, false);
  assert.equal(sample.valid, false);
});

test('runOneSample is valid when the exit is 0 and the snapshot is clean both before and after', () => {
  const sample = runOneSample({
    hasTime: false,
    spawn: () => ({ status: 0 }),
    checkClean: () => true,
    environment: () => ({}),
  });
  assert.equal(sample.valid, true);
});

test('runOneSample marks a sample invalid on a non-zero exit status (a failed run must never count toward a median)', () => {
  const sample = runOneSample({
    hasTime: false,
    spawn: () => ({ status: 1 }),
    checkClean: () => true,
    environment: () => ({}),
  });
  assert.equal(sample.status, 1);
  assert.equal(sample.valid, false);
});

test('runOneSample with GNU time available parses userSeconds/systemSeconds/maxRssKb from the wrapped child\'s stderr', () => {
  const sample = runOneSample({
    hasTime: true,
    timedSpawn: () => ({ status: 0, stderr: SAMPLE_TIME_V_OUTPUT, stdoutPath: '/tmp/fake-stdout.log', stderrPath: '/tmp/fake-stderr.log' }),
    checkClean: () => true,
    environment: () => ({}),
  });
  assert.equal(sample.userSeconds, 2562.22);
  assert.equal(sample.systemSeconds, 605.24);
  assert.equal(sample.maxRssKb, 288088);
  assert.match(sample.cpuScope, /process-tree/);
  assert.equal(sample.stdoutPath, '/tmp/fake-stdout.log');
});

test('runOneSample never asks the real spawn to buffer child output in JS memory for the GNU-time path (uses file-descriptor redirection, not encoding:"utf8" pipes)', () => {
  // Regression proof for a real bug caught during P02: spawnSync's default
  // 1MB maxBuffer would silently truncate/error a real ~6500-test run's
  // stdout if it were captured as an in-memory string. defaultTimedSpawn
  // must never be handed opts requesting string-encoded buffered stdio.
  let capturedOpts = null;
  runOneSample({
    hasTime: true,
    timedSpawn: (opts) => {
      capturedOpts = opts;
      return { status: 0, stderr: SAMPLE_TIME_V_OUTPUT };
    },
    checkClean: () => true,
    environment: () => ({}),
  });
  assert.ok(capturedOpts, 'timedSpawn must be invoked on the hasTime path');
  assert.equal(capturedOpts.encoding, undefined, 'must not request buffered string encoding');
});

test('runOneSample without GNU time reports wall-clock only and an explicit "unavailable" CPU scope -- never a fabricated CPU number', () => {
  const sample = runOneSample({
    hasTime: false,
    spawn: () => ({ status: 0 }),
    checkClean: () => true,
    environment: () => ({}),
  });
  assert.equal(sample.userSeconds, null);
  assert.equal(sample.systemSeconds, null);
  assert.match(sample.cpuScope, /unavailable/);
  assert.ok(sample.wallSeconds >= 0);
});

// --- summarizeSamples: invalid samples must never silently average in -----

test('summarizeSamples computes median/min/max wall time over valid samples', () => {
  const summary = summarizeSamples([
    { valid: true, wallSeconds: 10 },
    { valid: true, wallSeconds: 20 },
    { valid: true, wallSeconds: 30 },
  ]);
  assert.equal(summary.sampleCount, 3);
  assert.equal(summary.wallMedianSeconds, 20);
  assert.deepEqual(summary.wall, { min: 10, max: 30 });
});

// --- parseJUnitTestcases / summarizeProfile: R3/R6 profile parsing --------

const SAMPLE_JUNIT_XML = `<?xml version="1.0" encoding="utf-8"?>
<testsuites>
\t<testcase name="fast one" time="0.003150" classname="test" file="/repo/test/cli/a.test.mjs"/>
\t<testcase name="slow one" time="1.500000" classname="test" file="/repo/test/cli/a.test.mjs"/>
\t<testcase name="state test" time="0.500000" classname="test" file="/repo/test/state/store.test.mjs"/>
\t<testcase name="root test" time="0.010000" classname="test" file="/repo/test/architecture.test.mjs"/>
</testsuites>
`;

test('parseJUnitTestcases extracts name/time/file from every self-closing testcase tag, attribute order notwithstanding', () => {
  const testcases = parseJUnitTestcases(SAMPLE_JUNIT_XML);
  assert.equal(testcases.length, 4);
  assert.deepEqual(testcases[1], { name: 'slow one', time: 1.5, file: '/repo/test/cli/a.test.mjs' });
});

test('parseJUnitTestcases skips a malformed tag missing time/file rather than fabricating a value', () => {
  const testcases = parseJUnitTestcases('<testcase name="broken" classname="test"/>\n' + SAMPLE_JUNIT_XML);
  assert.equal(testcases.length, 4, 'the malformed leading tag must be skipped, not counted');
});

test('parseJUnitTestcases returns an empty array for empty or non-matching input', () => {
  assert.deepEqual(parseJUnitTestcases(''), []);
  assert.deepEqual(parseJUnitTestcases('<testsuites></testsuites>'), []);
});

test('summarizeProfile ranks top tests by time descending', () => {
  const { topTests } = summarizeProfile(parseJUnitTestcases(SAMPLE_JUNIT_XML), { topN: 2 });
  assert.equal(topTests.length, 2);
  assert.equal(topTests[0].name, 'slow one');
  assert.equal(topTests[1].name, 'state test');
});

test('summarizeProfile sums per-file totals and ranks files descending', () => {
  const { topFiles } = summarizeProfile(parseJUnitTestcases(SAMPLE_JUNIT_XML));
  const a = topFiles.find((f) => f.file === '/repo/test/cli/a.test.mjs');
  assert.ok(a);
  assert.ok(Math.abs(a.totalSeconds - 1.50315) < 1e-9);
  assert.equal(a.count, 2);
  assert.equal(topFiles[0].file, '/repo/test/cli/a.test.mjs', 'the file with the higher total must rank first');
});

test('summarizeProfile groups directory totals by the first path segment under test/, with a root bucket for direct test/*.test.mjs files', () => {
  const { directoryTotals } = summarizeProfile(parseJUnitTestcases(SAMPLE_JUNIT_XML));
  const cli = directoryTotals.find((d) => d.dir === 'cli');
  const state = directoryTotals.find((d) => d.dir === 'state');
  const root = directoryTotals.find((d) => d.dir === '(test root)');
  assert.ok(cli && Math.abs(cli.totalSeconds - 1.50315) < 1e-9);
  assert.ok(state && Math.abs(state.totalSeconds - 0.5) < 1e-9);
  assert.ok(root && Math.abs(root.totalSeconds - 0.01) < 1e-9);
});

test('summarizeProfile never enforces or reports a timing threshold verdict -- R6 explicitly leaves that to a later pilot cell', () => {
  const summary = summarizeProfile(parseJUnitTestcases(SAMPLE_JUNIT_XML));
  assert.deepEqual(Object.keys(summary).sort(), ['directoryTotals', 'topFiles', 'topTests']);
});

// --- runProfile: wiring between runOneSample and the JUnit parser ---------

test('runProfile forwards a --test-reporter=junit destination pointing at logDir/junit.xml, and reads back real testcases from the file the (mocked) child actually wrote', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-timing-profile-'));
  let capturedForwardedArgs = null;
  const profile = runProfile({
    logDir: dir,
    hasTime: false,
    checkClean: () => true,
    environment: () => ({}),
    spawn: (execPath, argv) => {
      capturedForwardedArgs = argv;
      // Simulates the real `node --test --test-reporter=junit
      // --test-reporter-destination=<path>` child actually writing its
      // report file before exiting 0.
      const destFlag = argv.find((a) => a.startsWith('--test-reporter-destination='));
      fs.writeFileSync(destFlag.slice('--test-reporter-destination='.length), SAMPLE_JUNIT_XML);
      return { status: 0 };
    },
  });

  assert.equal(profile.valid, true);
  assert.ok(capturedForwardedArgs.includes('--test-reporter=junit'));
  assert.equal(profile.junitPath, path.join(dir, 'junit.xml'));
  assert.equal(profile.testcases.length, 4);
});

test('runProfile returns an empty testcases array (never throws) when the run is invalid', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-timing-profile-'));
  const profile = runProfile({
    logDir: dir,
    hasTime: false,
    checkClean: () => true,
    environment: () => ({}),
    spawn: () => ({ status: 1 }),
  });
  assert.equal(profile.valid, false);
  assert.deepEqual(profile.testcases, []);
});

// --- defaultTimedSpawn: real integration, past spawnSync's 1MB default buffer ---

test('defaultTimedSpawn survives a child that writes well past spawnSync\'s default 1MB maxBuffer to stdout, and still parses stderr', { skip: !hasGnuTimeV() }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-timing-integration-'));
  const bigScript = path.join(dir, 'big-stdout.mjs');
  // 2 million bytes of stdout -- well past the 1MB default maxBuffer that
  // bit the pre-fix version of runOneSample against the real ~6500-test
  // suite's own output volume.
  fs.writeFileSync(bigScript, "process.stdout.write('x'.repeat(2_000_000) + '\\n'); process.exit(0);\n");

  const result = defaultTimedSpawn({
    execPath: process.execPath,
    scriptPath: bigScript,
    forwardedArgs: [],
    cwd: dir,
    env: process.env,
    timeBinary: '/usr/bin/time',
    logDir: dir,
  });

  assert.equal(result.status, 0, 'a large-stdout child must not be killed/errored by buffer limits');
  assert.ok(fs.existsSync(result.stdoutPath));
  assert.equal(fs.statSync(result.stdoutPath).size, 2_000_001);
  const parsed = parseGnuTimeV(result.stderr);
  assert.equal(parsed.exitStatus, 0);
  assert.ok(parsed.elapsedSeconds !== null);
});

test('summarizeSamples throws rather than averaging when any sample is invalid', () => {
  assert.throws(
    () =>
      summarizeSamples([
        { valid: true, wallSeconds: 10 },
        { valid: false, wallSeconds: 999 },
      ]),
    /invalid/,
  );
});
