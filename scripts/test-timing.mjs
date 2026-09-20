#!/usr/bin/env node
// test-timing.mjs -- P02 green-baseline instrumentation (TFC-D05). Wraps
// scripts/run-tests.mjs's full-suite invocation with environment capture
// (SHA, Node, OS, CPU count, load) and, when GNU `time -v` is present on
// this platform, wall/user/system CPU + peak RSS. GNU time's `-v` fields
// are the reporting *process tree's* cumulative rusage (via wait4 on
// reaped children), not a single-process number -- labeled that way
// throughout, never overstated as more precise than it is. On a platform
// without `/usr/bin/time -v` (no BSD `time` fallback attempted: its output
// shape differs and silently degrading to wall-clock-only, explicitly
// labeled, is more honest than guessing at a parse), only wall-clock time
// is recorded and user/system CPU are reported as unavailable.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { REPO_ROOT } from './run-tests.mjs';

// Untracked build-artifact directories this track's worktrees deliberately
// symlink in from the main checkout for fast dependency/binary reuse
// (node_modules, and a Rust `target/` symlink so rust-host tests find a
// prebuilt binary without a from-scratch cargo build per worktree). Both
// have a repo `.gitignore` entry, but only as a directory pattern (e.g.
// `/target/`), which does not match a SYMLINK to a directory -- `git
// status --porcelain` reports it as a bare untracked entry (`?? target`,
// no trailing slash, unlike `?? target/` for a genuinely untracked real
// directory with content). Excluded here by exact match only, so a real
// dirty file nested under either name (which always shows as its own
// distinct porcelain line, never collapsed into this bare form) still
// fails the clean check.
const SYMLINKED_BUILD_ARTIFACT_ENTRIES = new Set(['?? node_modules', '?? target']);

export function isGitClean(cwd = REPO_ROOT, exec = execFileSync, { allowedPrefixes = [] } = {}) {
  const lines = exec('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' })
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (trimmed === '') return false;
      if (SYMLINKED_BUILD_ARTIFACT_ENTRIES.has(trimmed)) return false;
      if (trimmed.startsWith('?? ')) {
        const untracked = trimmed.slice(3).trim();
        const cleanUntracked = untracked.replace(/\/+$/, '');
        for (const prefix of allowedPrefixes) {
          const cleanPrefix = prefix.replace(/\/+$/, '');
          if (cleanPrefix === cleanUntracked || cleanPrefix.startsWith(cleanUntracked + '/') || cleanUntracked.startsWith(cleanPrefix + '/')) {
            return false;
          }
        }
      }
      return true;
    });
  return lines.length === 0;
}

export function gitHead(cwd = REPO_ROOT, exec = execFileSync) {
  return exec('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim();
}

export function hasGnuTimeV(binary = '/usr/bin/time', exists = fs.existsSync, spawn = spawnSync) {
  if (!exists(binary)) return false;
  const result = spawn(binary, ['-v', 'true'], { encoding: 'utf8' });
  return result.status === 0 && /Maximum resident set size/.test(result.stderr ?? '');
}

export function gatherEnvironment({ cwd = REPO_ROOT, loadavg = os.loadavg, cpus = os.cpus, exec = execFileSync } = {}) {
  return {
    sha: gitHead(cwd, exec),
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    cpuCount: cpus().length,
    loadavg: loadavg(),
    timestamp: new Date().toISOString(),
  };
}

// Parses one GNU `time -v` stderr block into a flat { label: rawValue }
// map. Pure and independently testable against a canned string -- no real
// `/usr/bin/time` invocation required.
export function parseGnuTimeVRaw(output) {
  const map = {};
  for (const line of output.split('\n')) {
    // GNU time's own field NAMES can embed colons (e.g. "Elapsed (wall
    // clock) time (h:mm:ss or m:ss)"), so the real label/value separator
    // is the LAST ": " (colon-space), never the first bare colon.
    const idx = line.lastIndexOf(': ');
    if (idx === -1) continue;
    const label = line.slice(0, idx).trim();
    const value = line.slice(idx + 2).trim();
    if (!label) continue;
    map[label] = value;
  }
  return map;
}

// "H:MM:SS" or "M:SS.ss" -> seconds (GNU time's own documented elapsed
// format -- hours segment present only when the run exceeds an hour).
export function parseGnuElapsed(raw) {
  const parts = raw.split(':').map(Number);
  if (parts.some((n) => Number.isNaN(n))) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] ?? null;
}

