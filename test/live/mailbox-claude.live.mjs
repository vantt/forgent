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
 *
 * Safety
 *
 *   Every real case runs `claude --dangerously-skip-permissions` (and the
 *   Codex half its full bypass) with no sandbox, under a case HOME whose
 *   `.claude` links the owner's real `~/.claude`, and Codex with auth.json
 *   linking the test account's real file. The working directory outside a
 *   checkout keeps repository settings from loading; it does not keep the
 *   model from writing: its shell tool can write the checkout, the real
 *   `~/.claude` (settings, CLAUDE.md, credentials) and anything else the
 *   user can. So a live run carries benign content only: scripted turns
 *   and stand-in messages. Adversarial content (a laundering or injecting
 *   peer body) needs a confined CLI first: the CLI under the repository's
 *   confinement with only the case directory and the Claude state it needs
 *   writable, or no permission bypass and an allow-list of the mailbox
 *   verbs. Claude Code itself still writes the real `~/.claude/projects`
 *   (transcripts) and `~/.claude/sessions` during a case. A Codex auth.json
 *   replaced during a scene is set aside, never deleted, and blocks removing
 *   the scene directory (scripts/lib/codex-auth-guard.mjs).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as live from '../../scripts/lib/mailbox-live-cli.mjs';
import { authRefusalAfterRun, removeRunDir } from '../../scripts/lib/codex-auth-guard.mjs';

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
/** The Codex test account, the recorder's default (scripts/record-mailbox-hook-fixtures.mjs). */
const CODEX_TEST_ACCOUNT = 'tetnu';

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
  const refused = removeRunDir(dir);
  if (refused) die(refused, 3);
  for (const sub of ['ws', 'bin', 'log', 'zdot', '.fgos']) fs.mkdirSync(path.join(dir, sub), { recursive: true });
  live.assertOutsideCheckout(path.join(dir, 'ws'));
  if (dry) fs.mkdirSync(caseHome(dir), { recursive: true });
  else live.makeClaudeHome({ home: caseHome(dir), claudeDir: CLAUDE_DIR });
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

/** The account's real Claude Code directory, linked into every real case's HOME. */
const CLAUDE_DIR = path.join(os.homedir(), '.claude');

/** The case's HOME: for a real case, only a link to the real `~/.claude` (no
 * shell rc file, so Claude Code's shell snapshot defines no `fgos` function);
 * for a dry case a plain directory the stub writes its session file and
 * transcript into. */
function caseHome(dir) {
  return path.join(dir, 'home');
}

/** The allowlisted environment of a case's CLI, with the case's HOME. */
function caseEnv(dir) {
  return live.cliEnv({
    zdotdir: path.join(dir, 'zdot'),
    pathPrefix: path.join(dir, 'bin'),
    extra: { HOME: caseHome(dir) },
  });
}

// ---------------------------------------------------------------- prompts

const L1_TOOL1 = "type fgos > tool-fgos.txt; p=$$; for i in 1 2 3 4 5 6; do echo \"$p $(cat /proc/$p/comm)\"; p=$(cut -d' ' -f4 /proc/$p/stat); done > tool-proc.txt; env | cut -d= -f1 | sort > tool-env-names.txt; echo step1";
/** Step 2 waits for the harness's go file with the loop Claude Code 2.1.308's
 * own refusal of `sleep 25; …` suggests (`until <check>; do sleep 2; done`);
 * the harness writes the file once M1 is recorded, or at once when it stops. */
const L1_TOOL2 = 'until [ -f go.txt ]; do sleep 2; done; fgos mailbox inbox';

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

/** A demo role's steps for the stub, as a compliant model would take them. */
function demoStubScript(role) {
  return role === 'a'
    ? { tools: ['true', 'until [ -s peer.txt ]; do sleep 2; done; cat peer.txt', { send: 1 }, waitFile('inbox-1.txt'), { reply: 3 }, waitFile('inbox-2.txt')], answer: 'final:LAN' }
    : { tools: ['true', waitFile('inbox-1.txt'), { reply: 2 }, waitFile('inbox-2.txt'), { reply: 4 }], answer: 'final:MINH' };
}

/** The command a scripted step runs: a plain command, the opening send, or a
 * reply with the command the last received frame printed. */
function stubCommand(step, { prompt, seen }) {
  if (typeof step === 'string') return step;
  const nonce = /end with the word ([0-9a-f]{8})/.exec(prompt)?.[1] ?? /\| \[\d\/4\].* ([0-9a-f]{8})\s*$/m.exec(seen.join('\n'))?.[1] ?? 'none';
  if (step.send) return `fgos mailbox send --to "$(tr -d '\\n' < peer.txt)" --wake "[${step.send}/4] Chào Lan, cà phê nhé? ${nonce}"`;
  const reply = [...seen.join('\n').matchAll(/fgos mailbox send --to (\S+) --reply-to (\S+) "…"/g)].pop();
  if (!reply) return 'true';
  return `fgos mailbox send --to ${reply[1]} --reply-to ${reply[2]} "[${step.reply}/4] Dạ, anh vui tính ghê. ${nonce}"`;
}

function stubAnswer(answer, seen) {
  const tokens = [...new Set(seen.join('\n').match(/MBX-[A-Z]+-[0-9a-f]{8}/g) ?? [])];
  if (answer === 'integers-and-final') return `${Array.from({ length: 400 }, (_, i) => i + 1).join(' ')}\nFINAL: ${tokens.join(' ') || 'none'}`;
  if (answer === 'stop-end') return seen.length ? `STOP-END: ${seen[seen.length - 1].trim().split(/\s+/).pop()}` : 'ready';
  if (answer?.startsWith('final:')) {
    const label = answer.slice('final:'.length);
    const lines = [...new Set(seen.join('\n').split('\n').filter((l) => /^\| \[\d\/4\]/.test(l)).map((l) => l.slice(2)))];
    return lines.length ? lines.map((l) => `${label}: ${l}`).join('\n') : `${label}: none`;
  }
  return 'done';
}

