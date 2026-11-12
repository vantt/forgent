// paseo-launch.mjs — the paseo carrier of an `external` attempt (adapter `paseo-spawn`).
//
// The controller prepares the attempt like any other and starts its supervisor; this module then asks a
// paseo daemon to start the agent. Paseo runs the command of its provider `fgos-<cli>`, a link
// `fgos-exec-<cli>` to the fgOS host, with `FGOS_ATTEMPT_DIR` naming the attempt: the host turns into the
// attempt's gate (docs/platform/run-supervisor/spec.md, External mode). Paseo keeps the agent's pipes and
// speaks the CLI's protocol, so it can steer the agent while it works; fgOS never sees those bytes. When
// the agent's turn ends this module archives the paseo agent, which closes its pipes: the CLI exits, the
// gate publishes its exit and the attempt settles like any other.
//
// The supervisor knows nothing of paseo; everything paseo-specific is here and in the doctor row.

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { DispatchError } from '../../run-supervisor/dispatch-error.mjs';
import { normalizeAgentName, publishMutableProjection } from '../../native/proof-helpers.mjs';
import { briefPaths, renderBrief } from './brief.mjs';

/** The environment variable naming the paseo CLI; `paseo` on PATH when unset. */
export const PASEO_BIN_ENV = 'FGOS_PASEO_BIN';
/** The variable `fgos internal exec` reads its attempt directory from (packages/run-supervisor exec.rs). */
export const ATTEMPT_DIR_ENV = 'FGOS_ATTEMPT_DIR';
/** Linux refuses one argument longer than this (MAX_ARG_STRLEN), and the brief is one argument of `paseo run`. */
export const MAX_PROMPT_BYTES = 128 * 1024 - 1;
/**
 * Paseo's agent mode for a confined attempt, by CLI: the CLI runs no sandbox of its own, fgOS's is the
 * boundary, as a confined cli invocation passes `-s danger-full-access` (Codex's sandbox is a second bwrap
 * that cannot nest in fgOS's). Only modes seen working through paseo are listed.
 */
export const PASEO_CONFINED_MODES = Object.freeze({ codex: 'full-access' });
/** How long the supervisor gets to listen on its socket before the host is asked to start the gate. */
const SOCKET_WAIT_MS = 10_000;

export function resolvePaseoBin(env = process.env) {
  return env[PASEO_BIN_ENV]?.trim() || 'paseo';
}

/** The paseo provider that starts `cli` through fgOS. */
export function paseoProviderId(cli) {
  return `fgos-${cli}`;
}

/** The link paseo's provider `fgos-<cli>` runs: under the fgOS state root, so it outlives a release. */
export function execLinkPath(stateRoot, cli) {
  return path.join(stateRoot, 'bin', `fgos-exec-${cli}`);
}

/**
 * Point `fgos-exec-<cli>` at the attempt's host binary, replacing it atomically. Paseo probes the provider
 * by running `<command> --version`, so the command must be the link itself, named for the CLI: the host
 * started under that name is `fgos internal exec <cli>` and passes the probe through to the CLI. A link to an older
 * release would still work (the gate execs the envelope's own host), but one whose release was removed
 * would not, so every launch refreshes it.
 */
export function refreshExecLink({ stateRoot, cli, hostBin }) {
  const link = execLinkPath(stateRoot, cli);
  fs.mkdirSync(path.dirname(link), { recursive: true });
  let current = null;
  try { current = fs.readlinkSync(link); } catch { /* absent or not a link */ }
  if (current === hostBin) return link;
  const staged = `${link}.${process.pid}.tmp`;
  fs.rmSync(staged, { force: true });
  fs.symlinkSync(hostBin, staged);
  fs.renameSync(staged, link);
  return link;
}

/**
 * The brief of an external attempt, as a pane worker gets it (`brief.mjs`): nothing reads the agent's
 * stdout, so it answers in `outbox/result-1.json`. Written to `brief-1.md` for the record; the text is
 * what paseo hands the agent. A result already in the outbox would settle the attempt on somebody else's
 * answer, so it refuses.
 */
