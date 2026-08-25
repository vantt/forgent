import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  computeGuardMark,
  checkTruncationGuard,
  readGuardMark,
  writeGuardMark,
  checkEventsJsonlTruncationGuard,
  advanceEventsJsonlTruncationGuard,
  runOpportunisticMainCheckoutChecks,
  getUncommittedEventCount,
} from "../../src/state/events-jsonl-truncation-guard.mjs";
import { recordMainCheckoutGuardWarning, MAIN_CHECKOUT_GUARD_WARNINGS_BASENAME } from "../../src/state/main-checkout-guard-warnings.mjs";

delete process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS;

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function ev(seq, ts, type) {
  return JSON.stringify({ seq, ts, type, payload: null });
}

function raw(lines) {
  return `${lines.join("\n")}\n`;
}

// --- computeGuardMark (pure core) -------------------------------------------

test("computeGuardMark returns null for an empty log", () => {
  assert.equal(computeGuardMark(""), null);
});

test("computeGuardMark returns null for a legacy tail with no seq field", () => {
  const text = raw([JSON.stringify({ ts: "2026-01-01T00:00:00.000Z", type: "legacy", payload: null })]);
  assert.equal(computeGuardMark(text), null);
});

test("computeGuardMark returns {seq, hash} of the last line, ignoring earlier lines", () => {
  const text = raw([ev(1, "2026-01-01T00:00:00.000Z", "a"), ev(2, "2026-01-01T00:00:01.000Z", "b")]);
  const mark = computeGuardMark(text);
  assert.equal(mark.seq, 2);
  assert.equal(typeof mark.hash, "string");
  assert.equal(mark.hash.length, 64, "sha256 hex digest");
});

test("computeGuardMark throws on an unparseable last line — never silently marks corruption", () => {
  assert.throws(() => computeGuardMark(raw([ev(1, "2026-01-01T00:00:00.000Z", "a"), "not json"])), /does not parse as JSON/);
});

// --- checkTruncationGuard (pure core) --------------------------------------

test("checkTruncationGuard bootstraps cleanly on first run (no prior mark) against a healthy, pre-existing multi-line log — never false-flags real history as a regression", () => {
  const text = raw([ev(1, "2026-01-01T00:00:00.000Z", "a"), ev(2, "2026-01-01T00:00:01.000Z", "b"), ev(500, "2026-01-01T00:00:02.000Z", "c")]);
  const result = checkTruncationGuard(text, null);
  assert.equal(result.ok, true);
  assert.equal(result.reason, "bootstrap");
  assert.equal(result.mark.seq, 500);
});

test("checkTruncationGuard passes on clean, non-truncated growth and advances the mark forward — no false positive", () => {
  const oldMark = computeGuardMark(raw([ev(1, "2026-01-01T00:00:00.000Z", "a")]));
  const grown = raw([ev(1, "2026-01-01T00:00:00.000Z", "a"), ev(2, "2026-01-01T00:00:01.000Z", "b"), ev(3, "2026-01-01T00:00:02.000Z", "c")]);
  const result = checkTruncationGuard(grown, oldMark);
  assert.equal(result.ok, true);
  assert.equal(result.reason, "clean");
  assert.equal(result.mark.seq, 3);
});

test("checkTruncationGuard flags an obvious regression when the current tip's seq is lower than the stored mark", () => {
  const oldMark = computeGuardMark(raw([ev(1, "2026-01-01T00:00:00.000Z", "a"), ev(2, "2026-01-01T00:00:01.000Z", "b")]));
  const truncated = raw([ev(1, "2026-01-01T00:00:00.000Z", "a")]);
  const result = checkTruncationGuard(truncated, oldMark);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "regressed");
});

test("checkTruncationGuard flags a log emptied of its seq'd tail entirely", () => {
  const oldMark = computeGuardMark(raw([ev(1, "2026-01-01T00:00:00.000Z", "a")]));
  const result = checkTruncationGuard("", oldMark);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "log-emptied");
});

