// claude-code-hooks.mjs — infra layer: real `.claude/settings.json` I/O for
// wiring this repo's `PreToolUse` enforcement (dispatch-decide on Agent/Task,
// decision-question template on AskUserQuestion) into a checkout.
// Delegates to agent-hooks.mjs for multi-agent consistency.

import { installClaudeHook, isClaudeHookConfigured } from './agent-hooks.mjs';

export function installClaudeCodeHook(repoRoot) {
  return installClaudeHook(repoRoot);
}

export function claudeCodeHookWired(cwd) {
  return isClaudeHookConfigured(cwd);
}
