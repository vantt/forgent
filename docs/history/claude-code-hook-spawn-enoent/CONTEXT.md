# tsk-2aa — Claude Code hook execution ENOENT posix_spawn '/bin/sh'

## Feature boundary

A Claude Code CLI session working in this repo saw repeated hook failures
of the form:

```
<Event> hook error
Failed with non-blocking status code: Error occurred while executing hook command: ENOENT: no such file or directory, posix_spawn '/bin/sh'
```

across `Stop`, `UserPromptSubmit`, and `PreToolUse:Bash` hook events, hitting
both `rtk hook claude` and several `node "$HOME/.claude/hooks/*.cjs"`
commands. This item's scope (D1) is a `docs/how-to/` runbook that helps a
future session recognize this symptom and know it is not actionable in this
repo — nothing more. No forgentX source changes.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Scope is a `docs/how-to/` runbook only (symptom recognition + workaround guidance). No forgentX source change. Not closed as wontfix — the doc itself is the deliverable. |
| D2 | Runbook file path is `docs/how-to/recognize-a-claude-code-hook-spawn-enoent-failure.md`. Picked to give `discover`'s verify field a concrete, runnable command (`test -f <path>`) instead of the placeholder `chưa xác định`, which `discover --verdict clear` rejected as `verify-disputed`. |

## Pinned terms

- **"the harness's own hook-spawn environment"** — the process Claude Code
  itself uses to execute commands declared under `hooks:` in
  `~/.claude/settings.json` (global) or a project's `.claude/settings.json`.
  This is Claude Code CLI's own runtime, external to forgentX's source tree.

## Scout evidence

- The failing hooks are declared in the user's global
  `~/.claude/settings.json`, not this repo's `.claude/settings.json`:
  - `Stop` → `node "$HOME/.claude/hooks/session-state.cjs"`
  - `UserPromptSubmit` → `simplify-gate.cjs`, `dev-rules-reminder.cjs`,
    `usage-quota-cache-refresh.cjs`
  - `PreToolUse:Bash` → `rtk hook claude` (among others)
- This repo's own `.claude/settings.json` registers exactly one hook
  (`SessionStart` → `scripts/fgos-session-start-hook.mjs`), which was never
  among the events that failed.
- `rg -- "posix_spawn|spawnSync|execSync" src bin test docs dogfood-fixture`
  found no call site in forgentX's own code that spawns `/bin/sh` for any
  of the affected events — forgentX code does not own or trigger this
  spawn path.
- Manually re-running `rtk hook claude` directly (outside the Claude Code
  hook harness) completed cleanly, exit 0, no error. `/bin/sh` exists on
  the machine (`/bin/sh -> dash`). This narrows the failure to something
  specific to how the harness itself invokes hook commands (e.g. PATH/SHELL
  not inherited into that spawn call, or a transient spawn-namespace issue),
  not a missing binary or broken hook script logic.
- The error recurred at least 3 times in one session, independent of the
  underlying tool call's own outcome (fired before a plain `wc -l`, right
  after an unrelated background task completed with exit 0, and before a
  `grep` search) — consistent with an intermittent harness-level fault
  rather than something tied to one specific command.
- Prior spawn-ENOENT history already exists in this repo
  (`docs/history/tsk-k8u/iron-law-evidence.md`,
  `docs/history/tsk-3lx/iron-law-evidence.md`,
  `docs/how-to/recover-a-stuck-doing-claim-after-worktree-creation-failure.md`)
  but that is `spawnSync git ENOENT` from `bin/fgos.mjs`/`worktree.mjs`'s
  own cwd-resolution bug during `pick`/`take` — a different, in-repo,
  already-fixed root cause. Confirmed distinct from this item; not reused.
- Impact-analysis capability gate (`fgos tool query --capability
  impact-analysis --status present`): GitNexus present → posture `full`.
  Not load-bearing here since this item makes no code change, but recorded
  per the standing convention.

## Canonical references

- `~/.claude/settings.json` (global, not in this repo) — the actual hook
  declarations that failed.
- `docs/history/tsk-k8u/iron-law-evidence.md`,
  `docs/history/tsk-3lx/iron-law-evidence.md` — the repo's own prior
  (unrelated) `spawnSync ENOENT` incidents, cited above to rule out reuse.

## Outstanding questions deferred to planning

- The runbook's precise content structure (headings, exact workaround
  steps) — implementation detail, left to `fgos-coding-planning`/
  `fgos-coding-implement` to follow the existing sibling-doc convention
  already scouted above (e.g.
  `docs/how-to/recover-a-stuck-doing-claim-after-worktree-creation-failure.md`).
