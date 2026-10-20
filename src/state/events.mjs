// events.mjs — append-only event log with its cross-process write lock
// (truth per D3, ≡ changeset per R3).
//
// Reading, parsing and the unlocked append core live in event-log.mjs (kernel)
// and are re-exported here so every existing import keeps working. This file
// adds the locked half: the hot mutex comes from hot-lock.mjs, which also
// installs the child-process guard when it loads, so any entry point that can
// write the log gets the guard.
//
// The lock is the `state` hot mutex (`.fgos/locks/state.hot`) for the log
// under `.fgos/`, and `porting-events` for the porting store's log. A critical
// section is synchronous and may not start a child process.

import fs from 'node:fs';
import path from 'node:path';
import {
  EventLogError,
  parseEventLines,
  readEvents,
  parsesAsJson,
  appendEventCore,
} from './event-log.mjs';
import { withStateTx } from './hot-lock.mjs';

export { EventLogError, parseEventLines, readEvents };

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

/**
 * Append exactly one event to `logPath` as a single JSON line: `{ seq, ts,
 * type, payload, v, src, h }`. `seq` is derived from the current last event
 * (1 if the log is empty/absent) — never supplied by the caller, so events
 * cannot be reordered or double-numbered within one file (per-file only,
 * TA-D1: cross-file identity is `h`, not `seq`). `ts` is set here, always
 * ISO-8601 UTC. `v` is always the current `SCHEMA_VERSION` (per D7c) — every
 * event this module writes from now on carries it; there is no way to append
 * an event without one. `src` is the writer id from `resolveWriterIdentity`
 * (TA-D9). `h` is a 16-hex SHA-256 of the line content up to and including
 * `src` (TA-D1/TA-D9) — the event's content-addressed, order-independent
 * identity, used downstream for cross-file dedupe. A log line written before
 * this field existed has no `h`/`src` and still reads back exactly as
 * written (D7a: never rewritten, never migrated in place).
 *
 * Reads the existing log first (via readEvents), so appending onto an
 * already-corrupt log fails loudly with the same 'corrupt-log' category
 * rather than silently continuing on top of unknown state.
 *
 * The read-seq/compute/append sequence runs under `withStateTx` (released
 * in a finally on every exit path), so two concurrent processes never both
 * read the same last seq and write a duplicate.
 *
 * SCOPE: called bare like this, it closes ONLY the duplicate/out-of-order seq
 * race at the append itself — a caller with its own precondition read ahead
 * of the append (store.mjs's addWork existing-id check, moveWork's
 * expectedStatus compare-and-swap, editWork, moveStep) needs that read
 * inside the SAME held lock to avoid acting on a precondition that's already
 * gone stale; those callers use `withStateTx` + `tx.append`
 * directly instead of this function, so their whole read-check-append
 * sequence is one critical section.
 */
export function appendEvent(logPath, opts, fgosDir) {
  const { root, resource } = lockOfLog(logPath, fgosDir ?? path.dirname(logPath));
  return withStateTx(root, (tx) => tx.append(logPath, opts), { resource });
}
