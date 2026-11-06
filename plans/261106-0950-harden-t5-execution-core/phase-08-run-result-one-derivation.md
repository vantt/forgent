---
phase: 08
title: "Run Result: the outcome of a run record is derived once, in Rust, through the combined addon; the Node derivation is deleted in the same change; one written contract version (V3), V4 gone"
status: pending
depends_on: [02, 05]
parallel: "wave 3, with 11 (disjoint files)"
effort: ~1.5d
net_size: "Node −270 / Rust +60 / tests −100 (estimate)"
---

# Phase 08 — Run Result one derivation (A5)

## Context

Decision 62 A5 (supersedes the arbitration's B-9 single-writer rule as the fix: one owner in code); arbitration §2 Run Result shape ("one written version: V3 from both paths, lease refusal included; V4 validator, normalizer and constant go; V2/V3 readers stay"); correctness B-9 (two derivations disagree: Node rule 0, reason strings); baseline O-4. Through the T0 door: `src/native/door.mjs` `nativeDoor()` (`:76`), the combined addon `packages/git/node-addon` (Git's; OPC reviews its Cargo diff, plan fact 5). L10: the Node derivation is deleted in the same change.

Code read on `4b116c27e`:
- Rust: `packages/run-result/rust/src/lib.rs:23-128` (`derive_outcome`, kebab reasons, no rule 0), `:191-338` (`derive_legacy_outcome`), `:203-219` (metrics read the recorded `classification.outcome` first), `:885-900` (test over `test/fixtures/run-outcome/legacy-derivation.json`); crate deps `fgos-host-runtime`, `fgos-observe`, serde (`Cargo.toml:6-11`).
- Addon: `packages/git/node-addon/Cargo.toml:9-25` (no `fgos-run-result`), modules in `src/` (`config.rs`, `durable_file.rs`, `process.rs`, … `lib.rs`).
- Node: `src/runner/dispatch/run-result.mjs:1150-1240` (`deriveOutcome`, rule 0 at the head, prose reasons), `:1241-1314` (`deriveLegacyOutcome`, `deriveEvidenceFloor`), `:1315-1388` (`runOutcome`); callers of the derivation: `run-result.mjs:336` (`validateRunResultV3`), `:573` (normalizing a V2 record), `:731` (V4 validator), `src/runner/execution/unit-run-history.mjs:7,24`. V4: `:17` (`RUN_RESULT_CONTRACT_V4`), `:30` (`native-v4` provenance), `:566-570`, `:690-764` (`validateRunResultV4`), `:857` (V4 branch of `interpretRunResult`); no V4 record on disk (simplicity seat: 778 `result.json`, none v4). V2 writer: the lease refusal `assignment-runner.mjs:20` (import), `:1496` (`normalizeRunResultV2`); `normalizeRunResultV2` `:674`.
- Node test of the twin: `test/runner/run-outcome.test.mjs` (5 tests, 173 lines, same fixture).

## Requirements

- **Vectors first.** `legacy-derivation.json` gains the rows that make the two sides disagree today: rule 0 (`failure.family: provider` with code blocked → `blocked`), the reason forms, and every category Node writes. Both sides run over it before any change; the report shows the differing rows.
- **Rust is the derivation.** `derive_outcome` takes Node's rules where they differ (Node is the writer of every recorded `classification.outcome` today, so its categories are the truth of new records; rule 0 joins Rust). Reason strings: the lead lists every reader of `outcome.reason` (`rg -n "outcome\??\.reason" src packages apps`); if none parses Node's prose, Rust's kebab reasons become the written ones (recorded change, formats table); else Rust returns the form the reader needs. `derive_legacy_outcome` and the evidence floor follow the same rule.
- **Addon binding.** `packages/git/node-addon` links `fgos-run-result` and exposes one function (for example `deriveRunOutcome(classificationJson) → outcomeJson`, plus the legacy and evidence-floor entries only if a Node caller still needs them); the combined-ABI check in `door.mjs` (`combinedAbiMatches`, `:33`) changes only if the addon's version record must name the new module. Every Node caller above calls it through `nativeDoor()`; each caller already runs where the addon loads (config reads go through it), the lead lists them with that evidence.
- **Delete the Node derivation:** `deriveOutcome`, `deriveLegacyOutcome`, `deriveEvidenceFloor` (if its only consumer becomes the addon), and their private helpers.
- **One written version.** The lease refusal writes V3 (`normalizeRunResultV3`); `normalizeRunResultV2` and `RUN_RESULT_CONTRACT_V2` as a writer go (the V2 reader and validator stay for old records); `RUN_RESULT_CONTRACT_V4`, `validateRunResultV4`, `native-v4`, the V4 branches go.
- Node budget: `run-result.mjs` ≤ 1 150 lines.

