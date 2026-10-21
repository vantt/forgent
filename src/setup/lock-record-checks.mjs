// Doctor check for the hot records of the state store (`state`,
// `porting-events`; contracts/hot-lock.v1.json). A record the cleanup cannot
// judge is never removed by the store, so the check names it for a person:
// `fgos lock fence <name>` is the only way out, and there is no automatic fix.

import fs from 'node:fs';
import { hotPaths, readHotRecord, judgeHotRecord } from '../state/hot-lock.mjs';
import { fgosDirOf } from './holder-lock-checks.mjs';

/** The hot resources, by registry name. */
const HOT_RESOURCES = ['state', 'porting-events'];
/** How long a record the judge cannot place may sit before it is worth a warning. */
export const UNKNOWN_JUDGE_GRACE_MS = 5 * 60 * 1000;

function ageMs(recordPath, now) {
  try {
    return now - fs.statSync(recordPath).mtimeMs;
  } catch {
    return 0;
  }
}

/**
 * One hot record: `null` when it is absent or healthy, else why it needs a
 * person. A record that does not parse is a problem at once; a parsed record
 * whose holder the judge answers `unknown` for longer than the grace is one
 * too (a live holder answers `unknown` only when the process table or its
 * namespace cannot be read, so a young record is just a busy holder).
 */
function recordProblem(resource, fgosDir, now) {
  const { record: recordPath } = hotPaths(fgosDir, resource);
  let seen;
  try {
    seen = readHotRecord(recordPath);
  } catch (err) {
    return `${resource}: ${recordPath} cannot be read (${err.code ?? err.message})`;
  }
  if (seen.state === 'absent') return null;
  if (seen.state === 'unreadable') return `${resource}: ${recordPath} does not parse (${JSON.stringify(seen.raw.slice(0, 80))})`;
  if (judgeHotRecord(seen.record) !== 'unknown') return null;
  const age = ageMs(recordPath, now);
  if (age <= UNKNOWN_JUDGE_GRACE_MS) return null;
  return `${resource}: ${recordPath} names pid ${seen.record.pid} that cannot be judged here, for ${Math.round(age / 60000)} min`;
}

/**
 * `lock-record-unreadable`: the `state` and `porting-events` records of this
 * workspace parse, and their holder is either provably alive, provably dead
 * or younger than five minutes. Warns with the path and `fgos lock fence`;
 * never fails and never repairs (a person confirms that the holder is gone).
 */
export function checkLockRecordUnreadable(repoRoot, { now = Date.now() } = {}) {
  const fgosDir = fgosDirOf(repoRoot);
  const found = HOT_RESOURCES.map((resource) => ({ resource, problem: recordProblem(resource, fgosDir, now) })).filter((entry) => entry.problem);
  if (found.length === 0) return { passed: true, message: `${HOT_RESOURCES.length} hot record(s) absent or judgeable` };
  const fences = found.map(({ resource }) => `fgos lock fence ${resource}`).join(' and ');
  return { passed: true, message: `warning: ${found.map((entry) => entry.problem).join('; ')} -- once the holder is confirmed gone, run: ${fences}` };
}
