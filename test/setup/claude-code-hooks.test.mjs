import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { installClaudeCodeHook, claudeCodeHookWired } from '../../src/setup/claude-code-hooks.mjs';

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('installClaudeCodeHook wires the PreToolUse dispatch-decide entry into a repo with no settings.json at all', () => {
  const repoRoot = mkTempDir('claude-code-hooks-none-');
  const result = installClaudeCodeHook(repoRoot);
  assert.deepEqual(result, { wired: true, skippedExisting: null });
  assert.equal(claudeCodeHookWired(repoRoot), true);
  const settings = JSON.parse(fs.readFileSync(path.join(repoRoot, '.claude', 'settings.json'), 'utf8'));
  assert.equal(settings.hooks.PreToolUse[0].matcher, 'Agent|Task');
  assert.match(settings.hooks.PreToolUse[0].hooks[0].command, /hook dispatch-decide/);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('installClaudeCodeHook is fill-only -- a pre-existing SessionStart hook entry is left byte-for-byte untouched beside ours', () => {
  const repoRoot = mkTempDir('claude-code-hooks-fill-only-');
  fs.mkdirSync(path.join(repoRoot, '.claude'), { recursive: true });
  const before = {
    enabledPlugins: { 'fgOS@fgos-plugins': true },
    hooks: {
      SessionStart: [
        { matcher: 'startup|resume|clear|compact', hooks: [{ type: 'command', command: 'node "${CLAUDE_PROJECT_DIR}/scripts/fgos-session-start-hook.mjs"' }] },
      ],
    },
  };
  fs.writeFileSync(path.join(repoRoot, '.claude', 'settings.json'), JSON.stringify(before, null, 2));

  installClaudeCodeHook(repoRoot);

  const after = JSON.parse(fs.readFileSync(path.join(repoRoot, '.claude', 'settings.json'), 'utf8'));
  assert.deepEqual(after.enabledPlugins, before.enabledPlugins);
  assert.deepEqual(after.hooks.SessionStart[0], before.hooks.SessionStart[0]);
  assert.equal(after.hooks.PreToolUse[0].matcher, 'Agent|Task');
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('installClaudeCodeHook is idempotent -- running it twice adds exactly one PreToolUse entry', () => {
  const repoRoot = mkTempDir('claude-code-hooks-idempotent-');
  installClaudeCodeHook(repoRoot);
  installClaudeCodeHook(repoRoot);
  const settings = JSON.parse(fs.readFileSync(path.join(repoRoot, '.claude', 'settings.json'), 'utf8'));
  const dispatchEntries = settings.hooks.PreToolUse.filter((e) => e.hooks.some((h) => h.command.includes('hook dispatch-decide')));
  assert.equal(dispatchEntries.length, 1);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('installClaudeCodeHook declines to write when settings.json exists but is malformed JSON -- never risks clobbering a mid-edit', () => {
  const repoRoot = mkTempDir('claude-code-hooks-malformed-');
  fs.mkdirSync(path.join(repoRoot, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.claude', 'settings.json'), '{ not valid json');

  const result = installClaudeCodeHook(repoRoot);
  assert.deepEqual(result, { wired: false, skippedExisting: 'malformed' });
  const raw = fs.readFileSync(path.join(repoRoot, '.claude', 'settings.json'), 'utf8');
  assert.equal(raw, '{ not valid json');
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('claudeCodeHookWired reads false for a repo with no settings.json at all -- never throws', () => {
  const repoRoot = mkTempDir('claude-code-hooks-unwired-');
  assert.equal(claudeCodeHookWired(repoRoot), false);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('claudeCodeHookWired reads false for a malformed settings.json -- never throws', () => {
  const repoRoot = mkTempDir('claude-code-hooks-unwired-malformed-');
  fs.mkdirSync(path.join(repoRoot, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.claude', 'settings.json'), 'not json');
  assert.equal(claudeCodeHookWired(repoRoot), false);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('claudeCodeHookWired reads false when settings.json has other hooks but not this one', () => {
  const repoRoot = mkTempDir('claude-code-hooks-other-hooks-');
  fs.mkdirSync(path.join(repoRoot, '.claude'), { recursive: true });
  fs.writeFileSync(
    path.join(repoRoot, '.claude', 'settings.json'),
    JSON.stringify({ hooks: { SessionStart: [{ matcher: 'startup', hooks: [{ type: 'command', command: 'node foo.mjs' }] }] } }),
  );
  assert.equal(claudeCodeHookWired(repoRoot), false);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('installClaudeCodeHook also wires the AskUserQuestion decision-question hook, and wired needs both', () => {
  const repoRoot = mkTempDir('claude-code-hooks-ask-');
  fs.mkdirSync(path.join(repoRoot, '.claude'), { recursive: true });
  const onlyDispatch = { hooks: { PreToolUse: [{ matcher: 'Agent|Task', hooks: [{ type: 'command', command: 'node scripts/dispatch-decide-hook.mjs' }] }] } };
  fs.writeFileSync(path.join(repoRoot, '.claude', 'settings.json'), JSON.stringify(onlyDispatch));
  assert.equal(claudeCodeHookWired(repoRoot), false);
  installClaudeCodeHook(repoRoot);
  const settings = JSON.parse(fs.readFileSync(path.join(repoRoot, '.claude', 'settings.json'), 'utf8'));
  assert.deepEqual(settings.hooks.PreToolUse.map((entry) => entry.matcher), ['Agent|Task', 'AskUserQuestion', 'Bash']);
  assert.match(settings.hooks.PreToolUse[1].hooks[0].command, /hook decision-question/);
  assert.equal(claudeCodeHookWired(repoRoot), true);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});
