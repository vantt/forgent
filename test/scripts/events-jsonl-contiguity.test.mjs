import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  checkContiguity,
  fixContiguity,
  checkEventsJsonlContiguity,
  fixEventsJsonlContiguity,
} from "../../scripts/events-jsonl-contiguity.mjs";

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function ev(seq, ts, type) {
  return JSON.stringify({ seq, ts, type, payload: null });
}

function raw(lines) {
  return `${lines.join("\n")}\n`;
}

// --- checkContiguity (pure core) -------------------------------------------

test("checkContiguity passes on a clean, contiguous log", () => {
  const text = raw([ev(1, "2026-01-01T00:00:00.000Z", "a"), ev(2, "2026-01-01T00:00:01.000Z", "b"), ev(3, "2026-01-01T00:00:02.000Z", "c")]);
  const result = checkContiguity(text);
  assert.equal(result.ok, true);
  assert.equal(result.totalLines, 3);
  assert.deepEqual(result.duplicates, []);
  assert.deepEqual(result.gaps, []);
});

test("checkContiguity reports an empty log as ok (nothing to check)", () => {
  const result = checkContiguity("");
  assert.equal(result.ok, true);
  assert.equal(result.totalLines, 0);
});

test("checkContiguity detects a duplicate seq — the union-merge residue shape (two branches each numbered a new event the same)", () => {
  const text = raw([
    ev(1, "2026-01-01T00:00:00.000Z", "a"),
    ev(2, "2026-01-01T00:00:01.000Z", "branch-a-new"),
    ev(2, "2026-01-01T00:00:02.000Z", "branch-b-new"),
  ]);
  const result = checkContiguity(text);
  assert.equal(result.ok, false);
  assert.equal(result.duplicates.length, 1);
  assert.equal(result.duplicates[0].seq, 2);
  assert.equal(result.duplicates[0].firstLine, 2);
  assert.equal(result.duplicates[0].duplicateLine, 3);
});

test("checkContiguity detects a real gap (a seq skipped entirely)", () => {
  const text = raw([ev(1, "2026-01-01T00:00:00.000Z", "a"), ev(5, "2026-01-01T00:00:01.000Z", "b")]);
  const result = checkContiguity(text);
  assert.equal(result.ok, false);
  assert.equal(result.gaps.length, 1);
  assert.equal(result.gaps[0].afterSeq, 1);
  assert.equal(result.gaps[0].foundSeq, 5);
});

test("checkContiguity ignores pre-Phase-2 legacy lines with no seq field at all", () => {
  const text = raw([JSON.stringify({ ts: "2026-01-01T00:00:00.000Z", type: "legacy", payload: null }), ev(1, "2026-01-01T00:00:01.000Z", "a")]);
  const result = checkContiguity(text);
  assert.equal(result.ok, true);
});

test("checkContiguity throws on an unparseable line — never silently skips corruption", () => {
  assert.throws(() => checkContiguity(raw([ev(1, "2026-01-01T00:00:00.000Z", "a"), "not json"])), /does not parse as JSON/);
});

// --- fixContiguity (pure core) ----------------------------------------------

test("fixContiguity is a byte-identical no-op on an already-contiguous log (except for the 2 changed-fields it never touches)", () => {
  const lines = [ev(1, "2026-01-01T00:00:00.000Z", "a"), ev(2, "2026-01-01T00:00:01.000Z", "b")];
  const result = fixContiguity(raw(lines));
  assert.equal(result.dedupedCount, 0);
  assert.equal(result.resequencedCount, 0);
  assert.equal(result.rewritten, raw(lines));
});

test("fixContiguity dedupes an exact-duplicate line (the rare union-driver identical-line-kept-twice case)", () => {
  const line = ev(1, "2026-01-01T00:00:00.000Z", "a");
  const result = fixContiguity(raw([line, line]));
  assert.equal(result.dedupedCount, 1);
  assert.equal(result.rewritten, raw([line]));
});

