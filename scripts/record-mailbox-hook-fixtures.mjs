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
 *   run <cli> <mode> [--fallback]
 *       <cli> is claude | codex | agy; <mode> is dump | accept | subagent.
 *       Builds <base>/<cli>/<mode>/ (refuses when it exists), writes the
 *       isolated hook configuration, runs the CLI once under `timeout 300`
 *       and writes versions.json (before and after), run.json and
 *       output.txt. `--fallback` (accept only) offers the other context shape
 *       of the two candidates below, after the first one was refused.
 *       For codex it then checks that home/auth.json is still a symlink to
 *       the account's auth.json and that the account file's bytes are
 *       unchanged; on any change it stops with exit 3 and prints only that.
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
 *   clean <cli>
 *       Deletes <base>/<cli>/ (raw calls, the codex home with its rollouts).
 *
 * Where: <base> is ${TMPDIR:-/tmp}/fgos-work/mailbox-v3-record, outside every
 * git checkout, so a full-bypass agent cannot write the repository and the
 * repository's own hook files (.claude/settings.json, .agents/hooks.json)
 * never load. Each CLI is started with FGOS_SESSION_ID, CODEX_THREAD_ID,
 * CLAUDE_CODE_SESSION_ID and CLAUDECODE removed, so a recorded id variable is
 * one the CLI set itself.
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
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(SCRIPT), '..');
const BASE = path.join(process.env.TMPDIR || '/tmp', 'fgos-work', 'mailbox-v3-record');
const FIXTURES = path.join(REPO_ROOT, 'packages', 'mailbox', 'contracts', 'fixtures', 'hooks');
const ACCOUNT = 'tetnu';
const REDACTION_RULES_VERSION = 1;

/** The session-identity variables (fgos-session-identity ENV_ORDER), plus
 * CLAUDECODE, removed from every CLI's environment. */
const ID_VARS = ['FGOS_SESSION_ID', 'CODEX_THREAD_ID', 'CLAUDE_CODE_SESSION_ID'];
const REMOVED_VARS = [...ID_VARS, 'CLAUDECODE'];

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
  codex: { inject: [], raw: [] },
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

