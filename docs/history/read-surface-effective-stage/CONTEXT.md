# Read surfaces never render an item's effective stage

**Item:** tsk-4zj

## Boundary

`src/state/work.mjs:169` and the D8 lazy-default contract mean a work
item's `stage` field is OPTIONAL and never defaulted at the storage layer:
an item created via `fgos add` (or any item whose stage has never moved)
carries no `stage` key at all in the stored/replayed record. The engine
already knows this reads as `executing` (`stage-fsm.mjs`, `frontier.mjs`,
`impact.mjs` all do `item.stage ?? stageForStep(domain, 'Execute')`), but
every CLI read verb prints the raw stored record — so a reader (human or
agent) looking at `fgos list`/`show`/`ready`/`triage`/`rollup`/`graph`/
`stale`/`conflicts`/`merge`/`check` output for such an item sees no `stage`
field at all, with no way to tell "this item silently skipped
clarify/decompose" from "stage was never populated for some other reason."

This item's fix makes every read surface render the *effective* stage
(defaulted or explicit) without touching how `stage` is stored.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix lives entirely in the CLI print layer (`bin/fgos.mjs`), never in `store.mjs`/`replay.mjs`. Evidence: `test/state/frontier.test.mjs:205` and `test/state/backward-compat.test.mjs:277` both assert `'stage' in item === false` when unset — a locked D8 lazy-default contract at the storage/view layer. This is a discovered constraint, not a preference — not something to relitigate at planning/implementation time. |
| D2 | Fix covers every read verb that prints a work record's stage: `list`, `ready`, `show`, `triage`, `rollup`, `graph`, `stale`, `conflicts`, `merge`, `check` — not just the 5 named in the original ask (`list`, `ready`, `show`, `triage`, `rollup`). All of them call `listWork()`/`rebuildView()` and print `rawView.work[id]` via their own `bin/fgos.mjs` case handler; one shared derive-helper covers all of them at near-zero marginal cost, and scoping to 5 would leave the identical gap re-discoverable later in the other 5. |
| D3 | Fix applies to both `--json` output and the human-readable table rendering of `fgos list` (no `--json`). The item's own motivation names both human and agent readers; a single shared helper feeds both the JSON view-builder and the table row-builder, so skipping table leaves the same blind spot for a person reading the terminal directly. |
| D4 | Add a new additive field `stageEffective` (derived via `item.stage ?? stageForStep(domain, 'Execute')`, the same lazy-default logic `frontier.mjs`/`stage-fsm.mjs`/`impact.mjs` already use) instead of overloading the existing `stage` key. `stage` itself stays untouched (present only when explicitly set, per D8/D1). Explicit-vs-default is derived from `'stage' in item` (already true today, no new field needed for that) — the human table renders `"<value> (default)"` only when that is `false`, plain `"<value>"` when `true`. This keeps `stage` strictly "explicitly set" for any code doing `item.stage === 'executing'`, and avoids a mixed-type value (`"executing"` vs a longer descriptive string) breaking equality checks. Field name is English/machine-parseable — any Vietnamese-language marker (the item's own sketch, "mặc định, không khai") stays confined to the human table rendering only, never the JSON value. |
| D5 | No change needed in `triage`. `impact.mjs:128` (`rankImpact`) already computes `stage: item.stage ?? 'executing'` on its own bespoke ranked object, locked by `test/state/impact.test.mjs:128-129`. This item's complaint does not apply there — `triage` already independently solved its own version of this problem, under a different (pre-existing) field name, unrelated to this item. Discovered during `fgos-coding-validating`'s reality-gate FAIL, not asked as a question — the conclusion follows directly from the locked test, no product judgment needed. |
| D6 | Scope grows beyond D2's original 10-verb claim (user chose to grow scope, not narrow it, when D2 was found empirically wrong — see Scout evidence below) to: `list`, `show`, `ready`, `merge list`'s `candidates` branch, the human table, **plus `rollup` and `graph`**. `rollup`'s children can legitimately sit at any stage (a decompose-split child starts at `decompose`, per add-stage-default-gap D1/D2) and `graph`'s `components`/`criticalPath`/`staleBlocked`/`topUnblock` span the whole graph regardless of status, so an item still at `clarify` legitimately appears there — both are genuine, information-bearing additions. `stale`, `conflicts`, `merge`'s `waiting` branch, and `check` are **excluded at the time this decision was locked**: each one's own candidate-set filter then restricted it to items already at the domain's Execute-mapped stage. **`conflicts`' own exclusion is superseded by D7 below** — the premise this row rested on for `conflicts` specifically no longer holds. `stale`/`merge`-`waiting`/`check` are unaffected and stay excluded. |
| D7 | **Corrects D6's exclusion of `conflicts`.** `tsk-4so` (merged to `main` after D6 was locked, discovered during a full re-scan of 104 commits of drift) changed `footprintConflicts` (`store.mjs`) to scope over `frontierAcrossSteps(view)` — a union of the Clarify/Divide/Execute frontiers — instead of the single Execute-only `frontier`. `conflicts`' candidate set is therefore no longer structurally constant-executing; two items at different stages sharing a footprint is now the exact case `tsk-4so`'s own new tests (`test/cli/fgos.test.mjs`, "items at DIFFERENT stages sharing a footprint are flagged") prove `conflicts` reports. `stageEffective` there is now genuine, information-bearing, same as `rollup`/`graph`. Shape: `fgos conflicts`'s current bare-array output (`[{a,b,shared,suggestions}, ...]`, locked by several existing `assert.deepEqual(data, [...])` tests) wraps into `{conflicts: [...], stageByItem: {...}}` — a side-map, the same pattern already established for `graph`/`merge` rather than adding per-pair fields (which would still break the same exact-shape tests, for no shape-cleanliness gain). No external consumer depends on the bare-array shape — `herdr-plugin` reads `merge list`'s own unrelated `conflicts` field, never this standalone verb — only this repo's own CLI test suite, updated in the same change. |

## Pinned terms

- **Effective stage**: the stage a reader should treat an item as being
  at, whether or not `stage` was ever explicitly written — `item.stage ??
  stageForStep(domain, 'Execute')`.
- **Explicit stage**: `stage` present on the stored record (`'stage' in
  item`) — the item has had at least one `work.stage` move event.
- **Default stage**: `stage` absent on the stored record — the item has
  never had a `work.stage` move event; its effective stage is the domain's
  Execute-mapped stage (D8 lazy-default).

## Scout evidence

- `src/state/work.mjs:165-179` — `stage` is OPTIONAL and NOT in DEFAULTS
  (D8); absent reads as `executing`, documented only in a source comment.
- `src/state/replay.mjs:358-371` (`case 'work.stage'`) — `item.stage` is
  set only by a real `work.stage` event; never defaulted during replay.
- `src/state/frontier.mjs:105`, `src/state/stage-fsm.mjs:84-85`,
  `src/state/impact.mjs:128,155` — three independent places already apply
  `item.stage ?? stageForStep(domain, 'Execute')` internally; none of them
  surface that derived value back out through a read verb.
- `test/state/frontier.test.mjs:205` — `assert.equal('stage' in
  view.work.a, false)`.
- `test/state/backward-compat.test.mjs:277` — `assert.equal('stage' in
  item, false, 'stage stays absent, never injected by replay (D8
  lazy-default)')`.
- `bin/fgos.mjs:1575` (`case 'list'`) — comment (tsk-38t-4) claims
  `herdr-plugin/src/fgos.rs` reads `item.status` only, never `stage`.
  **This comment is now stale**: `herdr-plugin/src/fgos.rs:213`
  (`stage: item.stage.unwrap_or_else(|| "executing".to_string())`, tsk-1pg)
  independently reimplements the exact same `item.stage ?? 'executing'`
  default in Rust, applied to `list`'s raw JSON to build its `doing`-pane
  `DoingRow`s — a fourth independent place doing this derivation (after
  `frontier.mjs`/`stage-fsm.mjs`/`impact.mjs`), and further confirmation
  that the "no one can tell" problem this item fixes reaches external
  tooling too, not just human/agent readers in this repo. Still no risk to
  D4's additive `stageEffective` field (herdr-plugin reads named fields by
  key, an unrecognized additive key is inert to it) — noted here as
  stronger motivating evidence, not a blocker; correcting the stale
  in-repo comment is out of this item's own scope (a Rust-crate change,
  not a `bin/fgos.mjs` one).
