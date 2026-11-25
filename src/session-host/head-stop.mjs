// head-stop.mjs -- the end of a head session on purpose.
//
// `stopHeadSession` ends the live head of one persona-name through its own supervisor, retires its pane and writes `retiredAt`
// (RFC 3339) into the lineage's `placement.json`; the head-state source answers `retired` from that field
// (`apps/fgos/src/wiring/observe_sources/head_state.rs`). The next `session start` of the lineage replaces the file and so
// clears it. Who may ask is the request route's rule; this is only the effect.

import fs from 'node:fs';
import path from 'node:path';
import { requestCancel } from '../run-supervisor/cancel-registry.mjs';
import { createSessionHost } from './client.mjs';
import { headRoleOf, identityHolder, lineageDirOf, readHeadPlacement, slotKeyOf, writeHeadPlacement } from './head-start.mjs';

export class HeadStopError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'HeadStopError';
    this.code = code;
  }
}

const CLOSE_WAIT_MS = 30_000;
const POLL_MS = 100;

/** The short role a lead may hold when it was started by hand: `lead:<LANE>`; the same pattern as `is_short_lead_role` in the wake door (packages/supervision/rust/src/wake.rs). */
const SHORT_LEAD_ROLE = /^lead:[A-Za-z0-9_-]{1,64}$/;

/**
 * Stops the live head of `persona` and `name`, or the live lead that holds the short role `role` (`lead:<LANE>`). Returns
 * `{ stopped: true }`, or `{ stopped: false, reason: 'not-live' }` when no live session holds the role (nothing is ended or
 * written). A plain pane close is refused while an agent is the pane's foreground (session-host spec section 8.2), so the
 * head ends the way a rotation ends the old head: its own supervisor is asked to stop it (`cancel-requested.json`), its
 * release step closes the pane, and only then is the pane retired. `retiredAt` is written first, before anything that can
 * end the route child (a head stopping its own role), and is put back as it was only when no stop request could be
 * written (`stop-not-ended`); after a request it stays, and a head that does not end in time (`stop-not-ended`) or a pane
 * that will not close (`retire-refused`) is reported with the stamp kept.
 *
 * A short role is resolved through Identity to its live session, and its lineage (run directory, pane and `retiredAt`
 * stamp) is the head its record names (`ids.head`), ended exactly as a head is. A lead whose record names no lineage with
 * a run directory has no supervisor to ask and its pane is never closed plain: `{ stopped: false, reason: 'no-supervisor' }`,
 * for the caller to report.
 *
 * `ports` (for a test): `host` (Session Host client: `retireAsync(placement, 'close', { groupKey })`),
 * `identity({ role, projectRoot }) -> { live, record? }`, `now() -> Date`, `groupKeyOf(record) -> string`,
 * `end(runDir) -> boolean` (asks the head's supervisor to stop it), `closed(runDir) -> boolean`, `sleep(ms)`, `waitMs`.
 */
export async function stopHeadSession({ persona, name, role: shortRole = null, projectRoot, reason = null } = {}, ports = {}) {
  if (shortRole !== null && !SHORT_LEAD_ROLE.test(shortRole)) {
    throw new HeadStopError('bad-role', `a role stopped by name must be a lead's short role (lead:<LANE>), got ${JSON.stringify(shortRole)}`);
  }
  const role = shortRole ?? headRoleOf(persona, name);
  const identity = ports.identity ?? ((ask) => identityHolder(ask.role, ask.projectRoot));
  const holder = await identity({ role, projectRoot });
  if (!holder.live) return { stopped: false, reason: 'not-live' };

  let dir;
  if (shortRole === null) {
    dir = lineageDirOf(projectRoot, persona, name);
  } else {
    const head = holder.record?.ids?.head;
    dir = head?.persona && head?.name ? lineageDirOf(projectRoot, head.persona, head.name) : null;
  }
  const record = dir ? readHeadPlacement(dir) : null;
  if (shortRole === null && !record) return { stopped: false, reason: 'not-live' };
  // A lead is ended only through its own run supervisor; a plain pane close is refused while an agent is the pane's
  // foreground (session-host spec section 8.2), so a lead with no lineage run directory is reported, not pane-closed.
  if (shortRole !== null && !record?.runDir) return { stopped: false, reason: 'no-supervisor' };
  const placement = record?.placement ?? (slotKeyOf(holder.record) ? { host: 'terminal', key: slotKeyOf(holder.record) } : null);
  if (!placement) return { stopped: false, reason: 'no-placement' };

  if (record) {
    const retiredAt = (ports.now?.() ?? new Date()).toISOString();
    writeHeadPlacement(dir, { ...record, retiredAt, ...(reason ? { retiredReason: String(reason).slice(0, 200) } : {}) });
  }
  // The stamp is put back only while nothing was asked of the head: once its stop request is written the head may end at
  // any moment, so the stamp stays and the error names the unfinished stop.
  let requested = false;
  try {
    if (record?.runDir) {
      const end = ports.end ?? ((runDir) => requestCancel(runDir, 'session-stop'));
      if (!end(record.runDir)) throw new HeadStopError('stop-not-ended', `${role} could not be asked to stop: no stop request could be written for ${record.runDir}`);
      requested = true;
      const closed = ports.closed ?? ((runDir) => fs.existsSync(path.join(runDir, 'closed.json')));
      const sleep = ports.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
      const until = Date.now() + (ports.waitMs ?? CLOSE_WAIT_MS);
      while (!closed(record.runDir) && Date.now() < until) await sleep(POLL_MS);
      if (!closed(record.runDir)) throw new HeadStopError('stop-not-ended', `${role} did not end within ${ports.waitMs ?? CLOSE_WAIT_MS} ms of its stop request`);
    }
    const host = ports.host ?? createSessionHost();
    const groupKey = (ports.groupKeyOf ?? ((r) => r.placement.groupKey ?? r.placement.key))({ ...record, placement });
    const answer = await host.retireAsync(placement, 'close', { groupKey });
    if (answer.result !== 'retired') {
      throw new HeadStopError('retire-refused', `${role} could not be closed: ${answer.code ?? answer.result}${answer.detail ? ` (${answer.detail})` : ''}`);
    }
  } catch (err) {
    if (record && !requested) writeHeadPlacement(dir, record);
    throw err;
  }
  return { stopped: true };
}
