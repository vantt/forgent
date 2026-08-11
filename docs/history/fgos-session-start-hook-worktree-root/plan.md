# plan.md — tsk-5ma

Mode: tiny

## What

`scripts/fgos-session-start-hook.mjs:16` calls `resolveRepoRoot()`
(`src/runner/paths.mjs`, `git rev-parse --show-toplevel`) to compute the
"storage:" path it prints as session-start context. Inside a linked
worktree that returns the worktree's own root, not the main checkout —
`.fgos/` is wiped from every freshly-created worktree (ADR0020), so the
printed path points at a directory that does not exist whenever a session
starts fresh with cwd already inside `.claude/worktrees/*`.

Fix: swap the import/call from `resolveRepoRoot` to
`resolveMainCheckoutRoot` (`src/runner/paths.mjs`, `git rev-parse
--git-common-dir`) — the same one-line swap already applied at the other 8
call sites of this bug class during tsk-5hv. No other behavior in the file
changes.

## Why this shape (tiny, no split)

One file, one line, one caller. The item's own description already did the
scope audit (checked every other `resolveRepoRoot()` caller in the repo and
confirmed the other three call sites are intentional, not the same bug) —
cited directly, not re-derived here. Nothing here calls for a split.

## Assumption pinned (CONTEXT.md gap)

No `docs/history/<feature>/CONTEXT.md` exists for this item — it reached
`decompose` via the direct `clarify -> decompose` edge (fgos-clarifying's
own "understood, no rewrite, hand off" verdict), which is legitimate for an
item whose intent and fix are already fully specified in its own
description. Nothing this plan needs is silent in that description, so
there is no material gap to hand back to `fgos-coding-exploring` for — this is
recorded here only per fgos-coding-planning's own Mid-planning gap step, not
because a real decision is missing.

## Impact analysis (CLAUDE.md gate: impact-analysis capability = full)

`fgos tool query --capability impact-analysis --status present` returned
gitnexus `present` — full posture applies.

`impact({target: "resolveRepoRoot", direction: "upstream", file_path:
"src/runner/paths.mjs"})` on the main checkout index: overall risk `HIGH`
across `resolveRepoRoot`'s 5 direct callers (`main` in this hook,
`resolveCapacityCli`, `decideCapacityCli`, `runOnce`, `resolveFgosDir`).
That HIGH score belongs to `resolveRepoRoot` as a whole, not to this
change: the fix here only removes ONE of those five callers (`main`,
depth 1) and points it at `resolveMainCheckoutRoot` instead —
`resolveRepoRoot`'s own definition, signature, and the other four callers
are untouched. Those four are the intentional uses AGENTS.md's gate
already names (`bin/fgos-runner.mjs`/`src/runner/loop.mjs` operate on
whichever checkout invoked them by design; `src/setup/git-hooks.mjs`
genuinely wants the worktree's own root). Blast radius of this specific
edit: narrow, one file, one caller re-pointed, no shared symbol modified.

## Proof surface

Verify: `node scripts/fgos-session-start-hook.mjs`

Run from inside a worktree checkout — prints `fgOS canonical paths:` with
a `storage:` line. Before the fix this resolves to the worktree's own
(non-existent) `.fgos/` path; after the fix it resolves to the main
checkout's real `.fgos/` path. The hook's own contract (never throws,
always exits 0) means the command succeeding is necessary but not
sufficient — the proof is the printed `storage:` path itself pointing at
the main checkout, not the worktree.