// The case this item exists for: a stash-truncate-then-reappend regrows
// PAST the old mark before the next check runs, so a seq-only comparison
// would miss it -- proven empirically during fgos-validating
// (docs/history/events-jsonl-git-tracked-truncation/plan.md's feasibility
// matrix). Replayed here as the real test.
test("checkTruncationGuard catches a truncate-then-reappend even after the log regrows PAST the old mark (the blind window a seq-only design would miss)", () => {
  const originalTail = raw([
    ev(11685, "2026-08-10T06:30:00Z", "orig"),
    ev(11691, "2026-08-10T06:31:00Z", "orig"),
  ]);
  const oldMark = computeGuardMark(originalTail); // {seq: 11691, hash of the real "orig" event}

  // git stash reverts to the committed baseline (seq 11626), then normal
  // appends resume from there with DIFFERENT events reusing seq 11627..11696
  // -- regrowing past the old mark (11691) before the next check.
  const lines = [];
  for (let s = 11627; s <= 11696; s++) {
    lines.push(ev(s, "2026-08-10T09:00:00Z", "post-truncation"));
  }
  const postTruncation = raw(lines);

  const seqOnlyWouldPass = JSON.parse(lines[lines.length - 1]).seq >= oldMark.seq;
  assert.equal(seqOnlyWouldPass, true, "sanity: a seq-only comparison really would miss this — the tip did regrow past the old mark");

  const result = checkTruncationGuard(postTruncation, oldMark);
  assert.equal(result.ok, false, "content-hash design must still catch it");
  assert.equal(result.reason, "content-mismatch");
  assert.match(result.message, /seq 11691/);
});

test("checkTruncationGuard flags mark-seq-missing when the mark's own seq no longer appears anywhere (a gap, not just a mismatch)", () => {
  const oldMark = computeGuardMark(raw([ev(1, "2026-01-01T00:00:00.000Z", "a"), ev(5, "2026-01-01T00:00:01.000Z", "b")]));
  const withoutMarkSeq = raw([ev(1, "2026-01-01T00:00:00.000Z", "a"), ev(9, "2026-01-01T00:00:01.000Z", "c")]);
  const result = checkTruncationGuard(withoutMarkSeq, oldMark);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "mark-seq-missing");
});

// --- readGuardMark / writeGuardMark (file I/O) ------------------------------

