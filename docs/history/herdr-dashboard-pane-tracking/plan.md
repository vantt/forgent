# herdr dashboard pane tracking — plan

Item: `tsk-4zo`. Decisions: `docs/history/herdr-dashboard-pane-tracking/CONTEXT.md` (D0a/D0b/D1/D2).

## Mode

**standard.**

Flags counted:

- **external systems** — yes. This item talks to a herdr CLI verb the
  plugin has never called before (`herdr pane list --workspace <id>`),
  parsing a new JSON response shape.
- **existing covered behavior** — yes. Extends `app.rs`/`ui.rs`, code
  `tsk-3t9-1` just refactored onto ports/adapters and covered with 9
  passing tests; must not regress any of them.
- **weak proof around the area** — yes at plan time, though during this
  planning session it got directly resolved: `herdr pane list --workspace
  wS` was run for real from inside this very session's own herdr pane (see
  Approach below) — the response shape is now proven, not guessed.
- everything else (auth, authorization, data model, audit/security, public
  contracts, cross-platform, multi-domain) — no.

3 flags → **standard**: story-sized behavior touching a new external
response shape plus an existing, tested module — bigger than a
few-files/no-gray-area `small` item, but nothing here hits a hard-gate
flag (no auth, no data loss, no audit surface, no third-party paid
provider, no validation removed), so not `high-risk`.

## Approach

### Real evidence gathered this session

Run directly in this session's own herdr pane (`$HERDR_WORKSPACE_ID=wS`,
confirmed live, not a guess):

```
$ herdr pane list --workspace wS
{"id":"cli:pane:list","result":{"panes":[
  {"pane_id":"wS:pW","tab_id":"wS:t8","workspace_id":"wS",
   "label":"tsk-n4i-2 | a.ssid:afffd875-be95-41cb-8eb2-fa2cf1276eb5", ...},
  {"pane_id":"wS:p1D","tab_id":"wS:t8","workspace_id":"wS", ... no "label" key at all ...},
  {"pane_id":"wS:p1C","tab_id":"wS:tD","workspace_id":"wS",
   "label":"tsk-4zo | a.ssid:01d4c06d-70dc-4e06-a4b0-2bcf85668f28", ...},
  ... 4 more panes, same two shapes ...
], "type":"pane_list"}}
```

Confirms three things the plan below depends on:

1. Response envelope: `{"id":..., "result":{"panes":[...], "type":"pane_list"}}`
   — an array of pane objects, each carrying `pane_id`, `tab_id`,
   `workspace_id`, and an **optional** `label` (2 of the 7 live panes had
   no `label` key at all — an unlabeled/never-`/fgOS:pick`-launched pane
   is real, not a hypothetical).
2. `label`, when present, matches the locked convention
   (`docs/history/fgos-terminal-pane-rename/CONTEXT.md` D4) but not every
   segment is always present in practice — the live `wS:pW`/`wS:p1C` rows
   above show only `taskid | a.ssid:<v>`, no `fg.ssid` segment at all
   (dropped because unresolved in this session), confirming parsing must
   split on `" | "` and take however many segments actually exist, never
   assume exactly 3.
3. `pane_id` + `tab_id` are exactly the two fields D1 requires — no
   further herdr call (`pane get`, `tab list`) is needed to satisfy this
   item's scope.

### Chosen path

Add a fourth port/adapter pair, following `tsk-3t9`'s already-established
hexagonal shape (`docs/history/herdr-fgos-hexagonal-architecture/CONTEXT.md`)
rather than inventing a new pattern:

- **Port** — `PaneRegistry` trait in `ports.rs`, alongside the existing
  `WorkItemSource`/`PaneOrchestrator`/`TerminalUi` traits: `fn scan(&self)
  -> Result<HashMap<String, PaneIdentity>, PaneScanError>`, keyed by
  task-id (D1).
