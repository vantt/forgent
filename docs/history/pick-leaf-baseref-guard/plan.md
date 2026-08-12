# pick-leaf-baseref-guard — plan

Item: `tsk-3t4`. Decisions: `docs/history/pick-leaf-baseref-guard/CONTEXT.md`
(D1, D2).

## Mode

**standard.** Flags counted against the ten-item checklist:

- **public contracts** — `pick --id` on a leaf currently always succeeds
  (subject to the existing frontier/stage bypass, claim-lock §3a); D2 adds
  a new refusal case, changing when the CLI's own contract accepts a claim.
- **existing covered behavior** — `test/cli/fgos.test.mjs:2993-3009` already
  locks in "pick --id bypasses frontier/stage for a specific id"; the new
  guard must narrow that without breaking it (a leaf with satisfied deps,
  or a non-leaf/root item, must still claim exactly as today).

2 flags, no hard-gate flag (no auth/data-loss/audit/external-provider), no
single yes/no question deciding the whole plan → standard, not high-risk or
spike. `fgos graph tsk-3t4 --json` confirms the item is a standalone
component (no dependents, nothing to unblock) — no split, no ordering
question against other work.

## Approach

**Chosen path:** extend `claimWork` (`src/runner/claim-port.mjs`) with a
pre-flight guard, gated on `isolate && isLeaf` (i.e. only `pick`'s
worktree-creating path on a leaf item — see rejected alternative below for
why `take` is excluded). Before any state mutation (`moveWork`), check
`item.deps.every((dep) => view.work[dep]?.status === 'done')`; if false,
throw a new `ClaimError('deps-not-merged', ...)` naming the unmerged
dep id(s). `bin/fgos.mjs`'s existing `pick` catch block already re-wraps
`ClaimError` by category (per `268b172`), so no new catch site is needed —
only `CLAIM_ERROR_CATEGORY` needs the new code mapped (→ `'validation'`,
same bucket `not-found` uses; it's a request the caller can't satisfy yet,
not a lock/timeout condition).

**Ordering (this-item-internal, no cross-item ordering per graph check
above):** guard + its regression test land together in one commit — a
guard with no test is unverifiable, a test with no guard has nothing to
assert. The positive-path base-ref test (D1a) is independent and can land
first or in the same commit; grouping both into one commit keeps the item
to Execute's "one commit per item" discipline.

**Rejected alternative — guard also in `take`:** `take` (`isolate: false`)
never calls `createWorktree`; the human continues working in whichever
checkout/branch is already active in `repoRoot`. It only records
`branchHeadAtTake`/`headAtTake` as metadata for `return`'s later progress
check. Since no new branch is physically forked from a maybe-stale
`baseRef`, the missing-sibling-content failure mode (`tsk-1wd-3`) cannot
happen through `take` — extending the guard there would reject claims for
a scenario that can't occur, contradicting YAGNI. Confirmed against
`src/runner/claim-port.mjs:175-179` (`if (isolate) { createWorktree(...) }`
— the only branch-forking call in the function).

**Rejected alternative — new git-ancestor walk:** CONTEXT.md's pinned
technical note already established `status: 'done'` on a leaf implies
merged into root (`bin/fgos.mjs:1856`). Walking git ancestry directly would
duplicate that guarantee with slower, harder-to-test code for no added
correctness — rejected per KISS.

**Risk map:**

| Component | Risk | Proof point (→ `fgos-coding-validating`) |
|---|---|---|
| Guard ordering vs. `moveWork` | **Medium** — the `268b172` incident was exactly a check-ordering bug: a rejected `createWorktree` call *after* `moveWork` had already committed orphaned the claim in `doing` with no branch/worktree. The new guard MUST run before `moveWork`, not after. | A test claiming a leaf with an unfinished dep must assert the item's `status` is still `todo` afterward (not stranded in `doing`) — mirroring the existing orphan-guard test at `test/cli/fgos.test.mjs:3069`. |
| Existing test regressions | **Low-medium** — `test/cli/fgos.test.mjs:2993` and other pick tests use items with `deps: []` or unspecified; need to confirm none of the ~10 existing `pick`/`take` tests use a leaf item with an unsatisfied dep (which would newly fail under the guard). | Full `npm test` run must stay green — no existing test's fixture data should trip the new guard. |
| Root/non-leaf items | **Low** — guard is scoped to `isolate && isLeaf`; a root item (no parent) is never subject to it. | Existing root-item pick tests continue passing unchanged (no new assertion needed, just confirms scope). |

**Files touched:**

- `src/runner/claim-port.mjs` — add the guard (new code block near the
  existing `rootBranchExists`/`baseRef` computation, `~line 114`), add
  `'deps-not-merged'` to `CLAIM_ERROR_CATEGORY`.
- `test/cli/fgos.test.mjs` — two new tests: (1) positive-path base-ref
  fork (leaf's `fgw/<rootId>` exists → new worktree forks from its tip,
  not `main`/HEAD — the gap noted in CONTEXT.md's evidence at line 3069);
  (2) guard refusal (leaf claimed via `pick --id` while a `deps` entry
  isn't `status: 'done'` → claim refused, item stays `todo`, no
  branch/worktree created).

## Shape

Single item, no split (`fgos graph tsk-3t4 --json`: standalone component,
nothing unblocked by it, nothing it depends on). Proceeds as itself through
`fgos-coding-implement`.

Concrete cases to prove, standard-mode depth:

- **Boundary — dep exactly satisfied:** a leaf whose every dep is
  `status: 'done'` claims exactly as today (no new rejection).
- **Boundary — empty deps:** a leaf with `deps: []` is vacuously satisfied
  (`Array.prototype.every` on `[]` is `true`) — must not be misread as "no
  deps declared, skip the check" vs. "deps declared and none are done";
  confirm this is the correct existing-test-preserving behavior (an item
  with no deps was always immediately claimable).
- **Regression — orphan prevention:** guard rejection leaves `status:
  'todo'`, no `fgw/<id>` branch, no worktree — never a partial/stranded
  claim (the exact failure class `268b172` already fixed once for the
  base-ref case).
- **Non-leaf unaffected:** a root item (no `parent`) claims via `pick`
  exactly as today regardless of its own `deps` state — the guard is
  leaf-scoped only, per CONTEXT.md's D2 and this plan's rejected-take
  reasoning.
- **Existing suite regression:** `npm test` full run green — the guard
  must not trip any of the ~13 existing `pick`/`take` tests
  (`test/cli/fgos.test.mjs`, `case 'pick'`/`case 'take'` blocks).

## Execution note

Per the locked platform decision that Execute/verify already have a working
mechanical path, this plan names one verify command for the whole item
(single piece, no split):

```
npm test
```

(the full suite — the change touches a shared choke-point, `claimWork`,
used by both `take` and `pick`; a narrower `--grep` filter risks missing a
regression in `take`'s tests even though `take` itself is out of scope for
the new guard).