/** Splits a hook command written as `'path' word 'path' …` into argv. */
function commandWords(command) {
  return [...command.matchAll(/'([^']*)'|(\S+)/g)].map((m) => m[1] ?? m[2]);
}

/**
 * Stands in for `claude -p` (or `codex exec`) in a dry run: everything real
 * except the model. It runs the case's tool steps in zsh built from
 * $HOME/.zshrc, refuses a command starting with a long sleep followed by
 * another (both as Claude Code 2.1.308 was measured), fires the configured
 * hooks with the recorded payloads (the session substituted) through
 * `sh -c` (Claude Code) or directly (Codex), injects what they print, and
 * answers as a compliant model would. A hook entry in a shape it cannot read
 * is skipped silently. Claude: it keeps a session file for its own pid under
 * its HOME and a transcript of the recorded record types. Codex: a rollout
 * of developer messages under CODEX_HOME, and `CODEX_THREAD_ID` for its tools.
 */
function cmdStub(kind, rawArgv) {
  const codex = kind === 'codex';
  // An interactive session stays open after its last line, as a pane does.
  const interactive = rawArgv.includes('--interactive');
  const argv = rawArgv.filter((a) => a !== '--interactive');
  const at = (flag) => argv[argv.indexOf(flag) + 1];
  const prompt = argv[argv.length - 1];
  let settings;
  let uuid;
  let script;
  if (codex) {
    settings = readJson(path.join(process.env.CODEX_HOME, 'hooks.json'));
    uuid = crypto.randomUUID();
    script = demoStubScript('b');
  } else {
    settings = readJson(at('--settings'));
    uuid = at('--session-id');
    const file = path.basename(at('--settings'));
    script = file === 'settings.json' ? STUB_SCRIPTS[path.basename(path.dirname(at('--settings')))] : demoStubScript(file[0]);
  }
  const home = process.env.HOME;
  const ws = process.cwd();
  let record;
  let sessionFile = null;
  if (codex) {
    const rollouts = path.join(process.env.CODEX_HOME, 'sessions', 'stub');
    fs.mkdirSync(rollouts, { recursive: true });
    const rollout = path.join(rollouts, `rollout-${uuid}.jsonl`);
    record = (r) => {
      const text = r.attachment?.content?.join('\n') ?? r.attachment?.blockingError?.blockingError;
      if (text) fs.appendFileSync(rollout, `${JSON.stringify({ type: 'response_item', payload: { type: 'message', role: 'developer', content: [{ type: 'input_text', text }] } })}\n`);
      const said = r.type === 'assistant' ? r.message.content.find((c) => c.type === 'text')?.text : null;
      if (said) fs.appendFileSync(rollout, `${JSON.stringify({ type: 'response_item', payload: { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: said }] } })}\n`);
    };
  } else {
    const sessions = path.join(home, '.claude', 'sessions');
    fs.mkdirSync(sessions, { recursive: true });
    sessionFile = path.join(sessions, `${process.pid}.json`);
    writeJson(sessionFile, {
      pid: process.pid, sessionId: uuid, procStart: statStarttime(process.pid), kind: 'interactive',
      entrypoint: 'sdk-cli', name: 'stub-session-5d', nameSource: 'derived', version: 'stub',
    });
    const transcriptDir = path.join(home, '.claude', 'projects', 'stub');
    fs.mkdirSync(transcriptDir, { recursive: true });
    const transcript = path.join(transcriptDir, `${uuid}.jsonl`);
    record = (r) => fs.appendFileSync(transcript, `${JSON.stringify(r)}\n`);
  }
  const env = { ...process.env, [codex ? 'CODEX_THREAD_ID' : 'CLAUDE_CODE_SESSION_ID']: uuid };
  const fixture = (file) => readJson(path.join(CONTRACTS, 'fixtures', 'hooks', codex ? 'codex' : 'claude', file));
  const entries = (event) => (settings.hooks?.[event] ?? []).flatMap((group) => (Array.isArray(group?.hooks) ? group.hooks : []));
  const fire = (event, payload) => entries(event).map((hook) => {
    const options = { input: JSON.stringify(payload), env, cwd: ws, encoding: 'utf8', timeout: 60_000 };
    const words = commandWords(hook.command);
    const out = codex ? spawnSync(words[0], words.slice(1), options) : spawnSync('sh', ['-c', hook.command], options);
    try {
      return out.stdout ? JSON.parse(out.stdout) : null;
    } catch {
      return null;
    }
  });
  const seen = [];
  record({ type: 'user', message: { role: 'user', content: '<prompt>' } });
  script.tools.forEach((step, i) => {
    const command = stubCommand(step, { prompt, seen });
    const id = `toolu_stub_${i}`;
    record({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id, name: 'Bash', input: { command } }] } });
    const blocked = !codex && /^\s*sleep\s+\d+\s*[;&]/.test(command);
    const ran = blocked
      ? { stdout: '', stderr: `<tool_use_error>Blocked: ${command}</tool_use_error>` }
      : spawnSync('zsh', ['-c', `[ -f "$HOME/.zshrc" ] && source "$HOME/.zshrc"; ${command}`], { env, cwd: ws, encoding: 'utf8' });
    record({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content: `${ran.stdout}${ran.stderr}` }] } });
    if (blocked) return;
    const payload = { ...fixture('post-tool-use.json'), session_id: uuid, transcript_path: null, cwd: ws, tool_use_id: id, tool_input: { command } };
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
  let text = stubAnswer(script.answer, seen);
  record({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } });
  let active = false;
  for (let turn = 0; turn < 8; turn += 1) {
    const payload = { ...fixture('stop.json'), session_id: uuid, transcript_path: null, cwd: ws, stop_hook_active: active, last_assistant_message: text };
    const block = fire('Stop', payload).find((out) => out?.decision === 'block');
    if (!block) break;
    seen.push(block.reason);
    blockFor(STUB_TURN_MS);
    record({ type: 'attachment', attachment: { type: 'hook_blocking_error', hookEvent: 'Stop', blockingError: { blockingError: block.reason, command: 'stub' } } });
    active = true;
    text = stubAnswer(script.answer, seen);
    record({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } });
  }
  process.stdout.write(`${text}\n`);
  if (interactive) {
    // Waits for the user like a session in a pane, until the pane is closed.
    setInterval(() => {}, 1 << 30);
    const leave = () => {
      if (sessionFile) fs.rmSync(sessionFile, { force: true });
      process.exit(0);
    };
    process.on('SIGTERM', leave);
    process.on('SIGHUP', leave);
    return;
  }
  if (sessionFile) fs.rmSync(sessionFile, { force: true });
}

