// One door onto the herdr CLI.
//
// Every herdr call this repo makes goes through here, for one reason: herdr
// answers in a single JSON envelope with two shapes, and the difference
// between them is the difference between "the transport told us why" and "the
// dispatch timed out for no stated reason". Measured against herdr 0.8.2:
//
//   success -> exit 0, {"id":"cli:agent:get","result":{...}}
//   failure -> exit 1, {"error":{"code":"agent_not_found","message":"..."},"id":"..."}
//
// Parsing that in one place means a caller never sees a raw exit code, never
// re-implements the `result.agent` vs `result.agents` unwrapping, and always
// gets a named `code` it can turn into an outcome.
//
// herdr is transport and failure detector here, never truth and never receipt:
// nothing this module returns is proof that the worker did any work. That
// proof is a file the worker itself wrote, and it is read somewhere else.

import { execFileSync } from 'node:child_process';

/** A herdr call that did not succeed. `code` is herdr's own error code when
 * herdr answered (`agent_not_ready`, `agent_blocked`, `agent_prompt_stalled`,
 * `agent_not_found`, ...), or one of this module's own codes when herdr could
 * not be reached or could not be understood. */
export class HerdrError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'HerdrError';
    this.code = code;
    Object.assign(this, details);
  }
}

/** herdr rejects an agent name it cannot use as a target -- uppercase was
 * rejected outright in live probing. Normalize rather than fail late inside a
 * pane that is already open.
 *
 * Length is trimmed from the MIDDLE, never the end. Names arrive as
 * `fgos-<workId>-<timestamp>`, so cutting the tail off a long workId takes
 * the timestamp with it -- and two rounds of that same item would then share
 * one agent name in one session, where herdr addresses agents by name.
 *
 * 32 is herdr's own limit, quoted from its refusal: "agent name must start
 * with a lowercase letter and contain only lowercase letters, digits, '-' or
 * '_' (1-32 characters)". This module trimmed at 48 for a long time, which is
 * not a limit anything has -- it simply never bit, because every name measured
 * in testing was short. The first dispatch of a real capability produced
 * `fgos-fgos-coding-implement-<ts>` at 35 characters and herdr refused it. */
