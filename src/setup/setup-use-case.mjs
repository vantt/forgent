// setup-use-case.mjs -- what `fgos setup` does to a project, in one call: the shell-integration line, the
// retired runner config conversion, the git hook wiring, the Claude Code hook, every registered fix and the
// skill wrappers. The CLI arm only resolves the project, calls this and prints (legacy compatibility; the
// current doors are `fgctl init` and `fgos doctor --fix`).
import os from 'node:os';
import path from 'node:path';

import { integrationScriptPath, runFixes } from './checks.mjs';
import { installGitHooks } from './git-hooks.mjs';
import { installClaudeCodeHook } from './claude-code-hooks.mjs';
import { detectRcFiles, insertSourceLine } from './shell-rc.mjs';
import { materializeSkillsIntoProject } from './skill-wrappers.mjs';
import { convertRunnerPatternsConfig, inspectGlobalRunnerConfig } from './runner-config-conversion.mjs';

export function setupUseCase(repoRoot, { packageRoot, homeDir = os.homedir() }) {
  const scriptPath = integrationScriptPath();
  const rcFiles = detectRcFiles(homeDir);
  const rcFilesInserted = [];
  const rcFilesAlreadyConfigured = [];
  // A null scriptPath means this copy of fgos has no location stable enough
  // to name in a shell profile — it is not inside a git checkout, so it is
  // ephemeral by nature. Writing its path would leave a `source` line that
  // outlives the directory it points at and errors on every shell open.
  // Everything else setup does still runs; only the rc write is declined.
  const rcWriteDeclinedReason = scriptPath === null
    ? 'this copy of fgos is not inside a git checkout, so it has no stable path to source — source scripts/fgos-shell-integration.sh by hand from a permanent checkout'
    : null;
  if (scriptPath !== null) {
    for (const rcFile of rcFiles) {
      if (insertSourceLine(rcFile, scriptPath)) {
        rcFilesInserted.push(rcFile);
      } else {
        rcFilesAlreadyConfigured.push(rcFile);
      }
    }
  }
  const globalConfigDir = path.join(homeDir, '.fgos');
  const globalRetiredNotice = inspectGlobalRunnerConfig({ projectRoot: repoRoot, globalDir: globalConfigDir });
  let runnerPatternsConversion;
  try {
    runnerPatternsConversion = convertRunnerPatternsConfig(repoRoot);
  } catch (err) {
    runnerPatternsConversion = {
      status: 'blocked',
      blocker: err.message ?? String(err),
      written: [],
    };
  }
  // str65-6/str88: wires core.hooksPath the same way `npm run setup:hooks`
  // does — a second, non-npm-lifecycle-dependent activation path for the
  // main-checkout lock hook, since pnpm 10+ blocks `prepare` for a
  // git-hosted dependency (str88) and nothing re-automated it since.
  // Idempotent, no-ops silently when repoRoot has no `.git` at all.
  // Fill-only like the two side effects above: a pre-existing custom
  // core.hooksPath is left untouched, never silently repointed.
  const { wired: hooksWired, skippedExisting: hooksSkippedExisting } = installGitHooks(repoRoot);
  // tsk-60f D1/D5: wires the PreToolUse dispatch-decide enforcement hook
  // into .claude/settings.json the same fill-only way — a pre-existing
  // hooks.SessionStart entry (or any other settings.json content) is
  // left untouched; a malformed settings.json is left alone entirely.
  const { wired: dispatchDecideHookWired, skippedExisting: dispatchDecideHookSkippedExisting } = installClaudeCodeHook(repoRoot);
  // tsk-5hi: setup now also runs every registered fix — the same
  // runFixes() `doctor --fix` already calls (RUL9/RUL11) — instead of
  // leaving a person to separately discover and run `doctor --fix` to
  // reach the state a plain `setup` should already leave a project in.
  // Unconditional, no confirmation, per RUL10's existing act-then-report
  // contract for this verb; every registered fix is already required
  // idempotent/fail-soft, so running the full list here is safe.
  const fixed = runFixes(repoRoot);
  // tsk-1qi D5/D7: materializes `.agents/skills` (canonical source) +
  // generated `.claude/skills` thin wrappers into repoRoot -- copying
  // from THIS running copy's own package root when repoRoot is a
  // different (external) project, or just regenerating wrappers
  // in-place for forgentX's own dev-checkout self-hosting run (see
  // materializeSkillsIntoProject's own self-hosting no-copy branch).
  const { copied: skillsSourceCopied, wrappersWritten: skillWrappersGenerated, skipped: skillFilesKept } = materializeSkillsIntoProject(packageRoot, repoRoot);
  return {
    rcFilesInserted,
    rcFilesAlreadyConfigured,
    ...(rcWriteDeclinedReason !== null && { rcWriteDeclinedReason }),
    runnerPatternsConversion,
    ...(globalRetiredNotice && { globalRetiredNotice }),
    hooksWired,
    hooksSkippedExisting,
    dispatchDecideHookWired,
    dispatchDecideHookSkippedExisting,
    fixed,
    skillsSourceCopied,
    skillWrappersGenerated: skillWrappersGenerated.length,
    skillFilesKept,
  };
}
