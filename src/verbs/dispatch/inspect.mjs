import { inspectDispatchRuntime, validateInspectionSelector } from '../../runner/dispatch/runtime-inspection.mjs';
import { loadGlobalConfig } from '../../config/global-config.mjs';
import { inspectProviderCapacity } from '../../runner/dispatch/provider-capacity.mjs';

export class DispatchInspectError extends Error {
  constructor(message) { super(message); this.name = 'DispatchInspectError'; this.code = 'validation'; this.category = 'validation'; }
}

export function inspectDispatchUseCase(ctx, options = {}) {
  try {
    if (options.providerCapacity === true) {
      return inspectProviderCapacity({
        runnerConfig: loadGlobalConfig(options.globalConfigPath),
        runtimeDir: options.runtimeDir,
      });
    }
    validateInspectionSelector(options);
    const repoRoot = ctx?.repoRoot ?? ctx?.cwd ?? process.cwd();
    return inspectDispatchRuntime(repoRoot, options);
  } catch (error) {
    if (error instanceof DispatchInspectError) throw error;
    throw new DispatchInspectError(error.message);
  }
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
