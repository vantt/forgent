/**
 * Parity Harness for fgOS (Rust vs Node differential verification).
 *
 * Child-process evidence mechanism:
 * Uses a NODE_OPTIONS="--require <path>/child-process-spy.cjs" preload that monkeypatches
 * node:child_process methods (spawn, spawnSync, execFile, execFileSync, fork, exec, execSync)
 * and appends { cmd, args } JSON lines to a per-case log file named by the FGOS_HARNESS_SPY_LOG
 * environment variable.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, "../..");
export const SPY_PATH = path.join(__dirname, "fixtures/child-process-spy.cjs");
export const ROUTES_PATH = path.join(REPO_ROOT, "packages/host-runtime/contracts/command-routes.json");

/**
 * Parses an entry spec: "node:<path>" or "bin:<path>".
 * @param {string} entrySpec
 * @param {string} [repoRoot]
 */
export function parseEntry(entrySpec, repoRoot = REPO_ROOT) {
  if (!entrySpec || typeof entrySpec !== "string") {
    throw new Error(`Invalid entry specification: ${entrySpec}`);
  }
  if (entrySpec.startsWith("node:")) {
    const targetPath = entrySpec.slice(5);
    const resolvedPath = path.isAbsolute(targetPath) ? targetPath : path.resolve(repoRoot, targetPath);
    return {
      type: "node",
      executable: process.execPath,
      target: resolvedPath,
      spec: entrySpec,
    };
  } else if (entrySpec.startsWith("bin:")) {
    const targetPath = entrySpec.slice(4);
    const resolvedPath = path.isAbsolute(targetPath) ? targetPath : path.resolve(repoRoot, targetPath);
    return {
      type: "bin",
      executable: resolvedPath,
      target: resolvedPath,
      spec: entrySpec,
    };
  } else {
    throw new Error(`Unknown entry prefix in "${entrySpec}". Expected "node:<path>" or "bin:<path>"`);
  }
}

/**
 * Resolves entry A and entry B from options or environment variables.
 */
export function resolveEntries(options = {}) {
  const envA = options.entryA ?? process.env.FGOS_HARNESS_ENTRY_A ?? process.env.FGOS_HARNESS_ENTRY ?? "node:bin/fgos.mjs";
  const envB = options.entryB ?? process.env.FGOS_HARNESS_ENTRY_B ?? process.env.FGOS_HARNESS_ENTRY ?? envA;
  const repoRoot = options.repoRoot ?? REPO_ROOT;
  return {
    entryA: parseEntry(envA, repoRoot),
    entryB: parseEntry(envB, repoRoot),
    isDifferential: envA !== envB || Boolean(options.differential),
  };
}

/**
 * Recursively snapshots a directory into a map of relative path -> { size, sha256 }.
 */
export function snapshotDirectory(dirPath, ignoreGit = true) {
  const snapshot = new Map();
  if (!fs.existsSync(dirPath)) return snapshot;

  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const ent of entries) {
      if (ignoreGit && ent.name === ".git") continue;
      const fullPath = path.join(current, ent.name);
      const relPath = path.relative(dirPath, fullPath);
      if (ent.isDirectory()) {
        walk(fullPath);
      } else if (ent.isFile()) {
        const content = fs.readFileSync(fullPath);
        const hash = crypto.createHash("sha256").update(content).digest("hex");
        snapshot.set(relPath, { size: content.length, hash });
      }
    }
  }

  walk(dirPath);
  return snapshot;
}

/**
 * Computes difference between before and after directory snapshots.
 */
export function diffDirectorySnapshots(before, after) {
  const created = [];
  const modified = [];
  const deleted = [];

  for (const [relPath, afterInfo] of after.entries()) {
    if (!before.has(relPath)) {
      created.push(relPath);
    } else {
      const beforeInfo = before.get(relPath);
      if (beforeInfo.hash !== afterInfo.hash || beforeInfo.size !== afterInfo.size) {
        modified.push(relPath);
      }
    }
  }

  for (const relPath of before.keys()) {
    if (!after.has(relPath)) {
      deleted.push(relPath);
    }
  }

  return {
    created: created.sort(),
    modified: modified.sort(),
    deleted: deleted.sort(),
  };
}

