# plan.md — tsk-1l9: land `fgw/tsk-64h` + `fgw/tsk-2t5` on main

Mode: standard

**Flag count: 1** — existing covered behavior (`src/state/discover-pool.mjs`
and `src/setup/registrations.mjs` are both under test). No hard-gate flag
applies: this lands two already-written, already-verified branches rather
than authoring new logic. Impact-analysis capability: `fgos tool query
--capability impact-analysis --status present` returns GitNexus `present`
(one provider). Freshness was **not** independently confirmed against
current HEAD, and `present` never implies a current index (tsk-j7y) — so
blast radius is treated as unproven here. It is low-consequence for this
item: no new logic is authored, and `npm test` plus the item's own
four-clause verify are the real proof.

## Approach

Merge both orphaned branches into **this item's own** branch (`fgw/tsk-1l9`)
with `git merge --no-ff`, resolve `tsk-64h`'s two known conflicts, run the
full suite, then land through this item's normal return → approve lifecycle.

**Never touch `tsk-64h`/`tsk-2t5`'s own item state.** Both are three states
past their natural finish (`delivered`); resurrecting them backward through
`blocked → awaiting-approval` is exactly the manual status manipulation this
whole class of bug exists to stop. Same call, same reasoning as the precedent
in `docs/history/tsk-13z-land-tsk-4b2-on-main/plan.md`.

## Why these two branches were stranded

Both moved `awaiting-approval → delivered` via `work.move` with
`role: "human"` — no friction record, no merge commit. That is the signature
of a bare `fgos move`, not `fgos approve` (the only verb that merges). No
advisory catches the result: `fgos stale`'s `postDelivery` bucket waits a
3-day TTL and then reports "forgotten", never "unmerged"; `fgos doctor`'s
`root-drift` check only walks **root** items, and both of these are leaves.

Closing that gap is a separate item's scope, not this one's — this item only
recovers the lost content.

## Conflicts expected (from `git merge-tree` dry run, 2026-08-12)

| Branch | File | Conflict | Resolution |
|---|---|---|---|
| `fgw/tsk-64h` | `bin/fgos.mjs` | the `src/intake/discovery.mjs` import line — `main` widened it for `tsk-19m`'s `classificationPatchFromVerdict`/`assertCallerClassification`, the branch still has the narrow one | **neither side verbatim** — see below |
| `fgw/tsk-64h` | `CHANGELOG.md` | both sides append to `## [Unreleased]` | auto-merged, both entries kept |
| `fgw/tsk-2t5` | — | none (`git merge-tree` → 0 conflicts) | — |

**Correction to the dry-run's reading.** Taking `main`'s wider import verbatim
would have broken the merge: `fgw/tsk-64h` *moves* `discoverableStages` out of
`src/intake/discovery.mjs` into `src/state/workflow-stage-graphs.mjs` (so
`src/state/discover-pool.mjs` can reach it without a `domain`-layer module
importing a `use-case`-layer one — `test/architecture.test.mjs`). The branch
side of the neighbouring registry import already carries
`discoverableStages`, and that hunk auto-merged. Keeping `main`'s line as-is
would therefore have declared the same binding twice.

Resolution actually applied — `main`'s list **minus** the moved symbol:

```js
import { resolveDiscovery, classificationPatchFromVerdict, assertCallerClassification } from '../src/intake/discovery.mjs';
```

## Files this brings onto main

From `fgw/tsk-64h`: `src/state/discover-pool.mjs` (asks
`discoverableStages` per item instead of a literal `Set`),
`src/setup/registrations.mjs` (+ `work-stage-vocabulary` doctor check),
`src/intake/discovery.mjs`, `src/state/workflow-stage-graphs.mjs`,
`bin/fgos.mjs`, `docs/specs/distribution.md`, `CHANGELOG.md`,
`docs/history/tsk-64h/iron-law-evidence.md`, and their two test files.

From `fgw/tsk-2t5`: `docs/specs/runner.md`, plus its own plan file.

## Verify

```
npm test
  && grep -q work-stage-vocabulary src/setup/registrations.mjs
  && grep -q discoverableStages src/state/discover-pool.mjs
  && grep -q "Quét nghiên-cứu trước dispatch (discovery dispatch)" docs/specs/runner.md
  && ! grep -q "Quét làm-rõ trước dispatch (clarify sweep)" docs/specs/runner.md
```

All four clauses confirmed **red on `main`** before this item started
(2026-08-12, run from the main checkout).

## Risks

| Risk | Level | Proof point |
|---|---|---|
| `tsk-64h`'s new doctor check fires red on the live store | medium — it is designed to name stranded items, and the store may hold some | run `fgos doctor` after the merge and read the check's own message; a red result is information, not a merge failure |
| The two branches conflict with each other | low — disjoint footprints (`src/` + `CHANGELOG` vs `docs/specs/runner.md`) | real sequential merge, `git status` clean between the two |
| `npm test` red after merge | medium — `discover-pool` and `registrations` are covered behavior | full suite run post-merge |

## Outstanding questions

None.