export function parseGnuTimeV(output) {
  const raw = parseGnuTimeVRaw(output);
  const userSeconds = raw['User time (seconds)'] !== undefined ? Number(raw['User time (seconds)']) : null;
  const systemSeconds = raw['System time (seconds)'] !== undefined ? Number(raw['System time (seconds)']) : null;
  const elapsedRaw = raw['Elapsed (wall clock) time (h:mm:ss or m:ss)'] ?? null;
  const maxRssKb = raw['Maximum resident set size (kbytes)'] !== undefined ? Number(raw['Maximum resident set size (kbytes)']) : null;
  const exitStatus = raw['Exit status'] !== undefined ? Number(raw['Exit status']) : null;
  return {
    userSeconds,
    systemSeconds,
    elapsedSeconds: elapsedRaw ? parseGnuElapsed(elapsedRaw) : null,
    maxRssKb,
    exitStatus,
    cpuScope: 'process-tree (GNU time -v wait4 rusage, includes reaped descendants)',
  };
}

export function median(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function minMax(numbers) {
  return { min: Math.min(...numbers), max: Math.max(...numbers) };
}

// Real GNU-time-wrapped invocation used by runOneSample's default. Never
// asks spawnSync to buffer the child's stdout/stderr in JS memory --
// node --test's own text output across thousands of tests can run well
// past spawnSync's default 1MB maxBuffer, which would silently truncate
// or error out a real baseline run. Both streams are redirected straight
// to real file descriptors instead: stdout becomes a retained log
// artifact, and stderr (GNU time -v's own small ~20-line block) is read
// back afterward for parsing.
export function defaultTimedSpawn({ execPath, scriptPath, forwardedArgs, cwd, env, timeBinary, logDir }) {
  const dir = logDir ?? fs.mkdtempSync(path.join(os.tmpdir(), 'test-timing-'));
  fs.mkdirSync(dir, { recursive: true });
  const stdoutPath = path.join(dir, 'stdout.log');
  const stderrPath = path.join(dir, 'stderr.log');
  const stdoutFd = fs.openSync(stdoutPath, 'w');
  const stderrFd = fs.openSync(stderrPath, 'w');
  let result;
  try {
    result = spawnSync(timeBinary, ['-v', execPath, scriptPath, ...forwardedArgs], { cwd, env, stdio: ['ignore', stdoutFd, stderrFd] });
  } finally {
    fs.closeSync(stdoutFd);
    fs.closeSync(stderrFd);
  }
  return { status: result.status, stderr: fs.readFileSync(stderrPath, 'utf8'), stdoutPath, stderrPath };
}

/**
 * Runs the full suite ONCE via `node scripts/run-tests.mjs`, as its own
 * child process (never in-process) so an available `/usr/bin/time -v`
 * wraps the whole subtree. Returns a plain sample record; never throws on
 * a failing run -- the caller decides whether a failing/dirty sample is
 * valid (R2/Adversarial: a failed or interrupted run must never be folded
 * into a median).
 */
export function runOneSample({
  cwd = REPO_ROOT,
  forwardedArgs = [],
  spawn = spawnSync,
  timedSpawn = defaultTimedSpawn,
  hasTime = hasGnuTimeV(),
  timeBinary = '/usr/bin/time',
  env = process.env,
  checkClean,
  environment = () => gatherEnvironment({ cwd }),
  logDir,
} = {}) {
  const relLogDir = logDir ? path.relative(cwd, path.resolve(cwd, logDir)) : null;
  const isInternalLogDir = relLogDir && !relLogDir.startsWith('..') && !path.isAbsolute(relLogDir);
  const parentArtifactsDir = isInternalLogDir ? path.dirname(relLogDir) : null;
  const logDirPrefixes = isInternalLogDir ? [relLogDir, parentArtifactsDir].filter(Boolean) : [];

  const defaultCheck = (opts = {}) => isGitClean(cwd, execFileSync, opts);
  const checkSnapshot = checkClean ?? defaultCheck;

  const before = { clean: checkSnapshot({ allowedPrefixes: logDirPrefixes }), env: environment() };
  const startNs = process.hrtime.bigint();

  let result;
  let gnuTime = null;
  if (hasTime) {
    result = timedSpawn({
      execPath: process.execPath,
      scriptPath: path.join(cwd, 'scripts', 'run-tests.mjs'),
      forwardedArgs,
      cwd,
      env,
      timeBinary,
      logDir,
    });
    gnuTime = parseGnuTimeV(result.stderr ?? '');
  } else {
    result = spawn(process.execPath, [path.join(cwd, 'scripts', 'run-tests.mjs'), ...forwardedArgs], { cwd, env, stdio: 'inherit' });
  }

  const wallSeconds = Number(process.hrtime.bigint() - startNs) / 1e9;
  const after = { clean: checkSnapshot({ allowedPrefixes: logDirPrefixes }) };

  return {
    status: result.status ?? 1,
    wallSeconds,
    userSeconds: gnuTime?.userSeconds ?? null,
    systemSeconds: gnuTime?.systemSeconds ?? null,
    maxRssKb: gnuTime?.maxRssKb ?? null,
    cpuScope: gnuTime?.cpuScope ?? 'unavailable (no /usr/bin/time -v on this platform; wall-clock only)',
    stdoutPath: result.stdoutPath ?? null,
    stderrPath: result.stderrPath ?? null,
    before,
    after,
    valid: (result.status ?? 1) === 0 && before.clean && after.clean,
  };
}

// --- R3/R6: separate profile run, per-test/file machine-readable data -----

/**
 * Extracts every `<testcase name=".." time=".." classname=".." file=".."/>`
 * self-closing element Node's own `--test-reporter=junit` emits (this
 * repo's own retained baseline artifact,
 * plans/reports/artifacts/260915-npm-test-baseline-224f0803/junit.xml, is
 * the reference shape). A small regex extraction, not a full XML parser
 * (KISS): the reporter's own output is flat, self-closing, and this
 * function only reads the three attributes it needs -- attribute ORDER is
 * never assumed, only that all three are present on the tag.
 */
export function parseJUnitTestcases(xml) {
  const testcases = [];
  const tagRe = /<testcase\b([^>]*?)\/>/g;
  let m;
  while ((m = tagRe.exec(xml)) !== null) {
    const attrs = m[1];
    const name = attrs.match(/\bname="([^"]*)"/)?.[1] ?? null;
    const timeRaw = attrs.match(/\btime="([^"]*)"/)?.[1] ?? null;
    const file = attrs.match(/\bfile="([^"]*)"/)?.[1] ?? null;
    if (timeRaw === null || file === null) continue; // malformed/incomplete tag -- skip rather than fabricate
    testcases.push({ name, time: Number(timeRaw), file });
  }
  return testcases;
}

