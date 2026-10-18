# Phase 02: Rust LockScope bridge, Inspect, Refs, Remote

- **Depends on:** phase 01 merged (crate, driver, WAL, addon).
- **Branch / worktree:** `git/p02-scope-refs`, `.claude/worktrees/git-p02`.
- **Model / effort:** sonnet (advanced), rigor high; 24h.
- **Parallel with:** phase 04 (disjoint files).

## Context

- Spec §5 LockScope option (a), the R30 table rows for Refs, Remote and Publication; §3 Inspect, Refs, Remote; §2 result codes (`shallow-history-incomplete`, ancestry yes/no/error); §7 trunk resolution; §10 payloads `RefUpdate`, `RefDelete`, `RemoteTransfer`.
- Holder-lock §5 (borrower test), §9 (Node `LockScope`, handles opaque through a `WeakMap`, `src/holder-lock/index.mjs:62-108`), §19 (a never-locked description passes the try-lock).
- Scout: Rust has no LockScope and does not read the registry; Node's rank check is `src/holder-lock/lock-scope.mjs:27-40`.

## Requirements

1. **Rust `LockScope`** in `fgos-holder-lock` (`src/scope.rs`): reads the same `lock-registry.v1.json` (embedded at build from `packages/holder-lock/contracts/`, one source); `LockScope::seeded(held)` takes the caller's held locks as verified handles; `acquire(name, params, wait)` refuses with `lock-order-violation {held, acquiring}` unless the rank is above every held rank; two locks of one rank are refused; release closes descriptions before the operation returns. No process-wide rank set.
2. **Held-lock handover, opaque end to end (spec §5).** Holder-lock gains a non-owning `BorrowedHandle` in `port.rs`: it `dup`s the description with `CLOEXEC` at entry, runs no `before_close`, verifies the three-condition test, and is closed before the operation returns; `run_borrowed` and `LockScope::seeded` accept it. On the Node side a separate module `src/holder-lock/native-handover.mjs` (imported only by `src/git/native.mjs`; a rule in `test/architecture.test.mjs` enforces that) raises the handle's `borrows` for the whole native call, so `release()` cannot close it mid-call, and passes the description to the addon once, which wraps it as an N-API External. At load the addon hands a private registration capability to the first caller only (`native.mjs`); Rust accepts only Externals it minted through that capability, so a raw fd number or a description opened outside holder-lock is refused. Rust verifies each handed lock before any effect and again before the irreversible boundary; a held-rank number with no verified handle confers nothing. **Windows:** the hold transport keeps the lock in a helper process (`src/holder-lock/driver.mjs:31`), so no description exists in Node; every lock-taking typed operation refuses on win32 with `git-lock-handover-unsupported` until open question Q6 is decided.
3. **Inspect:** `resolveRef`, `status` (porcelain v2, `-z`, explicit untracked), `diff` (`--no-relative`, `-z`, `--no-renames` or both ends), `ancestry` (yes/no/error; `shallow-history-incomplete` across a shallow boundary), `readObjects` and `pathsAtRevision` (batched, absent distinct from error), `listWorktrees` (`-z` porcelain), `compareContent`, `snapshotWrites`. Every call `--no-optional-locks`, byte-safe paths, bounded and paginated. Trunk: explicit consumer target, then remote default, then validated attached main branch; ambiguity or absence is named, never thrown.
4. **Refs on `refs/heads/*`:** `ensureBranch`, `advanceRef`, `deleteRef`, `fastForwardCheckedOut`. Git takes worktree-admin 40 in the Rust scope; under that one hold it revalidates every registered checkout (main and linked; symbolic HEAD to an unborn name counts), installs TargetAttempt, runs the exact-old `update-ref --no-deref`, reads back the ref and the checkouts, then releases 40. A held 40, 50, 60 or 70 is refused with `lock-order-violation` before any effect. An in-use branch is refused. A switch seen at read-back is `recovery-required`. `fastForwardCheckedOut` requires the verified `dispatch-cwd` lease of the one worktree holding the branch, a clean checkout, fast-forward only, and updates that tree under the lease.
5. **Remote** (non-event refs): `fetchRefs`, `pushRefs`, `inspectRemote`; explicit mapping only; no implicit all-refs, no push-config change, no force; `RemoteTransfer` payload with TargetAttempt; a lost acknowledgement is `remote-outcome-unknown`. Credential helpers and transport are Remote capabilities only; never enabled for other ports.
6. **Census before phase 07.** Run the spec §12 detection rule over `src`, `bin`, `scripts`, `packages`, `apps`, `.githooks` and shipped skills and publish the list of every `git` spawn site with its family and owner phase in the phase report (red team: about 42 files spawn git today). Phase 07 sizes its families from this list.

