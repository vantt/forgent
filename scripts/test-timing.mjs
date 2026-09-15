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

export function isGitClean(cwd = REPO_ROOT, exec = execFileSync) {
  const lines = exec('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' })
    .split('\n')
    .filter((line) => line.trim() !== '' && !SYMLINKED_BUILD_ARTIFACT_ENTRIES.has(line.trim()));
  return lines.length === 0;
}

export function gitHead(cwd = REPO_ROOT, exec = execFileSync) {
  return exec('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim();
}

export function hasGnuTimeV(binary = '/usr/bin/time', exists = fs.existsSync) {
  return exists(binary);
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
  checkClean = () => isGitClean(cwd),
  environment = () => gatherEnvironment({ cwd }),
  logDir,
} = {}) {
  const before = { clean: checkClean(), env: environment() };
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
  const after = { clean: checkClean() };

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
  } else if (mode === 'env') {
    console.log(JSON.stringify(gatherEnvironment(), null, 2));
  } else {
    console.error('usage: node scripts/test-timing.mjs <sample|env> [-- extra run-tests.mjs args]');
    process.exitCode = 1;
  }
}
