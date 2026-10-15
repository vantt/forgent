// src/setup/executor-posture-coverage.mjs — doctor check verifying core capabilities can apply read-only and workspace-write postures
// Architecture guard: Runs completely dry (no processes spawned, no files written).
// Simulates bindings through simulateUnitBindings / bind().

import { loadRunnerConfigFromDir } from '../runner/dispatch/config.mjs';
import { simulateUnitBindings } from '../runner/execution/dry-bind.mjs';
import { detectHerdrPresent } from '../runner/execution/run.mjs';
import { hasUsablePrefer } from '../runner/execution/bind.mjs';

const CORE_CAPABILITIES = ['execute', 'code:implement'];
const POSTURES = [
  { id: 'read-only', writes: [] },
  { id: 'workspace-write', writes: ['scratch/placeholder'] },
];

/**
 * Verify that core capabilities (execute, code:implement, and any capability declaring an agent pool)
 * have at least one candidate executor capable of applying both read-only and workspace-write postures.
 *
 * @param {string} cwd Project directory.
 * @param {object} [options]
 * @param {object} [options.runnerConfig] Direct runner configuration for testing.
 * @param {(dir: string) => object} [options.loadRunnerConfig] Loader for runner configuration.
 * @param {object} [options.session] Simulation session options.
 * @returns {Promise<{ passed: boolean, message: string }>}
 */
export async function checkExecutorPostureCoverage(cwd, options = {}) {
  let runnerConfig;
  try {
    runnerConfig = options.runnerConfig
      ?? (options.loadRunnerConfig ? options.loadRunnerConfig(cwd) : loadRunnerConfigFromDir(cwd));
  } catch (err) {
    return {
      passed: true,
      message: `runner config not loadable here, executor posture coverage not evaluated: ${err.message}`,
    };
  }

  const capabilities = runnerConfig?.capabilities ?? runnerConfig?.runner?.capabilities ?? {};
  const executors = runnerConfig?.executors ?? runnerConfig?.runner?.executors ?? {};
  const capsToCheck = new Set(CORE_CAPABILITIES);

  for (const [name, entry] of Object.entries(capabilities)) {
    if (hasUsablePrefer(entry)) {
      const candidates = Array.isArray(entry.prefer) ? entry.prefer : [entry.prefer];
      const hasAgentCandidate = candidates.some((cand) => {
        const execId = typeof cand === 'string' ? cand : cand?.executor;
        const exec = executors[execId];
        return !exec || exec.kind !== 'tool';
      });
      if (hasAgentCandidate) {
        capsToCheck.add(name);
      }
    }
  }

  const session = {
    headless: true,
    herdrPresent: detectHerdrPresent(),
    ...(options.session ?? {}),
  };
  const simulate = options.simulateUnitBindings ?? simulateUnitBindings;

  const failures = [];
  const coverage = [];

  for (const cap of capsToCheck) {
    const entry = capabilities[cap];
    const requiresWorkspaceWrite = CORE_CAPABILITIES.includes(cap) || entry?.serves?.mutates === true;
    const posturesToCheck = requiresWorkspaceWrite
      ? POSTURES
      : POSTURES.filter((p) => p.id === 'read-only');

    const capResults = [];
    for (const posture of posturesToCheck) {
      const unit = {
        id: `posture-check-${cap.replace(/[^a-zA-Z0-9_-]/g, '-')}-${posture.id}`,
        capability: cap,
        objective: `Check ${posture.id} posture`,
        writes: posture.writes,
      };

      try {
        const { roles } = await simulate(unit, runnerConfig, { session });
        const primaryRole = roles?.[0];
        if (!primaryRole || primaryRole.refused || !primaryRole.executor) {
          const reason = primaryRole?.refused?.reason ?? 'posture-unavailable';
          const detail = primaryRole?.refused?.detail ? ` (${primaryRole.refused.detail})` : '';
          failures.push({
            cap,
            posture: posture.id,
            reason,
            detail,
          });
        } else {
          capResults.push({
            posture: posture.id,
            executor: primaryRole.executor,
            invocation: primaryRole.invocation,
          });
        }
      } catch (err) {
        failures.push({
          cap,
          posture: posture.id,
          reason: 'error',
          detail: ` (${err.message})`,
        });
      }
    }

    if (capResults.length === posturesToCheck.length) {
      const ro = capResults.find((r) => r.posture === 'read-only');
      const ww = capResults.find((r) => r.posture === 'workspace-write');
      if (!ww) {
        coverage.push(`${cap} -> ${ro.executor}${ro.invocation ? ` (${ro.invocation})` : ''}`);
      } else if (ro.executor === ww.executor) {
        coverage.push(`${cap} -> ${ro.executor}${ro.invocation ? ` (${ro.invocation})` : ''}`);
      } else {
        coverage.push(`${cap} -> read-only: ${ro.executor}, workspace-write: ${ww.executor}`);
      }
    }
  }

  if (failures.length === 0) {
    return {
      passed: true,
      message: `all core capabilities have executors capable of read-only and workspace-write: ${coverage.join(', ')}`,
    };
  }

  const failureSections = [];

  const postureFailures = failures.filter((f) => f.reason === 'posture-unavailable');
  if (postureFailures.length > 0) {
    const list = postureFailures.map((f) => `${f.cap} (${f.posture}): ${f.reason}${f.detail}`).join('; ');
    failureSections.push(
      `executors lack required posture confinement: ${list}. Fix: (1) Add an invocation with sandbox.backend "bwrap" to executors.<id> in .fgos/config.json, or (2) remove project-level executors.<id> overrides from .fgos/config.json to inherit healthy global executors from ~/.fgos/config.json.`,
    );
  }

  const noCandidateFailures = failures.filter((f) => f.reason === 'headless-no-executor' || f.reason === 'no-candidate');
  if (noCandidateFailures.length > 0) {
    const list = noCandidateFailures.map((f) => `${f.cap} (${f.posture}): ${f.reason}${f.detail}`).join('; ');
    failureSections.push(
      `no candidate executor available: ${list}. Fix: Declare runner.capabilities.<cap>.prefer in .fgos/config.json (or rely on global pool in ~/.fgos/config.json).`,
    );
  }

  const otherFailures = failures.filter((f) => f.reason !== 'posture-unavailable' && f.reason !== 'headless-no-executor' && f.reason !== 'no-candidate');
  if (otherFailures.length > 0) {
    const list = otherFailures.map((f) => `${f.cap} (${f.posture}): ${f.reason}${f.detail}`).join('; ');
    failureSections.push(`other failures: ${list}.`);
  }

  return {
    passed: false,
    message: `core capabilities lack executors capable of applying required postures: ${failureSections.join(' ')}`,
  };
}
