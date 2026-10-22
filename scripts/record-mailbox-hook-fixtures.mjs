#!/usr/bin/env node
/**
 * scripts/record-mailbox-hook-fixtures.mjs
 *
 * Records the real `Stop` and `PostToolUse` hook payloads of Claude Code,
 * Codex and agy on this machine, proves which output shape each CLI injects,
 * and turns the raw recordings into the redacted fixtures under
 * packages/mailbox/contracts/fixtures/hooks/<cli>/
 * (docs/platform/agent-mailbox/spec.md §14, rung V3). Node built-ins only.
 *
 * Every live run spends a little of the owner's account quota: one print-mode
 * prompt per run. Run each mode once; repeat a run only after an
 * environmental failure (expired login, rate limit) and say so.
 *
 * Subcommands
 *
 *   run <cli> <mode> [--fallback] [--agent-head] [--account <name>]
 *       <cli> is claude | codex | agy; <mode> is dump | accept | subagent.
 *       Builds <base>/<cli>/<mode>/ (refuses when it exists), writes the
 *       isolated hook configuration, runs the CLI once under `timeout 300`
 *       and writes versions.json (before and after), run.json and
 *       output.txt. `--fallback` (accept only) offers the other context shape
 *       of the two candidates below, after the first one was refused.
 *       `--agent-head` (claude dump only) starts the head session as a
 *       custom agent (`--agents`, `--agent`), into <mode>-agent-head/.
 *       Before the run it refuses when a hook file other than its own would
 *       load (Claude Code managed settings, agy account-level hook files);
 *       after an agy run it checks agy's log names exactly one hooks file.
 *       For codex it checks, before and after the run, that home/auth.json
 *       is a symlink to the account's auth.json (a token refresh during the
 *       run then writes the real file, never a copy) and that
 *       `codex login status` succeeds; otherwise it stops with exit 3.
 *       `--account <name>` picks the account (default tetnu).
 *   hook <cli> <event> <runDir>
 *       The hook command each CLI is configured with. Reads stdin in full and
 *       writes <runDir>/calls/<n>-<event>.json (stdin as received),
 *       <n>-<event>.ids.json (the three session-identity variables, raw
 *       directory only) and <n>-<event>.ns (its PID namespace link). In accept
 *       mode it prints the candidate output once per event. Always exits 0.
 *   check <cli> accept
 *       Applies the injection rule to the accept run and writes accepted.json.
 *   redact <cli>
 *       Writes the committed fixtures from the raw runs. Refuses when a run's
 *       version changed during the run or the runs used different versions.
 *       Prints every key whose string value it replaced only because the key
 *       was not on the safe list, for a human read.
 *   redact-agent-head <cli>
 *       Adds the `--agent-head` run's Stop and PostToolUse payloads to an
 *       already redacted fixture directory.
 *   clean <cli>
 *       Deletes <base>/<cli>/ (raw calls, the codex home with its rollouts).
 *       It refuses while a set-aside auth.json.rotated exists there (see
 *       scripts/lib/codex-auth-guard.mjs).
 *   run <claude|codex> <probe|probe-pane|ladder|ladder-sum> [--dry]
 *       The measurement modes of the product hook door (see "probes" below):
 *       process facts of the hook and of a tool process, the hook's cwd
 *       after a tool `cd`, and the largest PostToolUse context injected
 *       inline. `--dry` runs against the stub CLI under <base>-dry/.
 *   summarize <cli> <probe mode> [--dry]
 *       Writes and prints summary.json: per hook call and per tool dump the
 *       facts the report tables read, and for ladder the per-step verdict.
 *   clean-probe <cli> <probe mode> [--dry]
 *       Deletes one probe run directory, with clean's auth refusal.
 *   probe-hook | probe-sibling | probe-tool
 *       The probe hooks and the tool dump. The dry runs' CLI is
 *       test/live/mailbox-recorder-stub.mjs, outside the shipped scripts,
 *       because it runs the configured hook and tool commands through a
 *       shell.
 *
 * Where: <base> is ${TMPDIR:-/tmp}/fgos-work/mailbox-v3-record, outside every
 * git checkout, so the repository's own hook files (.claude/settings.json,
 * .agents/hooks.json) never load. That does not keep a full-bypass agent
 * from writing the repository or the account's real CLI directory; the
 * recording prompts are benign for that reason. Each CLI is started with the allowlisted environment of
 * scripts/lib/mailbox-live-cli.mjs (no session-identity variable, an empty
 * ZDOTDIR, auto-update off), so a recorded id variable is one the CLI set
 * itself. The run guards live in that module, shared with the live suite.
 *
 * Exact commands (cwd <runDir>/ws, environment as above):
 *   claude: claude -p --model haiku --dangerously-skip-permissions
 *           --setting-sources project --settings <runDir>/settings.json <prompt>
 *           (the workspace has no project settings, so only --settings loads;
 *           the installed version lists user, project, local as sources)
 *   codex:  CODEX_HOME=<runDir>/home codex exec --dangerously-bypass-hook-trust
 *           --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check
 *           -C <runDir>/ws <prompt>
 *           with home/auth.json a symlink to ${CODEX_ACCOUNTS[tetnu]}/auth.json,
 *           home/config.toml enabling hooks and trusting the workspace, and
 *           home/hooks.json
 *   agy:    HOME=${AGY_ACCOUNTS[tetnu]} agy --dangerously-skip-permissions
 *           --model gemini-3.8-flash-low --log-file <runDir>/agy.log -p <prompt>
 *           (agy 1.4.4 reads the word right after -p as the prompt)
 *           with hooks in <runDir>/ws/.agents/hooks.json (flat Stop, nested
 *           PostToolUse)
 * The account homes are read with `zsh -ic 'print -r -- ${CODEX_ACCOUNTS[tetnu]}'`
 * (and AGY_ACCOUNTS), never from the "current" account.
 *
 * What the CLIs leave outside <base>, which this script never deletes:
 *   claude: ~/.claude/projects/<slug of the workspace>/<session>.jsonl
 *   agy:    conversations under ${AGY_ACCOUNTS[tetnu]}/.gemini/antigravity-cli/
 *           (the payload's transcriptPath names the conversation's transcript)
 *           and possibly a trustedWorkspaces entry for the workspace
 *
 * Re-record one CLI: run dump, run accept, check accept, run subagent,
 * redact, then `cargo test -p fgos-mailbox --test fixtures_contract`, a human
 * read of every fixture, and clean.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { authRefusalAfterRun, removeRunDir } from './lib/codex-auth-guard.mjs';
import * as live from './lib/mailbox-live-cli.mjs';
import { repositoryDirs } from './lib/git-dir-layout.mjs';

const SCRIPT = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(SCRIPT), '..');
/** The dry runs' CLI (a checkout only: `test/` is not shipped). */
const STUB_SCRIPT = path.join(REPO_ROOT, 'test', 'live', 'mailbox-recorder-stub.mjs');
const BASE = path.join(process.env.TMPDIR || '/tmp', 'fgos-work', 'mailbox-v3-record');
const FIXTURES = path.join(REPO_ROOT, 'packages', 'mailbox', 'contracts', 'fixtures', 'hooks');
/** The account a run uses: `--account <name>`, or `tetnu`. */
const ACCOUNT = (() => {
  const at = process.argv.indexOf('--account');
  return at > 0 ? process.argv[at + 1] : 'tetnu';
})();
const REDACTION_RULES_VERSION = 1;

const { ID_VARS, REMOVED_VARS } = live;

/** The agent a `--agent-head` Claude Code run starts its head session as. */
const AGENT_HEAD = 'mbx-head';

const TOOL_COMMAND =
  "env | grep -E '^(CODEX_THREAD_ID|CLAUDE_CODE_SESSION_ID|FGOS_SESSION_ID)=' > tool-env.txt; echo mailbox-fixture";
const SUB_COMMAND =
  "env | grep -E '^(CODEX_THREAD_ID|CLAUDE_CODE_SESSION_ID|FGOS_SESSION_ID)=' > sub-env.txt; echo mailbox-subagent";
const PROMPTS = {
  dump: `Run the shell command \`${TOOL_COMMAND}\` once, then answer \`done\`.`,
  accept: `Run the shell command \`${TOOL_COMMAND}\` once, then answer \`done\`.`,
  subagent: `Use a subagent (your Task/Agent tool or the CLI's equivalent) to run \`${SUB_COMMAND}\`, then answer \`done\`.`,
};

/** Hook events configured per CLI. agy rejects a whole hook file it cannot
 * read, so it gets only the two events whose shapes were measured. */
const EVENTS = {
  claude: ['PostToolUse', 'Stop', 'SubagentStart', 'SubagentStop'],
  codex: ['PostToolUse', 'Stop', 'SubagentStart', 'SubagentStop'],
  agy: ['PostToolUse', 'Stop'],
};

