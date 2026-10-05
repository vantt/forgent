// blind-steps-proven-pools.mjs — doctor check: can a `blind` Workflow unit's capability pool only
// bind executors whose provider family and transport were proven to keep a worker blind?
//
// A unit with `blind: true` is refused at dispatch when it cannot be enforced, after the earlier roles
// already ran. Which (provider family, transport) pairs actually kept a worker from reading a peer's
// run state was measured once, live; a pool that can bind any other pair fails at run time. This check
// finds that per project before any run.
//
// Candidates are never resolved here: each blind unit's roles are walked through the runner's own
// bind() (the same candidate walk a quota fallback takes), so nothing is dispatched, written or paid for.

import path from 'node:path';

import { bind } from '../runner/execution/bind.mjs';
import { simulateUnitBindings } from '../runner/execution/dry-bind.mjs';
import { deriveProviderFamily } from '../runner/dispatch/resolve.mjs';
import { loadWorkflowDefinitions } from './workflow-pool-independence.mjs';

/**
 * Pairs a live canary proved blind: a worker of that provider family, run through that transport
 * under that confinement backend, could not read a peer run's report, run directory or process.
 * Evidence: plans/reports/read-confinement-slice-2-261005.md (canary table, 2026-10-05) and, for
 * gemini (agy), plans/reports/agy-blind-canary-261005.md (2026-10-05, account tetcu72).
 *
 * `family` is the provider family bind() derives for the executor (its `providerModel`, else
 * `provider`, else its command). `transport` is `herdr` (a herdr-spawn invocation) or `cli` (a
 * cli-spawn invocation). To prove another pair: run the blind canary for it, then add a row.
 */
export const BLIND_PROVEN_PAIRS = [
  { family: 'claude', transport: 'herdr', backend: 'bwrap' },
  { family: 'openai', transport: 'herdr', backend: 'bwrap' },
  { family: 'openai', transport: 'cli', backend: 'bwrap' },
  { family: 'xai', transport: 'herdr', backend: 'bwrap' },
  { family: 'z-ai', transport: 'cli', backend: 'bwrap' },
  { family: 'deepseek', transport: 'cli', backend: 'bwrap' },
  { family: 'gemini', transport: 'herdr', backend: 'bwrap' },
  { family: 'gemini', transport: 'cli', backend: 'bwrap' },
];

const TRANSPORT_BY_ADAPTER = { 'herdr-spawn': 'herdr', 'cli-spawn': 'cli' };

// Which invocation a candidate takes depends on whether the run happens inside a herdr session.
const SESSIONS = [{ herdrPresent: true }, { herdrPresent: false }];

function isProven({ family, transport, backend }) {
  return BLIND_PROVEN_PAIRS.some((p) => p.family === family.toLowerCase() && p.transport === transport && p.backend === backend);
}

function describeCandidate(runnerConfig, bound) {
  const entry = (runnerConfig.executors ?? runnerConfig.runner?.executors ?? {})[bound.executor];
  const invocations = Array.isArray(entry?.invocations) ? entry.invocations : [];
  const invocation = invocations.find((inv) => inv?.id === bound.invocation);
  const cli = invocations.find((inv) => inv?.via === 'cli');
  return {
    executor: bound.executor,
    invocation: bound.invocation,
    family: deriveProviderFamily(entry, cli?.command ?? entry?.command ?? 'claude'),
    transport: TRANSPORT_BY_ADAPTER[invocation?.adapter] ?? 'unknown',
    backend: invocation?.confinement?.backend ?? 'none',
  };
}

/** Every executor/invocation a role could bind, in pool order: bind() again after each pick, skipping it. */
function candidatesForRole(unit, role, runnerConfig, session) {
  const found = [];
  let skip = -1;
  for (;;) {
    const bound = bind(
      { unit, role, independentOf: [], overrides: [], blind: true },
      { runnerConfig, session: { headless: true, ...session } },
      { skipCandidateIndex: skip },
    );
    if (bound.refused || !Number.isInteger(bound.candidateIndex) || bound.candidateIndex <= skip) return found;
    found.push(describeCandidate(runnerConfig, bound));
    skip = bound.candidateIndex;
  }
}

/**
 * @param {string} cwd Project root (its own core/ and domains/ workflows are checked too).
 * @param {object} options
 * @param {string} options.packageRoot Root holding the shipped core/ and domains/.
 * @param {() => object} options.loadRunnerConfig Returns the project's runner config; may throw.
 * @returns {Promise<{ passed: boolean, message: string }>}
 */
export async function checkBlindStepsUseProvenPools(cwd, { packageRoot, loadRunnerConfig }) {
  let runnerConfig;
  try {
    runnerConfig = loadRunnerConfig(cwd);
  } catch (err) {
    return { passed: true, message: `runner config not loadable here, blind pools not evaluated: ${err.message}` };
  }
  const roots = path.resolve(cwd) === path.resolve(packageRoot) ? [packageRoot] : [packageRoot, cwd];
  const loaded = loadWorkflowDefinitions(roots);
  if (loaded.unavailable) {
    return { passed: true, message: `blind pools not evaluated: ${loaded.unavailable}` };
  }

  const problems = [];
  let evaluated = 0;
  for (const wf of loaded.workflows.values()) {
    for (const step of wf.steps) {
      for (const u of step?.units ?? []) {
        const template = u?.template ?? {};
        if (template.blind !== true || typeof template.capability !== 'string') continue;
        evaluated += 1;
        const label = `${wf.id}/${step.id}/${u.id} (capability "${template.capability}")`;
        try {
          const unit = {
            id: u.id,
            objective: template.objective ?? '',
            capability: template.capability,
            rigor: template.rigor,
            writes: template.writes ?? [],
            pattern: template.pattern,
            blind: true,
          };
          // The pattern decides which roles exist; bind() decides what each could be.
          const { roles } = await simulateUnitBindings(unit, runnerConfig, { session: SESSIONS[0] });
          const unproven = new Map();
          for (const session of SESSIONS) {
            for (const { role } of roles) {
              for (const c of candidatesForRole(unit, role, runnerConfig, session)) {
                if (!isProven(c)) unproven.set(`${c.executor}/${c.invocation}`, c);
              }
            }
          }
          for (const c of unproven.values()) {
            problems.push(`${label}: ${c.executor} via ${c.invocation} (family ${c.family}, ${c.transport}, confinement ${c.backend})`);
          }
        } catch (err) {
          problems.push(`${label}: could not be evaluated (${err.message})`);
        }
      }
    }
  }
  if (problems.length > 0) {
    return {
      passed: false,
      message: `blind steps can bind executors not proven to keep a worker blind: ${problems.join(' | ')} -- remove that executor from the capability's prefer pool for the blind step, or run the blind canary for that provider family and transport and add the pair to BLIND_PROVEN_PAIRS in src/setup/blind-steps-proven-pools.mjs`,
    };
  }
  return {
    passed: true,
    message: evaluated === 0
      ? 'not applicable: no Workflow unit is blind'
      : `every blind Workflow unit (${evaluated}) can only bind provider families proven blind`,
  };
}
