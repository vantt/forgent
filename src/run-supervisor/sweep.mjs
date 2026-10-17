// The one door that cleans up after attempts nobody finished: adopt judges every attempt directory that
// is not closed (and finishes the steps a dead supervisor left), then the confinement reaper handles what
// adopt does not own, the herdr homes of the old marker version. The reaper never judges an attempt home
// (version 2 marker); only adopt's finalize-home step removes one.

import { adoptScan } from './client.mjs';
import { reapOrphanedConfinementResources } from '../runner/dispatch/confinement/cleanup.mjs';

/**
 * @param {{assignmentsRoot?: string, tempRoot: string, adoptOptions?: object, reaperOptions?: object}} options
 *   `assignmentsRoot` absent: no attempt directories are looked at (a caller that has no run root).
 * @returns {{adopt: Array<object>|null, adoptError: string|null, reap: {reaped: Array, skipped: Array}}}
 *   An adopt failure (no host binary, route refused) never stops the reaper and never throws.
 */
export function sweepAttempts({ assignmentsRoot, tempRoot, adoptOptions = {}, reaperOptions = {} } = {}) {
  let adopt = null;
  let adoptError = null;
  if (assignmentsRoot) {
    try {
      adopt = adoptScan({ assignmentsRoot, ...adoptOptions });
    } catch (err) {
      adoptError = err?.code ?? String(err?.message ?? err);
    }
  }
  const reap = reapOrphanedConfinementResources({ tempRoot, ...reaperOptions });
  return { adopt, adoptError, reap };
}
