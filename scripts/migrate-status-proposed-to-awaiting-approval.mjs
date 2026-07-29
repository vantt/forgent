#!/usr/bin/env node
// migrate-status-proposed-to-awaiting-approval.mjs -- tsk-66l in-place
// event-log rewrite. Renames the shared vocabulary value 'proposed' ->
// 'awaiting-approval' wherever it appears as a STRUCTURED field value (never
// a blind string-replace of free text): payload.status (work.add),
// payload.to / payload.from (work.move), and payload.predicted.outcome /
// payload.actual.outcome (work.outcome). Follows the exact safety discipline
// scripts/migrate-actor-to-role.mjs (STR46/0019) already established for this
// same class of in-place rewrite.
//
// This script targets exactly ONE caller-supplied events.jsonl path -- it
// never globs, never scans a directory. That is what keeps it structurally
// unable to reach test/fixtures/phase1-events.jsonl (an immutable fixture
// guarded by its own test/state/backward-compat.test.mjs assertion, and
// independently confirmed to contain zero "proposed" occurrences): the
// fixture is only ever touched if a caller passes its exact path, which no
// cell in this feature does.
//
// Do NOT run this against any real .fgos store without --backup and without
// reading the dry-run report first (docs/history/status-proposed-rename/
// plan.md Pha B). The live shared store, dogfood-fixture/.fgos, and
// fgos-test-drive/.fgos are the three in-scope stores per 0019's own
// coverage -- this script itself only ever touches whichever single path is
// passed to it.

import fs from "node:fs";
import path from "node:path";
import { withEventsLock } from "../src/state/events.mjs";

const OLD_VALUE = "proposed";
const NEW_VALUE = "awaiting-approval";

function renameStatusValue(payload) {
  let changed = false;
  if (!payload || typeof payload !== "object") return changed;

  if (payload.status === OLD_VALUE) {
    payload.status = NEW_VALUE;
    changed = true;
  }
  if (payload.to === OLD_VALUE) {
    payload.to = NEW_VALUE;
    changed = true;
  }
  if (payload.from === OLD_VALUE) {
    payload.from = NEW_VALUE;
    changed = true;
  }
  const predicted = payload.predicted;
  if (predicted && typeof predicted === "object" && predicted.outcome === OLD_VALUE) {
    predicted.outcome = NEW_VALUE;
    changed = true;
  }
  const actual = payload.actual;
  if (actual && typeof actual === "object" && actual.outcome === OLD_VALUE) {
    actual.outcome = NEW_VALUE;
    changed = true;
  }
  return changed;
}

// Pure core: given the raw log text, returns the rewritten text plus a
// change count. A line untouched by renameStatusValue is returned as the
// SAME string reference it was parsed from -- never reserialized -- so it is
// byte-identical even across key-order/whitespace quirks JSON.stringify
// could otherwise introduce.
function migrateLogText(raw) {
  const lines = raw.split("\n");
  const hasTrailingNewline = lines.length > 0 && lines[lines.length - 1] === "";
  if (hasTrailingNewline) lines.pop();

  let changed = 0;
  let prevSeq = null;
  const outLines = lines.map((line, i) => {
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch (err) {
      throw new Error(
        `migrate-status-proposed-to-awaiting-approval: line ${i + 1} of ${lines.length} does not parse as JSON -- refusing to migrate a log that is not already well-formed: ${err.message}`,
      );
    }

    if (typeof parsed.seq === "number") {
      if (prevSeq !== null && parsed.seq !== prevSeq + 1) {
        throw new Error(
          `migrate-status-proposed-to-awaiting-approval: seq gap at line ${i + 1} -- expected ${prevSeq + 1}, got ${parsed.seq}. Refusing to migrate a log whose seq is not contiguous.`,
        );
      }
      prevSeq = parsed.seq;
    }

    const renamed = renameStatusValue(parsed.payload);
    if (!renamed) return line; // untouched -- byte-identical, idempotent no-op

    changed++;
    return JSON.stringify(parsed);
  });

  const rewritten = outLines.map((l) => `${l}\n`).join("");
  return { rewritten, changed, totalLines: lines.length };
}