/**
 * Runs the full suite once more with a JUnit reporter, retaining the raw
 * XML as a machine-readable artifact (R3). Never folded into the 3-sample
 * wall-time median -- the reporter itself adds overhead the plain samples
 * must stay free of (Adversarial: "profiling overhead mixed into baseline
 * samples").
 */
export function runProfile({ logDir, junitPath, ...rest } = {}) {
  const dir = logDir ?? fs.mkdtempSync(path.join(os.tmpdir(), 'test-timing-profile-'));
  fs.mkdirSync(dir, { recursive: true });
  const resolvedJunitPath = junitPath ?? path.join(dir, 'junit.xml');
  const sample = runOneSample({
    ...rest,
    logDir: dir,
    forwardedArgs: ['--test-reporter=junit', `--test-reporter-destination=${resolvedJunitPath}`, ...(rest.forwardedArgs ?? [])],
  });
  const testcases = sample.valid && fs.existsSync(resolvedJunitPath) ? parseJUnitTestcases(fs.readFileSync(resolvedJunitPath, 'utf8')) : [];
  return { ...sample, junitPath: resolvedJunitPath, testcases };
}

/**
 * Top-N slowest individual tests, top-N slowest files (summed test time per
 * file), and per-directory (first path segment under `test/`) totals --
 * R6's "top files/tests and directory totals", deliberately with no
 * enforced timing threshold (a later pilot cell registers its own
 * threshold against this data, per the Measurement Contract).
 */
