// What a Unit run has settled so far, read back from its directory under .fgos/assignments.
//
// Execution, hand-offs and the derived discussion summary share these attempt rules.

import fs from 'node:fs';
import path from 'node:path';
import { deriveOutcome } from '../dispatch/run-result.mjs';

function compareRunNames(a, b) {
  return Number(a) - Number(b) || a.localeCompare(b);
}

/**
 * Map a settled RunResult onto the outcome vocabulary the collaboration patterns use.
 * A provider limit is an infra failure carrying its own code, so a caller can tell
 * "this provider has no quota" from any other infrastructure failure.
 */
export function outcomeOfRunResult(runResult) {
  const classification = runResult?.classification;
  // A result settled without an outcome (a refused provider capacity is one) is judged from its
  // classification like any other; treating the missing outcome as `ok` made a failed seat a pass.
  const category = classification?.outcome?.category
    ?? (classification && typeof classification === 'object' ? deriveOutcome(classification).category : 'ok');
  const failureCode = classification?.failure?.code;
  if (category === 'ok') return 'pass';
  if (category === 'verdict' && runResult?.classification?.assessment?.verdict === 'findings') return 'findings';
  if (category === 'blocked') return 'blocked';
  if (category === 'policy') return 'policy-refusal';
  // A provider whose capacity is exhausted or quarantined is the same situation as a provider limit hit
  // mid-run: the seat moves to the next candidate of the pool instead of counting as done.
  if (category === 'infra' && (failureCode === 'provider-limit' || failureCode === 'paused-limit' || failureCode === 'provider-capacity-refused')) return 'provider-limit';
  return 'execution-failure';
}

/**
 * Read all settled attempts and select the final attempt of each role/round.
 * Selection is shared by execution history and the derived discussion summary:
 * highest settled fallback wins, then the latest settled run of that assignment.
 * A corrupt selected result is ignored, not replaced with an older success.
 */
export function readUnitRunSeats(unitDir) {
  const seats = [];
  if (!fs.existsSync(unitDir)) return seats;
  try {
    for (const entry of fs.readdirSync(unitDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const role = entry.name;
      const roleDir = path.join(unitDir, role);
      const byRound = new Map();
      for (const roundEntry of fs.readdirSync(roleDir, { withFileTypes: true })) {
        if (!roundEntry.isDirectory()) continue;
        const match = /^(\d+)(?:-fb(\d+))?$/.exec(roundEntry.name);
        if (!match) continue;
        const round = Number.parseInt(match[1], 10);
        const fallbackNo = match[2] ? Number.parseInt(match[2], 10) : 0;
        const assignmentDir = path.join(roleDir, roundEntry.name);
        const runsDir = path.join(assignmentDir, 'runs');
        const runNames = fs.existsSync(runsDir)
          ? fs.readdirSync(runsDir).filter((name) => /^\d+$/.test(name)).sort(compareRunNames)
          : [];
        const settled = runNames.filter((name) => fs.existsSync(path.join(runsDir, name, 'result.json')));
        if (settled.length === 0) continue;
        const seat = byRound.get(round) ?? { role, round, attempts: [], selected: null };
        byRound.set(round, seat);
        let assignment = null;
        try { assignment = JSON.parse(fs.readFileSync(path.join(assignmentDir, 'assignment.json'), 'utf8')); } catch { /* optional metadata */ }
        for (const runName of settled) {
          const resultFile = path.join(runsDir, runName, 'result.json');
          let attempt = null;
          try {
            const runResult = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
            attempt = {
              assignmentId: `${path.basename(unitDir)}/${role}/${roundEntry.name}`,
              assignment, fallbackNo, runName, runResult,
              outcome: outcomeOfRunResult(runResult),
            };
            seat.attempts.push(attempt);
          } catch { /* Ignore corrupted result. */ }
          if (runName === settled[settled.length - 1]
            && (!seat.selected || fallbackNo > seat.selected.fallbackNo)) {
            seat.selected = { fallbackNo, attempt };
          }
        }
      }
      for (const seat of byRound.values()) {
        seat.attempts.sort((a, b) => a.fallbackNo - b.fallbackNo || compareRunNames(a.runName, b.runName));
        seats.push({ role, round: seat.round, attempts: seat.attempts, final: seat.selected?.attempt ?? null });
      }
    }
  } catch { /* Best effort history read. */ }
  return seats;
}

/** One final settled record per role/round, preserving the pattern history vocabulary. */
export function readUnitRunHistory(unitDir) {
  return readUnitRunSeats(unitDir).filter((seat) => seat.final).map(({ role, round, final }) => ({
    role, round, outcome: final.outcome, runResult: final.runResult,
  }));
}
