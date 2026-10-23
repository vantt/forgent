/**
 * scripts/lib/mailbox-wake-probe.mjs
 *
 * The interactive wake-channel probes of the mailbox (docs/platform/agent-mailbox/spec.md §6.2,
 * §7.2 owner decision K1, §15.8; plan V7f part A): which outside channel starts a turn on an
 * idle interactive head, with what latency, role and side effects (a dialog, a focus change,
 * typed input). The logic lives here and is proven against stubs; the runner that opens the
 * panes is test/live/mailbox-wake-probe.live.mjs. Benign text only: each probe's mail is a
 * hello, and the channel carries the fixed nudge line of the V7f measurement, never a body.
 *
 * A probe never writes to a socket or a queue it did not create: a Claude Code session's socket
 * path is taken from the probe's own session file and refused outside the probe's directory, and
 * a Codex queue call names the probe's private CODEX_HOME. A dialog that opens is answered by a
 * person, never by the harness.
 */
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { NUDGE } from './mailbox-behaviour-v7f.mjs';

export { NUDGE };

/** The Terminal Control group of every probe pane. */
export const GROUP = 'mbx-wake-v7f';
/** The benign mail each probe's head is sent before its channel is tried. */
export const HELLO = 'MBX-WAKE-HELLO: a benign hello from the wake probe; nothing to do.';
/** How long a probe watches for a turn after its channel fired. */
export const WATCH_MS = 60_000;
/** The tick of an extension timer (pi, omp) and of the harness's own sampling. */
export const TIMER_MS = 5_000;
export const SAMPLE_MS = 250;

/**
 * The probes. `sessions` counts the interactive sessions each starts (W4 and W8 observe the
 * sessions of others). `setting` is Claude Code's `crossSessionInbound` given through the
 * session's own `--settings` file, never globally (K1); `mode` its permission class. `busy`
 * fires the channel while a tool runs. Each names its expected result and its stop condition
 * before it runs.
 */
