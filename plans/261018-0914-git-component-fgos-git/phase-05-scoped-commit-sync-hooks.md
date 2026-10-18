# Phase 05: ScopedCommit, Sync, write-scope leaf, hook contract, cutover grant

- **Depends on:** phase 02 (scope, Inspect), phase 04 (custody contract and handle).
- **Branch / worktree:** `git/p05-commit-sync`, `.claude/worktrees/git-p05`.
- **Model / effort:** opus, rigor critical; 32h (30h plus 2h for M10).
- **Parallel with:** phase 03 (disjoint module files).
- **Blocks:** the Event Store legacy cutover (it needs the cutover ScopedCommit and the hook grant on main first), phase 06.

## Context

- Spec §6 RUL84 (one Rust matcher, preserved grammar), §7 (env contexts, hook order, `cutoverGrant`, G-062), §8 (scoped commit, sync, G-071, G-202/Q5), §3 ScopedCommit, Sync, Checkpoint; R30 rows for ScopedCommit, Sync, SafeRestore of a linked worktree; §18 items 2 and 6.
- Event Store §18 step 5 (one commit on main deletes the tracked event files, `state.json` and two backups). The Event Store plan's commit (its phase 08 step 5) also adds the tracked fence file `.fgos/events` (its D18) and deletes tracked porting logs outside `.fgos`.
- Event Store M9 (ScopedCommit `sourceCommit` mode) is **not** planned here: no Git door in the signed spec writes a reviewed commit's bytes into the main checkout, so it needs amendment A2 in [plan.md](./plan.md#spec-amendments-needed-before-git-phase-01-freezes-its-interface), and A2 is needed only if the owner keeps Event Store Q5 at (b). With Q5 (a) this phase is unchanged.
- Current code: `src/runner/dispatch/write-scope.mjs` exports (`WriteScopeError` `:8`, `canonicalizeWriteEntry` `:25`, `canonicalizeWrites` `:53`, `expandGenerated` `:90`, `matchesWriteScope` `:130`, `partitionPaths` `:144`); `commit-unit-work.mjs:424-430` spawns the pre-commit hook file directly; `.githooks/pre-commit` refuses every staged `.fgos/` deletion at `:456-458` and checks the main-checkout borrower at `:499-511`.

## Requirements

