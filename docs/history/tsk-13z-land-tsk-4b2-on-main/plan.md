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
directly here per `fgos-planning`'s own direct-entry fallback).

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

## Outstanding questions

None
