// One round's view of its terminal slot.
//
// Every herdr call of the dispatch path goes through terminal-control, which
// addresses a pane by a key. This module binds one key to a client and gives
// the round the handful of questions it asks about its pane: what is on the
// screen, what state the agent is in, what the detector sees, whether the
// agent's process is still there, how to type at it. It decides nothing:
// a refusal from the port becomes a thrown `TerminalSlotError` whose `code`
// is the driver's own error code when the driver named one.

import path from 'node:path';
import { createTerminalControl } from '../../terminal-control/client.mjs';

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

function must(result, expected, what) {
  if (result.result === expected) return result;
  if (result.result === 'unsupported' || result.result === 'unknown') throw refusalError(result, what);
  throw new TerminalSlotError('terminal_bad_answer', `${what}: the port answered ${result.result}`);
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

/** Tab label for a group: short and readable, never read back. */
export function groupLabel(groupKey) {
  return String(groupKey).slice(0, 40);
}

/**
 * Bind `key` on `tc`. The returned object is the only thing the wait, brief
 * and settle logic of a round sees of the terminal.
 */
export function createSlotIo({ tc, key, groupKey }) {
  const call = (op, request = {}) => tc[op]({ key, ...request });

  // `want` leaves parts out so a poll costs only the driver calls it needs.
  const inspect = (want = {}) => {
    const seen = call('inspect', want);
    must(seen, 'inspection', `inspect ${key}`);
    return seen;
  };

  /** The pane must exist for an operation on its agent to mean anything. */
  const livePane = (seen) => {
    if (seen.pane === 'gone') throw new TerminalSlotError('pane_not_found', `pane of ${key} is gone`);
    if (seen.pane !== 'live') throw new TerminalSlotError('terminal_unknown', `pane of ${key} could not be inspected`);
    return seen;
  };

  return {
    key,

    /** Screen text; `source` is `visible`, `recent`, ... */
    read({ lines, source } = {}) {
      const answer = call('read', { ...(lines ? { lines } : {}), ...(source ? { source } : {}) });
      return must(answer, 'screen', `read ${key}`).screen;
    },

    /** The agent's status as the driver reports it; `unknown` when it reports none.
     * `recognised` says the driver knows an agent runs in the pane. */
    state() {
      const seen = livePane(inspect({ foreground: false }));
      const activity = seen.activity ?? null;
      return {
        agentStatus: activity?.state || 'unknown',
        agentSession: activity?.session ?? null,
        agent: activity?.agent ?? null,
        recognised: typeof activity?.agent === 'string' && activity.agent !== '',
      };
    },

    /** The driver's screen detector: a verdict, or `{ state: null }` when it gave none. */
    explain() {
      const seen = livePane(inspect({ foreground: false, detail: true }));
      const detail = seen.activity?.detail;
      if (!detail) return { state: null, visibleBlocker: false, visibleIdle: false, visibleWorking: false, matchedRule: null, promptText: '', raw: null };
      return {
        state: typeof detail.state === 'string' ? detail.state : null,
        visibleBlocker: detail.visibleBlocker === true,
        visibleIdle: detail.visibleIdle === true,
        visibleWorking: detail.visibleWorking === true,
        matchedRule: detail.matchedRule ?? null,
        promptText: typeof detail.promptText === 'string' ? detail.promptText : '',
        raw: detail,
      };
    },

    /** `{ pane: 'live'|'gone'|'unknown', foreground: identity|null }`. */
    foreground() {
      const seen = inspect({ activity: false });
      return { pane: seen.pane, foreground: seen.foreground ?? null };
    },

    /** Type `text` and submit it. */
    prompt(text) {
      must(call('send', { text, submit: true }), 'ok', `send to ${key}`);
    },

    /** Type `text` without submitting it. */
    type(text) {
      must(call('send', { text }), 'ok', `send to ${key}`);
    },

    sendKeys(keys) {
      must(call('send', { keys }), 'ok', `send keys to ${key}`);
    },

    /** Tell the driver which agent runs here, for a process it does not recognise by itself. */
    reportAgent({ agent, label, state = 'working' }) {
      must(call('label', { display: { label, agent }, reportState: state }), 'ok', `report agent of ${key}`);
    },

    /** Close the pane (or retain it) behind the earlier calls of its group, so a close never runs while
     * a seat of the same group is still choosing a pane next to it. */
    release(disposition, { until = null } = {}) {
      return tc.releaseAsync({ key, ...(groupKey ? { groupKey } : {}), ...(disposition === 'retain' ? { disposition, until } : { disposition }) });
    },
  };
}

/** Display data for a slot: structured, written to the terminal only. */
export function slotDisplay({ groupKey, agent, model, role }) {
  return {
    label: groupLabel(groupKey),
    ...(role ? { role } : {}),
    ...(agent ? { agent: path.basename(String(agent)) } : {}),
    ...(model ? { model: String(model) } : {}),
  };
}
