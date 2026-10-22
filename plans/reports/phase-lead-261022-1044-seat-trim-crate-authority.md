# Seat trim: one authority in the Seat Binding crate

Worktree branch `worktree-agent-ad4eeaa4ee31b5d51`, base 8a4df0f8e. Two commits: 6bbf80754 (tier ladder), 5624778c2 (inline lead).

## What moved

| Item | Result |
|---|---|
| 2. Tier list in two places | Done. One contract file `packages/seat-binding/contracts/seat-binding.tier-ladder.v1.json` (names, strength, work, selfCheck, examples). The crate embeds it (`tier.rs`, `tier_ladder()` replaces the `TIER_LADDER` const; asserts the file lists the six `Tier` variants weakest first). `MODEL_POLICY_TIERS` in `config.mjs` reads the same file at load, so every Node user (plan.mjs, cli.mjs, bind.mjs, unit.mjs, execution-contract.mjs, the validators) is unchanged. File added to `package.json` `files` and to distribution.md row 3, otherwise an installed release would crash at config load. Spec §5.1 and §16 pointer updated. |
| 3a. Inline-lead fallback | Done. `Ask.inlineLead {executor, family}` (set by Node only when posture allows it, a lead is present, session not headless); `rank` returns a `Mechanism::Inline` candidate (source `session-lead-inline`) when the seat has no candidate configured, is not blind and needs no skill. `bind.mjs` passes the lead and reads `cand.mechanism === 'inline'`. |
| 1. Config validation | NOT moved. Design fork, below. |
| 3b. Override matching | NOT moved. Design fork, below. |

## Line deltas

- Node src: `bind.mjs` +16/-29, `config.mjs` +4/-2 (net -11).
- Node tests: `client.test.mjs` +4/-2. No test retired.
- Rust: `tier.rs` +33/-56, `model.rs` +14, `rank.rs` +31, `lib.rs` +1/-1 (net +23 crate; the logic moved in).
- Contracts: tier ladder file +48, golden +150 (5 cases).
- Docs/package: `package.json` +1, `distribution.md` and `seat-binding.md` 1 and 2 lines.

## Retired tests

None. Item 1 did not move, so no Node validation test lost its reason to exist.

## Fork 1: config validation (needs your call)

The Node `validateTierName`, `validateSeatTasteMap` and `normalizePreferCandidates` run at config LOAD (`validateRunnerConfigShape`), in every process that loads the runner config, without an exec. The crate's `validate` (`policy.rs:39`) runs only inside the policy stage, i.e. at BIND. Differences that make deleting the Node copy a user-visible door change:

- Load-time refusal names the key path and fires at every door that loads config (doctor rows, `fgos run`, setup, dispatch decide), not only at a bind.
- The Node gate also checks things the crate never sees: key types and unknown keys, a seat key being a seat id, a persona key being a persona name, and "every prefer names a registered executor" (`tier-fallback-config.test.mjs` "an empty prefer list is a load error ... registered executor").
- A bad tier on `tier`/`maxTier`/`defaults.tier` is a serde parse failure in the crate (`seat-binding-route-rejected` throw, no key path), not a clear `invalid-config` refusal. Only `tierFallback` and `modelPolicies` keys reach `validate`'s own message.
- The `seat-binding-config` doctor row does not validate tier names.

With the tier vocabulary now one source, what is left of `validateTierName` is a membership test against that shared list, not a second vocabulary. Options:
A. Keep the Node load gate as the door (now fed by the shared file). Smallest, no behaviour change. Remaining duplicated rule text: "prefer must not be empty", role keys (`SEAT_ROLES` mirrors crate `ROLES`).
B. Add a crate `validate` route op and call it from config load. Crate becomes the one validator, but one exec per load (about 4 ms), and Node load errors lose key-path wording unless the crate's messages are brought up to the Node ones. Needs the host on every load path (setup before activation, tests that load config without a host).
C. Delete the Node tier and empty-prefer checks; errors surface at first bind or a new doctor check. Loses the load-time refusal at non-bind doors.
Recommendation: A for now, and give `SEAT_ROLES` the same shared-file treatment later if wanted. Golden already owns the crate side ("an empty prefer list is a config error naming the line", "a role key outside the five", "a wrong tier name in a cell table").

## Fork 2: override matching (needs your call)

`findMatchingOverride` cannot move without moving more. The match result is needed by Node BEFORE the crate is asked: `resolvePersona` reads `matchingOverride.persona` (and the locked-persona refusal), the persona picks the tier taste, and timeout, account pin and provenance source all read the matched override afterwards. Moving the match into the crate either duplicates it (Node must still match to build the ask) or forces persona resolution into the crate too, which spec §3 and the resolver review row keep on the Node side ("acceptable while persona and rigor stay on the Node side"). The crate already owns what an override DOES (tier, executor pin, effort, account, run-wide drop). I stopped here. If you want it, the honest move is persona resolution plus override matching together, a larger change.

## Verification so far (no land-done yet)

- `cargo test -p fgos-seat-binding` with own target dir: 13 passed (golden incl. 5 new cases, determinism, replay round trip, tier tests).
- `node --test test/runner/tier-fallback-config.test.mjs`: 15 pass.
- Not yet run, need the host binary (workspace build is barred until land done): `test/runner/execution/bind.test.mjs` (inline lead and override tests must pass unchanged), `test/seat-binding/client.test.mjs`, full `npm test`, `cargo test --workspace --no-fail-fast`, packaging tests (`test/install-packaging.test.mjs`, `test/rust-host/release-tree.test.mjs` should see the ladder file through `package.json` files).

## For the other lead

`test/helpers/work-seat-config.mjs` `TIERS` can `import { MODEL_POLICY_TIERS } from '../../src/runner/dispatch/config.mjs'` instead of its own literal. Two more literals exist in `test/runner/execution-contract.test.mjs`, `test/workflow/unit-handoff-raise-door.test.mjs`, `test/setup/model-pool-checks.test.mjs` (not mine).

## Open questions

1. Fork 1: A, B or C?
2. Fork 2: leave override matching in Node (recommended) or take persona resolution into the crate as its own item?
3. Compile risk: `TierDefinition` fields are now `String` (crate public type); only the crate and the host's route call it, `cargo test -p` is green, workspace build is pending.