function assertUsableBackupPath(logPath, backupPath) {
  if (!backupPath || typeof backupPath !== "string" || !backupPath.trim()) {
    throw new Error(
      "migrate-status-proposed-to-awaiting-approval: --backup is required -- refusing to run without an explicit backup path (this rewrite is irreversible otherwise).",
    );
  }
  const storeDir = path.resolve(path.dirname(logPath));
  const resolvedBackup = path.resolve(backupPath);
  if (resolvedBackup === storeDir || (resolvedBackup + path.sep).startsWith(storeDir + path.sep)) {
    throw new Error(
      `migrate-status-proposed-to-awaiting-approval: backup path "${backupPath}" resolves inside the store directory being rewritten (${storeDir}) -- refusing, or a tracked/rewritten store would sweep its own backup back in.`,
    );
  }
  return resolvedBackup;
}

/**
 * Rewrite `logPath` in place. Always runs inside events.mjs own
 * `events.lock` (derived from the log directory) -- a live holder makes this
 * BLOCK for events.mjs fixed timeout and then throw EventLogError, it never
 * writes over a live append. `dryRun: true` still acquires the lock (read
 * consistency against a concurrent writer) but never writes the target or a
 * backup.
 */
export function migrateStatusProposedToAwaitingApproval(logPath, { backupPath, dryRun = false } = {}) {
  const resolvedBackup = assertUsableBackupPath(logPath, backupPath);

  return withEventsLock(logPath, () => {
    const raw = fs.readFileSync(logPath, "utf8");
    const { rewritten, changed, totalLines } = migrateLogText(raw);

    if (dryRun) {
      return { dryRun: true, changed, totalLines, logPath };
    }

    if (changed === 0) {
      return { dryRun: false, changed: 0, totalLines, logPath, backupPath: null };
    }

    fs.mkdirSync(path.dirname(resolvedBackup), { recursive: true });
    fs.writeFileSync(resolvedBackup, raw, "utf8");

    // Read the backup back before touching the target -- a migration that
    // cannot prove its own backup is unreadable-back is not allowed to
    // proceed to the irreversible step.
    const backupCheck = fs.readFileSync(resolvedBackup, "utf8");
    if (backupCheck !== raw) {
      throw new Error(`migrate-status-proposed-to-awaiting-approval: backup verification failed at "${resolvedBackup}" -- refusing to rewrite the target without a proven-good backup.`);
    }

    fs.writeFileSync(logPath, rewritten, "utf8");
    return { dryRun: false, changed, totalLines, logPath, backupPath: resolvedBackup };
  });
}

function parseArgs(argv) {
  const logIdx = argv.indexOf("--log");
  const backupIdx = argv.indexOf("--backup");
  const dryRun = argv.includes("--dry-run");
  const logPath = logIdx >= 0 ? argv[logIdx + 1] : undefined;
  const backupPath = backupIdx >= 0 ? argv[backupIdx + 1] : undefined;
  if (!logPath) {
    throw new Error("usage: migrate-status-proposed-to-awaiting-approval.mjs --log <path-to-events.jsonl> --backup <path> [--dry-run]");
  }
  return { logPath, backupPath, dryRun };
}

function runCli(argv, cwd) {
  const { logPath, backupPath, dryRun } = parseArgs(argv);
  const resolvedLog = path.resolve(cwd, logPath);
  const resolvedBackup = backupPath ? path.resolve(cwd, backupPath) : backupPath;
  const report = migrateStatusProposedToAwaitingApproval(resolvedLog, { backupPath: resolvedBackup, dryRun });
  console.log(JSON.stringify(report, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli(process.argv.slice(2), process.cwd());
}