/** Candidate outputs, tried in order. `{{TEXT}}` is the canary text. */
const CONTEXT_SHAPES = {
  nested: { hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: '{{TEXT}}' } },
  flat: { additionalContext: '{{TEXT}}' },
};
const CONTEXT_ORDER = { claude: ['nested', 'flat'], codex: ['nested', 'flat'], agy: ['flat', 'nested'] };
const BLOCK_SHAPE = { decision: 'block', reason: '{{TEXT}}' };

/**
 * Transcript record types, per CLI, that prove the model was given hook
 * context (`inject`), against types that only log a hook's raw output
 * (`raw`). A canary found only in a raw type is not injection.
 * The codex and agy entries were read from their dump runs (see each
 * fixture's vectors.json source).
 */
const RECORD_TYPES = {
  claude: { inject: ['attachment:hook_additional_context'], raw: ['attachment:hook_success'] },
  // The rollout's model-input records; no hook record type appeared in the
  // dump run's rollout.
  codex: { inject: ['response_item:message:developer', 'response_item:message:user'], raw: [] },
  agy: { inject: [], raw: [] },
};

function die(message, code = 2) {
  process.stderr.write(`record-mailbox-hook-fixtures: ${message}\n`);
  process.exit(code);
}

function runDirOf(cli, mode) {
  return path.join(BASE, cli, mode);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function accountHome(cli) {
  return live.accountHome(cli, ACCOUNT);
}

function accountNames() {
  return live.accountNames(ACCOUNT);
}

function hookCommand(cli, event, runDir) {
  return `node '${SCRIPT}' hook ${cli} ${event} '${runDir}'`;
}

function hookEntry(cli, event, runDir) {
  return { type: 'command', command: hookCommand(cli, event, runDir), timeout: 30 };
}

/** After an agy run: its log must name exactly one loaded hooks file, the workspace's. */
function agyLoadedOneHookFile(runDir) {
  const log = fs.readFileSync(path.join(runDir, 'agy.log'), 'utf8');
  const files = [...log.matchAll(/loaded \d+ named hooks from (\d+) hooks\.json file/g)].reduce((n, m) => n + Number(m[1]), 0);
  if (files !== 1) die(`agy loaded ${files} hooks.json files; only the workspace's may load`);
}

function setUp(cli, mode, runDir, agentHead) {
  const ws = path.join(runDir, 'ws');
  fs.mkdirSync(ws, { recursive: true });
  live.assertOutsideCheckout(ws);
  const args = [];
  const env = {};
  if (cli === 'claude') {
    const hooks = {};
    for (const event of EVENTS.claude) {
      const group = { hooks: [hookEntry(cli, event, runDir)] };
      hooks[event] = [event === 'PostToolUse' ? { matcher: '*', ...group } : group];
    }
    writeJson(path.join(runDir, 'settings.json'), { hooks });
    // A head session started with --agent: does its own event carry
    // agent_type or agent_id?
    const extra = agentHead
      ? ['--agents', JSON.stringify({ [AGENT_HEAD]: { description: 'Mailbox fixture head agent', prompt: 'Follow the user instruction exactly.' } }), '--agent', AGENT_HEAD]
      : [];
    args.push(...live.claudeArgs({ settings: path.join(runDir, 'settings.json'), prompt: PROMPTS[mode], extra }));
  } else if (cli === 'codex') {
    const home = path.join(runDir, 'home');
    const hooks = {};
    for (const event of EVENTS.codex) hooks[event] = [{ hooks: [hookEntry(cli, event, runDir)] }];
    live.makeCodexHome({ home, accountAuth: codexAccountAuth(), ws, hooks });
    env.CODEX_HOME = home;
    args.push(...live.codexArgs({ ws, prompt: PROMPTS[mode] }));
  } else {
    fs.mkdirSync(path.join(ws, '.agents'), { recursive: true });
    writeJson(path.join(ws, '.agents', 'hooks.json'), {
      'mailbox-fixture': {
        enabled: true,
        Stop: [hookEntry(cli, 'Stop', runDir)],
        PostToolUse: [{ matcher: '.*', hooks: [hookEntry(cli, 'PostToolUse', runDir)] }],
      },
    });
    env.HOME = accountHome('agy');
    // agy 1.4.4 takes the word after -p as the prompt, so -p comes last.
    args.push('--dangerously-skip-permissions', '--model', 'gemini-3.8-flash-low',
      '--log-file', path.join(runDir, 'agy.log'), '-p', PROMPTS[mode]);
  }
  return { ws, args, env };
}

/**
 * The codex login guard. A live account may refresh its tokens during a run
 * and rewrite auth.json; that is fine as long as the run home's auth.json is
 * still a symlink to the account's file, so the refresh lands in the real
 * file. A copy must never be refreshed: that burns the real refresh token.
 */
function codexAccountAuth() {
  return path.join(accountHome('codex'), 'auth.json');
}

function codexAuthState(runDir, env) {
  return live.codexAuthState({ home: path.join(runDir, 'home'), accountAuth: codexAccountAuth(), env });
}

function cmdRun(cli, mode, flags) {
  if (!EVENTS[cli]) die(`unknown cli ${cli}`);
  if (!PROMPTS[mode]) die(`unknown mode ${mode}`);
  const fallback = flags.includes('--fallback');
  if (fallback && mode !== 'accept') die('--fallback applies to accept only');
  const agentHead = flags.includes('--agent-head');
  if (agentHead && !(cli === 'claude' && mode === 'dump')) die('--agent-head applies to claude dump only');
  const runDir = runDirOf(cli, mode) + (fallback ? '-fallback' : '') + (agentHead ? '-agent-head' : '');
  if (fs.existsSync(runDir)) die(`${runDir} exists; remove it to record again`);
  fs.mkdirSync(runDir, { recursive: true });
  const order = CONTEXT_ORDER[cli];
  const contextShape = fallback ? order[1] : order[0];
  const ctx = `MBX-CTX-${crypto.randomBytes(4).toString('hex')}`;
  const stop = `MBX-STOP-${crypto.randomBytes(4).toString('hex')}`;
  writeJson(path.join(runDir, 'mode.json'), {
    cli,
    mode,
    contextShape,
    canaries: { PostToolUse: ctx, Stop: stop },
    texts: {
      PostToolUse: `Mailbox fixture check: end your final answer with the token ${ctx}.`,
      Stop: `Mailbox fixture check: before you stop, reply with the token ${stop}.`,
    },
  });
  const { ws, args, env: extra } = setUp(cli, mode, runDir, agentHead);
  const env = live.cliEnv({ zdotdir: path.join(runDir, 'zdot'), extra });
  live.hookPreflight(cli, env.HOME);
  const authBefore = cli === 'codex' ? codexAuthState(runDir, env) : null;
  if (authBefore && !(authBefore.isLink && authBefore.loggedIn)) {
    die(`the ${ACCOUNT} codex login is not usable before the run (link ${authBefore.isLink}, logged in ${authBefore.loggedIn})`, 3);
  }
  const before = live.cliVersion(cli, env);
  const startedAt = new Date().toISOString();
  const child = spawnSync('timeout', ['300', cli, ...args], {
    cwd: ws,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
  const after = live.cliVersion(cli, env);
  fs.writeFileSync(path.join(runDir, 'output.txt'), `${child.stdout || ''}\n--- stderr ---\n${child.stderr || ''}`);
  writeJson(path.join(runDir, 'versions.json'), { before, after });
  writeJson(path.join(runDir, 'run.json'), {
    cli,
    mode,
    startedAt,
    exit: child.status,
    command: [cli, ...args.map((a) => (a === PROMPTS[mode] ? '<prompt>' : a.startsWith('{') ? `'${a}'` : a))].join(' '),
    removedVars: REMOVED_VARS,
    inheritedVars: live.INHERITED_VARS,
    recorderPidNamespace: fs.readlinkSync('/proc/self/ns/pid'),
  });
  process.stdout.write(`${cli} ${mode}: exit ${child.status}; versions ${before} -> ${after}; ${callsOf(runDir).length} hook calls; ${runDir}\n`);
  if (cli === 'agy') agyLoadedOneHookFile(runDir);
  if (authBefore) {
    const authAfter = codexAuthState(runDir, env);
    process.stdout.write(`codex auth.json: ${authAfter.isLink ? 'still a link to the account file' : 'NOT A LINK'}; login status ${authAfter.loggedIn ? 'ok' : 'FAILED'}\n`);
    const refused = authRefusalAfterRun({ link: path.join(runDir, 'home', 'auth.json'), ...authAfter, account: ACCOUNT });
    if (refused) die(refused, 3);
  }
}

function readStdin() {
  try {
    return fs.readFileSync(0);
  } catch {
    return Buffer.alloc(0);
  }
}

function cmdHook(cli, event, runDir) {
  try {
    const input = readStdin();
    const calls = path.join(runDir, 'calls');
    fs.mkdirSync(calls, { recursive: true });
    // One sequence across all events, so the files keep the call order.
    let n = 1;
    for (;;) {
      try {
        fs.closeSync(fs.openSync(path.join(calls, `${n}.seq`), 'wx'));
        break;
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        n += 1;
      }
    }
    fs.writeFileSync(path.join(calls, `${n}-${event}.json`), input);
    const ids = Object.fromEntries(ID_VARS.map((name) => [name, process.env[name] ?? null]));
    writeJson(path.join(calls, `${n}-${event}.ids.json`), ids);
    fs.writeFileSync(path.join(calls, `${n}-${event}.ns`), fs.readlinkSync('/proc/self/ns/pid'));
    writeJson(path.join(calls, `${n}-${event}.proc.json`), processFacts(input));
    const modeFile = path.join(runDir, 'mode.json');
    const mode = fs.existsSync(modeFile) ? readJson(modeFile) : null;
    if (mode?.mode !== 'accept' || !mode.texts[event]) return;
    try {
      fs.closeSync(fs.openSync(path.join(runDir, `printed-${event}`), 'wx'));
    } catch {
      return;
    }
    const shape = event === 'Stop' ? BLOCK_SHAPE : CONTEXT_SHAPES[mode.contextShape];
    const output = JSON.stringify(shape).replace('{{TEXT}}', mode.texts[event]);
    fs.writeFileSync(path.join(runDir, `printed-${event}.json`), output);
    process.stdout.write(output);
  } catch (error) {
    try {
      fs.appendFileSync(path.join(runDir, 'hook-errors.txt'), `${event}: ${error.stack}\n`);
    } catch {
      // nothing left to report to; the hook still exits 0
    }
  } finally {
    process.exitCode = 0;
  }
}

/** `/proc/<pid>/stat` fields after the command name, which may hold spaces. */
function statFields(pid) {
  const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
  return stat.slice(stat.lastIndexOf(')') + 2).split(' ');
}

/**
 * The hook process and what it can see of the CLI above it, for the head
 * finder (raw directory only; `redact` never reads it, since `callsOf` lists
 * only `<n>-<event>.json`): its ancestry up to 8 levels, the names (never the
 * values) of its environment variables, and for each ancestor that has a
 * Claude Code session file the facts of that file, compared without copying
 * an id.
 */
function processFacts(input) {
  let payloadSession = null;
  try {
    payloadSession = JSON.parse(input.toString('utf8')).session_id ?? null;
  } catch {
    payloadSession = null;
  }
  const sessions = path.join(os.homedir(), '.claude', 'sessions');
  const chain = [];
  let pid = process.pid;
  for (let level = 0; level < 8 && pid > 0; level += 1) {
    let fields;
    try {
      fields = statFields(pid);
    } catch {
      break;
    }
    // Field 4 is ppid, 7 tty_nr, 22 starttime; fields[0] is field 3.
    const entry = {
      pid,
      ppid: Number(fields[1]),
      comm: fs.readFileSync(`/proc/${pid}/comm`, 'utf8').trim(),
      exe: (() => {
        try {
          return path.basename(fs.readlinkSync(`/proc/${pid}/exe`));
        } catch {
          return null;
        }
      })(),
      tty: Number(fields[4]) !== 0,
    };
    const file = path.join(sessions, `${pid}.json`);
    if (fs.existsSync(file)) {
      const starttime = statFields(pid)[19];
      const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
      entry.claudeSession = {
        keys: Object.keys(doc).sort(),
        kind: doc.kind ?? null,
        entrypoint: doc.entrypoint ?? null,
        nameSource: doc.nameSource ?? null,
        nameHasTwoHexSuffix: typeof doc.name === 'string' && /-[0-9a-f]{2}$/.test(doc.name),
        version: doc.version ?? null,
        sessionIdIsPayloadSession: payloadSession !== null && doc.sessionId === payloadSession,
        filePidIsThisPid: doc.pid === pid,
        procStart: doc.procStart === undefined ? null : String(doc.procStart),
        statStarttime: starttime,
      };
    }
    chain.push(entry);
    pid = entry.ppid;
  }
  return { pid: process.pid, chain, envNames: Object.keys(process.env).sort() };
}

function callsOf(runDir) {
  const dir = path.join(runDir, 'calls');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .map((f) => /^(\d+)-([A-Za-z]+)\.json$/.exec(f))
    .filter(Boolean)
    .map((m) => {
      const base = path.join(dir, `${m[1]}-${m[2]}`);
      let payload = null;
      try {
        payload = readJson(`${base}.json`);
      } catch {
        payload = null;
      }
      return {
        n: Number(m[1]),
        event: m[2],
        payload,
        ids: readJson(`${base}.ids.json`),
        ns: fs.readFileSync(`${base}.ns`, 'utf8'),
      };
    })
    .sort((a, b) => a.n - b.n);
}

/** The type signature of one transcript record. */
function recordType(record) {
  const parts = [record.type];
  if (record.attachment?.type) parts.push(record.attachment.type);
  if (record.payload?.type) parts.push(record.payload.type);
  if (record.payload?.role) parts.push(record.payload.role);
  if (record.message?.role && !record.attachment) parts.push(record.message.role);
  if (record.role) parts.push(record.role);
  if (record.source) parts.push(String(record.source));
  return parts.filter((p) => p !== undefined).join(':');
}

function transcriptFiles(calls) {
  const files = new Set();
  for (const call of calls) {
    const file = call.payload?.transcript_path ?? call.payload?.transcriptPath;
    if (file) files.add(file);
  }
  return [...files].filter((f) => fs.existsSync(f));
}

function recordsWith(files, needle) {
  const found = [];
  for (const file of files) {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      if (!line.includes(needle)) continue;
      try {
        found.push(recordType(JSON.parse(line)));
      } catch {
        found.push('unparsed-line');
      }
    }
  }
  return found;
}

function isContinuedStop(cli, payload) {
  if (cli === 'agy') return payload?.executionNum === 1;
  return payload?.stop_hook_active === true;
}

function modelEcho(types) {
  return types.some((t) => /assistant|model/i.test(t) && !/attachment|hook/i.test(t));
}

function cmdCheck(cli, mode) {
  if (mode !== 'accept') die('check takes the accept mode only');
  const results = {};
  for (const suffix of ['', '-fallback']) {
    const runDir = runDirOf(cli, 'accept') + suffix;
    if (!fs.existsSync(runDir)) continue;
    const meta = readJson(path.join(runDir, 'mode.json'));
    const calls = callsOf(runDir);
    const files = transcriptFiles(calls);
    const types = RECORD_TYPES[cli];
    const ctxTypes = recordsWith(files, meta.canaries.PostToolUse);
    const stopTypes = recordsWith(files, meta.canaries.Stop);
    const ctxMatched = ctxTypes.filter((t) => types.inject.includes(t));
    const stops = calls.filter((c) => c.event === 'Stop');
    const continued = stops.some((c) => isContinuedStop(cli, c.payload));
    results[meta.contextShape] = {
      transcripts: files.length,
      PostToolUse: {
        printed: fs.existsSync(path.join(runDir, 'printed-PostToolUse.json')),
        accepted: ctxMatched.length > 0,
        matchedType: ctxMatched[0] ?? null,
        rejectedTypes: [...new Set(ctxTypes.filter((t) => types.raw.includes(t) || (/hook/.test(t) && !types.inject.includes(t))))],
        modelEcho: modelEcho(ctxTypes),
      },
      Stop: {
        printed: fs.existsSync(path.join(runDir, 'printed-Stop.json')),
        accepted: continued,
        continuedStopCall: continued,
        modelEcho: modelEcho(stopTypes),
        types: [...new Set(stopTypes)],
      },
    };
    writeJson(path.join(runDir, 'accepted.json'), results[meta.contextShape]);
  }
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
}

// ---------------------------------------------------------------- redaction

const UUID = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;
const LONG_HEX = /\b[0-9a-fA-F]{16,}\b/g;
const ID_KEY = /(^|_)(session|thread|conversation|prompt|tool_?use|turn|agent|execution|trajectory|step|cascade|request)_?id$|^id$/i;
const SAFE_KEYS = new Set(['hook_event_name', 'hookEventName', 'tool_name', 'toolName', 'permission_mode', 'effort', 'level', 'reasoning_effort']);
const PLACEHOLDER = /^00000000-0000-4000-8000-\d{12}$/;

function makeRedactor(cli, firstId = 1) {
  const ids = new Map();
  const unknownKeys = new Set();
  const home = os.homedir();
  const user = os.userInfo().username;
  const paths = [
    [BASE, `/run-dir`],
    [REPO_ROOT, '/repo'],
    [path.join(path.dirname(REPO_ROOT), 'forgent'), '/repo'],
    [home, '/home/user'],
  ].map(([from, to]) => [from, to, from.replace(/[/.]/g, '-'), to.replace(/\//g, '-')]);
  paths.sort((a, b) => b[0].length - a[0].length);
  const accounts = accountNames();
  const safeValues = new Set(['done', 'mailbox-fixture', 'mailbox-subagent', TOOL_COMMAND, SUB_COMMAND, '{{TEXT}}', ...Object.values(PROMPTS)]);

  const idFor = (value) => {
    if (PLACEHOLDER.test(value)) return value;
    if (!ids.has(value)) ids.set(value, `00000000-0000-4000-8000-${String(ids.size + firstId).padStart(12, '0')}`);
    return ids.get(value);
  };

  const scrub = (text) => {
    let out = text.replace(UUID, (m) => idFor(m.toLowerCase())).replace(LONG_HEX, (m) => idFor(m.toLowerCase()));
    for (const [from, to, fromSlug, toSlug] of paths) {
      out = out.split(from).join(to).split(fromSlug).join(toSlug);
    }
    for (const name of accounts) out = out.replace(new RegExp(`\\b${name}\\b`, 'g'), 'account');
    out = out.split(user).join('user');
    return out;
  };

  const isPathLike = (text) =>
    /^-?(\/run-dir|\/repo|\/home\/user|-run-dir|-repo|-home-user)([/._-][A-Za-z0-9._/-]*)?$/.test(text);

  const value = (key, text, where) => {
    if (text === '') return text;
    if (ID_KEY.test(key)) return idFor(text);
    const safeKey = SAFE_KEYS.has(key) || /(^|\.)toolCall\.name$/.test(where);
    if (safeKey && /^[A-Za-z0-9_.:-]{1,64}$/.test(text)) return text;
    if (safeValues.has(text)) return text;
    const scrubbed = scrub(text);
    if (PLACEHOLDER.test(scrubbed) || isPathLike(scrubbed) || safeValues.has(scrubbed)) return scrubbed;
    if (text.length > 0) unknownKeys.add(where);
    return '<redacted>';
  };

  const walk = (node, key, where) => {
    if (Array.isArray(node)) return node.map((item, i) => walk(item, key, `${where}[${i}]`));
    if (node && typeof node === 'object') {
      return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, walk(v, k, where ? `${where}.${k}` : k)]));
    }
    if (typeof node === 'string') return value(key, node, where);
    return node;
  };

  return { redact: (doc, label) => walk(doc, '', label), unknownKeys, idFor };
}

function versionOf(runDir) {
  const v = readJson(path.join(runDir, 'versions.json'));
  if (v.before !== v.after) die(`${runDir}: the CLI version changed during the run (${v.before} -> ${v.after})`);
  return v.before;
}

function cmdRedact(cli) {
  const modes = ['dump', 'accept', 'subagent'];
  const runs = Object.fromEntries(modes.map((m) => [m, runDirOf(cli, m)]));
  const fallbackDir = `${runs.accept}-fallback`;
  for (const [mode, dir] of Object.entries(runs)) if (!fs.existsSync(dir)) die(`missing run ${mode}`);
  const allDirs = [...Object.values(runs), ...(fs.existsSync(fallbackDir) ? [fallbackDir] : [])];
  const versions = new Set(allDirs.map(versionOf));
  if (versions.size !== 1) die(`the runs used different versions: ${[...versions].join(', ')}`);
  const version = /\d+\.\d+\.\d+/.exec([...versions][0])?.[0] ?? [...versions][0];

  // The fallback run stands in for the accept run only when its context
  // shape was injected.
  let acceptDir = runs.accept;
  let accepted = readJson(path.join(acceptDir, 'accepted.json'));
  if (!accepted.PostToolUse.accepted && fs.existsSync(fallbackDir)) {
    const fallback = readJson(path.join(fallbackDir, 'accepted.json'));
    if (fallback.PostToolUse.accepted) {
      acceptDir = fallbackDir;
      accepted = fallback;
    }
  }
  if (!accepted.Stop.accepted) die('the Stop canary was not injected; no block shape is proven');
  const contextAccepted = accepted.PostToolUse.accepted;

  const { redact, unknownKeys, idFor } = makeRedactor(cli);
  const outDir = path.join(FIXTURES, cli);
  // The vectors the tests read are kept across a re-recording.
  const vectorsFile = path.join(outDir, 'vectors.json');
  const previous = fs.existsSync(vectorsFile) ? readJson(vectorsFile) : null;
  const keptVectors = previous ? previous.vectors : [];
  // A re-recording keeps naming the recording it replaces, so every version
  // the adapters contract lists stays traceable to a recording.
  const replaced = /^recorded (\S+) from (\S+ \S+)/.exec(previous?.source ?? '');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const dumpCalls = callsOf(runs.dump);
  const acceptCalls = callsOf(acceptDir);
  const subCalls = callsOf(runs.subagent);
  // Claude and Codex mark a subagent's event with agent_id or agent_type; an
  // agy subagent runs as its own conversation, so its events are told apart
  // only by a conversationId other than the head's (the run's first call).
  const headConversation = (calls) => calls[0]?.payload?.conversationId;
  const subordinateIn = (calls) => (p) =>
    Boolean(p) && ('agent_id' in p || 'agent_type' in p || (cli === 'agy' && p.conversationId !== headConversation(calls)));
  const isSubordinate = subordinateIn(dumpCalls);
  const pick = (calls, test, what) => {
    const call = calls.find(test);
    if (!call) die(`no ${what} was recorded`);
    return call;
  };
  const stop = pick(dumpCalls, (c) => c.event === 'Stop' && !isContinuedStop(cli, c.payload), 'first Stop in dump');
  const post = pick(dumpCalls, (c) => c.event === 'PostToolUse' && !isSubordinate(c.payload), 'head PostToolUse in dump');
  const continued = pick(acceptCalls, (c) => c.event === 'Stop' && isContinuedStop(cli, c.payload), 'continued Stop in accept');
  const subPost = subCalls.find((c) => c.event === 'PostToolUse' && subordinateIn(subCalls)(c.payload));
  const subStop = subCalls.find((c) => c.event === 'Stop' && subordinateIn(subCalls)(c.payload));

  const write = (name, doc) => writeJson(path.join(outDir, name), redact(doc, name));
  write('stop.json', stop.payload);
  write('stop-continued.json', continued.payload);
  write('post-tool-use.json', post.payload);
  if (subPost) write('post-tool-use-subagent.json', subPost.payload);
  if (subStop) write('stop-subagent.json', subStop.payload);

  const meta = readJson(path.join(acceptDir, 'mode.json'));
  writeJson(path.join(outDir, 'accepted-stop.json'), BLOCK_SHAPE);
  if (contextAccepted) writeJson(path.join(outDir, 'accepted-post-tool-use.json'), CONTEXT_SHAPES[meta.contextShape]);

  const idsOf = (vars) => Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, v === null ? null : idFor(v)]));
  const toolEnv = (dir, file) => {
    const f = path.join(dir, 'ws', file);
    if (!fs.existsSync(f)) return null;
    const vars = Object.fromEntries(ID_VARS.map((v) => [v, null]));
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
      const m = /^([A-Z_]+)=(.*)$/.exec(line);
      if (m && m[1] in vars) vars[m[1]] = idFor(m[2]);
    }
    return vars;
  };
  writeJson(path.join(outDir, 'env.json'), {
    note: 'Session-identity variables seen by the hook process and by the tool process of each recorded call, as id placeholders that keep equality with the payload placeholders; null means unset. The parent environment had them removed.',
    hookIdVars: { 'stop.json': idsOf(stop.ids), 'post-tool-use.json': idsOf(post.ids), ...(subPost ? { 'post-tool-use-subagent.json': idsOf(subPost.ids) } : {}) },
    toolIdVars: toolEnv(runs.dump, 'tool-env.txt'),
    subagentToolIdVars: toolEnv(runs.subagent, 'sub-env.txt'),
  });

  const run = (dir) => readJson(path.join(dir, 'run.json'));
  const nsSame = [...dumpCalls, ...acceptCalls, ...subCalls].every((c) => c.ns === run(runs.dump).recorderPidNamespace);
  // The operator's notes: observations the recorder cannot derive itself (which user hooks
  // fired, what a subagent's tool process saw); a re-recording without them drops them.
  const notes = fs.existsSync(path.join(BASE, cli, 'notes.txt')) ? fs.readFileSync(path.join(BASE, cli, 'notes.txt'), 'utf8').trim().split('\n').join('; ') : '';
  const source = [
    `recorded ${run(runs.dump).startedAt.slice(0, 10)} from ${cli} ${version} on this machine by scripts/record-mailbox-hook-fixtures.mjs (redaction rules version ${REDACTION_RULES_VERSION})`,
    ...allDirs.map((d) => `${path.basename(d)} run: \`${run(d).command}\` (exit ${run(d).exit})`),
    replaced && replaced[2] !== `${cli} ${version}` ? `replaces the recording of ${replaced[1]} from ${replaced[2]}` : '',
    `variables removed from the parent environment: ${REMOVED_VARS.join(', ')}`,
    contextAccepted
      ? `injection at PostToolUse (${meta.contextShape} shape) matched record type ${accepted.PostToolUse.matchedType}; types rejected as raw hook output: ${accepted.PostToolUse.rejectedTypes.join(', ') || 'none'}; model echoed the context canary: ${accepted.PostToolUse.modelEcho}`
      : `no PostToolUse context shape was injected (tried: ${allDirs.filter((d) => d.includes('accept')).map((d) => readJson(path.join(d, 'mode.json')).contextShape).join(', ')})`,
    `Stop block accepted by a continued Stop call: ${accepted.Stop.continuedStopCall}; model echoed the Stop canary: ${accepted.Stop.modelEcho}`,
    `hook PID namespace ${nsSame ? 'is the same as' : 'DIFFERS from'} the recorder's`,
    subPost ? 'post-tool-use-subagent.json: recorded' : 'post-tool-use-subagent.json: not recorded (see notes)',
    subStop ? 'stop-subagent.json: the subagent fired a Stop of its own, recorded' : 'the subagent fired no Stop of its own',
    notes,
  ].filter(Boolean).join('; ');
  writeJson(path.join(outDir, 'vectors.json'), { cli, source: scrubSource(source), vectors: keptVectors });
  if (unknownKeys.size) process.stdout.write(`replaced because not on the safe list:\n  ${[...unknownKeys].join('\n  ')}\n`);
  process.stdout.write(`${cli}: fixtures written to ${outDir}\n`);
}

