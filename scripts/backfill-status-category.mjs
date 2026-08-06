#!/usr/bin/env node
// backfill-status-category.mjs -- tsk-38t-3 historical backfill for the
// `statusCategory` field decision record 0027 (D2/D3/D4) introduced --
// `docs/decisions/0027-domain-so-huu-status-doan-truoc-delivered-supersede-
// base-workflow-model-d1-d3.md`. Stamps `payload.statusCategory` onto every
// PRE-EXISTING `work.add`/`work.move` event whose status falls in the six
// front-segment statuses (`todo`/`doing`/`blocked`/`awaiting-human`/
// `awaiting-approval`/`wontfix`), so the field src/state/store.mjs now
// stamps at write time (tsk-38t-2, already merged) also reads back present
// on every event written BEFORE that write-time logic existed. Per D4
// (`docs/history/phase-2-status-category-schema/DISCUSSION.md`
// §task-backfill-status-category): a real migration script, not a
// derive-on-read default -- `docs/platform-foundations.md`'s L3
// replay-from-zero law requires that replaying the same log twice always
// yields the same view, and `DOMAINS.coding.statusLabels`
// (workflow-stage-graphs.mjs) is ordinary, editable code; a value computed
// at read time from that table could replay differently after the table is
// edited later, which L3 forbids. Stamping the value onto the event itself,
// once, is the only replay-stable option.
//
// SINGLE-DOMAIN ASSUMPTION (task 7 of tsk-38t-3's brief): this script
// hardcodes coding's six-status -> statusCategory table directly (below)
// instead of importing `DOMAINS` from workflow-stage-graphs.mjs and
// resolving `statusCategoryFor(getDomain(event.payload.domain), status)`
// per event. This is deliberate, not a shortcut taken for convenience: every
// event in this repo's real `.fgos/events.jsonl` today predates any domain
// other than `coding` (tsk-38t's own multi-domain schema work is what
// introduced the `domain` field in the first place -- no event this script
// will ever backfill can carry a non-coding domain). Mirrors the exact
// "structurally unable to reach the wrong data" precedent
// migrate-status-proposed-to-awaiting-approval.mjs already set for this
// class of one-time historical migration: hardcoding here means this
// script is a Phase 2 coding-only backfill tool, not a general-purpose
// per-domain backfill utility -- a future second production domain with its
// own historical event log needing this same treatment needs its OWN
// migration script (or this one extended to read `payload.domain` and
// dispatch per-domain), not a silent behavior change here.
//
// This script targets exactly ONE caller-supplied events.jsonl path -- it
// never globs, never scans a directory, never reaches
// test/fixtures/phase1-events.jsonl or any other repo file except the one
// path a caller explicitly passes.
//
// Do NOT run this against any real .fgos store without reading the dry-run
// report first. The live shared store, dogfood-fixture/.fgos, and
// fgos-test-drive/.fgos are the three in-scope stores per D4's own coverage
// -- this script itself only ever touches whichever single path is passed
// to it.

import fs from "node:fs";
import path from "node:path";
import { withEventsLock } from "../src/state/events.mjs";

// The six front-segment statuses -> statusCategory, per decision record
// 0027 D2/D3 and DOMAINS.coding.statusLabels (workflow-stage-graphs.mjs) --
// kept byte-for-byte identical to that table on purpose, so this script's
// output can never silently drift from what store.mjs stamps at write time
// today. The four tail-segment statuses (delivered/retrospective/cleanup/
// done) are deliberately ABSENT from this table, not mapped to any value --
// per D1, no domain ever relabels them and they carry no statusCategory,
// ever (see 0027's own doc comment on STATUS_CATEGORIES, work.mjs).
const CODING_STATUS_CATEGORIES = Object.freeze({
  todo: "todo",
  doing: "in-progress",
  blocked: "in-progress",
  "awaiting-human": "in-progress",
  "awaiting-approval": "review",
  wontfix: "canceled",
});

function statusCategoryForCoding(status) {
  return Object.hasOwn(CODING_STATUS_CATEGORIES, status) ? CODING_STATUS_CATEGORIES[status] : undefined;
}

/**
 * Decide whether one event's payload is due a `statusCategory` backfill.
 * Returns `null` for every "leave completely untouched" case: any event
 * type other than `work.add`/`work.move`, a payload that already carries
 * `statusCategory` (idempotency -- a second run must be a byte-identical
 * no-op), or a status that isn't one of the six front-segment values (most
 * notably the four tail-segment statuses, which never get a category).
 * Otherwise returns `{ status, category }` -- the exact value to stamp.
 */
function computeCategoryBackfill(type, payload) {
  if (!payload || typeof payload !== "object") return null;
  if (Object.hasOwn(payload, "statusCategory")) return null; // already backfilled or already fresh -- idempotent skip

  let status;
  if (type === "work.add") {
    status = payload.status;
  } else if (type === "work.move") {
    status = payload.to;
  } else {
    return null;
  }

  const category = statusCategoryForCoding(status);
  if (category === undefined) return null; // tail-segment status, or no/unrecognized status at all

  return { status, category };
}

