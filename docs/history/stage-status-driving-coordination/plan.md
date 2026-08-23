# Plan: classifyStalePostDelivery (tsk-1bl)

## Mode gate

Flags counted against the standard list (auth, authorization, data model,
audit/security, external systems, public contracts, cross-platform,
existing covered behavior, weak proof around the area, multi-domain):

- **existing covered behavior** — `graphMetrics()`'s returned object gains a
  new field; `graphMetrics()` and `metricsFrame()` are both covered by
  `test/state/graph-metrics.test.mjs` today (1 flag).
- No other flag applies: no auth/authorization, no data-model change (pure
  function over already-existing event/view shapes), no audit/security
  surface, no external system, no new public CLI contract (plugs into the
  existing `fgos graph`/advisory surface per D4/D7 — no new verb), no
  cross-platform concern, proof around this area is strong (existing
  `classifyStaleDoing`/`checkCleanupTTLElapsed` tests are the direct
  precedent), single domain (coding).

**1 flag → mode: small.** Two files touched (`src/state/graph-metrics.mjs`,
`test/state/graph-metrics.test.mjs`), no gray areas — every decision is
already locked in `CONTEXT.md` D4/D7, and the technical shape came
pre-grounded in real code citations from the item's own description.

## Approach

**Path chosen:** add one new pure exported function
`classifyStalePostDelivery(view, rawEvents, { thresholds, ttlDays })` to
`src/state/graph-metrics.mjs`, mirroring `classifyStaleDoing`'s shape
(CONTEXT.md D4), and wire its name into `metricsFrame`'s `computed` array
(near line 431) and into `graphMetrics()`'s returned object (near line 454)
as a new field — additive only, no existing field renamed or removed.

**Rejected alternative:** a new CLI verb or standalone command surface —
rejected per the item's own scope note ("KHONG tao lenh CLI moi rieng") and
per CONTEXT.md D3, since `RESOLVED_STATUSES` already gives zero-latency
coordination; this is purely an observability addition to the existing
`fgos graph`/advisory surface.

### Risk map

