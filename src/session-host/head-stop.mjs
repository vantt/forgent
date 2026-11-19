// head-stop.mjs -- the end of a head session on purpose.
//
// `stopHeadSession` closes the pane of the live head of one persona-name through Session Host and writes `retiredAt`
// (RFC 3339) into the lineage's `placement.json`; the head-state source answers `retired` from that field
// (`apps/fgos/src/wiring/observe_sources/head_state.rs`). The next `session start` of the lineage replaces the file and so
// clears it. Who may ask is the request route's rule; this is only the effect.

import { createSessionHost } from './client.mjs';
import { headRoleOf, identityHolder, lineageDirOf, readHeadPlacement, writeHeadPlacement } from './head-start.mjs';

export class HeadStopError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'HeadStopError';
    this.code = code;
  }
}

/**
 * Stops the live head of `persona` and `name`. Returns `{ stopped: true }`, or `{ stopped: false, reason: 'not-live' }`
 * when no live session holds the role (nothing is closed or written). A pane that will not close throws
 * `HeadStopError` `retire-refused` and leaves the placement as it was.
 *
 * `ports` (for a test): `host` (Session Host client: `retireAsync(placement, 'close', { groupKey })`),
 * `identity({ role, projectRoot }) -> { live }`, `now() -> Date`, `groupKeyOf(record) -> string`.
 */
export async function stopHeadSession({ persona, name, projectRoot, reason = null } = {}, ports = {}) {
  const role = headRoleOf(persona, name);
  const dir = lineageDirOf(projectRoot, persona, name);
  const record = readHeadPlacement(dir);
  const holder = await (ports.identity ?? ((ask) => identityHolder(ask.role, ask.projectRoot)))({ role, projectRoot });
  if (!record || !holder.live) return { stopped: false, reason: 'not-live' };

  const host = ports.host ?? createSessionHost();
  const groupKey = (ports.groupKeyOf ?? ((r) => r.placement.groupKey ?? r.placement.key))(record);
  const answer = await host.retireAsync(record.placement, 'close', { groupKey });
  if (answer.result !== 'retired') {
    throw new HeadStopError('retire-refused', `${role} could not be closed: ${answer.code ?? answer.result}${answer.detail ? ` (${answer.detail})` : ''}`);
  }
  const retiredAt = (ports.now?.() ?? new Date()).toISOString();
  writeHeadPlacement(dir, { ...record, retiredAt, ...(reason ? { retiredReason: String(reason).slice(0, 200) } : {}) });
  return { stopped: true };
}