export const PROBES = Object.freeze([
  { id: 'W1', cli: 'claude', channel: 'socket', setting: 'accept', mode: 'bypass', busy: false, sessions: 1,
    question: 'a session started with a scoped crossSessionInbound accept: does a write to its socket from a process that is not a session start a turn when idle?',
    expected: 'a turn starts within a few seconds, with no dialog and no focus change; the nudge reaches the model as a user-role message inside Claude Code\'s own cross-session frame; the model runs inbox --claim and reads the hello',
    stop: 'a dialog opens (a person answers it); no turn within 60 s; any write would go outside the probe\'s own socket' },
  { id: 'W2', cli: 'claude', channel: 'socket', setting: null, mode: 'bypass', busy: false, sessions: 1,
    question: 'the control: the same write to a bypass-mode session without the scoped setting',
    expected: 'held behind the "Held message from another session" dialog (no-mode-asserted), as on 2.1.304; no turn',
    stop: 'the dialog opens: the harness records it and stops; a person denies it' },
  { id: 'W2b', cli: 'claude', channel: 'socket', setting: null, mode: 'bypass', fromMode: 'bypass', busy: false, sessions: 1,
    question: 'the forgery check: the same write to a bypass-mode session with no setting, but claiming "from_mode":"bypass" (the 2.1.309 gate accepts a frame whose claimed mode equals the recipient\'s class)',
    expected: 'by the gate code (inferred): accepted with no dialog, a turn starts; so W2\'s hold would not make K1 hold for bypass sessions, because the attestation is the writer\'s own claim',
    stop: 'a dialog opens (a person denies it); no turn within 60 s' },
  { id: 'W3', cli: 'claude', channel: 'socket', setting: 'accept', mode: 'bypass', busy: true, sessions: 1,
    question: 'the scoped session while busy (a running tool): is the write queued or does it interrupt, and when is it seen?',
    expected: 'queued: no interrupt of the running tool; seen as its own turn after the current turn ends (2.1.304: 1.7-2.5 s after)',
    stop: 'a dialog opens; the running tool is interrupted (recorded, then stop); no turn within 60 s of the tool\'s end' },
  { id: 'W4', cli: 'claude', observes: ['W1', 'W2', 'W3'], sessions: 0,
    question: 'presence: does ~/.claude/sessions/<pid>.json status read idle at the idle moments of W1-W3?',
    expected: 'idle before each write on an idle session, busy while a tool runs, waiting while a dialog is open',
    stop: 'none of its own: it reads W1-W3\'s session files every 250 ms' },
  { id: 'W5', cli: 'codex', channel: 'queue', busy: false, sessions: 1,
    question: 'codex queue --thread <id> to an idle REPL attached to its daemon (a private CODEX_HOME, so a private daemon): does it start a turn, how fast, as what role?',
    expected: 'a turn starts within the 0-10 s tick; the nudge is a user message in the rollout',
    stop: 'a dialog opens; queue refused; no turn within 60 s' },
  { id: 'W6', cli: 'codex', channel: 'queue', busy: true, sessions: 1,
    question: 'the same while a tool runs: queued until the turn ends, delivered after the next tool call, interrupting, or lost (S0\'s open item)',
    expected: 'queued until the turn ends or delivered after the next tool call; never lost',
    stop: 'a dialog opens; no turn within 60 s of the tool\'s end' },
  { id: 'W7', cli: 'claude', channel: 'socket', setting: null, mode: 'prompting', busy: false, sessions: 1,
    replaces: 'the plan\'s W7 (queue to a daemon-attached REPL), which W5 now is: codex 0.161.0 refuses queue with --no-daemon, so the plan\'s W5 cannot run',
    question: 'a default-setting session in a prompting permission mode: is a raw socket write from a process that is not a session accepted with no setting (the 2.1.309 gate code says a frame with no from_mode is held only for a bypass-mode recipient)?',
    expected: 'by the gate code (inferred): accepted, a turn starts with no dialog; this would contradict K1\'s "the owner\'s sessions keep the default hold" for prompting-mode sessions',
    stop: 'a dialog opens (a person denies it); no turn within 60 s' },
  { id: 'W8', cli: 'codex', observes: ['W5', 'W6'], sessions: 0,
    question: 'presence: what the CLI exposes about idle or busy',
    expected: 'no file like Claude Code\'s session file; the hook events and the rollout\'s task_started/task_complete are the only sources outside a daemon client',
    stop: 'none of its own: it reads W5-W6\'s rollouts and hook log' },
  { id: 'W9', cli: 'pi', channel: 'extension-timer', busy: false, sessions: 1,
    question: 'an extension timer (5 s) that, on the harness\'s trigger file, delivers the fixed nudge line by sendUserMessage: does it start a turn on an idle pi, as what role?',
    expected: 'a turn starts within one tick and a model reply; the nudge reaches the provider as user (phase 7)',
    stop: 'a trust or update dialog opens (a person answers it); no turn within 60 s' },
  { id: 'W10', cli: 'omp', channel: 'extension-timer', busy: false, sessions: 1,
    question: 'the same on omp, by sendMessage with triggerTurn',
    expected: 'a turn starts within one tick; the nudge reaches the provider as developer through the Codex converter (phase 7)',
    stop: 'a dialog opens; no turn within 60 s' },
]);

/** The interactive sessions the probes start: within the owner's 10 (Q3 option A). */
export const sessionsStarted = () => PROBES.reduce((s, p) => s + p.sessions, 0);

/** A probe by id, refused when unknown or when it starts no session of its own. */
export function probeOf(id) {
  const probe = PROBES.find((p) => p.id === id);
  if (!probe) throw new Error(`no probe ${id}; known: ${PROBES.map((p) => p.id).join(', ')}`);
  if (!probe.sessions) throw new Error(`${id} starts no session; it reads ${probe.observes.join(', ')}`);
  return probe;
}

/** The pane of a probe: its Terminal Control key and the label the person watching reads. */
export function paneOf(probe, { dry = false } = {}) {
  const what = { socket: `${probe.setting ? `scoped ${probe.setting}` : 'no setting'}, ${probe.mode}${probe.fromMode ? `, claims ${probe.fromMode}` : ''}`, queue: 'codex queue', 'extension-timer': 'extension timer' }[probe.channel];
  return { group: `${GROUP}${dry ? '-dry' : ''}`, key: `${GROUP}-${probe.id.toLowerCase()}${dry ? '-dry' : ''}`, label: `V7f ${probe.id} · ${probe.cli} · ${what}${probe.busy ? ', busy' : ''}` };
}