/** The source line is prose the recorder wrote itself, so it is not put
 * through the allowlist; only its paths and account names are replaced. */
function scrubSource(source) {
  let out = source.split(BASE).join('/run-dir').split(REPO_ROOT).join('/repo').split(os.homedir()).join('/home/user');
  for (const name of accountNames()) out = out.replace(new RegExp(`\\b${name}\\b`, 'g'), 'account');
  return out.split(os.userInfo().username).join('user');
}

/**
 * Adds the `--agent-head` run of Claude Code to the committed fixtures as
 * stop-agent-head.json and post-tool-use-agent-head.json, numbering its ids
 * after the highest placeholder already committed for the CLI so no false
 * equality appears, and appends what it saw to vectors.json's source.
 */
function cmdRedactAgentHead(cli) {
  const runDir = `${runDirOf(cli, 'dump')}-agent-head`;
  if (!fs.existsSync(runDir)) die(`missing run ${runDir}`);
  const outDir = path.join(FIXTURES, cli);
  const vectorsFile = path.join(outDir, 'vectors.json');
  const vectors = readJson(vectorsFile);
  // vectors.json only refers to the payloads' placeholders (a re-recording
  // keeps it), so it is left out of the count.
  const committed = fs
    .readdirSync(outDir)
    .filter((f) => f !== 'vectors.json')
    .map((f) => fs.readFileSync(path.join(outDir, f), 'utf8'))
    .join('\n');
  const highest = Math.max(0, ...[...committed.matchAll(/00000000-0000-4000-8000-(\d{12})/g)].map((m) => Number(m[1])));
  const { redact } = makeRedactor(cli, highest + 1);
  const calls = callsOf(runDir);
  const pick = (event) => calls.find((c) => c.event === event) ?? die(`no ${event} in ${runDir}`);
  const post = pick('PostToolUse');
  const stop = pick('Stop');
  writeJson(path.join(outDir, 'post-tool-use-agent-head.json'), redact(post.payload, 'post-tool-use-agent-head.json'));
  writeJson(path.join(outDir, 'stop-agent-head.json'), redact(stop.payload, 'stop-agent-head.json'));
  const run = readJson(path.join(runDir, 'run.json'));
  const marks = (p) => `agent_id ${'agent_id' in p ? 'present' : 'absent'}, agent_type ${'agent_type' in p ? 'present' : 'absent'}`;
  vectors.source += `; agent-head run (${versionOf(runDir)}): \`${run.command}\` (exit ${run.exit}), the head session started with --agent; its own PostToolUse: ${marks(post.payload)}; its own Stop: ${marks(stop.payload)}`;
  vectors.source = scrubSource(vectors.source);
  writeJson(vectorsFile, vectors);
  process.stdout.write(`${cli}: agent-head fixtures written to ${outDir}\n`);
}

