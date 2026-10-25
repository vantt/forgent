import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readProjectConfig, writeProjectConfig } from '../helpers/config-fixture.mjs';
import { mailboxHookTimeoutSec, mailboxOptIn } from '../../src/setup/mailbox-limits.mjs';
import { parseYaml } from '../../src/util/yaml.mjs';

import {
  installClaudeHook,
  checkClaudeHook,
  isClaudeHookConfigured,
  installCodexHook,
  checkCodexHook,
  installAgyHook,
  checkAgyHook,
  installOmpHook,
  checkOmpHook,
  installPiHook,
  checkPiHook,
  installAllAgentHooks,
  checkAllAgentHooks,
  getProjectShimPath,
  isShimRunnable,
  agentHookRows,
} from '../../src/setup/agent-hooks.mjs';

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/** Opts the project in to (or out of) the mailbox hook rows through its own config section. */
function writeMailboxOptIn(repoRoot, enabled) {
  const config = readProjectConfig(repoRoot);
  config.mailbox = { ...(config.mailbox ?? {}), enabled };
  writeProjectConfig(repoRoot, config);
}

function mockRunnableShim(repoRoot) {
  const shimPath = getProjectShimPath(repoRoot);
  fs.mkdirSync(path.dirname(shimPath), { recursive: true });
  // Write a minimal mock node script that handles `hook dispatch-decide`
  const mockScript = `#!/usr/bin/env node
const [,, verb, kind] = process.argv;
if (verb === 'hook') process.exit(0);
process.exit(1);
`;
  fs.writeFileSync(shimPath, mockScript, { mode: 0o755 });
}

// ---------------------------------------------------------------------------
// 1. Claude Code
// ---------------------------------------------------------------------------