// Pure core: given the raw log text, returns the rewritten text plus a
// change count and a per-status breakdown (for the dry-run report). A line
// this script does not touch is returned as the SAME string reference it
// was parsed from -- never reserialized -- so it is byte-identical even
// across key-order/whitespace quirks JSON.stringify could otherwise
// introduce. Mirrors migrate-status-proposed-to-awaiting-approval.mjs's
// migrateLogText shape exactly.
function backfillLogText(raw) {
  const lines = raw.split("\n");
  const hasTrailingNewline = lines.length > 0 && lines[lines.length - 1] === "";
  if (hasTrailingNewline) lines.pop();

  let changed = 0;
  const countsByStatus = {};
  let prevSeq = null;
  const outLines = lines.map((line, i) => {
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch (err) {
      throw new Error(
        `backfill-status-category: line ${i + 1} of ${lines.length} does not parse as JSON -- refusing to migrate a log that is not already well-formed: ${err.message}`,
      );
    }

    if (typeof parsed.seq === "number") {
      if (prevSeq !== null && parsed.seq !== prevSeq + 1) {
        throw new Error(
          `backfill-status-category: seq gap at line ${i + 1} -- expected ${prevSeq + 1}, got ${parsed.seq}. Refusing to migrate a log whose seq is not contiguous.`,
        );
      }
      prevSeq = parsed.seq;
    }

    const backfill = computeCategoryBackfill(parsed.type, parsed.payload);
    if (!backfill) return line; // untouched -- byte-identical, idempotent no-op

    countsByStatus[backfill.status] = (countsByStatus[backfill.status] ?? 0) + 1;
    changed++;
    parsed.payload.statusCategory = backfill.category;
    return JSON.stringify(parsed);
  });

  const rewritten = outLines.map((l) => `${l}\n`).join("");
  return { rewritten, changed, totalLines: lines.length, countsByStatus };
}

/**
 * Validate an optional `--backup` path. Unlike the two `migrate-*.mjs`
 * precedents this script otherwise mirrors (`migrate-status-proposed-to-
 * awaiting-approval.mjs`, `migrate-actor-to-role.mjs`), `--backup` here is
 * OPTIONAL rather than mandatory: this script's own documented acceptance
 * command (tsk-38t-3's "Done means" step 1) runs the real, non-dry-run pass
 * without a `--backup` flag, so making it a hard requirement would make
 * that exact documented command fail. When a caller DOES pass `--backup`,
 * it is validated and honored with the identical safety discipline the
 * precedents use (write, read back, verify byte-identical before ever
 * touching the target) -- this only widens WHEN a backup happens, never
 * weakens what happens once one is requested.
 */
function assertUsableBackupPath(logPath, backupPath) {
  if (backupPath === undefined) return undefined;
  if (typeof backupPath !== "string" || !backupPath.trim()) {
    throw new Error("backfill-status-category: --backup requires a path argument.");
  }
  const storeDir = path.resolve(path.dirname(logPath));
  const resolvedBackup = path.resolve(backupPath);
  if (resolvedBackup === storeDir || (resolvedBackup + path.sep).startsWith(storeDir + path.sep)) {
    throw new Error(
      `backfill-status-category: backup path "${backupPath}" resolves inside the store directory being rewritten (${storeDir}) -- refusing, or a tracked/rewritten store would sweep its own backup back in.`,
    );
  }
  return resolvedBackup;
}

/**
 * Rewrite `logPath` in place. Always runs inside events.mjs's own
 * `events.lock` (derived from the log directory) -- a live holder makes this
 * BLOCK for events.mjs's fixed timeout and then throw EventLogError, it
 * never writes over a live append. `dryRun: true` still acquires the lock
 * (read consistency against a concurrent writer) but never writes the
 * target or a backup.
 */
export function backfillStatusCategory(logPath, { backupPath, dryRun = false } = {}) {
  const resolvedBackup = assertUsableBackupPath(logPath, backupPath);

  return withEventsLock(logPath, () => {
    const raw = fs.readFileSync(logPath, "utf8");
    const { rewritten, changed, totalLines, countsByStatus } = backfillLogText(raw);

    if (dryRun) {
      return { dryRun: true, changed, totalLines, countsByStatus, logPath };
    }

    if (changed === 0) {
      return { dryRun: false, changed: 0, totalLines, countsByStatus, logPath, backupPath: null };
    }

    if (resolvedBackup) {
      fs.mkdirSync(path.dirname(resolvedBackup), { recursive: true });
      fs.writeFileSync(resolvedBackup, raw, "utf8");

      // Read the backup back before touching the target -- a migration that
      // cannot prove its own backup is unreadable-back is not allowed to
      // proceed to the irreversible step.
      const backupCheck = fs.readFileSync(resolvedBackup, "utf8");
      if (backupCheck !== raw) {
        throw new Error(`backfill-status-category: backup verification failed at "${resolvedBackup}" -- refusing to rewrite the target without a proven-good backup.`);
      }
    }

    fs.writeFileSync(logPath, rewritten, "utf8");
    return { dryRun: false, changed, totalLines, countsByStatus, logPath, backupPath: resolvedBackup ?? null };
  });
}

// CLI: a single positional path argument (never `--log <path>`), plus
// `--dry-run` and an optional `--backup <path>` flag -- e.g.
// `node scripts/backfill-status-category.mjs path/to/events.jsonl --dry-run`.
function parseArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  const backupIdx = argv.indexOf("--backup");
  const backupPath = backupIdx >= 0 ? argv[backupIdx + 1] : undefined;

  const positional = argv.filter((arg, i) => {
    if (arg.startsWith("--")) return false;
    if (backupIdx >= 0 && i === backupIdx + 1) return false; // --backup's own value
    return true;
  });
  const logPath = positional[0];
  if (!logPath) {
    throw new Error("usage: backfill-status-category.mjs <path-to-events.jsonl> [--dry-run] [--backup <path>]");
  }
  return { logPath, backupPath, dryRun };
}

function runCli(argv, cwd) {
  const { logPath, backupPath, dryRun } = parseArgs(argv);
  const resolvedLog = path.resolve(cwd, logPath);
  const resolvedBackup = backupPath ? path.resolve(cwd, backupPath) : backupPath;
  const report = backfillStatusCategory(resolvedLog, { backupPath: resolvedBackup, dryRun });
  console.log(JSON.stringify(report, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli(process.argv.slice(2), process.cwd());
}
