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
- `bin/fgos.mjs:1575` (`case 'list'`) — comment documents that
  `herdr-plugin/src/fgos.rs` (external Rust consumer, outside this repo's
  Node build/test surface) parses `list --all --json` stdout but reads
  `item.status` only, never `stage` — confirms an additive JSON field
  (D4) carries no known external-consumer risk today.
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
where it lives, how the table renderer consumes it) is `fgos-planning`'s
call, not locked here.
