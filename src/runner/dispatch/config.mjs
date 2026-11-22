// The runner config as a session-host caller loads it: one call of the native addon's `execution` namespace through
// the Execution door (`fgos-execution::runner_config` composes it: retired keys, the global-rigor refusal, the runner
// check, origins, confinement normalisation and error codes).
export { loadRunnerConfigForDir } from '../../native/execution-door.mjs';
