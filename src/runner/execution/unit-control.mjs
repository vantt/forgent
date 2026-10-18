// Who drives a unit run right now: one controller at a time. The control record is the run-control
// ledger (run-lock.mjs) kept under the unit directory, so a controller that died is taken over by the
// next `--resume` through the same dead-holder proof every run control uses, and a controller that is
// alive refuses a second one. Nothing here starts, adopts or settles an attempt.

import path from 'node:path';
import { acquireRunControl, buildRunControlHolder, inspectRunControl, releaseRunControl } from '../dispatch/run-lock.mjs';

/** The directory whose `control/` ledger records the unit's controller. */
export function unitControlDir(unitDir) {
  return path.join(unitDir, 'unit-control');
}

/**
 * Take the controller seat of a unit run.
 * @returns {{status:'acquired', release:() => void} | {status:'held', holder:object|null}}
 */
export function acquireUnitControl(unitDir, unitRunId) {
  const controlDir = unitControlDir(unitDir);
  const taken = acquireRunControl(controlDir, { holder: buildRunControlHolder(`${unitRunId}:controller:${process.pid}`), purpose: 'unit-controller' });
  if (taken.status !== 'acquired') return { status: 'held', holder: taken.holder ?? null };
  const { controlEpoch, controlToken } = taken;
  return { status: 'acquired', release: () => { releaseRunControl(controlDir, { controlEpoch, controlToken }); } };
}

/** Read-only: is a controller of this unit run alive (or not provably dead)? */
export function unitControllerHeld(unitDir) {
  return inspectRunControl(unitControlDir(unitDir)).held === true;
}
