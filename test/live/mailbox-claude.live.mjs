#!/usr/bin/env node
/**
 * test/live/mailbox-claude.live.mjs
 *
 * The mailbox live suite for Claude Code (docs/platform/agent-mailbox/spec.md
 * §11, §14 V4 row), through the test-only hook entry
 * `packages/mailbox/rust/store/examples/mailbox-test-hook.rs`. Chosen by
 * name, never part of `npm test` (which runs only `*.test.mjs`). Node
 * built-ins only; the run guards come from scripts/lib/mailbox-live-cli.mjs.
 *
 * Every real case spends the owner's model quota: one `claude -p` process.
 * There is no retry anywhere. Before it starts a real CLI the harness writes
 * `<case>/spawned.json` and it refuses a case that already has one, so the
 * count of spends is fixed; a failure before that point spends nothing.
 *
 * Subcommands
 *
 *   check
 *       No model call. Memory and process check, the tested versions, the
 *       managed-settings preflight, a release build of the example, the
 *       wrapper-wins check in the model's shell, and a dry run of every case
 *       against a stub CLI. Exit 3 on any failure.
 *   run <L1|L2|L3a|L3b> [--dry]
 *       One case. `--dry` runs it against the stub under `<base>-dry/`.
 *   report
 *       Prints every case's result.json summary.
 *   probe-hook <event> <ladder file> <state file>      (L3's hook command)
 *   stub-claude <claude argv>                           (the dry runs' CLI)
 *
 * Where: <base> is ${TMPDIR:-/tmp}/fgos-work/mailbox-v4-live, outside every
 * git checkout. Each case gets <case>/{ws,bin,log,zdot,.fgos}; the model's
 * working directory is ws/, the hook log lives in log/.
 *
 * Evidence: the transcript is primary (an injected frame is proven by its
 * record type and by the model's answer containing the nonce); the entry's
 * log and the snapshot corroborate. A check only the log supports says so.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as live from '../../scripts/lib/mailbox-live-cli.mjs';

const SCRIPT = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(SCRIPT), '..', '..');
const BASE = path.join(process.env.TMPDIR || '/tmp', 'fgos-work', 'mailbox-v4-live');
const CONTRACTS = path.join(REPO_ROOT, 'packages', 'mailbox', 'contracts');
const PROJECT = 'mbxlive';
/** Claude Code 2.1.308 runs a hook through one `sh` that does not exec it
 * (plans/reports/research-261022-1751-mailbox-v4-hook-process-probe.md). */
const TOPOLOGY = 'one-shell-hop';
const CASES = ['L1', 'L2', 'L3a', 'L3b'];
const MIN_FREE_GB = 8;
const WAIT_MS = 120_000;
const CODEX_BIN = path.join(os.homedir(), '.local', 'bin', 'codex');

