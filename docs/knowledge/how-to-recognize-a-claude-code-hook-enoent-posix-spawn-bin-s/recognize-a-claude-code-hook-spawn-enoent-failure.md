---
type: how-to
title: How to recognize a Claude Code hook `ENOENT posix_spawn '/bin/sh'` failure
tags: [claude-code, hooks]
timestamp: 2026-08-06T05:52:00.000Z
source_capture_ids: [tsk-2aa]
framework: diataxis
mode: how-to
---
# How to recognize a Claude Code hook `ENOENT posix_spawn '/bin/sh'` failure

Use this when a Claude Code CLI session working in this repo prints an
error shaped like:

```
<Event> hook error
Failed with non-blocking status code: Error occurred while executing hook command: ENOENT: no such file or directory, posix_spawn '/bin/sh'
```

Seen on `Stop`, `UserPromptSubmit`, and `PreToolUse:Bash` events, hitting
both `rtk hook claude` and several `node "$HOME/.claude/hooks/*.cjs"`
commands.

## Why this is not a forgentX bug

The hooks that fail this way are declared in the user's global
`~/.claude/settings.json`, not this repo's own `.claude/settings.json` —
this repo registers exactly one hook (`SessionStart` →
`scripts/fgos-session-start-hook.mjs`), which is never among the events
that fail this way. A repo-wide grep for `posix_spawn`, `spawnSync`, and
`execSync` across `src`, `bin`, and `test` finds no call site that reaches
this spawn path — forgentX's own code does not own or trigger it.

Do not confuse this with the repo's own, unrelated prior `spawnSync git
ENOENT` incidents
(`docs/how-to/recover-a-stuck-doing-claim-after-worktree-creation-failure.md`,
`docs/history/tsk-k8u/`, `docs/history/tsk-3lx/`) — those came from a real,
already-fixed cwd-resolution bug in `bin/fgos.mjs`/`src/runner/
worktree.mjs`'s own `pick`/`take` handlers. This failure's error text looks
similar (`ENOENT` from a `posix_spawn`/`spawnSync` call) but the missing
executable is `/bin/sh`, not `git`, and no forgentX code path is in the
call stack.

## How to confirm it's the harness, not a broken hook script

Re-run the failing hook's own command directly, outside the Claude Code
hook harness, e.g.:

```
rtk hook claude
```

A clean exit (no error, exit 0) confirms the script and its target binary
are fine — the failure is specific to how the harness itself invoked the
command that one time (e.g. `/bin/sh`, which exists on the machine, not
being reachable from whatever environment the harness's own spawn call
ran in), not a missing binary or a broken hook script.

## What to do

The harness already reports the failure as non-blocking, and the
underlying tool call that triggered the hook still succeeds — treat it as
transient. No forgentX-side workaround exists (see above); there is
nothing in this repo to fix.

## Related

- `docs/history/claude-code-hook-spawn-enoent/CONTEXT.md`,
  `docs/history/claude-code-hook-spawn-enoent/plan.md` (`tsk-2aa`) — the
  locked decisions and scout evidence behind this doc.
- `docs/how-to/recover-a-stuck-doing-claim-after-worktree-creation-failure.md`
  — the repo's own similar-looking but unrelated `spawnSync git ENOENT`
  incident, cited above to rule out reuse.