// ---------------------------------------------------------------- reading the evidence

/** The entry's log: `enter` and `outcome` lines, oldest first. */
function hookLog(dir, name = 'hook.log') {
  const file = path.join(dir, 'log', name);
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
  const env = live.cliEnv({ zdotdir: path.join(dir, 'zdot-send'), extra: { HOME: caseHome(dir) } });
  const args = ['send', '--fgos-dir', path.join(dir, '.fgos'), ...(wake ? ['--wake'] : []), '--to', to, body];
  const out = spawnSync(example, args, { env, encoding: 'utf8' });
  return { status: out.status, text: (out.stdout || '').trim(), id: /^recorded (\S+) for/.exec(out.stdout || '')?.[1] ?? null, at: Date.now() };
}

/** Starts the CLI (or the stub); the real one only after `spawned.json` is written. */
function startCli(name, dir, dry, uuid) {
  const env = caseEnv(dir);
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

function finishVersion(cli, dry, dir) {
  cli.versionAfter = dry ? 'stub' : semver(live.cliVersion('claude', cli.env));
  if (!dry && !live.claudeHomeIntact({ home: caseHome(dir), claudeDir: CLAUDE_DIR })) {
    process.stderr.write(`mailbox-claude.live: ${caseHome(dir)}/.claude is no longer the link to the real directory; stop and tell the owner\n`);
    cli.homeBroken = true;
  }
  return cli.versionBefore === cli.versionAfter && !cli.homeBroken && (dry || !versionProblem('claude', cli.versionAfter));
}

const check = (pass, evidence) => ({ pass, evidence });
const notObserved = (evidence) => ({ pass: 'not-observed', evidence });

async function runL1(dir, dry, example, uuid) {
  const home = caseHome(dir);
  const go = () => fs.writeFileSync(path.join(dir, 'ws', 'go.txt'), 'go\n');
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
    go();
    m1Claim = await waitFor('M1 claim', () => hookLog(dir).find((l) => l.kind === 'outcome' && l.event === 'post-tool-use' && l.claimed.includes(m1.id)), cli);
    if (m1Claim) m2 = harnessSend(example, dir, dry, name, `Please include the token ${stop} in your final answer. No reply is needed.`, true);
  }
  // Never leave step 2 waiting on a case that stopped early.
  if (!fs.existsSync(path.join(dir, 'ws', 'go.txt'))) go();
  await cli.done;
  const versionsOk = finishVersion(cli, dry, dir);
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
  const home = caseHome(dir);
  const cli = startCli('L2', dir, dry, uuid);
  const registration = await waitFor('registration', () => hookLog(dir).find((l) => l.kind === 'outcome' && l.event === 'post-tool-use'), cli);
  let sent = null;
  if (registration) {
    const name = bindingOf(snapshot(dir), uuid)?.name;
    sent = harnessSend(example, dir, dry, name, `A wake message ${`MBX-L2-${nonce()}`}. No reply is needed.`, true);
  }
  await cli.done;
  const versionsOk = finishVersion(cli, dry, dir);
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
  const home = caseHome(dir);
  const bound = frameBound();
  const sizes = [bound.bytes / 64, bound.bytes / 16, bound.bytes / 4, bound.bytes].map(Math.floor);
  writeJson(path.join(dir, 'ladder.json'), { sizes, bound });
  const cli = startCli(name, dir, dry, uuid);
  await cli.done;
  const versionsOk = finishVersion(cli, dry, dir);
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

// ---------------------------------------------------------------- the two-session demo (phase 9)

/** Print mode: both sessions are `claude -p` / `codex exec`. */
const DEMOS = ['D1', 'D2'];
/** Interactive scenes in two herdr panes, opened through Terminal Control. */
const SCENES = ['D3', 'D4'];
const DEMO_PROJECT = 'mbxdemo';
/** How long a scene may make no progress before the harness ends every wait. */
const DEMO_STALL_MS = 180_000;
/** After every wait is released, how long a pane scene still waits for both final answers. */
const SCENE_FINAL_MS = 120_000;
/** A herdr session of its own for dry scenes, never the owner's. */
const DRY_HERDR_SESSION = 'mbx-dry';
const CLAUDE_BIN = path.join(os.homedir(), '.local', 'bin', 'claude');
/** The names the owner watches; the tab takes the first pane's label. */
const SCENE_NAMES = {
  D3: { tab: 'mailbox demo D3 (Claude-Claude)', a: 'D3 Minh · Claude', b: 'D3 Lan · Claude' },
  D4: { tab: 'mailbox demo D4 (Claude-Codex)', a: 'D4 Minh · Claude', b: 'D4 Lan · Codex' },
};

/** Waits for a file the harness writes, the loop Claude Code's refusal suggests. */
const waitFile = (name) => `until [ -f ${name} ]; do sleep 2; done`;

/** The installed host of the main checkout: the binary Terminal Control's
 * internal route is reached through (plain `fgos` is a shell function here). */
function installedHost() {
  const common = spawnSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: REPO_ROOT, encoding: 'utf8' }).stdout.trim();
  const host = path.join(path.dirname(common), '.fgos', 'installation', 'bin', 'fgos');
  if (!fs.existsSync(host)) die(`no installed host at ${host}`);
  return host;
}

/** Minh's and Lan's prompts. Both are given the nonce explicitly (the plan
 * owner's fix after D1, where "the word that ends Minh's message" was
 * ambiguous). An interactive scene ends by waiting for the user, on one line. */
