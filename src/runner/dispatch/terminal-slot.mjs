// One round's view of its terminal slot.
//
// Every herdr call of the controller goes through terminal-control, which
// addresses a pane by a key: this module makes the client (one per route
// configuration), names keys and display facts, and turns a refusal from the
// port into a thrown `TerminalSlotError` whose `code` is the driver's own
// error code when the driver named one. What happens in the pane after the
// handover belongs to the run supervisor.

import path from 'node:path';
import { createTerminalControl } from '../../terminal-control/client.mjs';

/** The herdr binary a caller names, else `FGOS_HERDR_BIN`, else `herdr` on PATH. The one place that default lives. */
export function resolveHerdrBin(optsHerdrBin, env = process.env) {
  return optsHerdrBin?.trim() || env.FGOS_HERDR_BIN?.trim() || 'herdr';
}

export class TerminalSlotError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'TerminalSlotError';
    this.code = code;
    Object.assign(this, details);
  }
}

/** A key or group key the port accepts: letters, digits, `.`, `_`, `-`, at most 128. */
export function portKey(raw, fallback = 'run') {
  const cleaned = String(raw ?? '').replace(/[^A-Za-z0-9._-]/g, '-').replace(/^[^A-Za-z0-9]+/, '').slice(0, 128);
  return cleaned || fallback;
}

/** The driver error code inside a refusal reason: `herdr agent_blocked: ...` -> `agent_blocked`. */
export function driverCodeOf(refusal) {
  return /^herdr ([a-z_]+):/.exec(refusal?.reason ?? '')?.[1] ?? null;
}

/** A refusal as the error the round code branches on. */
export function refusalError(refusal, what) {
  if (refusal.result === 'unsupported') {
    return new TerminalSlotError('terminal_unsupported', `${what}: ${refusal.detail}`, { capability: refusal.capability });
  }
  const code = driverCodeOf(refusal) ?? 'terminal_unknown';
  const detail = refusal.reason ?? refusal.detail ?? refusal.result;
  return new TerminalSlotError(code, `${what}: ${detail}`);
}

// One client per route configuration for the life of the process: the client's promise queue per
// group key is what keeps two rounds of one batch from both opening the batch's tab, so rounds that
// run side by side in this process must share it.
const clients = new Map();

/**
 * The terminal-control client a round talks to. `herdrEnv` is the driver
 * environment of the herdr server the round lives in (HERDR_SESSION and
 * HERDR_SOCKET_PATH of a confined round); only `HERDR_*` entries are sent.
 */
export function createRoundTerminalControl({ herdrBin, herdrEnv, config, hostBin, timeoutMs } = {}) {
  const env = {};
  for (const [name, value] of Object.entries(herdrEnv ?? {})) {
    if (name.startsWith('HERDR_') && typeof value === 'string') env[name] = value;
  }
  const identity = JSON.stringify([hostBin ?? null, herdrBin ?? null, env, config ?? null, timeoutMs ?? null]);
  let client = clients.get(identity);
  if (!client) {
    client = createTerminalControl({
      ...(hostBin ? { hostBin } : {}),
      ...(herdrBin ? { herdrBin } : {}),
      ...(Object.keys(env).length ? { env } : {}),
      ...(config ? { config } : {}),
      ...(timeoutMs ? { timeoutMs } : {}),
    });
    clients.set(identity, client);
  }
  return client;
}

/**
 * What names the work in a label: its work item, else its run (`run-` and the first four characters of the
 * unit run's random part, the rest of a unit run id being only a clock) with the start of its objective as
 * the title. A work item carries its own title when the item had one at dispatch; without it the label
 * shows the id alone.
 */
export function workLabelOf(assignment) {
  if (assignment?.workId) return { id: assignment.workId, ...(assignment.title ? { title: assignment.title } : {}) };
  const unitRunId = assignment?.unitRunId ?? assignment?.provenance?.unitRunId;
  const random = /-([0-9a-f]{8})$/.exec(unitRunId ?? '')?.[1];
  return { ...(random ? { id: `run-${random.slice(0, 4)}` } : {}), ...(assignment?.objective ? { title: assignment.objective } : {}) };
}

/**
 * Display data for a slot: structured and written to the terminal only. The port builds the visible
 * label from these fields (short id, title cut, role and model), so nothing here formats text.
 */
export function slotDisplay({ id, title, agent, model, role }) {
  return {
    ...(id ? { id: String(id) } : {}),
    ...(title ? { title: String(title) } : {}),
    ...(role ? { role } : {}),
    ...(agent ? { agent: path.basename(String(agent)) } : {}),
    ...(model ? { model: String(model) } : {}),
  };
}
