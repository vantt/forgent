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
 * pane that is already open. */
export function normalizeAgentName(raw) {
  const cleaned = String(raw ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return cleaned || 'fgos-agent';
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

    let body;
    try {
      body = JSON.parse(res.stdout);
    } catch {
      // A herdr that neither answers JSON nor exits cleanly is a broken
      // transport, and saying so beats guessing at the text.
      throw new HerdrError(
        'herdr_unparseable',
        `herdr ${args.join(' ')} returned no parseable JSON (exit ${res.status ?? 'unknown'}): ${(res.stdout || res.stderr || '').slice(0, 400)}`,
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
     * dispatch as chat into an idle REPL -- the tsk-1nih incident. */
    paneSplit({ direction = 'right', focus = false, cwd: paneCwd, env: paneEnv } = {}) {
      const args = ['pane', 'split', '--direction', direction];
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

/** States in which it is safe to type at an agent. `done` is not an error:
 * a `--no-focus` pane settles there because a CLI read never marks it seen,
 * measured, not assumed. */
export const READY_STATES = Object.freeze(['idle', 'done']);

export function isReadyState(state) {
  return READY_STATES.includes(state);
}