function cmdClean(cli) {
  const dir = path.join(BASE, cli);
  const refused = removeRunDir(dir);
  if (refused) die(refused, 3);
  process.stdout.write(`removed ${dir}\n`);
}

// ---------------------------------------------------------------- probes (process facts, context ladder)

/**
 * The probe modes measure what the product hook entry decides on, through
 * the command string the product installer writes: the hook is an
 * executable at `<ws>/.fgos/installation/bin/fgos`, so the CLI spawns it
 * exactly as it spawns the project shim.
 *
 *   probe       one hook per event (PostToolUse plain, Stop guarded), and a
 *               prompt that dumps a tool process's ancestry, `cd`s into
 *               ws/elsewhere and dumps again: hook vs tool facts, and the
 *               hook's cwd after the tool's `cd`.
 *   probe-pane  probe in an interactive Claude Code in a herdr pane opened
 *               through Terminal Control (claude only).
 *   ladder      a PostToolUse hook that prints, per step `echo step<n>`, a
 *               context of the step's size (step 8 in 3-byte characters);
 *               steps 11-14 repeat the four largest sizes while a sibling
 *               hook prints a fixed 2,048-byte context.
 *   ladder-sum  sizes 5,120-9,216 bytes, each beside the sibling: whether the
 *               threshold applies per hook or to the sum of one event's hooks.
 *
 * `--dry` runs the same layout against the stub CLI (`stub <cli>`) under
 * <base>-dry/, with no model and no account. A real run writes spawned.json
 * before the CLI starts and refuses a run directory that has one.
 */
