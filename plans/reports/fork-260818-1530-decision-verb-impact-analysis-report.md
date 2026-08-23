# addDecision / bin/fgos.mjs impact analysis

Task: check blast radius before adding an optional `--kind` CLI flag to
`bin/fgos.mjs`'s `case 'decision':`, pass-through to `addDecision`, no
behavior change when omitted.

1. `addDecision` (src/state/store.mjs) upstream impact: **risk HIGH**,
   4 direct callers / 8 total impacted symbols across 3 modules. Direct
   callers: `resolveDiscovery` (src/intake/discovery.mjs),
   `claimWork` (src/runner/claim-port.mjs), `resolvePlan`
   (src/intake/plan.mjs), and `runWatch` (src/runner/loop.mjs, reached at
   depth 2-3). All of these already call `addDecision` with their own
   explicit `kind` (mostly `'engine'`) or omit it entirely — none pass
   through a caller-supplied `--kind` flag, so this specific change (CLI
   flag plumbing, no signature change to `addDecision` itself, default
   stays `'design'` when the flag is absent) does not touch any of these
   call sites' behavior. The HIGH risk rating reflects `addDecision`'s
   general fan-out/hub status, not this specific additive edit.

2. `bin/fgos.mjs` is **not indexed as a symbol at all** — target lookup
   returned "not found", impactedCount 0. This matches the known
   documented gap (tsk-38h, CLAUDE.md's impact-analysis capability gate):
   a large/complex file can carry zero indexed symbols even on a fresh,
   non-stale index. Not a blocker per that gate's own guidance — just
   means no GitNexus signal is available for the CLI-layer edit itself,
   rely on the existing test suite instead.

3. No HIGH/CRITICAL finding specific to the planned edit — the HIGH tag
   on `addDecision` is pre-existing hub risk, unrelated to adding an
   unread-by-default flag.