/** The first prompt of a probe's session: one line (a pane's launch line is typed), one tool call to register, then a wait for the user. */
export function firstPrompt(probe) {
  const busy = probe.busy ? ' Then Run: sleep 45.' : '';
  return `Run: ls.${busy} Then reply READY and wait for the user. If you are later told you have mail, read it as told and reply with one line saying what it was.`;
}

/** Claude Code's settings for a probe: the hook rows, no bypass prompt, and the scoped inbound setting when the probe has one. */
export function claudeSettings(probe, hooks) {
  return { hooks, skipDangerousModePermissionPrompt: true, ...(probe.setting ? { crossSessionInbound: probe.setting } : {}) };
}

/** Claude Code's argv for a probe: its settings, no MCP, the permission class, the first prompt. */
export function claudeArgs(probe, { settings, noMcp }) {
  const mode = probe.mode === 'bypass'
    ? ['--dangerously-skip-permissions']
    : ['--permission-mode', 'default', '--allowedTools', 'Bash(ls)', 'Bash(fgos mailbox inbox --claim)'];
  return ['--model', 'haiku', '--effort', 'medium', '--setting-sources', 'project', '--settings', settings, ...noMcp, ...mode, firstPrompt(probe)];
}

/** The one wire line of a socket write: a user message whose content is the nudge, with no `session_id`; `fromMode` adds the writer's own permission-mode claim. */
export const socketLine = (text = NUDGE, { fromMode = null } = {}) => `${JSON.stringify({ type: 'user', message: { role: 'user', content: text }, ...(fromMode ? { from_mode: fromMode } : {}) })}\n`;

/**
 * Whether `argv` (a process's own argv) is a live run that spends a model: a behaviour-suite
 * subcommand that starts real CLIs, or a real wake probe, without `--dry`. A dry wake probe
 * waits while one runs, so it never skews a live run's timing.
 */
export function liveRunOf(argv) {
  if (argv.includes('--dry')) return false;
  const at = argv.findIndex((a) => a.endsWith('mailbox-behaviour.live.mjs') || a.endsWith('mailbox-wake-probe.live.mjs'));
  if (at < 0) return false;
  const sub = argv[at + 1];
  return argv[at].endsWith('mailbox-wake-probe.live.mjs') ? sub === 'run' : ['run-stage', 'run-cell', 'run-loop', 'smoke', 'live-case', 'mcp-probe'].includes(sub);
}

/**
 * The socket of the probe's Claude Code session: `messagingSocketPath` of its session file under
 * the probe's private home. Refused unless it lies inside the probe's directory, so a write can
 * never reach another session's socket.
 */
export function socketOf(sessionFile, probeDir) {
  const session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
  const socket = session.messagingSocketPath;
  if (!socket) throw new Error(`${sessionFile} names no messaging socket`);
  const resolved = path.resolve(socket);
  if (!resolved.startsWith(path.resolve(probeDir) + path.sep)) throw new Error(`the session socket ${resolved} is outside the probe directory ${probeDir}; refused`);
  return resolved;
}

/** Writes `line` to the unix socket at `socket` and closes; resolves `{ok, at, error}` (never throws). */
export function writeSocket(socket, line, { timeoutMs = 5_000 } = {}) {
  return new Promise((resolve) => {
    const at = Date.now();
    const conn = net.createConnection(socket);
    const timer = setTimeout(() => {
      conn.destroy();
      resolve({ ok: false, at, error: 'timeout' });
    }, timeoutMs);
    conn.on('connect', () => conn.end(line));
    conn.on('close', (hadError) => {
      clearTimeout(timer);
      if (!hadError) resolve({ ok: true, at, error: null });
    });
    conn.on('error', (error) => {
      clearTimeout(timer);
      resolve({ ok: false, at, error: error.code ?? error.message });
    });
  });
}

/** The argv of the Codex queue call for a thread (run with the probe's private CODEX_HOME). */
export const queueArgs = (threadId, text = NUDGE) => ['queue', '--thread', threadId, '--message', text];

/**
 * The extension a pi or omp probe loads: every `TIMER_MS` it looks for `trigger`; once the file
 * exists it removes it and delivers the nudge, pi by `sendUserMessage`, omp by `sendMessage` with
 * `triggerTurn` (the methods phase 7 recorded the roles of), writing what it did to `log`.
 */