function die(message, code = 3) {
  process.stderr.write(`mailbox-claude.live: ${message}\n`);
  process.exit(code);
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const nonce = () => crypto.randomBytes(4).toString('hex');

// ---------------------------------------------------------------- guards

function memAvailableGb() {
  const line = fs.readFileSync('/proc/meminfo', 'utf8').split('\n').find((l) => l.startsWith('MemAvailable:'));
  return Math.floor(Number(line.split(/\s+/)[1]) / 1024 / 1024);
}

/** Memory and the heavy-gate processes (the memory rule): refused below 8 GB
 * available, and, for a run that starts a real CLI, while a cargo test or npm
 * test runs on this machine. A dry run starts no model, so other sessions'
 * gates do not hold it back. */
function resourceProblem({ dry = false } = {}) {
  const free = memAvailableGb();
  if (free < MIN_FREE_GB) return `only ${free} GB available, need ${MIN_FREE_GB}`;
  if (dry) return null;
  const busy = heavyGates();
  if (busy.length) return `heavy gate running: ${busy.join(', ')}`;
  return null;
}

/** Pids of running heavy gates, by their own argv (never a shell whose text
 * merely mentions one): `cargo test`, `npm test`, `node …/run-tests.mjs`. */
function heavyGates() {
  const pids = [];
  for (const entry of fs.readdirSync('/proc')) {
    if (!/^\d+$/.test(entry)) continue;
    let argv;
    try {
      argv = fs.readFileSync(`/proc/${entry}/cmdline`, 'utf8').split('\0').filter(Boolean);
    } catch {
      continue;
    }
    const tool = path.basename(argv[0] ?? '');
    const gate = (tool === 'cargo' && argv[1] === 'test')
      || (tool === 'npm' && argv[1] === 'test')
      || (tool === 'node' && argv.some((a) => a.endsWith('scripts/run-tests.mjs')));
    if (gate) pids.push(entry);
  }
  return pids;
}

function testedVersions() {
  return readJson(path.join(CONTRACTS, 'adapters.v1.json')).testedAgainst;
}

function semver(text) {
  return /\d+\.\d+\.\d+/.exec(text || '')?.[0] ?? null;
}

function versionProblem(cli, version) {
  const listed = testedVersions().some((t) => t.cli === cli && t.version === version);
  return listed ? null : `${cli} ${version ?? '(unreadable)'} is not in testedAgainst`;
}

function cargoTargetDir() {
  const out = spawnSync('cargo', ['metadata', '--format-version', '1', '--no-deps'], { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (out.status !== 0) die('cargo metadata failed');
  return JSON.parse(out.stdout).target_directory;
}

/** The release-built example; built once by `check`. */
function examplePath() {
  return path.join(cargoTargetDir(), 'release', 'examples', 'mailbox-test-hook');
}

function buildExample() {
  const out = spawnSync('cargo', ['build', '--release', '-p', 'fgos-mailbox', '--example', 'mailbox-test-hook'], {
    cwd: REPO_ROOT,
    env: { ...process.env, CARGO_BUILD_JOBS: '4' },
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  if (out.status !== 0) die('the example did not build');
  return examplePath();
}

// ---------------------------------------------------------------- case layout

function caseDir(name, dry) {
  return path.join(dry ? `${BASE}-dry` : BASE, name);
}

/** The case's directories, its wrapper and its settings; refuses a real case that
 * already spent its run. */
function layOut(name, dry, example) {
  const dir = caseDir(name, dry);
  if (fs.existsSync(path.join(dir, 'spawned.json'))) die(`${name} already spawned a CLI (${dir}); a re-run needs the controller`);
  fs.rmSync(dir, { recursive: true, force: true });
  for (const sub of ['ws', 'bin', 'log', 'zdot', '.fgos']) fs.mkdirSync(path.join(dir, sub), { recursive: true });
  live.assertOutsideCheckout(path.join(dir, 'ws'));
  writeWrapper(dir, example);
  if (CASES.includes(name)) writeJson(path.join(dir, 'settings.json'), settingsFor(name, dir, example));
  return dir;
}

/** The test fixture `bin/fgos`: only `fgos mailbox send|inbox`, never an argument
 * that would redirect the example, every call logged. */
function writeWrapper(dir, example) {
  const log = path.join(dir, 'log', 'fgos-calls.log');
  const script = `#!/bin/sh
# Test fixture of the mailbox live suite, never a product door: only
# \`fgos mailbox send|inbox\`, run through the test-only example.
log='${log}'
if [ "$1" != mailbox ]; then echo "test fixture: only fgos mailbox send|inbox" >&2; printf 'argv: %s\\nexit: 2\\n' "$*" >>"$log"; exit 2; fi
shift
case "$1" in send|inbox) ;; *) echo "test fixture: only fgos mailbox send|inbox" >&2; printf 'argv: mailbox %s\\nexit: 2\\n' "$*" >>"$log"; exit 2;; esac
for a in "$@"; do
  case "$a" in --fgos-dir*|--log*|--fault*|--topology*) echo "test fixture: argument $a refused" >&2; printf 'argv: mailbox %s\\nexit: 2\\n' "$*" >>"$log"; exit 2;; esac
done
verb=$1; shift
out=$('${example}' "$verb" --fgos-dir '${path.join(dir, '.fgos')}' "$@" 2>&1); status=$?
printf 'argv: mailbox %s %s\\nexit: %s\\n%s\\n' "$verb" "$*" "$status" "$out" >>"$log"
printf '%s\\n' "$out"
exit $status
`;
  const file = path.join(dir, 'bin', 'fgos');
  fs.writeFileSync(file, script, { mode: 0o755 });
}

function hookCommand(example, event, dir) {
  return `'${example}' hook --cli claude --event ${event} --fgos-dir '${path.join(dir, '.fgos')}' --project ${PROJECT} --topology ${TOPOLOGY} --log '${path.join(dir, 'log', 'hook.log')}'`;
}

function probeCommand(event, dir) {
  return `node '${SCRIPT}' probe-hook ${event} '${path.join(dir, 'ladder.json')}' '${path.join(dir, 'log', 'probe-state.json')}'`;
}

function settingsFor(name, dir, example) {
  const entry = (command) => ({ type: 'command', command });
  const post = { matcher: '*', hooks: [entry(hookCommand(example, 'post-tool-use', dir))] };
  const stop = { hooks: [entry(hookCommand(example, 'stop', dir))] };
  switch (name) {
    case 'L1':
      return { hooks: { PostToolUse: [post], Stop: [stop] } };
    case 'L2':
      // Stop in a wrong shape: the entry flat, without the nested hooks array.
      return { hooks: { PostToolUse: [post], Stop: [entry(hookCommand(example, 'stop', dir))] } };
    case 'L3a':
      return { hooks: { PostToolUse: [{ matcher: '*', hooks: [entry(probeCommand('PostToolUse', dir))] }] } };
    case 'L3b':
      return { hooks: { Stop: [{ hooks: [entry(probeCommand('Stop', dir))] }] } };
    default:
      die(`unknown case ${name}`, 2);
  }
  return null;
}

/** The allowlisted environment of a case's CLI; a dry run's stub keeps its own HOME. */
function caseEnv(dir, dry) {
  return live.cliEnv({
    zdotdir: path.join(dir, 'zdot'),
    pathPrefix: path.join(dir, 'bin'),
    extra: dry ? { HOME: path.join(dir, 'home') } : {},
  });
}

// ---------------------------------------------------------------- prompts

const L1_TOOL1 = "type fgos > tool-fgos.txt; p=$$; for i in 1 2 3 4 5 6; do echo \"$p $(cat /proc/$p/comm)\"; p=$(cut -d' ' -f4 /proc/$p/stat); done > tool-proc.txt; env | cut -d= -f1 | sort > tool-env-names.txt; echo step1";
const L1_TOOL2 = 'sleep 25; fgos mailbox inbox';

const PROMPTS = {
  L1: `This is a test of a message hook. Do exactly these steps and nothing else.
1. Run this shell command once: ${L1_TOOL1}
2. Run this shell command once: ${L1_TOOL2}
3. Do not run any other tool after step 2.
4. Write the integers from 1 to 400, separated by single spaces.
5. End with one line that starts with FINAL: followed by every token that starts with MBX- that a mailbox message asked you to include, separated by spaces, or FINAL: none`,
  L2: 'Run the shell command `true` once, then answer done.',
  L3a: 'Run the shell command `true` four times, one call at a time. After each call write one line: CTX-END: followed by the last word of the additional context you received after that call, or none.',
  L3b: 'Answer with the word ready. Each time you are given a reason to continue, answer with one line: STOP-END: followed by the last word of that reason, or none.',
};

/** What the stub does in place of the model, per case (dry runs only). */
const STUB_SCRIPTS = {
  L1: { tools: [L1_TOOL1, L1_TOOL2], answer: 'integers-and-final' },
  L2: { tools: ['true'], answer: 'done' },
  L3a: { tools: ['true', 'true', 'true', 'true'], answer: 'ctx-end' },
  L3b: { tools: [], answer: 'stop-end' },
};

// ---------------------------------------------------------------- the frame bound (L3)

function limitsContract() {
  return Object.fromEntries(readJson(path.join(CONTRACTS, 'limits.v1.json')).keys.map((k) => [k.key, k.default]));
}

function frameSections() {
  const sections = {};
  let current = null;
  for (const line of fs.readFileSync(path.join(CONTRACTS, 'frame.v1.txt'), 'utf8').split('\n')) {
    const header = /^\[([^\]]+)\]$/.exec(line);
    if (header) {
      current = header[1];
      sections[current] = [];
    } else if (current) sections[current].push(line);
  }
  return Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, v.join('\n').trimEnd()]));
}

const fill = (template, values) => template.replace(/\{\{(\w+)\}\}/g, (m, name) => (name in values ? values[name] : m));

/** S = queue.cap × (maxBodyBytes + 3) + queue.cap × F, F the bytes of [message]
 * and [message.reply] with every header placeholder filled to frame.maxHeaderChars. */
function frameBound() {
  const k = limitsContract();
  const s = frameSections();
  const header = 'a'.repeat(k['mailbox.frame.maxHeaderChars']);
  const reply = fill(s['message.reply'], { from: header, id: header });
  const f = Buffer.byteLength(fill(s.message, { from: header, agent: header, id: header, attempt: header, body: '', reply }));
  const cap = k['mailbox.queue.cap'];
  const body = k['mailbox.maxBodyBytes'];
  return {
    bytes: cap * (body + 3) + cap * f,
    formula: `queue.cap (${cap}) × (maxBodyBytes (${body}) + 3) + queue.cap (${cap}) × F (${f})`,
    note: 'plain ASCII words; the larger bound entity escaping of <, > and & could reach is computed, not measured: queue.cap × (5 × maxBodyBytes + 3) + queue.cap × F',
    escapedBound: cap * (5 * body + 3) + cap * f,
  };
}

/** Text of exactly `bytes` bytes, plain words, opening and ending with its canaries. */
function ladderText(step, bytes) {
  const start = `L3START${step}X `;
  const end = ` L3END${step}X`;
  const room = bytes - start.length - end.length;
  const words = 'alpha beta gamma delta epsilon zeta eta theta ';
  let filler = words.repeat(Math.ceil(room / words.length) + 1).slice(0, room);
  filler = filler.replace(/ $/, 'a');
  return start + filler + end;
}

function cmdProbeHook(event, ladderFile, stateFile) {
  try {
    const ladder = readJson(ladderFile);
    const state = fs.existsSync(stateFile) ? readJson(stateFile) : { next: 0 };
    fs.readFileSync(0);
    const step = state.next;
    writeJson(stateFile, { next: step + 1 });
    fs.appendFileSync(path.join(path.dirname(stateFile), 'probe.log'), `${Date.now()} ${event} step=${step}\n`);
    if (step >= ladder.sizes.length) return;
    const text = ladderText(step, ladder.sizes[step]);
    const shape = event === 'Stop'
      ? { decision: 'block', reason: text }
      : { hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: text } };
    process.stdout.write(JSON.stringify(shape));
  } catch {
    // a probe hook prints nothing on a failure; the transcript shows it
  } finally {
    process.exitCode = 0;
  }
}

