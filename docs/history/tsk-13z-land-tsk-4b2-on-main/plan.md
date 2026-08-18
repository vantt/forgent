# plan.md — tsk-13z: land fgw/tsk-4b2 on main

Mode: standard

**Flag count: 2** — existing covered behavior (`src/runner/loop.mjs`,
`src/intake/discovery.mjs`'s already-tested discovery/exploring wiring are
in play), weak proof around the area (GitNexus impact-analysis index is
present but stale, per `CONTEXT.md`'s scout evidence — degraded, not
inactive). No hard-gate flag (auth/data-loss/audit/external-provider/
remove-validation) applies. 2 flags -> **standard** lane per
`fgos-routing`'s own Mode-gate table (this session entered via
`/fgOS:pick` -> `fgos-coding-driving`, never through `fgos-routing`'s
Orient step, so no lane was handed off — applying the Mode-gate table
directly here per `fgos-coding-planning`'s own direct-entry fallback).

## Approach

**Chosen path:** merge `fgw/tsk-4b2` directly into this item's own branch
(`fgw/tsk-13z`) with `git merge --no-ff fgw/tsk-4b2`, run the full test
suite, run the item's own `verify`, commit, then land through **this
item's own** normal execute -> return -> approve lifecycle — never touch
`tsk-4b2`'s own item state.

