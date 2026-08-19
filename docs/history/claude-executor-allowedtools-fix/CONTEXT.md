# CONTEXT.md — tsk-1dsr: allowedTools scope decision

## Feature boundary

Diagnose and fix the RED finding tsk-1jt's D4 proof-test recorded
(`docs/history/claude-named-executor/RESEARCH.md` Round 3): the named
`claude` executor, dispatched out-of-process, could not complete
`git add`/`git commit` in a headless session. The item's own text
hypothesized a `--allowedTools` colon-vs-space syntax mismatch. Real
isolated testing (Round 4) disproved that and found the actual cause:
this testing machine's own `rtk` `PreToolUse` hook rewrites `git ...` to
`rtk git ...` before the allowlist match runs.

## Scout evidence

- `docs/history/claude-named-executor/RESEARCH.md` Round 4: four real
  `claude -p` invocations against a throwaway scratch repo. Test D proved
  the ORIGINAL colon-scoped syntax (`"Bash(git add:*),Bash(git
  commit:*)"`) works fine once the allowlist names the command that
  actually runs (`"Bash(rtk git add:*),Bash(rtk git commit:*)"`).
- `$HOME/.claude/RTK.md`/`$HOME/.claude/CLAUDE.md` (this user's own global
  instructions, outside the repo): documents the `rtk` hook's rewrite
  behavior explicitly.
- `.fgos/config.json` is repo-tracked, shared state — any other fgOS
  install without this personal hook would see the original config work
  as written.

## Question and answer (raised directly in conversation, no live Socratic
round needed — the question was already precisely scoped by Round 4's
finding)

Should this item change `.fgos/config.json` at all, given the real cause
is machine-local, not a shared-config defect? User's real answer: yes,
but as a **double pattern** — name both the bare `git` and `rtk`-wrapped
`git` forms, so the fix is harmless on any install (the `rtk` pattern
simply never matches without the hook) and correct on this one.
Explicitly NOT widened past `add`/`commit` to any git subcommand — same
safety scope the original config already had.

## Locked decisions

| D-ID | Quyết định |
|---|---|
| D1 | name both bare-git and rtk-wrapped-git allowedTools patterns in runner.executors.claude/runner.executor, scoped to add/commit only -- never bake an rtk-only pattern (footgun for non-rtk installs) and never widen to any git subcommand |

## Outstanding questions

None
