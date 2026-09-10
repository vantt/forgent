import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import {
  REPO_ROOT,
  ROUTES_PATH,
  SPY_PATH,
  parseEntry,
  resolveEntries,
  snapshotDirectory,
  diffDirectorySnapshots,
  isIsoTimestamp,
  compareSemanticJson,
  compareResults,
  runCaseOnEntry,
  runDifferentialCase,
  writeTimingReport,
  generateCoverageFloorCases,
  runParitySuite,
} from "./harness.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, "fixtures");

test("R1: Entry specification parsing and environment resolution", () => {
  // node:<path>
  const nodeEntry = parseEntry("node:bin/fgos.mjs", REPO_ROOT);
  assert.equal(nodeEntry.type, "node");
  assert.equal(nodeEntry.executable, process.execPath);
  assert.equal(nodeEntry.target, path.join(REPO_ROOT, "bin/fgos.mjs"));
  assert.equal(nodeEntry.spec, "node:bin/fgos.mjs");

  // bin:<path>
  const binEntry = parseEntry("bin:target/debug/fgos", REPO_ROOT);
  assert.equal(binEntry.type, "bin");
  assert.equal(binEntry.executable, path.join(REPO_ROOT, "target/debug/fgos"));
  assert.equal(binEntry.target, path.join(REPO_ROOT, "target/debug/fgos"));
  assert.equal(binEntry.spec, "bin:target/debug/fgos");

  // Invalid spec
  assert.throws(() => parseEntry("invalid:path"), /Unknown entry prefix/);
  assert.throws(() => parseEntry(""), /Invalid entry specification/);

  // resolveEntries default fallback and explicit override
  const resolved = resolveEntries({
    entryA: "node:bin/fgos.mjs",
    entryB: "node:bin/fgos.mjs",
    repoRoot: REPO_ROOT,
  });
  assert.equal(resolved.entryA.spec, "node:bin/fgos.mjs");
  assert.equal(resolved.entryB.spec, "node:bin/fgos.mjs");
});

test("R2: Semantic JSON comparison honors timestamp predicate without exact equality", () => {
  const jsonA = {
    contract: "fgos.v1",
    generated_at: "2026-09-10T12:00:00.000Z",
    data: { count: 42, name: "demo" },
  };
  const jsonB = {
    contract: "fgos.v1",
    generated_at: "2026-09-10T12:05:30.123Z", // Different timestamp
    data: { count: 42, name: "demo" },
  };

  const diffs = compareSemanticJson(jsonA, jsonB);
  assert.deepEqual(diffs, [], "Timestamps differing in value must pass when predicate is satisfied");

  const jsonC = {
    contract: "fgos.v1",
    generated_at: "not-a-timestamp",
    data: { count: 42, name: "demo" },
  };
  const diffsInvalid = compareSemanticJson(jsonA, jsonC);
  assert.ok(diffsInvalid.length > 0, "Invalid timestamp string must fail comparison");

  const jsonD = {
    contract: "fgos.v1",
    generated_at: "2026-09-10T12:00:00.000Z",
    data: { count: 999, name: "demo" },
  };
  const diffsDataMismatch = compareSemanticJson(jsonA, jsonD);
  assert.ok(diffsDataMismatch.length > 0, "Mismatched data payload must fail comparison");
});

