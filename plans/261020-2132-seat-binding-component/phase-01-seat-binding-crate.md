# Phase 01: crate `fgos-seat-binding` with two pure stages

Owner: Sonnet lead in a worktree from the track. Size L (1.5d). Parallel with 02 and 03.

## Context

- Spec §3.3 (Shape S), §4 (tier, ladder, rigor split, cells, composition), §5.3 (precedence), §6.3 (independence), §7 (pins).
- Pattern: `packages/convention/rust` (crate shape, `contracts/*.v1.json` golden vectors), `packages/session-identity/rust/src/route.rs` (route module shape; the route itself is wired in 04).
- Behaviour to preserve (read, do not copy blindly): `bind.mjs` `prepare` :234, `walkOrder` :428, `bind` :453 (spread, independence, pool usability `poolUnusableReason` :215, B1 walk from MP-B1 phase 03).

## Requirements

- New crate `packages/seat-binding/rust` (`fgos-seat-binding`), deps: `fgos-host-runtime`, `serde`, `serde_json`, `thiserror` only. No I/O, clock, env or randomness; `now` comes in the input.
- `TIER_STRENGTH` + ladder table (§4.1) as one constant; `ladder()` returns vocabulary + definitions (source of `$comment` and of `explain`'s tier definition).
- **Stage 1 `policy(ask, config) -> Policy`**: resolved tier by §4.4 step 1 / §5.3 column `tier` (seat → persona → role → workflow recommendation → `cap.tier` → `prefix.tier` → `defaults.tier`; R2 row absent); override at or below accepted (`tierSource: override`), above refused `tier-escalation-unauthorized` unless `raiseAuthorized` (always false from wave-1 doors); `maxTier` = `cap.maxTier ?? prefix.maxTier ?? global`, lowering visible (`loweredFrom`, reason `max-tier-cap`, the `maxTier` config path); effective rigor = stronger of capability rigor (cap, else prefix) and unit rigor; checker count input passthrough; `prefer` column §5.3 (lists replace, maps inherit per key, `prefer: []` already a load error in 05); exact key → `<prefix>:*` → defaults merged per property (no bare verb). Every value carries its config path as source.
- **Stage 2 `rank(policy, peers, walk, accountView, launchView) -> Ranked`**: candidates naming executor, invocation, model, effort, pool, account; family skipped when no cell at the final tier; `tier-cell-missing` naming the config line when none remains (the tier key that set it or the `prefer` that restricted it); hard pin `family#invocation` → `pin-unsatisfiable` (skip when run-wide override); effort below cell → `effort-below-cell`; effort the CLI cannot render → skip, on hard pin `effort-unsupported` listing rendered levels; independence per pattern table §6.3 (soft spread / hard `independence-unsatisfiable` naming peers), applied after precedence, with the filter that moved a seat named; walk after failure = remaining entries of the failed family, then `tierFallback.<tier>` ∩ seat's `prefer` families; continuity (`sameSeat`) keeps executor+model+effort, account rotation in the same pool allowed, else `seat-continuity-unavailable`; account order from `accountView` (sticky, quarantine, lazy probe as data).
- `bind(ask, config, …) = rank(policy(…), …)` plus an `explain` structure (one sentence per seat, spec §9.2 format) built from the same result.
- Tool executors are out of scope: the crate refuses an ask whose candidates are `kind: tool` with `not-an-agent-seat` so a misrouted call is loud (Node keeps the tool path, 06).
- Input/output JSON schema versioned (`protocol: 1`), `bindingInput` and `Ranked` serialisable for replay (08).

## Files

- Create: `packages/seat-binding/rust/{Cargo.toml,src/lib.rs,src/tier.rs,src/policy.rs,src/rank.rs,src/explain.rs}`, `packages/seat-binding/contracts/seat-binding.golden.v1.json`, `packages/seat-binding/rust/tests/golden.rs`.
- Modify: root `Cargo.toml` (workspace member).

## Steps

1. Port the tier vocabulary and ladder text; unit tests for ordering.
2. Write golden vectors first from spec §9.2 table, §9.2 variants A/B/C, §9.3 debate table and judge refusal, §7 pin refusal, §4.3 effort rules, §4.4 step 6 continuity.
3. Implement stage 1, then stage 2, until vectors pass.
4. Add vectors for today's preserved behaviour (spread order, B1 walk, run-wide pin skipping seats it cannot apply to, pool unusable reasons).

## Tests

`cargo test -p fgos-seat-binding`; golden file is the shared contract (phase 04 adds the Node reader). Proofs owned here: precedence, cap, cells, pins, judge independence, continuity (plan proof table).

## Risks / rollback

- Risk M×M: a preserved behaviour missed in the port. Mitigation: step 4 vectors come from existing `bind.test.mjs` / `tier-fallback.test.mjs` cases, listed in the report.
- Rollback: additive; revert the merge on the track.
