// dispatch/worker-artifacts.mjs — where a worker's own claim and report are,
// under either name a worker may have been told to use.
//
// Two names exist for one artifact. A worker launched through `cli-spawn` is
// told by the assignment prompt to write `agent-result.json` / `agent-report.md`
// flat in the run directory. One launched through `herdr-spawn` is told by its
// brief to write `outbox/result-<round>.json` / `outbox/report-<round>.md`,
// because the outbox is the one directory an interactive worker is allowed to
// write in at all.
//
// Two readers need this: the collector, which turns a finished run into a
// RunResult, and reconciliation, which decides what became of a run nobody was
// left to finish. They used to each have their own copy and the copies drifted
// -- one sorted rounds as text so `result-9` beat `result-11`, the other
// numerically, and one knew about the flat name while the other did not, so a
// crashed cli-spawn run that HAD written its claim reconciled to `unknown`.
// The answer to "which file is the worker's claim" is one answer, so it is
// one function.

import path from 'node:path';
import fs from 'node:fs';

/**
 * The path a worker's artifact would be at, outbox first.
 *
 * The outbox wins because it is the newer contract and the only one an
 * interactive worker was ever told about. The highest round wins when several
 * are present -- ordered by NUMBER, or `result-9` would beat `result-11` and a
 * resumed Run would be judged on a stale claim.
 *
 * Returns the legacy flat path when the outbox holds nothing, whether or not
 * that file exists: a caller that needs to know it is really there checks, and
 * the collector wants the path either way.
 */
export function resolveWorkerArtifactPath(runDir, roundPattern, legacyName) {
  const outbox = path.join(runDir, 'outbox');
  let entries = [];
  try {
    entries = fs.readdirSync(outbox);
  } catch {
    entries = [];
  }
  const latest = entries
    .map((name) => ({ name, round: Number((name.match(roundPattern) ?? [])[1]) }))
    .filter((e) => Number.isFinite(e.round))
    .sort((a, b) => a.round - b.round)
    .pop();
  if (latest) return path.join(outbox, latest.name);
  return path.join(runDir, legacyName);
}

/** The worker's own structured claim, or null if it never wrote one. Same
 * lookup the collector performs, so the two can never disagree about whether
 * a worker left an account of its work. */
export function findWorkerClaim(runDir) {
  const claim = resolveWorkerArtifactPath(runDir, /^result-(\d+)\.json$/, 'agent-result.json');
  return fs.existsSync(claim) ? claim : null;
}
