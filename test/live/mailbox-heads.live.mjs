/**
 * Live head-to-head mailbox suite. Opt in with FGOS_LIVE_HEADS=1.
 *
 * Cases:
 *   1. every persona with a live head sends (with --wake) to a peer it may reach; the send answer names its path
 *      (one of local-pushed, local-typed, local-next-tool-call, remote-recorded) and the peer reads the mail
 *   2. an idle head of each drained CLI (claude, codex, agy) is woken within the bound by a send with --wake: the
 *      path is local-pushed or local-typed, the RUN-tagged token or a new wake label appears on the recipient
 *      screen after the send, and the pane focus is unchanged
 *   3. a head with a half-typed composer is not typed into: the answer is local-next-tool-call and says the composer
 *      is not empty (the draft is left with `herdr pane send-text`, which does not submit). A recipient on a push
 *      channel, a dropped wake or a busy recipient is skipped by name, never passed
 *   4. one cross-machine send answers remote-recorded (gated on FGOS_LIVE_HEADS_REMOTE_PEER); the read on the other
 *      machine is the manual step in reports/integration.md
 *
 * Runs against live heads already on this machine, of THIS project only, with liveness `alive` only (starts no
 * heads, stops none, never drives a head of another project or the caller's own pane). Panes are driven with herdr
 * directly: a command is typed with `herdr pane send-text` (no submit), seen in the composer, then submitted with a separate
 * `herdr pane send-keys <pane> enter`. `herdr agent prompt` is not used for commands. `fgos session type` is not
 * used: it refuses unless a supervision event names the session and it never leaves a draft.
 *
 * Panes are addressed by `ids.terminal.paneId` (the id herdr itself knows, from HERDR_PANE_ID), never by
 * `ids.terminal.key`: the key is the run supervisor slot key (cmd_...), which only terminal-control resolves to a
 * pane; herdr answers agent_not_found / pane_not_found for it. The host typed wake resolves the key itself.
 *
 * Skipped unless it can actually drive live sessions (herdr on PATH, writable state directory, a host or npm).
 *
 *   FGOS_LIVE_HEADS=1 node --test test/live/mailbox-heads.live.mjs
 *   FGOS_LIVE_HEADS_REMOTE_PEER=<role@machine>   optional, enables the cross-machine case
 *   FGOS_LIVE_HEADS_BOUND_MS=<ms>                wake bound, from the moment the sender reported its path (default 20000)
 *   FGOS_LIVE_HEADS_IDLE_MS=<ms>                 wait for a head to be idle before typing into it (default 300000)
 *   FGOS_LIVE_HEADS_SEND_MS=<ms>                 wait for a live sender to run the typed send and print its path (default 120000)
 *   FGOS_LIVE_HEADS_EXCLUDE_PANES=<p1,p2>        panes never typed into (besides HERDR_PANE_ID and this plan lead)
 *   FGOS_HOST_BIN=<path>                         host binary (replaces npm run fgos:dev)
 *   FGOS_DIR=<path>                              project root (default derived from git-common-dir)
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function deriveMainCheckout(repoRoot) {
  try {
    const res = spawnSync('git', ['-C', repoRoot, 'rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8' });
    if (res.status === 0 && res.stdout.trim()) return path.dirname(res.stdout.trim());
  } catch { /* fall through to the checkout itself */ }
  return repoRoot;
}

const FGOS_DIR = process.env.FGOS_DIR || deriveMainCheckout(REPO_ROOT);
const HOST = process.env.FGOS_HOST_BIN || null;