/**
 * Validates whether a value is an ISO 8601 timestamp.
 */
export function isIsoTimestamp(val) {
  if (typeof val !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(val) && !isNaN(Date.parse(val));
}

/**
 * Runs a single test case on a single entry and captures all observable effects.
 */
export async function runCaseOnEntry(entry, testCase, options = {}) {
  const repoRoot = options.repoRoot ?? REPO_ROOT;
  const timeoutMs = testCase.timeoutMs ?? 15000;
  const scratchBase = path.join(os.tmpdir(), "fgos-parity-" + crypto.randomBytes(6).toString("hex"));
  fs.mkdirSync(scratchBase, { recursive: true });

  const spyLogPath = path.join(scratchBase, "spy.log");
  let workingDir = testCase.cwd ?? repoRoot;
  let isolatedDir = null;

  if (testCase.isolatedFs) {
    isolatedDir = path.join(scratchBase, "workdir");
    fs.mkdirSync(isolatedDir, { recursive: true });
    if (testCase.initGit !== false) {
      execFileSync("git", ["init"], { cwd: isolatedDir, stdio: "ignore" });
    }
    workingDir = isolatedDir;
  }

  const captureFs = testCase.modes?.includes("fs-delta") || Boolean(testCase.isolatedFs);
  const beforeSnapshot = captureFs ? snapshotDirectory(workingDir) : null;

  const env = { ...process.env, ...(testCase.env ?? {}) };
  env.FGOS_HARNESS_SPY_LOG = spyLogPath;
  if (entry.type === "node") {
    env.NODE_OPTIONS = (env.NODE_OPTIONS ? env.NODE_OPTIONS + " " : "") + `--require ${SPY_PATH}`;
  }

  const spawnCmd = entry.executable;
  const spawnArgs = entry.type === "node" ? [entry.target, ...(testCase.args ?? [])] : [...(testCase.args ?? [])];

  const startTimeIso = new Date().toISOString();
  const t0 = performance.now();

  let child;
  const stdoutChunks = [];
  const stderrChunks = [];

  const runPromise = new Promise((resolve, reject) => {
    let timer = null;
    let killTimer = null;

    try {
      child = spawn(spawnCmd, spawnArgs, {
        cwd: workingDir,
        env,
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (err) {
      return reject(err);
    }

    if (testCase.stdin != null) {
      child.stdin.write(testCase.stdin);
      child.stdin.end();
    } else {
      child.stdin.end();
    }

    child.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk) => stderrChunks.push(chunk));

    if (testCase.killSignal && testCase.killSignalAfterMs) {
      killTimer = setTimeout(() => {
        try { child.kill(testCase.killSignal); } catch (_) {}
      }, testCase.killSignalAfterMs);
    }

    timer = setTimeout(() => {
      try { child.kill("SIGKILL"); } catch (_) {}
      reject(new Error(`Execution timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.on("close", (code, signal) => {
      if (timer) clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      resolve({ code, signal });
    });

    child.on("error", (err) => {
      if (timer) clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      reject(err);
    });
  });

  let exitCode = null;
  let exitSignal = null;
  try {
    const outcome = await runPromise;
    exitCode = outcome.code;
    exitSignal = outcome.signal;
  } catch (err) {
    exitSignal = "TIMEOUT";
  }

  const t1 = performance.now();
  const endTimeIso = new Date().toISOString();
  const durationMs = Math.round((t1 - t0) * 100) / 100;

  // Read spy output
  const spawnedChildren = [];
  if (fs.existsSync(spyLogPath)) {
    try {
      const rawSpy = fs.readFileSync(spyLogPath, "utf8");
      const lines = rawSpy.split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          spawnedChildren.push(JSON.parse(line));
        } catch (_) {}
      }
    } catch (_) {}
  }

  const afterSnapshot = captureFs ? snapshotDirectory(workingDir) : null;
  const fsDelta = captureFs && beforeSnapshot && afterSnapshot
    ? diffDirectorySnapshots(beforeSnapshot, afterSnapshot)
    : null;

  // Cleanup scratch directory
  try {
    fs.rmSync(scratchBase, { recursive: true, force: true });
  } catch (_) {}

  const stdout = Buffer.concat(stdoutChunks);
  const stderr = Buffer.concat(stderrChunks);

  return {
    entrySpec: entry.spec,
    exitCode,
    signal: exitSignal,
    stdout,
    stderr,
    stdoutText: stdout.toString("utf8"),
    stderrText: stderr.toString("utf8"),
    spawnedChildren,
    fsDelta,
    wallClock: {
      startTime: startTimeIso,
      endTime: endTimeIso,
      durationMs,
    },
  };
}

/**
 * Deeply compares two JSON values, allowing ISO timestamp fields to match predicate instead of exact value.
 */
export function compareSemanticJson(a, b, timestampPredicate = isIsoTimestamp, currentPath = "$") {
  const diffs = [];

  if (a === b) return diffs;

  // Check timestamp predicate for string values
  if (typeof a === "string" && typeof b === "string") {
    const isTimestampA = timestampPredicate(a);
    const isTimestampB = timestampPredicate(b);
    if (isTimestampA && isTimestampB) {
      return diffs; // Both satisfy timestamp predicate: pass without exact equality
    }
    diffs.push(`JSON value mismatch at ${currentPath}: "${a}" !== "${b}"`);
    return diffs;
  }

  if (typeof a !== typeof b || a === null || b === null) {
    diffs.push(`JSON type mismatch at ${currentPath}: ${typeof a} (${a}) !== ${typeof b} (${b})`);
    return diffs;
  }

  if (Array.isArray(a)) {
    if (!Array.isArray(b)) {
      diffs.push(`JSON array mismatch at ${currentPath}: one is array, other is not`);
      return diffs;
    }
    if (a.length !== b.length) {
      diffs.push(`JSON array length mismatch at ${currentPath}: ${a.length} !== ${b.length}`);
      return diffs;
    }
    for (let i = 0; i < a.length; i++) {
      diffs.push(...compareSemanticJson(a[i], b[i], timestampPredicate, `${currentPath}[${i}]`));
    }
    return diffs;
  }

  if (typeof a === "object") {
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();

    if (JSON.stringify(keysA) !== JSON.stringify(keysB)) {
      diffs.push(`JSON keys mismatch at ${currentPath}: [${keysA.join(",")}] !== [${keysB.join(",")}]`);
      return diffs;
    }

    for (const key of keysA) {
      if (key === "generated_at" && timestampPredicate(a[key]) && timestampPredicate(b[key])) {
        // Timestamp predicate satisfied for generated_at
        continue;
      }
      diffs.push(...compareSemanticJson(a[key], b[key], timestampPredicate, `${currentPath}.${key}`));
    }
    return diffs;
  }

  diffs.push(`JSON primitive mismatch at ${currentPath}: ${a} !== ${b}`);
  return diffs;
}

/**
 * Compares execution results from Entry A and Entry B according to declared test case modes.
 */
export function compareResults(testCase, resultA, resultB) {
  const differences = [];
  const modes = testCase.modes ?? ["exact-bytes"];

  // 1. Check exit code
  if (resultA.exitCode !== resultB.exitCode) {
    differences.push(`Exit code mismatch: entry A had ${resultA.exitCode}, entry B had ${resultB.exitCode}`);
  }
  if (testCase.expectedExitCode !== undefined) {
    if (resultA.exitCode !== testCase.expectedExitCode) {
      differences.push(`Entry A exit code ${resultA.exitCode} did not match expected ${testCase.expectedExitCode}`);
    }
    if (resultB.exitCode !== testCase.expectedExitCode) {
      differences.push(`Entry B exit code ${resultB.exitCode} did not match expected ${testCase.expectedExitCode}`);
    }
  }

  // 2. Check signal termination
  if (resultA.signal !== resultB.signal) {
    differences.push(`Signal mismatch: entry A had ${resultA.signal}, entry B had ${resultB.signal}`);
  }
  if (testCase.expectedSignal !== undefined) {
    if (resultA.signal !== testCase.expectedSignal) {
      differences.push(`Entry A signal ${resultA.signal} did not match expected ${testCase.expectedSignal}`);
    }
    if (resultB.signal !== testCase.expectedSignal) {
      differences.push(`Entry B signal ${resultB.signal} did not match expected ${testCase.expectedSignal}`);
    }
  }

  // 3. Check spawned children unless explicitly ignored
  if (!testCase.ignoreChildren) {
    const childrenA = resultA.spawnedChildren;
    const childrenB = resultB.spawnedChildren;
    if (childrenA.length !== childrenB.length) {
      differences.push(
        `Spawned children count mismatch: entry A spawned ${childrenA.length}, entry B spawned ${childrenB.length} (${JSON.stringify(childrenA)} vs ${JSON.stringify(childrenB)})`
      );
    } else {
      for (let i = 0; i < childrenA.length; i++) {
        const cmdA = path.basename(childrenA[i].cmd);
        const cmdB = path.basename(childrenB[i].cmd);
        if (cmdA !== cmdB || JSON.stringify(childrenA[i].args) !== JSON.stringify(childrenB[i].args)) {
          differences.push(
            `Spawned child mismatch at index ${i}: ${JSON.stringify(childrenA[i])} !== ${JSON.stringify(childrenB[i])}`
          );
        }
      }
    }
  }

  // 4. Mode-specific comparisons
  for (const mode of modes) {
    if (mode === "exact-bytes") {
      if (!resultA.stdout.equals(resultB.stdout)) {
        differences.push(`stdout byte mismatch: A had ${resultA.stdout.length} bytes, B had ${resultB.stdout.length} bytes`);
      }
      if (!resultA.stderr.equals(resultB.stderr)) {
        differences.push(`stderr byte mismatch: A had ${resultA.stderr.length} bytes, B had ${resultB.stderr.length} bytes`);
      }
    } else if (mode === "semantic-json") {
      let jsonA, jsonB;
      try {
        jsonA = JSON.parse(resultA.stdoutText);
      } catch (err) {
        differences.push(`Entry A stdout is not valid JSON: ${err.message}`);
      }
      try {
        jsonB = JSON.parse(resultB.stdoutText);
      } catch (err) {
        differences.push(`Entry B stdout is not valid JSON: ${err.message}`);
      }

      if (jsonA && jsonB) {
        const jsonDiffs = compareSemanticJson(jsonA, jsonB, testCase.timestampPredicate);
        differences.push(...jsonDiffs);
      }

      if (resultA.stderrText !== resultB.stderrText) {
        differences.push(`stderr mismatch in semantic-json mode: "${resultA.stderrText}" !== "${resultB.stderrText}"`);
      }
    } else if (mode === "fs-delta") {
      if (!resultA.fsDelta || !resultB.fsDelta) {
        differences.push("fs-delta mode declared but filesystem delta not captured for one or both entries");
      } else {
        if (JSON.stringify(resultA.fsDelta.created) !== JSON.stringify(resultB.fsDelta.created)) {
          differences.push(`fs-delta created mismatch: ${JSON.stringify(resultA.fsDelta.created)} !== ${JSON.stringify(resultB.fsDelta.created)}`);
        }
        if (JSON.stringify(resultA.fsDelta.modified) !== JSON.stringify(resultB.fsDelta.modified)) {
          differences.push(`fs-delta modified mismatch: ${JSON.stringify(resultA.fsDelta.modified)} !== ${JSON.stringify(resultB.fsDelta.modified)}`);
        }
        if (JSON.stringify(resultA.fsDelta.deleted) !== JSON.stringify(resultB.fsDelta.deleted)) {
          differences.push(`fs-delta deleted mismatch: ${JSON.stringify(resultA.fsDelta.deleted)} !== ${JSON.stringify(resultB.fsDelta.deleted)}`);
        }
      }
    } else if (mode === "signal") {
      if (resultA.signal !== resultB.signal) {
        differences.push(`signal comparison mode mismatch: A (${resultA.signal}) !== B (${resultB.signal})`);
      }
    } else {
      differences.push(`Unknown comparison mode: ${mode}`);
    }
  }

  return {
    caseId: testCase.id,
    modes,
    passed: differences.length === 0,
    differences,
    resultA,
    resultB,
  };
}

/**
 * Runs a differential comparison case between two entries.
 */
export async function runDifferentialCase(entryA, entryB, testCase, options = {}) {
  // If multi-step isolated write case, run multi-step handler
  if (testCase.isMultiStepWrite) {
    return runMultiStepIsolatedWrite(entryA, entryB, testCase, options);
  }

  const [resA, resB] = await Promise.all([
    runCaseOnEntry(entryA, testCase, options),
    runCaseOnEntry(entryB, testCase, options),
  ]);

  return compareResults(testCase, resA, resB);
}

/**
 * Runs multi-step isolated write (e.g. init then add in clean temp repos).
 */
async function runMultiStepIsolatedWrite(entryA, entryB, testCase, options = {}) {
  const scratchA = path.join(os.tmpdir(), "fgos-iso-A-" + crypto.randomBytes(6).toString("hex"));
  const scratchB = path.join(os.tmpdir(), "fgos-iso-B-" + crypto.randomBytes(6).toString("hex"));
  fs.mkdirSync(scratchA, { recursive: true });
  fs.mkdirSync(scratchB, { recursive: true });

  try {
    execFileSync("git", ["init"], { cwd: scratchA, stdio: "ignore" });
    execFileSync("git", ["init"], { cwd: scratchB, stdio: "ignore" });

    const beforeSnapA = snapshotDirectory(scratchA);
    const beforeSnapB = snapshotDirectory(scratchB);

    // Step 1: init
    const initCaseA = {
      id: `${testCase.id}-step1-init`,
      args: ["init"],
      modes: ["semantic-json"],
      cwd: scratchA,
      ignoreChildren: true,
    };
    const initCaseB = { ...initCaseA, cwd: scratchB };
    const [initResA, initResB] = await Promise.all([
      runCaseOnEntry(entryA, initCaseA, options),
      runCaseOnEntry(entryB, initCaseB, options),
    ]);

    // Normalize dir path and data_hash in stdout JSON for init
    try {
      const jA = JSON.parse(initResA.stdoutText);
      const jB = JSON.parse(initResB.stdoutText);
      if (jA.data && typeof jA.data === "object") {
        jA.data.dir = "<WORK_DIR>/.fgos";
      }
      if (jB.data && typeof jB.data === "object") {
        jB.data.dir = "<WORK_DIR>/.fgos";
      }
      delete jA.data_hash;
      delete jB.data_hash;
      initResA.stdoutText = JSON.stringify(jA);
      initResB.stdoutText = JSON.stringify(jB);
    } catch (_) {}

    const initComparison = compareResults(initCaseA, initResA, initResB);

    // Step 2: add
    const addCaseA = {
      id: `${testCase.id}-step2-add`,
      args: [
        "add",
        "--id", "tsk-harness-01",
        "--title", "Harness test task",
        "--kind", "task",
        "--risk", "standard",
        "--verify", "echo ok",
        "--description", "harness task description",
      ],
      modes: ["semantic-json"],
      cwd: scratchA,
      ignoreChildren: true,
    };
    const addCaseB = { ...addCaseA, cwd: scratchB };
    const [addResA, addResB] = await Promise.all([
      runCaseOnEntry(entryA, addCaseA, options),
      runCaseOnEntry(entryB, addCaseB, options),
    ]);
    const addComparison = compareResults(addCaseA, addResA, addResB);

    const afterSnapA = snapshotDirectory(scratchA);
    const afterSnapB = snapshotDirectory(scratchB);
    const deltaA = diffDirectorySnapshots(beforeSnapA, afterSnapA);
    const deltaB = diffDirectorySnapshots(beforeSnapB, afterSnapB);

    function normalizeCreatedFiles(list) {
      return list.map(p => p.replace(/\.fgos\/events\/[0-9]+-[0-9TZ]+\.jsonl$/, ".fgos/events/<EVENT_LOG>.jsonl")).sort();
    }

    const normCreatedA = normalizeCreatedFiles(deltaA.created);
    const normCreatedB = normalizeCreatedFiles(deltaB.created);

    const differences = [...initComparison.differences, ...addComparison.differences];
    if (JSON.stringify(normCreatedA) !== JSON.stringify(normCreatedB)) {
      differences.push(`Created delta mismatch: ${JSON.stringify(normCreatedA)} !== ${JSON.stringify(normCreatedB)}`);
    }

    return {
      caseId: testCase.id,
      modes: testCase.modes ?? ["semantic-json", "fs-delta"],
      passed: differences.length === 0,
      differences,
      resultA: addResA,
      resultB: addResB,
    };
  } finally {
    fs.rmSync(scratchA, { recursive: true, force: true });
    fs.rmSync(scratchB, { recursive: true, force: true });
  }
}

export function writeTimingReport(caseResults, reportPath = null) {
  const targetPath = reportPath ?? process.env.FGOS_HARNESS_REPORT_PATH ?? path.join(
    os.tmpdir(),
    `fgos-parity-report-${Date.now()}-${process.pid}.json`
  );

  const reportRows = [];
  for (const r of caseResults) {
    if (r.resultA) {
      reportRows.push({
        caseId: r.caseId,
        entry: r.resultA.entrySpec,
        modes: r.modes ?? [],
        startTime: r.resultA.wallClock?.startTime,
        endTime: r.resultA.wallClock?.endTime,
        durationMs: r.resultA.wallClock?.durationMs,
        exitCode: r.resultA.exitCode,
        passed: r.passed,
      });
    }
    if (r.resultB && r.resultB.entrySpec !== r.resultA?.entrySpec) {
      reportRows.push({
        caseId: r.caseId,
        entry: r.resultB.entrySpec,
        modes: r.modes ?? [],
        startTime: r.resultB.wallClock?.startTime,
        endTime: r.resultB.wallClock?.endTime,
        durationMs: r.resultB.wallClock?.durationMs,
        exitCode: r.resultB.exitCode,
        passed: r.passed,
      });
    }
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, JSON.stringify(reportRows, null, 2) + "\n", "utf8");
  return targetPath;
}

/**
 * Builds the complete coverage floor case set (R5) using command-routes.json.
 */
export function generateCoverageFloorCases(options = {}) {
  const repoRoot = options.repoRoot ?? REPO_ROOT;
  const routesPath = options.routesPath ?? ROUTES_PATH;
  const routes = JSON.parse(fs.readFileSync(routesPath, "utf8"));
  const selectors = Object.keys(routes).sort();

  const cases = [];

  // 1. 73 selectors: recognition/help for every one
  for (const sel of selectors) {
    cases.push({
      id: `coverage-help-${sel}`,
      args: [sel, "--help"],
      modes: ["exact-bytes"],
      expectedExitCode: 0,
      ignoreChildren: true,
    });
  }

  // 2. Exit categories:
  // - stdout zero
  cases.push({
    id: "coverage-exit-category-stdout-zero",
    args: ["version"],
    modes: ["semantic-json"],
    expectedExitCode: 0,
    ignoreChildren: true,
  });

  // - stderr status
  cases.push({
    id: "coverage-exit-category-stderr-status",
    args: ["unknown-command-category-probe"],
    cwd: os.tmpdir(),
    modes: ["exact-bytes"],
    expectedExitCode: 4,
    ignoreChildren: true,
  });

  // 3. Reads of version
  cases.push({
    id: "coverage-read-version",
    args: ["version"],
    modes: ["semantic-json"],
    expectedExitCode: 0,
    ignoreChildren: true,
  });

  // 4. Reads of ready
  cases.push({
    id: "coverage-read-ready",
    args: ["ready"],
    modes: ["semantic-json"],
    expectedExitCode: 0,
    ignoreChildren: true,
  });

  // 5. One validation failure
  cases.push({
    id: "coverage-validation-failure",
    args: ["show", "non-existent-work-item-id-xyz"],
    cwd: os.tmpdir(),
    modes: ["exact-bytes"],
    expectedExitCode: 4,
    ignoreChildren: true,
  });

  // 6. Unknown verb
  cases.push({
    id: "coverage-unknown-verb",
    args: ["unknown-verb-probe-xyz"],
    cwd: os.tmpdir(),
    modes: ["exact-bytes"],
    expectedExitCode: 4,
    ignoreChildren: true,
  });

  // 7. Isolated write (init then add in temp repo)
  cases.push({
    id: "coverage-isolated-write-init-then-add",
    isMultiStepWrite: true,
    modes: ["semantic-json", "fs-delta"],
    ignoreChildren: true,
  });

  // 8. --dir flag override
  cases.push({
    id: "coverage-dir-flag-override",
    args: ["ready", "--dir", repoRoot],
    modes: ["semantic-json"],
    expectedExitCode: 0,
    ignoreChildren: true,
  });

  // 9. Caller cwd distinct from product root
  cases.push({
    id: "coverage-distinct-caller-cwd",
    args: ["version"],
    cwd: os.tmpdir(),
    modes: ["semantic-json"],
    expectedExitCode: 0,
    ignoreChildren: true,
  });

  // 10. Stdin-consuming case
  cases.push({
    id: "coverage-stdin-consuming-case",
    args: ["version"],
    stdin: "synthetic stdin payload\n",
    modes: ["semantic-json"],
    expectedExitCode: 0,
    ignoreChildren: true,
  });

  // 11. Target-specific signal / process-tree case
  cases.push({
    id: "coverage-signal-process-tree-case",
    args: ["version"],
    modes: ["semantic-json"],
    expectedExitCode: 0,
    ignoreChildren: false, // Asserts child process (git rev-parse) parity!
  });

  return cases;
}

/**
 * Runs the full parity test suite across given cases and writes the timing report.
 */
export async function runParitySuite(cases, options = {}) {
  const { entryA, entryB } = resolveEntries(options);
  const concurrency = options.concurrency ?? 6;
  const results = [];

  let idx = 0;
  async function worker() {
    while (idx < cases.length) {
      const current = cases[idx++];
      const res = await runDifferentialCase(entryA, entryB, current, options);
      results.push(res);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, cases.length) }, () => worker());
  await Promise.all(workers);

  const reportPath = writeTimingReport(results, options.reportPath);
  const failedResults = results.filter((r) => !r.passed);

  return {
    passed: failedResults.length === 0,
    total: results.length,
    passedCount: results.length - failedResults.length,
    failedCount: failedResults.length,
    results,
    failedResults,
    reportPath,
  };
}
