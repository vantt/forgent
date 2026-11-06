# HARDEN T5 phase 08: a run's outcome is derived once, in Rust, through the addon

Branch `harden/t5-p08` (worktree `/home/vantt/projects/forgent-worktrees/harden-t5-p08`), base `6d15e9768`. Commits: `6d4350e04` (vectors, red), `5b8cb61d4` (derivation move, V3-only writer, V4 out). Not pushed.

## What changed

- **Vectors first** (`test/fixtures/run-outcome/legacy-derivation.json`): rows 20-28 added (agent waiting on a person, cancelled by policy, completion-unknown, completed with needs-input, contract-corrupt provenance, V3 recorded outcome kept, V3 without outcome, V3 outcome contradicting its classification, V4 record), and `expected.reason` on every V2 row the derivation answers. The Rust vector test now lists every mismatching row (category and reason) instead of stopping at the first.
- **Rust is the derivation** (`packages/run-result/rust/src/lib.rs`): `derive_outcome` now applies Node's rules where they differed: a `contract-corrupt` provenance gives `corrupt`, and rule 0 (`failure.family: provider` + `code: blocked`) gives `blocked`. It also treats an empty family as no family, as Node did. Reasons stay in Rust's kebab form. The only reader of `outcome.reason` is `src/runner/work-dispatch.mjs:215`, which puts it into an error message. Nothing parses it. New reasons: `contract-corrupt` and `provider-blocked`. `derive_legacy_outcome` follows Node: version 4 is `unsupported-contract-version`. A V3 record without an outcome is `missing-outcome`. A V3 record whose recorded category differs from the derived one is `outcome-contradicts-classification`. A recorded outcome is read only for V3 records (before this, it was read for any record).
- **Addon binding**: new `packages/git/node-addon/src/run_result.rs` exposes `runResult.deriveOutcome(classificationJson) -> {category, reason}`. The crate is linked in `Cargo.toml`. `versions()` gains `runResult: 1`, and `combinedAbiMatches` in `src/native/door.mjs` requires it, so an addon without the namespace is refused by name at load. No legacy or evidence-floor entry: no Node caller needs one.
- **Node**: `deriveOutcome` in `run-result.mjs` is now a single door call. The rule body and `deriveLegacyOutcome` are deleted. All callers keep calling it: the V3 writer, the V3 validator (which now derives only when an outcome is recorded), the `runOutcome` fallback and `unit-run-history.mjs`.
- **One written version**:
  - The lease refusal (`assignment-runner.mjs`) writes through `normalizeRunResultV3`.
  - `normalizeRunResult`, `normalizeRunResultV2`, `RUN_RESULT_CONTRACT_V3` (it duplicated `RUN_RESULT_CONTRACT`) and the V2 writer branches are deleted.
  - `RUN_RESULT_CONTRACT_V4`, `validateRunResultV4`, `native-v4` and the V4 reader branch are deleted.
  - `RUN_RESULT_CONTRACT_V2` stays as a private constant of the V2 reader.
  - The dead `projectLegacyStatusAndConfidence` is deleted.
  - The three copies of the status/confidence getters are now one helper, `withLegacyView`.
  - `run-result.mjs` is 1 110 lines (budget 1 150, was 1 387).
