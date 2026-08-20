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
} from "../../src/state/events-jsonl-truncation-guard.mjs";
import { recordMainCheckoutGuardWarning, MAIN_CHECKOUT_GUARD_WARNINGS_BASENAME } from "../../src/state/main-checkout-guard-warnings.mjs";

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
  assert.equal(readGuardMark(guardPath), null);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("readGuardMark returns null on a corrupt sidecar (never throws)", () => {
  const dir = mkTempDir("truncguard-read-corrupt-");
  const guardPath = path.join(dir, "events-jsonl.truncation-guard.json");
  fs.writeFileSync(guardPath, "not json at all", "utf8");
  assert.equal(readGuardMark(guardPath), null);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("writeGuardMark then readGuardMark round-trips the mark", () => {
  const dir = mkTempDir("truncguard-roundtrip-");
  const guardPath = path.join(dir, "events-jsonl.truncation-guard.json");
  writeGuardMark(guardPath, { seq: 42, hash: "abc123" });
  const read = readGuardMark(guardPath);
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
  assert.equal(readGuardMark(guardPath).seq, 1);

  fs.appendFileSync(logPath, `${ev(2, "2026-01-01T00:00:01.000Z", "b")}\n`);
  const second = advanceEventsJsonlTruncationGuard(logPath, guardPath);
  assert.equal(second.ok, true);
  assert.equal(readGuardMark(guardPath).seq, 2, "mark advances forward on every clean check");
  fs.rmSync(dir, { recursive: true, force: true });
});

test("advanceEventsJsonlTruncationGuard never advances the mark on a break — the failing mark stays at the last known-good position", () => {
  const dir = mkTempDir("truncguard-advance-break-");
  const logPath = path.join(dir, "events.jsonl");
  const guardPath = path.join(dir, "events-jsonl.truncation-guard.json");
  fs.writeFileSync(logPath, raw([ev(1, "2026-01-01T00:00:00.000Z", "a"), ev(2, "2026-01-01T00:00:01.000Z", "b")]), "utf8");
  advanceEventsJsonlTruncationGuard(logPath, guardPath);
  assert.equal(readGuardMark(guardPath).seq, 2);

  // Simulate a truncation: rewrite the file back to just line 1.
  fs.writeFileSync(logPath, raw([ev(1, "2026-01-01T00:00:00.000Z", "a")]), "utf8");
  const result = advanceEventsJsonlTruncationGuard(logPath, guardPath);
  assert.equal(result.ok, false);
  assert.equal(readGuardMark(guardPath).seq, 2, "mark must not move on a break");
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
  const guardPath = path.join(fgosDir, "events-jsonl.truncation-guard.json");
  const warnPath = path.join(fgosDir, MAIN_CHECKOUT_GUARD_WARNINGS_BASENAME);

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

  // Run check with gap < 900s (e.g. at commitTime + 100s) -> should NOT commit
  runOpportunisticMainCheckoutChecks(fgosDir, repoRoot, { nowSec: commitTime + 100, intervalSec: 900 });
  let logOut = execFileSync("git", ["log", "-1", "--format=%s"], { cwd: repoRoot, encoding: "utf8" }).trim();
  assert.equal(logOut, "init events", "must not commit when gap is under threshold");

  // Run check with gap >= 900s (e.g. at commitTime + 1000s) -> SHOULD commit
  runOpportunisticMainCheckoutChecks(fgosDir, repoRoot, { nowSec: commitTime + 1000, intervalSec: 900 });
  logOut = execFileSync("git", ["log", "-1", "--format=%s"], { cwd: repoRoot, encoding: "utf8" }).trim();
  assert.equal(logOut, "chore(.fgos): periodic events.jsonl checkpoint", "must commit periodic checkpoint when stale and dirty");

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

