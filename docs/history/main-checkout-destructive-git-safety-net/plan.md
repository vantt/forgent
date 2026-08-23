---
title: plan — main-checkout destructive git-op safety net
item: tsk-3au
---

# tsk-3au — Plan

## Mode

Flags counted: **audit/security** (this item exists to close a real
data-loss failure mode on shared state — a hard-gate flag on its own per
this skill's own rule) + **weak proof around the area** (main-checkout
concurrency has a documented history of subtle bugs: STR65/tsk-3w8's
`.git/index` clobbering, tsk-45y's stale-premise confusion, decision 0021's
hook-wiring gap). Any hard-gate flag forces **high-risk** regardless of
total count, so mode = **high-risk** — matches the item's own `tier: heavy`
set at creation, consistent signal.

A smaller mode (`standard`) would not honestly cover this: the actual
change set is small (one new module, one CLI verb, three doc edits), but
the failure mode it closes is a real, already-occurred loss of another
process's uncommitted work on shared state — the proof bar has to be
correspondingly real, not a size-matched shortcut.

## Approach

D2's two halves (`CONTEXT.md`) combine into one coherent shape, not two
disconnected changes:

1. **Guard module** (`src/runner/main-checkout-reset-guard.mjs`) — a pure
   function `assertSafeMainCheckoutReset({ dirty, confirmed })` that throws
   when `dirty && !confirmed`, no-ops otherwise. This is exactly the shape
   `test/runner/main-checkout-reset-guard.test.mjs` (committed during
   clarify, currently RED) already asserts — planning keeps that test's
   three observable behaviors as the acceptance bar per `CONTEXT.md`'s gate
   note, rather than redesigning them.
2. **CLI verb** (`bin/fgos.mjs`, new `case 'main-checkout-reset':`) — a thin
   wrapper: runs `git status --porcelain` (whole main checkout, no
   pathspec — this item's own pinned-term scope, distinct from `return`'s
   subtree-scoped `isWorkingTreeClean`), shows the caller the full dirty
   list, and only proceeds to `git reset --hard <sha>` when either the tree
   is clean or the caller passed `--confirm` after seeing that output.
   Resolves outstanding question 1 from `CONTEXT.md` ("new verb, shared
   helper, or both") as **both**: the verb is what a session actually runs;
   the module is what makes that verb's core decision unit-testable without
   shelling out.
3. **Doc reminder** (`plugins/fgOS/skills/pick/SKILL.md`,
   `plugins/fgOS/skills/cook/SKILL.md`, `AGENTS.md`) — mirrors
   `docs/history/pick-cook-worktree-bypass-reminder/CONTEXT.md` D2's
   existing pattern: a short warning near the worktree-entry hard rules,
   naming `fgos main-checkout-reset` as the required path instead of a raw
   `git reset --hard` on the main checkout. This is what actually closes
   the gap for the raw-Bash case the real incident went through — the CLI
   verb alone cannot intercept a hand-typed `git reset --hard`; the doc is
   what redirects a session to the safer path in the first place.

**Rejected alternative:** a git hook intercepting `reset`. Git has no
native hook for `reset` (confirmed at clarify, `.githooks/pre-commit` only
fires on `commit`) — not a viable mechanism, would require shimming the
`git` binary itself, far outside this item's scope and KISS.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `main-checkout-reset-guard.mjs` (new, pure function) | Low-medium — new code, no external deps, small surface | `test/runner/main-checkout-reset-guard.test.mjs` RED→GREEN (already committed, currently RED) |
| `bin/fgos.mjs` new verb wiring | Medium — `bin/fgos.mjs` is a large dispatch switch shared by every other verb; a bad edit risks the whole CLI | Impact analysis on the dispatch switch before editing (see below) + `node --test test/cli/fgos.test.mjs` stays green + a new test case for the verb's confirm/refuse behavior |
| Doc reminder edits | Low — prose only, no code path | Read-through against `pick-cook-worktree-bypass-reminder`'s existing pattern for consistency |

Impact-analysis posture: `fgos tool query --capability impact-analysis
--status present` returned `gitnexus` present via MCP at clarify time —
posture is **full**. `fgos-coding-implement` must run `impact({target:
"run", direction: "upstream"})` (or the enclosing dispatch function) on
`bin/fgos.mjs` before editing it, per `CLAUDE.md`'s mandatory gate — this
plan does not substitute for that live check, only flags where it applies.

## Files touched

- New: `src/runner/main-checkout-reset-guard.mjs`
- Existing (already committed, RED): `test/runner/main-checkout-reset-guard.test.mjs`
- New test additions: `test/cli/fgos.test.mjs` (verb-level confirm/refuse
  behavior)
- `bin/fgos.mjs` (new verb case, following the existing dispatch pattern
  other verbs use)
- `plugins/fgOS/skills/pick/SKILL.md`
- `plugins/fgOS/skills/cook/SKILL.md`
- `AGENTS.md`

## Order

1. Guard module + its unit test going GREEN (foundational, no dependency
   on anything else touched here).
2. CLI verb wiring in `bin/fgos.mjs`, built on the now-green guard module.
3. Doc reminders, last — they name the verb from step 2, so writing them
   first would reference something that doesn't exist yet.

`fgos graph --json` shows tsk-3au as an isolated size-1 component (no other
open item depends on it, nothing it depends on besides the now-`done`
`choke-point-workingtree-clean-duplication`) — no `--what-if` unblock
comparison needed; there is no competing candidate ordering to weigh.

## Split decision

No split. One coherent piece: a new pure-function module, one CLI verb
built on it, and three doc edits pointing sessions at that verb — small
enough (per the files-touched list above) to execute as a single item, not
worth the overhead of separate child items with their own verify commands.

## Assumptions

- The CLI verb's exact name (`main-checkout-reset`) is this plan's own
  choice, not re-litigating `CONTEXT.md` — `CONTEXT.md`'s outstanding
  question 1 explicitly left this to planning. Not material enough to send
  back to `fgos-coding-exploring` (naming a verb does not change the item's scope
  or acceptance criteria).
- "Explicit human confirmation" (`CONTEXT.md`'s outstanding question 2) is
  resolved here as a `--confirm` flag the caller must pass after seeing the
  full `git status --porcelain` output printed by the verb itself — an
  interactive-prompt design was considered and rejected: `bin/fgos.mjs`'s
  existing verbs are all non-interactive (flag-driven), and matching that
  convention keeps the verb scriptable/testable, consistent with every
  other verb in this file.
- `CONTEXT.md`'s outstanding question 3 (whether the doc reminder also
  needs a line in `fgos-routing/SKILL.md`) is resolved here as **no** —
  `pick`/`cook`/`AGENTS.md` are the same three surfaces
  `pick-cook-worktree-bypass-reminder` used for the analogous case; a
  session reaches this danger through those entry points, not through
  `fgos-routing` directly.
