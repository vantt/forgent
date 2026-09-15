import { inspectDispatchRuntime, validateInspectionSelector } from '../../runner/dispatch/runtime-inspection.mjs';

export class DispatchInspectError extends Error {
  constructor(message) { super(message); this.name = 'DispatchInspectError'; this.code = 'validation'; this.category = 'validation'; }
}

export function inspectDispatchUseCase(ctx, options = {}) {
  try {
    validateInspectionSelector(options);
    const repoRoot = ctx?.repoRoot ?? ctx?.cwd ?? process.cwd();
    return inspectDispatchRuntime(repoRoot, options);
  } catch (error) {
    if (error instanceof DispatchInspectError) throw error;
    throw new DispatchInspectError(error.message);
  }
}