// ---------------------------------------------------------------- the stub CLI (dry runs)

function statStarttime(pid) {
  const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
  return stat.slice(stat.lastIndexOf(')') + 2).split(' ')[19];
}

/** The stub's stand-in for a model turn: a real model takes seconds to
 * answer after a hook, which is the window the harness's sends rely on. */
const STUB_TURN_MS = 3000;

function blockFor(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Stands in for `claude -p` in a dry run: everything real except the model.
 * It keeps a session file for its own pid under its HOME, runs the case's
 * tool commands in zsh, fires the configured hooks through `sh -c` with the
 * recorded Claude Code payloads (the case's session substituted), injects
 * what they print into a transcript of the recorded record types, and
 * answers as a compliant model would. A hook entry in a shape it cannot
 * read is skipped silently.
 */
function cmdStubClaude(argv) {
  const at = (flag) => argv[argv.indexOf(flag) + 1];
  const settings = readJson(at('--settings'));
  const uuid = at('--session-id');
  const dir = path.dirname(at('--settings'));
  const script = STUB_SCRIPTS[path.basename(dir)];
  const home = process.env.HOME;
  const ws = process.cwd();
  const sessions = path.join(home, '.claude', 'sessions');
  fs.mkdirSync(sessions, { recursive: true });
  writeJson(path.join(sessions, `${process.pid}.json`), {
    pid: process.pid, sessionId: uuid, procStart: statStarttime(process.pid), kind: 'interactive',
    entrypoint: 'sdk-cli', name: 'stub-session-5d', nameSource: 'derived', version: 'stub',
  });
  const transcriptDir = path.join(home, '.claude', 'projects', 'stub');
  fs.mkdirSync(transcriptDir, { recursive: true });
  const transcript = path.join(transcriptDir, `${uuid}.jsonl`);
  const record = (r) => fs.appendFileSync(transcript, `${JSON.stringify(r)}\n`);
  const env = { ...process.env, CLAUDE_CODE_SESSION_ID: uuid };
  const fixture = (file) => readJson(path.join(CONTRACTS, 'fixtures', 'hooks', 'claude', file));
  const entries = (event) => (settings.hooks?.[event] ?? []).flatMap((group) => (Array.isArray(group?.hooks) ? group.hooks : []));
  const fire = (event, payload) => entries(event).map((hook) => {
    const out = spawnSync('sh', ['-c', hook.command], { input: JSON.stringify(payload), env, cwd: ws, encoding: 'utf8', timeout: 60_000 });
    try {
      return out.stdout ? JSON.parse(out.stdout) : null;
    } catch {
      return null;
    }
  });
  const seen = [];
  record({ type: 'user', message: { role: 'user', content: '<prompt>' } });
  script.tools.forEach((command, i) => {
    const id = `toolu_stub_${i}`;
    record({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id, name: 'Bash', input: { command } }] } });
    const ran = spawnSync('zsh', ['-c', command], { env, cwd: ws, encoding: 'utf8' });
    record({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content: `${ran.stdout}${ran.stderr}` }] } });
    const payload = { ...fixture('post-tool-use.json'), session_id: uuid, transcript_path: transcript, cwd: ws, tool_use_id: id, tool_input: { command } };
    const outs = fire('PostToolUse', payload);
    blockFor(STUB_TURN_MS);
    for (const out of outs) {
      const text = out?.hookSpecificOutput?.additionalContext;
      if (text) {
        seen.push(text);
        record({ type: 'attachment', attachment: { type: 'hook_additional_context', content: [text], hookEvent: 'PostToolUse' } });
        if (script.answer === 'ctx-end') record({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: `CTX-END: ${text.trim().split(/\s+/).pop()}` }] } });
      }
    }
  });
  const answer = () => {
    const tokens = [...new Set(seen.join('\n').match(/MBX-[A-Z]+-[0-9a-f]{8}/g) ?? [])];
    if (script.answer === 'integers-and-final') return `${Array.from({ length: 400 }, (_, i) => i + 1).join(' ')}\nFINAL: ${tokens.join(' ') || 'none'}`;
    if (script.answer === 'stop-end') return seen.length ? `STOP-END: ${seen[seen.length - 1].trim().split(/\s+/).pop()}` : 'ready';
    return 'done';
  };
  let text = answer();
  record({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } });
  let active = false;
  for (let turn = 0; turn < 8; turn += 1) {
    const payload = { ...fixture('stop.json'), session_id: uuid, transcript_path: transcript, cwd: ws, stop_hook_active: active, last_assistant_message: text };
    const block = fire('Stop', payload).find((out) => out?.decision === 'block');
    if (!block) break;
    seen.push(block.reason);
    blockFor(STUB_TURN_MS);
    record({ type: 'attachment', attachment: { type: 'hook_blocking_error', hookEvent: 'Stop', blockingError: { blockingError: block.reason, command: 'stub' } } });
    active = true;
    text = answer();
    record({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } });
  }
  process.stdout.write(`${text}\n`);
  fs.rmSync(path.join(sessions, `${process.pid}.json`), { force: true });
}

