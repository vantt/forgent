# Plan: render effective stage on every read surface

**Item:** tsk-4zj
**Mode:** standard (2 flags, unchanged from the first round: public-contracts, existing-covered-behavior — see `fgos-routing`'s Orient handoff). The scope grew during `fgos-coding-validating`'s reality-gate FAIL and the mid-planning gap that followed (D5/D6), but the flag count driving lane sizing did not — no auth/authorization/audit/security/cross-platform/multi-domain surface was ever in play, and the growth is still "attach a derived field to existing read paths," not a new hard-gate concern. Staying at `standard` rather than escalating to `high-risk`.

**Revision note:** this is the SECOND version of this plan. The first version was returned by `fgos-coding-validating` (repo-fit FAIL — see `CONTEXT.md`'s Scout evidence for the full per-verb table) because it assumed all 10 originally-named verbs uniformly carry `item.stage`; that assumption was false for half of them. `CONTEXT.md`'s D5/D6 correct the scope; this plan is shaped against the corrected decisions only.

**Decisions:** `docs/history/read-surface-effective-stage/CONTEXT.md` (D1-D6)

## Approach

Add one small pure helper next to `stageForStep`/`getDomain` in
`src/state/workflow-stage-graphs.mjs` (D1 — consolidates a pattern already
inlined independently in `frontier.mjs`/`stage-fsm.mjs`/`impact.mjs`, and,
per newly-found evidence, a fourth time in `herdr-plugin/src/fgos.rs:213`
outside this repo):

```js
export function effectiveStage(item, domain) {
  return item.stage ?? stageForStep(domain, 'Execute');
}
```

Wire it into exactly six places (D6's corrected scope), split into two
groups by how much design work each needs:

**Group A — mechanical (already pass around a full item object):**
- `list` (`bin/fgos.mjs:1590-1654`, both `--id` and `--all` paths)
- `show` (`bin/fgos.mjs:1681-1698`, the `.work` key)
- `ready` (`frontier.mjs:108`, `ready.push(item)` — attach at the
  `bin/fgos.mjs:1704-1706` print layer, not inside `frontier.mjs` itself,
  to keep `frontier()`'s own return shape — used internally by
  `resolveDecompose`/`resolveDiscovery`/`claimWork`, not just this CLI
  verb — untouched, per D1's boundary)
- `merge list`'s `candidates` branch only (`graph-harness.mjs:100`,
  `candidates.push(item)`) — the `waiting` branch stays untouched (D6:
  bare ids, explicitly excluded)
- the human table renderer for `fgos list` (no `--json`)

Each of these already has `item`/`c` in scope; add `stageEffective:
effectiveStage(item, getDomain(item.domain))` to the returned/printed
object. Table renderer additionally needs the explicit/default
distinction: `'stage' in item ? stageEffective : `${stageEffective}
(default)`` (D4).

**Group B — real shape additions (need a new field slot that doesn't
exist today):**

- **`rollup`** (`collectRollupData`, `bin/fgos.mjs:724-739`): add
  `stageEffective` to the root object AND to each entry in `children`.
  Children are read via each child's OWN `domain` field
  (`getDomain(c.domain)`), never assumed to share the parent's domain —
  domain is per-item, same lazy-default shape as `stage` itself.

  ```js
  function collectRollupData(view, id) {
    const item = view.work?.[id];
    if (!item) throw new StoreError('validation', `rollup: work "${id}" not found.`);
    const children = Object.values(view.work).filter((w) => w.parent === id);
    const done = children.filter((w) => w.status === 'done').length;
    return {
      id,
      title: item.title,
      status: item.status,
      stageEffective: effectiveStage(item, getDomain(item.domain)),
      doneCount: done,
      totalCount: children.length,
      children: children.map((c) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        stageEffective: effectiveStage(c, getDomain(c.domain)),
      })),
    };
  }
  ```

- **`graph`** (`graphMetrics`, `src/state/graph-metrics.mjs:445-457`): add
  one new top-level key, `stageByItem: { [id]: effectiveStage(work[id],
  getDomain(work[id].domain)) }`, covering every id in `view.work` — a
  flat side-map, rather than changing `components[].items`/`criticalPath`/
  `topUnblock` from arrays of bare id strings to arrays of objects (which
  would be a real breaking shape change and would fail multiple existing
  `assert.deepEqual(components[0].items, [...])`-style assertions, per
  `CONTEXT.md`'s Scout evidence). A reader cross-references any id
  appearing anywhere in the output against this one map instead.
  `test/state/graph-metrics.test.mjs:343`'s `Object.keys(m1)` assertion
  needs its expected array updated to include `'stageByItem'` — expected,
  intentional test maintenance for a real added field, not a violation of
  the D1-style absence contract (that one guards the STORAGE layer never
  defaulting `stage`; this is the print/compute layer, exactly where D1
  says the derivation belongs).

  **`graph --what-if <id>`** (`whatIf`, `src/state/graph-metrics.mjs:394-
  409`) is the same verb's second mode. `newlyReady` is an array of ids
  whose `status === 'todo'` — todo spans every stage, same reasoning as
  the main `graph` mode — so it gets the same treatment: add
  `stageByItem` covering `newlyReady`'s ids (and the queried `id` itself,
  when `exists: true`).

### Alternatives rejected

- Inject `stageEffective` inside `listWork()`/`rebuildView()` itself (D1)
  — rejected: that is the storage/view layer the two locked tests
  (`frontier.test.mjs:205`, `backward-compat.test.mjs:277`) pin, and
  `listWork()` also feeds internal engine logic
  (`resolveDecompose`/`resolveDiscovery`/`claimWork`) never designed to
  see a synthetic field.
- Overload `stage` itself at print time (D4) — rejected: breaks any
  future `item.stage === 'executing'` equality check, mixes types.
- Change `components[].items`/`criticalPath`/`topUnblock` from id-arrays
  to object-arrays (considered during this revision) — rejected: a real
  breaking change to an already-tested array shape, when a side-map
  (`stageByItem`) gets the same information across additively.
- Cover `stale`/`conflicts`/`merge`'s `waiting` branch/`check` (D6,
  reversed from D2) — rejected: each one's candidate-set filter already
  restricts it to items at the Execute-mapped stage by construction; the
  field would be a constant there, forever.

### Risk map

| Component | Risk | Proof point (fgos-coding-validating) |
|---|---|---|
| `effectiveStage()` helper | light | Unit test in `test/state/workflow-stage-graphs.test.mjs`: explicit stage returned as-is; absent stage on `coding` domain resolves to `'executing'`. |
| Group A wiring (`list`/`show`/`ready`/`merge-candidates`/table) | light-medium | CLI test asserts `stageEffective` present and correct in each of the 5 surfaces, for both a stage-absent and stage-explicit item. |
| `rollup` (Group B) | medium | CLI test: a rollup whose children span `clarify`/`decompose`/`executing`/default-absent shows the right `stageEffective` per child and for the root; existing `rollup` tests (title/status/doneCount/totalCount/children id-title-status) must still pass unmodified (additive-only change to the returned object). |
| `graph`/`graph --what-if` (Group B) | medium | CLI/unit test: `stageByItem` covers every id in a small fixture view with mixed explicit/default stages; `test/state/graph-metrics.test.mjs:343`'s key-list assertion updated and still exhaustive (no other key silently missing); `graph --what-if` on both a real id and `ghost` (existing `exists:false` test at `test/cli/fgos.test.mjs:7968`) still behaves identically plus the new key. |
| Preserving the two D1-locked "stage absent" tests | medium | `test/state/frontier.test.mjs:205` and `test/state/backward-compat.test.mjs:277` pass unmodified — by construction (no edit to `store.mjs`/`replay.mjs`/`replay.mjs`), confirmed by the full `npm test` run, not just the construction argument. |
| External consumer (`herdr-plugin`) | light, accepted | Reads named fields by key (confirmed: it already independently computes its OWN `item.stage ?? "executing"` at `fgos.rs:213`) — an additive `stageEffective`/`stageByItem` key is inert to it. Out of this repo's scope to update the Rust crate itself. |

**impact-analysis: degraded** (unchanged from the first plan round — see
`CONTEXT.md`'s Scout evidence: GitNexus `present` but its index is 454
commits behind HEAD). Cross-checked instead via direct reads of
`graph-metrics.mjs`/`graph-harness.mjs`/`store.mjs`/`bin/fgos.mjs` during
both planning rounds — no signal of a consumer treating any of these
verbs' current shape as load-bearing beyond what the risk map above
already names.

## Shape

Still one honest piece of work, not split — Group A and Group B share the
same foundational helper and the same verify command; splitting them into
sibling items would just create two items with overlapping footprint on
`bin/fgos.mjs`/`workflow-stage-graphs.mjs`, the same reasoning the first
plan round already rejected a split for.

Order (no `fgos graph --what-if` benefit — tsk-4zj has no deps/children to
unblock; ordering is pure implementation sequencing):

1. `effectiveStage()` in `workflow-stage-graphs.mjs` + its unit test.
2. Group A: `list` first (highest-traffic, the original ask's own focus),
   then `show`/`ready`/`merge-candidates`/table.
3. Group B: `rollup`, then `graph`/`graph --what-if` (touches a locked
   key-set test, saved for last so Group A's simpler wins land first).
4. Full CLI test coverage across all 6 surfaces (explicit + default +,
   for rollup/graph, mixed-stage cases) + full `npm test` run.

### Concrete cases to prove

- Item with `stage` never set → `stageEffective: 'executing'`; `stage`
  key still absent; table shows `executing (default)`.
- Item with `stage: 'clarify'` explicitly set → `stageEffective:
  'clarify'`; table shows plain `clarify`.
- `rollup` on a root whose children span multiple stages (a fresh
  decompose split still at `decompose`, one already at `executing`, one
  with no `stage` at all) — each child's own `stageEffective` shown
  independently.
- `graph`'s `stageByItem` covers an id that appears in `components` but
  in none of `criticalPath`/`staleBlocked`/`topUnblock` (proves the map
  is keyed off the whole work set, not just ids already surfaced
  elsewhere in the output).
- `graph --what-if` on an existing id and on `ghost` (existing FAIL/miss
  case, `test/cli/fgos.test.mjs:7968`) — miss case adds no `stageByItem`
  noise (empty or absent, never a spurious entry for a nonexistent id).
- `test/state/frontier.test.mjs:205`, `test/state/backward-compat.
  test.mjs:277`, and `test/state/impact.test.mjs:128-129` (triage, D5 —
  must stay green untouched, confirms D5's "no change" holds) all still
  pass unmodified.

## Assumptions

- **A1:** `stageForStep(domain, 'Execute')` never returns `undefined` for
  the `coding` domain — confirmed by reading `DOMAINS.coding.stepMap`
  (`workflow-stage-graphs.mjs:64`). `fgos-coding-validating` should re-confirm
  this holds at execution time.
- **A2 (revised):** the six-surface set (D6) is the complete set of read
  verbs where `stageEffective`/`stageByItem` is both possible (the verb's
  own candidate items aren't stage-restricted by construction) and useful
  (the plan's own Approach section traces each one's real backing
  function). `fgos-coding-validating` should spot-check this against the actual
  `bin/fgos.mjs` case list one more time before `executing`, since A2 was
  wrong once already this round.
- **A3 (new):** `merge list`'s `waiting` branch and `stale`/`conflicts`/
  `check` genuinely have no id-to-stage-aware consumer today that this
  exclusion would break — `fgos-coding-validating` confirmed the candidate-set
  filters during the mid-planning gap session, but did not exhaustively
  search every existing test file for an assertion that might depend on
  those verbs' current (stage-free) shape staying exactly as-is; a
  narrow grep pass at `fgos-coding-validating` time would close this out fully.

## Proof surface (for the gate below)

`npm test` — the item's own locked verify command — runs the full
state+cli+runner+e2e suite, including every new/changed test listed
above, across both Group A and Group B.
