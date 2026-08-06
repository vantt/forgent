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