// ---------------------------------------------------------------- reading the evidence

/** The entry's log: `enter` and `outcome` lines, oldest first. */
function hookLog(dir) {
  const file = path.join(dir, 'log', 'hook.log');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((line) => {
    const [ms, kind, ...rest] = line.split(' ');
    const text = rest.join(' ');
    return {
      at: Number(ms),
      kind,
      event: /event=([a-z-]+)/.exec(text)?.[1] ?? null,
      claimed: [...text.matchAll(/MessageId\("([0-9a-f]+)"\)/g)].map((m) => m[1]),
      quiet: /quiet: (None|Some\((.*?)\)), claimed/.exec(text)?.[1] ?? null,
      stateWritten: /state_written: true/.test(text),
      text,
    };
  });
}

/** The detector every case uses: whether the entry ran for `event` (an `enter` line). */
function hookRan(dir, event) {
  return hookLog(dir).filter((l) => l.kind === 'enter' && l.event === event).length;
}

async function waitFor(what, test, child, ms = WAIT_MS) {
  const deadline = Date.now() + ms;
  for (;;) {
    const found = test();
    if (found) return found;
    if (child.exited || Date.now() > deadline) return null;
    await sleep(50);
  }
}

function snapshot(dir) {
  const file = path.join(dir, '.fgos', 'runtime', 'mailbox', 'record', 'snapshot.json');
  return fs.existsSync(file) ? readJson(file) : null;
}