test("R3: Filesystem snapshot and delta capture", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "harness-fs-test-"));
  try {
    fs.writeFileSync(path.join(tmpDir, "file1.txt"), "hello");
    fs.writeFileSync(path.join(tmpDir, "file2.txt"), "world");

    const snap1 = snapshotDirectory(tmpDir);
    assert.equal(snap1.size, 2);

    fs.writeFileSync(path.join(tmpDir, "file2.txt"), "world-modified");
    fs.writeFileSync(path.join(tmpDir, "file3.txt"), "new-file");
    fs.unlinkSync(path.join(tmpDir, "file1.txt"));

    const snap2 = snapshotDirectory(tmpDir);
    const delta = diffDirectorySnapshots(snap1, snap2);

    // created/modified carry {path, hash} (MEDIUM-3/red-team-HIGH fix), not a
    // bare path -- content hash is what lets compareResults's fs-delta mode
    // catch two entries writing the same filename with different bytes.
    assert.equal(delta.created.length, 1);
    assert.equal(delta.created[0].path, "file3.txt");
    assert.equal(
      delta.created[0].hash,
      crypto.createHash("sha256").update("new-file").digest("hex")
    );
    assert.equal(delta.modified.length, 1);
    assert.equal(delta.modified[0].path, "file2.txt");
    assert.equal(
      delta.modified[0].hash,
      crypto.createHash("sha256").update("world-modified").digest("hex")
    );
    assert.deepEqual(delta.deleted, ["file1.txt"]);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("R3 & R5: Stdin passthrough and child process spy execution", async () => {
  const stdinFixture = parseEntry(`node:${path.join(FIXTURES_DIR, "stdin-echo.mjs")}`);
  const stdinRes = await runCaseOnEntry(stdinFixture, {
    id: "stdin-test",
    stdin: "ping-payload-42",
    modes: ["exact-bytes"],
  });
  assert.equal(stdinRes.stdoutText, "stdin:ping-payload-42");
  assert.equal(stdinRes.exitCode, 0);

  // Child process spy check
  const childFixture = parseEntry(`node:${path.join(FIXTURES_DIR, "divergent-child-process.mjs")}`);
  const childRes = await runCaseOnEntry(childFixture, {
    id: "child-spy-test",
    args: ["test-arg"],
    modes: ["exact-bytes"],
  });
  assert.equal(childRes.spawnedChildren.length, 1);
  assert.equal(childRes.spawnedChildren[0].args[1], "process.exit(0)");
});

test("R4: Wall-clock timing report written to scratch JSON path (never committed)", () => {
  const scratchReportPath = path.join(os.tmpdir(), `test-report-${Date.now()}-${process.pid}.json`);

  const mockResults = [
    {
      caseId: "mock-case-1",
      modes: ["exact-bytes"],
      passed: true,
      resultA: {
        entrySpec: "node:bin/fgos.mjs",
        exitCode: 0,
        wallClock: {
          startTime: "2026-09-10T12:00:00.000Z",
          endTime: "2026-09-10T12:00:00.050Z",
          durationMs: 50.2,
        },
      },
      resultB: {
        entrySpec: "node:bin/fgos.mjs",
        exitCode: 0,
        wallClock: {
          startTime: "2026-09-10T12:00:00.000Z",
          endTime: "2026-09-10T12:00:00.052Z",
          durationMs: 52.1,
        },
      },
    },
  ];

  const writtenPath = writeTimingReport(mockResults, scratchReportPath);
  assert.equal(writtenPath, scratchReportPath);
  assert.ok(fs.existsSync(scratchReportPath));

  const parsed = JSON.parse(fs.readFileSync(scratchReportPath, "utf8"));
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].caseId, "mock-case-1");
  assert.equal(parsed[0].durationMs, 50.2);
  assert.equal(parsed[0].passed, true);

  fs.unlinkSync(scratchReportPath);
});

test("R5: Coverage floor enumerates all 73 selectors from command-routes.json", () => {
  const cases = generateCoverageFloorCases();
  const routes = JSON.parse(fs.readFileSync(ROUTES_PATH, "utf8"));
  const selectors = Object.keys(routes).sort();

  assert.equal(selectors.length, 73, "command-routes.json must contain exactly 73 selectors");

  const helpCases = cases.filter((c) => c.id.startsWith("coverage-help-"));
  assert.equal(helpCases.length, 73, "Must generate exactly 73 help cases");

  for (const sel of selectors) {
    const matching = helpCases.find((c) => c.id === `coverage-help-${sel}`);
    assert.ok(matching, `Coverage floor missing help case for selector: ${sel}`);
    assert.deepEqual(matching.args, [sel, "--help"]);
  }

  // Check presence of required special cases
  assert.ok(cases.some((c) => c.id === "coverage-exit-category-stdout-zero"));
  assert.ok(cases.some((c) => c.id === "coverage-exit-category-stderr-status"));
  assert.ok(cases.some((c) => c.id === "coverage-read-version"));
  assert.ok(cases.some((c) => c.id === "coverage-read-ready"));
  assert.ok(cases.some((c) => c.id === "coverage-validation-failure"));
  assert.ok(cases.some((c) => c.id === "coverage-unknown-verb"));
  assert.ok(cases.some((c) => c.id === "coverage-isolated-write-init-then-add"));
  assert.ok(cases.some((c) => c.id === "coverage-dir-flag-override"));
  assert.ok(cases.some((c) => c.id === "coverage-distinct-caller-cwd"));
  assert.ok(cases.some((c) => c.id === "coverage-stdin-consuming-case"));
  assert.ok(cases.some((c) => c.id === "coverage-signal-process-tree-case"));
});