- Docs: `docs/platform/agent-coordination/contracts/assignment-run-runresult.md` (writer is V3 only, the derivation's owner, the evidence row). There is one CHANGELOG line, because the recorded reason strings change in `fgos dispatch show-run`.

## Diff table (step 1, before any code change)

Node = current `runOutcome` category / `deriveOutcome` reason. Rust = `derive_legacy_outcome`. Expected = the target.

| Row | Node | Rust (before) | Target |
|---|---|---|---|
| 09, 10 v2 failed provider | infra / nonzero-process-exit | infra / infra-exec-failed | infra / infra-exec-failed |
| 11 v2 completed refuse | policy / read-only-mutation | policy / policy-policy-refused | policy / policy-policy-refused |
| 20 agent waiting on a person | blocked / blocked | **infra** / infra-exec-failed | blocked / provider-blocked |
| 21 cancelled by policy | policy / cancelled | policy / policy-cancelled | policy / policy-cancelled |
| 22 completion-unknown | infra / lost-supervisor | infra / infra-exec-completion-unknown | same as Rust |
| 23 completed needs-input | infra / awaiting-approval | infra / infra-policy-needs-input | same as Rust |
| 24 contract-corrupt provenance | corrupt | **ok** | corrupt |
| 26 v3 without outcome | corrupt | **infra** | corrupt |
| 27 v3 outcome contradicts classification | corrupt | **ok** (recorded read unchecked) | corrupt |
| 28 v4 record | **ok** | **ok** | corrupt (V4 gone) |

All other rows agreed. After the change, the vector diff is empty: the Rust test is green over all 28 rows (category and reason), and the Node fixture loop is green over all 28 rows (category, through the addon).

## Red to green

- Red, at `6d4350e04`: `cargo test -p fgos-run-result --lib test_legacy_derivation_fixture` failed on rows 20 (category and reason), 24, 26, 27 and 28.
- Green, at `5b8cb61d4`: `cargo test -p fgos-run-result` passes (3 + 13 + 14).

## Callers of the derivation and the door (evidence that each runs where the addon loads)

- **V3 writer** (`normalizeRunResultV3`), used by `assignment-runner.mjs` and `settlement.mjs`, and the **V3 validator** / `interpretRunResult`, used by `readSettledResult`, `show-run`, `runtime-inspection`, `operation-choice`, `loop`, `provider-account-probe`, `reconciliation-planner` and the run-supervisor step `settle-attempt.mjs`. Every one of these already runs in a process that loads the addon:
  - Dispatch reads config through the addon.
  - `run-lock.mjs` and `provider-capacity.mjs` call `nativeDoor()`.
  - The run supervisor's `run-lock.mjs` uses the door.
  - The reconciliation import-graph test already lists `src/native/door.mjs` in the planner closure, and it passes.
- **`unit-run-history.mjs`**: runs in the execution core, beside the same dispatch callers.
- **A checkout `node bin/fgos.mjs` call** fails by name (`git-addon-not-shipped`), as AGENTS.md states for addon verbs. It never fails silently.

## Tests retired, with their new owners

- `run-outcome.test.mjs` "deriveOutcome: an agent waiting on a person is blocked, not an infra failure": now owned by the Rust vector test, row 20.
- `run-outcome.test.mjs` "deriveOutcome: strict rule order verification": now owned by the Rust vector test, rows 06-15 and 20-24.

Deviation from the retire list: three `run-outcome.test.mjs` cases are kept, not four retired.
- **Fixture loop.** It is the addon wiring proof, and it is also the only proof of Node's own V1/V2/V3 record interpretation, which stays in Node.
- **Corrupt-input case.** Node interpretation of null and undefined input.
- **Evidence-floor case.** Node behaviour, see below.

Rewritten, not retired:
- `run-result-v2.test.mjs`: the writer cases drive `normalizeRunResultV3` and validate with `validateRunResultV3`. The V2 validator cases run on V2 records built from the V3 writer (`asV2`). A "sound record is valid" check was added so each corruption case still breaks one thing. The unsupported-contract case also covers version 4.
- `dispatch-runtime-inspect.test.mjs`: the V2 record is a literal.
- `assignment-dispatch.test.mjs`:
  - The capacity-refusal test now asserts contract V3 and outcome `{infra, infra-exec-failed}`. This is the owning proof that the lease refusal writes V3.
  - The settlement-crash test uses the V3 writer.
- `native-load.test.mjs`: `versions()` includes `runResult: 1`.

## Net size (prod / test, against the phase estimate)

| | Measured | Estimate |
|---|---|---|
| Node prod | −277 (`run-result.mjs` −277, other one-liners ±0) | −270 |
| Rust prod | −49 (crate −64, addon +15) | +60 |
| Tests | −63 (Node −61, Rust inline −2) | −100 |

JSON vectors (+390) are not counted. Rust came in below the estimate because aligning the rules let `derive_outcome` shrink.

Test cost: no new test, no new spawn. Each derivation is now one in-process addon call.

## Gate

- `cargo test -p fgos-run-result`: green. `cargo test -p fgos-node-addon`: green (3).
- `cargo clippy -p fgos-run-result -p fgos-node-addon --all-targets -- -D warnings`: clean.
- `cargo check --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin` (both crates): clean.
- `cargo fmt --all --check`: only the known `mailbox_remote.rs` and `convention/tests/golden.rs`; my files are clean.
- `node scripts/git-one-door-scan.mjs --root .`: 0 undeclared. The census is regenerated in both commits.
- Focused runs, all green:
  - run-outcome, run-result-v2, run-result-v3-reader, native-load, dispatch-runtime-inspect, unit-run-outcome: 65 pass.
  - assignment-dispatch, assignment-enumerator-guard, assignment-runresult, i08b, reconciliation-import-graph, stray-write-attribution, legacy-seat-read, unit-summary, provider-account-probe, run-result-source-scan, run-result-confinement-label, config-door, architecture, direct-cutover: 256 pass.
  - doc-health, check-decision-citation-drift, architecture, run-outcome, native-load: 96 pass.
- **Full suite** (`/dev/shm/p08-full.log`): 8 739 tests, 8 706 pass, 1 fail. The failure is the known frozen V7n addendum test. No `run-tests: ERROR` lines.
- `rg "deriveOutcome|deriveLegacyOutcome|deriveEvidenceFloor|RUN_RESULT_CONTRACT_V4|validateRunResultV4|native-v4|normalizeRunResultV2" src` now finds only:
  - `deriveOutcome`: the door function in `run-result.mjs`, its callers and its import in `unit-run-history.mjs`.
  - `deriveEvidenceFloor` (see deviations).

## Deviations from the phase file

1. **`deriveEvidenceFloor` stays in Node.** Its only consumer is `runOutcome` (called with a floor from `operation-choice.mjs:452`), and Rust has no twin of it. So there are not two owners. The phase deletes it only "if its only consumer becomes the addon", which it does not. Moving it would add Rust code and a second binding entry without removing a duplicate (RUL104). Layer acceptance criterion 4 lists it; the big lead should read that criterion as conditional.
2. **`src/runner/dispatch/settlement.mjs` line 24** (owned by P09): I removed the unused `normalizeRunResultV2` import. Deleting the export makes that import a load-time error. P09 has not started (it depends on 06, which depends on 08), so the edit does not conflict with any running phase. It is one import token.
3. **Three `run-outcome.test.mjs` cases kept, not one.** Reasons under "Tests retired".
4. **The Rust record reader** now reads a recorded outcome only for V3 and checks it, as Node does. Before, it read one from any record. This is in the CHANGELOG line.

## Known divergence left (old records only)

Node's V2 validator is stricter than Rust's `is_classification_valid`. Examples: the stored status/confidence projection, delivery mode, provenance, and the completed-with-provider-failure invariant. A malformed V2 record can therefore be `corrupt` in Node and derived in Rust metrics. No writer produces V2 any more. Closing this would mean moving the V2 validator into Rust, which is outside this phase.

## Items for other phases

- **P13:** a spec decision-history line for decision 62 A5 (Run Result outcome owner is the Rust crate through the addon). Owner-machine guide section: lease refusals are now V3, new reasons are in Rust form, and rollback reads V3 fine.
- **Landing:** OPC review of the addon Cargo diff (`packages/git/node-addon/Cargo.toml`, `src/lib.rs`, `src/run_result.rs`, `versions()` gains `runResult`). Then a direct-seat smoke plus `fgos dispatch show-run` on the smoke's run.
- **Phase file status:** not edited (the big lead owns the plan files).

Status: DONE_WITH_CONCERNS
Summary: The outcome is now derived once, by the Rust crate through the addon's `runResult.deriveOutcome`; the Node rule body is gone, every writer writes V3, and V4 is gone. The vector diff is empty, the full suite has only the known red, and the Rust gate is clean.
Concerns/Blockers: `deriveEvidenceFloor` was kept in Node (no Rust twin, so moving it would grow the code). The P09-owned `settlement.mjs` had one import token removed. OPC review of the addon Cargo diff is still needed before landing.
