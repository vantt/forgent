#!/usr/bin/env node
// migrate-actor-to-role.mjs -- STR46 D7/D11/D13/D19/D20 in-place event-log
// rewrite. Renames payload.actor -> payload.role and
// payload.predicted.actor -> payload.predicted.role, and bumps every line
// that ALREADY carries a `v` field to v:3 (D19). A line with NO `v` field at
// all is pre-Phase-2 legacy -- per events.mjs own doc comment such a line
// "reads back exactly as it was written (D7a: never rewritten, never
// migrated in place)" -- so it is copied through byte-identical, never
// parsed-and-reserialized.
//
// This script targets exactly ONE caller-supplied events.jsonl path -- it
// never globs, never scans a directory. That is what keeps it structurally
// unable to reach repo/test/fixtures/phase1-events.jsonl (an immutable
// fixture guarded by its own test/state/backward-compat.test.mjs:245
// assertion): the fixture is only ever touched if a caller passes its exact
// path, which no cell in this feature does.
//
// Do NOT run this against any real .fgos store -- CONTEXT.md D13/D20 assign
// that to a dedicated cell that dry-runs first and reads the report before
// any real write.

import fs from "node:fs";
import path from "node:path";
import { withEventsLock } from "../src/state/events.mjs";

const TARGET_SCHEMA_VERSION = 3; // D19

function renamePayloadActor(payload) {
  let changed = false;
  if (!payload || typeof payload !== "object") return changed;

  if (Object.prototype.hasOwnProperty.call(payload, "actor")) {
    payload.role = payload.actor;
    delete payload.actor;
    changed = true;
  }
  const predicted = payload.predicted;
  if (predicted && typeof predicted === "object" && Object.prototype.hasOwnProperty.call(predicted, "actor")) {
    predicted.role = predicted.actor;
    delete predicted.actor;
    changed = true;
  }
  return changed;
}

// Pure core: given the raw log text, returns the rewritten text plus a
// change count. A line with no `v` field is returned as the SAME string
// reference it was parsed from -- never reserialized -- so it is
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
        `migrate-actor-to-role: line ${i + 1} of ${lines.length} does not parse as JSON -- refusing to migrate a log that is not already well-formed: ${err.message}`,
      );
    }

    if (typeof parsed.seq === "number") {
      if (prevSeq !== null && parsed.seq !== prevSeq + 1) {
        throw new Error(
          `migrate-actor-to-role: seq gap at line ${i + 1} -- expected ${prevSeq + 1}, got ${parsed.seq}. Refusing to migrate a log whose seq is not contiguous.`,
        );
      }
      prevSeq = parsed.seq;
    }

    if (parsed.v === undefined) {
      // Pre-Phase-2 legacy line: never touched, never reserialized.
      return line;
    }

    const renamed = renamePayloadActor(parsed.payload);
    const versionBumped = parsed.v !== TARGET_SCHEMA_VERSION;
    if (versionBumped) parsed.v = TARGET_SCHEMA_VERSION;

    if (!renamed && !versionBumped) return line; // already migrated -- idempotent no-op

    changed++;
    return JSON.stringify(parsed);
  });

  const rewritten = outLines.map((l) => `${l}\n`).join("");
  return { rewritten, changed, totalLines: lines.length };
}

function assertUsableBackupPath(logPath, backupPath) {
  if (!backupPath || typeof backupPath !== "string" || !backupPath.trim()) {
    throw new Error(
      "migrate-actor-to-role: --backup is required -- refusing to run without an explicit backup path (this rewrite is irreversible otherwise).",
    );
  }
  const storeDir = path.resolve(path.dirname(logPath));
  const resolvedBackup = path.resolve(backupPath);
  if (resolvedBackup === storeDir || (resolvedBackup + path.sep).startsWith(storeDir + path.sep)) {
    throw new Error(
      `migrate-actor-to-role: backup path "${backupPath}" resolves inside the store directory being rewritten (${storeDir}) -- refusing, or a tracked/rewritten store would sweep its own backup back in.`,
    );
  }
  return resolvedBackup;
}

/**
 * Rewrite `logPath` in place. Always runs inside events.mjs own
 * `events.lock` (derived from the log directory, per D31/CONTEXT.md safety
 * constraint) -- a live holder makes this BLOCK for events.mjs fixed ~2s
 * timeout and then throw EventLogError("lock-timeout"); it never writes
 * over a live append. `dryRun: true` still acquires the lock (read
 * consistency against a concurrent writer) but never writes the target or a
 * backup.
 */
export function migrateActorToRole(logPath, { backupPath, dryRun = false } = {}) {
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
      throw new Error(`migrate-actor-to-role: backup verification failed at "${resolvedBackup}" -- refusing to rewrite the target without a proven-good backup.`);
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
    throw new Error("usage: migrate-actor-to-role.mjs --log <path-to-events.jsonl> --backup <path> [--dry-run]");
  }
  return { logPath, backupPath, dryRun };
}

function runCli(argv, cwd) {
  const { logPath, backupPath, dryRun } = parseArgs(argv);
  const resolvedLog = path.resolve(cwd, logPath);
  const resolvedBackup = backupPath ? path.resolve(cwd, backupPath) : backupPath;
  const report = migrateActorToRole(resolvedLog, { backupPath: resolvedBackup, dryRun });
  console.log(JSON.stringify(report, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli(process.argv.slice(2), process.cwd());
}