test("R5: Node-against-Node passes all coverage-floor cases", async () => {
  const { entryA, entryB } = resolveEntries();
  const cases = generateCoverageFloorCases();

  const scratchReportPath = path.join(os.tmpdir(), `coverage-floor-report-${Date.now()}.json`);
  const suiteResult = await runParitySuite(cases, {
    entryA: entryA.spec,
    entryB: entryB.spec,
    reportPath: scratchReportPath,
    concurrency: 8,
  });

  assert.equal(
    suiteResult.failedCount,
    0,
    `Node-against-Node had ${suiteResult.failedCount} failures: ${JSON.stringify(suiteResult.failedResults)}`
  );
  assert.equal(suiteResult.total, cases.length);
  assert.equal(suiteResult.passed, true);

  // Assert wall-clock timing report exists and is valid
  assert.ok(fs.existsSync(scratchReportPath));
  const reportRows = JSON.parse(fs.readFileSync(scratchReportPath, "utf8"));
  assert.ok(reportRows.length >= cases.length);
  fs.unlinkSync(scratchReportPath);
});

test("R6: Injected divergence: stdout byte flip fails comparison", async () => {
  const entryA = parseEntry(`node:${path.join(FIXTURES_DIR, "baseline.mjs")}`);
  const entryB = parseEntry(`node:${path.join(FIXTURES_DIR, "divergent-stdout.mjs")}`);

  const res = await runDifferentialCase(entryA, entryB, {
    id: "injected-diff-stdout",
    args: ["arg1", "arg2"],
    modes: ["exact-bytes"],
  });

  assert.equal(res.passed, false, "Harness MUST fail when stdout has byte difference");
  assert.ok(
    res.differences.some((d) => d.includes("stdout byte mismatch")),
    `Expected stdout mismatch error, got: ${res.differences.join("; ")}`
  );
});

test("R6: Injected divergence: exit-code change fails comparison", async () => {
  const entryA = parseEntry(`node:${path.join(FIXTURES_DIR, "baseline.mjs")}`);
  const entryB = parseEntry(`node:${path.join(FIXTURES_DIR, "divergent-exit-code.mjs")}`);

  const res = await runDifferentialCase(entryA, entryB, {
    id: "injected-diff-exit-code",
    args: ["arg1", "arg2"],
    modes: ["exact-bytes"],
  });

  assert.equal(res.passed, false, "Harness MUST fail when exit codes differ");
  assert.ok(
    res.differences.some((d) => d.includes("Exit code mismatch")),
    `Expected exit code mismatch error, got: ${res.differences.join("; ")}`
  );
});

test("R6: Injected divergence: silently dropped/altered argv token fails comparison", async () => {
  const entryA = parseEntry(`node:${path.join(FIXTURES_DIR, "baseline.mjs")}`);
  const entryB = parseEntry(`node:${path.join(FIXTURES_DIR, "divergent-argv.mjs")}`);

  const res = await runDifferentialCase(entryA, entryB, {
    id: "injected-diff-argv",
    args: ["--mode", "active", "--verbose"],
    modes: ["semantic-json"],
  });

  assert.equal(res.passed, false, "Harness MUST fail when argv token is dropped or altered");
  assert.ok(
    res.differences.some((d) => d.includes("receivedArgs")),
    `Expected argv difference in output, got: ${res.differences.join("; ")}`
  );
});

test("R6: Injected divergence: unexpected child process fails comparison", async () => {
  const entryA = parseEntry(`node:${path.join(FIXTURES_DIR, "baseline.mjs")}`);
  const entryB = parseEntry(`node:${path.join(FIXTURES_DIR, "divergent-child-process.mjs")}`);

  const res = await runDifferentialCase(entryA, entryB, {
    id: "injected-diff-child",
    args: ["arg1", "arg2"],
    modes: ["exact-bytes"],
    ignoreChildren: false,
  });

  assert.equal(res.passed, false, "Harness MUST fail when unexpected child process is spawned");
  assert.ok(
    res.differences.some((d) => d.includes("Spawned children count mismatch")),
    `Expected child process mismatch error, got: ${res.differences.join("; ")}`
  );
});