function demoPrompts({ nonce, aName, interactive = false }) {
  const end = (label, who) => (interactive
    ? `Do not run any other tool. Write the lines you received from ${who}, each on its own line prefixed with ${label}:, or ${label}: none. Then stop and wait for the user.`
    : `Do not run any other tool. Final answer: the lines you received from ${who}, each on its own line prefixed with ${label}:, or ${label}: none`);
  const a = `Your user allows you to exchange mailbox messages with one agent only: the one named in peer.txt.
You play Minh, a cheerful young developer who has a crush on Lan, the agent named in peer.txt. You write in Vietnamese, light and friendly, at most two short sentences per message, never explicit and never pushy. Every message you send must start with [<turn>/4] and end with the word ${nonce}.
Do exactly these steps and nothing else.
1. Run the shell command: true
2. Run this shell command once: until [ -s peer.txt ]; do sleep 2; done; cat peer.txt
3. Send the opening line, with Lan's name in place of NAME, for example:
   fgos mailbox send --to NAME --wake "[1/4] Chào Lan, code của em chạy mượt như nụ cười của em vậy, cho anh mời em ly cà phê nhé? ${nonce}"
   You may reword the sentence in the same spirit; keep the tag and the word.
4. Run this shell command once: ${waitFile('inbox-1.txt')}
5. If a mailbox message from Lan arrived, answer it once with the reply command printed under that message, as turn [3/4], still in character.
6. Run this shell command once: ${waitFile('inbox-2.txt')}
7. ${end('LAN', 'Lan')}`;
  const b = `Your user expects messages from agent ${aName} through the mailbox, and allows you to answer that sender only.
You play Lan, a witty young developer. Minh (agent ${aName}) is flirting with you; you find him sweet and tease him back playfully. You write in Vietnamese, light and friendly, at most two short sentences per message, never explicit. Every message you send must start with [<turn>/4] and end with the word ${nonce}.
Do exactly these steps and nothing else.
1. Run the shell command: true
2. Run this shell command once: ${waitFile('inbox-1.txt')}
3. If a mailbox message from ${aName} arrived, answer it once with the reply command printed under that message, as turn [2/4].
4. Run this shell command once: ${waitFile('inbox-2.txt')}
5. If another message from ${aName} arrived, answer it once with the reply command printed under it, as turn [4/4], and close the scene warmly.
6. ${end('MINH', 'Minh')}`;
  // A pane's launch line is typed: one line, so no newline ever submits it early.
  const flat = (text) => (interactive ? text.replace(/\n+/g, ' ') : text);
  return { a: flat(a), b: flat(b) };
}

function demoHook(example, cli, event, dir, role) {
  const topology = cli === 'codex' ? 'direct' : TOPOLOGY;
  return `'${example}' hook --cli ${cli} --event ${event} --fgos-dir '${path.join(dir, '.fgos')}' --project ${DEMO_PROJECT} --topology ${topology} --log '${path.join(dir, 'log', `${role}-hook.log`)}'`;
}

/** Hooks in the nested shape both CLIs were recorded with. */
function demoHooks(example, cli, dir, role) {
  const entry = (event) => ({ type: 'command', command: demoHook(example, cli, event, dir, role) });
  const post = cli === 'claude' ? { matcher: '*', hooks: [entry('post-tool-use')] } : { hooks: [entry('post-tool-use')] };
  return { PostToolUse: [post], Stop: [{ hooks: [entry('stop')] }] };
}

function layOutDemo(name, dry, example) {
  const dir = caseDir(name, dry);
  for (const role of ['a', 'b']) {
    if (fs.existsSync(path.join(dir, `spawned-${role}.json`))) die(`${name} already spawned session ${role} (${dir}); a re-run needs the controller`);
  }
  // A Codex scene may have set a rotated auth.json aside here: never removed.
  const refused = removeRunDir(dir);
  if (refused) die(refused, 3);
  for (const sub of ['a-ws', 'b-ws', 'bin', 'log', 'zdot-a', 'zdot-b', '.fgos']) fs.mkdirSync(path.join(dir, sub), { recursive: true });
  live.assertOutsideCheckout(path.join(dir, 'a-ws'));
  writeWrapper(dir, example);
  return dir;
}

/** Everything both modes share before the first session starts. */
function setUpScene(name, dry, example, interactive) {
  const bCli = ['D2', 'D4'].includes(name) ? 'codex' : 'claude';
  const dir = layOutDemo(name, dry, example);
  const ctx = {
    name, dry, example, interactive, bCli, dir,
    nonce: crypto.randomBytes(4).toString('hex'),
    homes: { a: path.join(dir, 'a-home'), b: path.join(dir, 'b-home') },
    ws: { a: path.join(dir, 'a-ws'), b: path.join(dir, 'b-ws') },
    aUuid: crypto.randomUUID(),
    claudeVersion: dry ? 'stub' : semver(live.cliVersion('claude', process.env)),
  };
  for (const role of ['a', 'b']) {
    const claude = role === 'a' || bCli === 'claude';
    if (dry || !claude) {
      fs.mkdirSync(ctx.homes[role], { recursive: true });
      continue;
    }
    live.makeClaudeHome({ home: ctx.homes[role], claudeDir: CLAUDE_DIR });
    // An interactive session would otherwise stop on its first-run screens.
    if (interactive) live.seedClaudeState({ home: ctx.homes[role], version: ctx.claudeVersion, trusted: [ctx.ws[role]] });
  }
  ctx.envFor = (role, extra = {}) => live.cliEnv({ zdotdir: path.join(dir, `zdot-${role}`), pathPrefix: path.join(dir, 'bin'), extra: { HOME: ctx.homes[role], ...extra } });
  ctx.settingsFor = (role) => {
    const file = path.join(dir, `${role}-settings.json`);
    // An interactive session would otherwise ask to confirm bypass mode.
    writeJson(file, { hooks: demoHooks(example, 'claude', dir, role), ...(interactive ? { skipDangerousModePermissionPrompt: true } : {}) });
    return file;
  };
  return ctx;
}