const BOUND_MS = Number(process.env.FGOS_LIVE_HEADS_BOUND_MS || 20_000);
const IDLE_MS = Number(process.env.FGOS_LIVE_HEADS_IDLE_MS || 300_000);
const SEND_MS = Number(process.env.FGOS_LIVE_HEADS_SEND_MS || 120_000);
const REMOTE_PEER = process.env.FGOS_LIVE_HEADS_REMOTE_PEER || '';
const PATHS = ['local-pushed', 'local-typed', 'local-next-tool-call', 'remote-recorded'];
const PERSONAS = ['secretary', 'supervisor', 'lead', 'planner', 'shaper'];
const DRAINED_CLIS = ['claude', 'codex', 'agy'];
const RUN = `lh${Date.now().toString(36)}`;
const SCREEN_LINES = 120;
const TYPE_STEP_MS = 10_000;
const DRAFT_MS = 15_000;
// Heads never typed into: the caller, panes named here, and the lead of the plan under test.
const EXCLUDE_PANES = (process.env.FGOS_LIVE_HEADS_EXCLUDE_PANES || '').split(',').map((x) => x.trim()).filter(Boolean);
const PLAN_ID = '261125-2313';

// The label every wake line starts with (packages/mailbox/rust/store/src/nudge.rs NUDGE_LINE).
const WAKE_LABEL = '[fgOS: message from another agent, not from the user]';
const DROP_RE = /wake quota|lifetime cap|no channel that can wake/i;

