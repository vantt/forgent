# Phase 01: crate `fgos-seat-binding` with two pure stages

Owner: Sonnet lead in a worktree from the track. Size L (1.5d). Parallel with 02.

## Context

- Spec `docs/specs/seat-binding.md` §4.1 (Shape S), §5 (tier, ladder, rigor split, cells, composition, raise), §6.3 (precedence), §7.3 (independence), §8 (pins), §10 (examples) [RT-16b].
- Pattern: `packages/convention/rust` (crate shape, `contracts/*.v1.json` golden vectors), `packages/session-identity/rust/src/route.rs` (route module shape; wired in 04).
- Behaviour to preserve: `bind.mjs` `prepare` :234, `walkOrder` :428, `bind` :453, `poolUnusableReason` :215, MP-B1 walk.

## Requirements

- New crate `packages/seat-binding/rust` (`fgos-seat-binding`), deps `fgos-host-runtime`, `serde`, `serde_json`, `thiserror` only. No I/O, clock, env or randomness; `now` comes in the input.
- `TIER_STRENGTH` + ladder table (§5.1) as one constant; `ladder()` returns vocabulary + definitions.
- **Stage 1 `policy(ask, config) -> Policy`**: resolved tier per §5.4 step 1 / §6.3 `tier` column (seat → persona → role → workflow recommendation → `cap.tier` → `prefix.tier` → `defaults.tier`); override at or below accepted (`tierSource: override`), above refused `tier-escalation-unauthorized` unless `raiseAuthorized`; `maxTier` = `cap.maxTier ?? prefix.maxTier ?? global`, lowering visible (`loweredFrom`, `max-tier-cap`, the `maxTier` path); `prefer` column §6.3 (lists replace, maps inherit per key); exact key → `<prefix>:*` → defaults merged per property, no bare verb. Every value carries its config path as source.
- [RT-13] **Effective rigor is an input, not computed here.** Node's seat resolver (02) is the one authority for effective rigor and checker composition; the crate receives `effectiveRigor` and uses it only for hard-independence strictness (§7.3).
- [RT-11] Door raises: the ask carries `selectors` (door-chosen persona, seat, capability) and `raiseAuthorized`. If the resolved tier with the selectors is above the resolution without them, it is a raise: refused `tier-escalation-unauthorized` unless `raiseAuthorized`, and `tierSource` names the selector. `acceptDependence` on an override is ignored unless `raiseAuthorized` (defence in depth; the door already refuses it, 06).
- **Stage 2 `rank(policy, peers, walk, accountView, launchView) -> Ranked`**: candidates naming executor, invocation, model, effort, pool, account; family skipped when no cell at the final tier; `tier-cell-missing` naming the config line; hard pin → `pin-unsatisfiable` (skip under a run-wide override); `effort-below-cell`; effort the CLI cannot render → skip, on hard pin `effort-unsupported` listing rendered levels; independence per §7.3 (soft spread / hard `independence-unsatisfiable` naming peers), with the moving filter named; walk after failure = remaining entries of the failed family, then `tierFallback.<tier>` ∩ the seat's `prefer` families; continuity keeps executor+model+effort (same-pool account rotation allowed), else `seat-continuity-unavailable`; account order from `accountView` (sticky, quarantine, lazy probe as data) [RT-16h] restricted to accounts whose login-store CLI list contains the chosen invocation's CLI.
- `bind = rank(policy(…))` plus an `explain` structure (spec §10.2 format) from the same result.
- Tool executors: an ask whose candidates are `kind: tool` is refused `not-an-agent-seat` (Node keeps the tool path, 06).
- Input/output JSON versioned (`protocol: 1`); `Ranked` and the allowlisted `bindingInput` subset serialisable for replay (08).

## Files

- Create: `packages/seat-binding/rust/{Cargo.toml,src/lib.rs,src/tier.rs,src/policy.rs,src/rank.rs,src/explain.rs,tests/golden.rs}`, `packages/seat-binding/contracts/seat-binding.golden.v1.json`.
- Modify: root `Cargo.toml` (member).

## Steps

1. Tier vocabulary + ladder; ordering tests.
2. Golden vectors first from spec §10.2 table and variants A/B/C, §10.3 debate and judge refusal, §8 pin refusal, §5.3 effort rules, §5.4 step 6 continuity, [RT-11] selector raise.
3. Stage 1, then stage 2, until vectors pass.
4. Preserved-behaviour vectors from existing `bind.test.mjs` / `tier-fallback.test.mjs` cases (listed in the report).

## Tests

`cargo test -p fgos-seat-binding`; the golden file is the shared contract (04 adds the Node reader).

## Risks / rollback

- M×M missed preserved behaviour → step 4. Rollback: additive; revert on the track.
