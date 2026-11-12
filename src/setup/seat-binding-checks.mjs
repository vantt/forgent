// Doctor row for Seat Binding: `seat-binding-dry-bind` (every seat of every Workflow unit binds under the committed config).

import { bind } from '../runner/execution/bind.mjs';
import { simulateUnitBindings } from '../runner/execution/dry-bind.mjs';
import { hasUsablePrefer } from '../runner/execution/seat-resolver.mjs';
import { resolveCollaboration, loopOf } from '../runner/execution/patterns/catalog.mjs';
import { shippedCatalog } from '../runner/dispatch/shipped-catalog.mjs';
import { declaredActivities, readWorkflowCatalog, sourceOf, withUnreadableDefinitions, workflowUnitContract } from './workflow-catalog-reader.mjs';
const MAX_LISTED = 8;
const listed = (items) => (items.length > MAX_LISTED ? `${items.slice(0, MAX_LISTED).join('; ')}; and ${items.length - MAX_LISTED} more` : items.join('; '));

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
  ['agent-cli-missing', 'no agent CLI installed'],
]);

const CORE_CAPABILITIES = ['execute', 'code:implement'];

/**
 * The posture section of the row: the core capabilities (and every capability whose pool holds an agent
 * executor) must bind a writing producer, so a config whose executors cannot carry the confinement posture
 * is named before a run refuses it. Returns the failures to add to the row, the information lines, and the
 * `capability -> executor` coverage list.
 */
function bindCapabilityPostures(runnerConfig) {
  const capabilities = runnerConfig?.capabilities ?? runnerConfig?.runner?.capabilities ?? {};
  const executors = runnerConfig?.executors ?? runnerConfig?.runner?.executors ?? {};
  const capsToCheck = new Set(CORE_CAPABILITIES);
  for (const [name, entry] of Object.entries(capabilities)) {
    if (!hasUsablePrefer(entry)) continue;
    const candidates = Array.isArray(entry.prefer) ? entry.prefer : [entry.prefer];
    const hasAgentCandidate = candidates.some((cand) => {
      const exec = executors[typeof cand === 'string' ? cand : cand?.executor];
      return !exec || exec.kind !== 'tool';
    });
    if (hasAgentCandidate) capsToCheck.add(name);
  }
  const postureFailures = [];
  const noPool = [];
  const noCli = [];
  let cliFix = '';
  const otherFailures = [];
  const coverage = [];
  for (const cap of capsToCheck) {
    const unit = {
      id: `posture-check-${cap.replace(/[^a-zA-Z0-9_-]/g, '-')}`,
      capability: cap,
      objective: `Check posture for ${cap}`,
      writes: ['scratch/placeholder'],
    };
    const bound = bind({ unit, role: 'producer' }, { runnerConfig, session: DRY_BIND_SESSION });
    if (bound.refused) {
      const detail = bound.refused.detail ? ` (${bound.refused.detail})` : '';
      const reason = bound.refused.reason;
      if (reason === 'posture-unavailable') postureFailures.push(`${cap}: posture-unavailable${detail}`);
      else if (reason === 'headless-no-executor' || reason === 'no-candidate') noPool.push(cap);
      else if (reason === 'agent-cli-missing') { noCli.push(cap); cliFix = bound.refused.fix ?? ''; }
      else otherFailures.push(`${cap}: ${reason}${detail}`);
    } else if (bound.executor) {
      coverage.push(`${cap} -> ${bound.executor}${bound.invocation ? ` (${bound.invocation})` : ''}`);
    }
  }
  const problems = [];
  if (postureFailures.length > 0) {
    problems.push(`executors lack required posture confinement: ${postureFailures.join('; ')}. Fix: (1) Add an invocation with sandbox.backend "bwrap" to executors.<id> in .fgos/config.json, or (2) remove project-level executors.<id> overrides from .fgos/config.json to inherit healthy global executors from ~/.fgos/config.json.`);
  }
  if (otherFailures.length > 0) problems.push(`other posture failures: ${otherFailures.join('; ')}.`);
  const info = noPool.length > 0
    ? [`no candidate executor available for capabilities: ${noPool.join(', ')}. Fix: Declare runner.capabilities.<cap>.prefer in .fgos/config.json.`]
    : [];
  // A machine with no agent CLI has nothing to bind yet: said once, with the fix, never a failure of the config.
  if (noCli.length > 0) info.push(`no agent CLI is installed, so ${noCli.join(', ')} bind nothing yet. Fix: ${cliFix}`);
  return { problems, info, coverage };
}

/**
 * Binds every seat of every Workflow unit the way a run would, without a lease and without starting anything
 * (`simulateUnitBindings` is the same crate call a run makes, seats in resolver order with the earlier seats
 * published to the later). A policy refusal fails the row; the rest is listed as information: capabilities
 * with no pool, account-state refusals, tiers lowered by `maxTier` and seats that share a provider family.
 *
 * @param {string} cwd Project root (its own core/ and domains/ workflows win over the shipped ones).
 * @param {object} options
 * @param {string} [options.payloadRoot] Root holding the shipped core/ and domains/; the running payload when absent.
 * @param {() => object} options.loadRunnerConfig Returns the project's runner config; may throw.
 */
