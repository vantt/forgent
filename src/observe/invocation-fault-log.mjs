// invocation-fault-log.mjs — records a malformed `fgos` invocation so the
// call site can be inspected later. Before this module, a bad call surfaced
// only as a stderr line and an exit code at the point of call and left no
// trace at all: nothing recorded which session ran it, with what argv, from
// which cwd (the p-af05e742 / p-4c81ca74 investigations both hit this).
//
// Scope is deliberately narrow. Only faults raised in `main()`'s pre-handler
// region are recorded — unknown verb, the `store require` refusal,
// the `init`-inside-worktree refusal, a bad `--dir`, and arg parsing. A
// refusal raised inside a verb's own handler ("work X not found", an Iron Law
// trip, a held lock) is correct behavior rather than misuse, and is never
// recorded. The two exceptions have no caller to read their failure: the end
// trigger of a command (its answer is already printed) and the detached seal and
// publish children (nobody waits for them); a failure of either leaves a record.
// The caller decides which is which by position and passes a
// `faultClass`; this module never inspects `message` to classify, because
// that would couple the log to ~73 hand-written error strings.
//
// Two properties this module must never break, since it runs on a path that
// has already failed:
//   (a) it never throws into its caller — every failure returns null, because
//       turning a clean exit-4 into an unexpected exit-1 is worse than not
//       recording at all;
//   (b) it never creates `.fgos/`. A linked worktree carries no store by
//       design (ADR0020), and auto-vivifying one is the exact hazard the
//       `store require` guard exists to close. When the resolved
//       store is absent, the record goes to the main checkout's existing
//       store or nowhere.
//
// The record carries the shape of the call, never its values: the verb, the sub-verb, each flag name and the length
// of every value (`argvShape`). The file is private to its owner (0600) and capped (`appendFaultRecord`).
//
// The log is `.fgos/`-resident but deliberately NOT a Work event: the Event
// Store is the source of all Work state, and a pure-observability record has
// no business in it. It is also gitignored — `.fgos/` is only partly ignored,
// so without that entry every recorded record would be committed and pushed.

import fs from 'node:fs';
import path from 'node:path';

import { resolveWriterIdentity } from '../util/session-identity.mjs';
import { resolveMainCheckoutRoot, fgosDirFromRoot } from '../runner/paths.mjs';
import { resolveFgosFile, FGOS_FILE } from '../state/fgos-file-registry.mjs';

/** Past this size the oldest half of the log is dropped. */
export const FAULT_LOG_MAX_BYTES = 1024 * 1024;

const FLAG_NAME = /^-{1,2}[A-Za-z][A-Za-z0-9-]{0,39}$/;

/**
 * The shape of a call: the verb (and `sub`, when the caller names the sub-verb) as typed, a flag by its name, and every
 * other token, including a flag's value, by its length (`<12>`), so a secret passed as an argument never reaches the log.
 */
export function argvShape(argv, { sub } = {}) {
  if (!Array.isArray(argv)) return [];
  return argv.map((token, index) => {
    const text = String(token);
    if (index === 0 || (index === 1 && sub !== undefined && text === sub)) return text;
    const [name, ...rest] = text.split('=');
    if (FLAG_NAME.test(name)) return rest.length ? `${name}=<${rest.join('=').length}>` : name;
    return `<${text.length}>`;
  });
}

/**
 * Append one JSON record to a fault log, a plain append (never the state lock). The file is created 0600; once it
 * passes `FAULT_LOG_MAX_BYTES` the oldest half of its lines goes first. Throws on a write failure; the callers catch.
 */
export function appendFaultRecord(logPath, record) {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  try {
    if (fs.statSync(logPath).size > FAULT_LOG_MAX_BYTES) {
      const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
      const temp = `${logPath}.${process.pid}.tmp`;
      fs.writeFileSync(temp, `${lines.slice(Math.ceil(lines.length / 2)).join('\n')}\n`, { mode: 0o600 });
      fs.renameSync(temp, logPath);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  fs.appendFileSync(logPath, `${JSON.stringify(record)}\n`, { mode: 0o600 });
  fs.chmodSync(logPath, 0o600);
}

/**
 * Where a fault record would go, or null when there is nowhere to put it.
 * Prefers the store the CLI already resolved; falls back to the main
 * checkout's store when that one is absent (the wrong-cwd fault, which is
 * itself one of the recordable classes). Never creates a directory.
 */
export function resolveFaultLogPath(fgosDir, cwd) {
  if (typeof fgosDir === 'string' && fgosDir && fs.existsSync(fgosDir)) {
    return resolveFgosFile(fgosDir, FGOS_FILE.INVOCATION_FAULTS);
  }
  const mainRoot = resolveMainCheckoutRoot(cwd);
  const fallback = mainRoot ? fgosDirFromRoot(mainRoot) : null;
  if (!fallback || !fs.existsSync(fallback)) return null;
  return resolveFgosFile(fallback, FGOS_FILE.INVOCATION_FAULTS);
}

/**
 * Append one fault record. Returns the path written, or null when nothing was
 * written — the caller uses that return value to decide whether to say
 * anything, so a "recorded to ..." line can never name a record that does not
 * exist.
 *
 * Provenance is limited to signals already in hand at the point of failure:
 * the writer identity, the argv, and the cwd. No caller is asked to declare
 * anything, so no call site has to change to make this work.
 */
export function recordInvocationFault({ fgosDir, cwd, verb, sub, faultClass, message, argv }) {
  try {
    if (!faultClass) return null;
    const logPath = resolveFaultLogPath(fgosDir, cwd);
    if (!logPath) return null;
    // The fault being recorded may itself be "no writer identity" (no host
    // binary): keep the record and name why the writer is missing.
    let writer = null;
    let writerError;
    try {
      writer = resolveWriterIdentity(path.dirname(path.dirname(logPath)));
    } catch (err) {
      writerError = err?.code ?? 'unknown';
    }
    const record = {
      ts: new Date().toISOString(),
      faultClass,
      verb: verb ?? null,
      message,
      cwd,
      argv: argvShape(argv, { sub }),
      writer,
      ...(writerError ? { writerError } : {}),
    };
    appendFaultRecord(logPath, record);
    return logPath;
  } catch {
    return null;
  }
}