const PROBE_MODES = ['probe', 'probe-pane', 'ladder', 'ladder-sum'];
const DRY_BASE = `${BASE}-dry`;
const PROBE_MIN_FREE_GB = 8;
const CONTRACTS = path.join(REPO_ROOT, 'packages', 'mailbox', 'contracts');
const CLI_BIN = { claude: path.join(os.homedir(), '.local', 'bin', 'claude'), codex: path.join(os.homedir(), '.local', 'bin', 'codex') };
/** Bytes of each ladder step's context; steps 11-14 repeat the four largest with the sibling. */
const SIBLING_BYTES = 2048;
/**
 * The ladders: `ladder` brackets one hook's inline threshold (step 8 in
 * 3-byte characters; steps 11-14 repeat the four largest sizes beside the
 * sibling); `ladder-sum` repeats sizes at or below the largest inline step
 * of `ladder` (9,216 bytes), each beside the 2,048-byte sibling, so their
 * sums cross the threshold while each hook's own text stays under it: all
 * inline means the threshold applies per hook.
 */
const LADDERS = {
  ladder: { sizes: [2048, 4096, 6144, 8192, 9216, 10240, 11264, 12288, 13312, 14009, 11264, 12288, 13312, 14009], utf8Step: 8, siblingFromStep: 11 },
  'ladder-sum': { sizes: [5120, 6144, 7168, 8192, 9216], utf8Step: 0, siblingFromStep: 1 },
};
const isLadder = (mode) => mode in LADDERS;
/** A herdr session of its own for the dry pane run, never the owner's. */
const DRY_HERDR_SESSION = 'mbx-dry';
const PANE_WAIT_MS = 300_000;

/** `<prefix>START<n>X ` + filler + ` <prefix>END<n>X`, exactly `bytes` long. */
function sizedText(prefix, n, bytes, wide) {
  const head = `${prefix}START${n}X `;
  const tail = ` ${prefix}END${n}X`;
  const room = bytes - Buffer.byteLength(head + tail);
  const filler = wide
    ? '漢'.repeat(Math.floor(room / 3)) + 'a'.repeat(room % 3)
    : 'ladder filler text '.repeat(Math.ceil(room / 19)).slice(0, room);
  const text = head + filler + tail;
  if (Buffer.byteLength(text) !== bytes) throw new Error(`sized text ${prefix}${n} is ${Buffer.byteLength(text)} bytes, not ${bytes}`);
  return text;
}

function probeRunDir(cli, mode, dry) {
  return path.join(dry ? DRY_BASE : BASE, cli, mode);
}

