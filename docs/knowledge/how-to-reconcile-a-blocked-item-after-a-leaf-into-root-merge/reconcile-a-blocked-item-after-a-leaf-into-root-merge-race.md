---
framework: diataxis
mode: how-to
---
# How to reconcile a blocked item after a leaf-into-root merge race

Use this when a leaf item's `approve` reports `blocked`/`verify-fail`,
but you suspect the real git merge actually landed and only the status
write itself was lost — a real, acknowledged race in `bin/fgos.mjs`.

## The acknowledged race this covers

```js
// Ephemeral worktree checked out on fgw/<rootId> (guaranteed to
// exist by the time a leaf reaches "awaiting-approval" — dispatch-side
// wiring, cell fan-out-parallel-9) — never the human's own main
// checkout. ASSUMPTION (acknowledged, not fixed in this cell):
// this races a concurrent approval of a sibling leaf of the same
// root, or the runner's own dispatch of that root, since
// createWorktree's branch-reuse path force-reclaims any existing
// checkout of fgw/<rootId>; low-likelihood under single-operator
// P6, D16's per-root merge-mutex lives in the runner's
// write-queue, not this human-driven CLI verb.
```

A leaf-into-root approve checks out an ephemeral worktree on
`fgw/<rootId>`. If a concurrent approval of a *sibling* leaf of the same
root (or the runner's own dispatch of that root) reclaims that same
checkout mid-operation — `createWorktree`'s branch-reuse path
force-reclaims any existing checkout of `fgw/<rootId>` — the CLI
process that started first can die before it ever writes the item's own
`delivered` status, even though its merge commit already landed for
real on `fgw/<rootId>`.

## The real incident this was proven against

`tsk-19j-3`'s own `approve` hit exactly this: `git log -1 --format=%H
a909ae6` confirmed a real merge commit ("Merge branch 'fgw/tsk-19j-3'
into fgw/tsk-19j") had genuinely landed on `fgw/tsk-19j`, but the item's
own status stayed stuck reporting `blocked`/`verify-fail`. Root cause
here specifically: overlapping background+foreground `approve` retries
during a slow `npm test` verify — self-inflicted concurrency, not a
defect in the merged content itself.

## Step 1 — confirm the merge commit is real

```
git log -1 --format=%H <suspected-merge-commit>
```

Confirm the commit exists and its parents are what you expect (a real
merge of the leaf branch into the root branch).

## Step 2 — independently re-verify the landed content, in an isolated worktree

Don't trust a `/tmp`-based check — a prior attempt on this exact
incident gave a false-negative "missing yaml package" error from an
improperly-resolved dependency tree. Use a worktree properly nested
under the main checkout instead, so hoisted dependencies resolve
correctly:

```
git worktree add --detach .claude/worktrees/repro-<id>-check <merge-commit>
cd .claude/worktrees/repro-<id>-check
npm test
```

Confirm a clean pass matching the same test count every other item's
own clean verify shows — for this incident: 2245 pass, 0 fail, 5
pre-existing skips.

## Step 3 — reconcile status via `fgos move`, never a hand-edit

```
blocked -> delivered
```

is a legal FSM edge (`src/state/fsm.mjs`). Run the real `fgos move`
verb (never edit `.fgos/events.jsonl` by hand) to reconcile the item's
status to match the real, already-landed git state — this mirrors
exactly what `bin/fgos.mjs`'s own success-path status write would have
recorded had the process not died before reaching it.

## Why this reconciliation is safe, not a shortcut

The real content is independently proven (steps 1–2) before any state
write happens — this is not "assume it's fine and move on." The FSM
edge itself (`blocked -> delivered`) is a legitimate, pre-existing
transition, not a special-cased override. And the root cause was
confirmed to be this session's own overlapping retries racing the
documented, acknowledged assumption in the code — not a hidden defect
in the merged content.
