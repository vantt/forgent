// invocation-fault-log.mjs — records a malformed `fgos` invocation so the
// call site can be inspected later. Before this module, a bad call surfaced
// only as a stderr line and an exit code at the point of call and left no
// trace at all: nothing recorded which session ran it, with what argv, from
// which cwd (the p-af05e742 / p-4c81ca74 investigations both hit this).
//
// Scope is deliberately narrow. Only faults raised in `main()`'s pre-handler
// region are recorded — unknown verb, the `requiresExistingStore` refusal,
// the `init`-inside-worktree refusal, a bad `--dir`, and arg parsing. A
// refusal raised inside a verb's own handler ("work X not found", an Iron Law
// trip, a held lock) is correct behavior rather than misuse, and is never
// recorded. The caller decides which is which by position and passes a
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
//       `requiresExistingStore` guard exists to close. When the resolved
//       store is absent, the record goes to the main checkout's existing
//       store or nowhere.
//
// The log is `.fgos/`-resident but deliberately NOT `events.jsonl`: that file
// is the rebuild source for all state, and a pure-observability record has no
// business in it. It is also gitignored — `.fgos/` is only partly ignored and
// `events.jsonl` is tracked on purpose, so without that entry every recorded
// argv would be committed and pushed.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { resolveWriterIdentity } from '../util/session-identity.mjs';

export const INVOCATION_FAULT_LOG_BASENAME = 'invocation-faults.jsonl';

/**
 * The main checkout's `.fgos/`, resolved the same way the fgOS skills' own
 * gate checks do (`git rev-parse --path-format=absolute --git-common-dir`,
 * then its parent). Returns null outside a git repo — there is no main
 * checkout to fall back to there, so the fault simply goes unrecorded.
 */
function mainCheckoutFgosDir(cwd) {
  try {
    const gitCommonDir = execFileSync(
      'git',
      ['rev-parse', '--path-format=absolute', '--git-common-dir'],
      { cwd, encoding: 'utf8', shell: false, stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
    if (!gitCommonDir) return null;
    return path.join(path.dirname(gitCommonDir), '.fgos');
  } catch {
    return null;
  }
}

/**
 * Where a fault record would go, or null when there is nowhere to put it.
 * Prefers the store the CLI already resolved; falls back to the main
 * checkout's store when that one is absent (the wrong-cwd fault, which is
 * itself one of the recordable classes). Never creates a directory.
 */
export function resolveFaultLogPath(fgosDir, cwd) {
  if (typeof fgosDir === 'string' && fgosDir && fs.existsSync(fgosDir)) {
    return path.join(fgosDir, 'logs', INVOCATION_FAULT_LOG_BASENAME);
  }
  const fallback = mainCheckoutFgosDir(cwd);
  if (!fallback || !fs.existsSync(fallback)) return null;
  return path.join(fallback, 'logs', INVOCATION_FAULT_LOG_BASENAME);
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
export function recordInvocationFault({ fgosDir, cwd, verb, faultClass, message, argv }) {
  try {
    if (!faultClass) return null;
    const logPath = resolveFaultLogPath(fgosDir, cwd);
    if (!logPath) return null;
    const record = {
      ts: new Date().toISOString(),
      faultClass,
      verb: verb ?? null,
      message,
      cwd,
      argv,
      writer: resolveWriterIdentity(path.dirname(path.dirname(logPath))),
    };
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, `${JSON.stringify(record)}\n`);
    return logPath;
  } catch {
    return null;
  }
}