function fdKind(pid, fd) {
  try {
    const target = fs.readlinkSync(`/proc/${pid}/fd/${fd}`);
    if (target.startsWith('pipe:')) return 'pipe';
    if (target.startsWith('socket:')) return 'socket';
    if (target === '/dev/null') return 'null';
    if (/^\/dev\/(pts\/\d+|tty\w*)$/.test(target)) return 'tty';
    return 'file';
  } catch {
    return null;
  }
}

/** One process's facts: what fgos_process::facts reads, plus fds and cwd. */
function procEntry(pid) {
  // fields[0] is field 3 (state): 4 ppid, 5 pgrp, 6 session, 7 tty_nr, 22 starttime.
  const fields = statFields(pid);
  const read = (fn) => {
    try {
      return fn();
    } catch {
      return null;
    }
  };
  return {
    pid,
    ppid: Number(fields[1]),
    pgrp: Number(fields[2]),
    session: Number(fields[3]),
    ttyNr: Number(fields[4]),
    starttime: fields[19],
    comm: read(() => fs.readFileSync(`/proc/${pid}/comm`, 'utf8').trim()),
    exe: read(() => fs.readlinkSync(`/proc/${pid}/exe`)),
    cmdline: read(() => fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0').filter(Boolean).slice(0, 12).map((a) => (a.length > 160 ? `${a.slice(0, 160)}…` : a))),
    cwd: read(() => fs.readlinkSync(`/proc/${pid}/cwd`)),
    fds: { 0: fdKind(pid, 0), 1: fdKind(pid, 1), 2: fdKind(pid, 2) },
  };
}

/** The calling process and up to 6 ancestors, with what the entry sees of its environment. */
function probeFacts() {
  const chain = [];
  let pid = process.pid;
  for (let level = 0; level < 7 && pid > 1; level += 1) {
    let entry;
    try {
      entry = procEntry(pid);
    } catch {
      break;
    }
    chain.push(entry);
    pid = entry.ppid;
  }
  return {
    at: new Date().toISOString(),
    cwd: process.cwd(),
    claudeProjectDir: process.env.CLAUDE_PROJECT_DIR ?? null,
    binShRealpath: fs.realpathSync('/bin/sh'),
    idVarsSet: ID_VARS.filter((name) => process.env[name] !== undefined),
    envNames: Object.keys(process.env).sort(),
    chain,
  };
}

/** The next free number of a sequence of marker files `<dir>/<n>.<ext>`. */
function nextSeq(dir, ext) {
  fs.mkdirSync(dir, { recursive: true });
  for (let n = 1; ; n += 1) {
    try {
      fs.closeSync(fs.openSync(path.join(dir, `${n}.${ext}`), 'wx'));
      return n;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }
}

function stepOf(payload) {
  const command = payload?.tool_input?.command;
  const text = Array.isArray(command) ? command.join(' ') : String(command ?? '');
  const m = /\bstep(\d+)\b/.exec(text);
  return m ? Number(m[1]) : null;
}

function contextShape(event, text) {
  return { hookSpecificOutput: { hookEventName: event, additionalContext: text } };
}

/** The probe hook: `<ws>/.fgos/installation/bin/fgos hook mailbox --cli <c> --event <e>`. */
function cmdProbeHook(runDir, argv) {
  try {
    const input = readStdin();
    const event = argv[argv.indexOf('--event') + 1] === 'stop' ? 'Stop' : 'PostToolUse';
    const calls = path.join(runDir, 'calls');
    const n = nextSeq(calls, 'seq');
    fs.writeFileSync(path.join(calls, `${n}-${event}.json`), input);
    writeJson(path.join(calls, `${n}-${event}.argv.json`), argv);
    writeJson(path.join(calls, `${n}-${event}.proc.json`), probeFacts());
    const meta = readJson(path.join(runDir, 'mode.json'));
    if (!isLadder(meta.mode) || event !== 'PostToolUse') return;
    const { sizes, utf8Step } = LADDERS[meta.mode];
    const step = stepOf(JSON.parse(input.toString('utf8') || '{}'));
    if (!step || step > sizes.length) return;
    const text = sizedText('L5', step, sizes[step - 1], step === utf8Step);
    writeJson(path.join(calls, `${n}-ladder.json`), { step, bytes: sizes[step - 1] });
    process.stdout.write(JSON.stringify(contextShape('PostToolUse', text)));
  } catch (error) {
    try {
      fs.appendFileSync(path.join(runDir, 'hook-errors.txt'), `${error.stack}\n`);
    } catch {
      // nothing left to report to; the hook still exits 0
    }
  } finally {
    process.exitCode = 0;
  }
}

/** The ladder's sibling PostToolUse hook: a fixed context from step 11 on. */
function cmdProbeSibling(runDir) {
  try {
    const input = readStdin();
    const { siblingFromStep } = LADDERS[readJson(path.join(runDir, 'mode.json')).mode];
    const step = stepOf(JSON.parse(input.toString('utf8') || '{}'));
    if (!step || step < siblingFromStep) return;
    // The sibling may run before the ladder hook made the calls directory.
    fs.mkdirSync(path.join(runDir, 'calls'), { recursive: true });
    writeJson(path.join(runDir, 'calls', `sibling-${step}.json`), { step, bytes: SIBLING_BYTES });
    process.stdout.write(JSON.stringify(contextShape('PostToolUse', sizedText('SIB', step, SIBLING_BYTES, false))));
  } catch (error) {
    try {
      fs.appendFileSync(path.join(runDir, 'hook-errors.txt'), `sibling: ${error.stack}\n`);
    } catch {
      // nothing left to report to
    }
  } finally {
    process.exitCode = 0;
  }
}

/** The tool-side dump: `node <run>/dump-ancestry.mjs`. */
function cmdProbeTool(runDir) {
  const n = nextSeq(path.join(runDir, 'tool'), 'seq');
  writeJson(path.join(runDir, 'tool', `${n}.proc.json`), probeFacts());
  process.stdout.write(`dumped ${n}\n`);
}

/** An executable that runs one subcommand of this script with `runDir`, in the same process. */
function writeEntry(file, subcommand, runDir) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const url = new URL(`file://${SCRIPT}`).href;
  fs.writeFileSync(file, `#!/usr/bin/env node
// Probe fixture of scripts/record-mailbox-hook-fixtures.mjs, never a product door.
process.argv = [process.argv[0], ${JSON.stringify(SCRIPT)}, ${JSON.stringify(subcommand)}, ${JSON.stringify(runDir)}, ...process.argv.slice(2)];
import(${JSON.stringify(url)});
`, { mode: 0o755 });
}

/** The two command forms plan decision 14 names: plain (quoted path) and guarded. */
function productCommand(cli, event, ws, guarded) {
  const shim = path.join(ws, '.fgos', 'installation', 'bin', 'fgos');
  const args = `hook mailbox --cli ${cli} --event ${event}`;
  if (cli === 'claude') {
    return guarded
      ? `S="\${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos"; [ -x "$S" ] || exit 0; "$S" ${args} || true`
      : `"\${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos" ${args}`;
  }
  const quoted = `'${shim.replace(/'/g, `'\\''`)}'`;
  return guarded ? `S=${quoted}; [ -x "$S" ] || exit 0; "$S" ${args} || true` : `${quoted} ${args}`;
}

function probePrompt(mode, runDir, ws) {
  if (isLadder(mode)) {
    const { sizes } = LADDERS[mode];
    const steps = sizes.map((_, i) => `${i + 1}. Run the shell command: \`echo step${i + 1}\``).join('\n');
    return `This is a test of hook context sizes. Do exactly these steps, one shell tool call per step, in order, and nothing else. Never combine two steps in one call.
${steps}
The additional context you receive after a step is filler; do not act on it. After step ${sizes.length}, answer with the single word done.`;
  }
  const dump = `node '${path.join(runDir, 'dump-ancestry.mjs')}'`;
  const text = `This is a test of hook process facts. Do exactly these steps, one shell tool call per step, in order, and nothing else.
1. Run the shell command: \`${dump}\`
2. Run the shell command: \`cd '${path.join(ws, 'elsewhere')}'\`
3. Run the shell command: \`${dump}\`
4. Run the shell command: \`true\`
Then answer with the single word done.`;
  return mode === 'probe-pane' ? `${text.replace(/\n+/g, ' ')} After that, wait for the user.` : text;
}

