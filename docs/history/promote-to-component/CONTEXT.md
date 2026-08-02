---
title: promote-to-component action (Layer 2)
item: tsk-3gx
---

# tsk-3gx — Action `promote-to-component`

## Feature boundary

A new Layer 2 (mutating) action, alongside `sync-root` and the 8 existing
Layer 2 bug fixes described in
`plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md`.
It takes N work items that are currently flat siblings — linked only
through `deps`/`mergeAfter`, no `parent` — and, once someone (a person or
another session) has judged they are really one component that should
converge before merging to `main`, atomically:

1. resolves (creates or reuses) one shared integration branch,
2. rebases/retargets each member's own branch onto that integration
   branch — or refuses per-item and hands off to a person if that retarget
   looks risky,
3. only after each retarget lands for real, updates that item's `parent`
   field to match,
4. records a real decision documenting the convergence.

This action **only executes** a convergence that has already been
decided — it does not detect or infer which items belong together
(tsk-3hk, the harness-side detector that was meant to make that call, is
now `status: wontfix`, so no such detector exists in the codebase today).
It is distinct from `fgos edit --parent`, which only edits the state
field and never touches git — using it alone on N already-diverged
branches leaves `parent` claiming a lineage the git history never lived,
which corrupts `graph-harness.mjs`'s merge-target routing (see Scout
below).

Out of scope: deciding *which* items form a component (a person's or a
future detector's job, not this action's); the harness v2 design as a
whole (that item, tsk-3hk, is `wontfix` — this action is scoped narrower
than that abandoned design and stands on its own, blocked only on
tsk-2u0, which is `delivered`).

## Locked decisions

| ID | Decision |
|---|---|
| D1 | Root identity: both allowed. The caller may pass an existing member id to promote to root (that member's own branch becomes the integration branch, others retarget onto it), or omit it and get a fresh milestone-style root item created (title/description authored fresh, no code of its own — same pattern as tsk-5t3a) that all N become children of. |
| D2 | Trigger input: the action takes an explicit list of N item ids from its caller. It performs light validation only — confirming every id is currently flat (no `parent` set) and connected via `deps`/`mergeAfter` — and never infers grouping itself; that judgment call stays entirely outside this action. |
| D3 | Bail-to-human threshold: step (b)'s per-item retarget aborts and hands off to a person, instead of proceeding automatically, when either (i) a dry-run rebase/retarget of that member's branch onto the integration branch would produce real conflicts, or (ii) the target branch's worktree looks currently active (uncommitted changes present, or checked out by another process/session). This is the same shared-checkout danger tsk-3au already documented — a destructive git operation run without checking whether the checkout was dirty/shared first. |

## Pinned terms

- **Component** — in this item's context, N work items originally filed
  as independent, flat siblings (linked only via `deps`/`mergeAfter`) that
  are later judged to actually be one indivisible unit of work that must
  merge together, in order, through one shared integration branch before
  reaching `main`. Not a schema field — implemented entirely through the
  existing single-parent `parent` field (confirmed: no separate
  `componentId`-style field exists in `work.mjs`'s schema today).
- **Retarget** — rebasing (or otherwise moving) an existing git branch
  that was created against one base onto a different base branch, so its
  commits become descendants of the new base. Distinct from `edit
  --parent`, which only changes the state field.

## Scout evidence

- `src/state/graph-harness.mjs:76-77` (doc comment on `mergeTier`
  computation): "a `proposed` item, derived from `item.parent` alone (an
  item with a parent always merges into SOME `fgw/<root>`, never straight
  to main". `mergeTier[item.id] = item.parent ? 'leaf-to-root' :
  'root-to-main'` (line 175). Confirms the item's stated danger is real:
  setting `parent` via `edit --parent` alone, without a matching real git
  retarget, misroutes this merge-target computation.
- `src/runner/root-affinity.mjs:56-73` (`resolveRoot`): walks
  `view.work[id].parent` purely in-memory — no git inspection — to find
  an item's root. Confirms `parent` is the only linking mechanism; no
  separate component concept exists.
- `bin/fgos.mjs` + `docs/how-to/set-or-clear-a-work-items-parent-lineage-via-cli.md`:
  `fgos edit --parent <id>` / `--parent ""` already exists (tsk-1xx),
  state-only, does not touch git.
- `src/runner/worktree.mjs:273-300` (`createWorktree`): branches are
  created once, from `opts.baseRef` if given else the default base — no
  existing mechanism retargets/rebases an *already-created* branch onto a
  different base. This action introduces that mechanism for the first
  time.
- tsk-5t3a (`status: todo`, `kind: feature`, no code footprint) —
  confirmed precedent for a pre-created "milestone" root item used purely
  for grouping, supporting D1's "brand-new root item" option as a real,
  already-used pattern, not a novel one.
- tsk-3au (`status: todo`) — the cited shared-checkout incident: a session
  ran `git reset --hard` on the main checkout without a full `git status`
  first, discarding other in-flight sessions' uncommitted work. Grounds
  D3's threshold in a real, already-occurred failure mode, not a
  hypothetical one.
- `fgos tool query --capability impact-analysis --status present`:
  `gitnexus` present via MCP — impact-analysis posture is **full** for
  this session (informational; does not gate or reshape the above).

## Canonical references

- `plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md`
  — the design report this item was filed alongside (harness v2). tsk-3hk
  (that report's own filed item) is now `wontfix`; this action stands on
  its own, depending only on tsk-2u0 (`delivered`).
- `docs/how-to/set-or-clear-a-work-items-parent-lineage-via-cli.md` —
  existing `edit --parent` behavior this action must not be confused with.

## Outstanding questions deferred to planning

- Exact mechanism for the dry-run conflict check in D3 (i) — e.g. `git
  merge-tree` vs an actual scratch rebase attempt — and exactly how "looks
  currently active" in D3 (ii) is detected (a worktree-list scan? an
  uncommitted-changes check inside that specific worktree, if one
  exists?). Both are implementation choices, not product decisions.
- Whether `main-checkout.lock` needs to cover the whole atomic (a)-(d)
  sequence, or just the git-mutating sub-steps — a safety/locking design
  question for planning, not scoped here.
- Whether creating a fresh root item (D1's "new item" branch) should go
  through the existing `fgos add` verb directly, or some other path —
  implementation detail for planning.
