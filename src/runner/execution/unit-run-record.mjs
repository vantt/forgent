// The Unit-run record port as a session-host or Workflow caller reads it: what a Unit run's directory says, and when
// it may go, one call each of the native addon's `execution` namespace through the Execution door. The facts and
// the judgement are `fgos-execution::record_facts`'s and `fgos-execution::run_facts`'s; `removeUnitRun` is the one
// place a Unit run directory is deleted.
export { judgeUnitRun, removeUnitRun, unitRunFacts } from '../../native/execution-door.mjs';

export const UNIT_RUN_RECORD_CONTRACT = Object.freeze({ id: 'unit-run-record', version: 1 });