test("fixContiguity resequences a duplicate-seq collision without losing either event", () => {
  const text = raw([
    ev(1, "2026-01-01T00:00:00.000Z", "a"),
    ev(2, "2026-01-01T00:00:01.000Z", "branch-a-new"),
    ev(2, "2026-01-01T00:00:02.000Z", "branch-b-new"),
  ]);
  const { rewritten, resequencedCount } = fixContiguity(text);
  assert.equal(resequencedCount, 1);
  const lines = rewritten.trim().split("\n").map((l) => JSON.parse(l));
  assert.equal(lines.length, 3, "no event lost");
  assert.deepEqual(lines.map((l) => l.seq), [1, 2, 3], "contiguous after fix");
  assert.deepEqual(lines.map((l) => l.type), ["a", "branch-a-new", "branch-b-new"], "chronological ts order preserved");
  const recheck = checkContiguity(rewritten);
  assert.equal(recheck.ok, true);
});

test("fixContiguity sorts by ts across a scrambled union-merge order, then renumbers", () => {
  // Simulates `union`'s own documented "random order" residue: the file's
  // line order does not match chronological ts order.
  const text = raw([
    ev(1, "2026-01-03T00:00:00.000Z", "third"),
    ev(1, "2026-01-01T00:00:00.000Z", "first"),
    ev(1, "2026-01-02T00:00:00.000Z", "second"),
  ]);
  const { rewritten } = fixContiguity(text);
  const lines = rewritten.trim().split("\n").map((l) => JSON.parse(l));
  assert.deepEqual(lines.map((l) => l.type), ["first", "second", "third"]);
  assert.deepEqual(lines.map((l) => l.seq), [1, 2, 3]);
});

test("fixContiguity leaves a pre-Phase-2 legacy line's absence of seq untouched", () => {
  const legacy = JSON.stringify({ ts: "2026-01-01T00:00:00.000Z", type: "legacy", payload: null });
  const text = raw([legacy, ev(1, "2026-01-01T00:00:01.000Z", "a")]);
  const { rewritten } = fixContiguity(text);
  const lines = rewritten.trim().split("\n").map((l) => JSON.parse(l));
  assert.equal(lines[0].seq, undefined);
});

// --- checkEventsJsonlContiguity / fixEventsJsonlContiguity (file I/O) ------

test("checkEventsJsonlContiguity reads a real file and reports it clean", () => {
  const dir = mkTempDir("contig-check-file-");
  const logPath = path.join(dir, "events.jsonl");
  fs.writeFileSync(logPath, raw([ev(1, "2026-01-01T00:00:00.000Z", "a")]), "utf8");
  const result = checkEventsJsonlContiguity(logPath);
  assert.equal(result.ok, true);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("fixEventsJsonlContiguity is a no-op (no backup written) when already contiguous", () => {
  const dir = mkTempDir("contig-fix-noop-");
  const logPath = path.join(dir, "events.jsonl");
  const original = raw([ev(1, "2026-01-01T00:00:00.000Z", "a")]);
  fs.writeFileSync(logPath, original, "utf8");
  const result = fixEventsJsonlContiguity(logPath);
  assert.equal(result.fixed, false);
  assert.equal(result.backupPath, null);
  assert.equal(fs.readFileSync(logPath, "utf8"), original, "untouched when nothing to fix");
  fs.rmSync(dir, { recursive: true, force: true });
});

test("fixEventsJsonlContiguity backs up before writing, and the backup matches the pre-fix content", () => {
  const dir = mkTempDir("contig-fix-backup-");
  const logPath = path.join(dir, "events.jsonl");
  const original = raw([
    ev(1, "2026-01-01T00:00:00.000Z", "a"),
    ev(2, "2026-01-01T00:00:01.000Z", "branch-a"),
    ev(2, "2026-01-01T00:00:02.000Z", "branch-b"),
  ]);
  fs.writeFileSync(logPath, original, "utf8");
  const result = fixEventsJsonlContiguity(logPath);
  assert.equal(result.fixed, true);
  assert.ok(result.backupPath);
  assert.equal(fs.readFileSync(result.backupPath, "utf8"), original);
  assert.equal(checkEventsJsonlContiguity(logPath).ok, true);
  fs.rmSync(dir, { recursive: true, force: true });
});