- `src/state/graph-metrics.mjs:603-605` (`footprintOverlap`), `:93-114`
  in `graph-harness.mjs` (`mergeReadiness`), `store.mjs:1039-1055`
  (`staleDoingAdvisory`), `bin/fgos.mjs:702-716` (`collectCheckData`) —
  read during the mid-planning gap session: confirm each of `stale`/
  `conflicts`/`merge`-`waiting`/`check`'s own candidate-set filter
  restricts it to items already at the Execute-mapped stage (D6's
  exclusion evidence).
- `src/state/graph-metrics.mjs:445-457` (`graphMetrics`),
  `bin/fgos.mjs:724-739` (`collectRollupData`) — confirm `graph`'s
  components/criticalPath/staleBlocked/topUnblock and `rollup`'s
  `children` are NOT stage-restricted — real evidence for D6's inclusion
  of both.
- `test/state/graph-metrics.test.mjs:343` — `assert.deepEqual(Object.keys(m1),
  [...])` locks `graphMetrics`'s exact top-level key set today. Adding a
  new key there (D6's `graph` inclusion) requires updating this
  assertion as normal, intentional test maintenance — this is an
  exact-shape regression guard, not a deliberate absence-contract like
  D1's two tests; updating it is expected, not a violation.
- `bin/fgos.mjs` case handlers for `show` (1681), `ready` (1704), `graph`
  (1714), `stale` (1738), `conflicts` (1757), `merge` (1778), `check`
  (1890), `rollup` (1901), `triage` (3535) — all print `rawView.work[id]`
  or an item drawn from it.
- Verified live 2026-08-06 on tsk-2sl/tsk-2k1/tsk-503: `fgos list --id
  <id> --json` returns a record with no `stage` key for items created via
  `fgos add` that never had a `work.stage` move.
- `impact-analysis: full` — GitNexus present, freshly checked
  (`fgos tool query --capability impact-analysis --status present`).

## Canonical references

- `src/state/work.mjs`, `src/state/replay.mjs`, `src/state/stage-fsm.mjs`,
  `src/state/frontier.mjs`, `src/state/impact.mjs`,
  `src/state/workflow-stage-graphs.mjs` (`stageForStep`, `getDomain`)
- `bin/fgos.mjs` (all read-verb case handlers listed above)
- `test/state/frontier.test.mjs`, `test/state/backward-compat.test.mjs`

## Outstanding questions deferred to planning

None — every candidate decision needed to bound scope was locked above.
Implementation shape of the shared derive-helper (its exact signature,
where it lives, how the table renderer consumes it) is `fgos-coding-planning`'s
call, not locked here.
