# Seat trim: duplicate proofs

Status: items 1-4 done and run, rebased on 96a673725.

## Retired tests -> owner

Golden file: `packages/seat-binding/contracts/seat-binding.golden.v1.json`, run by `packages/seat-binding/rust/tests/golden.rs`.

| Retired test | Lines | Owner |
|---|---|---|
| bind.test: the walk visits the prefer pool in order, never revisits, refuses when none left | 22 | golden "the walk visits the rest of the failed family's cell entries before the next family", "after a failure the walk follows tierFallback ... never revisits", "when every candidate has been tried the walk ends in a named refusal" (wiring kept: "a walk step falls back to the subsequent candidate on quota/provider-limit") |
| bind.test: a capability rigor never selects a tier either | 15 | golden "effective rigor never changes effort or tier" + "variant A: a seat without a recommendation runs the capability default" (wiring kept: "a unit rigor never selects a tier: a low rigor binds the default tier") |
| bind.test: a unit rigor never lifts a seat to a tier (critical) | 5 | golden "effective rigor never changes effort or tier" (effectiveRigor critical) |
| bind.test: a capability maxTier above the global one lets that capability keep its tier | 11 | golden "a capability maxTier above the global value lets the tier pass" |
| bind.test: a tier override above the resolved tier is refused | 8 | golden "an override above the resolved tier is refused" |
| bind.test: a tier override at or below the resolved tier is taken | 6 | golden "an override at or below the resolved tier is accepted and named override" |
| bind.test: bind skills: only executors declaring every required skill bind, in pool order | 9 | golden "a required skill the executor does not declare skips it" |
| bind.test: a hard pin to an invocation the executor does not have refuses | 5 | golden "a pinned invocation the executor lacks is refused and never swapped for another" |
| bind.test: a cell without an effort records the invocation default | 5 | golden "a cell with no effort runs on the invocation default and says so" (wiring kept: "a cell effort is carried into the binding...") |
| bind.test: override effort below the cell (shrunk to its first half) | -6 | second half owned by golden "an override effort below the cell is refused"; first half (override taken when the cell promises none) has no golden case, so it stays as a 3-line test |
| tier-fallback.test: the primary follows prefer order; walk follows tier order narrowed to prefer | 11 | golden "after a failure the walk follows tierFallback within the seat's own list", "a list narrows the walk and the tier list cannot widen it" |
| tier-fallback.test: with no tier list the walk is the prefer order | 6 | golden "with no tier list the walk is the prefer order after the failed candidate" |
| tier-fallback.test: the walk never leaves the tier it started at | 9 | golden "the walk never leaves the tier it started at"; committed-config test in the same file still proves each family keeps its tier cell |
| tier-fallback.test: a fault excludes one pool and keeps the other | 11 | golden "a fault excludes one pool and keeps the other pool of the same family"; `pool-excluded` refusal owned by account-rotation.test.mjs:95-99 |
| dry-bind.test: panel pool with two executors of one family spreads panelists | 10 | bind.test "a family the same provider reaches through another executor counts as used" + golden spread cases; loop wiring kept by "six panel seats over three families" |
| dry-bind.test: enough families, every seat distinct | 7 | row test "a panel with a fourth family for the synthesizer passes" (no sharing message) |
| dry-bind.test: a reviewed unit with a second family passes | 4 | golden "critique reviewer is hard independent of the producer family" |
| dry-bind.test: debate with a third family passes | 5 | golden "debate judge is hard independent of both sides" |
| dry-bind.test: two families of three seat sides apart, judge on third | 11 | golden "debate sides default to standard and spread softly", "debate judge is hard independent"; loop wiring kept by "six panel seats..." |

Totals (git diff --stat): bind.test -95 +3, tier-fallback -41, dry-bind -42; 3 insertions, 186 deletions.

## Kept although the review listed them

The review's counts do not match the golden file, so these stay (no golden owner or a Node-side fact):
- spread (bind.test, 7 tests): golden has only "alternative spreads away" and "constraint spreads to the third family". "Seats outnumbering the families share the least used family", governance-filtered families, spread + hard independence, spread + acceptDependence, and spread through a walk have no golden case and no crate test (`rg "least used"` finds nothing in the crate). Kept. First test also asserts the Node `provenance.familySpread` shape.
- maxTier "without runner.maxTier there is no ceiling" and "a capability maxTier below the global cap": no golden case (base always has maxTier flagship; golden has no capability maxTier below global). Kept. "tier above the global maxTier is lowered" kept as the one wiring proof of the Node provenance shape (`loweredFrom`, `maxTier`).
- skills "refuses with skills-unavailable naming the missing skills", "no supports.skills declares none", "live lead never takes over", checker/panel not chosen on skills: no golden `skills-unavailable` case, or Node ask/launch-view facts.
- effort "an effort the executor does not declare, or its CLI cannot render": the `supports.reasoningEffort` launch-view derivation is Node; the cell-promised-effort-on-unrenderable-CLI half has no golden case.
- Kept as instructed: herdr transport, inline lead, overrides-list wiring, persona chain, timeout, account view, "a walk step falls back ... provider-limit".
- tier-fallback: "two entries of one cell" (asserts Node `fallbackFrom.walk` entry/family provenance), "a pool no account can serve", missing cell refusals, committed-config walk, walk-state replay: Node facts or no golden twin.
- dry-bind: row semantics, malformed files, max-tier-cap info, refused = fail, six-panel loop wiring.

Target was about -520 over the three files; what has an owner is about -225.

## Item 4: work-seat-config helper

`poolOf` now adds the `tierFallback` pool only to a config with no `executor` (nothing to pin, and no `prefer` for the capability). A config with a default executor gets none: plan.mjs pins the named, else the default executor, so the crate needs no pool. A first attempt that dropped the pool everywhere broke 18 tests in 7 files, all `headless-no-executor` for capability "" in fixtures with no executor, so the pool stays for those and nothing else. The helper cannot be deleted: 16 files import it, including dispatch-plan-policy.test.mjs, which is off limits. Net +17/-7 lines: it did not shrink, the rule became narrower. `TIERS` literal untouched; the shared tier source is the crate lead's.

## Verification

Own `CARGO_TARGET_DIR` in the worktree, session ids unset, suite env from `buildTestEnv`.
- bind, tier-fallback, seat-binding-dry-bind: 92/92 pass.
- the 16 work-seat-config importers: 733/733 pass (before the helper change too).
- Full `scripts/run-tests.mjs`: only reds were load/timeouts and the known umask group; re-run solo and green: run.test, loop.test, run-provider-failover, seat-binding client.test (223/223), crash-matrix-adopt-resume + worktree (99/99), event-store-checks + session + spawn-worker (50/50). Remaining reds are fgctl download/upgrade/init (umask) and dev-host concurrent consumers, both known and not seat related.

## Open questions

- Interpretation: "do not touch override tests" read as the executor/invocation/persona override tests; the two tier-override tests were retired because golden owns both (confirmed by the coordinator).