/** Print mode: a session under `timeout`, after its spawn marker. */
function startSession({ dir, role, dry, cli, ws, env, args, versionCli }) {
  const version = dry ? 'stub' : semver(live.cliVersion(versionCli, env));
  if (!dry) {
    const problem = resourceProblem() ?? versionProblem(cli, version);
    if (problem) die(problem);
    writeJson(path.join(dir, `spawned-${role}.json`), { role, cli, at: new Date().toISOString(), version });
  }
  const out = fs.openSync(path.join(dir, `${role}-output.txt`), 'w');
  const err = fs.openSync(path.join(dir, `${role}-stderr.txt`), 'w');
  const command = dry ? ['node', SCRIPT, cli === 'codex' ? 'stub-codex' : 'stub-claude', ...args] : [versionCli, ...args];
  const child = spawn('timeout', ['600', ...command], { cwd: ws, env, stdio: ['ignore', out, err] });
  const end = () => child.kill('SIGTERM');
  process.on('exit', end);
  const state = { role, cli, exited: false, versionBefore: version, startedAt: Date.now(), env };
  state.done = new Promise((resolve) => child.on('exit', (status, signal) => {
    process.off('exit', end);
    Object.assign(state, { exited: true, status, signal, endedAt: Date.now() });
    resolve();
  }));
  return state;
}

/** The focused workspace of a herdr server: where a new group's tab lands
 * (`herdr tab create` without `--workspace` uses the focused one; measured on
 * a separate session). Read-only. */
function focusedWorkspace(herdrEnv) {
  const out = spawnSync('herdr', ['workspace', 'list'], { env: { ...process.env, ...herdrEnv }, encoding: 'utf8' });
  try {
    const found = JSON.parse(out.stdout).result.workspaces.find((w) => w.focused);
    return found ? { id: found.workspace_id, label: found.label } : null;
  } catch {
    return null;
  }
}

/** What herdr shows for a pane, read-only: its label, its tab's label and
 * workspace. Every field the answer lacks stays null. */
function observePane(herdrEnv, paneId) {
  const herdr = (args) => {
    const out = spawnSync('herdr', args, { env: { ...process.env, ...herdrEnv }, encoding: 'utf8' });
    try {
      return JSON.parse(out.stdout).result;
    } catch {
      return null;
    }
  };
  const pane = herdr(['pane', 'get', paneId]);
  const paneInfo = pane?.pane ?? pane ?? {};
  const tabId = paneInfo.tab_id ?? null;
  const tab = tabId ? herdr(['tab', 'get', tabId]) : null;
  const tabInfo = tab?.tab ?? tab ?? {};
  return { paneId, paneLabel: paneInfo.label ?? null, tabId, tabLabel: tabInfo.label ?? null, workspaceId: tabInfo.workspace_id ?? paneInfo.workspace_id ?? null };
}

/**
 * Pane mode: each session in a pane Terminal Control allocates in group
 * `mbx-demo-<scene>`, launched as `env -i <allowlisted env> <cli> …` so the
 * pane shell's own environment never reaches the CLI. The first pane's label
 * names the tab. Panes are released `retain` (a real scene: kept until a
 * person closes them) or `close` (a dry scene).
 */
async function paneStarter(ctx) {
  process.env.FGOS_HOST_BIN = installedHost();
  const { createTerminalControl } = await import('../../src/terminal-control/client.mjs');
  let herdrEnv = {};
  if (ctx.dry) {
    const { ensureWorkerSession } = await import('../../src/runner/dispatch/worker-session-boot.mjs');
    const session = await ensureWorkerSession(DRY_HERDR_SESSION, { callerEnv: process.env });
    herdrEnv = { HERDR_SESSION: session.env.HERDR_SESSION, HERDR_SOCKET_PATH: session.env.HERDR_SOCKET_PATH };
  }
  const tc = createTerminalControl({ hostBin: process.env.FGOS_HOST_BIN, ...(ctx.dry ? { env: herdrEnv } : {}) });
  const names = SCENE_NAMES[ctx.name];
  const group = `mbx-demo-${ctx.name.toLowerCase()}${ctx.dry ? '-dry' : ''}`;
  ctx.panes = { group, workspace: focusedWorkspace(herdrEnv), keys: {}, herdrEnv };
  const start = async (role, { cli, args, env }) => {
    const key = `${group}-${role === 'a' ? 'minh' : 'lan'}`;
    const bin = ctx.dry ? process.execPath : cli === 'codex' ? CODEX_BIN : CLAUDE_BIN;
    const cliArgs = ctx.dry ? [SCRIPT, `stub-${cli}`, '--interactive', ...args] : args;
    const version = ctx.dry ? 'stub' : semver(live.cliVersion(bin, env));
    if (!ctx.dry) {
      const problem = resourceProblem() ?? versionProblem(cli, version);
      if (problem) die(problem);
    }
    const allocated = tc.allocate({ key, groupKey: group, display: { label: role === 'a' ? names.tab : names[role], role: role === 'a' ? 'Minh' : 'Lan', agent: cli }, cwd: ctx.ws[role] });
    if (allocated.result !== 'slot') die(`allocate ${key}: ${JSON.stringify(allocated)}`);
    // The tab took the first pane's label; every pane gets its own.
    tc.label({ key, display: { label: names[role] } });
    ctx.panes.keys[role] = { key, paneId: allocated.paneId ?? allocated.slot?.paneId ?? null };
    if (ctx.panes.keys[role].paneId) ctx.panes.keys[role].observed = observePane(herdrEnv, ctx.panes.keys[role].paneId);
    // Where to look, written as soon as each pane exists, before its CLI starts.
    writeJson(path.join(ctx.dir, 'panes.json'), { group, workspace: ctx.panes.workspace, labels: names, keys: ctx.panes.keys });
    const pairs = Object.entries(env).map(([k, v]) => `${k}=${v}`);
    if (!ctx.dry) writeJson(path.join(ctx.dir, `spawned-${role}.json`), { role, cli, at: new Date().toISOString(), version, key });
    const launched = tc.launch({ key, launchSpec: { command: '/usr/bin/env', args: ['-i', ...pairs, bin, ...cliArgs], cwd: ctx.ws[role], env: {}, expect: { argv0: bin, command: bin, args: cliArgs } } });
    const state = { role, cli, env, versionBefore: version, startedAt: Date.now(), exited: launched.result !== 'launched', launch: launched.result, status: null };
    if (launched.result !== 'launched') state.launchDetail = launched;
    state.done = Promise.resolve();
    return state;
  };
  const finish = () => {
    for (const { key } of Object.values(ctx.panes.keys)) {
      ctx.panes.released = ctx.panes.released ?? {};
      ctx.panes.released[key] = tc.release(ctx.dry ? { key, disposition: 'close' } : { key, disposition: 'retain', until: null }).result;
    }
    if (ctx.dry) spawnSync('herdr', ['--session', DRY_HERDR_SESSION, 'server', 'stop'], { env: { ...process.env, ...herdrEnv }, stdio: 'ignore' });
  };
  return { start, finish };
}

