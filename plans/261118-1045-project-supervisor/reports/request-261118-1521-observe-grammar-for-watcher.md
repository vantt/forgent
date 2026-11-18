# Observe grammar requests from supervisor phase 13 (core/watcher/**)

Checked against packages/observe/rust/src/{query,definition,metrics_cli} at sv/p13 head 9f519271b.

## 1. `prefix` condition operator
- Feature: `Op::Prefix` in `query/model.rs` (`{"op": "prefix", "value": "<text>"}`); CLI form `--where field^=text`.
- Semantics: matches when the field is a string starting with `value`; a missing or non-string field does not match.
  Allowed in `where`, `where_latest`, `without.where`.
- Example: `{"field": "fgos.head.role", "op": "prefix", "value": "head:lead-"}`.
- Needed by: `lead-ended` (also needs the role attr on `fgos.head.state`, ops-metrics phase 11), `watcher-active`.

## 2. `any` (or) group in conditions
- Feature: a condition `{"any": [[<cond>, ...], [<cond>, ...]]}` accepted wherever a `Cond` list is.
- Semantics: holds when every cond of at least one branch holds (each branch is an AND list).
- Example: `"where_latest": [{"any": [[{"field": "fgos.plan.status", "op": "eq", "value": "running"}],
  [{"field": "fgos.head.state", "op": "eq", "value": "live"},
   {"field": "fgos.head.role", "op": "prefix", "value": "head:lead-"}]]}]`.
- Needed by: `watcher-active` (plan latest `running` OR a `head:lead-*` head latest `live`, kinds
  `fgos.plan.status` + `fgos.head.state`, `latest_per: subject`).

## 3. Anti-join anchor `after`
- Feature: `Anchor::After` in `query/model.rs` (`"anchor": "after"`).
- Semantics: the window runs from the primary record's `ts` (exclusive) to `now`; `within` is ignored or caps it.
  Drops a record when a matching record of the anti-join kind follows it.
- Example: `"without": [{"kind": ["fgos.supervisor.wake"], "where": [{"field": "fgos.supervisor.outcome",
  "op": "eq", "value": "started"}], "within": "30d", "anchor": "after"}]` — only failures after the last `started` stay.
- Needed by: `supervisor-wake-failed`, `supervisor-stuck` ("count since the last started").

## 4. Definition not cut by the caller's window
- Feature: definition field `"window": "caller" | "own"` (default `caller`) in `definition/mod.rs`.
- Semantics: `own` means the caller's `--since/--until` is not applied to this definition's query; the query bounds
  itself (e.g. by the `after` anti-join of item 3). Rows are still answered at `--now`.
- Example: `{"name": "supervisor-wake-failed", "window": "own", "query": {... "without": [<item 3>] ...}}`.
- Needed by: `supervisor-wake-failed`, `supervisor-stuck`: their row `ts` is the run's first failure
  (`max:ts - span`); a caller window that passes that failure moves `ts` and changes the event id.

## 5. Operand factor from a parameter
- Feature: `Operand::Agg.k` and `Operand::Latest.k` accept `{"param": "<name>"}` as well as a number.
- Semantics: the factor is the resolved param value (configKey or literal); an unset config key makes the answer
  `unmeasured: config-unset: <key>` as other params do.
- Example: `{"lhs": {"agg": {"agg": "age:ts"}}, "op": "gt", "rhs": {"latest": {"measure": "fgos.watcher.interval",
  "k": {"param": "k"}}}}` with `"params": {"k": {"configKey": "watcher.overdueFactor"}}`.
- Needed by: `watcher-overdue`.

## 6. Anti-join on the newest record only
- Feature: `Without.latest: bool` (default false).
- Semantics: with `latest: true`, take the newest record of the anti-join kind (and `on` ref, if set) at or before the
  primary record's `ts` (within `within`), and drop the primary record when that one record matches `where`.
- Example: `"without": [{"kind": ["fgos.watcher.tick"], "latest": true, "within": "1h", "anchor": "record",
  "where": [{"field": "fgos.plans.running", "op": "gt", "value": 0}]}]` plus a second for `fgos.plans.ready`.
- Needed by: `supervisor-idle-burn` ("started while no plan is ready or running" = the tick in force at the wake).

## 7. `--since`/`--until` with `--def`
- Feature: `metrics_cli/query.rs` `dispatch_query` accepts `--since`/`--until` together with `--def`
  (today refused at :289-297).
- Semantics: each loaded definition's `query.since/until` is set from the flags (a definition file never carries
  them); with item 4, a `window: own` definition is left unbounded.
- Example: `fgos metrics query --def core/watcher/definitions --since 2026-11-18T10:30:00Z --now 2026-11-18T12:00:00Z`.
- Needed by: every raised definition; the watcher (supervisor phase 11) passes `since = lastTick - lookbackSec`.

## 8. `max:end` aggregate (and `min:ts`)
- Feature: `Agg::MaxEnd` (`max:end`, newest `endTs`, falling back to `ts`) and `Agg::MinTs` (`min:ts`).
- Semantics: instants, rendered RFC 3339 like `max:ts`.
- Example: `lane-freed` `{"by": ["origin.host"], "agg": ["max:end"]}`; wake runs `{"agg": ["count", "min:ts"]}`.
- Needed by: `lane-freed` (one row per host with ts = the end) and a uniform row-to-event `ts` rule (today the README
  derives `ts` from `max:ts` ± `span` depending on the row's aggregates).