## Files

**Create:** `packages/git/node-addon/src/run_result.rs` (binding module; name per the crate's convention).

**Modify:**
- `packages/run-result/rust/src/lib.rs` (`:23-338`), its inline tests
- `packages/git/node-addon/Cargo.toml`, `src/lib.rs` (module registration)
- `src/native/door.mjs` (only if the ABI record changes)
- `src/runner/dispatch/run-result.mjs` (`:14-30`, `:290-356`, `:357-690`, `:690-764`, `:765-1125`, `:1150-1388`)
- `src/runner/execution/unit-run-history.mjs` (`:7`, `:24`)
- `src/runner/dispatch/assignment-runner.mjs` (`:20`, `:1496`)
- `test/fixtures/run-outcome/legacy-derivation.json`; `test/runner/run-outcome.test.mjs`; `test/runner/run-result-v2.test.mjs`, `run-result-v3-reader.test.mjs`, `test/runner/assignment-runresult.test.mjs` (lease refusal now V3)
- census (addon and `assignment-runner.mjs` are hashed), `CHANGELOG.md` only if a user-visible reason string changes in `fgos dispatch show-run`

**Delete:** the Node derivation functions; `normalizeRunResultV2` (writer path), `RUN_RESULT_CONTRACT_V4`, `validateRunResultV4`, `native-v4`.

**Tests to retire:**
- `run-outcome.test.mjs`: the four cases that run the Node derivation over the fixture (behaviour now owned by the Rust fixture test in `lib.rs:885-900`); one case stays as the wiring proof of the addon call (Node → Rust gives the fixture's category for one row).
- V4 cases in `run-result-v3-reader.test.mjs`/`run-result-v2.test.mjs` if any: behaviour removed (no V4 record exists).
- Cases asserting the lease refusal writes V2: rewritten to V3 (same file), not retired.

## Net size

Node: derivation −180, V4 −80, V2 writer −15, binding calls +5 → about −270. Rust: binding +40, rule 0 and reason alignment +20 → +60. Tests: Node twin −120, vector rows (JSON, not counted), wiring +10, Rust inline +10 → about −100.

## Steps

1. Vectors; run both sides; record the diff table.
2. Rust takes Node's rules; `cargo test -p fgos-run-result` over the new rows.
3. Addon binding; OPC review requested for the Cargo diff.
4. Node callers through the door; delete the Node derivation; V3-only writer; V4 out.
5. Tests per the retire list; census.

## Validation (focused)

- `cargo test -p fgos-run-result`; `cargo test -p fgos-node-addon` (if it has tests); clippy on both; msvc and darwin `cargo check -p fgos-node-addon -p fgos-run-result`.
- FR `test/runner/run-outcome.test.mjs test/runner/run-result-v2.test.mjs test/runner/run-result-v3-reader.test.mjs test/runner/assignment-runresult.test.mjs test/runner/execution/unit-summary.test.mjs test/runner/execution/legacy-seat-read.test.mjs test/git/native-load.test.mjs`
- `rg -n "deriveOutcome|deriveLegacyOutcome|deriveEvidenceFloor|RUN_RESULT_CONTRACT_V4|validateRunResultV4|native-v4|normalizeRunResultV2" src` → only the addon call site names.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A recorded category changes for a new record and a reader (hand-off selection, unit summary, metrics) acts differently | M × H | Node's categories win (vectors prove it); only reason strings may change, and only if no reader parses them. |
| The addon grows a dependency chain (`fgos-observe`) that does not build on one target | L × M | msvc and darwin checks in this phase; if one fails, the binding links only the derivation module (feature gate in `fgos-run-result`), reported. |
| A path that derives an outcome runs without the addon (a checkout `node bin/fgos.mjs` call) | M × M | Lead lists every caller with its door evidence; the checkout channel already refuses addon verbs by name (AGENTS.md), so it fails by name, never silently. |
| Git-lane addon edit without OPC review | L × M | OPC review before land (plan Landing). |

## Rollback

Revert the merge; re-activate the previous release (its addon has no binding; its Node derivation returns). On disk: lease refusals written V3 (old release reads V3); recorded reasons in Rust form on new records (old readers read `category`).

## Done when

Vector diff empty; Node derivation gone; one written version; `run-result.mjs` ≤ 1 150; OPC review recorded; landed with a direct-seat smoke and `fgos dispatch show-run` on the smoke's run; guide section written.

## Lead brief essentials

Vectors before code; Node's categories win; delete in the same change (L10); OPC reviews the addon diff. All plan.md lead rules apply.
