---
type: plan
title: Direct branch checkout on main checkout instead of worktree (tsk-4hk)
tags: []
timestamp: 2026-08-03T09:17:00.000Z
source_capture_ids: [tsk-4hk]
---

# Mode

**small** — a few files, no gray areas (decisions already locked in
`CONTEXT.md`).

Flag count: 0 of the 10 mode-gate flags apply (no auth, no authorization,
no data model, no audit/security, no external systems, no public
contracts, no cross-platform, no existing covered behavior being touched,
no weak proof around the area, single domain). 0–1 flags would normally
default to tiny/small; **small** fits over **tiny** because three files
are touched (one new journal entry, two `SKILL.md` edits), not "a couple
of files, one direct task."

`fgos graph --json` was run per this skill's own step 3 rule: tsk-4hk does
not appear in `criticalPath` or `topUnblock` — it has no dependents and no
dependencies, so blast-radius ordering does not apply here; this is a
standalone item, not part of a dependency chain.

`impact-analysis` capability posture: **full** (GitNexus `present`, checked
during `fgos-coding-exploring`'s own scout). Not load-bearing for this plan — no
proof point here leans on blast-radius evidence, since every touched file
is Markdown (a journal entry plus two skill docs), not application code.

# Approach

Chosen path: write the incident journal entry first (it is the actual
deliverable per **D1**), then add the two reminder notes (**D2**). No
alternative approach was considered — the shape was already fully
determined by `CONTEXT.md`'s three locked decisions; there is no design
choice left for this skill to make beyond sequencing.

Risk map: none of the three touched files carry a risk above "low" — all
Markdown, no runtime behavior, no public contract. No proof point needs to
be carried to `fgos-coding-validating` beyond the verify command itself (below).

Files touched, in order:

1. `docs/journals/260803-1612-main-checkout-direct-branch-checkout-tsk-4hk.md`
   (new) — the incident writeup. Must honor **D1** (journal format, not
   feature CONTEXT.md) and **D3** (quote the two reflog lines verbatim:
   `HEAD@{29}: moving from main to fgw/retro-loop-docs-260802` and
   `HEAD@{15}: moving from fgw/dispatch-terminology-rename-260803 to
   main`), following the header/section shape of the closest existing
   analog, `docs/journals/260728-2211-worktree-reclaim-data-loss-tsk-1os.md`.
2. `plugins/fgOS/skills/pick/SKILL.md` (edit) — add the reminder note per
   **D2**, near step 4's `EnterWorktree` step (the exact flow this
   incident bypassed).
3. `plugins/fgOS/skills/cook/SKILL.md` (edit) — add the same reminder note
   per **D2**, at whichever point that skill claims an item into its own
   worktree.

This order is the natural dependency order (the journal entry is the
citable evidence the reminder notes point back to), not derived from
`fgos graph` (not informative for a standalone item, per above).

# Shape

One direct piece, no split — `fgos-coding-planning` step 5 does not apply: the
work is honestly one small item, not several independently workable ones.
No child items are created; tsk-4hk proceeds as itself into `executing`.

Concrete cases worth proving, at `small`-mode depth:
- The journal entry actually contains both branch names verbatim (not
  paraphrased) — this is exactly what the engine's own `judgeDiscovery`
  verdict already wrote into the item's `verify` field (see below).
- The reminder note lands in both `pick/SKILL.md` and `cook/SKILL.md`, not
  just one — a single skill would leave the other entry point silently
  uncovered, no different from the original incident.
- `npm test` still passes after touching two `SKILL.md` files (these are
  plugin skill docs — no unit test targets one directly, but the full
  suite is the safety net for anything else the edit might affect, e.g.
  malformed frontmatter breaking a skill-loader test if one exists).

# Proof surface

The item's `verify` field already carries the engine's own judgeDiscovery
verdict (`fgos discover`'s output, not authored here — this skill leaves
Execute's mechanical path alone per its own "leave execution alone" rule):

```
grep -rlq --include='*.md' 'fgw/retro-loop-docs-260802' docs/ && grep -rlq --include='*.md' 'fgw/dispatch-terminology-rename-260803' docs/ && grep -rliq --include='*.md' 'worktree' docs/ && npm test
```

This is the one command that proves the item done — `fgos-coding-validating`
checks it holds up against reality; `fgos-coding-implement` runs it to gate
`fgos return`.

# Assumptions

- The reminder note's exact wording/placement inside each `SKILL.md` is
  left to `fgos-coding-implement` (flagged as an implementation-only detail in
  `CONTEXT.md`'s own "Outstanding questions deferred to planning" — not
  material to scope, behavior, or acceptance criteria, since **D2** already
  locks *that* a note goes in both files, just not its prose).
- The journal entry's exact filename and full prose are likewise left to
  `fgos-coding-implement`; only its required content (**D1**, **D3**) is locked.
