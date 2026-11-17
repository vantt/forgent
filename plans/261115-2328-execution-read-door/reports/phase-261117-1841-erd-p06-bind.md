# Phase 06 report: bind() composed in Rust

Branch `execution-read-door/p06`, rebased on origin/main `2fa912d5c` (after p05 and p08). Worktree `/home/vantt/projects/forgent-worktrees/erd-p06`.

## What changed

- **Vectors (red first, `d6a1a309b`).** `packages/execution/contracts/bind.v1.json`: 90 vectors over five answers:
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
| `cargo test -p fgos-execution -p fgos-seat-binding` | 18 pass / 0 fail (golden_bind 90/90, golden_executor_model all) |
| mutation check: golden_bind with two edited expects | fails, 60 of 89 differ (the test compares) |
| `cargo clippy -p fgos-execution -p fgos-seat-binding --all-targets -D warnings` | clean (third-party arraydeque warnings only, pre-existing) |
| `cargo check` same crates `--all-targets`, msvc and aarch64-apple-darwin | clean |
| `cargo fmt --all --check` | clean (main formatted unit_summary.rs since the first round) |
| `node scripts/executor-model-vectors.mjs --check` | 238 + 90 match |
| `node scripts/agents-vectors.mjs --check` (imports the script) | 15 match |
| executor-model-vectors.test, provider-capacity.test | 3/0, 41/0 |
| bind.mjs callers: bind, account-rotation, account-pin, explain, tier-fallback, bind-committed-config | 38/0, 18/0, 13/0, 6/0, 4/0, 10/0 |
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

## Review round 1 (OPC CHANGES on 2243c1ca5)

- Answers taken: ranking step 2 (session transport, herdr inside herdr) stays; the `Cargo.lock` additions are fine.
- F1 `decided` is checked, never skipped (`fd2a2ed10`): every vector is replayed against Node. A decided vector must
  carry the one reason `DECIDED_RULE` (the explicit invocation rule), a hand-written `expect`, and an answer Node does
  not give; `decidedProblem` (test helper) says why not, and the replay test, recording and `--check` all use it.
  Throwaway checks with `--check --contract <copy>`, each exit 1 naming the vector: a decided vector whose expect is
  Node's answer ("Node now answers the decided rule"), another reason text ("only for the explicit invocation rule"),
  `expect: null` ("states its expect by hand"), and the mark removed from a vector Node answers differently (drift).
- F2: Node's `accountViewOf` (`bind.mjs`) reads `readAccountStateOverlay` once and each pool looks up
  `overlay[legacyStateKey(pool)]`, so `leaseRead` is the path Node takes; bind, account-rotation and account-pin tests
  green.
- F4: decided bind vector "inside herdr a generic cli invocation is chosen over a named herdr one: a named form is
  reached only by a pin" (Node: `codex-herdr-bwrap-work` over herdr; rule: `codex-cli-bwrap`, transport `cli`,
  source `default-cli`).
- F5: one line in `phase-09-route-and-node-callers.md`: `preflight` reads the runner as given while `bind` keys family
  spellings first, so with a family alias in `modelPolicies` a pin's quarantine can be read on another pool set
  (inherited from Node); 09 decides whether `preflight` keys the runner too.
- F3 (for a backlog item; seat-binding not changed): `accounts.rs cell_pools` follows Node's `parseTierCell`
  (`src/runner/dispatch/tier-cell.mjs`), which the account view used; `fgos_seat_binding::Cell::entries`
  (`model.rs`) parses the same grammar differently:

  | Cell input | `cell_pools` / Node `parseTierCell` | `Cell::entries` |
  |---|---|---|
  | `"m@"` | refused (no pool after `@`); cell gives no pool | model `"m@"`, pool = the family |
  | `"@p"` | refused (no model before `@`) | model `"@p"`, pool = the family |
  | `"m @ p"` | model `m`, pool `p` (trimmed) | model `m `, pool ` p` (untrimmed) |
  | `{ "model": "m", "extra": 1 }` | refused (unknown key) | accepted, `extra` ignored |
  | `{ "model": "m", "pool": "" }` | refused (empty pool) | model `m`, pool `""` |
  | `{ "model": "m", "effort": "huge" }` | refused | the whole config fails to deserialize |
  | `[]` | refused | refused ("a cell list must not be empty") |

## Unresolved questions

None.

## Proposed `## [Unreleased]` line

None user-visible yet (the Rust bind is reached by callers from phase 09).

Status: DONE
Summary: Rust bind, explain, preflight, seat config digest and effective rigor in fgos-execution replay all 89 bind vectors and the account quarantine fact; the explicit invocation rule replaces the herdr-first override in the Rust launch facts.