function probeSettings(cli, mode, runDir, ws) {
  const entry = (command) => ({ type: 'command', command, timeout: 30 });
  const post = [entry(productCommand(cli, 'post-tool-use', ws, false))];
  const sibling = `'${path.join(runDir, 'sibling')}'`;
  if (isLadder(mode)) post.push(entry(sibling));
  if (cli === 'claude') {
    const hooks = { PostToolUse: [{ matcher: '*', hooks: post }] };
    if (!isLadder(mode)) hooks.Stop = [{ hooks: [entry(productCommand(cli, 'stop', ws, true))] }];
    return { hooks, ...(mode === 'probe-pane' ? { skipDangerousModePermissionPrompt: true } : {}) };
  }
  const hooks = { PostToolUse: [{ hooks: post }] };
  if (!isLadder(mode)) hooks.Stop = [{ hooks: [entry(productCommand(cli, 'stop', ws, true))] }];
  return hooks;
}

/** Lays out a probe run: ws (the project, with the hook at the shim path), home, zdot. */
function layOutProbe(cli, mode, dry) {
  if (!PROBE_MODES.includes(mode)) die(`unknown probe mode ${mode}`);
  if (mode === 'probe-pane' && cli !== 'claude') die('probe-pane applies to claude only');
  if (!['claude', 'codex'].includes(cli)) die(`probe modes take claude or codex, not ${cli}`);
  const runDir = probeRunDir(cli, mode, dry);
  if (fs.existsSync(path.join(runDir, 'spawned.json'))) die(`${runDir} already spawned a CLI; a re-run needs the controller`);
  const refused = removeRunDir(runDir);
  if (refused) die(refused, 3);
  const ws = path.join(runDir, 'ws');
  fs.mkdirSync(path.join(ws, 'elsewhere'), { recursive: true });
  live.assertOutsideCheckout(ws);
  writeEntry(path.join(ws, '.fgos', 'installation', 'bin', 'fgos'), 'probe-hook', runDir);
  writeEntry(path.join(runDir, 'sibling'), 'probe-sibling', runDir);
  writeEntry(path.join(runDir, 'dump-ancestry.mjs'), 'probe-tool', runDir);
  const home = path.join(runDir, 'home');
  if (dry || cli === 'codex') fs.mkdirSync(home, { recursive: true });
  else live.makeClaudeHome({ home, claudeDir: path.join(os.homedir(), '.claude') });
  const prompt = probePrompt(mode, runDir, ws);
  writeJson(path.join(runDir, 'mode.json'), { cli, mode, dry, ladder: LADDERS[mode] ?? null, siblingBytes: SIBLING_BYTES });
  return { runDir, ws, home, prompt };
}

function probeEnvAndArgs(cli, mode, { runDir, ws, home, prompt }, dry) {
  const settings = probeSettings(cli, mode, runDir, ws);
  const extra = { HOME: home };
  let args;
  if (cli === 'claude') {
    const file = path.join(runDir, 'settings.json');
    writeJson(file, settings);
    args = live.claudeArgs({ settings: file, prompt, print: mode !== 'probe-pane' });
  } else {
    const codexHome = path.join(runDir, 'codex-home');
    const accountAuth = dry ? path.join(runDir, 'stub-auth.json') : codexAccountAuth();
    if (dry) fs.writeFileSync(accountAuth, '{}\n');
    live.makeCodexHome({ home: codexHome, accountAuth, ws, hooks: settings });
    extra.CODEX_HOME = codexHome;
    args = live.codexArgs({ ws, prompt });
  }
  const env = live.cliEnv({ zdotdir: path.join(runDir, 'zdot'), extra });
  return { env, args };
}

/** Refuses a real run on low memory, a running heavy gate or an untested version. */
function realRunProblem(cli, env) {
  const version = live.semver(live.cliVersion(CLI_BIN[cli], env));
  return live.resourceProblem({ minFreeGb: PROBE_MIN_FREE_GB }) ?? live.versionProblem(cli, version, CONTRACTS);
}

async function cmdProbe(cli, mode, flags) {
  const dry = flags.includes('--dry');
  const laid = layOutProbe(cli, mode, dry);
  const { runDir, ws } = laid;
  const { env, args } = probeEnvAndArgs(cli, mode, laid, dry);
  if (!dry) live.hookPreflight(cli, env.HOME);
  if (!dry && cli === 'claude' && mode === 'probe-pane') {
    live.seedClaudeState({ home: env.HOME, version: live.semver(live.cliVersion(CLI_BIN.claude, env)), trusted: [ws] });
  }
  const codexHome = env.CODEX_HOME;
  if (!dry && cli === 'codex') {
    const before = live.codexAuthState({ home: codexHome, accountAuth: codexAccountAuth(), env });
    if (!(before.isLink && before.loggedIn)) die(`the ${ACCOUNT} codex login is not usable before the run (link ${before.isLink}, logged in ${before.loggedIn})`, 3);
  }
  const before = dry ? 'stub' : live.cliVersion(CLI_BIN[cli], env);
  if (!dry) {
    const problem = realRunProblem(cli, env);
    if (problem) die(problem, 3);
    writeJson(path.join(runDir, 'spawned.json'), { cli, mode, at: new Date().toISOString(), version: before });
  }
  const startedAt = new Date().toISOString();
  const result = mode === 'probe-pane'
    ? await runInPane({ runDir, ws, env, args, dry })
    : runPrint({ cli, ws, env, args, dry });
  const after = dry ? 'stub' : live.cliVersion(CLI_BIN[cli], env);
  writeJson(path.join(runDir, 'versions.json'), { before, after });
  writeJson(path.join(runDir, 'run.json'), {
    cli, mode, dry, startedAt, ...result,
    command: [cli, ...args.map((a) => (a.length > 200 ? '<prompt>' : a))].join(' '),
    inheritedVars: live.INHERITED_VARS,
  });
  const calls = fs.existsSync(path.join(runDir, 'calls')) ? fs.readdirSync(path.join(runDir, 'calls')).filter((f) => f.endsWith('.proc.json')).length : 0;
  process.stdout.write(`${cli} ${mode}${dry ? ' (dry)' : ''}: exit ${result.exit}; versions ${before} -> ${after}; ${calls} hook calls; ${runDir}\n`);
  if (!dry && before !== after) die(`the ${cli} version changed during the run (${before} -> ${after})`, 3);
  if (!dry && cli === 'claude' && !live.claudeHomeIntact({ home: env.HOME, claudeDir: path.join(os.homedir(), '.claude') })) die('the run HOME no longer links ~/.claude', 3);
  if (!dry && cli === 'codex') {
    const authAfter = live.codexAuthState({ home: codexHome, accountAuth: codexAccountAuth(), env });
    const refused = authRefusalAfterRun({ link: path.join(codexHome, 'auth.json'), ...authAfter, account: ACCOUNT });
    if (refused) die(refused, 3);
  }
}