export async function checkSeatBindingDryBind(cwd, { payloadRoot, loadRunnerConfig }) {
  let runnerConfig;
  try {
    runnerConfig = loadRunnerConfig(cwd);
  } catch (err) {
    return { passed: true, message: `runner config not loadable here, seats not bound: ${err.message}` };
  }
  const loaded = readWorkflowCatalog(cwd, { payloadRoot });
  const problems = [];
  const info = [];
  const shipped = shippedCatalog();
  let units = 0;
  let bound = 0;
  const unserved = [];
  const missingClis = new Set();
  const posture = bindCapabilityPostures(runnerConfig);
  problems.push(...posture.problems);
  info.push(...posture.info);
  for (const entry of loaded.catalog.values()) {
    const wf = entry.workflow;
    const defined = sourceOf(entry);
    const flag = (text) => problems.push(`${text} [${defined}]`);
    if (entry.overridesShipped) info.push(`${wf.id}: ${defined} replaces the shipped definition`);
    for (const activity of declaredActivities(entry)) {
      const u = activity?.unit;
      if (!u || typeof u !== 'object') continue;
      if ('step' in u && 'units' in u) continue;
      if (typeof u.pattern !== 'string' || !u.pattern.trim()) continue;
      const label = `${wf.id}/${activity.id}`;
      try {
        resolveCollaboration({
          selectors: { activityUnit: u },
          inCase: true,
          runnerConfig,
          shipped,
        });
      } catch (err) {
        flag(`${label}: ${err.message}`);
      }
    }
    for (const step of wf.steps) {
      for (const u of step?.units ?? []) {
        const unit = workflowUnitContract(u);
        if (typeof unit.capability !== 'string') continue;
        units += 1;
        const label = `${wf.id}/${step.id}/${u.id} (capability "${unit.capability}")`;
        if (u.template?.acceptOutcomes !== undefined) {
          const pattern = u.template.pattern;
          const loop = loopOf(pattern, { effective: runnerConfig }) ?? (['solo', 'reviewed', 'panel', 'debate'].includes(pattern) ? pattern : 'solo');
          if (loop !== 'reviewed') {
            flag(`${label}: acceptOutcomes requires a reviewed template and unique pass/findings outcomes`);
            continue;
          }
        }
        let seats;
        try {
          ({ seats } = await simulateUnitBindings(unit, runnerConfig, { session: DRY_BIND_SESSION, workflowId: wf.id }));
        } catch (err) {
          flag(`${label}: could not be evaluated (${err.message})`);
          continue;
        }
        for (const seat of seats) {
          if (seat.refused?.reason === 'cli-missing') {
            // Every candidate this seat could use runs a CLI the machine does not have: nothing to repair in the
            // config, so a warning that names what to install, never a failure.
            unserved.push(`${label}: seat ${seat.seat}`);
            for (const [, cli] of seat.refused.detail.matchAll(/runs (\S+?), which is not installed/g)) missingClis.add(cli);
            continue;
          }
          if (seat.refused) {
            const kind = INFO_REFUSALS.get(seat.refused.reason);
            if (kind) info.push(`${label}: seat ${seat.seat} not bound, ${kind} (${seat.refused.reason})`);
            else flag(`${label}: seat ${seat.seat} refused for ${seat.refused.reason}: ${seat.refused.detail}`);
            continue;
          }
          bound += 1;
          if (seat.loweredFrom) info.push(`${label}: seat ${seat.seat} runs at ${seat.tier}, lowered from ${seat.loweredFrom.from} by max-tier-cap (${seat.loweredFrom.fromSource})`);
          if (seat.sharesFamilyWith?.length > 0) info.push(`${label}: seat ${seat.seat}=${seat.executor} shares a provider family with ${seat.sharesFamilyWith.join(', ')} (a preference, not a failure)`);
        }
      }
    }
  }
  const unservedWarning = unserved.length === 0 ? ''
    : `warning: ${unserved.length} seat(s) have no candidate whose agent CLI is installed${missingClis.size > 0 ? `; install ${[...missingClis].sort().join(' or ')} (or another agent CLI the pool names) to bind them` : ''}: ${listed(unserved)}; `;
  const coverage = posture.coverage.length > 0 ? `; posture: ${posture.coverage.join(', ')}` : '';
  const notes = `${coverage}${info.length > 0 ? `; info (${info.length}): ${listed(info)}` : ''}`;
  if (problems.length > 0) {
    const summary = problems.every((p) => p.includes('refused for'))
      ? `${problems.length} seat(s) are refused by policy`
      : `${problems.length} problem(s) found`;
    return withUnreadableDefinitions({ passed: false, message: `${summary}: ${problems.join(' | ')}${notes}` }, loaded.unreadable);
  }
  return withUnreadableDefinitions({ passed: true, message: `${unservedWarning}${units === 0 ? `no Workflow unit to bind${notes}` : `${bound} seat(s) of ${units} Workflow unit(s) bind${notes}`}` }, loaded.unreadable);
}