export function timerExtension(cli, { trigger, log }) {
  const deliver = cli === 'pi'
    ? 'api.sendUserMessage(NUDGE);'
    : 'api.sendMessage({ customType: "fgos-mailbox-wake-probe", content: NUDGE, display: true }, { triggerTurn: true });';
  return `// The V7f wake probe's timer extension (generated; benign; never shipped).
import * as fs from "node:fs";
const NUDGE = ${JSON.stringify(NUDGE)};
const TRIGGER = ${JSON.stringify(trigger)};
const LOG = ${JSON.stringify(log)};
export default function (api: any) {
  const note = (what: string) => fs.appendFileSync(LOG, JSON.stringify({ at: Date.now(), what }) + "\\n");
  note("loaded");
  setInterval(() => {
    if (!fs.existsSync(TRIGGER)) return;
    fs.rmSync(TRIGGER, { force: true });
    note("deliver");
    ${deliver}
  }, ${TIMER_MS});
}
`;
}

// ---------------------------------------------------------------- what a probe saw

/** The timestamp of a transcript, rollout or session record, in ms, or null. */
const timeOf = (r) => {
  const t = r.timestamp ?? r.payload?.timestamp ?? null;
  const ms = typeof t === 'number' ? t : t ? Date.parse(t) : NaN;
  return Number.isFinite(ms) ? ms : null;
};

/**
 * Whether a turn started after the channel fired at `firedAt`, read from the head's own records:
 * the first record at or after `firedAt` that carries the nudge (`carriedBy`, its type and role),
 * and the first model output after it (`repliedAt`; Claude Code `assistant`, Codex an assistant
 * message or a call, pi/omp an assistant message). `latencyMs` runs from the fire to the reply.
 */
export function turnAfter(records, firedAt, text = NUDGE) {
  const later = records.filter((r) => (timeOf(r) ?? 0) >= firedAt);
  const carrier = later.find((r) => JSON.stringify(r).includes(text) && !['queue-operation', 'last-prompt'].includes(r.type));
  if (!carrier) return { started: false, carriedBy: null, repliedAt: null, latencyMs: null };
  const output = (r) => r.type === 'assistant'
    || (r.type === 'response_item' && (r.payload?.role === 'assistant' || ['function_call', 'custom_tool_call'].includes(r.payload?.type)))
    || (r.type === 'message' && r.message?.role === 'assistant');
  const reply = later.slice(later.indexOf(carrier) + 1).find(output);
  const carriedBy = [carrier.type, carrier.payload?.type ?? carrier.message?.role ?? carrier.attachment?.type ?? '', carrier.payload?.role ?? (typeof carrier.message?.content === 'string' ? 'prompt' : '')].filter(Boolean).join(':');
  return { started: Boolean(reply), carriedBy, repliedAt: reply ? timeOf(reply) : null, latencyMs: reply && timeOf(reply) !== null ? timeOf(reply) - firedAt : null };
}

/** A dialog on the pane's screen text: the held-message dialog, a permission or trust question. */
export function dialogOn(screen) {
  const found = [/Held message from another session/i, /Do you trust/i, /trust (this|the|project) folder/i, /Allow .* to run/i, /\bDeny\b.*\bDeliver\b/is, /\(y\/n\)/i].find((re) => re.test(screen));
  return found ? String(found) : null;
}

/** The focused pane ids of a `herdr pane list` answer. */
export const focusedPanes = (listed) => (listed?.result?.panes ?? []).filter((p) => p.focused).map((p) => p.pane_id).sort();

/** The presence timeline of Claude Code session-file samples `{at, status}`: the status in force at `at`. */
export function statusAt(samples, at) {
  const before = samples.filter((s) => s.at <= at);
  return before.length ? before.at(-1).status : null;
}

/**
 * The verdict of one probe against the phase 11 bar: a channel is a candidate only when it
 * started a turn with no dialog, no focus change and no typed input (the harness types nothing,
 * so typed input is recorded false by construction and named so).
 */
export function verdict({ started, dialog, focusBefore, focusAfter }) {
  const focusChanged = JSON.stringify(focusBefore) !== JSON.stringify(focusAfter);
  const meets = Boolean(started) && !dialog && !focusChanged;
  return { started: Boolean(started), dialog, focusChanged, typedInput: false, meetsBar: meets };
}