test("R2/R5: Signal comparison mode is exercised end to end (MEDIUM-2)", async () => {
  // signal-trapping.mjs was committed for R5's "target-specific signal ...
  // case" but nothing ran it (MEDIUM-2). SIGKILL, not SIGTERM: SIGTERM is
  // trapped by the fixture (self-exits 143, no OS-level signal termination,
  // so `.signal` would just be null -- not a real signal-mode exercise).
  // SIGKILL cannot be trapped, so both entries are genuinely terminated BY
  // the OS with `.signal === "SIGKILL"`, which is what mode "signal" (and
  // the unconditional signal-equality check every case already gets) exists
  // to compare.
  const entryA = parseEntry(`node:${path.join(FIXTURES_DIR, "signal-trapping.mjs")}`);
  const entryB = parseEntry(`node:${path.join(FIXTURES_DIR, "signal-trapping.mjs")}`);

  const res = await runDifferentialCase(entryA, entryB, {
    id: "signal-mode-exercise",
    args: [],
    modes: ["signal"],
    killSignal: "SIGKILL",
    killSignalAfterMs: 200,
    expectedSignal: "SIGKILL",
    ignoreChildren: true,
    timeoutMs: 5000,
  });

  assert.equal(res.passed, true, `Expected signal-mode case to pass, got: ${res.differences.join("; ")}`);
  assert.equal(res.resultA.signal, "SIGKILL");
  assert.equal(res.resultB.signal, "SIGKILL");
});

test("HIGH-1 regression: a launch failure is an unconditional hard difference, never a match", () => {
  // Unit-level (synthetic results, no real spawn) so this stays fast and
  // exercises compareResults' own early-return directly, matching the
  // reviewer's original reproduction shape: two ENOENT-style failures with
  // every other field left at its default/empty value.
  const testCase = { id: "launch-error-regression", modes: ["exact-bytes"] };
  const baseResult = {
    exitCode: null,
    signal: null,
    launchError: null,
    stdout: Buffer.alloc(0),
    stderr: Buffer.alloc(0),
    stdoutText: "",
    stderrText: "",
    spawnedChildren: [],
    fsDelta: null,
  };

  const bothFailed = compareResults(testCase, { ...baseResult, launchError: { message: "spawn ENOENT", code: "ENOENT" } }, { ...baseResult, launchError: { message: "spawn ENOENT", code: "ENOENT" } });
  assert.equal(bothFailed.passed, false, "Two identically-broken launches must never compare equal");
  assert.ok(bothFailed.differences.some((d) => d.includes("Launch failure")));

  const oneFailed = compareResults(testCase, { ...baseResult, launchError: { message: "spawn ENOENT", code: "ENOENT" } }, { ...baseResult });
  assert.equal(oneFailed.passed, false, "One launch failure alone must fail too");
  assert.ok(oneFailed.differences.some((d) => d.includes("Launch failure")));
});

test("HIGH-2 regression: bin: entries get child-process evidence via the PATH shim, node: entries are not double-counted", async () => {
  const binEntry = parseEntry(`bin:${path.join(FIXTURES_DIR, "bin-git-caller.sh")}`);
  const binResult = await runCaseOnEntry(binEntry, { id: "bin-shim-regression", args: [] });
  assert.equal(binResult.launchError, null, `bin: fixture must launch cleanly, got: ${JSON.stringify(binResult.launchError)}`);
  assert.ok(
    binResult.spawnedChildren.some((c) => path.basename(c.cmd) === "git"),
    `Expected the PATH shim to record a git call for the bin: entry, got: ${JSON.stringify(binResult.spawnedChildren)}`
  );

  // node: entries must NOT double-count: the same real git invocation is
  // reachable through both child-process-spy.cjs (in-process monkeypatch)
  // and the PATH shim (OS-exec boundary) unless the spy's own
  // FGOS_HARNESS_SHIMMED_COMMANDS skip is working. `bin/fgos.mjs version`
  // is the real fgos invocation known to spawn exactly one `git` call.
  const nodeEntry = parseEntry("node:bin/fgos.mjs");
  const nodeResult = await runCaseOnEntry(nodeEntry, { id: "node-no-double-count-regression", args: ["version"] });
  const gitCallsRecorded = nodeResult.spawnedChildren.filter((c) => path.basename(c.cmd) === "git").length;
  assert.equal(
    gitCallsRecorded,
    1,
    `Expected exactly one recorded git call for a node: entry (spy+shim must not double-count), got ${gitCallsRecorded}: ${JSON.stringify(nodeResult.spawnedChildren)}`
  );
});
