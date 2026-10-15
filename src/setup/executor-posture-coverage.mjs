// src/setup/executor-posture-coverage.mjs — doctor check verifying core capabilities have candidates capable of applying posture
// Architecture guard: Runs completely dry (no processes spawned, no files written).
// Evaluates bindings through dry bind().

import { loadRunnerConfigFromDir } from '../runner/dispatch/config.mjs';
import { bind, hasUsablePrefer } from '../runner/execution/bind.mjs';
import { detectHerdrPresent } from '../runner/execution/run.mjs';

const CORE_CAPABILITIES = ['execute', 'code:implement'];

/**
 * Verify that core capabilities (execute, code:implement, and any capability declaring an agent pool)
 * have at least one candidate executor capable of applying required posture.
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

  const postureFailures = [];
  const missingPoolWarnings = [];
  const otherFailures = [];
  const coverage = [];

  for (const cap of capsToCheck) {
    const unit = {
      id: `posture-check-${cap.replace(/[^a-zA-Z0-9_-]/g, '-')}`,
      capability: cap,
      objective: `Check posture for ${cap}`,
      writes: ['scratch/placeholder'],
    };

    const bound = bind({ unit, role: 'producer' }, { runnerConfig, session });
    if (bound.refused) {
      const reason = bound.refused.reason;
      const detail = bound.refused.detail ? ` (${bound.refused.detail})` : '';
      if (reason === 'posture-unavailable') {
        postureFailures.push({ cap, detail });
      } else if (reason === 'headless-no-executor' || reason === 'no-candidate') {
        missingPoolWarnings.push({ cap, detail });
      } else {
        otherFailures.push({ cap, reason, detail });
      }
    } else if (bound.executor) {
      coverage.push(`${cap} -> ${bound.executor}${bound.invocation ? ` (${bound.invocation})` : ''}`);
    }
  }

  const hasHardFailure = postureFailures.length > 0 || otherFailures.length > 0;
  if (!hasHardFailure) {
    if (missingPoolWarnings.length > 0) {
      const list = missingPoolWarnings.map((w) => w.cap).join(', ');
      return {
        passed: true,
        message: `warning: no candidate executor available for capabilities: ${list}. Fix: Declare runner.capabilities.<cap>.prefer in .fgos/config.json.`,
      };
    }
    return {
      passed: true,
      message: `all core capabilities have executors capable of applying posture: ${coverage.join(', ')}`,
    };
  }

  const sections = [];
  if (postureFailures.length > 0) {
    const list = postureFailures.map((f) => `${f.cap}: posture-unavailable${f.detail}`).join('; ');
    sections.push(
      `executors lack required posture confinement: ${list}. Fix: (1) Add an invocation with sandbox.backend "bwrap" to executors.<id> in .fgos/config.json, or (2) remove project-level executors.<id> overrides from .fgos/config.json to inherit healthy global executors from ~/.fgos/config.json.`,
    );
  }
  if (missingPoolWarnings.length > 0) {
    const list = missingPoolWarnings.map((w) => `${w.cap}`).join('; ');
    sections.push(
      `no candidate executor available: ${list}. Fix: Declare runner.capabilities.<cap>.prefer in .fgos/config.json.`,
    );
  }
  if (otherFailures.length > 0) {
    const list = otherFailures.map((f) => `${f.cap}: ${f.reason}${f.detail}`).join('; ');
    sections.push(`other failures: ${list}.`);
  }

  return {
    passed: false,
    message: `core capabilities lack executors capable of applying required postures: ${sections.join(' ')}`,
  };
}
