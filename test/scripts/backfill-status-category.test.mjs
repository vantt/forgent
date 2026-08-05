import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { backfillStatusCategory } from "../../scripts/backfill-status-category.mjs";
import { withEventsLock } from "../../src/state/events.mjs";

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// Fixture: covers all ten real statuses -- the six front-segment statuses
// (as both a work.add's payload.status and a work.move's payload.to), the
// four tail-segment statuses (delivered/retrospective/cleanup/done, which
// must get NO statusCategory), an event that already carries statusCategory
// (idempotency), and a non-work.add/work.move event type (untouched).
function fixtureLines() {
  return [
    // work.add carrying an initial status (todo -> statusCategory: todo)
    JSON.stringify({ seq: 1, ts: "2026-01-01T00:00:00.000Z", type: "work.add", payload: { id: "w1", status: "todo" }, v: 2 }),
    // work.move covering each front-segment status as `to`
    JSON.stringify({ seq: 2, ts: "2026-01-01T00:00:01.000Z", type: "work.move", payload: { id: "w1", from: "todo", to: "doing" }, v: 2 }),
    JSON.stringify({ seq: 3, ts: "2026-01-01T00:00:02.000Z", type: "work.move", payload: { id: "w1", from: "doing", to: "blocked" }, v: 2 }),
    JSON.stringify({ seq: 4, ts: "2026-01-01T00:00:03.000Z", type: "work.move", payload: { id: "w1", from: "blocked", to: "awaiting-human" }, v: 2 }),
    JSON.stringify({ seq: 5, ts: "2026-01-01T00:00:04.000Z", type: "work.move", payload: { id: "w1", from: "awaiting-human", to: "doing" }, v: 2 }),
    JSON.stringify({ seq: 6, ts: "2026-01-01T00:00:05.000Z", type: "work.move", payload: { id: "w1", from: "doing", to: "awaiting-approval" }, v: 2 }),
    JSON.stringify({ seq: 7, ts: "2026-01-01T00:00:06.000Z", type: "work.move", payload: { id: "w1", from: "awaiting-approval", to: "todo", reason: "changes requested" }, v: 2 }),
    // wontfix, from its own item
    JSON.stringify({ seq: 8, ts: "2026-01-01T00:00:07.000Z", type: "work.add", payload: { id: "w2", status: "todo" }, v: 2 }),
    JSON.stringify({ seq: 9, ts: "2026-01-01T00:00:08.000Z", type: "work.move", payload: { id: "w2", from: "todo", to: "wontfix", reason: "out of scope" }, v: 2 }),
    // tail-segment chain, from a third item -- must get NO statusCategory
    JSON.stringify({ seq: 10, ts: "2026-01-01T00:00:09.000Z", type: "work.add", payload: { id: "w3", status: "todo" }, v: 2 }),
    JSON.stringify({ seq: 11, ts: "2026-01-01T00:00:10.000Z", type: "work.move", payload: { id: "w3", from: "todo", to: "doing" }, v: 2 }),
    JSON.stringify({ seq: 12, ts: "2026-01-01T00:00:11.000Z", type: "work.move", payload: { id: "w3", from: "doing", to: "awaiting-approval" }, v: 2 }),
    JSON.stringify({ seq: 13, ts: "2026-01-01T00:00:12.000Z", type: "work.move", payload: { id: "w3", from: "awaiting-approval", to: "delivered" }, v: 2 }),
    JSON.stringify({ seq: 14, ts: "2026-01-01T00:00:13.000Z", type: "work.move", payload: { id: "w3", from: "delivered", to: "retrospective" }, v: 2 }),
    JSON.stringify({ seq: 15, ts: "2026-01-01T00:00:14.000Z", type: "work.move", payload: { id: "w3", from: "retrospective", to: "cleanup" }, v: 2 }),
    JSON.stringify({ seq: 16, ts: "2026-01-01T00:00:15.000Z", type: "work.move", payload: { id: "w3", from: "cleanup", to: "done" }, v: 2 }),
    // already carries statusCategory (e.g. written after tsk-38t-2 landed) -- must stay untouched
    JSON.stringify({ seq: 17, ts: "2026-01-01T00:00:16.000Z", type: "work.move", payload: { id: "w1", from: "doing", to: "blocked", statusCategory: "in-progress" }, v: 3 }),
    // a non-work.add/work.move event type -- must stay untouched
    JSON.stringify({ seq: 18, ts: "2026-01-01T00:00:17.000Z", type: "work.outcome", payload: { id: "w1", predicted: { tier: "standard" } }, v: 2 }),
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
  return { dir, logPath, raw };
}

// --- (a) dry-run reports correct counts, writes nothing --------------------

test("dry-run reports correct counts without writing anything", () => {
  const { logPath, raw } = setup("backfill-dry-run-");

  const report = backfillStatusCategory(logPath, { dryRun: true });

  assert.equal(fs.readFileSync(logPath, "utf8"), raw, "dry-run must leave the target byte-identical");
  assert.equal(report.dryRun, true);
  // Front-segment events across all 3 items (w1/w2/w3): 3 work.add
  // (status:'todo', seq 1/8/10) + 9 work.move whose `to` is front-segment
  // (seq 2/3/4/5/6/7/9/11/12) = 12. Tail-segment moves (seq 13-16), an
  // already-tagged event (seq 17), and a work.outcome (seq 18) are excluded.
  assert.equal(report.changed, 12, "reports every front-segment work.add/work.move due a backfill");
  assert.equal(report.totalLines, 18);
  assert.deepEqual(
    report.countsByStatus,
    { todo: 4, doing: 3, blocked: 1, "awaiting-human": 1, "awaiting-approval": 2, wontfix: 1 },
    "per-status breakdown matches the fixture exactly",
  );
});

// --- (b) a real run backfills every front-segment event correctly ----------

test("a real run backfills statusCategory on every front-segment event per the table", () => {
  const { logPath } = setup("backfill-real-run-");

  const report = backfillStatusCategory(logPath, {});
  assert.equal(report.dryRun, false);
  assert.equal(report.changed, 12);

  const events = fs
    .readFileSync(logPath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const bySeq = Object.fromEntries(events.map((e) => [e.seq, e]));

  assert.equal(bySeq[1].payload.statusCategory, "todo", "work.add status:todo -> todo");
  assert.equal(bySeq[2].payload.statusCategory, "in-progress", "move to doing -> in-progress");
  assert.equal(bySeq[3].payload.statusCategory, "in-progress", "move to blocked -> in-progress");
  assert.equal(bySeq[4].payload.statusCategory, "in-progress", "move to awaiting-human -> in-progress");
  assert.equal(bySeq[5].payload.statusCategory, "in-progress", "move to doing (again) -> in-progress");
  assert.equal(bySeq[6].payload.statusCategory, "review", "move to awaiting-approval -> review");
  assert.equal(bySeq[7].payload.statusCategory, "todo", "move to todo -> todo");
  assert.equal(bySeq[8].payload.statusCategory, "todo", "second work.add status:todo -> todo");
  assert.equal(bySeq[9].payload.statusCategory, "canceled", "move to wontfix -> canceled");
});

// --- (c) tail-segment events get no statusCategory at all ------------------

test("tail-segment events (delivered/retrospective/cleanup/done) get no statusCategory field", () => {
  const { logPath } = setup("backfill-tail-segment-");

  backfillStatusCategory(logPath, {});

  const events = fs
    .readFileSync(logPath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const bySeq = Object.fromEntries(events.map((e) => [e.seq, e]));

  for (const seq of [13, 14, 15, 16]) {
    assert.equal(
      Object.hasOwn(bySeq[seq].payload, "statusCategory"),
      false,
      `seq ${seq} (${bySeq[seq].payload.to ?? bySeq[seq].payload.status}) must carry no statusCategory field`,
    );
  }
  // seq 10 (w3's own work.add) is front-segment (status:'todo'); seq 11/12
  // are front-segment moves within w3's own chain (doing, awaiting-approval).
  assert.equal(bySeq[10].payload.statusCategory, "todo");
  assert.equal(bySeq[11].payload.statusCategory, "in-progress");
  assert.equal(bySeq[12].payload.statusCategory, "review");
});

// --- (d) an event that already has statusCategory is left untouched --------

test("an event that already carries statusCategory is left byte-identical", () => {
  const { logPath } = setup("backfill-already-tagged-");
  const originalLine = fixtureLines()[16]; // seq 17, already carries statusCategory

  backfillStatusCategory(logPath, {});

  const rewritten = fs.readFileSync(logPath, "utf8").split("\n");
  assert.equal(rewritten[16], originalLine, "an already-tagged event is copied through byte-identical, never touched");
});

// --- (e) every other field on every event is preserved byte-for-byte -------

test("every non-work.add/work.move event and every other field is preserved byte-for-byte", () => {
  const { logPath } = setup("backfill-preserve-fields-");
  const original = fixtureLines();

  backfillStatusCategory(logPath, {});

  const rewritten = fs.readFileSync(logPath, "utf8").split("\n").filter(Boolean);
  assert.equal(rewritten.length, original.length);

  // seq 18 (work.outcome) is a type this script never touches -- byte-identical.
  assert.equal(rewritten[17], original[17], "a non-work.add/work.move event stays byte-identical");

  // Every field other than the newly-added statusCategory is unchanged on
  // every rewritten line.
  for (let i = 0; i < rewritten.length; i++) {
    const before = JSON.parse(original[i]);
    const after = JSON.parse(rewritten[i]);
    // "payload" is compared field-by-field below (it may legitimately gain
    // the new statusCategory key) -- every OTHER top-level field must be
    // fully unchanged.
    for (const key of Object.keys(before)) {
      if (key === "payload") continue;
      assert.deepEqual(after[key], before[key], `line ${i + 1} field "${key}" must be preserved exactly`);
    }
    if (Object.hasOwn(before, "payload")) {
      for (const key of Object.keys(before.payload)) {
        assert.deepEqual(after.payload[key], before.payload[key], `line ${i + 1} payload field "${key}" must be preserved exactly`);
      }
    }
  }
});

// --- (f) idempotency: a second run is a byte-identical no-op ---------------

test("running the script twice is idempotent -- the second run is a byte-identical no-op", () => {
  const { logPath } = setup("backfill-idempotent-");

  backfillStatusCategory(logPath, {});
  const afterFirst = fs.readFileSync(logPath, "utf8");

  const secondReport = backfillStatusCategory(logPath, {});
  const afterSecond = fs.readFileSync(logPath, "utf8");

  assert.equal(secondReport.changed, 0, "second run reports zero changes");
  assert.equal(afterSecond, afterFirst, "second run leaves the log byte-identical to the first run's output");
});

// --- (g) --backup creates a backup file before writing ---------------------

test("--backup creates a backup file reproducing the pre-migration bytes before writing", () => {
  const { logPath, raw } = setup("backfill-backup-");
  const backupPath = path.join(mkTempDir("backfill-backup-target-"), "events.jsonl.bak");

  backfillStatusCategory(logPath, { backupPath });

  assert.equal(fs.existsSync(backupPath), true, "backup file must exist after a real run with --backup");
  assert.equal(fs.readFileSync(backupPath, "utf8"), raw, "backup must reproduce the pre-migration bytes exactly");
});

// --- (h) backup is optional -- a real run without --backup still writes ----

test("a real run without --backup still writes (backup is optional, unlike the migrate-* templates)", () => {
  const { logPath } = setup("backfill-no-backup-");

  const report = backfillStatusCategory(logPath, {});

  assert.equal(report.dryRun, false);
  assert.equal(report.changed, 12);
  assert.equal(report.backupPath, null);
});

// --- (i) refuses a backup path inside the store -----------------------------

test("refuses a backup path that resolves inside the store directory", () => {
  const { dir, logPath, raw } = setup("backfill-backup-inside-");
  const insideBackupPath = path.join(dir, "events.jsonl.bak");

  assert.throws(() => backfillStatusCategory(logPath, { backupPath: insideBackupPath }), /store/i);
  assert.equal(fs.readFileSync(logPath, "utf8"), raw, "a refused migration never wrote the target");
  assert.equal(fs.existsSync(insideBackupPath), false, "the refused backup path was never written");
});

// --- (j) a held lock blocks then refuses ------------------------------------

test("a held lock blocks then refuses", () => {
  const { logPath, raw } = setup("backfill-locked-");

  let sawBlockThenRefuse = false;
  const start = Date.now();
  withEventsLock(logPath, () => {
    assert.throws(
      () => backfillStatusCategory(logPath, {}),
      (err) => err.category === "lock-timeout",
      "migration under a held lock must refuse via the lock-timeout category, not write",
    );
    sawBlockThenRefuse = true;
  });
  const elapsedMs = Date.now() - start;

  assert.equal(sawBlockThenRefuse, true);
  assert.ok(elapsedMs >= 1900, `refusal must be preceded by the real block (measured ${elapsedMs}ms, expected >= ~2000ms)`);
  assert.equal(fs.readFileSync(logPath, "utf8"), raw, "a refused migration never wrote the target");
});