export function summarizeProfile(testcases, { topN = 20 } = {}) {
  const byFile = new Map();
  const byDir = new Map();
  for (const tc of testcases) {
    const fileEntry = byFile.get(tc.file) ?? { file: tc.file, totalSeconds: 0, count: 0 };
    fileEntry.totalSeconds += tc.time;
    fileEntry.count += 1;
    byFile.set(tc.file, fileEntry);

    const relFromTest = tc.file.includes('/test/') ? tc.file.slice(tc.file.indexOf('/test/') + '/test/'.length) : tc.file;
    const dir = relFromTest.includes('/') ? relFromTest.slice(0, relFromTest.indexOf('/')) : '(test root)';
    const dirEntry = byDir.get(dir) ?? { dir, totalSeconds: 0, count: 0 };
    dirEntry.totalSeconds += tc.time;
    dirEntry.count += 1;
    byDir.set(dir, dirEntry);
  }

  const topTests = [...testcases].sort((a, b) => b.time - a.time).slice(0, topN);
  const topFiles = [...byFile.values()].sort((a, b) => b.totalSeconds - a.totalSeconds).slice(0, topN);
  const directoryTotals = [...byDir.values()].sort((a, b) => b.totalSeconds - a.totalSeconds);

  return { topTests, topFiles, directoryTotals };
}

/**
 * Aggregates N sample records into a report-ready summary. Throws (rather
 * than silently averaging over bad data) when any sample is invalid --
 * per the plan's Measurement Contract, an invalid sample is discarded and
 * the run redone, never folded into a median.
 */
export function summarizeSamples(samples) {
  const invalid = samples.filter((s) => !s.valid);
  if (invalid.length > 0) {
    throw new Error(`summarizeSamples: ${invalid.length} of ${samples.length} sample(s) invalid (non-zero exit or dirty snapshot) -- discard and re-run, never average over them.`);
  }
  const wall = samples.map((s) => s.wallSeconds);
  return {
    sampleCount: samples.length,
    wallMedianSeconds: median(wall),
    wall: minMax(wall),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.argv[2];
  if (mode === 'sample') {
    const rest = process.argv.slice(3);
    const logDirIdx = rest.indexOf('--log-dir');
    const logDir = logDirIdx === -1 ? undefined : rest[logDirIdx + 1];
    const forwardedArgs = logDirIdx === -1 ? rest : [...rest.slice(0, logDirIdx), ...rest.slice(logDirIdx + 2)];
    const sample = runOneSample({ forwardedArgs, logDir });
    console.log(JSON.stringify(sample, null, 2));
    process.exitCode = sample.valid ? 0 : 1;
  } else if (mode === 'profile') {
    let rest = process.argv.slice(3);
    const logDirIdx = rest.indexOf('--log-dir');
    const logDir = logDirIdx === -1 ? undefined : rest[logDirIdx + 1];
    if (logDirIdx !== -1) rest = [...rest.slice(0, logDirIdx), ...rest.slice(logDirIdx + 2)];
    const topIdx = rest.indexOf('--top');
    const topN = topIdx !== -1 ? Number(rest[topIdx + 1]) : 30;
    if (topIdx !== -1) rest = [...rest.slice(0, topIdx), ...rest.slice(topIdx + 2)];
    const forwardedArgs = rest;
    const profile = runProfile({ logDir, forwardedArgs });
    const summary = summarizeProfile(profile.testcases, { topN });
    console.log(JSON.stringify({ ...profile, testcases: undefined, summary }, null, 2));
    process.exitCode = profile.valid ? 0 : 1;
  } else if (mode === 'env') {
    console.log(JSON.stringify(gatherEnvironment(), null, 2));
  } else {
    console.error('usage: node scripts/test-timing.mjs <sample|profile|env> [--log-dir <dir>]');
    process.exitCode = 1;
  }
}