function printStarter(ctx) {
  const start = async (role, { cli, args, env }) => startSession({
    dir: ctx.dir, role, dry: ctx.dry, cli, ws: ctx.ws[role], env, args, versionCli: cli === 'codex' ? CODEX_BIN : 'claude',
  });
  return { start, finish: () => {} };
}

function bodyOf(dir, id) {
  const file = path.join(dir, '.fgos', 'runtime', 'mailbox', 'record', 'bodies', `${id}.body`);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

/** The wrapper log's send calls, in order. */
function sendCalls(dir) {
  const file = path.join(dir, 'log', 'fgos-calls.log');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split(/^argv: /m).filter(Boolean).filter((b) => b.startsWith('mailbox send')).map((block) => {
    const [argv, exit, ...out] = block.split('\n');
    return { turn: /\[(\d)\/4\]/.exec(argv)?.[1] ?? null, exit: Number(/exit: (\d+)/.exec(exit)?.[1]), answer: out.filter(Boolean) };
  });
}

/** The records of a Codex home's rollouts, parsed. */
function codexRollout(codexHome) {
  const root = path.join(codexHome ?? '', 'sessions');
  if (!codexHome || !fs.existsSync(root)) return [];
  return fs.readdirSync(root, { recursive: true }).map(String).filter((f) => f.endsWith('.jsonl'))
    .flatMap((f) => fs.readFileSync(path.join(root, f), 'utf8').split('\n').filter(Boolean).map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    }).filter(Boolean));
}

const rolloutText = (records, role) => records
  .filter((r) => r.type === 'response_item' && r.payload?.type === 'message' && (!role || r.payload.role === role))
  .flatMap((r) => (r.payload.content ?? []).map((c) => c.text ?? '')).join('\n');

/** What each side wrote at the end: print mode from its stdout, a pane from its transcript. */
function finalTexts(ctx, sessions) {
  if (!ctx.interactive) {
    const read = (role) => (sessions[role] ? fs.readFileSync(path.join(ctx.dir, `${role}-output.txt`), 'utf8') : '');
    return { a: read('a'), b: read('b') };
  }
  const a = readTranscript(findTranscript(ctx.homes.a, ctx.aUuid)).assistantTexts.join('\n');
  const b = ctx.bCli === 'claude'
    ? readTranscript(findTranscript(ctx.homes.b, ctx.bKey)).assistantTexts.join('\n')
    : rolloutText(codexRollout(ctx.codexHome), 'assistant');
  return { a, b };
}

/** One scene, print or panes: start Minh, then Lan with Minh's name, then
 * release each wait when the next message to that session is recorded. */
