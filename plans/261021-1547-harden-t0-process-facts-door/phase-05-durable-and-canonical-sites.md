---
phase: 05
title: "Durable sites onto durable-file, durable-file crate fixes, temp names from uniqueTmpTag, canonical twins after the corpus proof"
status: done
depends_on: [02, 03]
parallel: "sequential: after phase 03 (shares run-lock.mjs, proof-helpers.mjs, provider-capacity.mjs, gateway-control.mjs); phase 06 starts after it"
effort: ~1d
net_size: "Node −145 / Rust +10 / tests +20 (estimate)"
---

# Phase 05 — Durable and canonical sites

## Context

[plan.md](plan.md) Facts ("Durable and canonical Node sites"); arbitration Part A rows `durable-file` and `canonical-json`, §3 rows F-A4, F-A2, RT-M7, S-A1/F-A5, S-F3; D4 (no new shared write helper), D5 (the four Rust no-fsync twins stay); red-team disagreement 5 (the four create-only sites already fsync file and directory, so the move adds no cost and fixes F-A4 and the `wx` partial-visibility race at `case-bindings.mjs:99-105`); phase 01 §C rule (a canonical twin moves only after a byte-equality run over its persisted corpus; producer and verifier move together).

## Requirements

- **Durable replace (5 sites) → `replaceDurably`:** `src/workflow/case-runtime.mjs:20-30`, `src/workflow/case-bindings.mjs:118-131` (`commitBinding`), `src/runner/dispatch/provider-capacity.mjs:367-380` (`writeState`), `src/runner/dispatch/proof-helpers.mjs:112-126` (`publishMutableProjection`), `src/runner/dispatch/provider-credential-renewal.mjs:105-120` (`writeFileAtomic`, mode `0o600`, the crate's default). Each keeps its export name and signature; the body becomes one door call (`path.dirname`, `path.basename`, bytes, mode). The three sites without a directory fsync today (`case-runtime`, `provider-capacity`, `provider-credential-renewal`) gain it (+5 ms each, cold paths). F-A2: `src/runner/gateway-control.mjs:121-132` `writeRegistry` becomes `replaceDurably` too (phase 3 left it).
- **Create-only durable (4 sites) → `installOnce`:** `run-lock.mjs:213-237` (`publishNextGeneration`, the generation record) and `:247-261` (`publishMarkerOnce`), `proof-helpers.mjs:86-110` (`publishImmutableProof`), `case-bindings.mjs:97-112` (`createPendingBinding`, `wx` + fsync) and `:45-56` (`ensureBindingsSentinel`, `wx`). (Line numbers corrected after red-team Scope-F7; the first draft cited a renumbered excerpt.) Class preserved: the second writer loses (`'already-exists'`), never a replace. `writeFsyncedTemp` (`run-lock.mjs:75-85`), `removeTempBestEffort` (`:128-134`) and `proof-helpers.mjs:73-84` (`fsyncDirBestEffort`, private) are deleted once no caller remains. **`run-lock.mjs:90-106` `fsyncFileBestEffort` and `:108-126` `fsyncDirBestEffort` stay**: `assignment-runner.mjs:78-79, :959, :966, :977, :993` (SEAT carry list) and `settlement.mjs:16, :695` call them for files this module does not write; they are not T0's. F-A4 is fixed by construction for the moved sites: a directory-fsync failure after install surfaces as a named error carrying `installed`, never success. **Post-effect rule at each moved site** (red-team FM-07): when the error carries `installed: 'created'` the name exists on disk and the caller must not act as if nothing happened: every moved site rethrows the named error (no new result field), and the report states the consequence per site: for `provider-capacity.mjs` `writeState` (`:367-380`) the lease just recorded is reported as `refused` by `assignment-runner.mjs:1641` and released only when `selected` (`:2667`), so it leaks until the existing dead-pid reclaim (`reclaimDeadLeases`, `:575-585`) collects it after the runner exits; for the generation and marker publishers (`run-lock.mjs:213-261`) and the proofs, the name exists and the next `acquireRunControl` re-read (`:306`) or publish sees it, which is the idempotent shape they already have. Today none of these sites can fail after the rename (no directory fsync), so this is the one new failure class the move adds; it is named here rather than hidden.
- **RT-M7 (crate):** `packages/durable-file/rust/src/lib.rs:285` skips `sync_directories` when `installed == Installed::AlreadyExists` (nothing was installed; the loser's temp is already removed at `:276`). **S-F3:** `Display` (`:30-33`) prints the step name (`temp-created`, `bytes-written`, `file-fsync`, `name-installed`, `temp-removed`, `parent-fsync`) and `installed` as `created|already-exists|none`, never `{:?}` of an `Option`. Owning proofs: `tests/install.rs` (`concurrent_writers_have_exactly_one_winner`, `replacement_errors_report_effect_at_real_boundaries`) extended by one assertion each; no new test file.
- **RT-M7 (Node):** the `replaceDurably`/`installOnce` wrappers in `src/native/door.mjs` **always** unlink `error.temporary` before rethrowing (phase 2 contract; red-team Sec-F6 corrected the first draft's "when the caller does not inspect it", which a throwing function cannot know), so a failed credential write leaves no `.durable-file-*.tmp` with token bytes in a live store. Consequently `treeDigest` (`provider-credential-renewal.mjs:721-734`) is **not** changed: a temp retained by a crash between the Rust write and the unlink must keep blocking `sweepOneStaging` (`:739-762`) from deleting a directory with uninspected bytes. Modes are explicit per site: `writeFileAtomic` passes `0o600` (today's `openSync(tmp, 'w', 0o600)`, `:108`); the other four replace sites and the four create-only sites pass `0o644` (today's `openSync(..., 'w')` default under the usual umask), so no file narrows or widens.
- **Temp names:** every remaining Node write-then-rename takes its temp name from `uniqueTmpTag()` (`src/util/unique-tmp-tag.mjs`): `src/runner/dispatch/confinement/attestation-store.mjs:184, :212, :312` (pid-less today, collide across processes in the same ms). No new shared helper (D4); the per-module no-fsync helpers stay as they are otherwise; SEAT files (`run.mjs:51`, `unit-summary.mjs:196`) and GIT's `worktree.mjs:236` are not touched.
- **Canonical twins, only after the corpus proof.** Corpus and command, per twin:
  - `proof-helpers.mjs:11-23` (`canonicalJson`, used by `computeSha256Digest`): corpus = every stored proof and contract digest under the test fixtures and under this checkout's `.fgos/assignments/**` and `.fgos/runs/**` on both machines (`rg -l '"sha256:' .fgos/assignments .fgos/runs`, read each JSON, re-digest its input through the Node twin and through the door, compare). Command: a throwaway script in `.fgos/runtime/tmp/canonical-corpus.mjs` (not committed) that prints `file | twin digest | door digest | equal`; the report pastes the summary line. Expected equal: this twin filters `undefined` and the door refuses it; a corpus document with an `undefined` member cannot exist (it was serialised). Array holes: assert none in the corpus.
  - `effective-execution-contract.mjs:39-48` (persists `dispatchPlanHash`, `configHash`, `:270-271`): **not moved in T0; handed to the parent plan's phase 07 (H11) with a one-line reason comment.** A corpus run cannot decide it (red-team FM-09/Scope-F2): the stored contract keeps only the two hashes, never the `dispatchPlan`/`runnerConfig` inputs (`:270-271, :320-321`), and a live input routinely carries `undefined` members (`assignment-policy.mjs:527` sets `persona.source` to `undefined` for every non-reviewer role; `stripSecrets`, `:68-87`, keeps it), which this twin serialises as the literal `undefined` and the door drops. The twin is a contract change of persisted provenance, not a byte-equal move.
  - `recovery-planner.mjs:69-74` and `reconciliation-planner.mjs:24` (`reconcile_<hash>` proof names at `:62`; compares at `:240, :304, :344`): corpus = stored recovery plans and reconcile proofs under `.fgos/**` on both machines, same script. Both are plain key-sort serialisers over JSON documents read from disk; expected byte-equal.
  - `test/event-store/canonical-vectors.test.mjs:7-11`: the reference implementation is replaced by the door's `canonicalJson`; the three vector files stay the one table. Owner of canonical bytes: `packages/canonical-json/rust/src/lib.rs:67-86`.
  - `scripts/build-rust-distribution.mjs:37-47` / `packages/distribution/rust/src/verify.rs:46-76` (producer and verifier of release-manifest digests): **not moved in T0; handed to phase 07 (H11) now**, independent of any corpus result (red-team FM-01/AD-08): the producer computes the digest (`:470`, via `computeArtifactDigest` `:114-117`) before the manifest it would need to load the door exists, so the move is a bootstrap cycle unless the script passes the just-staged addon's descriptor explicitly (the pattern of `:522`) in a child process; that is Packaging's design. `scripts/measure-coordination-baseline.mjs:28` goes with it (a script in a checkout has no release to load).
  - `src/runner/dispatch/trust-store.mjs:379-385` `sortedJson` stays (codex's own byte order, not RFC 8785): a one-line comment says why.
- `recovery-planner.mjs` and `reconciliation-planner.mjs` import `canonicalJson` from `src/native/door.mjs` directly; `proof-helpers.mjs:11-23` becomes the **one** re-export line `export { canonicalJson } from '../../native/door.mjs'` (the arbitration's 1-line Node budget; `assignment-runner.mjs:116-117` imports it from there: SEAT carry list, untouched; red-team Scope-F10).

## Files

**Modify**: the Node sites listed; `src/native/door.mjs` (temp unlink in the wrapper); `packages/durable-file/rust/src/lib.rs:30-33, :285`; `packages/durable-file/rust/tests/install.rs`; `test/event-store/canonical-vectors.test.mjs`; `test/runner/run-lock-identity.test.mjs:76-110` gains nothing (the generation ledger behaviour is unchanged); `test/workflow/case-bindings.test.mjs` and `test/workflow/case-runtime.test.mjs` gain one two-contender wiring case each (per phase 01's rule: "two contenders, exactly one wins" per moved create-only site; the Rust owner is `install.rs` `concurrent_writers_have_exactly_one_winner`); `test/runner/provider-capacity.test.mjs:367` already owns the lease race; `packages/git/contracts/mutation-census.v1.json`; `CHANGELOG.md` (durable-file errors name step and effect).

**Create**: none committed (the corpus script lives in `.fgos/runtime/tmp/`).

**Delete**: `run-lock.mjs:75-85, :128-134`, `proof-helpers.mjs:73-84`, the five replace helpers' bodies, the four create-only bodies, the bodies of the three moved canonical twins (`proof-helpers`, `recovery-planner`, `reconciliation-planner`).

**Tests to retire**: the Node reference implementation in `canonical-vectors.test.mjs:7-11` (owner: `packages/canonical-json/rust/src/lib.rs:67-86`, wired by the same test through the door).

## Steps

1. Crate fixes RT-M7 and S-F3 with the two `install.rs` assertions; `cargo test -p fgos-durable-file`.
2. The five replace sites, then the four create-only sites, then `gateway-control.mjs` `writeRegistry`; run each site's owning test after each edit.
3. Temp names from `uniqueTmpTag` in `attestation-store.mjs`; `treeDigest` filter.
4. The corpus runs for `proof-helpers`, `recovery-planner` and `reconciliation-planner` on this machine (and the owner machine's `.fgos/**` through the board message); paste the summary lines. Move the twins that pass; leave any that fail, plus `effective-execution-contract` and the release pair, with the reason and the H11 hand-off line in the report.
5. Census; focused tests; `npm test` once; report with the per-site cost line (before/after ms, from the baseline table) and the corpus table.

## Verification (exact)

- `cargo test -p fgos-durable-file`
(One-file runs use the `runSelectedTests` one-liner of phase 1.)
- `test/workflow/case-bindings.test.mjs test/workflow/case-runtime.test.mjs test/runner/run-lock-identity.test.mjs test/runner/provider-capacity.test.mjs test/runner/provider-credential-renewal.test.mjs test/runner/gateway-control.test.mjs`
- `test/event-store/canonical-vectors.test.mjs test/runner/effective-execution-contract.test.mjs test/runner/dispatch-reconciliation-import-graph.test.mjs`
- `rg -n "fsyncSync\(" src/workflow/case-runtime.mjs src/runner/dispatch/proof-helpers.mjs src/runner/dispatch/provider-capacity.mjs src/runner/dispatch/provider-credential-renewal.mjs` → nothing, and in `src/workflow/case-bindings.mjs` only the `fsyncDir` helper (`:30-37`) that `unbindWorktree` (`:184`) still uses, and in `run-lock.mjs` only `:94` and `:112` (the two kept best-effort helpers). `src/workflow/store.mjs:116, :125, :230` are the append ledger and stay.
- `rg -n "function (canonical\w*|stable\w*)|const stable\b" src scripts` → only `trust-store.mjs:379` (`sortedJson`), `effective-execution-contract.mjs:39` and `scripts/build-rust-distribution.mjs:37`, `scripts/measure-coordination-baseline.mjs:28` (each with its H11 reason comment).
- `rg -n "\.tmp\.\$\{Date\.now\(\)\}" src` → nothing.

## Net size

Node: five replace helpers −68 + calls +10; four create-only −60 (the two best-effort helpers stay); three canonical twins −24 + imports +3; attestation names 0; gateway `writeRegistry` −6 → ≈ −145. Rust: +10 (RT-M7 branch, Display). Tests: +20 (two wiring cases, two assertions, the reference implementation −5).

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
