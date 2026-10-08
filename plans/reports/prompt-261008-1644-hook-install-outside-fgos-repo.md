# Handoff: fgOS Claude Code hooks do not run in other projects

Written 2026-10-08 by the lead of the decision-question-template session. Self-contained: a new chat with no history can start here. Priority: higher of the two follow-ups (affects mission #1).

## Problem (verified)

- `fgos setup` calls `installClaudeCodeHook(repoRoot)` for any project (`bin/fgos.mjs` ~3787, `src/setup/claude-code-hooks.mjs`). It writes PreToolUse commands `node "${CLAUDE_PROJECT_DIR}/scripts/dispatch-decide-hook.mjs"` (matcher `Agent|Task`) and, on branch `plan/261008-decision-question-template`, `.../scripts/decision-question-hook.mjs` (matcher `AskUserQuestion`).
- Those scripts import `../src/...`. Outside the fgOS source repo neither `scripts/` nor `src/` exists, so node exits 1: a non-blocking hook error on every call, and the check never applies.
- Live today: `~/projects/mdview/.claude/settings.json` wires the dispatch hook, `mdview/scripts/dispatch-decide-hook.mjs` does not exist → error on every Agent call there.
- Usage that matters: `mcp-skill-hub` (a real outside project) had 29 `AskUserQuestion` calls in 10 sessions since 2026-09-08; the new template hook protects none of them.
- `doctor` check `dispatch-decide-hook-wired` (`src/setup/registrations.mjs` ~1278) only checks that settings.json has the entry, not that the command can run.

## Base and isolation

- Base the worktree on branch `plan/261008-decision-question-template` (head `cff70a5f4` or later; not yet merged to main), because it adds the second hook. If it has merged by the time you start, base on main.
- Work only in a new worktree under `/home/vantt/projects/forgentX-worktrees/`. Never switch the shared main checkout's branch. After `git worktree add`, make `node_modules` a real directory (`cp -al /home/vantt/projects/forgentX/node_modules node_modules`), not a symlink: rust-host tests refuse a symlinked dependency tree.

## What to do in the new chat

1. Run `ak-plan` to write the plan (then `ak-plan red-team` and `ak-plan validate`). Read `AGENTS.md`, `docs/specs/reading-map.md`, `docs/specs/distribution.md`, `docs/distribution-vision.md` first; this touches install/setup/doctor, so the install/setup/doctor gate in AGENTS.md applies.
2. Prior art first (`git log -S'installClaudeCodeHook'`, `-S'CLAUDE_PROJECT_DIR'`): how the installed payload is located today (`components.legacyNode.root` / activation in `.fgos/installation/activation.json`, Rust host). Reuse it; do not invent a second resolution path.
3. Candidate directions to evaluate (not decided): point hook commands at the activated release's payload; or run the hook through the `fgos` door (a hook verb); or wire hooks only in the fgOS source checkout. Doctor should fail when a wired hook command cannot run.

## Rules from the decision-question session (binding)

- Plan header carries an approved frame: `paths:` and `budget:` (src lines added — deletions are free — test lines, days). Leaving the frame is a decision question; never edit outside it to unblock a gate.
- Every question to the owner uses the template in `core/skills/_shared/decision-question.md` (on the base branch): what is happening, cause, options with cost, recommendation, scope of the answer. Analysis first.
- Owner is addressed as "anh", you are "em"; owner writes Vietnamese.

## Not in scope

The consent-gate follow-up (gateway/MCP/workflow `--approve`) has its own handoff: `plans/reports/prompt-261008-1644-approve-on-every-answer-door.md`.
