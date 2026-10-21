# Phase lead report: durable sites, crate fixes, temp names, canonical twins

Branch harden/t0-p05-durable-canonical, base ea1de2a3f. Commits 1c7b6f8c5 (crate) and 934acb77f (Node sites).

## Sites moved (file, contract class, owning proof)

Replace-durable via `replaceDurably` (mode 0o644 except credentials 0o600):
- `src/workflow/case-runtime.mjs` `writeJsonAtomic` (gained directory fsync). Proof: crate `install.rs` replacement tests; `test/workflow/case-runtime.test.mjs` settle-pending/reservation cases.
- `src/workflow/case-bindings.mjs` `commitBinding`. Proof: `case-bindings.test.mjs` "only the owner of a pending record commits it".
- `src/runner/dispatch/provider-capacity.mjs` `writeState` (gained directory fsync; new post-install failure class below). Proof: `provider-capacity.test.mjs` (37 pass).
- `src/runner/dispatch/proof-helpers.mjs` `publishMutableProjection`. Proof: new `test/runner/proof-helpers.test.mjs`.
- `src/runner/dispatch/provider-credential-renewal.mjs` `writeFileAtomic` (0o600, gained directory fsync). Proof: `provider-credential-renewal.test.mjs` (104 pass).
- `src/runner/gateway-control.mjs` `writeRegistry` (was a plain `writeFileSync`). Proof: `gateway-control.test.mjs`.

Create-only via `installOnce` (second writer loses, never replaces):
- `run-lock.mjs` `publishNextGeneration`, `publishMarkerOnce`. Two-contender proof: `run-lock-identity.test.mjs` new "racing processes publish one marker and one next generation" (4 processes each); end-to-end race also in `assignment-dispatch.test.mjs` admission races.
- `proof-helpers.mjs` `publishImmutableProof`. Proof: `proof-helpers.test.mjs` 4-process race, only `proof.json` left in the directory.
- `case-bindings.mjs` `createPendingBinding` (existing 4-process race test kept as owner) and `ensureBindingsSentinel` (raced inside that same test, first call in each child).
- `case-runtime.mjs` `recordGateAnswerRound` (`wx` + file fsync). Not in the plan's four-site list but the plan's own `rg fsyncSync(` line for this file requires it to move; same class, same fsync cost. Proof: new 3-process race in `case-runtime.test.mjs`; losers get `gate-already-answered`.

Deleted: `writeFsyncedTemp`, `removeTempBestEffort` (run-lock), private `fsyncDirBestEffort` (proof-helpers), all replace/create bodies. Kept: `run-lock` `fsyncFileBestEffort`/`fsyncDirBestEffort` (SEAT and settlement callers), `case-bindings` `fsyncDir` (used by `unbindWorktree`).

Post-effect consequence: the one new failure class is "name installed, directory fsync failed" (error carries `installed: 'created'`, rethrown unchanged). For `provider-capacity` `writeState` the just-recorded lease is reported refused and freed by the existing dead-pid reclaim; generation/marker/proof names exist and the next read or publish sees them (idempotent shape).

## Temp names
`attestation-store.mjs` three sites now `uniqueTmpTag()`. `rg '\.tmp\.\$\{Date\.now\(\)\}' src` returns nothing.

## RT-M7 and S-F3
- Crate: `write_durably` returns right after the loser's temp removal when `installed == AlreadyExists` (no directory fsync). `InstallError` gained a `step` field (`name-check`, `temp-created`, `bytes-written`, `file-fsync`, `name-installed`, `temp-removed`, `parent-fsync`); Display prints `durable install failed at <step> (installed: created|already-exists|none): <cause>`; the addon `cause` carries that text. Proofs: `install.rs` `concurrent_writers_have_exactly_one_winner` (a late loser's checkpoints end at `temp-removed`, no `parent-fsync`) and `replacement_errors_report_effect_at_real_boundaries` (step and Display for both boundaries).
- Node: the door wrapper already unlinks `error.temporary` (phase 2); new assertion in `test/git/native-load.test.mjs`: a failed replace names `name-installed (installed: none)` and leaves no `.durable-file-*.tmp`.
- `treeDigest` NOT changed, following the plan body (a crash-retained temp must keep blocking `sweepOneStaging`); the brief's "treeDigest ignores .durable-file-*.tmp" and the plan's step 3 conflict with that body, I followed the body.

## Canonical twins: corpus runs
Script (not committed): `.fgos/runtime/tmp/canonical-corpus.mjs` in the worktree, run through the staged addon env. For each JSON/JSONL document and every object/array subtree to depth 3 it prints equality of the Node twin (proof-helpers form with the `undefined` filter; the plain key-sort form of recovery-planner and reconciliation-planner) against door `canonicalJson`.
- Corpus A: `/home/vantt/projects/forgent/.fgos/assignments` (this machine, 12868 files, 12865 documents, 4,265,981 subtrees, 0 skipped over 8 MiB): `{"mismatches":0}` "canonical-corpus: all equal" (4m37s).
- Corpus B: rest of `/home/vantt/projects/forgent/.fgos/**` plus `test/fixtures` (59 files, 143 documents, 1,483 subtrees): all equal.
- `.fgos/runs/**` does not exist here. The owner machine's `.fgos/**` was NOT run (no access); same script, `node run-corpus.mjs <dir>` after staging the addon, needs that run before landing if the board wants both machines.
- Parsed JSON cannot contain array holes or `undefined`, so those cases are structurally absent in the corpus.

