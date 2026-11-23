// These cases run the hook code the Rust installer writes. Byte-level install, check, uninstall,
// idempotence, legacy replacement, receipt and prefilter-list cases are owned by
// packages/distribution/rust/src/agent_hooks.rs and its golden vectors. Every file here is installed
// through the Rust door (`fgos doctor --fix --only <cli>-hook-wired`), never through Node.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { readProjectConfig, writeProjectConfig } from '../helpers/config-fixture.mjs';
import { mailboxHookTimeoutSec } from '../../src/setup/mailbox-limits.mjs';
import { invokeHost } from '../../src/util/host-bin.mjs';
import { projectShimPath } from '../../src/util/host-bin-path.mjs';
import { mintAttemptWriterId } from '../../src/util/session-identity.mjs';

const FIX_ID = {
  claude: 'dispatch-decide-hook-wired',
  codex: 'codex-hook-wired',
  agy: 'agy-hook-wired',
  omp: 'omp-hook-wired',
  pi: 'pi-hook-wired',
};

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/** Opts the project in to (or out of) the mailbox hook rows through its own config section. */
function writeMailboxOptIn(repoRoot, enabled) {
  const config = readProjectConfig(repoRoot);
  config.mailbox = { ...(config.mailbox ?? {}), enabled };
  writeProjectConfig(repoRoot, config);
}

/** Installs `cli`'s hook files through the Rust host. A failing doctor row elsewhere is not this call's concern: the written file is. */
function installThroughHost(repoRoot, cli) {
  try {
    invokeHost(['doctor', '--fix', '--only', FIX_ID[cli]], { dir: repoRoot });
  } catch (err) {
    if (err.code !== 'host-exec-error') throw err;
  }
}

const extensionFile = (repoRoot, cli) => path.join(repoRoot, `.${cli}`, 'extensions', 'fgos-hooks.ts');

/** The delete guard's shell command the installer wrote for a claude, codex or agy project. */
function deleteGuardCommand(repoRoot, cli) {
  const read = (...parts) => JSON.parse(fs.readFileSync(path.join(repoRoot, ...parts), 'utf8'));
  if (cli === 'agy') return read('.agents', 'hooks.json')['fgos-delete-guard'].PreToolUse[0].hooks[0].command;
  const file = cli === 'claude' ? ['.claude', 'settings.json'] : ['.codex', 'hooks.json'];
  const command = read(...file).hooks.PreToolUse
    .flatMap((entry) => entry.hooks.map((hook) => hook.command))
    .find((c) => c.includes('main-checkout-delete-guard'));
  assert.ok(command, `${cli} has a delete guard command`);
  return command;
}

/** A shim that records each call's argv and stdin under `log` and answers `answer` on stdout. */
function recordingShim(shimPath, log, answer) {
  fs.mkdirSync(path.dirname(shimPath), { recursive: true });
  fs.writeFileSync(shimPath, `#!/bin/sh\nprintf '%s\\n' "$*" >> '${log}.argv'\ncat >> '${log}.stdin'\nprintf '%s' '${answer}'\n`, { mode: 0o755 });
}

/** A shim that records its argv and refuses with exit 2 and a reason on stderr. */
function refusingShim(shimPath, log) {
  fs.mkdirSync(path.dirname(shimPath), { recursive: true });
  fs.writeFileSync(shimPath, `#!/bin/sh\nprintf '%s\\n' "$*" >> '${log}.argv'\ncat >> '${log}.stdin'\necho refused-by-guard >&2\nexit 2\n`, { mode: 0o755 });
}

/** The handlers the generated extension of a `cli` project registers, by event, loaded from what the installer wrote. */
async function loadedHandlers(repoRoot, cli) {
  const mod = await import(`${extensionFile(repoRoot, cli)}?load=${Date.now()}-${Math.random()}`);
  const handlers = {};
  mod.default({ on: (event, fn) => { handlers[event] = fn; } });
  return handlers;
}

