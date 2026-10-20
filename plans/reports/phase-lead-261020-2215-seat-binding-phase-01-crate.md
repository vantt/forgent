# Seat Binding phase 01: the crate with two pure stages

Crate `fgos-seat-binding` at `packages/seat-binding/rust`, golden contract at `packages/seat-binding/contracts/seat-binding.golden.v1.json` (79 cases), root `Cargo.toml` member plus the `Cargo.lock` entry. No Node file touched. The track was merged up to the phase-00 corrections before commit; they add nothing to this crate beyond what the brief states (rigor is an input; effort never comes from rigor, tested).

## 1. Shape

| Piece | File | What it holds |
|---|---|---|
| Tier ladder | `src/tier.rs` | `Tier` (six, ordered), `TIER_LADDER` (strength plus definition, one constant), `ladder()`, `Effort`, `Rigor` |
| Shapes | `src/model.rs` | `BindInput`, `Ask`, `Config`, `LaunchView`, `AccountView`, `Walk`, `Policy`, `Ranked`, `Refusal`, `BindOutput`, `BindingInput` (replayable subset) |
| Stage 1 | `src/policy.rs` | `policy(ask, config)`: precedence table, `maxTier` cap, raises, `prefer`, cells at the final tier |
| Stage 2 | `src/rank.rs` | `rank(policy, peers, walk, accountView, launchView, now)` |
| Explain | `src/explain.rs` | text built from the same `Policy` and `Ranked` |
| Entry | `src/lib.rs` | `bind(&BindInput)` = `rank(policy(..))` plus `explain`; `protocol: 1` |

No I/O, clock, environment or randomness; `now` is an input. `fgos-host-runtime` is declared as the brief says but is not used until the route lands in phase 04.

## 2. Decisions inside the brief

- **Stage-1 output carries the cells.** Rank has no config, so `Policy.cells` holds every family's cell at the final tier; `Policy.ask` carries the seat facts rank needs.
- **A family without a cell is dropped, not refused**; if no allowed leasing candidate has one, the seat is refused `tier-cell-missing` naming `prefer` source and the seat tier key. This order is why the debate judge refusal reads `independence-unsatisfiable` when gemini and xai lack cells.
- **Raise by selector.** `selectors` replace persona, seat or capability; the tier with them is compared with the tier without, both after the cap. Above is refused `tier-escalation-unauthorized` unless `raiseAuthorized`, and `raisedBy` names the selector.
- **Independence strictness from effective rigor.** `hardCheckers` is hard at `high` and `critical`, soft below.
- **Refusal carries `configured`** (candidates named before filtering) so Node can decide the inline-lead exit only for a unit with nothing configured (spec 5.3); the crate never binds inline.
- **Left to Node, not in the crate:** persona locking, `timeoutMs`, the `reasoningEffort` check against `supports.reasoningEffort` (now `launchView` effort levels), lease acquisition.
- **`$comment`** is skipped at every map level of the config.
- Clippy: `result_large_err` is allowed crate-wide (the refusal is the evidence-carrying error and is built only on the refusal path).

## 3. Proof-list items owned (golden unit tests)

| Spec 11 item | Golden case |
|---|---|
| workflow recommendation beats cap/prefix tier, loses to seat, persona, role | `shape system ...recommendation beats...`; `seat key beats persona beats role...`; `role key beats the workflow recommendation...` |
| above `maxTier` lowered with `max-tier-cap`, `loweredFrom`, in explain; capability `maxTier` above global passes | variant B; `a capability maxTier above the global value...`; judge under `maxTier: standard` |
| missing cell drops family; none left refuses naming the line; hard pin refuses | variant C; `a hard pin on a family with no cell...`; `a family with no cell is skipped...` |
| effort unsupported or below cell | three `effort` cases plus the pinned `effort-unsupported` with rendered levels |
| untrusted door cannot raise tier or `acceptDependence` | override above, selector cases, `acceptDependence is ignored unless the door is authorized` |
| judge hard independent of both sides | `debate judge ...` (accept and refuse) |
| tool executor not bound | `an ask whose candidates are all tool executors...` |
| panel spread with soft independence | `alternative` and `constraint` spread cases |
| pin unsatisfiable, never swapped; run-wide pin skipped | four `pin` cases |
| continuity keeps executor, model, effort; rotates account; else refused | three continuity cases |

Replay: `ranked_round_trips_through_json_for_replay`, `the_replayable_input_carries_no_config_body_or_account_facts`, `every_case_is_deterministic`.

## 4. Preserved behaviour vectors (from `bind.test.mjs` and `tier-fallback.test.mjs`)

Governance rejection; independence filter and the authorized-only `acceptDependence`; blind role never in-process; checker forced out-of-process; unknown executor skipped by name; headless/no-candidate with nothing configured; walk order (failed family in cell order, then tier list within the seat list, never leaves the tier, no tier list falls back to prefer order, exhausted walk refuses); two cell entries as two candidates; a fault excludes one pool and keeps the other pool of the same family; a pool no account can serve gives no candidate; missing cell refuses by name for a leasing seat but not for an in-process seat; account pin (`pool/account`: invalid, unknown, other pool); per-CLI login-store filter on accounts.

Not carried (deliberately, per spec 5.3 and the plan): bare-verb capability fallback, `rigorToTier`, inline-lead binding.

## 5. Spec example discrepancy

Spec 10.2 shows the `synthesis` seat binding claude although xai has an unused flagship cell; with the old "fewest peers of the family" spread rule xai wins. The crate follows the rule, so that table row is not a vector. Worth a spec erratum.

## 6. Verification

Run by me with `CARGO_TARGET_DIR=/home/vantt/projects/forgentX/.fgos/runtime/tmp/seat-p01-cargo`: `cargo test -p fgos-seat-binding` 9 passed (4 unit, 5 golden-suite); `cargo clippy -p fgos-seat-binding --all-targets` clean. No manifest touched, so `test/architecture.test.mjs` not run. Full npm suite not run (no Node consumer yet).