1. **Write-scope leaf (RUL84):** crate `fgos-write-scope` at `packages/git/write-scope/`, depending on nothing in fgOS: canonicalize (trim, dot, separators, consecutive whole `**`), reject absolute, `..`, backslash, NUL, leading colon, embedded `**`; `*` within a segment and whole-segment `**` only; plain entries cover subtrees by whole segments; query bytes not trimmed; both rename ends checked; `.fgos` excluded even by `**`; generated grants through the same expansion; byte paths outside the grammar refused with a lossless encoding. Exported by the addon. A parity test runs the existing golden cases of `test/runner/write-scope.test.mjs` against both the Node module and the Rust leaf; the Node module becomes a facade in phase 07 (spec: "in the same switch").
2. **ScopedCommit in a linked worktree (runner commit):** `preflight` checks the trusted linked worktree, the verified `dispatch-cwd` lease (held rank 30 plus opaque handle, borrowed into every git child through `run_borrowed`), no foreign staged entries even in scope, no foreign `MERGE_HEAD`, and captures baseline ref and dirty paths with content. `commit` selects exactly the authorized paths (both rename sides, deletions), revalidates authority and state, stages literal paths through NUL pathspec stdin, commits with the consumer's message (G-059: Git validates encoding and length, never formats), installs TargetAttempt before the ref moves, verifies the committed set and tree after hooks, and returns `committed-but-contract-violation` with the real OID when a hook changed it. Failure unstages only its own entries; no-op is distinct from failure; resume commit-only keeps the captured intent and custody. Git never acquires 20 or 40 here.
3. **ScopedCommit in the main checkout:** Git takes main-checkout 50 in its scope; a request that would need both a borrowed 30 and 50 in one git child is refused (§18 item 2). Used by the Checkpoint adapter and the cutover commit.
4. **`cutoverGrant {exactPaths, legacyRefOid, sealDigest}`** on a main-checkout ScopedCommit intent. The hook allows the staged `.fgos/` deletions only when (a) it is the borrower of main 50 by the holder-lock §5 test, (b) the common-dir WAL holds a durable ScopedCommit intent for the operation id the driver passes in the hook context, whose `exactPaths` equal the staged `.fgos/` deletions byte for byte, whose record 0 names the `dev:ino` of the borrowed main-50 description, and whose chain has a TargetAttempt and no outcome (one shot: a grant whose operation has an outcome is spent), (c) `legacyRefOid` equals the current `refs/fgos/legacy` and `sealDigest` equals the digest of that commit's `seal.json`. Every other `.fgos` deletion stays refused, in that commit and outside it. No env variable, PID or `--no-verify` grants anything; the operation id in the hook env only names which record to check.
   - **How the hook reads the WAL.** The hook runs from the checkout (`.githooks/pre-commit:29` imports `../src/...`) and has no release manifest, so it does not load the addon. It execs the activated host route `fgos internal git-grant-check --protocol 1 --operation <id>` (resolved with `resolveActiveHostBin`, as the hook's borrower check already does), which links `fgos-git` and answers from the one WAL implementation. Host missing or protocol mismatch: refuse.
   - **Threat model.** The hook is a guard against fgOS's own and confined writers, not a security boundary against unconfined same-user code (which can run `git commit --no-verify`); spec §9 already puts raw external Git outside the guarantee.
5. **Hook contract (§7):** the driver's `HookContext` keeps Git's index/worktree/gitdir (including a temporary index); `hooksPath` resolves relative to the trusted main root. Hook order unchanged; only the grant check is added at the `.fgos` deletion guard. A kept diagnostic replay of `pre-commit` runs through `git hook run pre-commit` in the hook context, never a direct spawn of the hook file; E5 confirms `git hook run` on the floor, else the replay is dropped.
6. **Checkpoint adapter:** `checkpointTrackedFiles` for consumer-selected non-event tracked payload under main 50; detachable; never event files.
7. **Sync:** `start` merges a pinned target OID into the producer with `--no-commit --no-ff`, rerere and autoStash off; clean sync records two exact parents. With custody, scopable conflicts get a temporary resolver grant (G-071; producer `writeScope` unchanged; no grant on non-event `.fgos`, unscopable or forbidden paths); without custody, abort its own merge (Q5). `continue` refuses leftover conflict markers (seven or more `<`, `>` or `|` then whitespace or end; skip binary and non-regular), validates parents, `MERGE_HEAD`, index and custody, detects manual completion or abort, stages only owned conflict paths. `abort` preserves bytes. Sync never takes 20.
7a. **Addon required for linux-x64 from this phase's release (Event Store M10).** The release the Event Store cutover runbook activates in its step 0 contains this phase, and the release carrying the Event Store cutover change is later still. So from this phase `fgctl` (init, upgrade, rollback) refuses a linux-x64 candidate manifest without `components.nativeAddon`, or with one whose `capabilities` lack `git-wal-v1`, by name (`git-addon-missing`) before publishing the activation. The schema field stays `serde(default)` so older manifests still parse for the refusal message. windows-x64 stays optional until phase 07 (D11; the Event Store facade refuses on Windows by its D15). Spec §12 already requires a missing addon to fail before mutation; this moves the activation check earlier, it does not change the rule. Event Store §23.2 item 9 ("activation refuses a payload without it") is proven on linux-x64 against this check. Rollback to a release without the addon is refused by name, the same as C5 refuses one without `git-wal-v1` (spec §12 "refusing it with the incompatible operation/version named").
8. **Handover to the Event Store:** a short note to the Event Store plan lead with the cutover ScopedCommit call, its grant fields and the hook behaviour; this phase merges to main before the Event Store cutover change.

## Files

| Action | File |
|---|---|
| create | `packages/git/write-scope/**` (crate `fgos-write-scope`), `Cargo.toml` member |
| create | `packages/git/rust/src/{scoped_commit,sync}.rs`, `packages/git/node-addon/src/git/{scoped_commit,sync,write_scope}.rs`, `src/git/{scoped-commit,sync}.mjs` (and their `mod`/re-export lines) |
| edit | `packages/git/rust/src/driver.rs` (hook context only), `.githooks/pre-commit` (grant check at the `.fgos` deletion guard) |
| edit | `packages/distribution/rust/src/{init,verify}.rs`, `apps/fgctl/tests/git_wal_activation_gate.rs` (M10 linux-x64 addon check) |
| edit | `apps/fgos/src/main.rs` (route `internal git-grant-check`), `packages/git/contracts/internal-route.git-grant-check.v1.json` (create) |
| create | `test/git/scoped-commit.test.mjs`, `test/git/sync.test.mjs`, `test/git/cutover-grant.test.mjs`, `test/git/write-scope-parity.test.mjs` |
| edit | `docs/platform/git/spec.md` status line (ScopedCommit, Sync implemented) |

## Steps

1. Write-scope crate and parity test against the golden cases.
2. Hook context in the driver; `git hook run` probe.
3. ScopedCommit linked (with lease borrowing) and main (with 50); WAL `ScopedCommit` payload.
4. `cutoverGrant` and the hook check; tests for every refusal case.
5. Checkpoint adapter.
6. Sync start/inspect/continue/abort; WAL `Sync` payload.
6a. M10: `fgctl` linux-x64 addon check and its activation-gate test.
7. Code review unit (opus); merge to main; handover note to the Event Store lead.

## Validation

```bash
cargo test -p fgos-write-scope -p fgos-git -p fgos-node-addon -p fgos-distribution -p fgctl
cargo clippy -p fgos-write-scope -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
node --test test/git/scoped-commit.test.mjs test/git/sync.test.mjs test/git/cutover-grant.test.mjs test/git/write-scope-parity.test.mjs test/runner/write-scope.test.mjs test/e2e/main-checkout-borrow-hook.test.mjs
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<p05 build> npm test
```

Vectors: **V-SCOPE** golden grammar through the Rust leaf; **V-SYNC** clean two-parent sync, scoped resolver with custody, abort without custody, foreign `MERGE_HEAD` refused, manual completion detected, no useless worker; **V-CUSTODY (commit part)** missing, stale, released or never-locked lease refused, lease borrowed into the git children, commit retry; **V-TRUST (hook part)** genuine temporary index retained, poisoned env refused; **V-BORROW (full)** the existing alias, clean/smudge filter, hook, background and `gc.auto=1` probes and the sibling check, run through the new route with the lease and with main 50, plus parent death and a text-spoofed `FGOS_LOCK_FD`; **P-CUTOVER (implementation part)** grant allows exactly the listed deletions once, other `.fgos` deletions refused in the same commit and outside it, env/PID grant nothing, wrong `legacyRefOid` or `sealDigest` refused, a spent grant refused, a record naming another description refused, the real hook run in the main checkout under the activated release, with the Event Store's real commit shape (the event-file deletions plus the added fence file `.fgos/events` replacing the `.fgos/events/` directory, and the porting-log deletions outside `.fgos`), so the grant and the other hook guards are shown to accept exactly that commit and nothing more; **M10** `fgctl` refuses a linux-x64 candidate without `components.nativeAddon` or without `git-wal-v1` (init, upgrade and rollback), and accepts a windows-x64 candidate without it until phase 07; **V-PARITY (commit part)** committed set and messages match today's outputs on the shared fixtures.

## Risk

| Risk | L × I | Mitigation / signal and response |
|---|---|---|
| Rust matcher differs from Node on an edge path | Medium × High | Parity test over the golden set plus generated byte paths; any mismatch blocks merge. |
| The activated host is older than the hook's expected route protocol | Low × Medium | `--protocol 1` mismatch refuses by name; the cutover runs only after this phase's release is active on the workspace. |
| Event Store cutover lands before this phase | Low × High | Board edge: ES cutover blockedBy phase 05. |

## Rollback

Dormant ports plus one hook branch that only ever allows less than today unless a WAL grant exists. Revert the merge; the hook returns to refusing every `.fgos` deletion.