test('installClaudeHook writes canonical commands for both guards', () => {
  const repoRoot = mkTempDir('agent-hooks-claude-fresh-');
  const res = installClaudeHook(repoRoot);
  assert.equal(res.wired, true);
  assert.equal(res.skippedExisting, null);

  const settings = JSON.parse(fs.readFileSync(path.join(repoRoot, '.claude', 'settings.json'), 'utf8'));
  assert.equal(settings.hooks.PreToolUse.length, 2);
  assert.equal(settings.hooks.PreToolUse[0].matcher, 'Agent|Task');
  assert.equal(
    settings.hooks.PreToolUse[0].hooks[0].command,
    '"${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos" hook dispatch-decide',
  );
  assert.equal(settings.hooks.PreToolUse[1].matcher, 'AskUserQuestion');
  assert.equal(
    settings.hooks.PreToolUse[1].hooks[0].command,
    '"${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos" hook decision-question',
  );

  assert.equal(isClaudeHookConfigured(repoRoot), true);

  // Before shim is created, doctor check reports unrunnable
  const checkBefore = checkClaudeHook(repoRoot);
  assert.equal(checkBefore.passed, false);
  assert.match(checkBefore.message, /local shim not runnable/);

  // Mock runnable shim
  mockRunnableShim(repoRoot);
  const checkAfter = checkClaudeHook(repoRoot);
  assert.equal(checkAfter.passed, true);

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('installClaudeHook migrates legacy script commands in-place without duplicating', () => {
  const repoRoot = mkTempDir('agent-hooks-claude-migrate-');
  fs.mkdirSync(path.join(repoRoot, '.claude'), { recursive: true });
  const legacy = {
    hooks: {
      PreToolUse: [
        {
          matcher: 'Agent|Task',
          hooks: [{ type: 'command', command: 'node "${CLAUDE_PROJECT_DIR}/scripts/dispatch-decide-hook.mjs"' }],
        },
        {
          matcher: 'CustomTool',
          hooks: [{ type: 'command', command: 'node custom-audit.mjs' }],
        },
      ],
    },
  };
  fs.writeFileSync(path.join(repoRoot, '.claude', 'settings.json'), JSON.stringify(legacy, null, 2));

  // Before install, isClaudeHookConfigured recognizes legacy owned entry
  assert.equal(isClaudeHookConfigured(repoRoot), false); // decision-question was missing

  installClaudeHook(repoRoot);
  const migrated = JSON.parse(fs.readFileSync(path.join(repoRoot, '.claude', 'settings.json'), 'utf8'));

  // dispatch-decide entry migrated, decision-question added, CustomTool untouched
  assert.equal(migrated.hooks.PreToolUse.length, 3);
  assert.equal(
    migrated.hooks.PreToolUse[0].hooks[0].command,
    '"${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos" hook dispatch-decide',
  );
  assert.equal(migrated.hooks.PreToolUse[1].matcher, 'CustomTool');
  assert.equal(migrated.hooks.PreToolUse[1].hooks[0].command, 'node custom-audit.mjs');
  assert.equal(
    migrated.hooks.PreToolUse[2].hooks[0].command,
    '"${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos" hook decision-question',
  );

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('installClaudeHook leaves malformed JSON untouched', () => {
  const repoRoot = mkTempDir('agent-hooks-claude-malformed-');
  fs.mkdirSync(path.join(repoRoot, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.claude', 'settings.json'), '{ not json');
  const res = installClaudeHook(repoRoot);
  assert.equal(res.wired, false);
  assert.equal(res.skippedExisting, 'malformed');
  assert.equal(fs.readFileSync(path.join(repoRoot, '.claude', 'settings.json'), 'utf8'), '{ not json');
  assert.equal(checkClaudeHook(repoRoot).passed, false);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// 2. Codex CLI
// ---------------------------------------------------------------------------

test('installCodexHook wires .codex/hooks.json and checkCodexHook probes cleanly', () => {
  const repoRoot = mkTempDir('agent-hooks-codex-');

  // When .codex doesn't exist, checkCodexHook is not required (passed: true)
  assert.equal(checkCodexHook(repoRoot).passed, true);

  installCodexHook(repoRoot);
  const hooksFile = path.join(repoRoot, '.codex', 'hooks.json');
  assert.equal(fs.existsSync(hooksFile), true);

  const config = JSON.parse(fs.readFileSync(hooksFile, 'utf8'));
  assert.equal(config.hooks.PreToolUse.length, 2);
  const shim = path.join(repoRoot, '.fgos', 'installation', 'bin', 'fgos');
  assert.equal(config.hooks.PreToolUse[0].hooks[0].command, `'${shim}' hook dispatch-decide`);
  assert.equal(config.hooks.PreToolUse[1].hooks[0].command, `'${shim}' hook decision-question`);

  // Without shim, check fails
  assert.equal(checkCodexHook(repoRoot).passed, false);

  mockRunnableShim(repoRoot);
  assert.equal(checkCodexHook(repoRoot).passed, true);

  // Idempotence test
  installCodexHook(repoRoot);
  const afterSecond = JSON.parse(fs.readFileSync(hooksFile, 'utf8'));
  assert.equal(afterSecond.hooks.PreToolUse.length, 2);

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// 3. AGY
// ---------------------------------------------------------------------------

test('installAgyHook wires .agents/hooks.json with --format=agy and checkAgyHook probes cleanly', () => {
  const repoRoot = mkTempDir('agent-hooks-agy-');

  assert.equal(checkAgyHook(repoRoot).passed, true);

  installAgyHook(repoRoot);
  const hooksFile = path.join(repoRoot, '.agents', 'hooks.json');
  assert.equal(fs.existsSync(hooksFile), true);

  const config = JSON.parse(fs.readFileSync(hooksFile, 'utf8'));
  assert.equal(config['fgos-dispatch-guard'].enabled, true);
  const shim = path.join(repoRoot, '.fgos', 'installation', 'bin', 'fgos');
  assert.equal(config['fgos-dispatch-guard'].PreToolUse[0].hooks[0].command, `'${shim}' hook dispatch-decide --format=agy`);
  assert.equal(config['fgos-decision-guard'].PreToolUse[0].hooks[0].command, `'${shim}' hook decision-question --format=agy`);

  // Without shim, check fails
  assert.equal(checkAgyHook(repoRoot).passed, false);

  mockRunnableShim(repoRoot);
  assert.equal(checkAgyHook(repoRoot).passed, true);

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('codex and agy hooks: an old cwd-relative command is reported and replaced by the absolute one', () => {
  const repoRoot = mkTempDir('agent-hooks-relative-');
  mockRunnableShim(repoRoot);
  const codexFile = path.join(repoRoot, '.codex', 'hooks.json');
  const agyFile = path.join(repoRoot, '.agents', 'hooks.json');
  fs.mkdirSync(path.dirname(codexFile), { recursive: true });
  fs.mkdirSync(path.dirname(agyFile), { recursive: true });
  fs.writeFileSync(codexFile, JSON.stringify({ hooks: { PreToolUse: [
    { matcher: '.*', hooks: [{ type: 'command', command: '.fgos/installation/bin/fgos hook dispatch-decide' }] },
  ] } }));
  fs.writeFileSync(agyFile, JSON.stringify({ 'fgos-dispatch-guard': { enabled: true, PreToolUse: [
    { matcher: '.*', hooks: [{ type: 'command', command: '.fgos/installation/bin/fgos hook dispatch-decide --format=agy', timeout: 10 }] },
  ] } }));
  assert.equal(checkCodexHook(repoRoot).passed, false);
  assert.equal(checkAgyHook(repoRoot).passed, false);

  installCodexHook(repoRoot);
  installAgyHook(repoRoot);

  assert.equal(checkCodexHook(repoRoot).passed, true);
  assert.equal(checkAgyHook(repoRoot).passed, true);
  const shim = path.join(repoRoot, '.fgos', 'installation', 'bin', 'fgos');
  const codex = JSON.parse(fs.readFileSync(codexFile, 'utf8'));
  assert.equal(codex.hooks.PreToolUse.filter((e) => e.hooks.some((h) => h.command.includes('dispatch-decide'))).length, 1, 'replaced, not duplicated');
  assert.ok(codex.hooks.PreToolUse.every((e) => e.hooks.every((h) => h.command.startsWith(`'${shim}'`))));
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('codex hook command quotes a project path that contains a space and a quote', () => {
  const base = mkTempDir('agent-hooks-quote-');
  const repoRoot = path.join(base, "my proj'ect");
  fs.mkdirSync(repoRoot, { recursive: true });
  installCodexHook(repoRoot);
  const command = JSON.parse(fs.readFileSync(path.join(repoRoot, '.codex', 'hooks.json'), 'utf8')).hooks.PreToolUse[0].hooks[0].command;
  const shim = path.join(repoRoot, '.fgos', 'installation', 'bin', 'fgos');
  assert.equal(command, `'${shim.replace(/'/g, "'\\''")}' hook dispatch-decide`);
  fs.rmSync(base, { recursive: true, force: true });
});

test('codex and agy hook commands run from a directory other than the project, even when the path is awkward or names a hook kind', () => {
  const base = mkTempDir('agent-hooks-exec-');
  const repoRoot = path.join(base, "my decision-question 'app");
  fs.mkdirSync(repoRoot, { recursive: true });
  mockRunnableShim(repoRoot);
  installCodexHook(repoRoot);
  installAgyHook(repoRoot);

  const codex = JSON.parse(fs.readFileSync(path.join(repoRoot, '.codex', 'hooks.json'), 'utf8')).hooks.PreToolUse;
  assert.equal(codex.length, 2, 'both codex hooks are present even though the path contains a kind name');
  const agy = JSON.parse(fs.readFileSync(path.join(repoRoot, '.agents', 'hooks.json'), 'utf8'));
  const commands = [
    ...codex.map((e) => e.hooks[0].command),
    agy['fgos-dispatch-guard'].PreToolUse[0].hooks[0].command,
  ];
  for (const command of commands) {
    const res = spawnSync('sh', ['-c', command], { cwd: os.tmpdir(), input: '{}', encoding: 'utf8', timeout: 5000 });
    assert.notEqual(res.status, 127, `${command} was not found from another directory`);
  }
  fs.rmSync(base, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// 4. OMP
// ---------------------------------------------------------------------------

// OMP and Pi load the same generated extension in process; a file that does not
// load drops both guards, so the owning proof imports what the installer wrote.
for (const [cli, install, check] of [['omp', installOmpHook, checkOmpHook], ['pi', installPiHook, checkPiHook]]) {
  test(`the ${cli} extension the installer writes loads, and check passes only on the exact generated file`, async () => {
    const repoRoot = mkTempDir(`agent-hooks-${cli}-`);
    assert.equal(check(repoRoot).passed, true, 'no extension directory: not required');

    install(repoRoot);
    const extFile = path.join(repoRoot, `.${cli}`, 'extensions', 'fgos-hooks.ts');
    const content = fs.readFileSync(extFile, 'utf8');
    for (const [, spec] of content.matchAll(/^import .* from '([^']+)';$/gm)) {
      assert.match(spec, /^node:/, `the extension imports only node builtins, not ${spec}`);
    }
    const mod = await import(`${extFile}?load=${Date.now()}`);
    assert.equal(typeof mod.default, 'function', 'the extension loads and exports its entry');
    assert.match(content, /hook', 'dispatch-decide'/);
    assert.match(content, /hook', 'decision-question'/);

    assert.equal(check(repoRoot).passed, false, 'without a runnable shim the check fails');
    mockRunnableShim(repoRoot);
    assert.equal(check(repoRoot).passed, true);

    fs.writeFileSync(extFile, `${content}\n// edited\n`);
    const drift = check(repoRoot);
    assert.equal(drift.passed, false, 'a file that differs from the generated one fails, even with both guard names in it');
    assert.match(drift.message, /doctor --fix/);

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });
}

/** The handlers the generated extension of an opted-in `cli` project registers, by event, loaded from what the installer wrote. */
async function loadedHandlers(repoRoot, cli) {
  const extFile = path.join(repoRoot, `.${cli}`, 'extensions', 'fgos-hooks.ts');
  const mod = await import(`${extFile}?load=${Date.now()}-${Math.random()}`);
  const handlers = {};
  mod.default({ on: (event, fn) => { handlers[event] = fn; } });
  return handlers;
}

/** A shim that records each call's argv and stdin under `log` and answers `answer` on stdout. */
function recordingShim(shimPath, log, answer) {
  fs.mkdirSync(path.dirname(shimPath), { recursive: true });
  fs.writeFileSync(shimPath, `#!/bin/sh\nprintf '%s\\n' "$*" >> '${log}.argv'\ncat >> '${log}.stdin'\nprintf '%s' '${answer}'\n`, { mode: 0o755 });
}

/** A stub of the CLI's handler context: its directory and its session manager. */
const stubCtx = (cwd, { id = 'sess-0001', parentSession } = {}) => ({ cwd, sessionManager: { getSessionId: () => id, getHeader: () => ({ type: 'session', id, ...(parentSession ? { parentSession } : {}) }) } });

for (const cli of ['omp', 'pi']) {
  test(`the generated ${cli} extension carries the mailbox handlers only for an opted-in project and doctor accepts exactly that file`, async () => {
    const repoRoot = mkTempDir(`agent-hooks-${cli}-mailbox-`);
    mockRunnableShim(repoRoot);
    const install = cli === 'omp' ? installOmpHook : installPiHook;
    const check = cli === 'omp' ? checkOmpHook : checkPiHook;
    const extFile = path.join(repoRoot, `.${cli}`, 'extensions', 'fgos-hooks.ts');
    install(repoRoot);
    assert.ok(!fs.readFileSync(extFile, 'utf8').includes("'mailbox'"), 'not opted in: no mailbox handler');
    assert.equal(check(repoRoot).passed, true);

    writeMailboxOptIn(repoRoot, true);
    assert.equal(check(repoRoot).passed, false, 'opting in without reinstalling leaves a file that differs from the generated one');
    install(repoRoot);
    const content = fs.readFileSync(extFile, 'utf8');
    assert.match(content, new RegExp(`MAILBOX_CLI = '${cli}'`));
    assert.match(content, /'hook', 'mailbox', '--cli', MAILBOX_CLI, '--event', event/);
    for (const [, spec] of content.matchAll(/^import .* from '([^']+)';$/gm)) assert.match(spec, /^node:/, `only node builtins: ${spec}`);
    const handlers = await loadedHandlers(repoRoot, cli);
    assert.deepEqual(Object.keys(handlers).sort(), ['agent_end', 'tool_call', 'tool_result'], 'the opted-in extension loads in Node and registers its handlers');
    assert.equal(check(repoRoot).passed, true, 'doctor accepts exactly the generated opted-in file');
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });
}

test('the extension stays inert for a runner worker and never writes the process environment, and otherwise appends the host\'s frame after the tool\'s real output', async () => {
  const repoRoot = mkTempDir('agent-hooks-pi-runner-');
  writeMailboxOptIn(repoRoot, true);
  installPiHook(repoRoot);
  const log = path.join(repoRoot, 'shim-log');
  recordingShim(getProjectShimPath(repoRoot), log, '{"inject":"MBX-FRAME","method":"tool-result"}');
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

test('the extension refuses a shim another user owns', async () => {
  const repoRoot = mkTempDir('agent-hooks-omp-owner-');
  writeMailboxOptIn(repoRoot, true);
  installOmpHook(repoRoot);
  const log = path.join(repoRoot, 'shim-log');
  recordingShim(getProjectShimPath(repoRoot), log, '{"inject":"MBX-FRAME","method":"tool-result"}');
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
  installPiHook(repoRoot);
  const shim = getProjectShimPath(repoRoot);
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
  installOmpHook(repoRoot);
  const shim = getProjectShimPath(repoRoot);
  const log = path.join(repoRoot, 'shim-log');
  recordingShim(shim, log, '{"inject":"MBX-FRAME","method":"tool-result"}');
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
  const inner = getProjectShimPath(deep);
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

// ---------------------------------------------------------------------------
// 6. Aggregate installer and checker
// ---------------------------------------------------------------------------

test('installAllAgentHooks configures all 5 agents and checkAllAgentHooks verifies them', () => {
  const repoRoot = mkTempDir('agent-hooks-all-');
  mockRunnableShim(repoRoot);

  const installResults = installAllAgentHooks(repoRoot);
  assert.equal(installResults.claude.wired, true);
  assert.equal(installResults.codex.wired, true);
  assert.equal(installResults.agy.wired, true);
  assert.equal(installResults.omp.wired, true);
  assert.equal(installResults.pi.wired, true);

  const checkResults = checkAllAgentHooks(repoRoot);
  assert.equal(checkResults.claude.passed, true);
  assert.equal(checkResults.codex.passed, true);
  assert.equal(checkResults.agy.passed, true);
  assert.equal(checkResults.omp.passed, true);
  assert.equal(checkResults.pi.passed, true);

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('the runnable probe works when doctor itself runs inside the fgos host (recursion guard set)', () => {
  const repoRoot = mkTempDir('agent-hooks-guard-');
  const shimPath = getProjectShimPath(repoRoot);
  fs.mkdirSync(path.dirname(shimPath), { recursive: true });
  // Like the real host: refuse when its recursion guard is inherited.
  fs.writeFileSync(shimPath, `#!/usr/bin/env node
if (process.env.FGOS_RUST_HOST_RECURSION_GUARD) process.exit(1);
process.exit(process.argv[2] === 'hook' ? 0 : 1);
`, { mode: 0o755 });
  const saved = process.env.FGOS_RUST_HOST_RECURSION_GUARD;
  process.env.FGOS_RUST_HOST_RECURSION_GUARD = '1';
  try {
    assert.deepEqual(isShimRunnable(repoRoot), { runnable: true, reason: null });
  } finally {
    if (saved === undefined) delete process.env.FGOS_RUST_HOST_RECURSION_GUARD;
    else process.env.FGOS_RUST_HOST_RECURSION_GUARD = saved;
  }
});

// ---------------------------------------------------------------------------
// The hook table and the mailbox rows
// ---------------------------------------------------------------------------

const FILES = { claude: '.claude/settings.json', codex: '.codex/hooks.json', agy: '.agents/hooks.json' };
const INSTALL = { claude: installClaudeHook, codex: installCodexHook, agy: installAgyHook };
const CHECK = { claude: checkClaudeHook, codex: checkCodexHook, agy: checkAgyHook };
const readFile = (repoRoot, cli) => JSON.parse(fs.readFileSync(path.join(repoRoot, FILES[cli]), 'utf8'));

/** Every hook object of `config` with `command`, wherever it sits. */
function hooksWith(config, command) {
  const found = [];
  const walk = (node) => {
    if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === 'object') {
      if (node.command === command) found.push(node);
      Object.values(node).forEach(walk);
    }
  };
  walk(config);
  return found;
}

test('the hook table is the only source of each CLI\'s rows', () => {
  const repoRoot = mkTempDir('agent-hooks-table-');
  mockRunnableShim(repoRoot);
  writeMailboxOptIn(repoRoot, true);
  const rows = agentHookRows(repoRoot);
  for (const cli of ['claude', 'codex', 'agy']) {
    assert.equal(INSTALL[cli](repoRoot).wired, true);
    INSTALL[cli](repoRoot);
    const config = readFile(repoRoot, cli);
    for (const row of rows.filter((r) => r.cli === cli)) {
      const found = hooksWith(config, row.command);
      assert.equal(found.length, 1, `${cli} ${row.kind} ${row.event}: exactly once after two installs`);
      const entries = row.group ? config[row.group][row.event] : config.hooks[row.event];
      const entry = entries.find((e) => e.hooks?.includes(found[0]));
      assert.ok(entry, `${cli} ${row.kind} ${row.event}: nested in an entry with a hooks array`);
      assert.equal(entry.matcher, row.matcher ?? undefined);
    }
    assert.equal(CHECK[cli](repoRoot).passed, true, CHECK[cli](repoRoot).message);
  }
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('mailbox rows install Stop and PostToolUse for Claude Code and Codex and none for agy; omp and pi get theirs in the extension', () => {
  const repoRoot = mkTempDir('agent-hooks-mailbox-rows-');
  writeMailboxOptIn(repoRoot, true);
  installAllAgentHooks(repoRoot);
  const mailbox = agentHookRows(repoRoot).filter((row) => row.kind === 'mailbox');
  assert.deepEqual(mailbox.map((row) => `${row.cli} ${row.event}`).sort(), ['claude PostToolUse', 'claude Stop', 'codex PostToolUse', 'codex Stop']);
  const claude = readFile(repoRoot, 'claude');
  assert.deepEqual(claude.hooks.Stop, [{ hooks: [{ type: 'command', command: mailbox.find((r) => r.cli === 'claude' && r.event === 'Stop').command, timeout: 10 }] }]);
  assert.equal(claude.hooks.PostToolUse[0].matcher, '*');
  const shim = path.join(fs.realpathSync(repoRoot), '.fgos', 'installation', 'bin', 'fgos');
  const codex = readFile(repoRoot, 'codex');
  assert.deepEqual(codex.hooks.Stop, [{ hooks: [{ type: 'command', command: `'${shim}' hook mailbox --cli codex --event stop`, timeout: 10 }] }]);
  assert.deepEqual(codex.hooks.PostToolUse, [{ hooks: [{ type: 'command', command: `'${shim}' hook mailbox --cli codex --event post-tool-use`, timeout: 10 }] }]);
  assert.ok(!JSON.stringify(readFile(repoRoot, 'agy')).includes('hook mailbox'));
  // The rows' timeout comes from the standard's hook budget, so no config may raise the budget past it:
  // the schema caps mailbox.hook.budgetMs, and a larger value is refused instead of outliving the CLI's cut.
  const budgetMs = parseYaml(fs.readFileSync(fileURLToPath(new URL('../../core/config-schema/mailbox.schema.yaml', import.meta.url)), 'utf8')).properties.hook.properties.budgetMs;
  assert.ok(mailboxHookTimeoutSec() * 1000 >= budgetMs.maximum + 2000, `a ${mailboxHookTimeoutSec()} s timeout covers a ${budgetMs.maximum} ms budget`);
  writeProjectConfig(repoRoot, { mailbox: { enabled: true, hook: { budgetMs: budgetMs.maximum + 1 } } });
  const over = mailboxOptIn(repoRoot);
  assert.deepEqual([over.state, over.reason], ['refused', 'config:config-schema']);
  writeMailboxOptIn(repoRoot, true);
  for (const ext of ['.omp/extensions/fgos-hooks.ts', '.pi/extensions/fgos-hooks.ts']) {
    assert.ok(fs.readFileSync(path.join(repoRoot, ext), 'utf8').includes("'mailbox'"), ext);
  }
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('mailbox rows install only when the project opts in, and opting out removes exactly our rows', () => {
  const repoRoot = mkTempDir('agent-hooks-mailbox-optin-');
  mockRunnableShim(repoRoot);
  fs.mkdirSync(path.join(repoRoot, '.codex'), { recursive: true });
  const ours = agentHookRows(repoRoot).filter((row) => row.kind === 'mailbox');
  const mailboxIn = (cli) => ours.filter((row) => row.cli === cli).filter((row) => hooksWith(readFile(repoRoot, cli), row.command).length).length;

  // Absent section: no mailbox rows, and the checks do not ask for them.
  installClaudeHook(repoRoot);
  installCodexHook(repoRoot);
  assert.equal(mailboxIn('claude') + mailboxIn('codex'), 0);
  assert.equal(checkClaudeHook(repoRoot).passed, true, checkClaudeHook(repoRoot).message);
  assert.equal(checkCodexHook(repoRoot).passed, true, checkCodexHook(repoRoot).message);

  // On: both CLIs' rows; Codex's stays the plain shim form.
  writeMailboxOptIn(repoRoot, true);
  assert.equal(checkClaudeHook(repoRoot).passed, false, 'an opted-in project without the rows fails');
  installClaudeHook(repoRoot);
  installCodexHook(repoRoot);
  assert.equal(mailboxIn('claude'), 2);
  assert.equal(mailboxIn('codex'), 2);
  const shim = path.join(fs.realpathSync(repoRoot), '.fgos', 'installation', 'bin', 'fgos');
  assert.equal(ours.find((r) => r.cli === 'codex' && r.event === 'Stop').command, `'${shim}' hook mailbox --cli codex --event stop`);

  // Refused: a config the Config door refuses leaves the opt-in unknown, so the installed rows stay
  // exactly as they are (nothing added, nothing removed) and the installer names the refusal.
  const installedClaude = fs.readFileSync(path.join(repoRoot, '.claude', 'settings.json'), 'utf8');
  const installedCodex = fs.readFileSync(path.join(repoRoot, '.codex', 'hooks.json'), 'utf8');
  const extensions = [['pi', installPiHook], ['omp', installOmpHook]].map(([cli, install]) => {
    install(repoRoot);
    const file = path.join(repoRoot, `.${cli}`, 'extensions', 'fgos-hooks.ts');
    return { cli, install, file, installed: fs.readFileSync(file, 'utf8') };
  });
  writeProjectConfig(repoRoot, { mailbox: { enabled: 'yes' } });
  const refused = installClaudeHook(repoRoot);
  assert.match(refused.mailbox, /config:config-schema in project:config\.yaml/);
  assert.match(installCodexHook(repoRoot).mailbox, /config:config-schema/);
  assert.equal(fs.readFileSync(path.join(repoRoot, '.claude', 'settings.json'), 'utf8'), installedClaude, 'Claude Code rows untouched');
  assert.equal(fs.readFileSync(path.join(repoRoot, '.codex', 'hooks.json'), 'utf8'), installedCodex, 'Codex rows untouched');
  for (const { cli, install, file, installed } of extensions) {
    assert.match(install(repoRoot).mailbox, /config:config-schema/, cli);
    assert.equal(fs.readFileSync(file, 'utf8'), installed, `${cli} extension untouched, its mailbox handlers kept`);
  }
  writeMailboxOptIn(repoRoot, true);

  // A user's own command that merely runs the same kind stays when the project opts out.
  const settingsFile = path.join(repoRoot, '.claude', 'settings.json');
  const settings = readFile(repoRoot, 'claude');
  const userOwn = `"\${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos" hook mailbox --cli claude --event stop`;
  settings.hooks.Stop.push({ hooks: [{ type: 'command', command: userOwn }] });
  fs.writeFileSync(settingsFile, JSON.stringify(settings));

  // Off again: exactly our rows go; the guards and the user's hook stay.
  writeMailboxOptIn(repoRoot, false);
  installClaudeHook(repoRoot);
  installCodexHook(repoRoot);
  assert.equal(mailboxIn('claude') + mailboxIn('codex'), 0);
  const after = readFile(repoRoot, 'claude');
  assert.deepEqual(after.hooks.Stop, [{ hooks: [{ type: 'command', command: userOwn }] }]);
  assert.equal(after.hooks.PostToolUse, undefined, 'an event left empty by our removal is dropped');
  assert.equal(after.hooks.PreToolUse.length, 2, 'the guards stay');
  assert.equal(readFile(repoRoot, 'codex').hooks.Stop, undefined);
  assert.equal(checkClaudeHook(repoRoot).passed, true);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('the claude mailbox command is guarded and never execs', () => {
  for (const row of agentHookRows('/x').filter((r) => r.cli === 'claude' && r.kind === 'mailbox')) {
    assert.ok(row.command.includes('[ -x "$S" ] || exit 0;'), row.command);
    assert.ok(row.command.endsWith('|| true'), row.command);
    assert.ok(!/\bexec\b/.test(row.command), row.command);
  }
  // A project with no shim: the command exits 0 and prints nothing.
  const repoRoot = mkTempDir('agent-hooks-guarded-');
  const command = agentHookRows(repoRoot).find((r) => r.cli === 'claude' && r.event === 'Stop').command;
  const res = spawnSync('/bin/sh', ['-c', command], { env: { ...process.env, CLAUDE_PROJECT_DIR: repoRoot }, input: '{}', encoding: 'utf8' });
  assert.equal(res.status, 0);
  assert.equal(res.stdout + res.stderr, '');
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('command is kind recognises its own entries with cli and event and never a user hook or a path containing a kind name', () => {
  const base = mkTempDir('agent-hooks-kind-');
  const repoRoot = path.join(base, 'my mailbox-app');
  fs.mkdirSync(path.join(repoRoot, '.codex'), { recursive: true });
  writeMailboxOptIn(repoRoot, true);
  const moved = `'/old/place/.fgos/installation/bin/fgos' hook mailbox --cli codex --event stop`;
  const userHooks = [
    `/usr/local/bin/fgos hook mailbox --cli codex --event stop`,
    `'/old/place/.fgos/installation/bin/fgos' hook mailbox --event stop --cli codex`,
    `'/old/place/.fgos/installation/bin/fgos' hook mailbox-foo --cli codex --event stop`,
  ];
  fs.writeFileSync(path.join(repoRoot, '.codex', 'hooks.json'), JSON.stringify({ hooks: { Stop: [
    { hooks: [{ type: 'command', command: moved }] },
    ...userHooks.map((command) => ({ hooks: [{ type: 'command', command }] })),
  ] } }));
  installCodexHook(repoRoot);
  const stop = readFile(repoRoot, 'codex').hooks.Stop;
  const ours = agentHookRows(repoRoot).find((r) => r.cli === 'codex' && r.event === 'Stop').command;
  assert.equal(stop[0].hooks[0].command, ours, 'our moved command is replaced in place');
  assert.deepEqual(stop.slice(1).map((e) => e.hooks[0].command), userHooks, 'user hooks stay as they were');
  assert.equal(stop.length, 4, 'nothing duplicated');
  fs.rmSync(base, { recursive: true, force: true });
});

test('install preserves user hooks on the same events and is idempotent', () => {
  const repoRoot = mkTempDir('agent-hooks-siblings-');
  fs.mkdirSync(path.join(repoRoot, '.claude'), { recursive: true });
  writeMailboxOptIn(repoRoot, true);
  const userStop = { hooks: [{ type: 'command', command: 'say-done.sh' }] };
  const older = `"\${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos" hook mailbox --cli claude --event post-tool-use`;
  fs.writeFileSync(path.join(repoRoot, '.claude', 'settings.json'), JSON.stringify({ hooks: {
    Stop: [userStop],
    PostToolUse: [{ matcher: '*', hooks: [{ type: 'command', command: 'audit.sh' }, { type: 'command', command: older }] }],
  } }));
  installClaudeHook(repoRoot);
  installClaudeHook(repoRoot);
  const settings = readFile(repoRoot, 'claude');
  const rows = agentHookRows(repoRoot);
  const post = rows.find((r) => r.cli === 'claude' && r.event === 'PostToolUse');
  assert.deepEqual(settings.hooks.Stop[0], userStop);
  assert.equal(settings.hooks.Stop.length, 2);
  assert.equal(settings.hooks.PostToolUse.length, 1, 'our hook replaced inside the shared entry');
  assert.deepEqual(settings.hooks.PostToolUse[0].hooks, [{ type: 'command', command: 'audit.sh' }, { type: 'command', command: post.command, timeout: 10 }]);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('a command whose tail merely reads like ours is not owned', () => {
  const repoRoot = mkTempDir('agent-hooks-tail-');
  fs.mkdirSync(path.join(repoRoot, '.codex'), { recursive: true });
  writeMailboxOptIn(repoRoot, true);
  const lookalikes = [
    `bash -c 'x; echo hook mailbox --cli codex --event stop'`,
    `mywrap '${repoRoot}/.fgos/installation/bin/fgos' hook mailbox --cli codex --event stop`,
  ];
  fs.writeFileSync(path.join(repoRoot, '.codex', 'hooks.json'), JSON.stringify({ hooks: { Stop: lookalikes.map((command) => ({ hooks: [{ type: 'command', command }] })) } }));
  installCodexHook(repoRoot);
  const stop = readFile(repoRoot, 'codex').hooks.Stop;
  assert.deepEqual(stop.slice(0, 2).map((e) => e.hooks[0].command), lookalikes);
  assert.equal(stop.length, 3, 'ours was added beside them');
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('a wrong file shape is skipped silently and reported by check', () => {
  const repoRoot = mkTempDir('agent-hooks-shape-');
  mockRunnableShim(repoRoot);
  writeMailboxOptIn(repoRoot, true);
  const rows = agentHookRows(repoRoot);
  const stop = rows.find((r) => r.cli === 'claude' && r.event === 'Stop');
  installClaudeHook(repoRoot);
  const settings = readFile(repoRoot, 'claude');
  // The V4 L2 case: our Stop hook as a flat object, which Claude Code does not run.
  settings.hooks.Stop = [{ type: 'command', command: stop.command }];
  fs.writeFileSync(path.join(repoRoot, '.claude', 'settings.json'), JSON.stringify(settings));
  const before = checkClaudeHook(repoRoot);
  assert.equal(before.passed, false);
  assert.match(before.message, /mailbox Stop.*in a shape Claude Code does not read: mailbox Stop/);
  assert.equal(installClaudeHook(repoRoot).wired, true, 'the flat entry is skipped without an error');
  const after = readFile(repoRoot, 'claude').hooks.Stop;
  assert.deepEqual(after[0], { type: 'command', command: stop.command }, 'left as it was');
  assert.equal(checkClaudeHook(repoRoot).passed, true);

  // agy: a group whose PreToolUse holds a flat hook instead of a matcher group.
  const dispatch = rows.find((r) => r.cli === 'agy' && r.kind === 'dispatch-decide');
  fs.mkdirSync(path.join(repoRoot, '.agents'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.agents', 'hooks.json'), JSON.stringify({ [dispatch.group]: { enabled: true, PreToolUse: [{ type: 'command', command: dispatch.command }] } }));
  assert.match(checkAgyHook(repoRoot).message, /in a shape AGY does not read: dispatch-decide PreToolUse/);
  installAgyHook(repoRoot);
  assert.equal(checkAgyHook(repoRoot).passed, true);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('the doctor probe runs the mailbox kind with benign input and requires exit 0 and empty stdout', () => {
  const repoRoot = mkTempDir('agent-hooks-probe-');
  const shimPath = getProjectShimPath(repoRoot);
  const log = path.join(repoRoot, 'argv.log');
  fs.mkdirSync(path.dirname(shimPath), { recursive: true });
  const shim = (mailboxStdout) => `#!/usr/bin/env node
const fs = require('node:fs');
fs.appendFileSync(${JSON.stringify(log)}, process.argv.slice(2).join(' ') + '\\n');
if (process.argv[3] === 'mailbox') process.stdout.write(${JSON.stringify(mailboxStdout)});
process.exit(0);
`;
  fs.writeFileSync(shimPath, shim(''), { mode: 0o755 });
  assert.deepEqual(isShimRunnable(repoRoot), { runnable: true, reason: null });
  assert.deepEqual(fs.readFileSync(log, 'utf8').trim().split('\n'), ['hook dispatch-decide'], 'without mailbox rows the probe skips the mailbox kind');

  writeMailboxOptIn(repoRoot, true);
  installCodexHook(repoRoot);
  fs.rmSync(log);
  assert.equal(checkCodexHook(repoRoot).passed, true);
  assert.deepEqual(fs.readFileSync(log, 'utf8').trim().split('\n'), ['hook dispatch-decide', 'hook mailbox --cli codex --event post-tool-use']);
  assert.ok(!fs.existsSync(path.join(repoRoot, '.fgos', 'runtime')), 'the probe created nothing');

  fs.writeFileSync(shimPath, shim('{"x":1}'), { mode: 0o755 });
  const failed = checkCodexHook(repoRoot);
  assert.equal(failed.passed, false);
  assert.match(failed.message, /mailbox \(codex\): printed on stdout/);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});