| Component | Risk | Proof point |
|---|---|---|
| `graphMetrics()` return-shape change | GitNexus `impact(graphMetrics, upstream)` returned **HIGH** (4 impacted symbols; feeds `judgeDiscovery`/`buildDiscoveryPrompt` via `store.mjs`'s `graphMetrics` wrapper, `src/intake/discovery.mjs:92-94`). Confirmed additive-safe by reading the actual consumer: `buildDiscoveryPrompt` only destructures `metrics.staleBlocked` by name (`discovery.mjs:94`) — a new field is invisible to it. | `fgos-coding-validating` must confirm the new field is added, never renamed/removed from the existing `{ order_version, frame, componentCount, components, criticalPath, staleBlocked, topUnblock }` shape, and that `discovery.test.mjs`/`graph-metrics.test.mjs` both stay green after the change (impact-analysis posture: **full** — GitNexus present, checked fresh this session). |
| Age-anchoring correctness | Medium — mirrors a documented past bug class (`checkCleanupTTLElapsed`'s own header: "never latest event of any kind"). | New tests must assert the age is computed from the *specific* `delivered`/`retrospective`/`cleanup`-entry `work.move` event (`payload.to === '<status>'`), not just the newest event of any type — same shape `checkCleanupTTLElapsed` (`cleanup-harness.mjs:131-138`) and `latestRetrospectiveEntry` (`retro-pool.mjs:19-24`) already use. |
| Threshold arithmetic (delivered/retrospective 3d flat vs cleanup `ttlDays+3d` grace) | Low — three independent, already-locked constants (CONTEXT.md D4/D7). | Boundary tests: exactly-at-threshold stays fresh, one unit past goes stale, for all three statuses. |

Impact-analysis posture: **full** (GitNexus present, `fgos tool query
--capability impact-analysis --status present` checked fresh in
`fgos-coding-exploring`'s pass this session).

## Shape (small mode — direct plan, no phases)

1. Add `classifyStalePostDelivery(view, rawEvents, { thresholds, ttlDays })`
   to `src/state/graph-metrics.mjs`, pure, no `fs`. For each of
   `delivered`/`retrospective`/`cleanup`, find the item's own entry event
   (`work.move`, `payload.to === status`) in `rawEvents`, compute age from
   `now - new Date(entry.ts).getTime()`, compare against the locked
   threshold (`delivered`/`retrospective`: flat 3 days; `cleanup`:
   `ttlDays + 3` days), and collect advisory entries — suggestion text
   only, never a reclaim/transition, same discipline as
   `classifyStaleDoing`.
2. Add the function's name to `metricsFrame`'s `computed` array (near
   line 431) and its result to `graphMetrics()`'s returned object (near
   line 454), as a new field alongside `staleBlocked`/`topUnblock` — never
   touching the existing five fields.
3. Add tests to `test/state/graph-metrics.test.mjs` covering: each status's
   stale/fresh boundary at its own threshold; an item with no locatable
   entry event is skipped (never a NaN age, mirroring `classifyStaleDoing`'s
   own precedent at line 483); purity (same inputs -> same output,
   deterministic on a fixed `now`).

Concrete cases the tests must prove: boundary (exactly-at-threshold is
fresh, one unit over is stale) for all three statuses; missing entry event
(skipped, not NaN); an item currently at `doing`/`todo`/`blocked`/`done`/
`wontfix` never appears in the output (only the three post-delivery
statuses are in scope).

## No split

One honest piece of work — a single new pure function plus its wiring and
tests, two files, no gray areas. Proceeds as itself, no children.

## Proof surface (this item, whole)

```
npm test && grep -n classifyStalePostDelivery src/state/graph-metrics.mjs
```

Full-suite green (matches project DoD, `AGENTS.md` #5) plus a wiring-exists
check; the actual coverage proof is the new test cases themselves, per the
Shape section's concrete-cases list above.

---

# Plan: herdr-launcher auto-launch (tsk-2xt)

## Mode gate

Flags counted against the standard list (auth, authorization, data model,
audit/security, external systems, public contracts, cross-platform,
existing covered behavior, weak proof around the area, multi-domain):

- **multi-domain** — spans 4 independent domains (discover/merge/retro/
  cleanup) plus a new cross-cutting settings surface, and two codebases
  (herdr-plugin Rust, fgOS Node CLI) (1 flag).
- **audit/security (hard-gate)** — auto-merge toggle auto-launches
  `merge-loop`, which performs unattended merges (CONTEXT.md D9). Resolved
  as non-conflicting with D1's human-gate reservation, but the surface
  itself is security-relevant and forces high-risk regardless of total
  flag count (1 flag, hard-gate).
- **public contracts** — a new settings surface (4 toggles) is a new config
  default per `AGENTS.md`'s install/setup/doctor gate: must register into
  `fgos setup`'s config-merge and `fgos doctor`'s check registry
  (`src/setup/checks.mjs`), not stand alone (1 flag).
- **weak proof around the area** — the auto-launch mechanism itself
  (poll-triggered pane spawn, guard-by-title, autoClose) is new,
  unproven surface with no existing test precedent in `herdr-plugin/src`
  (1 flag).
- No auth, no authorization beyond the already-structural CTR005 (D9), no
  cross-platform (OS) concern beyond the existing Rust/Node split this repo
  already has, no removed validation.

**4 flags, one of them hard-gate (audit/security) → mode: high-risk.**

## Approach

**Path chosen:** extend herdr-plugin's existing single poll tick
(`herdr-plugin/src/main.rs:276-286`, `if last_poll.elapsed() >=
poll_interval { app.refresh_from_fgos(...); app.refresh_pane_state(...);
... }`) with one additional call reading a new settings source and, per
enabled domain, launching a guarded pane — no new poll loop, no new
scheduler. Settings live in the existing shared `.fgos/config.json` (a new
`herdrOrchestrator: { autoDiscover, autoMerge, autoRetro, autoCleanup }`
section), mirroring `gate-bypass.mjs`'s own `config.gateBypass.level`
precedent (`src/config/shared-config-file.mjs`) rather than 4 new env
vars — `serde_json` is already a herdr-plugin dependency
(`herdr-plugin/Cargo.toml:17-18`), so reading this section from Rust adds
no new dependency, and env vars (`FGOS_HERDR_SKIP_PERMISSIONS`'s own
shape) fit one global kill-switch, not 4 independently named booleans.
This settles the item's own "settings storage form" open point (its
description named this as the plan/decompose stage's decision to make).

**Rejected alternative:** a dedicated new config file
(`herdr-plugin.toml` or similar) — rejected because it would duplicate the
shared-config-file pattern this repo already has for exactly this shape
of problem (a small named on/off section a Rust and a Node process both
need to agree on), and `herdr-plugin.toml` is already the plugin
*manifest*, not settings (per the item's own description) — reusing it
would blur that boundary.

**Rejected alternative (already settled in CONTEXT.md D6):** extending
`fgos-runner --watch` instead of the herdr-launch route — not
re-litigated here, cited from CONTEXT.md.

### Files likely touched

- `herdr-plugin/src/settings.rs` (new) — read + parse the
  `herdrOrchestrator` section of `.fgos/config.json`.
- `herdr-plugin/src/main.rs` — one new call inside the existing poll tick.
- `herdr-plugin/src/pick.rs` — new argv builders for auto-merge/retro/
  cleanup, mirroring `discover_run_argv`/`run_argv_for_command`
  (`pick.rs:101-107`).
- `herdr-plugin/src/layout.rs` — fixed-tab (`fg:operation`) placement,
  once `tsk-5lr` delivers the tab/geometry primitives this item's own
  launcher calls into.
- `herdr-plugin/src/pane_scan.rs` — extend the guard-check: today's
  label extraction (`extract_task_id`, `pane_scan.rs:68-71`) assumes an
  id-shaped title; the fixed auto-launch titles
  (`"fgos-auto-discover-<id>"`, `"fgos-auto-merge"`, etc.) are not
  id-shaped and need their own match path.
- `src/config/shared-config-file.mjs` — schema entry for
  `herdrOrchestrator`, alongside the existing `gateBypass` entry.
- `src/setup/checks.mjs` — doctor/setup registration (`AGENTS.md`
  install/setup/doctor gate).
- `CHANGELOG.md` — `## [Unreleased]` line (`AGENTS.md`: user-visible
  change).

### Order

1. Settings source + doctor/setup registration first — every launcher
   reads it; no launcher can be meaningfully tested without it.
2. Auto-discover launcher next — targets the existing `fg:agents-N` pool
   (already used today by `pick.rs`'s `open_pick_pane`/
   `open_discover_pane`), needs only `tsk-5lr`'s cap (`MAX_AGENT_TABS =
   2`) to honor the item's own "stop launching when full, no queue" rule.
3. Auto-merge/retro/cleanup launcher last — the three share one
   fixed-tab (`fg:operation`) placement mechanism (left pane = merge-loop,
   right = retro/cleanup alternating, `herdr-operation-tab-layout/
   CONTEXT.md` D1/D2) that does not exist in `layout.rs` yet; this piece
   is the most exposed to `tsk-5lr`'s actual delivered shape.

This ordering is structural (each piece's own reuse target), not a
judgment call between similarly-valid alternatives — `fgos graph --json`
was run this session but `topUnblock` was skipped for this repo's current
size (`componentCount: 289`), so no `--what-if` comparison was available
to lean on; the ordering above did not need it.

### Risk map

| Component | Risk | Proof point |
|---|---|---|
| Settings source (new `.fgos/config.json` section, read from Rust) | Medium — new cross-language contract; must fail closed (missing section/malformed JSON → all 4 toggles OFF), mirroring `gate-bypass.mjs`'s own fail-closed convention. | Tests: absent section defaults every toggle OFF; malformed JSON does not crash herdr-plugin and defaults OFF; `fgos doctor` surfaces the section. |
| Guard-by-title double-launch check | Medium-high — `pane_scan.rs`'s current label extraction (`extract_task_id`) assumes an id-shaped title; the fixed non-id titles this item needs (`"fgos-auto-merge"` etc.) do not match that shape today (found this session, `pane_scan.rs:68-71`). | Unit test: guard-check function correctly detects a live pane by its fixed, non-id-shaped title, not just id-shaped ones. |
| `fg:operation` placement (`tsk-5lr` not yet delivered) | High — external, in-flight dependency; this item's own `layout.rs` change must target `tsk-5lr`'s actual merged shape, not a guess made now. | Blocked structurally by `deps: [tsk-5lr, tsk-3v2]` (frontier `depsReady`) — no proof point needed before merge, per `depsReady`'s own zero-latency-unblock guarantee (CONTEXT.md D3); re-verify the placement call signature against `tsk-5lr`'s actual landed code at `fgos-coding-validating` time for whichever child builds it. |
| autoClose (`tsk-3v2` not yet delivered) | High — same external in-flight dependency shape as above. | Same: `deps` field already blocks; re-verify the actual autoClose hook signature once `tsk-3v2` lands. |
| Auto-merge automation (audit/security hard-gate) | Confirmed non-conflicting with the human-gate policy wall (CONTEXT.md D9) — residual risk is scope creep into `approve`/merge internals. | This item's own footprint must never touch `bin/fgos.mjs`'s `approve`/`merge` cases or `src/state/store.mjs`'s `moveWork` — it only ever shells out to the existing `/fgOS:merge-loop` command, same as a person would; `fgos-coding-validating`/`detect_changes()` should confirm no such file is touched. |
| Poll-tick race (two ticks firing before a guard title registers) | Medium — new unattended-launch surface, no existing precedent to lean on (weak-proof flag). | Guard check and pane spawn must happen synchronously within the same tick, same shape `skip_permissions_enabled()`'s own read-then-act already uses; flag as an explicit `fgos-coding-validating` proof point for whichever child implements the spawn call. |

Impact-analysis posture: **full** (GitNexus present, checked fresh this
session — see CONTEXT.md's Evidence trail).

## Shape (high-risk mode — split into 3 children)

One monolithic implementation would bundle a new cross-language settings
contract, a doctor/setup registration, and two structurally-different pane-
placement mechanisms (pooled `fg:agents-N` vs fixed `fg:operation`) into
one build/verify/merge unit — each piece is independently buildable and
independently verifiable once its own prerequisites land, so this item
splits rather than proceeding as itself.

Concrete cases each child's own tests must prove, at high-risk depth:

- Settings: absent config section → every toggle OFF (safe default);
  malformed JSON → fails closed, no crash; one toggle ON does not
  silently enable the others.
- Discover launcher: pool at `MAX_AGENT_TABS` cap → no launch attempted,
  no queue, next tick retries cleanly; an eligible item already has a
  live guarded pane → skipped, not double-launched; guard title survives
  a `herdr pane list` round trip.
- Merge/retro/cleanup launcher: left/right pane geometry resolved
  correctly by `x`-position (`herdr-operation-tab-layout` D2); an
  already-running guarded pane on either side → skipped; retro/cleanup
  alternation on the right pane follows priority, not a hardcoded order.
- Concurrent access: two poll ticks close together never produce two
  panes for the same guard title (see the poll-tick race risk row above).

## No further split beyond the 3 children below

Each child is one honest piece; none of them further decomposes.

## Outstanding questions

None

---

# Plan: herdr-launcher auto-discover launcher (tsk-2ja)

Mode: **standard**

This is the second of the 3 children this feature's own tsk-2xt plan above
already split into (Shape, "high-risk mode — split into 3 children") —
its own `Files likely touched`/`Order`/top-level risk rows already frame
this piece; this section only adds the concrete Shape a child at its own
`decompose` stage needs, never re-deriving what tsk-2xt's plan already
decided.

## Mode gate

Flags counted against the standard list (auth, authorization, data model,
audit/security, external systems, public contracts, cross-platform,
existing covered behavior, weak proof around the area, multi-domain):

- **external systems** — turns the herdr pane-orchestration boundary from
  person-triggered (the existing Discover button, `main.rs:230-245`) into
  a tick-triggered one that spawns
  `claude --dangerously-skip-permissions '/fgOS:discover <id>'` unattended
  (`pick.rs` D1's own skip-permissions-by-default), no click first (1 flag).
- **existing covered behavior** — `pane_scan.rs`'s `extract_task_id`/
  `parse_pane_list` (tsk-4zo D1, tested) and `pick.rs`'s launch-argv
  pattern (`run_argv_for_command`, tested) both get reused and extended;
  a careless extension risks regressing the dashboard's own existing
  pane-tracking map (1 flag).
- No other flag applies: no auth/authorization, no persistent data-model
  change (this item owns no config schema — that's tsk-2m5's footprint),
  no new public CLI contract (internal poll-tick wiring only), no
  cross-platform concern, single domain (`herdr-plugin`, Rust).

**2 flags → mode: standard**, matching this item's own recorded `tier:
"standard"` from the split above. Narrower flag count than the parent's
`high-risk` because that count was taken over the whole 3-child bundle
(settings + discover + merge/retro/cleanup, including the audit/security
hard-gate that belongs to the merge piece, tsk-57q, not this one).

## Approach

**Path chosen:** extend the existing manual launch machinery (`pick.rs`'s
`open_discover_pane`/`discover_run_argv`) with a new tick-triggered launch
path, guarded by a synthetic pane label set at spawn time by herdr-plugin
itself — never by reusing the dashboard's existing task-id-keyed pane map
(`parse_pane_list`), which must stay exactly as it is today.

**Rejected alternative:** deriving double-launch state from
`parse_pane_list`'s existing `HashMap<String, PaneIdentity>` directly.
Rejected because that map is keyed by the item's own id via the
`<taskid> | ...` labeling convention
(`docs/history/fgos-terminal-pane-rename/CONTEXT.md` D4) set from *inside*
the launched session (`plugins/fgOS/skills/terminal/rename.sh`, run by
`/fgOS:pick`'s own step 3) — not by herdr-plugin at spawn time. Grafting
the auto-discover guard onto that map would either (a) misread
`fgos-auto-discover-<id>` as if it were itself a task id (it passes
`is_valid_id`'s syntax check — hyphenated lowercase segments are legal),
polluting the dashboard's own In-Process tracking, or (b) miss the launch
during the real race window between `pane run` firing and the launched
session getting around to calling `rename.sh` — two ticks could
double-launch inside that window. A herdr-plugin-set label at spawn time
(Shape step 2 below) closes both problems, and is exactly the gap the
parent plan's own "Guard-by-title double-launch check" risk row already
named (`pane_scan.rs`'s current label extraction assumes an id-shaped
title).

**Rejected alternative:** an in-memory (non-pane-list-backed) "already
launched this id" set inside `App`. Rejected because it would not survive
(or detect) a pane opened by a *previous* herdr-plugin process run — a
real double-launch risk on plugin restart the pane-list-backed guard does
not have.

### Risk map (adds to, does not replace, the parent plan's own rows)

| Component | Risk | Proof point |
|---|---|---|
| Readiness selection (which item, if any, is eligible this tick) | Medium — must reuse the exact same `stage == "clarify"` gate the manual Discover button already enforces (`main.rs:232-234`, `discover_button_is_inert_when_item_is_not_at_clarify_stage`, `main.rs:898`), plus `status == "todo"` (never `doing`/`blocked`/`awaiting-human`). | New test asserting the selection function returns only clarify+todo items from a fixture `Vec<WorkItem>`, excluding every other stage/status combination. |
| **Order-vs-`deps` gap.** The parent plan's own Order section (above) already decided settings (tsk-2m5) lands *before* this item — "no launcher can be meaningfully tested without it." But tsk-2ja's own `deps` array (`tsk-5lr`, `tsk-3v2`) does not encode that edge, and tsk-2m5 is still `stage: decompose`, unmerged, when this item was claimed. Both items also declare `main.rs` in their footprint. | **Not provable in code** — the sequencing was already decided in prose but never encoded as a formal dependency. One Outstanding question below, for a person. |
| Double-launch guard / label-write race | Medium, closed by grounded evidence — `herdr pane rename <pane_id> <label>` exists as its own CLI call (confirmed live via `herdr pane`'s usage listing: `herdr pane rename <pane_id> <label>\|--clear`, separate from `pane split`, which carries no `--label` flag). Calling it right after `place_new_agent_pane` returns the new pane id, before `pane run` spawns `claude`, closes the race the manual flow doesn't have to close. | New `pick.rs`-style test asserting the new launch function's argv sequence calls `pane rename <pane_id> fgos-auto-discover-<id>` before `pane run <pane_id> claude ...` — mirrors `launch_agent_run_argv_includes_skip_permissions_by_default`'s existing style. |
| `extract_task_id` extension (`pane_scan.rs`) | Low, once kept **separate** from `parse_pane_list`'s existing map (see Rejected alternative above) — a dedicated detector function, not a change to `extract_task_id` itself. | New `pane_scan.rs` test: a fixture pane list containing a `fgos-auto-discover-tsk-2ja`-labeled pane (a) is detected by the new guard function, and (b) does **not** appear in `parse_pane_list`'s existing task-id map — regression coverage for the dashboard's own current behavior. |
| `MAX_AGENT_TABS=2` cap (tsk-5lr, delivered) | Low — already enforced and tested. `place_new_agent_pane` already returns `Err` when both `fg:agents-N` tabs are full (`layout.rs`, `agent_tabs_at_cap_refuse_a_third_tab`). The new launch path only needs to treat that `Err` as "skip this tick, retry next poll, never queue." | `cargo test auto_discover` asserts the tick handler swallows a cap-refusal `Err` without panicking and without recording any "pending" state. |
| Partial failure: `pane split` succeeds but the follow-up `pane rename` fails | Medium — herdr offers no split+label-atomic call, so a pane can exist orphaned/unlabeled for one tick. | Documented limitation, not fully closable this item: propagate the rename `Err` as the launch function's own overall `Err`, never silently treat it as success. |

Impact-analysis posture: **full** — GitNexus present, checked fresh this
session (`fgos tool query --capability impact-analysis --status present`).
Before editing `main.rs`/`pick.rs`/`pane_scan.rs` at Execute, run
`impact()` on each touched symbol per `AGENTS.md`'s "Always Do" and report
the blast radius before editing.

## Shape (standard — phased)

1. **Readiness selection.** A pure function (`main.rs`, or a small
   private helper near the poll tick) over the already-populated
   `app.work_items` (`Vec<WorkItem>`, sourced from `fetch_triage`,
   `app.rs:575`), returning the first item with `stage == "clarify"` AND
   `status == "todo"`, not already guarded by step 3's double-launch
   check. One launch per tick, never a batch — keeps the cap-refusal and
   double-launch logic trivially correct.

2. **`pick.rs`: `open_auto_discover_pane`.** New function mirroring
   `open_discover_pane`'s shape (`pick.rs:151-164`): call
   `layout::place_new_agent_pane` (propagate its `Err` unchanged on a cap
   refusal); on success, call `herdr pane rename <pane_id>
   fgos-auto-discover-<id>` and propagate that call's `Err` too; only
   then build `discover_run_argv` and spawn `claude` via `pane run`,
   identically to `open_discover_pane`. Reuses `is_valid_id`/
   `discover_run_argv`'s existing id-validation — no new validation path.

3. **`pane_scan.rs`: double-launch detector.** A new function, e.g.
   `has_auto_discover_pane(panes: &[PaneRow], id: &str) -> bool`, checking
   for an exact label match against `format!("fgos-auto-discover-{id}")`
   — kept structurally separate from `parse_pane_list`'s task-id-keyed
   map. One extra `herdr pane list` call per tick to build this — pinned
   as an assumption below, not asked (implementation-only cadence choice).

4. **Toggle check + wiring into the poll tick (`main.rs`).** Blocked on
   the Outstanding question below — calls into tsk-2m5's settings read.
   Once unblocked: inside the existing
   `if last_poll.elapsed() >= poll_interval` block, after the two
   existing refreshes, check the toggle; if on, run step 1's selection;
   if a ready item exists and step 3's guard says no pane is already open
   for it, call step 2's launch function; swallow any `Err` (cap refusal,
   rename failure, spawn failure) — never surface it as `app.pick_status`
   (person-initiated actions only), never retry within the same tick,
   never queue.

5. **Tests** (named to match the item's own recorded verify filter,
   `cargo test auto_discover`):
   - `auto_discover_skips_when_toggle_is_off`
   - `auto_discover_selects_the_first_clarify_todo_item`
   - `auto_discover_skips_items_not_at_clarify_or_not_todo`
   - `auto_discover_launch_sets_label_before_spawning_claude`
   - `auto_discover_skips_when_a_pane_is_already_open_for_the_id`
   - `auto_discover_skips_without_panic_when_agent_tabs_are_at_cap`
   - `auto_discover_pane_label_never_pollutes_the_dashboard_pane_map`
   - `auto_discover_manual_button_flow_is_unaffected` (regression:
     `main.rs:230-245`'s existing behavior stays exactly as-is)

Concrete cases the tests must prove: empty/boundary (no clarify+todo item
ready — no launch attempted); existing behavior not regressed (manual
Discover button and `parse_pane_list`'s task-id map both stay exactly as
today); the cap-full case (no panic, no queue, retried next tick only);
partial failure (rename fails after split succeeds — treated as an
overall launch failure, not a silent success); the double-launch guard
itself (same id ready across two consecutive ticks with a pane already
open — second tick must not launch again).

## Assumptions (not material, not asked)

- One extra `herdr pane list` call per tick for the double-launch guard,
  separate from `refresh_pane_state`'s own existing call, is acceptable —
  poll cadence already tolerates one `pane list` round trip per tick for
  the dashboard's own pane tracking; a second is an implementation-only
  cost, not a behavior change.
- Auto-launched panes are `--no-focus` (matching `pane_split_argv`'s
  existing default) — an unattended launcher must never steal focus from
  whatever the person is looking at.

## No split

One honest, interlocking piece of work across `main.rs`/`pick.rs`/
`pane_scan.rs` — the poll-tick trigger, the launch function, and the
double-launch guard only make sense wired together; splitting them would
just add cross-item coordination overhead for zero real parallelism.
Proceeds as itself, no children.
## Proof surface (this item, whole)

```
cd herdr-plugin && cargo test auto_discover
```

Already the item's own recorded verify (unchanged, not a placeholder) —
matches the naming discipline in Shape step 5 so every new test this item
adds is actually captured by the filter.

## Sequencing decision (tsk-2m5)

Resolved by the human at the planning gate: **hold this item's Execute
stage until tsk-2m5 reaches `delivered`** (option (a) from the gate
question) — matches the parent plan's own already-documented Order
(settings before auto-discover), avoids the temporary `main.rs` footprint
overlap and throwaway stub option (b) would have introduced. Shape step 4
(toggle check + poll-tick wiring) does not start until tsk-2m5 is
`delivered`; steps 1-3 and their tests have no such dependency and may
proceed independently. `tsk-2ja`'s own `deps` array still does not carry
a formal edge to `tsk-2m5` — this section is the record of the decision
until/unless that edge is added mechanically.

**Resolved (merge, tsk-2ja Execute):** tsk-2m5 reached `delivered` and its
branch (`fgw/tsk-2m5`) merged into `fgw/tsk-2xt`; this item's own branch
merged `fgw/tsk-2xt`'s tip in to pick up `settings.rs`
(`OrchestratorSettings`/`read_settings`, wired into `App.
orchestrator_settings` via `main.rs`'s poll tick — see tsk-2m5's own plan
section below for the exact shape) before starting Shape step 4.

## Outstanding questions

None

---

# Plan: settings source for auto-launch toggles + doctor/setup registration (tsk-2m5)

Mode: standard

## Mode gate

- **public contracts** — a new config default (`herdrOrchestrator`) is a new
  install/setup/doctor-gate surface per `AGENTS.md`, must register into
  `fgos setup`'s config-merge and `fgos doctor`'s check registry (1 flag).
- **weak proof around the area** — reading a shared-config section from Rust
  via `serde_json` has no existing precedent inside `herdr-plugin/src`
  today; the parent plan's own risk map flagged this component Medium for
  exactly this reason (1 flag).
- No auth, no authorization, no data-model change (an additive config
  section, same shape `gateBypass`/`cleanup` already use), no audit/security
  surface (this piece never launches a pane or performs a merge — that is
  tsk-2ja's/tsk-57q's own footprint, deliberately excluded here per the
  parent plan's risk-map row "Auto-merge automation… this item's own
  footprint must never touch…"), no external system, no cross-platform
  concern beyond the existing Rust/Node split, single product domain.

**2 flags → mode: standard.** Below `high-risk` (no hard-gate flag applies
to this piece specifically — that flag was consumed by tsk-2xt's
auto-merge launcher, tsk-57q, per the parent plan's own risk-map row), above
`tiny`/`small` (a genuinely new cross-language contract, not a
copy-paste of an existing one).

## Approach

**Path chosen:** mirror `gate-bypass.mjs`'s `config.gateBypass.level`
precedent exactly, on both sides.

Node side — register the new section in `src/setup/registrations.mjs`
(not `src/config/shared-config-file.mjs`, which stays a generic
read/write module with no per-module knowledge; the item's own
pre-declared footprint named the wrong file — `registrations.mjs` is the
one real registration point every existing section, including
`gateBypass`, actually uses):

```js
export const DEFAULT_HERDR_ORCHESTRATOR_SETTINGS = {
  autoDiscover: false,
  autoMerge: false,
  autoRetro: false,
  autoCleanup: false,
};

registerConfigDefault({
  id: 'herdrOrchestrator',
  key: 'herdrOrchestrator',
  shape: DEFAULT_HERDR_ORCHESTRATOR_SETTINGS,
});

registerCheck({
  id: 'herdr-launcher-configured',
  description: 'herdrOrchestrator toggles in the shared config file are present and boolean',
  check: (cwd) => checkHerdrOrchestratorConfigured(cwd),
});
```

`checkConfigNotStale` (already generic over every `registerConfigDefault`
entry, `checks.mjs`) automatically starts reporting a missing
`herdrOrchestrator` key the moment this registration lands — no separate
wiring needed for the "section absent" case. The new
`checkHerdrOrchestratorConfigured` check exists only for the case that
staleness check cannot catch: a *present* but malformed value (e.g.
`autoDiscover: "yes"` instead of a boolean) — same reasoning
`checkGateBypassConfigured` already documents for `gateBypass.level`'s enum
check.

**Found at `fgos-coding-validating`, correcting an omission from the Approach
above:** `test/setup/registrations.test.mjs`'s "Data Dictionary #7 names
exactly the registered doctor checks" test asserts the registered-check-id
list against `docs/specs/distribution.md`'s Data Dictionary row #7 verbatim
(`specEnumeratedIds("Today's registered checks: ")`, `registrations.
test.mjs:42,192-197`) — adding `herdr-launcher-configured` without
updating that row's enumerated list fails this test. `docs/specs/
distribution.md` (row #7's own text: "a module adding one updates this row
in the same change") is added to Files touched and to Shape step 2 below.

**Rejected alternative:** a `fix` registration (mirroring
`fixGateBypassConfigured`) — rejected as scope creep for this piece.
`ensureSharedConfigDefaults` (`fgos setup`'s own write path) already fills
in the whole section with safe-OFF defaults the first time a project adopts
it, and the Rust side fails closed to OFF on any malformed value regardless
(see below) — a malformed-but-present boolean has no real incident this repo
has hit yet (YAGNI). Revisit if `fgos doctor --fix` visibly needs it later.

Rust side — new `herdr-plugin/src/settings.rs`, read once per poll tick
using the `root: Result<PathBuf, _>` `main.rs` already resolves once at
startup (`fgos::repo_root()`, `main.rs:43`) — no second git shell-out:

```rust
use serde::Deserialize;
use std::path::Path;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct OrchestratorSettings {
    pub auto_discover: bool,
    pub auto_merge: bool,
    pub auto_retro: bool,
    pub auto_cleanup: bool,
}

#[derive(Deserialize, Default)]
struct SharedConfig {
    #[serde(default, rename = "herdrOrchestrator")]
    herdr_orchestrator: OrchestratorSettings,
}

/// Fails closed (every toggle off) on a missing `.fgos/config.json`, a
/// missing `herdrOrchestrator` section, or malformed JSON — never panics,
/// never crashes the dashboard on a bad config file.
pub fn read_settings(root: &Path) -> OrchestratorSettings {
    let path = root.join(".fgos").join("config.json");
    let Ok(raw) = std::fs::read_to_string(path) else {
        return OrchestratorSettings::default();
    };
    serde_json::from_str::<SharedConfig>(&raw)
        .map(|c| c.herdr_orchestrator)
        .unwrap_or_default()
}
```

`#[serde(default)]` on every field is what makes a partially-specified
section (e.g. only `autoDiscover` set) leave the other three at `false`
rather than erroring — `Deserialize`'s own missing-field behavior, not
custom code.

**Corrected at `fgos-coding-validating`:** the Approach section above claimed
`serde` (derive) was not yet a `herdr-plugin` dependency — false.
`herdr-plugin/Cargo.toml:17` already carries
`serde = { version = "1.0", features = ["derive"] }`, alongside
`serde_json` on line 18. No `Cargo.toml` edit is needed for this item; the
"add serde derive dependency" file/step below is removed.

`herdr-plugin/src/lib.rs` gains `pub mod settings;` (alongside the 7
existing `pub mod` lines). `main.rs`'s existing poll tick (the
`if last_poll.elapsed() >= poll_interval { … }` block) gains one more call
reading `settings::read_settings` into a new `App` field
(`pub orchestrator_settings: OrchestratorSettings`, defaulting to all-OFF
in `App::empty()`) — mirroring `refresh_from_fgos`/`refresh_pane_state`'s
existing shape (a plain field write, no new port trait: this is a local
file read, not an external process/registry call needing a test seam like
those two). This item stops at storing the read value — acting on any
toggle (launching a pane) is tsk-2ja's/tsk-57q's own footprint, per the
parent plan's ordering ("every launcher reads it; no launcher can be
meaningfully tested without it").

**Rejected alternative:** giving `settings::read_settings` its own
`WorkItemSource`-style port/trait for testability — rejected: unlike
`fetch_triage`/`fetch_doing` (which shell out to `node bin/fgos.mjs`, slow
and needing a fake for tests), this is a synchronous local file read
already trivially fake-able in a unit test via a temp directory — no
external process to seam around.

### Files touched

- `herdr-plugin/src/settings.rs` (new)
- `herdr-plugin/src/lib.rs` (`pub mod settings;`)
- `herdr-plugin/src/main.rs` (one call in the poll tick; one new `App` field
  read)
- `herdr-plugin/src/app.rs` (`orchestrator_settings` field + default)
- `src/setup/registrations.mjs` (registration — corrects the item's own
  pre-declared footprint guess of `src/config/shared-config-file.mjs`,
  see Approach above)
- `docs/specs/distribution.md` (Data Dictionary row #7's enumerated
  check-id list — found at `fgos-coding-validating`, see above)
- `CHANGELOG.md` (`## [Unreleased]` line)

### Risk map

| Component | Risk | Proof point |
|---|---|---|
| Rust settings read (new cross-language contract) | Medium (parent plan's own risk-map row) — must fail closed on missing file/section/malformed JSON. | `cargo test settings_`: absent `.fgos/config.json` → all-OFF; file present, section absent → all-OFF; malformed JSON → all-OFF, no panic; one toggle `true`, rest omitted → only that one `true`. |
| Node config registration | Low — additive `registerConfigDefault`/`registerCheck` calls, same shape `gateBypass`/`cleanup` already use; GitNexus `impact(registerConfigDefault, upstream)` returned **LOW** (2 impacted symbols, checked fresh this session — impact-analysis posture: full). | `npm test`: `checkConfigNotStale` reports a missing `herdrOrchestrator` key before this lands and stops after; `checkHerdrOrchestratorConfigured` fails on a non-boolean value, passes once all 4 keys are booleans. |
| Scope boundary (must not touch merge/pane-launch code) | Low — this piece stores a value, nothing reads it to act yet. | `detect_changes()`/`git diff --name-only` at `fgos-coding-validating`/return time confirms no file outside the list above is touched. |

Impact-analysis posture: **full** (GitNexus present, `fgos tool query
--capability impact-analysis --status present` checked fresh this session).

## Shape (standard mode — two-part plan, one item)

1. **Rust side.** `serde` derive is already a dependency (`Cargo.toml:17`,
   confirmed at `fgos-coding-validating`) — no `Cargo.toml` edit. Write
   `settings.rs` (`OrchestratorSettings`, `read_settings`) per the Approach
   section above. Wire `pub mod settings;` into `lib.rs`. Add
   `orchestrator_settings: OrchestratorSettings` to `App` (default all-OFF
   in `App::empty()`). Add one call inside `main.rs`'s existing poll tick,
   guarded the same way `source`/`registry` already are (`if let Ok(root)
   = &root { app.orchestrator_settings = settings::read_settings(root); }`).
   Tests in `settings.rs` itself, named so `cargo test settings_` selects
   them: absent file, absent section, malformed JSON, partial section —
   see Risk map's first row for the concrete cases.
2. **Node side.** Add `DEFAULT_HERDR_ORCHESTRATOR_SETTINGS` +
   `registerConfigDefault` + `checkHerdrOrchestratorConfigured` +
   `registerCheck` to `src/setup/registrations.mjs`, next to the
   `gateBypass` block they mirror. Add `herdr-launcher-configured` to
   `docs/specs/distribution.md`'s Data Dictionary row #7 enumerated list
   (found at `fgos-coding-validating` — `registrations.test.mjs`'s "Data
   Dictionary #7" test asserts this list verbatim against the spec, will
   fail otherwise). Tests in `test/setup/registrations.test.mjs` (existing
   file; `plugin-skill-cli-reachable`'s tests at lines 216-242 are the
   real per-check precedent to follow): missing key flagged stale by
   `checkConfigNotStale`; present-and-boolean passes
   `checkHerdrOrchestratorConfigured`; present-and-non-boolean fails it
   with a message naming the bad key.
3. **Changelog.** One `## [Unreleased]` bullet naming the new
   `herdrOrchestrator` settings surface (`AGENTS.md`'s install/setup/doctor
   gate: "does this change something a user of fgOS would see?" — yes, a
   new `fgos doctor`-visible config section).

Concrete cases both sides' tests must prove: absent config → safe default
(all-OFF); malformed value → fails closed, never crashes/throws past the
read boundary; one toggle set does not silently flip the others; doctor
surfaces both "missing" and "present-but-malformed" as distinct, named
failures.

## No split

One honest piece — already the smallest unit the parent plan's own split
produced ("each child is one honest piece; none of them further
decomposes"). Proceeds as itself.
## Proof surface (this item, whole)

```
cd herdr-plugin && cargo test settings_ && cd .. && npm test
```

Matches the item's own already-recorded `verify` field exactly (`fgos list
--id tsk-2m5`) — the Rust-side `settings_`-prefixed tests plus the
existing Node full suite (which now also covers `registrations.test.mjs`'s
new cases).

## Outstanding questions

None
---

# Plan: herdr-launcher auto-merge/retro/cleanup launcher (tsk-57q)

## Mode gate

Flags counted against the standard list:

- **audit/security (hard-gate)** — the auto-merge toggle auto-launches
  `/fgOS:merge-loop`, an unattended-merge trigger (CONTEXT.md D9). Forces
  high-risk regardless of total flag count (1 flag, hard-gate).
- **weak proof around the area** — fixed-tab guard-by-title for a
  non-id-shaped label has no test precedent: confirmed by reading
  `herdr-plugin/src/pane_scan.rs:68` (`extract_task_id`) directly on this
  branch — it still only accepts a leading segment that passes
  `is_valid_id`, silently dropping anything else, exactly the gap
  tsk-2xt's own plan section above flagged (1 flag).
- **multi-domain** — spans 3 automation domains (merge/retro/cleanup)
  across 2 codebases (herdr-plugin Rust, shells out to fgOS's Node-CLI
  slash commands) (1 flag).
- No auth, no data-model change, no external system, no new public CLI
  contract of its own (the settings *surface* is tsk-2m5's, this item only
  *reads* it), no cross-platform concern beyond the existing split.

**3 flags, one hard-gate (audit/security) → mode: high-risk** — matches
the parent's own lane for this whole feature; nothing about narrowing to
this one child lowers it, since the hard-gate flag is this child's alone
(it is the one that actually launches merge-loop).

## Approach

**Grounding note:** `tsk-5lr` and `tsk-3v2` were confirmed `delivered` in
state but their code was verifiably absent from this worktree at the time
`fgos-coding-planning` was first invoked for this item (neither feature commit
was an ancestor of `fgw/tsk-57q`'s original fork point, and `tsk-3v2`'s
own merge into `main` had silently failed — an orphaned, uncommitted merge
attempt). Both gaps were closed before writing this section: `tsk-3v2`'s
merge was completed for real (`main` now at `0b9a52d`), and `fgw/tsk-57q`
was merged forward onto current `main` to pull both in. Every file
citation below was re-verified by reading the actual code on this branch
after that merge — not assumed from the item's own (now-partially-stale
line-number) description.

**Path chosen:** extend the existing poll tick in `herdr-plugin/src/
main.rs`'s `run()` (the `if last_poll.elapsed() >= poll_interval` block,
currently at `main.rs:301-308` — shifted from the description's original
`276-286` cite by `tsk-5lr`'s own 27-line addition to this file) with one
more call: read `herdrOrchestrator.autoMerge`/`autoRetro`/`autoCleanup`
from `.fgos/config.json`, and for each enabled toggle, guard-check then
launch into the already-resolved fixed `fg:operation` panes.

Three concrete technical facts, found by reading the real delivered code,
that were not resolvable from the item's own description alone:

1. **Pane placement needs no new geometry logic.** `layout::
   ensure_operation_tab` (`layout.rs:446-473`, tsk-5lr) already resolves
   and returns `(left_pane_id, right_pane_id)` once, eagerly, at
   herdr-plugin startup, stored on `App.operation_left_pane_id`/
   `operation_right_pane_id` (`main.rs:63-65`). This item only ever reads
   those two fields — it never calls `layout::place_new_agent_pane` (the
   `fg:agents-N` pool logic `open_pick_pane`/`open_discover_pane` use),
   since the fixed tab's placement is a one-time startup concern, not a
   per-launch one.
2. **The existing argv-builder pattern does not fit as-is.** `pick.rs`'s
   `run_argv_for_command` (`pick.rs:78-99`) always validates and
   interpolates an `id: &str` (`/fgOS:pick <id>`, `/fgOS:discover <id>`) —
   but `/fgOS:merge-loop`/`/fgOS:retro-loop`/`/fgOS:cleanup-loop` are
   pool-sweep verbs that take no id argument at all. This item adds its
   own argv builder(s) for these three fixed commands, passing `pane_id`
   directly (mirroring the *shape* of `run_argv`/`discover_run_argv` as
   thin wrappers, tsk-1e3 D4's own precedent) but never routing through
   `is_valid_id`/`InvalidId` for a nonexistent id argument.
3. **The guard needs a second label-matching path.** `pane_scan.rs`'s
   `extract_task_id` (confirmed above) only recognizes `is_valid_id`-shaped
   leading label segments. This item adds a sibling check recognizing
   exactly the three fixed, literal titles it owns
   (`fgos-auto-merge`/`fgos-auto-retro`/`fgos-auto-cleanup`) — additive
   only, `extract_task_id`'s own existing id-shaped path is untouched.

**Settings-read shape (resolves the tsk-2m5 ordering question the parent
plan raised, without a hard `deps` addition):** `tsk-2m5` (settings
source) is still at `stage: decompose`/`status: doing` — no
`herdrOrchestrator` section exists in `.fgos/config.json`'s schema on this
branch yet. Per tsk-2m5's own already-locked settings-source risk row
above ("missing section/malformed JSON → all 4 toggles OFF, fail-closed"),
this item reads `herdrOrchestrator.autoMerge`/`autoRetro`/`autoCleanup`
directly via `serde_json` with that exact same fail-closed default —
absent section, absent field, or malformed JSON all resolve to `false`,
never a launch. This makes this item independently buildable and
testable now: it activates for real the moment `tsk-2m5` lands its actual
write-side, with no further change needed here. This is a labeled
assumption (not a material product decision — it changes no scope or
acceptance criteria of this item), pinned rather than asked, per
`fgos-coding-exploring`'s material/grounded/answerable filter.

**Rejected alternative:** routing merge/retro/cleanup launches through
`layout::place_new_agent_pane`/the `fg:agents-N` pool — rejected because
the item's own description and `CONTEXT.md` D2/D5 both pin these three to
the fixed, singular `fg:operation` tab, not the pooled multi-tab surface;
reusing the pool function would silently violate that pinned placement.

### Files touched

- `herdr-plugin/src/pick.rs` — three new slash-command constants
  (`MERGE_LOOP_SLASH_COMMAND` etc.) and a no-id argv builder, plus new
  `PaneOrchestrator` trait methods (`ports.rs`) implemented on
  `HerdrPaneAdapter`.
- `herdr-plugin/src/pane_scan.rs` — additive fixed-title guard check
  alongside `extract_task_id`.
- `herdr-plugin/src/main.rs` — one new call inside the existing poll tick;
  reads settings fail-closed, guard-checks, launches.
- `herdr-plugin/src/layout.rs` — none expected; `ensure_operation_tab`
  already delivers what this item needs (see grounding note above). Kept
  in the item's own `footprint` regardless, in case the poll-tick wiring
  surfaces a real gap once written.

### Risk map

| Component | Risk | Proof point |
|---|---|---|
| Settings read (fail-closed) | Low-medium — new cross-language read, but the fail-closed contract is already locked (tsk-2m5's own risk row above). | Tests: absent section, malformed JSON, and one-toggle-only-enables-that-toggle all resolve to no-launch / correctly scoped launch. |
| No-id argv builder | Medium — every existing `pick.rs` precedent assumes an id; this is the first that does not. | Unit test asserting the built argv never interpolates or validates an id. |
| Fixed-title guard | Medium-high — same gap the parent plan already flagged, reconfirmed still present in current `pane_scan.rs`. | Unit test: the new check recognizes exactly the three fixed titles, still rejects arbitrary non-id strings the existing path already rejects. |
| Left/right pane role reuse | Low — `ensure_operation_tab`/`left_right_panes` already delivered and unit-tested by `tsk-5lr`. | No new geometry test needed here; this item only asserts it reads `App.operation_left_pane_id`/`operation_right_pane_id` correctly. |
| Poll-tick race | Medium — new unattended-launch surface, no existing precedent (weak-proof flag). | Guard check and launch happen synchronously within one tick, mirroring `skip_permissions_enabled`'s own read-then-act shape. |
| Audit/security (merge-loop launch) | Confirmed non-conflicting with the human-gate policy wall (CONTEXT.md D9); residual risk is scope creep into `approve`/merge internals. | `detect_changes()` at `fgos-coding-validating`/before commit must confirm `bin/fgos.mjs`'s `approve`/`merge` cases and `store.mjs`'s `moveWork` are untouched — this item's footprint stays scoped to the 4 `herdr-plugin/src/*.rs` files above. |

Impact-analysis posture: **degraded** — GitNexus reports `present`
(`fgos tool query --capability impact-analysis --status present`), but its
index is stale (last indexed `4ce7a96`, current branch far ahead). Per
`AGENTS.md`'s capability gate this counts as degraded, not full; not
leaned on for this item's proof points regardless, since every claim
above was grounded by reading `pick.rs`/`layout.rs`/`pane_scan.rs`/
`main.rs` directly on this branch rather than via GitNexus query.

`fgos graph --json` was run this session: `componentCount: 292`,
`topUnblock` skipped for repo size (same finding the parent plan already
recorded at 289) — no `--what-if` split comparison needed, since the
parent already fixed this item as one of exactly 3 children with no
further split (below).

## Shape (high-risk mode)

Concrete cases the tests must prove:

- Toggle off (default, or section/field missing/malformed) → no launch,
  ever, for any of the three loops.
- Toggle on, no existing guarded pane for that title → launches into the
  correct fixed pane (left = merge-loop, right = retro/cleanup).
- Toggle on, a guarded pane with that exact fixed title is already live →
  skipped, never double-launched.
- Retro/cleanup alternation on the right pane follows priority, never a
  hardcoded fixed order.
- Two poll ticks firing close together never produce two panes for the
  same fixed guard title.
- Malformed `.fgos/config.json` → fails closed, no crash, no launch (same
  proof shape as the settings-read row above).

Test names must contain the literal substring `auto_operation_tab` (e.g.
`auto_operation_tab_skips_when_guard_pane_already_live`) — the item's own
recorded `verify` (`cd herdr-plugin && cargo test auto_operation_tab`)
filters by substring match on the full test path, so a test named outside
this convention would silently not run under that verify command.

## No split

One honest piece of work — per the parent's own "No further split beyond
the 3 children below" decision above. Proceeds as itself, no further
children.

## Proof surface (this item, whole)

```
cd herdr-plugin && cargo test auto_operation_tab
```

Matches the item's own recorded `verify` field exactly.

## Outstanding questions

None
