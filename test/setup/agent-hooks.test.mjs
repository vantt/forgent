import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

test('installOmpHook writes .omp/extensions/fgos-hooks.ts and checkOmpHook probes cleanly', () => {
  const repoRoot = mkTempDir('agent-hooks-omp-');

  assert.equal(checkOmpHook(repoRoot).passed, true);

  installOmpHook(repoRoot);
  const extFile = path.join(repoRoot, '.omp', 'extensions', 'fgos-hooks.ts');
  assert.equal(fs.existsSync(extFile), true);
  const content = fs.readFileSync(extFile, 'utf8');
  assert.match(content, /dispatch-decide/);
  assert.match(content, /decision-question/);
  assert.match(content, /api\.on\('tool_call'/);

  // Without shim, check fails
  assert.equal(checkOmpHook(repoRoot).passed, false);

  mockRunnableShim(repoRoot);
  assert.equal(checkOmpHook(repoRoot).passed, true);

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// 5. Pi
// ---------------------------------------------------------------------------

test('installPiHook writes .pi/extensions/fgos-hooks.ts and checkPiHook probes cleanly', () => {
  const repoRoot = mkTempDir('agent-hooks-pi-');

  assert.equal(checkPiHook(repoRoot).passed, true);

  installPiHook(repoRoot);
  const extFile = path.join(repoRoot, '.pi', 'extensions', 'fgos-hooks.ts');
  assert.equal(fs.existsSync(extFile), true);
  const content = fs.readFileSync(extFile, 'utf8');
  assert.match(content, /dispatch-decide/);
  assert.match(content, /decision-question/);

  // Without shim, check fails
  assert.equal(checkPiHook(repoRoot).passed, false);

  mockRunnableShim(repoRoot);
  assert.equal(checkPiHook(repoRoot).passed, true);

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

test('mailbox rows install Stop and PostToolUse for Claude Code and Codex and none for agy, omp or pi', () => {
  const repoRoot = mkTempDir('agent-hooks-mailbox-rows-');
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
  for (const ext of ['.omp/extensions/fgos-hooks.ts', '.pi/extensions/fgos-hooks.ts']) {
    assert.ok(!fs.readFileSync(path.join(repoRoot, ext), 'utf8').includes("'mailbox'"), ext);
  }
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
