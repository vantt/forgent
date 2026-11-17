# Phase 06 report: bind() composed in Rust

Branch `execution-read-door/p06`, rebased on origin/main `27117c78f` (after p08). Worktree `/home/vantt/projects/forgent-worktrees/erd-p06`.

## What changed

- **Vectors (red first, `d6a1a309b`).** `packages/execution/contracts/bind.v1.json`: 89 vectors over five answers:
  `bind` (71: tier and order, persona chain, every override check, pins kept and refused, unit prefer, run timeout,
  account pin in and out of pool, walk to next family and next entry, account rotation, lease conflict, excluded pools,
  continuity kept and refused, herdr transport, herdr invocation that cannot carry the posture, every Execution
  refusal: `agent-cli-missing`, `cli-missing` with `missingClis`, `headless-no-executor`, `no-candidate`,
  `run-timeout`, `reasoning-effort`, `locked-persona` x2, plus crate refusals `pin-unsatisfiable`,
  `posture-unavailable`, `independence-unsatisfiable`, `tier-escalation-unauthorized`, `seat-continuity-unavailable`;
  quarantine, sticky, liftable lock, unreadable inventory, disabled account), `explain` (5), `preflight` (5),
  `seatConfig` (3, the cross-language digest bytes), `effectiveRigor` (5).
- **One record door.** `scripts/executor-model-vectors.mjs` now records both Execution contracts (default) or one
  (`--contract`), hermetic through `buildTestEnv` as before; `--check` compares whole vectors. A fact that reads lease
  state also records `leaseRead`: what Dispatch's adapter reads, the input the Rust bind takes. A vector marked
  `decided` keeps a hand-written `expect` (a rule decided after the Node code); the script never records it and the Node
  twin skips it. Proven by `test/runner/dispatch/executor-model-vectors.test.mjs` (Node replay of both files, and the
  existing `--check` subprocess test).
- **Adapter.** `readAccountStateOverlay` in `src/runner/dispatch/provider-capacity.mjs`: `readAccountStates` for every
  provider key of the lease document (and the one an assignment holds), so no caller derives the pool set (Req 4).
  Used by the vector helper now; phase 09's route callers send it.
- **Rust (`6ea0719d1`).** `packages/execution/rust/src/bind.rs` (`bind`, `preflight`, `seat_config`,
  `seat_config_digest`, `effective_rigor`, `BindRequest`, `BindSession`, `AccountPin`), `explain.rs` (`explain_seat`
  walk chain, `explain_capability`), `accounts.rs` `account_view` (pool -> `legacy_state_key` overlay lookup, liftable
  rule), `executor_model.rs` helpers made `pub(crate)`. No I/O in `bind.rs`/`explain.rs`: machine facts through
  `Machine`, `now` and account state as inputs. `bindingInput.hostVersion` is left to the route (09).
- **accountQuarantine** removed from `REPLAYED_LATER`; replayed from `executor-model.v1.json` through `preflight` with
  the vector's recorded `leaseRead`. `VectorMachine` moved to `tests/common/mod.rs` (shared by both goldens).
- **Requirement 8, the invocation rule.** The naming input is settled (D-ADR0077, owner option A on the board 11:32,
  test guard `fffe1cd1c`), so the rule went in. `launch_facts`' default invocation is now one rule, with no herdr-first
  override: among `cli` invocations that carry the posture and that the session's transport can run, a generic form
  `<cli>-<cli|herdr>[-bwrap]` (cli = the invocation's program, `-bwrap` iff bwrap confines it) first, then the session's
  transport (herdr inside herdr), then declared order; a pin is never re-chosen. Two `decided` bind vectors state it
  (named form declared first loses, outside and inside herdr), a recorded vector shows a named pin is kept. One
  executor-model `launchFacts` vector changed and is marked `decided`: with posture judged at launch outside herdr,
  Node defaults gemini to `agy-herdr-bwrap` (a herdr invocation outside herdr); the rule gives `agy-cli-bwrap`.
- Docs: `executor-model.md` (section 3 default invocation rule, 6.1 lease state as data, 6.2 host version, 10 proof and
  `decided`), `docs/reading-map.md`.

## Retired test -> owner now

| Retired test | Owner now |
|---|---|
| none | — (Node bind is switched in phase 09) |

## Gates

| Gate | Result |
|---|---|
| `cargo test -p fgos-execution -p fgos-seat-binding` | 18 pass / 0 fail (golden_bind 89/89, golden_executor_model all) |
| mutation check: golden_bind with two edited expects | fails, 60 of 89 differ (the test compares) |
| `cargo clippy -p fgos-execution -p fgos-seat-binding --all-targets -D warnings` | clean (third-party arraydeque warnings only, pre-existing) |
| `cargo check` same crates `--all-targets`, msvc and aarch64-apple-darwin | clean |
| `cargo fmt -p fgos-execution --check` | clean. `cargo fmt --all --check` fails only on `packages/run-result/rust/tests/unit_summary.rs`, which is main's (not touched here) |
| `node scripts/executor-model-vectors.mjs --check` | 238 + 89 match |
| `node scripts/agents-vectors.mjs --check` (imports the script) | 15 match |
| executor-model-vectors.test, provider-capacity.test, agent-listing.test | 3/0, 41/0, 2/0 |
| git-mutation-census, architecture, doc-health, check-decision-citation-drift | 1/0, 71/0, 8/0, 33/0 |
| `git-one-door-scan` | 0 undeclared |

## Anything left

- Decision narrative for the invocation rule: the owner decision is V2 in plan.md; the concrete rule (generic first,
  then session transport, then declared order) is this phase's reading of it. It is written in the contract doc; the
  runner/seat-binding spec "Lịch sử quyết định" entry belongs to the docs close (phase 12) unless the plan lead wants it
  here.
- Node still has the herdr-first override (`bind.mjs:165-172`); phase 09 deletes it with the facade. Until then Node
  and Rust differ only on the three `decided` vectors.
- `Cargo.lock` gained the two new dependencies of `fgos-execution` (`fgos-canonical-json`, `sha2`, both already in the
  workspace).
- Hygiene seen, not fixed: p08 added `scripts/agents-vectors.mjs` beside this script (two record doors for the same
  contract directory; it imports this one's environment and serializer).

## Unresolved questions

1. The rule keeps a transport preference (herdr inside herdr) as an explicit rank key. If the owner meant "no transport
   preference at all" (declared order only among generic forms), the two `decided` vectors and the `launchFacts` one
   change and `chosen_invocation` drops one key.

## Proposed `## [Unreleased]` line

None user-visible yet (the Rust bind is reached by callers from phase 09).

Status: DONE
Summary: Rust bind, explain, preflight, seat config digest and effective rigor in fgos-execution replay all 89 bind vectors and the account quarantine fact; the explicit invocation rule replaces the herdr-first override in the Rust launch facts.