test("readGuardMark returns null when the sidecar does not exist yet (bootstrap, not a crash)", () => {
  const dir = mkTempDir("truncguard-read-missing-");
  const guardPath = path.join(dir, "events-jsonl.truncation-guard.json");
  assert.equal(readGuardMark(guardPath, "events.jsonl"), null);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("readGuardMark returns null on a corrupt sidecar (never throws)", () => {
  const dir = mkTempDir("truncguard-read-corrupt-");
  const guardPath = path.join(dir, "events-jsonl.truncation-guard.json");
  fs.writeFileSync(guardPath, "not json at all", "utf8");
  assert.equal(readGuardMark(guardPath, "events.jsonl"), null);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("writeGuardMark then readGuardMark round-trips the mark", () => {
  const dir = mkTempDir("truncguard-roundtrip-");
  const guardPath = path.join(dir, "events-jsonl.truncation-guard.json");
  writeGuardMark(guardPath, "events.jsonl", { seq: 42, hash: "abc123" });
  const read = readGuardMark(guardPath, "events.jsonl");
  assert.deepEqual(read, { seq: 42, hash: "abc123" });
  fs.rmSync(dir, { recursive: true, force: true });
});

// --- checkEventsJsonlTruncationGuard / advanceEventsJsonlTruncationGuard ---

test("checkEventsJsonlTruncationGuard is read-only — never writes the sidecar even on a clean bootstrap pass", () => {
  const dir = mkTempDir("truncguard-check-readonly-");
  const logPath = path.join(dir, "events.jsonl");
  const guardPath = path.join(dir, "events-jsonl.truncation-guard.json");
  fs.writeFileSync(logPath, raw([ev(1, "2026-01-01T00:00:00.000Z", "a")]), "utf8");

  const result = checkEventsJsonlTruncationGuard(logPath, guardPath);
  assert.equal(result.ok, true);
  assert.equal(fs.existsSync(guardPath), false, "check must never write the sidecar");
  fs.rmSync(dir, { recursive: true, force: true });
});

test("advanceEventsJsonlTruncationGuard writes the mark forward on a clean pass", () => {
  const dir = mkTempDir("truncguard-advance-clean-");
  const logPath = path.join(dir, "events.jsonl");
  const guardPath = path.join(dir, "events-jsonl.truncation-guard.json");
  fs.writeFileSync(logPath, raw([ev(1, "2026-01-01T00:00:00.000Z", "a")]), "utf8");

  const first = advanceEventsJsonlTruncationGuard(logPath, guardPath);
  assert.equal(first.ok, true);
  assert.equal(readGuardMark(guardPath, "events.jsonl").seq, 1);

  fs.appendFileSync(logPath, `${ev(2, "2026-01-01T00:00:01.000Z", "b")}\n`);
  const second = advanceEventsJsonlTruncationGuard(logPath, guardPath);
  assert.equal(second.ok, true);
  assert.equal(readGuardMark(guardPath, "events.jsonl").seq, 2, "mark advances forward on every clean check");
  fs.rmSync(dir, { recursive: true, force: true });
});

test("advanceEventsJsonlTruncationGuard never advances the mark on a break — the failing mark stays at the last known-good position", () => {
  const dir = mkTempDir("truncguard-advance-break-");
  const logPath = path.join(dir, "events.jsonl");
  const guardPath = path.join(dir, "events-jsonl.truncation-guard.json");
  fs.writeFileSync(logPath, raw([ev(1, "2026-01-01T00:00:00.000Z", "a"), ev(2, "2026-01-01T00:00:01.000Z", "b")]), "utf8");
  advanceEventsJsonlTruncationGuard(logPath, guardPath);
  assert.equal(readGuardMark(guardPath, "events.jsonl").seq, 2);

  // Simulate a truncation: rewrite the file back to just line 1.
  fs.writeFileSync(logPath, raw([ev(1, "2026-01-01T00:00:00.000Z", "a")]), "utf8");
  const result = advanceEventsJsonlTruncationGuard(logPath, guardPath);
  assert.equal(result.ok, false);
  assert.equal(readGuardMark(guardPath, "events.jsonl").seq, 2, "mark must not move on a break");
  fs.rmSync(dir, { recursive: true, force: true });
});

test("advanceEventsJsonlTruncationGuard treats a missing log as an empty one (bootstrap-clean), not a crash", () => {
  const dir = mkTempDir("truncguard-advance-nolog-");
  const logPath = path.join(dir, "events.jsonl");
  const guardPath = path.join(dir, "events-jsonl.truncation-guard.json");
  const result = advanceEventsJsonlTruncationGuard(logPath, guardPath);
  assert.equal(result.ok, true);
  assert.equal(result.mark, null);
  fs.rmSync(dir, { recursive: true, force: true });
});

// --- runOpportunisticMainCheckoutChecks (D1 & D2) -----------------------------

test("runOpportunisticMainCheckoutChecks D1: records warning on truncation break into main-checkout-guard-warnings.jsonl without throwing", () => {
  const repoRoot = mkTempDir("truncguard-d1-test-");
  const fgosDir = path.join(repoRoot, ".fgos");
  fs.mkdirSync(fgosDir, { recursive: true });
  const logPath = path.join(fgosDir, "events.jsonl");
  const guardPath = path.join(fgosDir, "runtime", "events-jsonl.truncation-guard.json");
  const warnPath = path.join(fgosDir, 'logs', MAIN_CHECKOUT_GUARD_WARNINGS_BASENAME);

  // Set initial mark at seq 2
  fs.writeFileSync(logPath, raw([ev(1, "2026-01-01T00:00:00.000Z", "a"), ev(2, "2026-01-01T00:00:01.000Z", "b")]), "utf8");
  advanceEventsJsonlTruncationGuard(logPath, guardPath);

  // Truncate file back to seq 1
  fs.writeFileSync(logPath, raw([ev(1, "2026-01-01T00:00:00.000Z", "a")]), "utf8");

  // Run opportunistic checks — should catch truncation break and write warning
  runOpportunisticMainCheckoutChecks(fgosDir, repoRoot);

  assert.equal(fs.existsSync(warnPath), true, "warning log must be written");
  const warnContent = fs.readFileSync(warnPath, "utf8");
  assert.match(warnContent, /regressed/);

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test("runOpportunisticMainCheckoutChecks D2: commits stale-and-dirty events.jsonl when timestamp gap >= intervalSec", () => {
  const repoRoot = mkTempDir("truncguard-d2-test-");
  execFileSync("git", ["init", "-q"], { cwd: repoRoot });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repoRoot });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repoRoot });

  const fgosDir = path.join(repoRoot, ".fgos");
  fs.mkdirSync(fgosDir, { recursive: true });
  const logPath = path.join(fgosDir, "events.jsonl");

  const commitTime = 1000000;
  fs.writeFileSync(logPath, raw([ev(1, "2026-01-01T00:00:00.000Z", "init")]), "utf8");
  execFileSync("git", ["add", ".fgos/events.jsonl"], { cwd: repoRoot });
  execFileSync("git", ["commit", "-q", "-m", "init events"], {
    cwd: repoRoot,
    env: { ...process.env, GIT_AUTHOR_DATE: `@${commitTime} +0000`, GIT_COMMITTER_DATE: `@${commitTime} +0000` },
  });

  // Append new uncommitted event
  fs.appendFileSync(logPath, `${ev(2, "2026-01-01T00:01:00.000Z", "append")}\n`);

  // Run check with gap < 3600s (e.g. at commitTime + 100s) -> should NOT commit
  runOpportunisticMainCheckoutChecks(fgosDir, repoRoot, { nowSec: commitTime + 100, fallbackIntervalSec: 3600 });
  let logOut = execFileSync("git", ["log", "-1", "--format=%s"], { cwd: repoRoot, encoding: "utf8" }).trim();
  assert.equal(logOut, "init events", "must not commit when gap is under threshold");

  // Run check with gap >= 3600s (e.g. at commitTime + 4000s) -> SHOULD commit
  runOpportunisticMainCheckoutChecks(fgosDir, repoRoot, { nowSec: commitTime + 4000, fallbackIntervalSec: 3600 });
  logOut = execFileSync("git", ["log", "-1", "--format=%s"], { cwd: repoRoot, encoding: "utf8" }).trim();
  assert.equal(logOut, "chore(.fgos): fallback events checkpoint", "must commit fallback checkpoint when stale and dirty");

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test("runOpportunisticMainCheckoutChecks D1: refuses fallback auto-commit when an unacknowledged truncation break is flagged", () => {
  const repoRoot = mkTempDir("truncguard-d1-refuse-test-");
  execFileSync("git", ["init", "-q"], { cwd: repoRoot });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repoRoot });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repoRoot });

  const fgosDir = path.join(repoRoot, ".fgos");
  fs.mkdirSync(fgosDir, { recursive: true });
  const logPath = path.join(fgosDir, "events.jsonl");
  const guardPath = path.join(fgosDir, "runtime", "events-jsonl.truncation-guard.json");

  const commitTime = 1000000;
  fs.writeFileSync(logPath, raw([ev(1, "2026-01-01T00:00:00.000Z", "a"), ev(2, "2026-01-01T00:00:01.000Z", "b")]), "utf8");
  execFileSync("git", ["add", ".fgos/events.jsonl"], { cwd: repoRoot });
  execFileSync("git", ["commit", "-q", "-m", "init events"], {
    cwd: repoRoot,
    env: { ...process.env, GIT_AUTHOR_DATE: `@${commitTime} +0000`, GIT_COMMITTER_DATE: `@${commitTime} +0000` },
  });

  // Set initial mark at seq 2
  advanceEventsJsonlTruncationGuard(logPath, guardPath);

  // Truncate file back to seq 1 and add uncommitted events
  const regressedLines = [ev(1, "2026-01-01T00:00:00.000Z", "a")];
  for (let i = 2; i <= 20; i++) {
    regressedLines.push(ev(i, "2026-01-01T00:00:02.000Z", `new-${i}`));
  }
  fs.writeFileSync(logPath, raw(regressedLines), "utf8");

  // Run opportunistic checks with fallbackIntervalSec 100s
  runOpportunisticMainCheckoutChecks(fgosDir, repoRoot, { nowSec: commitTime + 1000, fallbackIntervalSec: 100 });

  // Verify: auto-commit MUST be refused despite time threshold met, because break was flagged
  const logOut = execFileSync("git", ["log", "-1", "--format=%s"], { cwd: repoRoot, encoding: "utf8" }).trim();
  assert.equal(logOut, "init events", "must refuse fallback auto-commit when truncation break is flagged");

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test("runOpportunisticMainCheckoutChecks D2: reads fallbackIntervalSec from .fgos/config.json", () => {
  const repoRoot = mkTempDir("truncguard-d2-config-test-");
  execFileSync("git", ["init", "-q"], { cwd: repoRoot });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repoRoot });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repoRoot });

  const fgosDir = path.join(repoRoot, ".fgos");
  fs.mkdirSync(fgosDir, { recursive: true });
  const logPath = path.join(fgosDir, "events.jsonl");
  const configPath = path.join(fgosDir, "config.json");

  // Write .fgos/config.json with checkpoint fallbackIntervalSec: 500
  fs.writeFileSync(configPath, JSON.stringify({ checkpoint: { fallbackIntervalSec: 500 } }), "utf8");

  const commitTime = 1000000;
  fs.writeFileSync(logPath, raw([ev(1, "2026-01-01T00:00:00.000Z", "init")]), "utf8");
  execFileSync("git", ["add", ".fgos/events.jsonl"], { cwd: repoRoot });
  execFileSync("git", ["commit", "-q", "-m", "init events"], {
    cwd: repoRoot,
    env: { ...process.env, GIT_AUTHOR_DATE: `@${commitTime} +0000`, GIT_COMMITTER_DATE: `@${commitTime} +0000` },
  });

  // Append 1 uncommitted event
  fs.appendFileSync(logPath, `${ev(2, "2026-01-01T00:01:00.000Z", "e2")}\n`);

  // Time gap 100s < 500s -> should NOT commit
  runOpportunisticMainCheckoutChecks(fgosDir, repoRoot, { nowSec: commitTime + 100 });
  let logOut = execFileSync("git", ["log", "-1", "--format=%s"], { cwd: repoRoot, encoding: "utf8" }).trim();
  assert.equal(logOut, "init events");

  // Time gap 600s >= 500s -> SHOULD commit
  runOpportunisticMainCheckoutChecks(fgosDir, repoRoot, { nowSec: commitTime + 600 });
  logOut = execFileSync("git", ["log", "-1", "--format=%s"], { cwd: repoRoot, encoding: "utf8" }).trim();
  assert.equal(logOut, "chore(.fgos): fallback events checkpoint", "must commit based on fallbackIntervalSec configured in .fgos/config.json");

  fs.rmSync(repoRoot, { recursive: true, force: true });
});