function zshValue(expr) {
  return execFileSync('zsh', ['-ic', `print -r -- ${expr}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function accountHome(cli) {
  const table = cli === 'codex' ? 'CODEX_ACCOUNTS' : 'AGY_ACCOUNTS';
  const home = zshValue(`\${${table}[${ACCOUNT}]}`);
  if (!home || !fs.existsSync(home)) die(`${table}[${ACCOUNT}] does not name a directory`);
  return home;
}

function accountNames() {
  const names = new Set([ACCOUNT]);
  for (const table of ['CODEX_ACCOUNTS', 'AGY_ACCOUNTS']) {
    for (const name of zshValue(`\${(k)${table}}`).split(/\s+/)) if (name) names.add(name);
  }
  return [...names];
}

function cliVersion(cli) {
  const out = spawnSync(cli, ['--version'], { encoding: 'utf8', env: cleanEnv() });
  return (out.stdout || '').trim();
}

function cleanEnv(extra = {}) {
  const env = { ...process.env, ...extra };
  for (const name of REMOVED_VARS) delete env[name];
  for (const name of REMOVED_VARS) if (name in env) die(`${name} is still set in the child environment`);
  return env;
}

function hookCommand(cli, event, runDir) {
  return `node '${SCRIPT}' hook ${cli} ${event} '${runDir}'`;
}

function hookEntry(cli, event, runDir) {
  return { type: 'command', command: hookCommand(cli, event, runDir), timeout: 30 };
}

function setUp(cli, mode, runDir) {
  const ws = path.join(runDir, 'ws');
  fs.mkdirSync(ws, { recursive: true });
  for (let dir = ws; dir !== path.dirname(dir); dir = path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, '.git'))) die(`${ws} is inside a git checkout (${dir})`);
  }
  const args = [];
  const env = {};
  if (cli === 'claude') {
    const hooks = {};
    for (const event of EVENTS.claude) {
      const group = { hooks: [hookEntry(cli, event, runDir)] };
      hooks[event] = [event === 'PostToolUse' ? { matcher: '*', ...group } : group];
    }
    writeJson(path.join(runDir, 'settings.json'), { hooks });
    args.push('-p', '--model', 'haiku', '--dangerously-skip-permissions', '--setting-sources', 'project',
      '--settings', path.join(runDir, 'settings.json'), PROMPTS[mode]);
  } else if (cli === 'codex') {
    const home = path.join(runDir, 'home');
    fs.mkdirSync(home, { recursive: true });
    fs.symlinkSync(path.join(accountHome('codex'), 'auth.json'), path.join(home, 'auth.json'));
    fs.writeFileSync(path.join(home, 'config.toml'),
      `model_reasoning_effort = "low"\n\n[features]\nhooks = true\n\n[projects."${ws}"]\ntrust_level = "trusted"\n`);
    const hooks = {};
    for (const event of EVENTS.codex) hooks[event] = [{ hooks: [hookEntry(cli, event, runDir)] }];
    writeJson(path.join(home, 'hooks.json'), { hooks });
    env.CODEX_HOME = home;
    args.push('exec', '--dangerously-bypass-hook-trust', '--dangerously-bypass-approvals-and-sandbox',
      '--skip-git-repo-check', '-C', ws, PROMPTS[mode]);
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

function fileDigest(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function codexAuthState(runDir) {
  const link = path.join(runDir, 'home', 'auth.json');
  const target = path.join(accountHome('codex'), 'auth.json');
  const stat = fs.lstatSync(link, { throwIfNoEntry: false });
  const isLink = Boolean(stat && stat.isSymbolicLink() && fs.readlinkSync(link) === target);
  return { isLink, digest: fileDigest(target) };
}

function cmdRun(cli, mode, flags) {
  if (!EVENTS[cli]) die(`unknown cli ${cli}`);
  if (!PROMPTS[mode]) die(`unknown mode ${mode}`);
  const fallback = flags.includes('--fallback');
  if (fallback && mode !== 'accept') die('--fallback applies to accept only');
  const runDir = runDirOf(cli, mode) + (fallback ? '-fallback' : '');
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
  const { ws, args, env } = setUp(cli, mode, runDir);
  const authBefore = cli === 'codex' ? codexAuthState(runDir) : null;
  const before = cliVersion(cli);
  const startedAt = new Date().toISOString();
  const child = spawnSync('timeout', ['300', cli, ...args], {
    cwd: ws,
    env: cleanEnv(env),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
  const after = cliVersion(cli);
  fs.writeFileSync(path.join(runDir, 'output.txt'), `${child.stdout || ''}\n--- stderr ---\n${child.stderr || ''}`);
  writeJson(path.join(runDir, 'versions.json'), { before, after });
  writeJson(path.join(runDir, 'run.json'), {
    cli,
    mode,
    startedAt,
    exit: child.status,
    command: [cli, ...args.map((a) => (a === PROMPTS[mode] ? '<prompt>' : a))].join(' '),
    removedVars: REMOVED_VARS,
    recorderPidNamespace: fs.readlinkSync('/proc/self/ns/pid'),
  });
  const calls = fs.existsSync(path.join(runDir, 'calls')) ? fs.readdirSync(path.join(runDir, 'calls')) : [];
  process.stdout.write(`${cli} ${mode}: exit ${child.status}; versions ${before} -> ${after}; ${calls.filter((f) => /^\d+-[A-Za-z]+\.json$/.test(f)).length} hook calls; ${runDir}\n`);
  if (authBefore) {
    const authAfter = codexAuthState(runDir);
    const intact = authAfter.isLink && authAfter.digest === authBefore.digest;
    process.stdout.write(`codex auth.json: ${authAfter.isLink ? 'still a link' : 'NOT A LINK'}; account file ${authAfter.digest === authBefore.digest ? 'unchanged' : 'CHANGED'}\n`);
    if (!intact) {
      const link = path.join(runDir, 'home', 'auth.json');
      const stat = fs.lstatSync(link, { throwIfNoEntry: false });
      if (stat && !stat.isSymbolicLink()) fs.rmSync(link);
      die('the codex login file changed; stop and ask the owner whether the tetnu login needs a fresh `codex login`', 3);
    }
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

function makeRedactor(cli) {
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
    if (!ids.has(value)) ids.set(value, `00000000-0000-4000-8000-${String(ids.size + 1).padStart(12, '0')}`);
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
  const version = [...versions][0];

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
  const notes = fs.existsSync(path.join(BASE, cli, 'notes.txt')) ? fs.readFileSync(path.join(BASE, cli, 'notes.txt'), 'utf8').trim().split('\n').join('; ') : '';
  const source = [
    `recorded ${run(runs.dump).startedAt.slice(0, 10)} from ${cli} ${version} on this machine by scripts/record-mailbox-hook-fixtures.mjs (redaction rules version ${REDACTION_RULES_VERSION})`,
    ...allDirs.map((d) => `${path.basename(d)} run: \`${run(d).command}\` (exit ${run(d).exit})`),
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
  writeJson(path.join(outDir, 'vectors.json'), { cli, source: scrubSource(source), vectors: [] });
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

function cmdClean(cli) {
  const dir = path.join(BASE, cli);
  fs.rmSync(dir, { recursive: true, force: true });
  process.stdout.write(`removed ${dir}\n`);
}

const [command, ...rest] = process.argv.slice(2);
switch (command) {
  case 'run':
    cmdRun(rest[0], rest[1], rest.slice(2));
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
  case 'clean':
    cmdClean(rest[0]);
    break;
  default:
    die('usage: run <cli> <mode> [--fallback] | hook <cli> <event> <runDir> | check <cli> accept | redact <cli> | clean <cli>');
}
