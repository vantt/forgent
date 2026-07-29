---
type: how-to
title: How to run a state-writing `fgos` verb from inside a picked worktree
tags: []
timestamp: 2026-07-29T08:40:07.000Z
source_capture_ids: [tsk-56t]
---

# How to run a state-writing `fgos` verb from inside a picked worktree

Use this when a session has switched into a claimed item's worktree
(`/fgOS:pick`'s own `EnterWorktree` step) and needs to call a state-writing
verb — `ask`, `answer`, `decision`, `discover`, `edit`, `move`, `return`,
`compound`, `unlock`, or a second `pick`/`submit`/`goal` — from there.

## Before you start

A linked worktree under `.claude/worktrees/` never carries its own
`.fgos/` (ADR0020, `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md`)
— `createWorktree` checks one out, then deletes it outright, on purpose, so
nothing can silently diverge from the one real store in the main checkout.
A `requiresExistingStore: true` verb (`bin/fgos.mjs`'s own
`COMMAND_REGISTRY` flags each one) run bare from a worktree cwd refuses
with exit 4:

```
fgos: .fgos/ not found at "<worktree>/.fgos" -- run "fgos init" here first,
or check you are not inside a linked worktree (worktrees never carry
.fgos/, per ADR0020: docs/decisions/0020-chan-fgos-khoi-worktree-worker.md).
```

## Steps

1. **Resolve the main checkout root** from wherever the session's cwd
   actually is:

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   ```

   This works from a linked worktree or the main checkout itself
   identically — `git-common-dir`'s parent is always the one real
   checkout, regardless of which worktree you're standing in.

2. **Pass `--dir "$root"` on the state verb call.** Two equivalent forms,
   depending on which script copy you're invoking:

   ```bash
   # Using the worktree's own bin/fgos.mjs (has the fix once this item is merged):
   node ./bin/fgos.mjs <verb> ... --dir "$root"

   # Using an explicit absolute path (what plugins/fgOS/skills/*/SKILL.md
   # templates do, via ${CLAUDE_PROJECT_DIR}):
   node "$root/bin/fgos.mjs" <verb> ... --dir "$root"
   ```

   `--dir` is additive and opt-in — a bare `fgos <verb>` (no `--dir`) is
   completely unaffected; it still resolves `.fgos/` under the caller's
   own cwd exactly as before (D5). Passing `--dir` pointed at the *same*
   directory you're already standing in (e.g. running from the main
   checkout itself) is a harmless no-op.

3. **Read verbs stay silent-safe, but now warn.** `list`/`ready`/`graph`/
   `stale`/`check`/`rollup`/`conflicts`/`triage` don't refuse on a missing
   store (a fresh non-worktree dir with no store yet is legitimately "not
   evaluated") — but called bare from a linked worktree, they now print a
   stderr line naming the gap instead of silently looking like "no open
   work":

   ```
   fgos: warning: .fgos/ not found at "<worktree>/.fgos" -- this view may
   be empty because the real store lives elsewhere (worktrees never carry
   .fgos/, per ADR0020); pass --dir <mainRoot> to read it.
   ```

   Passing `--dir "$root"` on these too silences the warning and returns
   the real data.

## Why this exists

A separate guard (tsk-4fu-2, `bin/fgos.mjs`'s `requiresExistingStore`
check) already stops a worktree-resident state verb from silently writing
into a phantom local `.fgos/` — but that guard alone left no *documented,
ergonomic* way to actually run the call correctly from there. Before this,
a session either had to `cd` back out to the main checkout mid-session
(risky in a real persistent shell — a forgotten subshell permanently moves
the session's cwd off the worktree it's supposed to be editing in) or hit
the refusal repeatedly with no clear next step. `--dir` removes that
operator-error class outright: the cwd never needs to change, and the
worktree stays the session's actual working directory throughout.

## Real example

This exact gap surfaced through `tsk-3fb`/`tsk-37v` (2026-07-28): a session
ran `discover`/`decision`/`return` from inside a picked worktree, and
`fgos approve` later reported `"doing", not "proposed"` even though the
work had genuinely completed on `fgw/<id>` — main's own `.fgos/` had only
ever seen the original `pick` (run correctly from main), never anything
that followed inside the worktree.

Fixed and verified end-to-end in `tsk-56t`'s own session: from inside
`.claude/worktrees/tsk-56t-w84oHC`, running

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node ./bin/fgos.mjs return tsk-56t --dir "$root"
```

moved the item `doing -> proposed` — real `work.move` event landing in
the main checkout's `.fgos/events.jsonl`, visible via a plain `fgos list`
from main immediately after, with no manual `cd`, subshell, or sync step.

## Related

- `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md` — why a linked
  worktree never carries its own `.fgos/` in the first place.
- `docs/history/fgos-worktree-state-write-guard/CONTEXT.md` and
  `plan.md` — the locked decisions and shape behind this fix.
- `docs/how-to/clear-a-stuck-main-checkout-lock.md` — a related
  worktree/main-checkout-boundary recovery, for the claim lock rather than
  the store path.