// --- Tầng A/T5: multi-file guard mark map + directory scanning (TA-D10) ----

test("the sidecar map holds independent marks per file — advancing one file's mark never touches another's", () => {
  const dir = mkTempDir("truncguard-multi-mark-");
  const guardPath = path.join(dir, "events-jsonl.truncation-guard.json");
  writeGuardMark(guardPath, "events.jsonl", { seq: 1, hash: "aaa" });
  writeGuardMark(guardPath, "events/writer-a-1.jsonl", { seq: 7, hash: "bbb" });

  assert.deepEqual(readGuardMark(guardPath, "events.jsonl"), { seq: 1, hash: "aaa" });
  assert.deepEqual(readGuardMark(guardPath, "events/writer-a-1.jsonl"), { seq: 7, hash: "bbb" });

  writeGuardMark(guardPath, "events.jsonl", { seq: 2, hash: "ccc" });
  assert.deepEqual(readGuardMark(guardPath, "events.jsonl"), { seq: 2, hash: "ccc" }, "events.jsonl's own mark advanced");
  assert.deepEqual(readGuardMark(guardPath, "events/writer-a-1.jsonl"), { seq: 7, hash: "bbb" }, "writer-a's own mark is untouched");
  fs.rmSync(dir, { recursive: true, force: true });
});

