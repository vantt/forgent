# Plan: port count-consumption + close __proto__ gap in both checkers

Mode: **standard** (2 flags per fgos-routing's Mode gate — "existing
covered behavior" (both scripts already have real test suites that must
keep passing) and "audit/security" (a prototype-pollution-adjacent
hardening gap, even though this plan's own risk map concludes it is not
realistically exploitable today — the category itself still applies).
No auth/data-loss/external-provider/cross-platform/multi-domain flag
applies, so this stays below `high-risk`). No `CONTEXT.md` — discovery's
own verdict was `clear`; every claim below traces to `RESEARCH.md`'s
Round 1 (same dir).

## Approach

**Bug 1 (count-consumption port):**
`check-decision-codes.mjs`'s `findNewFindings`/`baselineFromFindings`
(`:43-57`) still key on bare `f.text` via `.includes()` membership.
Confirmed dormant (0 live duplicates in its real baseline today) but
architecturally identical to the bug tsk-6at fixed in
`check-decision-citation-drift.mjs`. Port the same count-consumption
pattern, keyed on `f.text` alone (simpler than citation-drift's own
`kind:id:text` compound key — this script's findings have no `kind`/`id`
split, `text` alone already fully determines identity per RESEARCH.md).

**Bug 2 (Object.create(null) hardening), broader than originally
scoped:** RESEARCH.md found a real read-side manifestation beyond the
originally-named write-side one — `findNewFindings`'s own bare-`{}`
lookup returns `Object.prototype` (not `undefined`) for a `"__proto__"`
file key, throwing on `.includes()`. Five spots across both scripts need
the same one-line fix (`{}` → `Object.create(null)`): both scripts'
`baselineFromFindings` and `loadBaseline`'s empty-fallback, plus
`check-decision-citation-drift.mjs`'s own `findNewFindings` (`remaining
= {}`, tsk-6at's own code — same gap class, simply out of that item's
scope). Confirmed minimal and behavior-preserving: `Object.create(null)`
round-trips through `JSON.stringify`/`JSON.parse` identically to a plain
object for every legitimate filename, verified directly.

**Rejected alternative (Bug 2):** switch to `Map` instead of a
null-prototype plain object. Rejected — a real format/API change (every
`baseline[file]`/`Object.keys(baseline)` call site would need rewriting,
and `Map` doesn't serialize through `JSON.stringify` without a custom
replacer) for the same protection `Object.create(null)` already gives
with a one-token diff per spot.

**Files touched:**
- `scripts/check-decision-codes.mjs` — `findNewFindings`,
  `baselineFromFindings`, `loadBaseline`.
- `scripts/check-decision-citation-drift.mjs` — `findNewFindings`
  (`remaining`), `baselineFromFindings`, `loadBaseline`.
- `test/scripts/check-decision-codes.test.mjs` — new regression tests
  for both bugs.
- `test/scripts/check-decision-citation-drift.test.mjs` — new regression
  test for bug 2 only (bug 1 already fixed/tested there by tsk-6at).

**Order:** bug 1 (count-consumption port) first, independent of bug 2;
then bug 2 (the 5 `Object.create(null)` spots) across both files; each
piece gets its own regression test before moving to the next, so a
failure isolates cleanly to one change.

**Impact-analysis posture:** `degraded`. `impact({target:'findNewFindings',
direction:'upstream', file_path:'scripts/check-decision-codes.mjs'})`
returned `impactedCount: 0` with `epistemic: 'exact'` — the same
suspicious-zero pattern seen on every stale-index item this session.
Cross-checked directly: `grep -rn "findNewFindings\|baselineFromFindings"
test/ scripts/` confirms exactly the same 2-caller shape (own `runCli` +
own test file) already established in RESEARCH.md.

## Risk map

| Component | How risky | What proves it |
|---|---|---|
| Bug 1 count-consumption port | Low — same proven pattern already merged once in the sibling script | New regression test mirroring tsk-6at's own exact repro shape |
| Bug 2 `Object.create(null)` (5 spots, 2 files) | Low — one-token change per spot, JSON round-trip verified identical | Direct repro test: a `"__proto__"`-named finding no longer throws, in both scripts |
| Realistic exploitability of bug 2 | Very low — file paths only ever come from real local directory traversal of trusted repo content, never external/adversarial input (same conclusion RESEARCH.md reached in tsk-6at's own round 2) | Named explicitly, not overstated as a live security incident — this is defensive hardening, not an active exploit being closed |

## Shape

One honest piece of work, no split (pass-through). Concrete cases to
prove against:

- **Bug 1 regression:** 2 baselined identical-text findings + a genuine
  3rd occurrence → `findNewFindings` reports 1 new, not 0 (mirrors
  tsk-6at's own test exactly, ported to this script's simpler key shape).
- **Bug 2 regression, both scripts:** a finding with `file: "__proto__"`
  passed to `baselineFromFindings` then `findNewFindings` — no throw,
  correct membership/count behavior, in both
  `check-decision-codes.mjs` and `check-decision-citation-drift.mjs`.
- **Existing behavior preserved:** every existing test in both scripts'
  own test files keeps passing unmodified.

## Verify

`node --test test/scripts/check-decision-codes.test.mjs
test/scripts/check-decision-citation-drift.test.mjs` — already the
item's own real `verify` field (synced at discovery). Exercises exactly
both files this plan touches.

## Outstanding questions

None.