Each later phase adds its own Rust module, addon module, facade module and their `mod`/re-export lines; no empty scaffolding is created here.

## Files

| Action | File |
|---|---|
| create | `packages/holder-lock/rust/src/scope.rs`, `packages/holder-lock/rust/tests/scope_rank.rs` |
| edit | `packages/holder-lock/rust/src/lib.rs` (export), `packages/holder-lock/rust/src/port.rs` (`BorrowedHandle`, `run_borrowed` accepts it) |
| create | `src/holder-lock/native-handover.mjs`; edit `test/architecture.test.mjs` (importer rule) |
| create | `packages/git/rust/src/{inspect,refs,remote}.rs` with their `mod` lines |
| create | `packages/git/node-addon/src/git/{inspect,refs,remote}.rs` |
| create | `src/git/{inspect,refs,remote}.mjs`; `src/git/index.mjs` re-exports |
| create | `test/git/inspect.test.mjs`, `test/git/refs.test.mjs`, `test/git/remote.test.mjs`, `test/git/lock-handover.test.mjs` |
| edit | `docs/architecture-manifest.json` (new `src/git/*` rows) |

## Steps

1. `scope.rs` with registry loading and rank rule; unit tests for every R30 row's "may already be held" set (spec §5 table).
2. `BorrowedHandle`, `native-handover.mjs`, addon capability and Externals; tests for never-locked, released, foreign, raw-fd and closed handles, and for `release()` during a native call.
3. Inspect operations and trunk rule; property tests for byte paths and NUL parsing.
4. Refs under 40 with revalidation; WAL payloads and TargetAttempt.
5. Remote operations; local bare remote fixtures.
6. Census for phase 07.
7. Code review unit; merge to main (dormant: no production caller yet).

## Validation

```bash
cargo test -p fgos-holder-lock -p fgos-git -p fgos-node-addon
cargo clippy -p fgos-holder-lock -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
node --test test/git/inspect.test.mjs test/git/refs.test.mjs test/git/remote.test.mjs test/git/lock-handover.test.mjs test/holder-lock/*.test.mjs
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<p02 build> npm test
```

Vectors: **V-CAS (Refs)** delete of a checked-out branch refused, including a worktree registered after an earlier snapshot (both backends) and an add waiting on 40 failing after the delete; **V-ORDER (scope part)** Rust scope seeded from passed held ranks, no hidden lower-rank scope, refusal of 40 under 50; **V-BORROW (handover part)** never-locked description refused, raw fd passed straight to the addon refused, closed handle refused, `release()` blocked during a native call, no fd leak into git children (`/proc/<child>/fd`), win32 refusal by name; **V-TRUST (Inspect part)** `status` never takes `index.lock`, poisoned env, symlinked worktree; **V-CLEAN (Refs part)** `deleteRef` expected-tip only.

## Risk

| Risk | L × I | Mitigation / signal and response |
|---|---|---|
| Two LockScopes (Node and Rust) disagree on ranks | Low × High | One registry file read by both; a test compares Node `lockEntry` and Rust ranks for every row. |
| fd passed from Node closes during the Rust call | Low × High | Borrower test re-run before the irreversible boundary; facade blocks `release()` while a native call holds the handle. |
| Refs under 40 contends with worktree creation | Medium × Low | 40 is held only for revalidation, CAS and read-back; measured in E3 full typed operation. |

## Rollback

Dormant ports: revert the merge. The holder-lock accessor and `scope.rs` have no other callers until phase 03.
