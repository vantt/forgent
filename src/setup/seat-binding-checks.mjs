// Doctor rows for Seat Binding: `seat-binding-config` (the project config's tier ladder `$comment` is current)
// and `seat-binding-dry-bind` (every seat of every Workflow unit binds under the committed config).

import path from 'node:path';
import { sharedConfigFilePath, readSharedConfig } from '../config/shared-config-file.mjs';
import { createSeatBindingClient } from '../seat-binding/client.mjs';
import { ladderCommentLines } from './tier-ladder-comment.mjs';
import { simulateUnitBindings } from '../runner/execution/dry-bind.mjs';
import { loadWorkflowDefinitions, withUnreadableDefinitions, workflowRoots, workflowUnitContract } from './workflow-definition-files.mjs';

const MAX_LISTED = 8;
const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const listed = (items) => (items.length > MAX_LISTED ? `${items.slice(0, MAX_LISTED).join('; ')}; and ${items.length - MAX_LISTED} more` : items.join('; '));

/**
 * The project's runner `$comment`, when it has one, matches the crate's tier ladder. A difference is
 * reported, not failed: `fgos setup` refreshes it. An unreadable config fails the row.
 */
export function checkSeatBindingConfig(cwd) {
  const file = sharedConfigFilePath(cwd);
  let runner;
  try {
    runner = readSharedConfig(cwd).runner;
  } catch (err) {
    return { passed: false, message: err.message };
  }
  if (!isPlainObject(runner) || runner.$comment === undefined) return { passed: true, message: `${file}#runner carries no tier ladder $comment` };
  let ladder;
  try {
    ladder = ladderCommentLines(createSeatBindingClient({ cwd, fgosDir: path.join(cwd, '.fgos') }).tierLadder().definitions);
  } catch (err) {
    return { passed: true, message: `${file}#runner $comment was not compared with the tier ladder (${err.code ?? 'error'}: ${err.message})` };
  }
  if (JSON.stringify(runner.$comment) !== JSON.stringify(ladder)) {
    return { passed: true, message: `${file}#runner $comment differs from the tier ladder: run \`fgos setup\` to refresh it` };
  }
  return { passed: true, message: `${file}#runner $comment matches the tier ladder` };
}

// The session every seat is bound against: headless, no lead, no herdr session. What a person's own session
// would add is not the config's business, and a doctor row must give the same answer wherever it runs.
const DRY_BIND_SESSION = Object.freeze({ headless: true, herdrPresent: false });

// A refusal that says the config has no answer for the seat is information, not a failure: no pool is
// configured for the capability (nothing names an executor), a pool has no usable account in the config
// view, or the capability is served by a tool executor. Every other refusal is a policy refusal and fails.
const INFO_REFUSALS = new Map([
  ['no-candidate', 'no pool configured'],
  ['headless-no-executor', 'no pool configured'],
  ['pool-unusable', 'account state'],
  ['pool-excluded', 'account state'],
  ['not-an-agent-seat', 'tool executor'],
]);

/**
 * Binds every seat of every Workflow unit the way a run would, without a lease and without starting anything
 * (`simulateUnitBindings` is the same crate call a run makes, seats in resolver order with the earlier seats
 * published to the later). A policy refusal fails the row; the rest is listed as information: capabilities
 * with no pool, account-state refusals, tiers lowered by `maxTier` and seats that share a provider family.
 *
 * @param {string} cwd Project root (its own core/ and domains/ workflows are read too).
 * @param {object} options
 * @param {string} options.packageRoot Root holding the shipped core/ and domains/.
 * @param {() => object} options.loadRunnerConfig Returns the project's runner config; may throw.
 */
export async function checkSeatBindingDryBind(cwd, { packageRoot, loadRunnerConfig }) {
  let runnerConfig;
  try {
    runnerConfig = loadRunnerConfig(cwd);
  } catch (err) {
    return { passed: true, message: `runner config not loadable here, seats not bound: ${err.message}` };
  }
  const loaded = loadWorkflowDefinitions(workflowRoots(cwd, packageRoot));
  const problems = [];
  const info = [];
  let units = 0;
  let bound = 0;
  for (const wf of loaded.workflows.values()) {
    for (const step of wf.steps) {
      for (const u of step?.units ?? []) {
        const unit = workflowUnitContract(u);
        if (typeof unit.capability !== 'string') continue;
        units += 1;
        const label = `${wf.id}/${step.id}/${u.id} (capability "${unit.capability}")`;
        let seats;
        try {
          ({ seats } = await simulateUnitBindings(unit, runnerConfig, { session: DRY_BIND_SESSION, workflowId: wf.id }));
        } catch (err) {
          problems.push(`${label}: could not be evaluated (${err.message})`);
          continue;
        }
        for (const seat of seats) {
          if (seat.refused) {
            const kind = INFO_REFUSALS.get(seat.refused.reason);
            if (kind) info.push(`${label}: seat ${seat.seat} not bound, ${kind} (${seat.refused.reason})`);
            else problems.push(`${label}: seat ${seat.seat} refused for ${seat.refused.reason}: ${seat.refused.detail}`);
            continue;
          }
          bound += 1;
          if (seat.loweredFrom) info.push(`${label}: seat ${seat.seat} runs at ${seat.tier}, lowered from ${seat.loweredFrom.from} by max-tier-cap (${seat.loweredFrom.fromSource})`);
          if (seat.sharesFamilyWith?.length > 0) info.push(`${label}: seat ${seat.seat}=${seat.executor} shares a provider family with ${seat.sharesFamilyWith.join(', ')} (a preference, not a failure)`);
        }
      }
    }
  }
  const notes = info.length > 0 ? `; info (${info.length}): ${listed(info)}` : '';
  if (problems.length > 0) {
    return withUnreadableDefinitions({ passed: false, message: `${problems.length} seat(s) are refused by policy: ${problems.join(' | ')}${notes}` }, loaded.unreadable);
  }
  return withUnreadableDefinitions({ passed: true, message: units === 0 ? 'no Workflow unit to bind' : `${bound} seat(s) of ${units} Workflow unit(s) bind${notes}` }, loaded.unreadable);
}
