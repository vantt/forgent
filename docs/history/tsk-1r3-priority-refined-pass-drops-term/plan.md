# Plan: close the computeImpact parameter parity gap

Item: `tsk-1r3`. Mode: **tiny** — one call site, one parameter added, no
split. Direct-entry fallback applied (no lane handed off this session);
0-1 real flags (only "existing covered behavior" — decompose.test.mjs
already exercises this call site).

## Approach

Per D1/D2 (`CONTEXT.md`): add `semanticRelatedness` to `decompose.mjs`'s
`computeImpact` call. `decompose`'s own `verdict` object (from
`resolveCallerDecomposeVerdict`) has no `impactScore`-shaped field at
all — reading a nonexistent one just to mirror `discovery.mjs`'s
`verdict.impactScore ?? 0` pattern would be cargo-culting a data path
that was never real over here either. Pass the honest, explicit value
instead: `semanticRelatedness: 0`, with a comment stating plainly that
this mirrors `discovery.mjs`'s own real-world value (never populated by
the live callerVerdict path, per `RESEARCH.md`) rather than a live
computation. This closes the structural asymmetry `RESEARCH.md` found
(same parameter set at both call sites, both textually explicit about
what they compute from) — a documentation/consistency fix, not a
behavior change (both call sites already produce `semanticRelatedness =
0` today; this makes that fact visible instead of implicit at one site
and absent at the other) — without overclaiming it fixes the
`blocks`-driven regression (D2, out of scope).

File touched: `src/intake/plan.mjs` (one call site, ~line 611).

Impact-analysis posture: **degraded** (GitNexus present, stale) — low
actual risk: additive parameter on a pure function, one call site, already
covered by an existing test file.

## Cases

- **Boundary**: `verdict.impactScore` absent (today's only real case) —
  behavior unchanged (0, same as before this item).
- **Existing behavior unchanged**: every other `computeImpact`/
  `computePriority` input stays exactly as before.
- **Regression guard**: existing `decompose.test.mjs` priority-write tests
  must still pass unchanged.

## Outstanding questions

None
