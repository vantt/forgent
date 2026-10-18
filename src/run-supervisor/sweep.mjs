// The one door that cleans up after attempts nobody finished: adopt judges every attempt directory that
// is not closed and finishes the steps a dead supervisor left. Only adopt's finalize-home step removes a
// private home, and only while the attempt's lock is free and its process domain is empty.

import { adoptScan } from './client.mjs';

/**
 * @param {{assignmentsRoot?: string, adoptOptions?: object}} options
 *   `assignmentsRoot` absent: no attempt directories are looked at (a caller that has no run root).
 * @returns {{adopt: Array<object>|null, adoptError: string|null}}
 *   An adopt failure (no host binary, route refused) never throws.
 */
export function sweepAttempts({ assignmentsRoot, adoptOptions = {} } = {}) {
  let adopt = null;
  let adoptError = null;
  if (assignmentsRoot) {
    try {
      adopt = adoptScan({ assignmentsRoot, ...adoptOptions });
    } catch (err) {
      adoptError = err?.code ?? String(err?.message ?? err);
    }
  }
  return { adopt, adoptError };
}