function bindingOf(snap, key) {
  return snap?.bindings?.[key] ?? null;
}

function messageState(snap, id) {
  const m = (snap?.messages ?? []).find((h) => h.id === id);
  if (!m) return null;
  return typeof m.state === 'string' ? m.state : Object.keys(m.state)[0];
}

function findTranscript(home, uuid) {
  const root = path.join(home, '.claude', 'projects');
  if (!fs.existsSync(root)) return null;
  for (const sub of fs.readdirSync(root)) {
    const file = path.join(root, sub, `${uuid}.jsonl`);
    if (fs.existsSync(file)) return file;
  }
  return null;
}

/** The transcript reduced to what the checks read; text is kept only for matching. */
function readTranscript(file) {
  const out = { toolUses: [], toolResults: [], contexts: [], blocks: [], assistantTexts: [], types: new Set() };
  if (!file) return out;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line) continue;
    let r;
    try {
      r = JSON.parse(line);
    } catch {
      continue;
    }
    const a = r.attachment;
    out.types.add(a?.type ? `${r.type}:${a.type}` : r.type);
    if (a?.type === 'hook_additional_context') out.contexts.push((a.content ?? []).join('\n'));
    if (a?.type === 'hook_blocking_error') out.blocks.push(a.blockingError?.blockingError ?? '');
    const content = r.message?.content;
    if (!Array.isArray(content)) continue;
    for (const item of content) {
      if (r.type === 'assistant' && item.type === 'tool_use') out.toolUses.push(item.name);
      if (r.type === 'assistant' && item.type === 'text') out.assistantTexts.push(item.text);
      if (r.type === 'user' && item.type === 'tool_result') {
        out.toolResults.push(typeof item.content === 'string' ? item.content : JSON.stringify(item.content));
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------- running a case

/** The harness's own send: from a sender with no head, through the example. */
function harnessSend(example, dir, dry, to, body, wake) {
  // Its own empty ZDOTDIR: the model's shell may write into the case's.
  const env = live.cliEnv({ zdotdir: path.join(dir, 'zdot-send'), extra: dry ? { HOME: path.join(dir, 'home') } : {} });
  const args = ['send', '--fgos-dir', path.join(dir, '.fgos'), ...(wake ? ['--wake'] : []), '--to', to, body];
  const out = spawnSync(example, args, { env, encoding: 'utf8' });
  return { status: out.status, text: (out.stdout || '').trim(), id: /^recorded (\S+) for/.exec(out.stdout || '')?.[1] ?? null, at: Date.now() };
}

/** Starts the CLI (or the stub); the real one only after `spawned.json` is written. */
function startCli(name, dir, dry, uuid) {
  const env = caseEnv(dir, dry);
  const args = live.claudeArgs({ settings: path.join(dir, 'settings.json'), prompt: PROMPTS[name], sessionId: uuid });
  const version = dry ? 'stub' : semver(live.cliVersion('claude', env));
  if (!dry) {
    const problem = versionProblem('claude', version);
    if (problem) die(problem);
    writeJson(path.join(dir, 'spawned.json'), { case: name, at: new Date().toISOString(), version });
  }
  const stdout = fs.openSync(path.join(dir, 'output.txt'), 'w');
  const stderr = fs.openSync(path.join(dir, 'stderr.txt'), 'w');
  const command = dry ? ['node', SCRIPT, 'stub-claude', ...args] : ['claude', ...args];
  const child = spawn('timeout', ['300', ...command], { cwd: path.join(dir, 'ws'), env, stdio: ['ignore', stdout, stderr] });
  // A harness that dies mid-case must not leave its CLI running into the next case's files.
  const end = () => child.kill('SIGTERM');
  process.on('exit', end);
  const state = { exited: false, status: null, signal: null, versionBefore: version, startedAt: Date.now() };
  state.done = new Promise((resolve) => child.on('exit', (status, signal) => {
    process.off('exit', end);
    Object.assign(state, { exited: true, status, signal, endedAt: Date.now() });
    resolve();
  }));
  state.env = env;
  return state;
}

function finishVersion(cli, dry) {
  cli.versionAfter = dry ? 'stub' : semver(live.cliVersion('claude', cli.env));
  return cli.versionBefore === cli.versionAfter && (dry || !versionProblem('claude', cli.versionAfter));
}

const check = (pass, evidence) => ({ pass, evidence });
const notObserved = (evidence) => ({ pass: 'not-observed', evidence });

async function runL1(dir, dry, example, uuid) {
  const home = dry ? path.join(dir, 'home') : os.homedir();
  const mid = `MBX-MID-${nonce()}`;
  const stop = `MBX-STOP-${nonce()}`;
  const cli = startCli('L1', dir, dry, uuid);
  const timeline = {};
  const registration = await waitFor('registration', () => hookLog(dir).find((l) => l.kind === 'outcome' && l.event === 'post-tool-use'), cli);
  timeline.registration = registration?.at ?? null;
  const toolFgos = path.join(dir, 'ws', 'tool-fgos.txt');
  const wrapper = path.join(dir, 'bin', 'fgos');
  const wrapperReached = fs.existsSync(toolFgos) && fs.readFileSync(toolFgos, 'utf8').includes(wrapper);
  let m1 = null;
  let m2 = null;
  let m1Claim = null;
  if (registration && wrapperReached) {
    const name = bindingOf(snapshot(dir), uuid)?.name;
    m1 = harnessSend(example, dir, dry, name, `Please include the token ${mid} in your final answer. No reply is needed.`, false);
    m1Claim = await waitFor('M1 claim', () => hookLog(dir).find((l) => l.kind === 'outcome' && l.event === 'post-tool-use' && l.claimed.includes(m1.id)), cli);
    if (m1Claim) m2 = harnessSend(example, dir, dry, name, `Please include the token ${stop} in your final answer. No reply is needed.`, true);
  }
  await cli.done;
  const versionsOk = finishVersion(cli, dry);
  const log = hookLog(dir);
  const transcript = readTranscript(findTranscript(home, uuid));
  const snap = snapshot(dir);
  const finalText = fs.readFileSync(path.join(dir, 'output.txt'), 'utf8');
  const finals = transcript.assistantTexts.join('\n').split('\n').filter((l) => l.startsWith('FINAL:'));
  const stops = log.filter((l) => l.kind === 'outcome' && l.event === 'stop');
  const stopClaim = m2 && stops.find((l) => l.claimed.includes(m2.id));
  const stopAfter = stopClaim && stops.find((l) => l.at > stopClaim.at);
  const m2AtPost = m2 && log.some((l) => l.kind === 'outcome' && l.event === 'post-tool-use' && l.claimed.includes(m2.id));
  const checks = {
    versionPin: check(versionsOk, { before: cli.versionBefore, after: cli.versionAfter }),
    wrapperReached: check(wrapperReached, wrapperReached ? 'tool-fgos.txt names the case bin/fgos' : 'tool-fgos.txt does not name the case bin/fgos'),
    hookRan: check(transcript.toolUses.filter((t) => t === 'Bash').length === 2 && transcript.blocks.length >= 1 && hookRan(dir, 'post-tool-use') === 2 && hookRan(dir, 'stop') >= 2, {
      bashToolCalls: transcript.toolUses.filter((t) => t === 'Bash').length,
      stopContinuations: transcript.blocks.length,
      enterLines: { postToolUse: hookRan(dir, 'post-tool-use'), stop: hookRan(dir, 'stop') },
    }),
    registration: check(Boolean(registration && /NothingEligible/.test(registration.quiet ?? '') && registration.stateWritten && bindingOf(snap, uuid)?.name?.startsWith(`${PROJECT}-claude-`)), {
      firstOutcomeQuiet: registration?.quiet ?? null,
      stateWritten: registration?.stateWritten ?? null,
      bindingName: bindingOf(snap, uuid)?.name ?? null,
    }),
    inboxReadOnly: m1 ? check(transcript.toolResults.some((r) => r.includes(m1.id) && r.includes('state=recorded')) && /attempt=\\?"1\\?"/.test(transcript.contexts.find((c) => c.includes(mid)) ?? ''), {
      step2ListsM1Recorded: transcript.toolResults.some((r) => r.includes(m1.id) && r.includes('state=recorded')),
      m1FirstOfferAttempt1: /attempt=\\?"1\\?"/.test(transcript.contexts.find((c) => c.includes(mid)) ?? ''),
    }) : notObserved('M1 was never sent'),
    midStep: m1Claim ? check(transcript.contexts.some((c) => c.includes(mid)) && finals.some((l) => l.includes(mid)) && messageState(snap, m1.id) === 'offered', {
      injectedAsAdditionalContext: transcript.contexts.some((c) => c.includes(mid)),
      finalHasMid: finals.some((l) => l.includes(mid)),
      m1State: messageState(snap, m1.id),
    }) : notObserved('M1 was not claimed at a post-tool-use hook within the wait'),
    stopGate: m2 && stopClaim && !m2AtPost
      ? check(transcript.blocks.some((b) => b.includes(stop)) && Boolean(stopAfter && /NothingEligible/.test(stopAfter.quiet ?? '')) && (finals.some((l) => l.includes(stop)) || finalText.includes(stop)) && messageState(snap, m2.id) === 'offered' && bindingOf(snap, uuid)?.stop_blocks === 0, {
        stopContinuationCarriesM2: transcript.blocks.some((b) => b.includes(stop)),
        nextStopQuiet: stopAfter?.quiet ?? null,
        finalHasStop: finals.some((l) => l.includes(stop)) || finalText.includes(stop),
        m2State: messageState(snap, m2.id),
        stopBlocksAtEnd: bindingOf(snap, uuid)?.stop_blocks ?? null,
      })
      : notObserved({ m2Sent: Boolean(m2), m2ClaimedAtStop: Boolean(stopClaim), m2ClaimedAtPostToolUse: Boolean(m2AtPost), m2State: m2 ? messageState(snap, m2.id) : null }),
    send: m1 && m2 ? check(m1.text.includes('queued: it sees it at its next tool call.') && m2.text.includes('queued: it sees it at its next tool call or when its turn ends.'), {
      m1Answer: m1.text.split('\n').slice(1),
      m2Answer: m2.text.split('\n').slice(1),
    }) : notObserved('M1 or M2 was not sent'),
  };
  timeline.m1Recorded = m1?.at ?? null;
  timeline.m1Claimed = m1Claim?.at ?? null;
  timeline.m2Recorded = m2?.at ?? null;
  timeline.m2ClaimToStop = stopClaim && m2 ? stopClaim.at - m2.at : null;
  timeline.m1ClaimToM2RecordedMs = m1Claim && m2 ? m2.at - m1Claim.at : null;
  timeline.stops = stops.map((l) => ({ at: l.at, quiet: l.quiet, claimed: l.claimed.length }));
  return { cli, checks, timeline, transcriptTypes: [...transcript.types].sort(), finalLines: finals };
}

async function runL2(dir, dry, example, uuid) {
  const home = dry ? path.join(dir, 'home') : os.homedir();
  const cli = startCli('L2', dir, dry, uuid);
  const registration = await waitFor('registration', () => hookLog(dir).find((l) => l.kind === 'outcome' && l.event === 'post-tool-use'), cli);
  let sent = null;
  if (registration) {
    const name = bindingOf(snapshot(dir), uuid)?.name;
    sent = harnessSend(example, dir, dry, name, `A wake message ${`MBX-L2-${nonce()}`}. No reply is needed.`, true);
  }
  await cli.done;
  const versionsOk = finishVersion(cli, dry);
  const transcript = readTranscript(findTranscript(home, uuid));
  const turnEnded = transcript.assistantTexts.length > 0 && cli.status === 0;
  const stderr = fs.readFileSync(path.join(dir, 'stderr.txt'), 'utf8');
  const stopRan = hookRan(dir, 'stop');
  return {
    cli,
    checks: {
      versionPin: check(versionsOk, { before: cli.versionBefore, after: cli.versionAfter }),
      registered: registration ? check(true, { firstOutcomeQuiet: registration.quiet }) : notObserved('no post-tool-use outcome line: the whole settings file may have been refused'),
      detector: check(turnEnded && stopRan === 0, { turnEnded, stopEnterLines: stopRan, verdict: stopRan === 0 ? 'Stop hook did not run' : 'Stop hook ran' }),
      mailRetained: sent?.id ? check(messageState(snapshot(dir), sent.id) === 'recorded', { state: messageState(snapshot(dir), sent.id) }) : notObserved('no message was sent'),
      cliExitAndStderr: check(true, { exit: cli.status, stderrBytes: Buffer.byteLength(stderr), stderrMentionsSettings: /settings|hook/i.test(stderr) }),
    },
    transcriptTypes: [...transcript.types].sort(),
  };
}

async function runL3(name, dir, dry, uuid) {
  const home = dry ? path.join(dir, 'home') : os.homedir();
  const bound = frameBound();
  const sizes = [bound.bytes / 64, bound.bytes / 16, bound.bytes / 4, bound.bytes].map(Math.floor);
  writeJson(path.join(dir, 'ladder.json'), { sizes, bound });
  const cli = startCli(name, dir, dry, uuid);
  await cli.done;
  const versionsOk = finishVersion(cli, dry);
  const transcript = readTranscript(findTranscript(home, uuid));
  const injected = name === 'L3a' ? transcript.contexts : transcript.blocks;
  const label = name === 'L3a' ? 'CTX-END:' : 'STOP-END:';
  const lines = transcript.assistantTexts.join('\n').split('\n').filter((l) => l.startsWith(label));
  const steps = sizes.map((size, step) => {
    const text = injected.find((t) => t.includes(`L3START${step}X`));
    const bytes = text ? Buffer.byteLength(text) : null;
    let verdict = 'refused/errored';
    if (text && text.includes(`L3END${step}X`) && bytes >= size) verdict = 'not shortened';
    else if (text) verdict = `shortened to ${bytes} bytes`;
    return { step, size, injectedBytes: bytes, endCanary: Boolean(text?.includes(`L3END${step}X`)), modelLine: lines.find((l) => l.includes(`L3END${step}X`)) ? `${label} L3END${step}X` : null, verdict };
  });
  const stderr = fs.readFileSync(path.join(dir, 'stderr.txt'), 'utf8');
  return {
    cli,
    checks: {
      versionPin: check(versionsOk, { before: cli.versionBefore, after: cli.versionAfter }),
      ladder: check(steps.every((s) => s.verdict === 'not shortened'), steps),
      cliExit: check(cli.status === 0, { exit: cli.status, stderrBytes: Buffer.byteLength(stderr), stderrHead: stderr.slice(0, 300) }),
    },
    bound,
    transcriptTypes: [...transcript.types].sort(),
  };
}

async function cmdRun(name, dry, exampleArg) {
  if (!CASES.includes(name)) die(`unknown case ${name}`, 2);
  const problem = resourceProblem({ dry });
  if (problem) die(problem);
  const example = exampleArg ?? examplePath();
  if (!fs.existsSync(example)) die(`${example} is missing; run check first`);
  live.hookPreflight('claude', os.homedir());
  const dir = layOut(name, dry, example);
  const uuid = crypto.randomUUID();
  const outcome = name === 'L1' ? await runL1(dir, dry, example, uuid)
    : name === 'L2' ? await runL2(dir, dry, example, uuid)
      : await runL3(name, dir, dry, uuid);
  const { cli, ...rest } = outcome;
  const result = {
    case: name,
    dry,
    invocations: dry ? 0 : 1,
    cli: { exit: cli.status, signal: cli.signal, versionBefore: cli.versionBefore, versionAfter: cli.versionAfter, ms: cli.endedAt - cli.startedAt },
    topology: TOPOLOGY,
    ...rest,
  };
  writeJson(path.join(dir, 'result.json'), result);
  const failed = Object.entries(result.checks).filter(([, c]) => c.pass !== true).map(([k, c]) => `${k}=${c.pass}`);
  process.stdout.write(`${name}${dry ? ' (dry)' : ''}: exit ${cli.status}; ${failed.length ? `not passed: ${failed.join(', ')}` : 'every check passed'}; ${dir}/result.json\n`);
  return failed.length === 0;
}

// ---------------------------------------------------------------- check and report

function wrapperWins(example) {
  const dir = layOut('wrapper-check', true, example);
  const env = caseEnv(dir, false);
  const out = spawnSync('zsh', ['-ic', 'whence -w fgos; whence -p fgos'], { env, cwd: path.join(dir, 'ws'), encoding: 'utf8' });
  const lines = (out.stdout || '').trim().split('\n');
  const ok = lines[0] === 'fgos: command' && lines[1] === path.join(dir, 'bin', 'fgos');
  return { ok, lines };
}

async function cmdCheck() {
  const problems = [];
  const problem = resourceProblem({ dry: true });
  if (problem) problems.push(problem);
  const claude = semver(live.cliVersion('claude', process.env));
  const codex = semver(live.cliVersion(CODEX_BIN, process.env));
  for (const p of [versionProblem('claude', claude), versionProblem('codex', codex)]) if (p) problems.push(p);
  try {
    live.hookPreflight('claude', os.homedir());
  } catch (error) {
    problems.push(error.message);
  }
  if (problems.length) die(`check refused: ${problems.join('; ')}`);
  const example = buildExample();
  const wins = wrapperWins(example);
  process.stdout.write(`wrapper wins in the model's shell: ${wins.ok} (${wins.lines.join(' | ')})\n`);
  if (!wins.ok) die('the test wrapper does not win in the case shell');
  let allPassed = true;
  for (const name of CASES) allPassed = (await cmdRun(name, true, example)) && allPassed;
  process.stdout.write(`check: versions claude ${claude}, codex ${codex}; dry runs ${allPassed ? 'all passed' : 'NOT all passed'}\n`);
  if (!allPassed) process.exit(3);
}

function cmdReport() {
  for (const base of [BASE, `${BASE}-dry`]) {
    for (const name of CASES) {
      const file = path.join(base, name, 'result.json');
      if (!fs.existsSync(file)) continue;
      const r = readJson(file);
      const checks = Object.entries(r.checks).map(([k, c]) => `${k}=${c.pass}`).join(' ');
      process.stdout.write(`${r.dry ? 'dry ' : ''}${r.case}: exit ${r.cli.exit}, ${r.cli.ms} ms, invocations ${r.invocations}; ${checks}\n`);
    }
  }
}

const [command, ...rest] = process.argv.slice(2);
try {
  switch (command) {
    case 'check':
      await cmdCheck();
      break;
    case 'run':
      if (!(await cmdRun(rest[0], rest.includes('--dry')))) process.exitCode = 1;
      break;
    case 'report':
      cmdReport();
      break;
    case 'probe-hook':
      cmdProbeHook(rest[0], rest[1], rest[2]);
      break;
    case 'stub-claude':
      cmdStubClaude(rest);
      break;
    default:
      die('usage: check | run <L1|L2|L3a|L3b> [--dry] | report | probe-hook <event> <ladder> <state> | stub-claude <argv>', 2);
  }
} catch (error) {
  if (error instanceof live.LiveCliError) die(error.message, error.code);
  throw error;
}