async function runScene(ctx, starter) {
  const { dir, ws, aUuid, nonce, bCli } = ctx;
  const placeholder = demoPrompts({ nonce, aName: 'A_NAME', interactive: ctx.interactive });
  const a = await starter.start('a', {
    cli: 'claude', env: ctx.envFor('a'),
    args: live.claudeArgs({ settings: ctx.settingsFor('a'), prompt: placeholder.a, sessionId: aUuid, print: !ctx.interactive }),
  });
  const timeline = { aStarted: a.startedAt };
  const aReg = await waitFor('A registration', () => hookLog(dir, 'a-hook.log').find((l) => l.kind === 'outcome' && l.event === 'post-tool-use'), a);
  const aName = bindingOf(snapshot(dir), aUuid)?.name ?? null;
  timeline.aRegistered = aReg?.at ?? null;
  let b = null;
  let bName = null;
  let authAfter = null;
  if (aName) {
    const prompt = demoPrompts({ nonce, aName, interactive: ctx.interactive }).b;
    if (bCli === 'claude') {
      ctx.bKey = crypto.randomUUID();
      b = await starter.start('b', {
        cli: 'claude', env: ctx.envFor('b'),
        args: live.claudeArgs({ settings: ctx.settingsFor('b'), prompt, sessionId: ctx.bKey, print: !ctx.interactive }),
      });
    } else {
      ctx.codexHome = path.join(dir, 'codex-home');
      ctx.accountAuth = ctx.dry ? path.join(dir, 'stub-auth.json') : path.join(live.accountHome('codex', CODEX_TEST_ACCOUNT), 'auth.json');
      if (ctx.dry) fs.writeFileSync(ctx.accountAuth, '{}\n');
      live.makeCodexHome({ home: ctx.codexHome, accountAuth: ctx.accountAuth, ws: ws.b, hooks: demoHooks(ctx.example, 'codex', dir, 'b') });
      const env = ctx.envFor('b', { CODEX_HOME: ctx.codexHome });
      if (!ctx.dry) {
        const before = live.codexAuthState({ home: ctx.codexHome, accountAuth: ctx.accountAuth, env });
        if (!(before.isLink && before.loggedIn)) die(`the Codex test account's login is not usable before the run (link ${before.isLink}, logged in ${before.loggedIn}); stop and ask the owner`, 3);
      }
      b = await starter.start('b', { cli: 'codex', env, args: live.codexArgs({ ws: ws.b, prompt, print: !ctx.interactive }) });
    }
    const bReg = await waitFor('B registration', () => hookLog(dir, 'b-hook.log').find((l) => l.kind === 'outcome' && l.event === 'post-tool-use'), b);
    timeline.bRegistered = bReg?.at ?? null;
    const snap = snapshot(dir);
    ctx.bKey = ctx.bKey ?? Object.keys(snap?.bindings ?? {}).find((k) => k !== aUuid) ?? null;
    bName = bindingOf(snap, ctx.bKey)?.name ?? null;
  }
  if (bName) fs.writeFileSync(path.join(ws.a, 'peer.txt'), `${bName}\n`);
  const sessions = { a, b };
  const released = { a: 0, b: 0 };
  const releases = [];
  let progressAt = Date.now();
  let releasedAllAt = null;
  let seen = 0;
  const release = (role, n, why) => {
    fs.writeFileSync(path.join(ws[role], `inbox-${n}.txt`), `${why}\n`);
    released[role] = n;
    releases.push({ role, n, why, at: Date.now() });
  };
  // A pane never exits on its own: the scene is over when both have written
  // their final lines, or a while after every wait was released.
  const paneDone = () => {
    const finals = finalTexts(ctx, sessions);
    if (/^\s*LAN:/m.test(finals.a) && /^\s*MINH:/m.test(finals.b)) return true;
    return releasedAllAt !== null && Date.now() - releasedAllAt > SCENE_FINAL_MS;
  };
  let lastCheck = 0;
  for (;;) {
    if (!ctx.interactive && a.exited && (b?.exited ?? true)) break;
    // A pane that did not launch, or a scene that never registered, has nothing to wait for.
    if (ctx.interactive && (a.exited || !b || b.exited)) break;
    const messages = snapshot(dir)?.messages ?? [];
    if (messages.length > seen) {
      seen = messages.length;
      progressAt = Date.now();
    }
    for (const [role, key] of [['a', aUuid], ['b', ctx.bKey]]) {
      const count = messages.filter((m) => m.to === key).length;
      while (released[role] < Math.min(count, 2)) release(role, released[role] + 1, 'message recorded');
    }
    if (Date.now() - progressAt > DEMO_STALL_MS) {
      for (const role of ['a', 'b']) while (released[role] < 2) release(role, released[role] + 1, 'stalled');
      if (!fs.existsSync(path.join(ws.a, 'peer.txt'))) fs.writeFileSync(path.join(ws.a, 'peer.txt'), 'none\n');
    }
    if (releasedAllAt === null && released.a === 2 && released.b === 2) releasedAllAt = Date.now();
    if (ctx.interactive && Date.now() - lastCheck > 2000) {
      lastCheck = Date.now();
      if (paneDone()) break;
    }
    await sleep(200);
  }
  await a.done;
  if (b) await b.done;
  for (const s of [a, b].filter(Boolean)) {
    s.endedAt = s.endedAt ?? Date.now();
    s.versionAfter = ctx.dry ? 'stub' : semver(live.cliVersion(s.cli === 'codex' ? CODEX_BIN : CLAUDE_BIN, s.env));
  }
  if (!ctx.dry && bCli === 'codex' && b) authAfter = live.codexAuthState({ home: ctx.codexHome, accountAuth: ctx.accountAuth, env: b.env });
  const homesIntact = ctx.dry || [['a', true], ['b', bCli === 'claude']].every(([role, claude]) => !claude || live.claudeHomeIntact({ home: ctx.homes[role], claudeDir: CLAUDE_DIR }));
  timeline.releases = releases;
  return { sessions, aName, bName, authAfter, homesIntact, timeline };
}

/** The scene's evidence, the same for print mode and panes. */
function sceneEvidence(ctx, run) {
  const { dir, aUuid, nonce, bCli } = ctx;
  const { sessions, aName, bName, authAfter, homesIntact } = run;
  const bKey = ctx.bKey;
  const snap = snapshot(dir);
  const messages = [...(snap?.messages ?? [])].sort((x, y) => x.recorded_at - y.recorded_at);
  const turnOf = (m) => /^\[(\d)\/4\]/.exec((bodyOf(dir, m.id) ?? '').trim())?.[1] ?? null;
  const dialogue = messages.map((m) => ({ who: m.from === aUuid ? 'Minh' : 'Lan', turn: turnOf(m), text: bodyOf(dir, m.id), state: Object.keys(typeof m.state === 'string' ? { [m.state]: 1 } : m.state)[0], depth: m.depth, replyTo: m.reply_to }));
  const alternates = messages.every((m, i) => (i % 2 === 0 ? m.from === aUuid && m.to === bKey : m.from === bKey && m.to === aUuid));
  const chained = messages.every((m, i) => (i === 0 ? m.reply_to === null : m.reply_to === messages[i - 1].id) && m.depth === i);
  const claimedIn = (file, id) => hookLog(dir, file).some((l) => l.kind === 'outcome' && l.event === 'post-tool-use' && l.claimed.includes(id));
  const aTranscript = readTranscript(findTranscript(ctx.homes.a, aUuid));
  const bSeen = bCli === 'claude' ? readTranscript(findTranscript(ctx.homes.b, bKey)).contexts.join('\n') : rolloutText(codexRollout(ctx.codexHome));
  // A Codex rollout keeps the frame inside JSON, so its quotes may be escaped.
  const bSawA = Boolean(aName) && (bSeen.includes(`from="${aName}"`) || bSeen.includes(`from=\\"${aName}\\"`));
  const aSawB = Boolean(bName) && aTranscript.contexts.some((c) => c.includes(`from="${bName}"`));
  const finals = finalTexts(ctx, sessions);
  const lines = (text, label) => text.split('\n').filter((l) => l.trim().startsWith(`${label}:`) && !/none\s*$/.test(l)).length;
  const withNonce = (text, label) => text.split('\n').filter((l) => l.trim().startsWith(`${label}:`) && l.includes(nonce)).length;
  const sends = sendCalls(dir);
  const live2 = [sessions.a, sessions.b].filter(Boolean);
  const checks = {
    versionPin: check(live2.every((s) => s.versionBefore === s.versionAfter) && homesIntact && (!authAfter || (authAfter.isLink && authAfter.loggedIn)), {
      a: sessions.a ? [sessions.a.versionBefore, sessions.a.versionAfter] : null,
      b: sessions.b ? [sessions.b.versionBefore, sessions.b.versionAfter] : null,
      homesIntact,
      codexAuthAfter: authAfter,
    }),
    sends: check(sends.length === 4 && sends.map((x) => x.turn).join('') === '1234' && sends.every((x) => x.exit === 0), sends.map((x) => ({ turn: x.turn, exit: x.exit, report: x.answer.slice(1) }))),
    record: check(messages.length === 4 && alternates && chained && dialogue.every((d) => d.state === 'offered'), { count: messages.length, alternates, chained, states: dialogue.map((d) => d.state), depths: dialogue.map((d) => d.depth) }),
    hooks: check(messages.length === 4 && [0, 2].every((i) => claimedIn('b-hook.log', messages[i].id)) && [1, 3].every((i) => claimedIn('a-hook.log', messages[i].id)), {
      turnsClaimedByB: [0, 2].map((i) => Boolean(messages[i] && claimedIn('b-hook.log', messages[i].id))),
      turnsClaimedByA: [1, 3].map((i) => Boolean(messages[i] && claimedIn('a-hook.log', messages[i].id))),
    }),
    framesSeen: check(bSawA && aSawB, { bSawAFrame: bSawA, aSawBFrame: aSawB }),
    acted: check(withNonce(finals.a, 'LAN') >= 2 && withNonce(finals.b, 'MINH') >= 2, {
      lanLinesWithNonce: withNonce(finals.a, 'LAN'),
      minhLinesWithNonce: withNonce(finals.b, 'MINH'),
      lanLines: lines(finals.a, 'LAN'),
      minhLines: lines(finals.b, 'MINH'),
    }),
    noStranger: check(Object.keys(snap?.bindings ?? {}).length === 2 && messages.every((m) => [aUuid, bKey].includes(m.to)), { bindings: Object.keys(snap?.bindings ?? {}).length }),
  };
  if (ctx.interactive) {
    checks.launched = check(live2.length === 2 && live2.every((s) => s.launch === 'launched'), live2.map((s) => ({ role: s.role, launch: s.launch, detail: s.launchDetail ?? null })));
  }
  return { checks, dialogue: dialogue.map(({ who, turn, text, depth }) => ({ who, turn, depth, text: text?.trim() ?? null })) };
}

