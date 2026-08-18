# Plan — discover-pool.mjs's isCandidate() ignores deps-readiness

Item: tsk-2v3.

Mode: **small** (0–1 flags per fgos-routing's Mode-gate: 1 flag applies —
"existing covered behavior", since `isCandidate()`/`pickNextDiscoverItem`
already have a real test suite this change must extend without regressing;
none of auth/authorization/data model/audit-security/external systems/
public contracts/cross-platform/weak-proof-area/multi-domain apply — a
couple of files, no gray areas).

## Approach

Fix scope is exactly `CONTEXT.md` D1: `discover-pool.mjs`'s `isCandidate()`
must also refuse an item whose deps aren't resolved or that is anchored by
an open decomposed child — the same stage-independent check `frontier.mjs`
already exports as `isDepsAndLineageReady(view, id)` and `take`'s
explicit-`--id` claim path already reuses.

Alternatives rejected:
- **Duplicate the deps/lineage logic inline in `discover-pool.mjs`** —
  rejected: `isDepsAndLineageReady` already exists, already exported,
  already proven correct by `take`'s own use of it (the live tsk-28x repro
  in `CONTEXT.md` is that exact check firing) and by `frontier()`'s own
  `depsReady`/`hasOpenDescendant` clauses for the executing pool. A second
  copy would drift.
- **Filter in `pickNextDiscoverItem` instead of `isCandidate`** — rejected:
  `isCandidate` is the single existing predicate for "is this item pool-
  eligible at all"; adding a second, separate filter step downstream of it
  would split one concept across two call sites for no reason.
- **Surface a "found but blocked" result instead of silent exclusion** —
  rejected per `CONTEXT.md`'s own Pinned terms: matches the only existing
  convention in this codebase (`frontier()`'s silent exclusion of a
  deps-not-ready executing-stage item); no evidence anyone needs a
  different, richer shape.

## Risk map

| Component | How risky | What proves it |
|---|---|---|
| `isCandidate()` change itself | LOW — pure function, one new call to an already-proven helper, no new state shape | `gitnexus impact` (below) + new/updated unit tests in `discover-pool.test.mjs` |
| Callers of `pickNextDiscoverItem` (`/fgOS:discover-next`, `/fgOS:discover-loop`) | LOW — behavior only gets STRICTER (fewer items pass), never returns an item it didn't before; no caller depends on being handed a deps-not-ready item | Full existing suite (`node --test 'test/**/*.test.mjs'`) stays green — a caller relying on the old, buggy behavior would show up as a new failure |

**Blast-radius evidence (impact-analysis: full — GitNexus present, per
CLAUDE.md's capability gate, confirmed live 2026-08-11 in `CONTEXT.md`'s
Scout evidence, re-confirmed this session):**

`impact({target: "isCandidate", direction: "upstream", file_path:
"src/state/discover-pool.mjs"})` → risk **LOW**, exactly 1 direct caller
(`pickNextDiscoverItem`, same file), 1 affected process
(`PickNextDiscoverItem → BuildUnifiedEdges`), 1 affected module (`State`).
No other symbol in the graph calls `isCandidate` — the blast radius is
fully contained inside `discover-pool.mjs` itself.

No split: this is one honest piece of work (one function, one behavior
change, one test file) — `fgos graph --what-if` ordering does not apply
since there is nothing to order between pieces.

## Shape

**File:** `src/state/discover-pool.mjs`

Change `isCandidate(item)` to also take the view/id it needs to call
`isDepsAndLineageReady`:

```js
function isCandidate(item, view) {
  return (
    item.status === 'todo' &&
    CANDIDATE_STAGES.has(item.stage) &&
    isDepsAndLineageReady(view, item.id)
  );
}
```

Import `isDepsAndLineageReady` from `./frontier.mjs` (already exported,
already the reuse target D1 names). Update `pickNextDiscoverItem`'s one
call site (`if (!isCandidate(item)) continue;`) to pass `view` through —
`view` is already in scope there as the function's own parameter.

**File:** `test/state/discover-pool.test.mjs`

Add test cases proving the new exclusion, matching this file's existing
`item(id, stage, status, extra)` helper convention:

- a `stage:clarify`/`stage:decompose` item with `status:todo` but an unmet
  dep (`deps: ['x']` where `x` is not `done`/resolved) is never picked,
  even when it is the only candidate in the view (mirrors the tsk-28x live
  repro, minus needing a live store)
- the same item becomes pickable once its dep resolves (`x` moved to
  `done` in the view) — proves the fix is a real gate, not an accidental
  permanent exclusion
- an item anchored by an open decomposed child (a second item with
  `parent: id`, `status` not in the resolved set) is never picked, even
  with `status:todo` and no unmet `deps` — proves the fix reuses
  `isDepsAndLineageReady` wholesale (both clauses), per `CONTEXT.md`'s
  Pinned terms, not just the deps-done half
- a pre-existing passing test (e.g. "a single stage:clarify candidate is
  picked over stage:decompose ones") stays green unmodified — proves no
  regression to the already-covered ready-item path

### Concrete cases proven

- boundary: dep resolved via every status in `RESOLVED_STATUSES` (not just
  `done`) — already covered transitively by reusing
  `isDepsAndLineageReady` as-is (no new logic to re-test independently;
  its own test file already proves this, cited in `CONTEXT.md`'s Canonical
  references)
- existing behavior that must not regress: every pre-existing test in
  `discover-pool.test.mjs` (ordering, clarify-wins-over-decompose,
  discovery/exploring pool membership) — none of those fixtures declare
  `deps` or a `parent`, so `isDepsAndLineageReady` returns `true` for all
  of them unchanged; asserted by running the full file, not by editing
  those tests
- concurrent access / partial failure: not applicable — pure function, no
  I/O, no shared mutable state (`discover-pool.mjs`'s own file header:
  "PURE: no fs, no `.fgos/` read")

### Assumptions

- None material beyond what `CONTEXT.md` already pinned. No new
  `CONTEXT.md` gap surfaced while shaping this plan.

## Proof surface

Verify command (real, runnable today): `node --test
test/state/discover-pool.test.mjs`

## Outstanding questions

None
