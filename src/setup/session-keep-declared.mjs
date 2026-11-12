// Pointer row of `fgos doctor`: which confined agent invocations declare no session directory, so Execution keeps
// no transcript of their seats. Read-only and cheap: it reads the runner config it is given and never starts a seat;
// `fgos dispatch probe-session <executorId>` is the verb that shows where the CLI really writes and repairs nothing.

import { credentialStoreOf } from '../runner/dispatch/provider-capacity.mjs';

/** `executor/invocation` of every confined `cli` invocation with no session directory declared. */
export function invocationsKeepingNoSession(cfg) {
  const found = [];
  for (const [executorId, executor] of Object.entries(cfg?.executors ?? {})) {
    if ((executor?.kind ?? 'agent') !== 'agent') continue;
    for (const invocation of executor.invocations ?? []) {
      if (invocation?.via !== 'cli' || !(invocation.confinement ?? executor.confinement)?.backend) continue;
      if (!credentialStoreOf({ ...invocation, command: invocation.command ?? executor.command })?.sessionDir) found.push(`${executorId}/${invocation.id}`);
    }
  }
  return found;
}

export function checkSessionKeepDeclared(cfg) {
  const missing = invocationsKeepingNoSession(cfg);
  if (missing.length === 0) return { passed: true, message: 'every confined agent invocation declares the session directory Execution keeps' };
  const executors = [...new Set(missing.map((entry) => entry.split('/')[0]))];
  return {
    passed: true,
    message: `warning: ${missing.length} confined invocation(s) keep no session transcript (${missing.join(', ')}); run fgos dispatch probe-session ${executors.length === 1 ? executors[0] : '<executorId>'} to see where that CLI writes its session, then declare it as credentialStore.sessionDir`,
  };
}
