// What a Unit run has settled so far, read back from its directory under .fgos/assignments.
//
// Two readers need the same answer -- the Unit run itself (patterns look at earlier roles) and the
// hand-off resolver (a later Unit names a role of this run) -- so it lives in its own module.

import fs from 'node:fs';
import path from 'node:path';

/**
 * Map a settled RunResult onto the outcome vocabulary the collaboration patterns use.
 * A provider limit is an infra failure carrying its own code, so a caller can tell
 * "this provider has no quota" from any other infrastructure failure.
 */
export function outcomeOfRunResult(runResult) {
  const category = runResult?.classification?.outcome?.category ?? 'ok';
  const failureCode = runResult?.classification?.failure?.code;
  if (category === 'ok') return 'pass';
  if (category === 'verdict' && runResult?.classification?.assessment?.verdict === 'findings') return 'findings';
  if (category === 'blocked') return 'blocked';
  if (category === 'policy') return 'policy-refusal';
  if (category === 'infra' && (failureCode === 'provider-limit' || failureCode === 'paused-limit')) return 'provider-limit';
  return 'execution-failure';
}

/**
 * One record per settled role/round. A role/round has one assignment directory per attempt:
 * `<round>` for the first binding and `<round>-fb<n>` for each fallback after a provider limit;
 * the latest attempt is the one that counts.
 *
 * @param {string} unitDir `.fgos/assignments/<unitRunId>`
 * @returns {Array<{role: string, round: number, outcome: string, runResult: object}>}
 */
export function readUnitRunHistory(unitDir) {
  const records = [];
  if (!fs.existsSync(unitDir)) return records;
  try {
    const entries = fs.readdirSync(unitDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const role = entry.name;
        const roleDir = path.join(unitDir, role);
        const latestByRound = new Map();
        for (const roundEntry of fs.readdirSync(roleDir, { withFileTypes: true })) {
          if (!roundEntry.isDirectory()) continue;
          const match = /^(\d+)(?:-fb(\d+))?$/.exec(roundEntry.name);
          if (!match) continue;
          const round = Number.parseInt(match[1], 10);
          const fallbackNo = match[2] ? Number.parseInt(match[2], 10) : 0;
          // A resumed binding runs again as a later attempt of the same assignment.
          const runsDir = path.join(roleDir, roundEntry.name, 'runs');
          const attempts = fs.existsSync(runsDir)
            ? fs.readdirSync(runsDir).filter((name) => /^\d+$/.test(name)).sort()
            : [];
          const latestAttempt = attempts.reverse().find((name) => fs.existsSync(path.join(runsDir, name, 'result.json')));
          if (!latestAttempt) continue;
          const resultFile = path.join(runsDir, latestAttempt, 'result.json');
          const known = latestByRound.get(round);
          if (!known || fallbackNo > known.fallbackNo) latestByRound.set(round, { fallbackNo, resultFile });
        }
        for (const [round, { resultFile }] of latestByRound) {
          try {
            const runResult = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
            records.push({ role, round, outcome: outcomeOfRunResult(runResult), runResult });
          } catch {
            // Ignore corrupted result
          }
        }
      }
    }
  } catch {
    // Best effort history read
  }
  return records;
}