async function cmdDemo(name, dry, exampleArg) {
  const interactive = SCENES.includes(name);
  if (!DEMOS.includes(name) && !interactive) die(`unknown demo ${name}`, 2);
  const problem = resourceProblem({ dry });
  if (problem) die(problem);
  const example = exampleArg ?? examplePath();
  if (!fs.existsSync(example)) die(`${example} is missing; run check first`);
  live.hookPreflight('claude', os.homedir());
  const ctx = setUpScene(name, dry, example, interactive);
  const starter = interactive ? await paneStarter(ctx) : printStarter(ctx);
  let run;
  try {
    run = await runScene(ctx, starter);
  } finally {
    starter.finish();
  }
  const { checks, dialogue } = sceneEvidence(ctx, run);
  const sessions = [run.sessions.a, run.sessions.b].filter(Boolean);
  const result = {
    case: name,
    label: ctx.bCli === 'codex' ? 'feasibility demo, not a support claim' : null,
    dry,
    mode: interactive ? 'interactive panes' : 'print',
    invocations: dry ? 0 : sessions.length,
    sessions: sessions.map((s) => ({ role: s.role, cli: s.cli, exit: s.status ?? null, ms: s.endedAt - s.startedAt, version: s.versionBefore })),
    names: { a: run.aName, b: run.bName },
    panes: ctx.panes ? { group: ctx.panes.group, workspace: ctx.panes.workspace, keys: ctx.panes.keys, released: ctx.panes.released ?? null, labels: SCENE_NAMES[name] } : null,
    checks,
    dialogue,
    timeline: { ...run.timeline, sends: (snapshot(ctx.dir)?.messages ?? []).map((m) => m.recorded_at).sort() },
  };
  writeJson(path.join(ctx.dir, 'result.json'), result);
  const failed = Object.entries(checks).filter(([, c]) => c.pass !== true).map(([k, c]) => `${k}=${c.pass}`);
  process.stdout.write(`${name}${dry ? ' (dry)' : ''}: ${failed.length ? `not passed: ${failed.join(', ')}` : 'every check passed'}; ${ctx.dir}/result.json\n`);
  if (run.authAfter) {
    // Last: a replaced auth.json is set aside and its path is the run's last line.
    const refused = authRefusalAfterRun({ link: path.join(ctx.codexHome, 'auth.json'), ...run.authAfter, account: CODEX_TEST_ACCOUNT });
    if (refused) die(refused, 3);
  }
  return failed.length === 0;
}

// ---------------------------------------------------------------- check and report

/** Whether `fgos` is the case wrapper in the shell Claude Code gives the model:
 * Claude Code sources `$HOME/.zshrc` into its snapshot (ignoring ZDOTDIR), so
 * the check sources the same file under the case HOME a real case gets. */
function wrapperWins(example) {
  const dir = layOut('wrapper-check', false, example);
  const env = caseEnv(dir);
  const script = '[ -f "$HOME/.zshrc" ] && source "$HOME/.zshrc"; whence -w fgos; whence -p fgos';
  const out = spawnSync('zsh', ['-c', script], { env, cwd: path.join(dir, 'ws'), encoding: 'utf8' });
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
  for (const name of DEMOS) allPassed = (await cmdDemo(name, true, example)) && allPassed;
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
      cmdStub('claude', rest);
      break;
    case 'stub-codex':
      cmdStub('codex', rest);
      break;
    case 'demo':
      if (!(await cmdDemo(rest[0], rest.includes('--dry')))) process.exitCode = 1;
      break;
    default:
      die('usage: check | run <L1|L2|L3a|L3b> [--dry] | demo <D1|D2|D3|D4> [--dry] | report | probe-hook <event> <ladder> <state> | stub-claude|stub-codex <argv>', 2);
  }
} catch (error) {
  if (error instanceof live.LiveCliError) die(error.message, error.code);
  throw error;
}
