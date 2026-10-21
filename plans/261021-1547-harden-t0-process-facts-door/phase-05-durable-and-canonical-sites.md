---
phase: 05
title: "Durable sites onto durable-file, durable-file crate fixes, temp names from uniqueTmpTag, canonical twins after the corpus proof"
status: pending
depends_on: [02, 03]
parallel: "sequential: after phase 03 (shares run-lock.mjs, proof-helpers.mjs, provider-capacity.mjs, gateway-control.mjs); phase 06 starts after it"
effort: ~1d
net_size: "Node −160 / Rust +10 / tests +20 (estimate)"
---

# Phase 05 — Durable and canonical sites

## Context

[plan.md](plan.md) Facts ("Durable and canonical Node sites"); arbitration Part A rows `durable-file` and `canonical-json`, §3 rows F-A4, F-A2, RT-M7, S-A1/F-A5, S-F3; D4 (no new shared write helper), D5 (the four Rust no-fsync twins stay); red-team disagreement 5 (the four create-only sites already fsync file and directory, so the move adds no cost and fixes F-A4 and the `wx` partial-visibility race at `case-bindings.mjs:99-105`); phase 01 §C rule (a canonical twin moves only after a byte-equality run over its persisted corpus; producer and verifier move together).

## Requirements

- **Durable replace (5 sites) → `replaceDurably`:** `src/workflow/case-runtime.mjs:20-30`, `src/workflow/case-bindings.mjs:118-131` (`commitBinding`), `src/runner/dispatch/provider-capacity.mjs:367-380` (`writeState`), `src/runner/dispatch/proof-helpers.mjs:112-126` (`publishMutableProjection`), `src/runner/dispatch/provider-credential-renewal.mjs:105-120` (`writeFileAtomic`, mode `0o600`, the crate's default). Each keeps its export name and signature; the body becomes one door call (`path.dirname`, `path.basename`, bytes, mode). The three sites without a directory fsync today (`case-runtime`, `provider-capacity`, `provider-credential-renewal`) gain it (+5 ms each, cold paths). F-A2: `src/runner/gateway-control.mjs:121-132` `writeRegistry` becomes `replaceDurably` too (phase 3 left it).
- **Create-only durable (4 sites) → `installOnce`:** `run-lock.mjs:102-113` (generation record) and `:125-139` (`publishMarkerOnce`), `proof-helpers.mjs:86-110` (`publishImmutableProof`), `case-bindings.mjs:97-112` (`createPendingBinding`, `wx` + fsync) and `:45-56` (`ensureBindingsSentinel`, `wx`). Class preserved: the second writer loses (`'already-exists'`), never a replace. `writeFsyncedTemp` (`run-lock.mjs:51-61`), `fsyncDirBestEffort` (`:75-93`), `removeTempBestEffort` (`:95-99`) and `proof-helpers.mjs:73-84` are deleted once no caller remains (`fsyncFileBestEffort`, `run-lock.mjs:66-73`, stays if it has a caller: check with `rg -n fsyncFileBestEffort src`). F-A4 is fixed by construction: a directory-fsync failure after install surfaces as a named error carrying `installed`, never success.
- **RT-M7 (crate):** `packages/durable-file/rust/src/lib.rs:285` skips `sync_directories` when `installed == Installed::AlreadyExists` (nothing was installed; the loser's temp is already removed at `:276`). **S-F3:** `Display` (`:30-33`) prints the step name (`temp-created`, `bytes-written`, `file-fsync`, `name-installed`, `temp-removed`, `parent-fsync`) and `installed` as `created|already-exists|none`, never `{:?}` of an `Option`. Owning proofs: `tests/install.rs` (`concurrent_writers_have_exactly_one_winner`, `replacement_errors_report_effect_at_real_boundaries`) extended by one assertion each; no new test file.
- **RT-M7 (Node):** the `replaceDurably` wrapper in `src/native/door.mjs` unlinks `error.temporary` when the caller does not inspect it (every Node caller today removes its temp on failure: `writeFileAtomic:117`); `provider-credential-renewal.mjs:728` `treeDigest` also ignores `.durable-file-*.tmp`.
- **Temp names:** every remaining Node write-then-rename takes its temp name from `uniqueTmpTag()` (`src/util/unique-tmp-tag.mjs`): `src/runner/dispatch/confinement/attestation-store.mjs:184, :212, :312` (pid-less today, collide across processes in the same ms). No new shared helper (D4); the per-module no-fsync helpers stay as they are otherwise; SEAT files (`run.mjs:51`, `unit-summary.mjs:196`) and GIT's `worktree.mjs:236` are not touched.
- **Canonical twins, only after the corpus proof.** Corpus and command, per twin:
  - `proof-helpers.mjs:11-23` (`canonicalJson`, used by `computeSha256Digest`): corpus = every stored proof and contract digest under the test fixtures and under this checkout's `.fgos/assignments/**` and `.fgos/runs/**` on both machines (`rg -l '"sha256:' .fgos/assignments .fgos/runs`, read each JSON, re-digest its input through the Node twin and through the door, compare). Command: a throwaway script in `.fgos/runtime/tmp/canonical-corpus.mjs` (not committed) that prints `file | twin digest | door digest | equal`; the report pastes the summary line. Expected equal: this twin filters `undefined` and the door refuses it; a corpus document with an `undefined` member cannot exist (it was serialised). Array holes: assert none in the corpus.
  - `effective-execution-contract.mjs:39-48` (persists `dispatchPlanHash`, `configHash`, `:270-271`): same corpus run over every stored `effective-execution-contract.json`. If any stored hash was computed over bytes containing the literal `undefined` (S-A1), that document's hash cannot be reproduced by any JSON serialiser: report the count; the twin still moves (the hash is provenance, and the new producer refuses non-JSON by name) **only if the count is zero**; otherwise this twin is a contract change handed to the parent plan's phase 07 (H11 shape) and stays, with a one-line reason comment.
  - `recovery-planner.mjs:69-74` and `reconciliation-planner.mjs:24` (`reconcile_<hash>` proof names at `:62`; compares at `:240, :304, :344`): corpus = stored recovery plans and reconcile proofs under `.fgos/**` on both machines, same script. Both are plain key-sort serialisers over JSON documents read from disk; expected byte-equal.
  - `test/event-store/canonical-vectors.test.mjs:7-11`: the reference implementation is replaced by the door's `canonicalJson`; the three vector files stay the one table. Owner of canonical bytes: `packages/canonical-json/rust/src/lib.rs:67-86`.
  - `scripts/build-rust-distribution.mjs:37-47` / `packages/distribution/rust/src/verify.rs:46-76` (producer and verifier of release-manifest digests, UTF-8 key order and `n.to_string()` numbers): corpus = the manifests of every release under `~/.local/state/fgos/releases/` on both machines and the three workspaces' activations; moved together **only** if byte-equal for every manifest; otherwise handed to phase 07 (H11) and left as is, with the count in the report. `scripts/measure-coordination-baseline.mjs:28` follows the same rule (expected: no corpus, so it simply imports the door).
  - `src/runner/dispatch/trust-store.mjs:379-385` `sortedJson` stays (codex's own byte order, not RFC 8785): a one-line comment says why.
- Each moved twin becomes `export { canonicalJson } from '../../native/door.mjs'` (or an import) so its callers do not change; `proof-helpers.mjs` keeps exporting `canonicalJson` (`assignment-runner.mjs` imports it: SEAT carry list, untouched).

## Files

**Modify**: the Node sites listed; `src/native/door.mjs` (temp unlink in the wrapper); `packages/durable-file/rust/src/lib.rs:30-33, :285`; `packages/durable-file/rust/tests/install.rs`; `test/event-store/canonical-vectors.test.mjs`; `test/runner/run-lock-identity.test.mjs:76-110` gains nothing (the generation ledger behaviour is unchanged); `test/workflow/case-bindings.test.mjs` and `test/workflow/case-runtime.test.mjs` gain one two-contender wiring case each (per phase 01's rule: "two contenders, exactly one wins" per moved create-only site; the Rust owner is `install.rs` `concurrent_writers_have_exactly_one_winner`); `test/runner/provider-capacity.test.mjs:367` already owns the lease race; `packages/git/contracts/mutation-census.v1.json`; `CHANGELOG.md` (durable-file errors name step and effect).

**Create**: none committed (the corpus script lives in `.fgos/runtime/tmp/`).

**Delete**: `run-lock.mjs:51-61, :75-99` (if no caller), `proof-helpers.mjs:73-84`, the five replace helpers' bodies, the four create-only bodies, the four moved canonical twins' bodies.

**Tests to retire**: the Node reference implementation in `canonical-vectors.test.mjs:7-11` (owner: `packages/canonical-json/rust/src/lib.rs:67-86`, wired by the same test through the door).

## Steps

1. Crate fixes RT-M7 and S-F3 with the two `install.rs` assertions; `cargo test -p fgos-durable-file`.
2. The five replace sites, then the four create-only sites, then `gateway-control.mjs` `writeRegistry`; run each site's owning test after each edit.
3. Temp names from `uniqueTmpTag` in `attestation-store.mjs`; `treeDigest` filter.
4. The corpus runs, one per twin, on this machine; ask the owner machine's session (via the board) to run the same script for its three workspaces for the release-manifest pair only; paste the summary lines. Move the twins that pass; leave the others with the reason and the H11 hand-off line in the report.
5. Census; focused tests; `npm test` once; report with the per-site cost line (before/after ms, from the baseline table) and the corpus table.

## Verification (exact)

- `cargo test -p fgos-durable-file`
- `node scripts/run-tests.mjs test/workflow/case-bindings.test.mjs test/workflow/case-runtime.test.mjs test/runner/run-lock-identity.test.mjs test/runner/provider-capacity.test.mjs test/runner/provider-credential-renewal.test.mjs test/runner/gateway-control.test.mjs`
- `node scripts/run-tests.mjs test/event-store/canonical-vectors.test.mjs test/runner/effective-execution-contract.test.mjs test/runner/dispatch-reconciliation-import-graph.test.mjs`
- `rg -n "fsyncSync\(" src/workflow src/runner/dispatch/run-lock.mjs src/runner/dispatch/proof-helpers.mjs src/runner/dispatch/provider-capacity.mjs src/runner/dispatch/provider-credential-renewal.mjs` → nothing (the no-fsync class never had one; the durable class is on the crate).
- `rg -n "function (canonical\w*|stable\w*)|const stable\b" src scripts` → only the twins kept with a reason (`trust-store.mjs:379`, and the release pair if its corpus failed).
- `rg -n "\.tmp\.\$\{Date\.now\(\)\}" src` → nothing.

## Net size

Node: five replace helpers −68 + calls +10; four create-only −75; canonical twins −32 + imports +4; attestation names 0; `treeDigest` +1 → ≈ −160. Rust: +10 (RT-M7 branch, Display). Tests: +20 (two wiring cases, two assertions, the reference implementation −5).

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A create-only site silently becomes a replace | L × H | `installOnce` only; the two-contender wiring case per site; the Rust owner proves `AlreadyExists`. |
| The crate's umask-filtered mode narrows or widens a file's permissions versus today | M × M | Replace sites pass the mode they used (`0o600` for credentials, default elsewhere); `trust-store.mjs` (mode-preserving) is not moved. |
| The corpus is incomplete (one machine, one workspace) | M × H | Both machines and the three workspaces are named per twin; a twin without a complete run stays. |
| `effective-execution-contract` hashes over `undefined` exist in stored contracts | M × M | Counted; if non-zero the twin stays and is handed to phase 07 with the count. |
| The directory fsync added to three sites slows a hot path | L × L | All three are cold (case ledger, lease ledger, credential copy); baseline table numbers cited in the report. |

## Rollback

Revert the phase's commits. Files written by the crate are ordinary files with the same names; the previous release reads them. Durable-file error text changes only logs.

## Done when

The nine durable Node sites call the door with their class preserved; F-A4 and F-A2 are closed by construction; RT-M7 and S-F3 are in the crate with proofs; every canonical twin is either moved with a byte-equal corpus line in the report or kept with the reason and the hand-off; the `rg` lines hold.

## Lead brief essentials

Delete list: the helper bodies named above. Find the owning test before writing a new one (`install.rs`, the per-site test files). Δ-lines per language. Report only what you saw yourself (paste the corpus summary). No new shared write helper; no edit to SEAT or GIT files. Report name from `fgos convention name --json`.