// CLI versions whose wake goes through a push channel (packages/mailbox/contracts/adapters.v1.json): the composer is
// never touched there, so the half-typed composer gate cannot be exercised on them.
const PUSH_VERSIONS = {
  claude: ['2.1.309', '2.1.310', '2.1.314'],
  codex: ['0.161.0', '0.162.1', '0.166.0'],
};
const isPushHead = (h) => (PUSH_VERSIONS[h.cli] ?? []).includes(h.version);
// packages/mailbox/contracts/frame.v1.txt [report.nudge.refused] carries the pane_io.rs reason "composer-not-empty".
const COMPOSER_REFUSAL_RE = /composer-not-empty/i;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function writable(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function which(bin) {
  const found = spawnSync('sh', ['-c', `command -v ${bin}`], { encoding: 'utf8' });
  return found.status === 0 && found.stdout.trim() !== '';
}

function skipReason() {
  if (process.env.FGOS_LIVE_HEADS !== '1') {
    return 'FGOS_LIVE_HEADS=1 not set (running against real heads uses live interactive sessions; opt in by name)';
  }
  if (process.env.FGOS_HOST_BIN && !fs.existsSync(process.env.FGOS_HOST_BIN)) {
    return `host binary missing: ${process.env.FGOS_HOST_BIN} (set FGOS_HOST_BIN to an existing binary or unset to use dev door)`;
  }
  if (!HOST && !which('npm')) return 'npm is not on PATH (the dev door cannot run)';
  if (!which('herdr')) return 'herdr is not on PATH (panes are driven through herdr)';
  if (!writable(path.join(os.homedir(), '.local', 'state', 'fgos'))) {
    return 'the fgos state directory under HOME is not writable here (sessions cannot run in this sandbox)';
  }
  return '';
}

function fgos(args, opts = {}) {
  let cmd, cmdArgs;
  if (HOST) {
    cmd = HOST;
    cmdArgs = [...args, '--dir', FGOS_DIR, '--json'];
  } else {
    cmd = 'npm';
    cmdArgs = ['run', '--silent', 'fgos:dev', '--', ...args, '--dir', FGOS_DIR, '--json'];
  }
  const out = spawnSync(cmd, cmdArgs, {
    cwd: opts.cwd ?? REPO_ROOT,
    encoding: 'utf8',
    timeout: opts.timeout ?? 60_000,
    env: { ...process.env, ...(opts.env ?? {}) },
  });
  let data = null;
  try {
    data = JSON.parse(out.stdout);
  } catch { /* non-JSON answer: callers assert on status and stderr */ }
  return { status: out.status, data, stdout: out.stdout, stderr: out.stderr };
}

const HAS_JQ = which('jq');

// ---- herdr drivers -------------------------------------------------------------------------------------------

/** Types the text into the pane's composer without submitting: leaves a draft. */
function herdrPaneSendText(pane, text) {
  const res = spawnSync('herdr', ['pane', 'send-text', pane, text], { encoding: 'utf8', timeout: 30_000 });
  return { status: res.status, stdout: res.stdout, stderr: res.stderr };
}

/**
 * Erases a draft. herdr does not document its backspace key name, so the forms are tried in order and the screen is
 * polled after each; stops at the first form that removes the draft token. Returns the form that worked, or null when
 * none did (the caller fails loudly). A herdr refusal of one form moves on to the next.
 */
async function eraseDraft(pane, draft) {
  const CHUNK = 64;
  const sendKeys = (keys) => spawnSync('herdr', ['pane', 'send-keys', pane, ...keys], { encoding: 'utf8', timeout: 15_000 });
  const repeated = (key, n) => {
    for (let left = n; left > 0; left -= CHUNK) sendKeys(Array(Math.min(CHUNK, left)).fill(key));
  };
  const gone = async () => Boolean(await waitFor(() => !readScreen({ pane }).includes(draft), 3_000));
  const count = draft.length + 8;
  const attempts = [
    ['ctrl+u', () => { sendKeys(['ctrl+u']); }],
    ['end+backspace', () => { sendKeys(['end']); repeated('backspace', count); }],
    ['end+Backspace', () => { sendKeys(['end']); repeated('Backspace', count); }],
    ['end+BSpace', () => { sendKeys(['end']); repeated('BSpace', count); }],
  ];
  for (const [form, run] of attempts) {
    run();
    if (await gone()) return form;
  }
  return null;
}

/** The agent state herdr reports for the pane ('idle', 'done', 'busy', ...) or null when the shape is unknown. */
function herdrAgentState(pane) {
  const res = spawnSync('herdr', ['agent', 'get', pane], { encoding: 'utf8', timeout: 15_000 });
  if (res.status !== 0 || !res.stdout) return null;
  try {
    const d = JSON.parse(res.stdout);
    const node = d?.result?.agent ?? d?.agent ?? d?.result ?? d?.data ?? d;
    const st = node?.state ?? node?.status ?? node?.agent_state ?? null;
    return typeof st === 'string' ? st.toLowerCase() : null;
  } catch {
    const m = res.stdout.match(/\b(idle|done|busy|working|blocked)\b/i);
    return m ? m[1].toLowerCase() : null;
  }
}
const isIdleState = (st) => st === 'idle' || st === 'done';

/** Waits up to IDLE_MS for the head to be idle (an unknown state counts as idle); false when it never is. */
async function waitIdle(head) {
  return Boolean(await waitFor(() => {
    const st = herdrAgentState(head.pane);
    return st === null || isIdleState(st);
  }, IDLE_MS));
}

function readScreen(head, lines = SCREEN_LINES) {
  const res = spawnSync('herdr', ['pane', 'read', head.pane, '--lines', String(lines)], { encoding: 'utf8', timeout: 15_000 });
  return res.status === 0 ? (res.stdout ?? '') : '';
}

/** The last `n` non-empty lines of the pane screen, for assertion messages. */
function screenTail(head, n = 15) {
  return readScreen(head).split('\n').filter((l) => l.trim() !== '').slice(-n).join('\n');
}

/**
 * Types `command` into a head and submits it; the one helper every test uses. send-text leaves it in the composer
 * (no submit); we poll until `marker` shows on the screen, then send Enter as its own call. Submission is proved by
 * any of: herdr reports the agent busy, the marker occurs more often than before Enter (the command is echoed into
 * the transcript), or the screen changed and the marker is gone from the last 6 non-empty lines (the composer
 * region, which now is empty). A screen that is unchanged with the marker still last means Enter was not taken, so
 * Enter is sent once more. Throws with the last 15 screen lines when the command never shows or never submits.
 */
async function typeCommand(head, command, marker) {
  const typed = herdrPaneSendText(head.pane, command);
  if (typed.status !== 0) throw new Error(`herdr pane send-text into pane ${head.pane} (${label(head)}) failed: ${typed.stderr || typed.stdout}`);
  const shown = await waitFor(() => readScreen(head).includes(marker), TYPE_STEP_MS);
  if (!shown) throw new Error(`${label(head)} (pane ${head.pane}): ${marker} never showed in the composer within ${TYPE_STEP_MS} ms after send-text. Last 15 screen lines:\n${screenTail(head)}`);

  const before = readScreen(head);
  const countBefore = countOf(before, marker);
  const submitted = () => {
    const st = herdrAgentState(head.pane);
    if (st !== null && !isIdleState(st)) return true;
    const now = readScreen(head);
    if (countOf(now, marker) > countBefore) return true;
    const lastLines = now.split('\n').filter((l) => l.trim() !== '').slice(-6).join('\n');
    return now !== before && !lastLines.includes(marker);
  };
  for (let attempt = 1; attempt <= 2; attempt++) {
    const enter = spawnSync('herdr', ['pane', 'send-keys', head.pane, 'enter'], { encoding: 'utf8', timeout: 15_000 });
    if (enter.status !== 0) throw new Error(`herdr pane send-keys enter into pane ${head.pane} (${label(head)}) failed: ${enter.stderr || enter.stdout}`);
    if (await waitFor(submitted, TYPE_STEP_MS)) return;
  }
  throw new Error(`${label(head)} (pane ${head.pane}): Enter did not submit ${marker} (sent twice, 10 s each). Last 15 screen lines:\n${screenTail(head)}`);
}

/** The focused pane id from `herdr pane list`, or null when herdr does not say. */
function queryFocusedPane() {
  const res = spawnSync('herdr', ['pane', 'list'], { encoding: 'utf8' });
  if (res.status !== 0 || !res.stdout) return null;
  try {
    const data = JSON.parse(res.stdout);
    const panes = data?.result?.panes || data?.panes || data?.data?.panes || (Array.isArray(data) ? data : null);
    if (!Array.isArray(panes)) return null;
    for (const p of panes) {
      if (p && typeof p === 'object' && (p.focused === true || p.is_focused === true || p.active === true)) {
        return p.pane_id ?? p.id ?? p.key ?? p.terminal_id ?? null;
      }
    }
  } catch { /* unreadable list: focus is a manual check */ }
  return null;
}

async function waitFor(check, bound) {
  const t0 = Date.now();
  while (Date.now() - t0 < bound) {
    const value = await check();
    if (value) return { value, ms: Date.now() - t0 };
    await sleep(500);
  }
  return null;
}

const countOf = (text, needle) => (needle ? text.split(needle).length - 1 : 0);

// ---- discovery (this project, alive only, never the caller's own pane) ----------------------------------------

let projectIdCache;
function thisProjectId() {
  if (projectIdCache === undefined) {
    const answer = fgos(['identity', 'project'], { cwd: FGOS_DIR });
    projectIdCache = answer.data?.data?.id ?? answer.data?.id ?? answer.data?.data?.projectId ?? null;
  }
  return projectIdCache;
}

// Heads that failed to run a typed command: later cases skip them instead of waiting again.
const failedHeads = new Set();

function personaOf(s) {
  const fromIds = s.ids?.head?.persona;
  if (fromIds && PERSONAS.includes(fromIds)) return fromIds;
  for (const role of s.roles ?? []) {
    for (const p of PERSONAS) {
      if (role === `head:${p}` || role.startsWith(`head:${p}-`) || role.startsWith(`head:${p}:`)) return p;
    }
    if (role.startsWith('lead:')) return 'lead';
  }
  return null;
}

/** Every alive head of this project that has a pane and is not the caller's own. */
function discoverLiveHeads(t) {
  const projectId = thisProjectId();
  if (!projectId) return [];
  const answer = fgos(['identity', 'list', '--project'], { cwd: FGOS_DIR });
  const sessions = answer.data?.data?.sessions ?? answer.data?.sessions ?? [];
  const own = process.env.HERDR_PANE_ID || '';
  const heads = [];
  const excluded = new Set(EXCLUDE_PANES);
  for (const s of sessions) {
    if (s.liveness !== 'alive') continue;
    if (s.projectId !== projectId) continue;
    const persona = personaOf(s);
    if (!persona) continue;
    const pane = s.ids?.terminal?.paneId ?? null;
    if (!pane) {
      t?.diagnostic(`${persona}(${s.handle || s.ids?.mailbox?.name || s.id}) has no herdr pane id: skipped by name`);
      continue;
    }
    if (own && pane === own) continue;
    if (excluded.has(pane)) {
      t?.diagnostic(`${persona}(${s.handle || pane}) pane ${pane} is in FGOS_LIVE_HEADS_EXCLUDE_PANES: excluded`);
      continue;
    }
    if ((s.roles ?? []).some((r) => r.startsWith('head:lead-') && r.includes(PLAN_ID))) {
      t?.diagnostic(`${persona}(${s.handle || pane}) pane ${pane} is the lead of plan ${PLAN_ID} under test: excluded`);
      continue;
    }
    if (failedHeads.has(s.id)) {
      t?.diagnostic(`${persona}(${s.handle || pane}) pane ${pane} already failed an earlier case: skipped`);
      continue;
    }
    heads.push({
      persona,
      pane,
      shortName: s.ids?.mailbox?.name || null,
      handle: s.handle || null,
      role: s.roles?.[0] || null,
      cli: s.cli,
      version: s.cliVersion ?? s.version ?? s.ids?.cli?.version ?? null,
      roles: s.roles ?? [],
      id: s.id,
    });
  }
  return heads;
}

const label = (h) => `${h.persona}(${h.handle || h.shortName || h.pane})`;
const isSecSup = (h) => h.persona === 'secretary' || h.persona === 'supervisor';
const pairKey = (a, b) => [a.id, b.id].sort().join('|');
const usedPairs = new Set();

/** The `--to` value for a send from `sender` to `peer`, or null when none is allowed. */
function recipientFor(sender, peer) {
  if (sender.persona === 'lead' || sender.persona === 'planner') {
    return peer.roles.find((r) => /^head:(secretary|supervisor)-/.test(r)) ?? null;
  }
  return peer.shortName || peer.handle || peer.role || null;
}

function allowedPeerPersonas(persona) {
  if (persona === 'lead' || persona === 'planner') return ['secretary', 'supervisor'];
  if (persona === 'shaper') return ['secretary', 'supervisor', 'lead', 'planner'];
  return PERSONAS;
}

// ---- send through a head and read its answer -----------------------------------------------------------------

/** The prompt that makes `sender` run the send and print only the path (and a drop flag) behind the token. */
function sendCommand(to, token) {
  const base = `fgos mailbox send --wake --to ${to} ${token} --json`;
  if (!HAS_JQ) return `Run exactly this command and show its output: ${base}`;
  const program = `"${token}-path=" + (.data.path // .path // "none") + " ${token}-drop=" + (((.data.text // .text // "") | test("wake quota|lifetime cap|no channel")) | tostring) + " ${token}-composer=" + (((.data.text // .text // "") | test("composer-not-empty")) | tostring)`;
  return `Run exactly this command and show its output: ${base} | jq -r '${program}'`;
}

function parseAnswer(screen, token) {
  const marked = screen.match(new RegExp(`${token}-path=([a-z-]+)(?:\\s+${token}-drop=(true|false))?(?:\\s+${token}-composer=(true|false))?`));
  if (marked && PATHS.includes(marked[1])) {
    return { path: marked[1], dropped: marked[2] === 'true', composerRefused: marked[3] === 'true', text: '' };
  }
  const idx = screen.lastIndexOf(token);
  if (idx === -1) return null;
  const after = screen.slice(idx + token.length);
  const json = after.match(/"path"\s*:\s*"(local-pushed|local-typed|local-next-tool-call|remote-recorded)"/);
  if (!json) return null;
  return { path: json[1], dropped: DROP_RE.test(after), composerRefused: COMPOSER_REFUSAL_RE.test(after), text: after };
}

/**
 * Has an idle `sender` send `token` to `to` with --wake; resolves to the parsed answer. Throws, with the last 15
 * screen lines, when the command is not submitted or the sender reports no path within SEND_MS, and marks the head
 * failed so no later case waits on it again.
 */
async function sendThrough(sender, to, token) {
  try {
    await typeCommand(sender, sendCommand(to, token), token);
  } catch (err) {
    failedHeads.add(sender.id);
    throw err;
  }
  const got = await waitFor(() => parseAnswer(readScreen(sender), token), SEND_MS);
  if (!got) {
    failedHeads.add(sender.id);
    throw new Error(`sender ${label(sender)} did not report a send path for ${token} within ${SEND_MS} ms (pane ${sender.pane}). Last 15 screen lines:\n${screenTail(sender)}`);
  }
  return got.value;
}

const reason = skipReason();
const opts = reason ? { skip: reason } : {};
if (reason) process.stdout.write(`mailbox-heads.live: SKIPPED, not run here: ${reason}\n`);

test('every persona sends to a peer it may reach and the peer reads the mail from its inbox', opts, async (t) => {
  const heads = discoverLiveHeads(t);
  if (heads.length === 0) {
    t.skip('no alive head of this project with a pane (or the project id is unreadable)');
    return;
  }
  let testedPairs = 0;

  for (const persona of PERSONAS) {
    const sender = heads.find((h) => h.persona === persona);
    if (!sender) {
      t.diagnostic(`persona ${persona} has no live head on this machine: skipped`);
      continue;
    }
    const peerPersonas = allowedPeerPersonas(persona);
    const peer = heads.find((h) => h.id !== sender.id && peerPersonas.includes(h.persona) && recipientFor(sender, h));
    if (!peer) {
      t.diagnostic(`persona ${persona} has no live allowed peer on this machine: skipped`);
      continue;
    }
    const to = recipientFor(sender, peer);
    const token = `${RUN}-t1-${persona}`;
    usedPairs.add(pairKey(sender, peer));

    if (!(await waitIdle(sender))) {
      t.diagnostic(`sender ${label(sender)} was never idle within ${IDLE_MS} ms: skipped by name`);
      continue;
    }
    const answer = await sendThrough(sender, to, token);
    assert.ok(answer, `sender ${label(sender)} did not report a send path for ${token} within ${SEND_MS} ms`);
    assert.ok(PATHS.includes(answer.path), `send path must be one of ${PATHS.join(', ')}, got ${answer.path}`);

    // A --wake send may leave the peer busy reading; wait for idle, or accept the token already on its screen.
    if (!readScreen(peer).includes(token) && !(await waitIdle(peer))) {
      t.diagnostic(`recipient ${label(peer)} was never idle within ${IDLE_MS} ms: its inbox read skipped by name`);
      continue;
    }
    try {
      await typeCommand(peer, 'Run exactly this command and show its output: fgos mailbox inbox', 'fgos mailbox inbox');
    } catch (err) {
      failedHeads.add(peer.id);
      throw err;
    }
    const seen = await waitFor(() => readScreen(peer).includes(token), SEND_MS);
    assert.ok(seen, `peer ${label(peer)} did not show ${token} from its inbox within ${SEND_MS} ms`);
    testedPairs++;
  }

  if (testedPairs === 0) t.skip('no persona pair was live on this machine; every persona reported skipped by name');
});

test('an idle head of each drained CLI is woken within the bound and the focus is unchanged', opts, async (t) => {
  const heads = discoverLiveHeads(t);
  if (heads.length === 0) {
    t.skip('no alive head of this project with a pane (or the project id is unreadable)');
    return;
  }
  let tested = 0;

  for (const cli of DRAINED_CLIS) {
    const targets = heads.filter((h) => h.cli === cli);
    if (targets.length === 0) {
      t.diagnostic(`no live idle head of CLI ${cli} on this machine: skipped`);
      continue;
    }
    // Only a secretary or supervisor may send to any head; prefer a pair test 1 did not spend wakes on.
    let chosen = null;
    for (const target of targets) {
      for (const sender of heads.filter((h) => isSecSup(h) && h.id !== target.id)) {
        const to = recipientFor(sender, target);
        if (!to) continue;
        const fresh = !usedPairs.has(pairKey(sender, target));
        if (!chosen || (fresh && !chosen.fresh)) chosen = { sender, target, to, fresh };
        if (fresh) break;
      }
      if (chosen?.fresh) break;
    }
    if (!chosen) {
      t.diagnostic(`CLI ${cli} has live heads but no secretary/supervisor sender that may reach one: skipped`);
      continue;
    }
    const { sender, target, to } = chosen;
    if (!chosen.fresh) {
      t.diagnostic(`CLI ${cli}: the only pair ${label(sender)} -> ${label(target)} already used its wake allowance in case 1; a dropped wake will be reported by name`);
    }
    usedPairs.add(pairKey(sender, target));

    const targetState = herdrAgentState(target.pane);
    if (targetState !== null && !isIdleState(targetState)) {
      t.diagnostic(`CLI ${cli}: ${label(target)} is ${targetState}, not idle: skipped by name`);
      continue;
    }

    if (!(await waitIdle(sender))) {
      t.diagnostic(`CLI ${cli}: sender ${label(sender)} was never idle within ${IDLE_MS} ms: skipped by name`);
      continue;
    }
    const token = `${RUN}-t2-${cli}`;
    const labelBefore = countOf(readScreen(target), WAKE_LABEL);
    const focusBefore = queryFocusedPane();

    const answer = await sendThrough(sender, to, token);
    assert.ok(answer, `sender ${label(sender)} did not report a send path for ${token} within ${SEND_MS} ms`);
    assert.ok(!answer.dropped, `the wake to ${label(target)} (${cli}) was dropped by the wake budget (path ${answer.path}); pick a pair with allowance left, this is not a failure to wake`);
    assert.ok(
      answer.path === 'local-pushed' || answer.path === 'local-typed',
      `a send with --wake to idle ${label(target)} (${cli}) must take a wake path (local-pushed or local-typed), got ${answer.path}`,
    );

    // The wake label is identical for every mail, so a label count rise alone can be another sender's wake: pass only
    // when the woken head shows the RUN token (it ran its inbox claim) after the sender reported its path.
    const woken = await waitFor(() => readScreen(target).includes(token), BOUND_MS);
    assert.ok(woken, `idle ${label(target)} (${cli}) was not woken within ${BOUND_MS} ms: ${token} did not appear on its screen (wake labels before/now: ${labelBefore}/${countOf(readScreen(target), WAKE_LABEL)})`);

    const focusAfter = queryFocusedPane();
    if (focusBefore !== null && focusAfter !== null) {
      assert.equal(focusAfter, focusBefore, `the wake of ${label(target)} moved the pane focus`);
    } else {
      t.diagnostic(`focus neutrality for ${cli} is a manual check (herdr pane list carried no focus field)`);
    }
    tested++;
  }

  if (tested === 0) t.skip('no drained CLI had a live idle head with a permitted sender on this machine');
});

test('a head with a half-typed composer is not typed into and the answer says so', opts, async (t) => {
  const heads = discoverLiveHeads(t);
  const focused = queryFocusedPane();
  if (focused === null) {
    t.skip('the focused pane is unreadable (herdr pane list carried no focus field): not risking the owner pane with a draft');
    return;
  }
  // Recipient: never a secretary (the owner front session), never the focused pane, never a push head (the composer
  // is not touched there), and idle only (a busy refusal would mask the composer gate).
  let pair = null;
  for (const sender of heads.filter(isSecSup)) {
    for (const h of heads) {
      if (h.id === sender.id || h.persona === 'secretary' || h.pane === focused) continue;
      if (!recipientFor(sender, h) || isPushHead(h)) continue;
      const st = herdrAgentState(h.pane);
      if (st !== null && !isIdleState(st)) continue;
      pair = { sender, recipient: h };
      break;
    }
    if (pair) break;
  }
  if (!pair) {
    t.skip('no idle, non-focused, non-secretary, non-push recipient with a secretary/supervisor sender on this machine');
    return;
  }
  const { sender, recipient } = pair;
  const to = recipientFor(sender, recipient);
  if (!(await waitIdle(sender))) {
    t.skip(`sender ${label(sender)} was never idle within ${IDLE_MS} ms: skipped by name`);
    return;
  }
  const draft = `${RUN}-t3-draft`;
  const token = `${RUN}-t3-mail`;

  const drafted = herdrPaneSendText(recipient.pane, draft);
  assert.equal(drafted.status, 0, `herdr pane send-text into pane ${recipient.pane} (${label(recipient)}) failed: ${drafted.stderr || drafted.stdout}`);
  try {
    const shown = await waitFor(() => readScreen(recipient).includes(draft), DRAFT_MS);
    assert.ok(shown, `${label(recipient)} did not show the draft ${draft} within ${DRAFT_MS} ms after send-text (pane ${recipient.pane}); the erase in finally still runs. Last 15 screen lines:\n${screenTail(recipient)}`);

    const answer = await sendThrough(sender, to, token);
    assert.ok(answer, `sender ${label(sender)} did not report a send path for ${token} within ${SEND_MS} ms`);
    assert.notEqual(answer.path, 'local-typed', 'the wake was typed into a half-typed composer; the answer must not say local-typed');
    if (answer.path === 'local-pushed') {
      t.skip(`${label(recipient)} answered local-pushed: a push channel never touches the composer, so the composer gate is not exercised`);
      return;
    }
    if (answer.dropped) {
      t.skip(`the wake to ${label(recipient)} was dropped by the wake budget: the composer gate is not exercised`);
      return;
    }
    assert.equal(answer.path, 'local-next-tool-call', `a half-typed composer must answer local-next-tool-call, got ${answer.path}`);
    assert.ok(answer.composerRefused, 'the send answer must say the nudge was refused because the composer is not empty (composer-not-empty); a busy or other refusal does not exercise the composer gate');

    const screen = readScreen(recipient);
    assert.ok(screen.includes(draft), `the draft ${draft} did not survive on the recipient screen`);
    assert.ok(!screen.includes(`${draft}${WAKE_LABEL}`), 'the wake label was typed after the draft in the composer');
  } finally {
    const form = await eraseDraft(recipient.pane, draft);
    if (form === null) {
      throw new Error(`no key form (ctrl+u, end+backspace, end+Backspace, end+BSpace) erased the draft ${draft} from the composer of pane ${recipient.pane} (${label(recipient)}); erase it by hand`);
    }
    t.diagnostic(`draft erased in pane ${recipient.pane} (${label(recipient)}) with key form ${form}`);
    assert.ok(!readScreen(recipient).includes(draft), `the composer of pane ${recipient.pane} (${label(recipient)}) still shows ${draft} after the erase`);
  }
});

test('one cross-machine send answers remote-recorded', {
  skip: reason || (REMOTE_PEER ? '' : 'FGOS_LIVE_HEADS_REMOTE_PEER not set: no second machine reachable (manual step in the integration report)'),
}, async (t) => {
  const sender = discoverLiveHeads(t).find(isSecSup);
  if (!sender) {
    t.skip('no live secretary/supervisor head with a pane to send cross-machine mail');
    return;
  }
  if (!(await waitIdle(sender))) {
    t.skip(`sender ${label(sender)} was never idle within ${IDLE_MS} ms: skipped by name`);
    return;
  }
  const token = `${RUN}-t4-remote`;
  const answer = await sendThrough(sender, REMOTE_PEER, token);
  assert.ok(answer, `cross-machine send did not report a path for ${token} within ${SEND_MS} ms`);
  assert.equal(answer.path, 'remote-recorded', `cross-machine send answered ${answer.path}`);
});