export function writeExternalBrief({ runDir, prompt, runId, attemptId, effectiveContract }) {
  const paths = briefPaths(runDir, 1);
  fs.mkdirSync(paths.outbox, { recursive: true });
  if (fs.lstatSync(paths.resultPath, { throwIfNoEntry: false })) {
    throw new DispatchError('invalid-config', `${paths.resultPath} already exists before this attempt started, so it would settle on somebody else's result`, { reason: 'stale-result-in-run-dir', runDir });
  }
  const contract = effectiveContract
    ? { ...effectiveContract, resultClaim: { ...(effectiveContract.resultClaim ?? { schema: 'agent-result.v1', required: true }), path: paths.resultPath } }
    : null;
  const agentName = normalizeAgentName(`fgos-${runId ?? 'run'}-${attemptId}`);
  const text = renderBrief({ prompt, round: 1, runDir: paths.runDir, agentName, effectiveContract: contract });
  fs.writeFileSync(paths.briefPath, text);
  // The contract on disk names the claim where this brief told the agent to write it, as a pane round's does.
  if (contract && fs.existsSync(paths.effectiveExecutionContractPath)) {
    const { assignment: _role, ...persisted } = contract;
    publishMutableProjection(paths.effectiveExecutionContractPath, persisted);
  }
  return { text, briefPath: paths.briefPath, outboxDir: paths.outbox, agentName };
}

/** Wait until the supervisor listens on `socketPath`; false when it did not within the budget or exited. */
export async function waitForSocket(socketPath, { child = null, timeoutMs = SOCKET_WAIT_MS, intervalMs = 25 } = {}) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try { if (fs.statSync(socketPath).isSocket()) return true; } catch { /* not yet */ }
    if (child && child.exitCode !== null) return false;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return false;
}

/** Run the paseo CLI once and collect its output; never throws for an exit code. */
function runPaseo(bin, args, { env, cwd } = {}) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let child;
    try {
      child = spawn(bin, args, { env, cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
      resolve({ status: null, stdout, stderr: err.message });
      return;
    }
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (err) => { stderr += err.message; });
    child.on('close', (status) => resolve({ status, stdout, stderr }));
  });
}

/** The agent id in `paseo run --json` output (its last JSON object), or null. */
export function agentIdOf(stdout) {
  const at = stdout.indexOf('{');
  if (at < 0) return null;
  try {
    const parsed = JSON.parse(stdout.slice(at));
    return typeof parsed?.agentId === 'string' && parsed.agentId ? parsed.agentId : null;
  } catch {
    return null;
  }
}

/**
 * Paseo's agent mode for `cli`: unconfined, null (paseo's default for the provider, the CLI's own sandbox);
 * confined, the mode that turns the CLI's sandbox off, which must be known for that CLI.
 */
export function paseoModeFor(cli, { confined }) {
  if (!confined) return null;
  const mode = PASEO_CONFINED_MODES[cli];
  if (!mode) {
    throw new DispatchError('external-confined-mode-unknown', `no paseo agent mode is known that runs ${cli} without its own sandbox inside fgOS's (known: ${Object.keys(PASEO_CONFINED_MODES).join(', ')})`, { cli });
  }
  return mode;
}

/** The argv of `paseo run` that starts one attempt's agent. */
export function paseoRunArgs({ cli, mode, attemptDir, cwd, title, prompt }) {
  return [
    'run', '--no-wait', '--json',
    '--provider', paseoProviderId(cli),
    ...(mode ? ['--mode', mode] : []),
    '--env', `${ATTEMPT_DIR_ENV}=${attemptDir}`,
    '--cwd', cwd,
    '--title', title,
    prompt,
  ];
}

/**
 * The carrier one attempt uses: `start` asks the daemon for the agent and returns its id, `closeWhenDone`
 * waits for its turn to end (at most `timeoutMs`) and archives it. `runner` runs the paseo CLI; tests
 * inject it.
 */
export function createPaseoCarrier({ env = process.env, bin = resolvePaseoBin(env), runner = runPaseo } = {}) {
  const call = (args, cwd) => runner(bin, args, { env, cwd });
  return {
    bin,
    async start({ cli, mode, attemptDir, cwd, title, prompt }) {
      if (Buffer.byteLength(prompt) > MAX_PROMPT_BYTES) {
        throw new DispatchError('external-brief-too-large', `the brief is ${Buffer.byteLength(prompt)} bytes; paseo takes it as one argument, at most ${MAX_PROMPT_BYTES}`, { attemptDir });
      }
      const out = await call(paseoRunArgs({ cli, mode, attemptDir, cwd, title, prompt }), cwd);
      const agentId = out.status === 0 ? agentIdOf(out.stdout) : null;
      if (!agentId) {
        throw new DispatchError('external-host-refused', `paseo (${bin}) did not start the agent (exit ${out.status}): ${out.stderr.trim() || out.stdout.trim() || 'no output'}`, { attemptDir, provider: paseoProviderId(cli) });
      }
      return agentId;
    },
    async closeWhenDone(agentId, { timeoutMs, cwd }) {
      const waited = await call(['wait', agentId, '--timeout', `${Math.max(1, Math.ceil(timeoutMs / 1000))}s`], cwd);
      const archived = await call(['agent', 'archive', agentId], cwd);
      return { waited: waited.status, archived: archived.status, ...(archived.status === 0 ? {} : { detail: archived.stderr.trim() }) };
    },
  };
}