function runPrint({ cli, ws, env, args, dry }) {
  const command = dry ? [process.execPath, STUB_SCRIPT, cli, ...args] : [CLI_BIN[cli], ...args];
  const child = spawnSync('timeout', ['300', ...command], { cwd: ws, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
  fs.writeFileSync(path.join(path.dirname(ws), 'output.txt'), `${child.stdout || ''}\n--- stderr ---\n${child.stderr || ''}`);
  return { exit: child.status };
}

/** The installed host of the main checkout: Terminal Control's internal route is reached through it. */
function installedHost() {
  const dirs = repositoryDirs(REPO_ROOT);
  if (!dirs) die(`no repository at ${REPO_ROOT}`);
  const host = path.join(path.dirname(dirs.commonDir), '.fgos', 'installation', 'bin', 'fgos');
  if (!fs.existsSync(host)) die(`no installed host at ${host}`);
  return host;
}

/**
 * An interactive Claude Code in a herdr pane allocated through Terminal
 * Control, launched as `env -i <allowlisted env> claude …` so the pane
 * shell's environment never reaches it. The run ends when a Stop call is
 * recorded (or after PANE_WAIT_MS); the pane is then closed.
 */
async function runInPane({ runDir, ws, env, args, dry }) {
  process.env.FGOS_HOST_BIN = installedHost();
  const { createTerminalControl } = await import('../src/terminal-control/client.mjs');
  let herdrEnv = {};
  if (dry) {
    const { ensureWorkerSession } = await import('../src/runner/dispatch/worker-session-boot.mjs');
    const session = await ensureWorkerSession(DRY_HERDR_SESSION, { callerEnv: process.env });
    herdrEnv = { HERDR_SESSION: session.env.HERDR_SESSION, HERDR_SOCKET_PATH: session.env.HERDR_SOCKET_PATH };
  }
  const tc = createTerminalControl({ hostBin: process.env.FGOS_HOST_BIN, ...(dry ? { env: herdrEnv } : {}) });
  const group = `mbx-probe${dry ? '-dry' : ''}`;
  const key = `${group}-p2`;
  const bin = dry ? process.execPath : CLI_BIN.claude;
  const cliArgs = dry ? [STUB_SCRIPT, 'claude', '--interactive', ...args] : args;
  const allocated = tc.allocate({ key, groupKey: group, display: { label: 'mailbox probe P2 (Claude interactive)', role: 'probe', agent: 'claude' }, cwd: ws });
  if (allocated.result !== 'slot') die(`allocate ${key}: ${JSON.stringify(allocated)}`, 3);
  const pairs = Object.entries(env).map(([k, v]) => `${k}=${v}`);
  const launched = tc.launch({ key, launchSpec: { command: '/usr/bin/env', args: ['-i', ...pairs, bin, ...cliArgs], cwd: ws, env: {}, expect: { argv0: bin, command: bin, args: cliArgs } } });
  const startedMs = Date.now();
  let stopSeen = false;
  if (launched.result === 'launched') {
    const calls = path.join(runDir, 'calls');
    while (Date.now() - startedMs < PANE_WAIT_MS) {
      stopSeen = fs.existsSync(calls) && fs.readdirSync(calls).some((f) => /-Stop\.proc\.json$/.test(f));
      if (stopSeen) break;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  const released = tc.release({ key, disposition: 'close' }).result;
  if (dry) spawnSync('herdr', ['--session', DRY_HERDR_SESSION, 'server', 'stop'], { env: { ...process.env, ...herdrEnv }, stdio: 'ignore' });
  return { exit: stopSeen ? 0 : null, pane: { key, paneId: allocated.paneId ?? allocated.slot?.paneId ?? null, launch: launched.result, released, stopSeen, waitedMs: Date.now() - startedMs } };
}

/** Where a run's model input lives: the Claude transcript or the Codex rollout of its first call. */
function modelInputFile(runDir) {
  const calls = path.join(runDir, 'calls');
  const first = fs.readdirSync(calls).filter((f) => /^\d+-PostToolUse\.json$/.test(f)).sort((a, b) => parseInt(a, 10) - parseInt(b, 10))[0];
  return first ? readJson(path.join(calls, first)).transcript_path : null;
}

/**
 * Per ladder step: `inline` when one model-input record holds the whole
 * text (both markers and the exact byte length between them), `moved` when
 * a record names the step's start marker but not the whole text (Claude's
 * persisted-output block, or a Codex truncation), `absent` otherwise. The
 * sibling's text is judged the same way.
 */
function ladderVerdict(runDir, cli) {
  const file = modelInputFile(runDir);
  if (!file || !fs.existsSync(file)) return { file, steps: [] };
  const texts = [];
  for (const line of fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)) {
    let r;
    try {
      r = JSON.parse(line);
    } catch {
      continue;
    }
    if (cli === 'claude' && r.type === 'attachment' && r.attachment?.type === 'hook_additional_context') {
      texts.push({ text: (r.attachment.content ?? []).join('\n'), persisted: JSON.stringify(r).includes('persisted-output') });
    }
    if (cli === 'codex' && r.type === 'response_item' && r.payload?.type === 'message') {
      for (const c of r.payload.content ?? []) if (c.text) texts.push({ text: c.text, role: r.payload.role, persisted: c.text.includes('persisted-output') });
    }
  }
  const judge = (prefix, n, bytes, wide) => {
    const whole = sizedText(prefix, n, bytes, wide);
    const hit = texts.find((t) => t.text.includes(whole));
    if (hit) return { verdict: 'inline', role: hit.role ?? null };
    const part = texts.find((t) => t.text.includes(`${prefix}START${n}X`));
    if (part) return { verdict: 'moved', persisted: part.persisted, role: part.role ?? null, recordBytes: Buffer.byteLength(part.text), endMarker: part.text.includes(`${prefix}END${n}X`) };
    return { verdict: 'absent' };
  };
  const { sizes, utf8Step, siblingFromStep } = LADDERS[readJson(path.join(runDir, 'mode.json')).mode];
  const steps = sizes.map((bytes, i) => {
    const n = i + 1;
    return {
      step: n,
      bytes,
      wide: n === utf8Step,
      hookRan: fs.readdirSync(path.join(runDir, 'calls')).some((f) => f.endsWith('-ladder.json') && readJson(path.join(runDir, 'calls', f)).step === n),
      ...judge('L5', n, bytes, n === utf8Step),
      ...(n >= siblingFromStep ? { sibling: judge('SIB', n, SIBLING_BYTES, false).verdict } : {}),
    };
  });
  return { file, steps };
}

/** The compact facts of one process entry, for the summary. */
function compact(entry) {
  if (!entry) return null;
  return { comm: entry.comm, exe: entry.exe, argv0: entry.cmdline?.[0] ?? null, ttyNr: entry.ttyNr, session: entry.session, pgrp: entry.pgrp, fds: entry.fds };
}

/** `summarize <cli> <mode> [--dry]`: the run's facts as the report tables read them. */
function cmdSummarize(cli, mode, flags) {
  const runDir = probeRunDir(cli, mode, flags.includes('--dry'));
  const calls = path.join(runDir, 'calls');
  const hookCalls = fs.existsSync(calls)
    ? fs.readdirSync(calls).map((f) => /^(\d+)-(Stop|PostToolUse)\.proc\.json$/.exec(f)).filter(Boolean).sort((a, b) => a[1] - b[1]).map((m) => {
      const facts = readJson(path.join(calls, m[0]));
      const payload = (() => {
        try {
          return readJson(path.join(calls, `${m[1]}-${m[2]}.json`));
        } catch {
          return null;
        }
      })();
      return {
        n: Number(m[1]), event: m[2], tool: payload?.tool_input?.command ?? null, payloadCwd: payload?.cwd ?? null,
        cwd: facts.cwd, claudeProjectDir: facts.claudeProjectDir, idVarsSet: facts.idVarsSet, binShRealpath: facts.binShRealpath,
        self: compact(facts.chain[0]), parent: compact(facts.chain[1]), grandparent: compact(facts.chain[2]), greatGrandparent: compact(facts.chain[3]),
      };
    })
    : [];
  const toolDir = path.join(runDir, 'tool');
  const tools = fs.existsSync(toolDir)
    ? fs.readdirSync(toolDir).filter((f) => f.endsWith('.proc.json')).sort((a, b) => parseInt(a, 10) - parseInt(b, 10)).map((f) => {
      const facts = readJson(path.join(toolDir, f));
      return { n: parseInt(f, 10), cwd: facts.cwd, claudeProjectDir: facts.claudeProjectDir, idVarsSet: facts.idVarsSet, chain: facts.chain.map(compact) };
    })
    : [];
  const summary = { cli, mode, run: readJson(path.join(runDir, 'run.json')), versions: readJson(path.join(runDir, 'versions.json')), hookCalls, tools, ...(isLadder(mode) ? { ladder: ladderVerdict(runDir, cli) } : {}) };
  writeJson(path.join(runDir, 'summary.json'), summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

/** Removes one probe run directory (refused while a set-aside auth file exists). */
function cmdCleanProbe(cli, mode, flags) {
  const dir = probeRunDir(cli, mode, flags.includes('--dry'));
  const refused = removeRunDir(dir);
  if (refused) die(refused, 3);
  process.stdout.write(`removed ${dir}\n`);
}

const [command, ...rest] = process.argv.slice(2);
try {
  await main();
} catch (error) {
  if (error instanceof live.LiveCliError) die(error.message, error.code);
  throw error;
}

async function main() {
  switch (command) {
    case 'run':
      if (PROBE_MODES.includes(rest[1])) await cmdProbe(rest[0], rest[1], rest.slice(2));
      else cmdRun(rest[0], rest[1], rest.slice(2));
      break;
    case 'probe-hook':
      cmdProbeHook(rest[0], rest.slice(1));
      break;
    case 'probe-sibling':
      cmdProbeSibling(rest[0]);
      break;
    case 'probe-tool':
      cmdProbeTool(rest[0]);
      break;
    case 'summarize':
      cmdSummarize(rest[0], rest[1], rest.slice(2));
      break;
    case 'clean-probe':
      cmdCleanProbe(rest[0], rest[1], rest.slice(2));
      break;
    case 'hook':
      cmdHook(rest[0], rest[1], rest[2]);
      break;
    case 'check':
      cmdCheck(rest[0], rest[1]);
      break;
    case 'redact':
      cmdRedact(rest[0]);
      break;
    case 'redact-agent-head':
      cmdRedactAgentHead(rest[0]);
      break;
    case 'clean':
      cmdClean(rest[0]);
      break;
    default:
      die('usage: run <cli> <mode> [--fallback] [--agent-head] [--account <name>] | run <claude|codex> <probe|probe-pane|ladder|ladder-sum> [--dry] | summarize <cli> <probe mode> [--dry] | clean-probe <cli> <probe mode> [--dry] | hook <cli> <event> <runDir> | check <cli> accept | redact <cli> | redact-agent-head <cli> | clean <cli>');
  }
}