export function normalizeAgentName(raw, { maxLength = 32 } = {}) {
  const cleaned = String(raw ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (cleaned.length <= maxLength) return cleaned || 'fgos-agent';
  // Keep enough of the head to recognise the item and all of the tail that
  // makes it unique.
  const tail = Math.min(16, Math.floor(maxLength / 2));
  const head = maxLength - tail;
  return `${cleaned.slice(0, head)}${cleaned.slice(-tail)}`;
}

function defaultRun(bin, args, { cwd, env, timeoutMs }) {
  try {
    const stdout = execFileSync(bin, args, {
      cwd,
      env,
      encoding: 'utf8',
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      ...(timeoutMs ? { timeout: timeoutMs } : {}),
    });
    return { status: 0, stdout, stderr: '' };
  } catch (err) {
    // `status` is a number only when the process actually ran and exited.
    // ENOENT (herdr not installed) and a timeout kill both leave it undefined,
    // and those are a different failure than "herdr said no".
    return {
      status: typeof err.status === 'number' ? err.status : null,
      stdout: typeof err.stdout === 'string' ? err.stdout : '',
      stderr: typeof err.stderr === 'string' ? err.stderr : (err.message ?? ''),
      spawnCode: err.code ?? null,
      killed: Boolean(err.killed),
    };
  }
}

/**
 * Build a herdr client bound to one binary, cwd and environment.
 *
 * `run` is injectable so tests can drive a fake backend without a herdr
 * install and without a real terminal; the default shells out for real.
 */
export function createHerdrClient({ herdrBin = 'herdr', cwd, env, run = defaultRun } = {}) {
  const invoke = (args, { timeoutMs } = {}) => {
    const res = run(herdrBin, args, { cwd, env, timeoutMs });

    if (res.spawnCode === 'ENOENT') {
      throw new HerdrError('herdr_unavailable', `herdr binary "${herdrBin}" not found on PATH.`, { args });
    }
    if (res.killed || res.spawnCode === 'ETIMEDOUT') {
      throw new HerdrError('herdr_call_timeout', `herdr ${args.join(' ')} was killed after ${timeoutMs}ms.`, { args });
    }

    // MEASURED: herdr answers on stdout when it succeeds and on STDERR when it
    // fails -- `agent start` timing out writes a perfectly well-formed
    // {"error":{"code":"timeout"}} envelope to stderr and nothing to stdout.
    // Reading only stdout turned that named failure into an unnamed one, which
    // is the exact outcome this module exists to prevent. Both streams are
    // tried, stdout first.
    let body;
    for (const stream of [res.stdout, res.stderr]) {
      if (typeof stream !== 'string' || !stream.trim()) continue;
      try {
        body = JSON.parse(stream);
        break;
      } catch {
        // try the other stream before giving up
      }
    }
    if (body === undefined) {
      // A herdr that answers JSON on neither stream is a broken transport, and
      // saying so beats guessing at the text.
      throw new HerdrError(
        'herdr_unparseable',
        `herdr ${args.join(' ')} returned no parseable JSON on stdout or stderr (exit ${res.status ?? 'unknown'}): ${(res.stdout || res.stderr || '').slice(0, 400)}`,
        { args, exitCode: res.status },
      );
    }

    if (body?.error) {
      throw new HerdrError(
        body.error.code ?? 'herdr_error',
        body.error.message ?? `herdr ${args.join(' ')} failed.`,
        { args, exitCode: res.status },
      );
    }
    return body?.result ?? {};
  };

  return {
    invoke,

    /** Always a FRESH pane. Reusing a finished worker's pane delivers the next
     * dispatch as chat into an idle REPL -- the tsk-1nih incident.
     *
     * `pane`, when given, is an existing pane to split FROM -- the only way to
     * land the fresh pane in a specific tab, since herdr splits are anchored to
     * a pane, never addressed by tab id. Omitted, herdr falls back to whatever
     * pane is currently focused, which is what scatters sibling dispatches
     * across whichever tab a person happens to be looking at. */
    paneSplit({ pane, direction = 'right', focus = false, cwd: paneCwd, env: paneEnv } = {}) {
      const args = ['pane', 'split'];
      if (pane) args.push('--pane', pane);
      args.push('--direction', direction);
      if (!focus) args.push('--no-focus');
      if (paneCwd) args.push('--cwd', paneCwd);
      for (const [key, value] of Object.entries(paneEnv ?? {})) {
        args.push('--env', `${key}=${value}`);
      }
      const result = invoke(args);
      const paneId = result?.pane?.pane_id ?? result?.pane_id ?? result?.root_pane?.pane_id ?? null;
      if (!paneId) {
        throw new HerdrError('herdr_unparseable', 'herdr pane split returned no pane_id.', { args });
      }
      return paneId;
    },

    /** Panes this session currently has. A session that has just started has
     * none, which is why a worker session has to be given one before anything
     * can be split off it. */
    paneList() {
      const result = invoke(['pane', 'list']);
      const panes = result?.panes ?? [];
      return Array.isArray(panes) ? panes.map((p) => p.pane_id ?? p.paneId).filter(Boolean) : [];
    },

    /** Give a session its first pane. `env` here DOES take effect for ordinary
     * variables such as HOME -- measured. It does not for `HERDR_*`, which
     * herdr overwrites with the real values for the session that owns the
     * pane; that is why a worker's isolation comes from being in a different
     * session, not from an environment override. */
    workspaceCreate({ cwd: wsCwd, label = 'fgos-worker', env: wsEnv } = {}) {
      const args = ['workspace', 'create'];
      if (wsCwd) args.push('--cwd', wsCwd);
      if (label) args.push('--label', label);
      for (const [key, value] of Object.entries(wsEnv ?? {})) args.push('--env', `${key}=${value}`);
      const result = invoke(args);
      return result?.root_pane?.pane_id ?? result?.pane?.pane_id ?? null;
    },

    /** A fresh tab, labeled atomically in the same call (no rename-after race
     * to close -- `label` is a `tab create` param, not a separate step). The
     * returned `paneId` is that tab's own root pane: pass it as `pane` to
     * `paneSplit` to land every sibling dispatch of one batch in this same
     * tab instead of wherever focus happens to be. */
    tabCreate({ cwd: tabCwd, label, env: tabEnv, focus = false } = {}) {
      const args = ['tab', 'create'];
      if (tabCwd) args.push('--cwd', tabCwd);
      if (label) args.push('--label', label);
      if (!focus) args.push('--no-focus');
      for (const [key, value] of Object.entries(tabEnv ?? {})) args.push('--env', `${key}=${value}`);
      const result = invoke(args);
      const tabId = result?.tab?.tab_id ?? null;
      const paneId = result?.root_pane?.pane_id ?? null;
      if (!tabId || !paneId) {
        throw new HerdrError('herdr_unparseable', 'herdr tab create returned no tab_id/pane_id.', { args });
      }
      return { tabId, paneId };
    },

    /** Diagnostic only, used to decide whether a tab is safe to close: a tab
     * still holding more than its own root pane has a live or forensically-
     * kept leaf pane in it, and closing it would take that pane down too. */
    tabGet(tabId) {
      const tab = invoke(['tab', 'get', tabId])?.tab ?? {};
      return { tabId: tab.tab_id ?? tabId, paneCount: tab.pane_count ?? null, label: tab.label ?? null };
    },

    /** Best-effort, like `paneClose` -- cleanup, never a dispatch result. A
     * tab that refuses to close is left for a person to deal with, not a
     * failure this call reports. */
    tabClose(tabId) {
      try {
        invoke(['tab', 'close', tabId], { timeoutMs: 5000 });
        return true;
      } catch {
        return false;
      }
    },

    paneClose(paneId) {
      try {
        invoke(['pane', 'close', paneId], { timeoutMs: 5000 });
        return true;
      } catch {
        // Closing a pane is cleanup, never a result. A pane that refuses to
        // close is a forensic artifact, not a dispatch failure.
        return false;
      }
    },

    /** The liveness rung of the signal ladder: a pane whose only foreground
     * process is its own shell no longer has an agent in it. */
    paneProcessInfo(paneId) {
      const info = invoke(['pane', 'process-info', '--pane', paneId])?.process_info ?? {};
      return {
        paneId: info.pane_id ?? paneId,
        shellPid: info.shell_pid ?? null,
        foregroundPgid: info.foreground_process_group_id ?? null,
        foregroundProcesses: Array.isArray(info.foreground_processes) ? info.foreground_processes : [],
      };
    },

    /** Starts the agent and returns only once herdr says the pane holds a
     * ready agent -- this is what absorbs the shell boot race that the old
     * `pane run` path had to guess at. Failure is named (`agent_not_ready`). */
    agentStart(name, { kind, paneId, timeoutMs = 30000, agentArgs = [] } = {}) {
      const args = ['agent', 'start', name, '--kind', kind, '--pane', paneId, '--timeout', String(timeoutMs)];
      if (agentArgs.length > 0) args.push('--', ...agentArgs);
      // The call itself blocks for up to `timeoutMs`; give the child a margin
      // over that so a herdr that is merely slow is not killed mid-answer and
      // reported as an unreachable transport.
      return invoke(args, { timeoutMs: timeoutMs + 15000 });
    },

    /**
     * Submit a prompt. `until` narrows what `--wait` matches: waiting for
     * `working` confirms the text was accepted and the turn began, without
     * blocking for the whole turn (that is the poll loop's job).
     *
     * herdr's own stall detector fires at 5000ms, so any timeout passed here
     * must be well above that -- a shorter one returns a bare `timeout` and
     * the caller never learns the real reason.
     */
    agentPrompt(name, text, { wait = true, until, timeoutMs = 20000 } = {}) {
      const args = ['agent', 'prompt', name, text];
      if (wait) args.push('--wait');
      for (const state of until ?? []) args.push('--until', state);
      if (timeoutMs) args.push('--timeout', String(timeoutMs));
      return invoke(args, { timeoutMs: (timeoutMs ?? 20000) + 15000 });
    },

    agentWait(name, { until = [], timeoutMs = 20000 } = {}) {
      const args = ['agent', 'wait', name];
      for (const state of until) args.push('--until', state);
      if (timeoutMs) args.push('--timeout', String(timeoutMs));
      return invoke(args, { timeoutMs: (timeoutMs ?? 20000) + 15000 });
    },

    /** Diagnostic only. `agent_status` is never a receipt and never a result;
     * it says whether it is safe to type, nothing more. */
    agentGet(name) {
      const agent = invoke(['agent', 'get', name])?.agent ?? {};
      return {
        agentStatus: agent.agent_status ?? 'unknown',
        agentSession: agent.agent_session ?? null,
        paneId: agent.pane_id ?? null,
        stateChangeSeq: agent.state_change_seq ?? null,
        terminalTitle: agent.terminal_title_stripped ?? agent.terminal_title ?? null,
      };
    },

    /** Screen text. Only ever used to explain a `blocked` agent to a human --
     * never to decide that work happened. */
    agentRead(name, { lines } = {}) {
      const args = ['agent', 'read', name];
      if (lines) args.push('--lines', String(lines));
      const result = invoke(args);
      return result?.read?.text ?? result?.text ?? '';
    },
  };
}

/**
 * A lazily-created, memoized batch tab: the first `ensure(client, sessionKey)`
 * call for a given session opens a tab via `tabCreate` and remembers the
 * result; every later call for that SAME session returns the same pane id
 * without a second `tab create`.
 *
 * Exists so one caller's batch (one coordination round's actors, one fanout
 * wave) can share a single tab across sequential dispatch calls without
 * creating one for a batch that turns out to have no herdr-backed round at
 * all -- `ensure` is only ever invoked from inside a round that already
 * needs a herdr client, never eagerly by whoever builds the batch.
 *
 * Keyed by `sessionKey`, not shared globally: a confined round talks to a
 * different herdr server (a different socket, a different pane-id
 * namespace) than an unconfined one, so a tab created on one is not a valid
 * split target on the other. Two rounds of one batch that land in different
 * herdr sessions get their own tab per session instead of colliding.
 */
export function createBatchTab({ label, cwd, env } = {}) {
  const bySession = new Map();
  return {
    ensure(client, sessionKey = 'default') {
      let handle = bySession.get(sessionKey);
      if (!handle) {
        const created = client.tabCreate({ label, cwd, env });
        handle = { ...created, client };
        bySession.set(sessionKey, handle);
      }
      return handle.paneId;
    },

    /** Forget a session's tab -- e.g. its anchor pane turned out to be gone.
     * The next `ensure()` for that session opens a fresh tab instead of
     * repeating a split against an id already known to be dead. */
    invalidate(sessionKey = 'default') {
      bySession.delete(sessionKey);
    },

    /** Best-effort end-of-batch cleanup: close a tab only when nothing but
     * its own root pane is left in it. A tab still holding a leaf pane has
     * either a round genuinely still running or a failed round's pane kept
     * open on purpose (`herdr pane close` on a fixed reason on screen) --
     * `tab close` takes down every pane in it unconditionally, so closing
     * one that still holds a leaf pane would destroy exactly the evidence
     * that policy exists to keep. Never throws: called from a process exit
     * hook, where a herdr that is slow or gone must not block shutdown. */
    closeIfEmpty() {
      for (const handle of bySession.values()) {
        try {
          const info = handle.client.tabGet(handle.tabId);
          if (typeof info.paneCount === 'number' && info.paneCount <= 1) {
            handle.client.tabClose(handle.tabId);
          }
        } catch {
          // Best-effort only -- a herdr that cannot answer at exit time is
          // not this cleanup's problem to solve. An unreadable pane count is
          // read as "not safe to close", never as "assume empty".
        }
      }
    },
  };
}

/** States in which it is safe to type at an agent. `done` is not an error:
 * a `--no-focus` pane settles there because a CLI read never marks it seen,
 * measured, not assumed. */
export const READY_STATES = Object.freeze(['idle', 'done']);

export function isReadyState(state) {
  return READY_STATES.includes(state);
}