test("runOpportunisticMainCheckoutChecks D1 detects and warns on a truncation break in a PER-WRITER file under .fgos/events/, not just baseline-0", () => {
  const repoRoot = mkTempDir("truncguard-multi-d1-");
  const fgosDir = path.join(repoRoot, ".fgos");
  const eventsDir = path.join(fgosDir, "events");
  fs.mkdirSync(eventsDir, { recursive: true });
  const writerLogPath = path.join(eventsDir, "writer-a-1.jsonl");
  const guardPath = path.join(fgosDir, "events-jsonl.truncation-guard.json");
  const warnPath = path.join(fgosDir, 'logs', MAIN_CHECKOUT_GUARD_WARNINGS_BASENAME);

  fs.writeFileSync(writerLogPath, raw([ev(1, "2026-01-01T00:00:00.000Z", "a"), ev(2, "2026-01-01T00:00:01.000Z", "b")]), "utf8");
  runOpportunisticMainCheckoutChecks(fgosDir, repoRoot); // bootstraps the mark for writer-a-1.jsonl

  // Truncate the WRITER file (not baseline) back to seq 1.
  fs.writeFileSync(writerLogPath, raw([ev(1, "2026-01-01T00:00:00.000Z", "a")]), "utf8");
  runOpportunisticMainCheckoutChecks(fgosDir, repoRoot);

  assert.equal(fs.existsSync(warnPath), true, "warning log must be written for a per-writer-file break");
  const warnContent = fs.readFileSync(warnPath, "utf8");
  assert.match(warnContent, /regressed/);
  assert.match(warnContent, /events\/writer-a-1\.jsonl/, "the warning must identify WHICH file broke");
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test("getUncommittedEventCount sums uncommitted lines across baseline-0 AND every per-writer file under .fgos/events/", () => {
  const repoRoot = mkTempDir("truncguard-uncommitted-multi-");
  execFileSync("git", ["init", "-q"], { cwd: repoRoot });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repoRoot });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repoRoot });

  const fgosDir = path.join(repoRoot, ".fgos");
  const eventsDir = path.join(fgosDir, "events");
  fs.mkdirSync(eventsDir, { recursive: true });
  const baselinePath = path.join(fgosDir, "events.jsonl");
  const writerPath = path.join(eventsDir, "writer-a-1.jsonl");

  fs.writeFileSync(baselinePath, raw([ev(1, "2026-01-01T00:00:00.000Z", "a")]), "utf8");
  fs.writeFileSync(writerPath, raw([ev(1, "2026-01-01T00:00:01.000Z", "b")]), "utf8");
  execFileSync("git", ["add", ".fgos"], { cwd: repoRoot });
  execFileSync("git", ["commit", "-q", "-m", "init"], { cwd: repoRoot });

  // 2 more uncommitted lines in baseline, 1 more in the writer file -> 3 total.
  fs.appendFileSync(baselinePath, `${ev(2, "2026-01-01T00:00:02.000Z", "c")}\n${ev(3, "2026-01-01T00:00:03.000Z", "d")}\n`);
  fs.appendFileSync(writerPath, `${ev(2, "2026-01-01T00:00:04.000Z", "e")}\n`);

  assert.equal(getUncommittedEventCount(fgosDir, repoRoot), 3);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test("runOpportunisticMainCheckoutChecks D2 checkpoints BOTH baseline-0 and .fgos/events/ together when the fallback interval is met", () => {
  const repoRoot = mkTempDir("truncguard-multi-d2-");
  execFileSync("git", ["init", "-q"], { cwd: repoRoot });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repoRoot });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repoRoot });

  const fgosDir = path.join(repoRoot, ".fgos");
  const eventsDir = path.join(fgosDir, "events");
  fs.mkdirSync(eventsDir, { recursive: true });
  const baselinePath = path.join(fgosDir, "events.jsonl");
  const writerPath = path.join(eventsDir, "writer-a-1.jsonl");

  const commitTime = 1000000;
  fs.writeFileSync(baselinePath, raw([ev(1, "2026-01-01T00:00:00.000Z", "init")]), "utf8");
  fs.writeFileSync(writerPath, raw([ev(1, "2026-01-01T00:00:01.000Z", "init-writer")]), "utf8");
  execFileSync("git", ["add", ".fgos"], { cwd: repoRoot });
  execFileSync("git", ["commit", "-q", "-m", "init events"], {
    cwd: repoRoot,
    env: { ...process.env, GIT_AUTHOR_DATE: `@${commitTime} +0000`, GIT_COMMITTER_DATE: `@${commitTime} +0000` },
  });

  // 3 uncommitted new lines in the writer file only
  fs.appendFileSync(
    writerPath,
    `${ev(2, "2026-01-01T00:01:00.000Z", "e2")}\n${ev(3, "2026-01-01T00:01:01.000Z", "e3")}\n${ev(4, "2026-01-01T00:01:02.000Z", "e4")}\n`,
  );

  runOpportunisticMainCheckoutChecks(fgosDir, repoRoot, { nowSec: commitTime + 4000, fallbackIntervalSec: 3600 });
  const logOut = execFileSync("git", ["log", "-1", "--format=%s"], { cwd: repoRoot, encoding: "utf8" }).trim();
  assert.equal(logOut, "chore(.fgos): fallback events checkpoint", "must commit when fallback interval is met");

  const statusOut = execFileSync("git", ["status", "--porcelain", "--", ".fgos/events.jsonl", ".fgos/events"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();
  assert.equal(statusOut, "", "the writer file's new lines must actually be committed, not left dirty");
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test("FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 opts out of opportunistic checks completely", () => {
  const repoRoot = mkTempDir("truncguard-optout-");
  execFileSync("git", ["init", "-q"], { cwd: repoRoot });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repoRoot });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repoRoot });

  const fgosDir = path.join(repoRoot, ".fgos");
  fs.mkdirSync(fgosDir, { recursive: true });
  const logPath = path.join(fgosDir, "events.jsonl");

  const commitTime = 1000000;
  fs.writeFileSync(logPath, raw([ev(1, "2026-01-01T00:00:00.000Z", "init")]), "utf8");
  execFileSync("git", ["add", ".fgos/events.jsonl"], { cwd: repoRoot });
  execFileSync("git", ["commit", "-q", "-m", "init events"], {
    cwd: repoRoot,
    env: { ...process.env, GIT_AUTHOR_DATE: `@${commitTime} +0000`, GIT_COMMITTER_DATE: `@${commitTime} +0000` },
  });

  fs.appendFileSync(logPath, `${ev(2, "2026-01-01T00:01:00.000Z", "e2")}\n`);

  const prevEnv = process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS;
  try {
    process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS = "1";
    runOpportunisticMainCheckoutChecks(fgosDir, repoRoot, { nowSec: commitTime + 4000, fallbackIntervalSec: 3600 });
    const logOut = execFileSync("git", ["log", "-1", "--format=%s"], { cwd: repoRoot, encoding: "utf8" }).trim();
    assert.equal(logOut, "init events", "must not commit when FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 is set");
  } finally {
    if (prevEnv === undefined) delete process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS;
    else process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS = prevEnv;
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
});
