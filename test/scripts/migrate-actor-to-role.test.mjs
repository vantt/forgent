import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { migrateActorToRole } from "../../scripts/migrate-actor-to-role.mjs";
import { withEventsLock } from "../../src/state/events.mjs";

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// Fixture: mirrors the real shapes named in CONTEXT.md D7/D14/D19 --
// a pre-Phase-2 legacy line (no `v` at all), a top-level `payload.actor`,
// a nested `payload.predicted.actor`, and a `v`-carrying line with no actor
// field at all (still due a version bump per D19).
function fixtureLines() {
  return [
    JSON.stringify({ seq: 1, ts: "2026-01-01T00:00:00.000Z", type: "work.add", payload: { id: "w1" } }),
    JSON.stringify({ seq: 2, ts: "2026-01-01T00:00:01.000Z", type: "work.claim", payload: { id: "w1", actor: "human" }, v: 2 }),
    JSON.stringify({
      seq: 3,
      ts: "2026-01-01T00:00:02.000Z",
      type: "work.outcome",
      payload: { id: "w1", predicted: { tier: "standard", deps: 0, actor: "session" } },
      v: 2,
    }),
    JSON.stringify({ seq: 4, ts: "2026-01-01T00:00:03.000Z", type: "work.move", payload: { id: "w1", to: "doing" }, v: 2 }),
  ];
}

function writeFixture(dir) {
  const logPath = path.join(dir, "events.jsonl");
  const raw = `${fixtureLines().join("\n")}\n`;
  fs.writeFileSync(logPath, raw, "utf8");
  return { logPath, raw };
}

function setup(prefix) {
  const dir = mkTempDir(prefix);
  const { logPath, raw } = writeFixture(dir);
  const backupPath = path.join(mkTempDir(`${prefix}backup-`), "events.jsonl.bak");
  return { dir, logPath, raw, backupPath };
}

// --- (a) dry-run writes nothing ------------------------------------------

test("dry-run writes nothing", () => {
  const { logPath, raw, backupPath } = setup("migrate-dry-run-");

  const report = migrateActorToRole(logPath, { backupPath, dryRun: true });

  assert.equal(fs.readFileSync(logPath, "utf8"), raw, "dry-run must leave the target byte-identical");
  assert.equal(fs.existsSync(backupPath), false, "dry-run must not write a backup");
  assert.equal(report.dryRun, true);
  assert.equal(report.changed, 3, "reports the 3 lines it would change (2 actor renames + 1 bare version bump)");
  assert.equal(report.totalLines, 4);
});

// --- (b) backup reproduces the original bytes ----------------------------

test("backup reproduces the original bytes", () => {
  const { logPath, raw, backupPath } = setup("migrate-backup-");

  migrateActorToRole(logPath, { backupPath });

  assert.equal(fs.readFileSync(backupPath, "utf8"), raw, "backup must reproduce the pre-migration bytes exactly");
});

// --- (c) line count and seq stay contiguous -------------------------------

test("line count and seq stay contiguous", () => {
  const { logPath, backupPath } = setup("migrate-shape-");

  migrateActorToRole(logPath, { backupPath });

  const rewritten = fs.readFileSync(logPath, "utf8");
  const lines = rewritten.split("\n");
  assert.equal(lines[lines.length - 1], "", "rewritten log ends with a trailing newline");
  lines.pop();

  assert.equal(lines.length, 4, "same line count as the original");

  const parsed = lines.map((line) => JSON.parse(line));
  const seqs = parsed.map((event) => event.seq);
  assert.deepEqual(seqs, [1, 2, 3, 4], "seq stays contiguous with no gap or reordering");
});

// --- (d) a second run is a no-op ------------------------------------------

test("a second run is a no-op", () => {
  const { logPath, backupPath } = setup("migrate-idempotent-");

  migrateActorToRole(logPath, { backupPath });
  const afterFirst = fs.readFileSync(logPath, "utf8");

  const secondBackupPath = path.join(mkTempDir("migrate-idempotent-backup2-"), "events.jsonl.bak");
  const report = migrateActorToRole(logPath, { backupPath: secondBackupPath });
  const afterSecond = fs.readFileSync(logPath, "utf8");

  assert.equal(report.changed, 0, "second run reports zero changes");
  assert.equal(afterSecond, afterFirst, "second run leaves bytes identical to the first run output");
});

// --- (e) a held lock blocks then refuses -----------------------------------

test("a held lock blocks then refuses", () => {
  const { logPath, backupPath } = setup("migrate-locked-");

  let sawBlockThenRefuse = false;
  const start = Date.now();
  withEventsLock(logPath, () => {
    assert.throws(
      () => migrateActorToRole(logPath, { backupPath }),
      (err) => err.category === "lock-timeout",
      "migration under a held lock must refuse via the lock-timeout category, not write",
    );
    sawBlockThenRefuse = true;
  });
  const elapsedMs = Date.now() - start;

  assert.equal(sawBlockThenRefuse, true);
  assert.ok(elapsedMs >= 1900, `refusal must be preceded by the real block (measured ${elapsedMs}ms, expected >= ~2000ms)`);
  assert.equal(fs.readFileSync(logPath, "utf8"), fixtureLines().join("\n") + "\n", "a refused migration never wrote the target");
});

// --- (f) refuses without a backup path -------------------------------------

test("refuses without a backup path", () => {
  const { logPath, raw } = setup("migrate-no-backup-");

  assert.throws(() => migrateActorToRole(logPath, {}), /backup/i);
  assert.equal(fs.readFileSync(logPath, "utf8"), raw, "a refused migration never wrote the target");
});

// --- (g) refuses a backup inside the store ----------------------------------

test("refuses a backup inside the store", () => {
  const { dir, logPath, raw } = setup("migrate-backup-inside-");
  const insideBackupPath = path.join(dir, "events.jsonl.bak");

  assert.throws(() => migrateActorToRole(logPath, { backupPath: insideBackupPath }), /store/i);
  assert.equal(fs.readFileSync(logPath, "utf8"), raw, "a refused migration never wrote the target");
  assert.equal(fs.existsSync(insideBackupPath), false, "the refused backup path was never written");
});

// --- (h) a line with no version field is left byte-identical ---------------

test("a line with no version field is left byte-identical", () => {
  const { logPath, backupPath } = setup("migrate-legacy-line-");
  const legacyLine = fixtureLines()[0];

  migrateActorToRole(logPath, { backupPath });

  const rewritten = fs.readFileSync(logPath, "utf8");
  const firstLine = rewritten.split("\n")[0];
  assert.equal(firstLine, legacyLine, "a line with no v field is copied through byte-identical, never touched");
});
