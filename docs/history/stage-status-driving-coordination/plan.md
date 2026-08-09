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
| `graphMetrics()` return-shape change | GitNexus `impact(graphMetrics, upstream)` returned **HIGH** (4 impacted symbols; feeds `judgeDiscovery`/`buildDiscoveryPrompt` via `store.mjs`'s `graphMetrics` wrapper, `src/intake/discovery.mjs:92-94`). Confirmed additive-safe by reading the actual consumer: `buildDiscoveryPrompt` only destructures `metrics.staleBlocked` by name (`discovery.mjs:94`) — a new field is invisible to it. | `fgos-validating` must confirm the new field is added, never renamed/removed from the existing `{ order_version, frame, componentCount, components, criticalPath, staleBlocked, topUnblock }` shape, and that `discovery.test.mjs`/`graph-metrics.test.mjs` both stay green after the change (impact-analysis posture: **full** — GitNexus present, checked fresh this session). |
| Age-anchoring correctness | Medium — mirrors a documented past bug class (`checkCleanupTTLElapsed`'s own header: "never latest event of any kind"). | New tests must assert the age is computed from the *specific* `delivered`/`retrospective`/`cleanup`-entry `work.move` event (`payload.to === '<status>'`), not just the newest event of any type — same shape `checkCleanupTTLElapsed` (`cleanup-harness.mjs:131-138`) and `latestRetrospectiveEntry` (`retro-pool.mjs:19-24`) already use. |
| Threshold arithmetic (delivered/retrospective 3d flat vs cleanup `ttlDays+3d` grace) | Low — three independent, already-locked constants (CONTEXT.md D4/D7). | Boundary tests: exactly-at-threshold stays fresh, one unit past goes stale, for all three statuses. |

Impact-analysis posture: **full** (GitNexus present, `fgos tool query
--capability impact-analysis --status present` checked fresh in
`fgos-exploring`'s pass this session).

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

# Plan: herdr-orchestrator auto-launch (tsk-2xt)

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
| `fg:operation` placement (`tsk-5lr` not yet delivered) | High — external, in-flight dependency; this item's own `layout.rs` change must target `tsk-5lr`'s actual merged shape, not a guess made now. | Blocked structurally by `deps: [tsk-5lr, tsk-3v2]` (frontier `depsReady`) — no proof point needed before merge, per `depsReady`'s own zero-latency-unblock guarantee (CONTEXT.md D3); re-verify the placement call signature against `tsk-5lr`'s actual landed code at `fgos-validating` time for whichever child builds it. |
| autoClose (`tsk-3v2` not yet delivered) | High — same external in-flight dependency shape as above. | Same: `deps` field already blocks; re-verify the actual autoClose hook signature once `tsk-3v2` lands. |
| Auto-merge automation (audit/security hard-gate) | Confirmed non-conflicting with the human-gate policy wall (CONTEXT.md D9) — residual risk is scope creep into `approve`/merge internals. | This item's own footprint must never touch `bin/fgos.mjs`'s `approve`/`merge` cases or `src/state/store.mjs`'s `moveWork` — it only ever shells out to the existing `/fgOS:merge-loop` command, same as a person would; `fgos-validating`/`detect_changes()` should confirm no such file is touched. |
| Poll-tick race (two ticks firing before a guard title registers) | Medium — new unattended-launch surface, no existing precedent to lean on (weak-proof flag). | Guard check and pane spawn must happen synchronously within the same tick, same shape `skip_permissions_enabled()`'s own read-then-act already uses; flag as an explicit `fgos-validating` proof point for whichever child implements the spawn call. |

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