/** A stub of the CLI's handler context: its directory and its session manager. */
const stubCtx = (cwd, { id = 'sess-0001', parentSession } = {}) => ({ cwd, sessionManager: { getSessionId: () => id, getHeader: () => ({ type: 'session', id, ...(parentSession ? { parentSession } : {}) }) } });

const MBX_ANSWER = '{"inject":"MBX-FRAME","method":"tool-result"}';

// ---------------------------------------------------------------------------
// Claude Code
// ---------------------------------------------------------------------------

test('Claude Code dispatch and decision-question guards let the call through when the shim is gone, and pass its verdict when present', () => {
  const repoRoot = mkTempDir('agent-hooks-claude-guarded-');
  installThroughHost(repoRoot, 'claude');
  const settings = JSON.parse(fs.readFileSync(path.join(repoRoot, '.claude', 'settings.json'), 'utf8'));
  const commands = settings.hooks.PreToolUse.slice(0, 2).map((entry) => entry.hooks[0].command);
  const env = { ...process.env, CLAUDE_PROJECT_DIR: repoRoot };
  for (const command of commands) {
    const absent = spawnSync('/bin/sh', ['-c', command], { env, input: '{}' });
    assert.equal(absent.status, 0, `no shim: ${command}`);
    assert.equal(absent.stdout.length, 0);
  }
  const shim = projectShimPath(repoRoot);
  fs.mkdirSync(path.dirname(shim), { recursive: true });
  fs.writeFileSync(shim, '#!/bin/sh\nprintf "%s" "$*"; cat >/dev/null; exit 2\n', { mode: 0o755 });
  const present = spawnSync('/bin/sh', ['-c', commands[0]], { env, input: '{}' });
  assert.equal(present.status, 2, 'the shim\'s exit code passes through');
  assert.equal(present.stdout.toString(), 'hook dispatch-decide');
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('the claude delete guard command passes a shell call without a mass-delete word in the shell and hands the rest to the shim', () => {
  const repoRoot = mkTempDir('agent-hooks-delete-guard-');
  installThroughHost(repoRoot, 'claude');
  const log = path.join(repoRoot, 'guard-log');
  fs.mkdirSync(path.dirname(projectShimPath(repoRoot)), { recursive: true });
  fs.writeFileSync(projectShimPath(repoRoot), `#!/bin/sh\nprintf '%s\\n' "$*" >> '${log}.argv'\ncat >> '${log}.stdin'\nexit 2\n`, { mode: 0o755 });
  const command = deleteGuardCommand(repoRoot, 'claude');
  const run = (shellCommand) => spawnSync('/bin/sh', ['-c', command], { input: JSON.stringify({ tool_name: 'Bash', permission_mode: 'bypassPermissions', tool_input: { command: shellCommand } }), env: { ...process.env, CLAUDE_PROJECT_DIR: repoRoot }, encoding: 'utf8' });
  assert.equal(run('ls -la && npm test').status, 0);
  assert.equal(fs.existsSync(`${log}.argv`), false, 'no mass-delete word: the shim never ran');
  for (const shellCommand of ['ls | xargs rm', 'git clean -fdx', 'rm -rf .fgos', 'rm\t-rf .fgos', 'find . -delete']) {
    assert.equal(run(shellCommand).status, 2, shellCommand);
  }
  assert.equal(fs.readFileSync(`${log}.argv`, 'utf8'), 'hook main-checkout-delete-guard\n'.repeat(5));
  assert.ok(fs.readFileSync(`${log}.stdin`, 'utf8').endsWith('{"tool_name":"Bash","permission_mode":"bypassPermissions","tool_input":{"command":"find . -delete"}}'), 'the payload reaches the shim unchanged');
  fs.rmSync(projectShimPath(repoRoot));
  assert.equal(run('git clean -fdx').status, 0, 'a missing shim lets the call through; doctor reports it');
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('with no shim present, the claude mailbox Stop command exits 0 and prints nothing', () => {
  const repoRoot = mkTempDir('agent-hooks-guarded-');
  writeMailboxOptIn(repoRoot, true);
  installThroughHost(repoRoot, 'claude');
  const settings = JSON.parse(fs.readFileSync(path.join(repoRoot, '.claude', 'settings.json'), 'utf8'));
  const command = settings.hooks.Stop.flatMap((entry) => entry.hooks.map((hook) => hook.command)).find((c) => c.includes('mailbox'));
  assert.ok(command, 'the opted-in project has a claude mailbox Stop command');
  const res = spawnSync('/bin/sh', ['-c', command], { env: { ...process.env, CLAUDE_PROJECT_DIR: repoRoot }, input: '{}', encoding: 'utf8' });
  assert.equal(res.status, 0);
  assert.equal(res.stdout + res.stderr, '');
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('the codex hook command quotes a project path that contains a space and a quote', () => {
  const base = mkTempDir('agent-hooks-quote-');
  const repoRoot = path.join(base, "my proj'ect");
  fs.mkdirSync(repoRoot, { recursive: true });
  installThroughHost(repoRoot, 'codex');
  const command = JSON.parse(fs.readFileSync(path.join(repoRoot, '.codex', 'hooks.json'), 'utf8')).hooks.PreToolUse[0].hooks[0].command;
  const shim = projectShimPath(repoRoot);
  assert.equal(command, `'${shim.replace(/'/g, "'\\''")}' hook dispatch-decide`);
  fs.rmSync(base, { recursive: true, force: true });
});

test('codex and agy hook commands run from a directory other than the project, even when the path is awkward or names a hook kind', () => {
  const base = mkTempDir('agent-hooks-exec-');
  const repoRoot = path.join(base, "my decision-question 'app");
  fs.mkdirSync(repoRoot, { recursive: true });
  installThroughHost(repoRoot, 'codex');
  installThroughHost(repoRoot, 'agy');
  const shim = projectShimPath(repoRoot);
  fs.mkdirSync(path.dirname(shim), { recursive: true });
  fs.writeFileSync(shim, '#!/bin/sh\ncat >/dev/null\nexit 0\n', { mode: 0o755 });

  const codex = JSON.parse(fs.readFileSync(path.join(repoRoot, '.codex', 'hooks.json'), 'utf8')).hooks.PreToolUse;
  assert.equal(codex.length, 3, 'every codex guard is present even though the path contains a kind name');
  const agy = JSON.parse(fs.readFileSync(path.join(repoRoot, '.agents', 'hooks.json'), 'utf8'));
  const commands = [
    ...codex.map((e) => e.hooks[0].command),
    agy['fgos-dispatch-guard'].PreToolUse[0].hooks[0].command,
    agy['fgos-delete-guard'].PreToolUse[0].hooks[0].command,
  ];
  for (const command of commands) {
    const res = spawnSync('sh', ['-c', command], { cwd: os.tmpdir(), input: '{}', encoding: 'utf8', timeout: 5000 });
    assert.notEqual(res.status, 127, `${command} was not found from another directory`);
  }
  fs.rmSync(base, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Delete guard prefilter, run through each CLI's own command
// ---------------------------------------------------------------------------

const PREFILTER_SKIPPED = ['ls -la && npm test', 'cat docs/permission-model.md', 'git status --porcelain', 'git push origin main', 'node scripts/run-tests.mjs test/x.test.mjs', 'cargo build --release', 'echo finish'];
const PREFILTER_STARTS_GUARD = ['rm -rf .fgos', "'rm' -rf .", 'ls | xargs rm', 'git clean -fdx', 'find . -delete', 'eval "$X"', 'bash run.sh', 'zsh -c "$X"', 'dash -c x', 'ksh -c x', 'echo hi | sh', 'ls\nsh', 'rm\t-rf .fgos', 'cd x && sh -s'];

/** Runs a delete-guard command the way each CLI does (`sh -c`) with a shim that records its calls and refuses with exit 2. */
function runDeleteGuard(repoRoot, cli, command, shellCommand, { shim = true } = {}) {
  const log = path.join(repoRoot, 'guard-log');
  fs.rmSync(`${log}.argv`, { force: true });
  const shimPath = projectShimPath(repoRoot);
  if (shim) {
    fs.mkdirSync(path.dirname(shimPath), { recursive: true });
    fs.writeFileSync(shimPath, `#!/bin/sh\nprintf '%s\\n' "$*" >> '${log}.argv'\ncat > /dev/null\necho refused >&2\nexit 2\n`, { mode: 0o755 });
  } else fs.rmSync(shimPath, { force: true });
  const payload = cli === 'agy'
    ? { toolCall: { name: 'run_command', args: { CommandLine: shellCommand } }, workspacePaths: [repoRoot] }
    : { tool_name: 'Bash', permission_mode: 'bypassPermissions', tool_input: { command: shellCommand }, cwd: repoRoot };
  const res = spawnSync('/bin/sh', ['-c', command], { input: JSON.stringify(payload), env: { ...process.env, CLAUDE_PROJECT_DIR: repoRoot }, encoding: 'utf8' });
  return { status: res.status, stdout: res.stdout, stderr: res.stderr, ran: fs.existsSync(`${log}.argv`) };
}

for (const cli of ['claude', 'codex', 'agy']) {
  test(`the ${cli} delete guard command starts the shim only for a command carrying a keyword of the shared prefilter`, () => {
    const repoRoot = mkTempDir(`agent-hooks-prefilter-${cli}-`);
    installThroughHost(repoRoot, cli);
    const command = deleteGuardCommand(repoRoot, cli);
    for (const shellCommand of PREFILTER_SKIPPED) {
      const res = runDeleteGuard(repoRoot, cli, command, shellCommand);
      assert.equal(res.ran, false, `${shellCommand} must not start the shim`);
      assert.equal(res.status, 0, shellCommand);
      if (cli === 'agy') assert.deepEqual(JSON.parse(res.stdout), { decision: 'allow' }, 'agy reads a decision on stdout even for a skipped call');
      else assert.equal(res.stdout, '');
    }
    for (const shellCommand of PREFILTER_STARTS_GUARD) {
      const res = runDeleteGuard(repoRoot, cli, command, shellCommand);
      assert.equal(res.ran, true, `${shellCommand} must start the shim`);
      assert.equal(res.status, 2, `${shellCommand}: the shim's refusal reaches the CLI`);
    }
    const missing = runDeleteGuard(repoRoot, cli, command, 'git clean -fdx', { shim: false });
    assert.equal(missing.status, 0, 'a missing shim lets the call through; doctor reports it');
    if (cli === 'agy') assert.deepEqual(JSON.parse(missing.stdout), { decision: 'allow' });
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });
}

// ---------------------------------------------------------------------------
// OMP and Pi: the generated extension is loaded in process
// ---------------------------------------------------------------------------

for (const cli of ['omp', 'pi']) {
  test(`the ${cli} extension the installer writes loads and registers its guard, which blocks on the shim's exit 2 only for a prefilter keyword`, async () => {
    const repoRoot = mkTempDir(`agent-hooks-${cli}-`);
    installThroughHost(repoRoot, cli);
    const extFile = extensionFile(repoRoot, cli);
    const content = fs.readFileSync(extFile, 'utf8');
    for (const [, spec] of content.matchAll(/^import .* from '([^']+)';$/gm)) {
      assert.match(spec, /^node:/, `the extension imports only node builtins, not ${spec}`);
    }
    const mod = await import(`${extFile}?load=${Date.now()}`);
    assert.equal(typeof mod.default, 'function', 'the extension loads and exports its entry');

    // A bash tool call goes to the shim in the Claude Code payload shape, and an exit 2 blocks it with the shim's reason.
    const log = path.join(repoRoot, 'guard-log');
    refusingShim(projectShimPath(repoRoot), log);
    const handlers = await loadedHandlers(repoRoot, cli);
    for (const command of PREFILTER_SKIPPED) {
      assert.equal(await handlers.tool_call({ toolName: 'bash', input: { command } }, { cwd: repoRoot }), undefined, command);
      assert.equal(fs.existsSync(`${log}.argv`), false, `${command} never starts the shim`);
    }
    for (const command of PREFILTER_STARTS_GUARD) {
      fs.rmSync(`${log}.argv`, { force: true });
      assert.deepEqual(await handlers.tool_call({ toolName: 'bash', input: { command } }, { cwd: repoRoot }), { block: true, reason: 'refused-by-guard\n' }, command);
      assert.equal(fs.readFileSync(`${log}.argv`, 'utf8'), 'hook main-checkout-delete-guard\n', `${command} starts the shim`);
    }
    fs.rmSync(`${log}.stdin`, { force: true });
    fs.rmSync(`${log}.argv`, { force: true });
    await handlers.tool_call({ toolName: 'bash', input: { command: 'git clean -fdx' } }, { cwd: repoRoot });
    assert.deepEqual(JSON.parse(fs.readFileSync(`${log}.stdin`, 'utf8')), { tool_name: 'Bash', tool_input: { command: 'git clean -fdx' }, cwd: repoRoot });
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  test(`the generated ${cli} extension carries the mailbox handlers only for an opted-in project`, async () => {
    const repoRoot = mkTempDir(`agent-hooks-${cli}-mailbox-`);
    writeMailboxOptIn(repoRoot, false);
    installThroughHost(repoRoot, cli);
    const log = path.join(repoRoot, 'shim-log');
    recordingShim(projectShimPath(repoRoot), log, MBX_ANSWER);
    const real = [{ type: 'text', text: 'x' }];
    const optedOut = await loadedHandlers(repoRoot, cli);
    if (optedOut.tool_result) assert.equal(await optedOut.tool_result({ content: real }, stubCtx(repoRoot)), undefined);
    if (optedOut.agent_end) await optedOut.agent_end({}, stubCtx(repoRoot));
    assert.equal(fs.existsSync(`${log}.argv`), false, 'opted out: the mailbox shim is never asked');

    writeMailboxOptIn(repoRoot, true);
    installThroughHost(repoRoot, cli);
    // The doctor run that installs also probes each shim call once; only the handlers' calls count below.
    fs.rmSync(`${log}.argv`, { force: true });
    fs.rmSync(`${log}.stdin`, { force: true });
    const content = fs.readFileSync(extensionFile(repoRoot, cli), 'utf8');
    for (const [, spec] of content.matchAll(/^import .* from '([^']+)';$/gm)) assert.match(spec, /^node:/, `only node builtins: ${spec}`);
    const handlers = await loadedHandlers(repoRoot, cli);
    assert.deepEqual(Object.keys(handlers).sort(), ['agent_end', 'tool_call', 'tool_result'], 'the opted-in extension loads in Node and registers its handlers');
    assert.deepEqual(await handlers.tool_result({ content: real }, stubCtx(repoRoot)), { content: [...real, { type: 'text', text: 'MBX-FRAME' }] });
    assert.equal(fs.readFileSync(`${log}.argv`, 'utf8').trim(), `hook mailbox --cli ${cli} --event post-tool-use`);
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });
}

test('the extension stays inert for a runner worker and never writes the process environment, and otherwise appends the host\'s frame after the tool\'s real output', async () => {
  const repoRoot = mkTempDir('agent-hooks-pi-runner-');
  writeMailboxOptIn(repoRoot, true);
  installThroughHost(repoRoot, 'pi');
  const log = path.join(repoRoot, 'shim-log');
  recordingShim(projectShimPath(repoRoot), log, MBX_ANSWER);
  const handlers = await loadedHandlers(repoRoot, 'pi');
  const real = [{ type: 'text', text: 'readme.txt' }];
  const before = { ...process.env };
  const saved = process.env.FGOS_SESSION_ID;
  try {
    process.env.FGOS_SESSION_ID = 'att-0001';
    assert.equal(await handlers.tool_result({ content: real }, stubCtx(repoRoot)), undefined, 'a runner worker gets nothing');
    await handlers.agent_end({}, stubCtx(repoRoot));
    assert.equal(fs.existsSync(`${log}.stdin`), false, 'the shim never ran for a runner worker');

    // Only a runner's id makes it inert: a session id a launcher set is the host's to judge.
    process.env.FGOS_SESSION_ID = 'launcher-0001';
    assert.deepEqual(await handlers.tool_result({ content: real }, stubCtx(repoRoot, { id: 'sess-6' })), { content: [...real, { type: 'text', text: 'MBX-FRAME' }] });
    fs.rmSync(`${log}.argv`);
    fs.rmSync(`${log}.stdin`);
    delete process.env.FGOS_SESSION_ID;
    const out = await handlers.tool_result({ content: real }, stubCtx(repoRoot, { id: 'sess-7' }));
    assert.deepEqual(out, { content: [...real, { type: 'text', text: 'MBX-FRAME' }] }, 'the frame follows the real output');
    await handlers.agent_end({}, stubCtx(repoRoot, { id: 'sess-7' }));
    await handlers.tool_result({ content: real }, stubCtx(repoRoot, { id: 'sess-8', parentSession: '/sessions/head.jsonl' }));
    assert.deepEqual(fs.readFileSync(`${log}.argv`, 'utf8').trim().split('\n'), ['hook mailbox --cli pi --event post-tool-use', 'hook mailbox --cli pi --event stop', 'hook mailbox --cli pi --event post-tool-use']);
    const payloads = fs.readFileSync(`${log}.stdin`, 'utf8').replace(/\}\{/g, '}\n{').split('\n').map((l) => JSON.parse(l));
    assert.deepEqual(payloads, [
      { session_id: 'sess-7', hook_event_name: 'PostToolUse', cwd: repoRoot, subagent: false },
      { session_id: 'sess-7', hook_event_name: 'Stop', cwd: repoRoot, subagent: false },
      { session_id: 'sess-8', hook_event_name: 'PostToolUse', cwd: repoRoot, subagent: true },
    ], 'the session goes in the payload only; a session with a parent is marked a subagent\'s');
  } finally {
    if (saved === undefined) delete process.env.FGOS_SESSION_ID;
    else process.env.FGOS_SESSION_ID = saved;
  }
  assert.deepEqual({ ...process.env }, before, 'the process environment is unchanged');
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('the generated extension treats exactly the minted attempt prefix as a runner worker', () => {
  // The extension runs in the agent process and cannot ask the crate; its literal must equal the crate's prefix.
  const attemptId = 'probe-1';
  const prefix = mintAttemptWriterId(attemptId).slice(0, -attemptId.length);
  const repoRoot = mkTempDir('agent-hooks-attempt-prefix-');
  writeMailboxOptIn(repoRoot, true);
  installThroughHost(repoRoot, 'pi');
  assert.ok(fs.readFileSync(extensionFile(repoRoot, 'pi'), 'utf8').includes(`.startsWith('${prefix}')`));
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('the extension refuses a shim another user owns', async () => {
  const repoRoot = mkTempDir('agent-hooks-omp-owner-');
  writeMailboxOptIn(repoRoot, true);
  installThroughHost(repoRoot, 'omp');
  const log = path.join(repoRoot, 'shim-log');
  recordingShim(projectShimPath(repoRoot), log, MBX_ANSWER);
  const handlers = await loadedHandlers(repoRoot, 'omp');
  const real = [{ type: 'text', text: 'x' }];
  const getuid = process.getuid;
  try {
    // Seen as another user, this user's shim is a foreign one.
    process.getuid = () => getuid.call(process) + 1;
    assert.equal(await handlers.tool_result({ content: real }, stubCtx(repoRoot)), undefined);
    assert.equal(fs.existsSync(`${log}.argv`), false, 'a foreign shim never runs');
  } finally {
    process.getuid = getuid;
  }
  assert.deepEqual(await handlers.tool_result({ content: real }, stubCtx(repoRoot)), { content: [...real, { type: 'text', text: 'MBX-FRAME' }] }, 'the falsifier: the user\'s own shim runs');
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('a hook that hangs holds the CLI no longer than the hook timeout, and the tool result keeps its real output', async () => {
  const repoRoot = mkTempDir('agent-hooks-pi-hang-');
  writeMailboxOptIn(repoRoot, true);
  installThroughHost(repoRoot, 'pi');
  const shim = projectShimPath(repoRoot);
  fs.mkdirSync(path.dirname(shim), { recursive: true });
  fs.writeFileSync(shim, '#!/bin/sh\ncat > /dev/null\nexec sleep 120\n', { mode: 0o755 });
  const handlers = await loadedHandlers(repoRoot, 'pi');
  const bound = mailboxHookTimeoutSec() * 1000;
  const started = Date.now();
  assert.equal(await handlers.tool_result({ content: [{ type: 'text', text: 'x' }] }, stubCtx(repoRoot)), undefined);
  const took = Date.now() - started;
  assert.ok(took >= bound - 200 && took < bound + 5000, `blocked ${took} ms against a ${bound} ms bound`);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('the extension finds the shim from a subdirectory and refuses a group-writable shim or one that is not a regular file', async () => {
  const repoRoot = mkTempDir('agent-hooks-omp-walk-');
  writeMailboxOptIn(repoRoot, true);
  installThroughHost(repoRoot, 'omp');
  const shim = projectShimPath(repoRoot);
  const log = path.join(repoRoot, 'shim-log');
  recordingShim(shim, log, MBX_ANSWER);
  const handlers = await loadedHandlers(repoRoot, 'omp');
  const deep = path.join(repoRoot, 'src', 'deep');
  fs.mkdirSync(deep, { recursive: true });
  const real = [{ type: 'text', text: 'x' }];
  assert.deepEqual(await handlers.tool_result({ content: real }, stubCtx(deep)), { content: [...real, { type: 'text', text: 'MBX-FRAME' }] }, 'found by walking up');

  fs.chmodSync(shim, 0o775);
  assert.equal(await handlers.tool_result({ content: real }, stubCtx(deep)), undefined, 'a group-writable shim is refused');
  fs.chmodSync(shim, 0o757);
  assert.equal(await handlers.tool_result({ content: real }, stubCtx(deep)), undefined, 'a world-writable shim is refused');
  fs.renameSync(shim, `${shim}.real`);
  fs.chmodSync(`${shim}.real`, 0o755);
  fs.symlinkSync(`${shim}.real`, shim);
  assert.equal(await handlers.tool_result({ content: real }, stubCtx(deep)), undefined, 'a link in the shim\'s place is refused');
  // The nearest candidate decides: an unusable shim below never falls through to one above.
  fs.rmSync(shim);
  fs.renameSync(`${shim}.real`, shim);
  const inner = projectShimPath(deep);
  recordingShim(inner, path.join(repoRoot, 'inner-log'), '{"inject":"INNER","method":"tool-result"}');
  fs.chmodSync(inner, 0o777);
  assert.equal(await handlers.tool_result({ content: real }, stubCtx(deep)), undefined);
  assert.equal(fs.readFileSync(`${log}.argv`, 'utf8').trim().split('\n').length, 1, 'only the first call reached the project shim');
  // A host answer in any other shape, or naming another method, is ignored.
  fs.rmSync(path.join(deep, '.fgos'), { recursive: true });
  recordingShim(shim, log, '{"inject":"MBX-FRAME","method":"send-user-message"}');
  assert.equal(await handlers.tool_result({ content: real }, stubCtx(deep)), undefined);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});