- **Adapter** — new file `herdr-plugin/src/pane_scan.rs` (matching the
  one-file-per-adapter convention `fgos.rs`/`pick.rs`/`ui.rs` already
  set): `PaneIdentity { pane_id: String, tab_id: String }` (D1's exact
  field set, no `workspace_id`), the JSON parsing structs/free function
  (`parse_pane_list`, mirroring `fgos.rs::parse_triage`'s shape), and
  `HerdrPaneScanner { herdr_bin: String, workspace_id: String }`
  implementing `PaneRegistry` by shelling `herdr pane list --workspace
  <workspace_id>` (same `Command::new(herdr_bin)` pattern `pick.rs`
  already uses).
- Label → task-id extraction reuses `pick.rs`'s existing `is_valid_id`
  (currently private) — export it `pub(crate)` so `pane_scan.rs` can
  validate a parsed leading segment against the same fgOS id grammar
  `pick.rs` already enforces, instead of duplicating the check.

**Rejected alternative**: call `herdr pane get <pane_id>` per pane instead
of parsing `pane list`'s own embedded `label` field — rejected because the
live capture above already proves `pane list` alone carries every field
D1 needs (`pane_id`, `tab_id`, `label`); an extra per-pane round trip would
be N+1 calls for no new information.

**Rejected alternative**: give `PaneIdentity` a `workspace_id` field "just
in case" — rejected, cites D1 directly: scope is the dashboard's own
workspace only, and a field nothing reads is dead weight (YAGNI).

### Files touched (all in `herdr-plugin/`)

| File | Change |
|---|---|
| `src/ports.rs` | Add `PaneRegistry` trait, referencing `crate::pane_scan::{PaneIdentity, PaneScanError}` — same style as `WorkItemSource` referencing `crate::fgos`'s types. |
| `src/pane_scan.rs` (new) | `PaneIdentity`, `PaneScanError`, the `pane list` JSON parsing (`PaneListEnvelope`/`PaneListResult`/`PaneRow`, `parse_pane_list`), label→task-id extraction (splits on `" | "`, validates the leading segment via `pick::is_valid_id`, skips panes with no `label` or an invalid leading segment), and `HerdrPaneScanner` implementing `PaneRegistry`. |
| `src/pick.rs` | `is_valid_id` becomes `pub(crate)` (currently private) — no other change; existing 6 tests untouched. |
| `src/app.rs` | `InProcessTask` gains `pub pane: Option<PaneIdentity>`. New method `refresh_pane_state(&mut self, registry: &dyn PaneRegistry)`: on `Ok`, sets each `in_process` task's `pane` from the scan map (`None` if its task-id isn't in the map — D2's "orphaned"); on `Err`, leaves existing `pane` values untouched and surfaces the error via the existing `last_error` field — same transient-failure discipline `refresh_from_fgos` already uses. |
| `src/ui.rs` | The `in_process` list rendering (currently `"{id} — {title}"`) prefixes `"[pane missing] "` when `task.pane.is_none()` (D2). No other rendering change. |
| `src/main.rs` | Composition root constructs `HerdrPaneScanner` from `std::env::var("HERDR_WORKSPACE_ID")` (present and non-empty inside a real herdr-managed pane, per `docs/distillery/deep-dives/how-to-use-herdr.md:382`) + the existing `pick::herdr_bin()`. If the env var is absent (dashboard run outside a herdr pane — D0a's own "outside herdr" case, applied here to the scanner itself), skip pane-state refresh entirely rather than erroring the whole dashboard — same "degrade, don't crash" shape `fgos::repo_root()`'s failure path already uses. Calls `app.refresh_pane_state(&scanner)` on the same 5s `POLL_INTERVAL` tick as `refresh_from_fgos` — one unified poll, not a second timer (CONTEXT.md's deferred cadence question, resolved here: no reason found for a separate interval). |

### Order

1. `ports.rs` — `PaneRegistry` trait (adapter and domain both compile
   against it next).
2. `pane_scan.rs` — the adapter, parseable and testable in isolation
   against the real captured fixture above, independent of `app.rs`/
   `main.rs` changes.
3. `pick.rs` — one-line visibility change (`pub(crate) fn is_valid_id`),
   trivial, unblocks step 2's reuse.
4. `app.rs` — domain: `InProcessTask.pane` + `refresh_pane_state`.
5. `ui.rs` — badge rendering, depends on `app.rs`'s new field existing.
6. `main.rs` — composition root wiring, last because it depends on every
   adapter/domain piece above already compiling.

(`fgos graph --what-if tsk-4zo --json` → `unblocksTransitive: 8`,
`newlyReady: ["tsk-1q3", "tsk-1eu", "tsk-3t9-2"]` — confirms this is real
leverage, but with only one piece of work here `criticalPath` has nothing
to arbitrate between; the file order above is dependency order within the
one item.)

## Scope note: D2's "disable jump-to-pane" half

D2 says an orphaned row's jump-to-pane action is disabled. Today no such
action exists yet — `tsk-1eu` ("click item đang chạy → focus pane",
depends on this item per its own `deps`) is what will add it. This item
delivers the data (`InProcessTask.pane`) and the visual badge only; there
is nothing to "disable" yet because nothing clickable exists in the
`in_process` list today. `tsk-1eu` is expected to read `task.pane` before
wiring its own click handler — noted here so that dependency isn't lost,
not absorbed into this item's own scope.

## Risk map

| Component | Risk | Proof (→ `fgos-coding-validating`) |
|---|---|---|
| `pane_scan.rs` JSON parsing | Low (was the plan's weak-proof flag; resolved this session — see real capture above) | Unit test using the captured live fixture as a `#[cfg(test)]` string constant, same pattern `pick.rs`'s `parse_split_pane_id_reads_the_real_herdr_response_shape` already uses |
| Label→task-id extraction: absent `label`, 1-segment (`taskid` only), 2-segment (`taskid \| a.ssid:<v>`, the live-observed shape), 3-segment | Low — all 4 shapes are now proven real or trivially derivable from the locked convention | Unit tests covering each of the 4 shapes explicitly |
| `App`/`ui.rs` integration (existing covered behavior) | Low — additive field + method, `draw(frame, app)`'s signature untouched | `tests/render_smoke.rs` keeps compiling/passing; full `cargo test` |
| `HERDR_WORKSPACE_ID` absent (dashboard run outside a real herdr pane, e.g. local `cargo run` during dev) | Medium — must degrade gracefully, never panic | Unit test constructing the composition-root path with the env var unset, confirming pane refresh is skipped and `last_error`/dashboard state stays sane |

## Split

No split. One coherent port/adapter pair plus its two small call sites
(`app.rs`, `ui.rs`) — `fgos graph --what-if`'s 8-unblock leverage comes
from finishing this one item, not from subdividing it further.

## Verify

```
cd herdr-plugin && cargo test
```

Same format the engine's own `judgeDiscovery` already assigned this item's
parent-pattern siblings (`tsk-3t9`, `tsk-3t9-1`). All 9 currently-passing
tests must keep passing, plus this item's own new unit tests (label
parsing × 4 shapes, JSON envelope parsing, missing-`HERDR_WORKSPACE_ID`
degrade path).
