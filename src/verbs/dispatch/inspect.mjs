import { inspectDispatchRuntime, validateInspectionSelector, withRunsCache } from '../../runner/dispatch/runtime-inspection.mjs';
import { loadGlobalConfig } from '../../config/global-config.mjs';
import { inspectProviderCapacity } from '../../runner/dispatch/provider-capacity.mjs';
import { readAttemptView } from './show-run.mjs';
import { fgosDirFromRoot } from '../../runner/paths.mjs';
import fs from 'node:fs';
import path from 'node:path';

export class DispatchInspectError extends Error {
  constructor(message) { super(message); this.name = 'DispatchInspectError'; this.code = 'validation'; this.category = 'validation'; }
}

/**
 * Adds what the run supervisor and the unit say about the inspected run's attempt (`attemptState`, and for a
 * unit run `unitState` with the `--resume` command when it waits for one). Only a selector that resolved to
 * exactly one run gets it; a workspace aggregate does not.
 */
function withAttemptView(repoRoot, inspected) {
  const runId = inspected?.runObservation?.subject?.runId;
  if (typeof runId !== 'string') return inspected;
  for (const location of inspected.subject?.locations ?? []) {
    let run;
    try { run = JSON.parse(fs.readFileSync(path.join(location.path, 'run.json'), 'utf8')); } catch { continue; }
    if (run?.runId === runId) return { ...inspected, ...readAttemptView(location.path, { fgosDir: fgosDirFromRoot(repoRoot) }) };
  }
  return inspected;
}

export function inspectDispatchUseCase(ctx, options = {}) {
  return withRunsCache(() => {
    try {
      if (options.providerCapacity === true) {
        return inspectProviderCapacity({
          runnerConfig: loadGlobalConfig(options.globalConfigPath),
          runtimeDir: options.runtimeDir,
        });
      }
      validateInspectionSelector(options);
      const repoRoot = ctx?.repoRoot ?? ctx?.cwd ?? process.cwd();
      return withAttemptView(repoRoot, inspectDispatchRuntime(repoRoot, options));
    } catch (error) {
      if (error instanceof DispatchInspectError) throw error;
      throw new DispatchInspectError(error.message);
    }
  });
}

// Host routing selects a provider from operation/effect only.  Selector
// resolution stays inside the provider, which is this Dispatch use case.
export function invokeDispatchInspectOperation(request, { selectProvider = () => inspectDispatchUseCase } = {}) {
  if (request?.operationId !== 'dispatch.runtime.inspect' || request?.effect !== 'read') {
    throw new DispatchInspectError('unsupported Dispatch inspection operation');
  }
  const provider = selectProvider({ operationId: request.operationId, effect: request.effect });
  if (typeof provider !== 'function') throw new DispatchInspectError('no read provider is registered for dispatch.runtime.inspect');
  return provider(request.ctx ?? {}, request.payload?.selector ?? {});
}
