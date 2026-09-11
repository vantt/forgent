---
framework: diataxis
mode: explanation
---
# Why `.claude/settings.json` hook registrations guard against a gitignored hooks script

`.claude/settings.json` is tracked in git, so it lands in every fresh
worktree. The hook scripts it points at (`${CLAUDE_PROJECT_DIR}/.claude/hooks/*.cjs`)
are not — `.gitignore` excludes `/.claude/*`. Measured 2026-09-06 in a live
dispatched agent inside a disposable worktree: every turn ended with `Stop
hook error: Cannot find module .../cook-after-plan-reminder.cjs`. Non-blocking
for a `Stop` hook, but four of the 21 registrations are `PreToolUse`
(`privacy-block`, `scout-block`, `descriptive-name`), where a crash can deny
a tool call outright instead of just logging noise.

## The fix: guard each registration, not a worker-marker env var

Each of the 21 commands in `.claude/settings.json` that reach
`.claude/hooks/*.cjs` now checks the script exists before running it, and
exits `0` silently when it is absent:

```sh
P="${CLAUDE_PROJECT_DIR}/.claude/hooks/<name>.cjs"; [ -f "$P" ] || exit 0; exec node "$P"
```

Otherwise the command execs the script unchanged — no behavior change for a
session that has the scripts.

## Why not a worker-marker env var (e.g. `BEE_HERDING_WORKER=1`)

The item's own original fix direction was a marker every hook respects,
following upstream beegog's `BEE_HERDING_WORKER=1` precedent. Rejected
because:

- It would require editing every kit-owned hook script to read that env
  var — 14 scripts, only some of which exist in any given worktree.
- It only covers *dispatched* workers. A human's own fresh worktree (no
  marker set) would still crash the exact same way, since the real cause
  is "script file missing," not "this is an automated dispatch."

Guarding the registration itself fixes both cases with one change, in the
one file (`.claude/settings.json`) that is actually tracked and therefore
actually present everywhere the failure was observed.

## Why not an in-process import shim

Also rejected: 3 of the 14 hook scripts guard their own entry point on
`require.main === module`, so importing them from a wrapper instead of
`exec`-ing them would make them silently not run — and one of those three
is `privacy-block`. Shell execution of each hook command was verified
live, not assumed (proof:
`docs/architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-hem/`).

## What was deliberately left as a follow-up, not fixed here

Moving the hook registrations to the untracked `settings.local.json`
instead would be conceptually cleaner (untracked file, no gitignore
mismatch) but changes the repo's config-sharing policy and costs a human
their hooks inside their own worktree unless they replicate the
registrations locally. Left as a separate call for a person to make, not
bundled into this fix.

## How to verify this holds

```sh
node scripts/check-hook-registrations-guarded.mjs
```

Walks every `command` string in `.claude/settings.json` that reaches
`.claude/hooks/`, and fails naming any registration missing the
`[ -f "$P" ] || exit 0` guard. A dispatched agent in a fresh worktree
inherits `settings.json` but not the scripts, so any unguarded
registration added later fails this check immediately instead of only
surfacing as a live "Cannot find module" error in some future pane.