Moved: `proof-helpers.mjs` (`export { canonicalJson } from door`, `computeSha256Digest` unchanged) and `reconciliation-planner.mjs` (`stable` removed, all uses `canonicalJson`; the door drops `undefined` members, so a fresh in-memory plan now compares equal to the plan read from disk where the old form compared `undefined` literals; in-flight plan keys change once, bounded by the 5 minute TTL). `test/event-store/canonical-vectors.test.mjs` now uses the door (the three vector files remain the one table; reference implementation retired, owner `packages/canonical-json/rust/src/lib.rs`).

Kept with reason comment: `effective-execution-contract.mjs` and `scripts/build-rust-distribution.mjs` and `scripts/measure-coordination-baseline.mjs` (handed to the parent plan's phase 07 / H11 as the plan says; the Rust `verify.rs` side untouched), `trust-store.mjs` `sortedJson` (codex byte order).

Decision for the owner: `recovery-planner.mjs` is NOT moved. Its module contract is purity and `test/verbs/dispatch-recovery.test.mjs` pins its imports to exactly `['node:crypto']`; the door import would break that pin (editing a pin test to fit is weakening), and the stored records (`recovery-commands.jsonl`) hold only the hash outputs, never the snapshot inputs, so no corpus can re-derive them (same shape as effective-execution-contract). The corpus above shows the form is byte-equal on real documents. Options: (a) keep local (now, with a reason comment), (b) hand to H11 with the contract change of lifting the purity pin. I did (a); H11 can take (b).

## Retired or rewritten tests
- `assignment-dispatch.test.mjs` "an interrupted assignment.json publish leaves it cleanly absent..." and its `injectSingleWriteFailureForDir` helper (hooked JS `openSync`/`writeSync` on a `.tmp-*` file; that path no longer exists). New owners: crate `install.rs` `file_size_limit_never_installs_truncated_record` (a short write never installs) and `replacement_errors_report_effect_at_real_boundaries`; Node wiring `native-load.test.mjs` (failed write leaves no temporary); the retry-recovers half had no remaining mechanism (no partial JSON can exist).
- `provider-credential-renewal.test.mjs` marker test: the `fs.renameSync` interception retired (the rename is native); owner of atomic replace is `install.rs`; the torn-marker and no-leftover-temp assertions stay.
- `dispatch-recovery.test.mjs` F5 test: the `fs.linkSync` hook cannot see the native install; the injection now fires on the first Node fs call after the generation record appears on disk, same invariant (reverting the re-check reorder still fails it).
- `attempt-steps.test.mjs` and `sweep.test.mjs` fixtures pass the FGOS_* variables to step subprocesses (as `attemptStepEnv` does in production), because the envelope digest and the finalizer now reach the door.

## Concern
`readEnvelope`'s digest (and `finalizeAttemptHome`'s marker writes) now require the native door in the step process. Production passes all FGOS_* variables to steps (`attemptStepEnv`, `direct-launch.mjs:141`), so the door is found; a step started with a bare environment now exits 70 instead of working.

## Verification seen
- `cargo test -p fgos-durable-file -p fgos-canonical-json -p fgos-node-addon -p fgos-event-store -p fgos-run-supervisor -p fgos-terminal-control`: 65 suites, 0 failed (CARGO_TARGET_DIR on ext4).
- Single-file `node --test` with the staged addon: case-bindings 6, case-runtime 7, canonical-vectors 3, run-lock-identity 4, provider-capacity 37, provider-credential-renewal 104, gateway-control 20, effective-execution-contract 14, dispatch-reconciliation-import-graph 1, dispatch-recovery 31, native-load 14 (1 not run), proof-helpers 2, attempt-steps 10, sweep 6, one-door 6, architecture, conductor-case, case-authority, fgos-case-doors and the wider run-supervisor, runner/provider-*, runner/dispatch-*, runner/execution/* sets: all green except `test/run-supervisor/runtime-dir.test.mjs` (2) and `test/setup/run-supervisor-checks.test.mjs` runtime-socket-dir (4), which fail identically on the unmodified base (verified with stash).
- `rg` lines: `fsyncSync(` only in run-lock `:63,:81` (kept helpers), case-bindings `fsyncDir`, credential-renewal `syncPath` (unrelated tree sync); canonical-twin rg shows only the commented twins plus `recovery-planner.mjs`.
- Census regenerated in the same commit.
- Full `npm test` not run (the big lead runs it).

## Size (git diff --stat ea1de2a3f..HEAD, excluding this report)
Node (src, scripts): -137 net. Rust (src): +79 (plan estimated +10: the `step` field threads through every error site, plus formatter changes). Tests: +41 net (race tests +, retired interrupted-publish test -80).

## Not done
Owner-machine corpus run; `treeDigest` filter (conflict above); `recovery-planner` move (decision above).

Status: DONE_WITH_CONCERNS
