import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
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
  assert.equal(config.hooks.PreToolUse[0].hooks[0].command, '.fgos/installation/bin/fgos hook dispatch-decide');
  assert.equal(config.hooks.PreToolUse[1].hooks[0].command, '.fgos/installation/bin/fgos hook decision-question');

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
  assert.equal(
    config['fgos-dispatch-guard'].PreToolUse[0].hooks[0].command,
    '.fgos/installation/bin/fgos hook dispatch-decide --format=agy',
  );
  assert.equal(
    config['fgos-decision-guard'].PreToolUse[0].hooks[0].command,
    '.fgos/installation/bin/fgos hook decision-question --format=agy',
  );

  // Without shim, check fails
  assert.equal(checkAgyHook(repoRoot).passed, false);

  mockRunnableShim(repoRoot);
  assert.equal(checkAgyHook(repoRoot).passed, true);

  fs.rmSync(repoRoot, { recursive: true, force: true });
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
