// events.mjs — legacy event-file reading plus the locked truncated-line repair.
//
// Reading and parsing live in event-log.mjs (kernel) and are re-exported here.
// New events are appended only through the Event Store consumer gate; this file
// keeps no append path.

import fs from 'node:fs';
import path from 'node:path';
import {
  EventLogError,
  parseEventLines,
  readEvents,
  readLastLineBefore,
  readEventsFromByte,
  parsesAsJson,
} from './event-log.mjs';
import { withStateTx } from './hot-lock.mjs';

export { EventLogError, parseEventLines, readEvents, readLastLineBefore, readEventsFromByte };

/**
 * Operator-invoked repair, scoped ONLY to the common crash-mid-append shape:
 * every line parses except the last. Any other corruption shape (mid-file,
 * multiple bad lines) is refused with `EventLogError('corrupt-log')` — this
 * function never widens the fail-closed guarantee `readEvents` enforces.
 *
 * The original log is always backed up (to `<logPath>.corrupt-<ts>`) before
 * the malformed trailing line is dropped, and the repaired file is
 * re-validated through `readEvents` before returning — a repair that somehow
 * left the log still unreadable surfaces as a thrown error, never a silent
 * "fixed" result.
 *
 * The whole read → validate → backup → write sequence runs inside
 * `withStateTx` (tsk-3wq: this used to be an unlocked whole-file rewrite,
 * so a concurrent `appendEvent` landing between the read and the
 * `writeFileSync` was silently overwritten/dropped — the same
 * read-then-write TOCTOU `withStateTx`/`tx.append` already close
 * for `addWork`/`editWork`/`moveWork`/`moveStep` in store.mjs). Folding this
 * function into the SAME cross-process lock `appendEvent` holds means a
 * concurrent append can no longer land mid-repair — it either lands before
 * this call acquires the lock (repair then reads the up-to-date file) or
 * after this call releases it (the append reads the just-repaired file).
 */
export function repairTruncatedLastLine(logPath) {
  const { root, resource } = lockOfLog(logPath, path.dirname(logPath));
  return withStateTx(root, (tx) => {
    let raw;
    try {
      raw = fs.readFileSync(logPath, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new EventLogError('validation', `repair: no event log at ${logPath} — nothing to repair.`);
      }
      throw err;
    }

    const lines = raw.split('\n');
    if (lines[lines.length - 1] === '') lines.pop();

    if (lines.length === 0) {
      throw new EventLogError('validation', `repair: event log at ${logPath} is empty — nothing to repair.`);
    }

    for (let i = 0; i < lines.length - 1; i++) {
      if (!parsesAsJson(lines[i])) {
        throw new EventLogError(
          'corrupt-log',
          `repair: line ${i + 1} of ${lines.length} in ${logPath} is corrupt (not just a truncated final line) — refusing to repair.`,
        );
      }
    }

    const lastLine = lines[lines.length - 1];
    if (parsesAsJson(lastLine)) {
      throw new EventLogError('validation', `repair: event log at ${logPath} already parses cleanly — nothing to repair.`);
    }

    const backupPath = `${logPath}.corrupt-${Date.now()}`;
    fs.copyFileSync(logPath, backupPath);

    const repaired = lines.slice(0, -1).map((line) => `${line}\n`).join('');
    tx.writeText(logPath, repaired);

    // Re-validate: readEvents throws if the repaired file is somehow still
    // unreadable, so this call never returns a falsely-reported "fixed" state.
    const events = readEvents(logPath);

    return { backupPath, droppedLine: lastLine, eventCount: events.length };
  }, { resource });
}

// The hot mutex a log belongs to: a log under `<fgosDir>/porting/` takes the
// `porting-events` mutex of the parent `.fgos`; every other log takes `state`.
export function lockOfLog(logPath, fgosDir) {
  const parent = path.dirname(logPath);
  const porting = path.basename(parent) === 'porting';
  const root = porting && fgosDir === parent ? path.dirname(parent) : fgosDir;
  return { root, resource: porting ? 'porting-events' : 'state' };
}