**Rejected alternative:** the item description's own literal suggestion —
re-drive `tsk-4b2`'s own status machine backward (`cleanup -> blocked ->
awaiting-approval -> fgos approve`, the sequence used to land `tsk-4v6`).
Rejected because `tsk-4b2` is already three states past its own terminal
position (`delivered -> retrospective -> cleanup`); resurrecting a
lineage item that far past its own natural finish is exactly the kind of
manual status manipulation this bug exists to stop repeating, and this
session has no live claim on `tsk-4b2` anyway (it claimed `tsk-13z`).
Merging inside `tsk-13z`'s own already-claimed branch keeps one clean
audit trail ("tsk-13z merged tsk-4b2's content"), needs no second claim,
and never reopens an already-closed lineage item.

### Risk map

| Component | Risk | Proof point |
|---|---|---|
| The merge itself | Low — `docs/history/tsk-13z-land-tsk-4b2-on-main/RESEARCH.md`'s `git merge-tree` dry-run already confirmed 0 conflicts across the 9 touched files | Real `git merge --no-ff fgw/tsk-4b2` in this worktree; `git status` clean, no conflict markers |
| `npm test` after merge | Medium — `src/runner/loop.mjs` and its tests are existing covered behavior; a real merge could still surface something the dry-run's tree-level check missed | Full `npm test` run post-merge, green |
| Item's own `verify` | Low — already confirmed real/runnable in `RESEARCH.md` round 1 | `git merge-base --is-ancestor 7add82b8 main && npm test`, run after merge+commit |
| Stale GitNexus impact-analysis index | Low consequence — `CLAUDE.md`'s own gate: `impact-analysis: degraded` (present, `.gitnexus` behind current HEAD per the session's own stale-index hook warning). This item lands an already-written, already-reviewed branch rather than new logic, so a stale graph is low-consequence here (`CLAUDE.md`'s "plausible but depends on product intent" framing — intent here is mechanical, not new design) | None required; `npm test` + the ancestor check are the real proof for THIS item |

### Files touched

Same 9 files the `git merge-tree` dry-run in `RESEARCH.md` already
enumerated — no new files beyond what the merge itself brings in:

- `.agents/skills/fgos-routing/SKILL.md`
- `.claude/skills/fgos-routing/SKILL.md` (gets the `fgos-clarifying`/
  `fgos-researching` rows — this is the one still-live bug confirmed in
  `RESEARCH.md`)
- `docs/history/tsk-12p/iron-law-evidence.md` (new)
- `docs/history/tsk-4b2-discovery-exploring-stage-wiring/plan.md`
- `docs/history/tsk-4v6/iron-law-evidence.md` (new)
- `src/runner/loop.mjs`
- `src/runner/prompt-templates/worker-prompt-discovery.txt`
- `test/e2e/runner-loop.test.mjs`
- `test/runner/loop.test.mjs`

### Order

One piece, sequential, no split:

1. `git merge --no-ff fgw/tsk-4b2` in `fgw/tsk-13z`.
2. `npm test` — full suite green.
3. Run the item's own verify:
   `git merge-base --is-ancestor 7add82b8 main && npm test`.
4. Commit (the merge commit itself satisfies this — no separate commit
   needed unless the merge needs a manual resolution touch-up).
5. `fgos return tsk-13z` — the engine's own goal-check re-runs step 3.

## Shape

No split — this is one honest piece of work: a branch merge plus its own
verify, not a feature with independently-workable parts. Concrete cases
worth proving, matching the standard-lane depth:

- **Boundary:** the merge must make the *literal* commit `7add82b8` an
  ancestor of `main`'s eventual history — not merely "equivalent content
  present" (main already independently carries part of `tsk-4b2`'s own
  fix via unrelated commit `5b394faf`, per `RESEARCH.md`; a content-only
  check would be a false positive here).
- **Existing covered behavior:** `npm test` must stay green after the
  merge touches `src/runner/loop.mjs` and its own test files — this is
  the standard lane's regression proof for the one non-trivial risk-map
  row above.
- **Partial failure:** if the real `git merge` surfaces a conflict the
  tree-level dry-run missed (untracked/gitignored-file drift between the
  dry-run and the real working tree), resolve it directly against
  `CONTEXT.md`'s locked scope (D1: land `7add82b8` only) — never
  scope-creep into fixing the `checkMergeStillResolves` decomposed-root
  gap `CONTEXT.md` explicitly defers to its own sibling item.
- **Concurrent access:** not applicable — this is a single git merge
  inside this item's own isolated worktree branch, no shared runtime
  state involved.

## Validating — reality gate (fgos-coding-validating, 2026-08-11T06:38Z)

| Dimension | Result | Citation |
|---|---|---|
| Mode fit | PASS | `plan.md`'s own `Mode: standard` line (2 flags: existing covered behavior, weak proof around area — no hard-gate flag) matches a branch-land bug fix; not over- or under-built. |
| Repo fit | PASS | Every path the plan leans on was confirmed real via actual commands in `RESEARCH.md`: `fgw/tsk-4b2` exists (`git branch -a`), tip `7add82b8` matches (`git log -1`), the 9-file merge-tree footprint exists. |
| Assumptions | PASS | The one load-bearing assumption — "the merge is conflict-free" — is proven by a real `git merge-tree 30653bf1 main fgw/tsk-4b2` dry-run (0 conflict markers, `RESEARCH.md` round 1), not asserted from plausibility. |
| Smaller path | PASS | Cherry-picking the 7 unique commits instead of merging was considered and rejected: the item's own `verify` requires the literal commit `7add82b8` to become an ancestor of `main` (`git merge-base --is-ancestor`), which only a real merge satisfies — a cherry-pick produces different commit hashes and would never pass. Merging is the smallest correct path. |
| Proof surface | PASS | `plan.md` step 3 already names the item's own real, runnable verify command — no placeholder. |
| Impact-analysis posture | PASS | `plan.md`'s recorded `degraded` posture matches `fgos tool query --capability impact-analysis --status present` run fresh in this pass: `gitnexus` registered and `present`, but this session's own hook independently flagged the index stale (`last indexed: 4ce7a96`) — same posture, no drift. |

No FAIL. Continuing to the feasibility matrix for the plan's one
medium-risk row.

### Feasibility matrix

| Assumption | Risk | Proof required | Evidence found | Result |
|---|---|---|---|---|
| `npm test` stays green after the real merge lands | Medium | A real command run, not plausibility | Two real pieces: (1) `git merge-tree 30653bf1 main fgw/tsk-4b2` dry-run — 0 conflicts across all 9 touched files, including both test files (`test/e2e/runner-loop.test.mjs`, `test/runner/loop.test.mjs`); (2) baseline `npm test` run fresh on the current (pre-merge) tree in this pass — **2848 passing, 0 failing, 5 skipped**, confirming the starting point is healthy. The literal post-merge full-suite run is the one thing that cannot be evidenced without materializing the merge itself — that is Execute's own build step (per this skill's "leave execution alone" rule), re-confirmed automatically by the engine's own goal-check when `fgos return` runs the item's `verify` (which itself runs `npm test`). | READY WITH CONSTRAINTS |

## Verdict

**READY WITH CONSTRAINTS.** Constraint: the post-merge full `npm test` run
is proven by the engine's own goal-check at `fgos return` time (the item's
`verify` already runs it), not by this pass — this pass's evidence (clean
dry-run + green baseline) is what a feasibility check can honestly gather
before the merge is materialized; nothing here lowers the bar or skips a
row.

## Implementation addendum (fgos-coding-implement, 2026-08-11T07:18Z)

The merge landed clean, exactly matching the dry-run: `git merge --no-ff
fgw/tsk-4b2` on `fgw/tsk-13z`, 0 conflicts, the same 9 files. But the
item's own `verify` command turned out to be structurally unsatisfiable —
see `CONTEXT.md` D4 (supersedes D2). `git merge-base --is-ancestor
7add82b8 main` can never return true through `fgos approve`'s own
goal-check, which runs on a staged (`--no-commit`) merge before the
commit that would advance `main` (`src/runner/merge.mjs:889-1052`). This
was not visible at the `fgos-coding-validating` pass above — that pass evidenced
conflict-freedom and a green baseline, not the mechanics of *when* `main`
advances relative to the goal-check, since that question only surfaces
once a real merge commit exists to test the ancestor check against.

Replaced the item's `verify` with a content-based
`npm test && POSITIVE && NEGATIVE` check per `docs/how-to/write-verify-
for-a-skill-prose-change.md`, confirmed by the user before editing.
Empirically confirmed to fail against current `main` and pass against
the merged content — see `CONTEXT.md` D4 for the full command and
verification trail.

## Outstanding questions

None
