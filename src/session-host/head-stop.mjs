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
import { headRoleOf, identityHolder, lineageDirOf, readHeadPlacement, writeHeadPlacement } from './head-start.mjs';

export class HeadStopError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'HeadStopError';
    this.code = code;
  }
}

const CLOSE_WAIT_MS = 30_000;
const POLL_MS = 100;

/**
 * Stops the live head of `persona` and `name`. Returns `{ stopped: true }`, or `{ stopped: false, reason: 'not-live' }`
 * when no live session holds the role (nothing is ended or written). A plain pane close is refused while an agent is the
 * pane's foreground (session-host spec section 8.2), so the head ends the way a rotation ends the old head: its own
 * supervisor is asked to stop it (`cancel-requested.json`), its release step closes the pane, and only then is the pane
 * retired. `retiredAt` is written first, before anything that can end the route child (a head stopping its own role), and
 * is put back as it was only when no stop request could be written (`stop-not-ended`); after a request it stays, and a head that does not end in time (`stop-not-ended`) or a pane that will not close (`retire-refused`) is reported with the stamp kept.
 *
 * `ports` (for a test): `host` (Session Host client: `retireAsync(placement, 'close', { groupKey })`),
 * `identity({ role, projectRoot }) -> { live }`, `now() -> Date`, `groupKeyOf(record) -> string`,
 * `end(runDir) -> boolean` (asks the head's supervisor to stop it), `closed(runDir) -> boolean`, `sleep(ms)`, `waitMs`.
 */
export async function stopHeadSession({ persona, name, projectRoot, reason = null } = {}, ports = {}) {
  const role = headRoleOf(persona, name);
  const dir = lineageDirOf(projectRoot, persona, name);
  const record = readHeadPlacement(dir);
  const holder = await (ports.identity ?? ((ask) => identityHolder(ask.role, ask.projectRoot)))({ role, projectRoot });
  if (!record || !holder.live) return { stopped: false, reason: 'not-live' };

  const retiredAt = (ports.now?.() ?? new Date()).toISOString();
  writeHeadPlacement(dir, { ...record, retiredAt, ...(reason ? { retiredReason: String(reason).slice(0, 200) } : {}) });
  // The stamp is put back only while nothing was asked of the head: once its stop request is written the head may end at
  // any moment, so the stamp stays and the error names the unfinished stop.
  let requested = false;
  try {
    if (record.runDir) {
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
    const groupKey = (ports.groupKeyOf ?? ((r) => r.placement.groupKey ?? r.placement.key))(record);
    const answer = await host.retireAsync(record.placement, 'close', { groupKey });
    if (answer.result !== 'retired') {
      throw new HeadStopError('retire-refused', `${role} could not be closed: ${answer.code ?? answer.result}${answer.detail ? ` (${answer.detail})` : ''}`);
    }
  } catch (err) {
    if (!requested) writeHeadPlacement(dir, record);
    throw err;
  }
  return { stopped: true };
}
