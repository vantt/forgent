---
phase: 02
title: "Invocation-root door: one answer to which project a command acts on, host-bin lookup without a cross-checkout fallback, lock-status arithmetic below the arm"
status: pending
depends_on: ["shim-root branch on origin/main (the Rust root walk stops below $HOME)"]
parallel: "T0/T1 layer; alone in its layer; beside P01, P12-P15"
effort: ~1d
net_size: "Node: bin about -90, src about +5; Rust 0; tests about +40 (estimate)"
---

# Phase 02 - Invocation-root door (T9-02, T9-05, lock-status beacon move; red-team F6; L-1; authority audit AU-01, AU-02)

**Authority moved:** "which project and which `.fgos` store" goes from seven resolvers to one repo-facts read and one door, proven equal to the Rust host walk and the identity crate's `main_root`.

## Context

T9-02 (High, reproduced): from `docs/` of the main checkout, `fgos list --json` exits 0 with `work: {}` and no warning, and `fgos init` can create a phantom `docs/.fgos`. Cause: `dataDir` is strict cwd (`bin/fgos.mjs:145-156`); the warning is gated on `!isMainWorktree(cwd)` (`:5289`) and `isMainWorktree` compares Git top levels (`src/runner/worktree.mjs:503`), so a subdirectory of the main checkout counts as main; the `init` guard passes there (`:5273`). The Rust walk serves native routes only (`apps/fgos/src/main.rs`); the legacy route gets the state root pinned (`legacy_exec.rs:254`) but never a project root. Red-team F6: `main-checkout-reset --dir <other>` skips its guard (`bin/fgos.mjs:4483`, arm `:4480`).

The same root is computed by hand at six places, each as `flags.dir !== undefined ? ... : resolveMainCheckoutRoot(cwd) ?? cwd` (`:1047`, `:4027`, `:4169`, `:4258`, `:4274`, `:4455` on `26d42ca98`), three separate `resolveRepo()` Git reads run per invocation (`src/runner/paths.mjs:40,77`, `src/runner/execution/run.mjs:65`), `src/util/host-bin.mjs` falls back to another checkout's host (`:44-67`, comment "e.g. in tests", AGENTS.md DoD 5), and `src/runner/fanout-batch.mjs:19` `resolveBinFgos()` takes no parameter while its call passes `root` (`:89`).

Reused doors: `src/runner/paths.mjs` (already owns `resolveRepoRoot :33`, `resolveMainCheckoutRoot :74`, `findExecutableOnPath :150`), `resolveActiveHostBin` (`src/util/host-bin-path.mjs:69`), `collectLockStatus` (`src/runner/lock-status.mjs`), `src/runner/lock-fence.mjs`. One Git read: the T2 Git door's repo facts (`createGitInspect(...).resolveRepo()`), shared.

## Requirements

1. **`resolveInvocationRoot({ cwd, dir, policy })` in `src/runner/paths.mjs`** returns `{ root, fgosDir }` or a named refusal (`StoreError('validation')`). Policies: `main-checkout` (setup, doctor, uninstall, unclaim, resync-worktree, main-checkout-reset); `caller-tree`; `strict-cwd` only where a verb proves it needs it (named in the report). Default with no `--dir`: the nearest `.fgos` that is a project store, walking up from cwd **never past the Git top level**, and never taking the global `~/.fgos`. `--dir` is a request the door validates; under `main-checkout` it must equal the trusted main root of the cwd's repository. One `readRepoFacts(cwd)` read feeds the door, `resolveRepoRoot` and `resolveMainCheckoutRoot` (the three reads become one).
2. **Cross-language proof (widened by authority audit AU-01, High).** Seven places answer "which project, which `.fgos`" today in four layers (audit AU-01 table). One fixture table in `test/rust-host/` (a tree, the expected project root, the expected main root) covers the cases {main root, subdirectory of the main checkout, linked worktree, `$HOME`, no repository} and is run by three readers: the Node door, the Rust host walk (`apps/fgos/src/cli_projector.rs` `resolve_target_root`) and the identity crate's `main_root` (`packages/identity/rust/src/project.rs` `main_root`). The Node door's `root` must equal the host walk's answer, and its `main-checkout` policy answer must equal `main_root`, on every row; a row where the readers disagree today is fixed in the reader that is wrong, not in the table. `resolveGitRoots` (`src/runner/execution/run.mjs`) and `mainCheckoutRoot` (`scripts/lib/git-ports.mjs`) become callers of the one repo-facts read. The shutdown fallbacks `resolveMainCheckoutRoot(root) ?? root` in `src/runner/session.mjs`, `src/runner/gateway-control.mjs` and `src/runner/loop.mjs` move to the door in P04 (they are its Event Store shutdown callers, AU-05). No env pin (arbitration: it adds a channel).
3. **Callers move.** `dataDir` (`bin/fgos.mjs:145-156`) and its `main()` call (`:5214`) call the door; the six repeated lines become one call; `bin/fgos.mjs:350-369` (the root lines the arbitration lists) the same. The `unclaim` arm's line (`:4274`) is a Work arm: a one-line edit, WORK told.
4. **T9-05.** `fanout-batch` calls `resolveActiveHostBin({ cwd: root })` and drops the file fallback; `resolveHostBin` becomes a call into `resolveActiveHostBin` with no `[process.cwd(), PACKAGE_ROOT]` loop; tests set `FGOS_HOST_BIN` or `packageRoot`.
5. **lock-status.** The beacon age and active arithmetic (`bin/fgos.mjs:4415-4425` region of the `lock-status` arm `:4409-4449`) move into `collectLockStatus`; the arm keeps flags, `confirmFence` (a TTY prompt is shell work) and print. `lock` arm `:4390-4408`: flags, one call.
6. **Red-team F12 (open).** If Git Inspect does not refuse a `.git` file whose `gitdir` does not point back, the check goes inside this door (OPC answers; Step 2).
7. **Activation read (AU-02).** `resolveActiveHostBin` (`src/util/host-bin-path.mjs`) is the one Node reader of `activation.json`; `host-bin.mjs` stops reading it on its own (Requirement 4). P10 moves the doctor's own five-step order (`resolveActiveReleaseForDoctor`) onto this reader and P12 keeps the Rust side on `packages/distribution`.

## Files

**Create:** none (`test/rust-host/` gains a fixture table file; name by convention of that dir).

**Modify:** `scripts/lib/git-ports.mjs` (`mainCheckoutRoot` becomes a caller), `src/runner/paths.mjs`, `src/util/host-bin.mjs`, `src/util/host-bin-path.mjs`, `src/runner/fanout-batch.mjs`, `src/runner/lock-status.mjs`, `src/runner/execution/run.mjs` (the third `resolveRepo` read, one line), `bin/fgos.mjs` (ranges above, `:4390-4449`), `test/runner/paths.test.mjs`, `test/util/host-bin-path.test.mjs`, `test/runner/lock-status*.test.mjs` (the file that owns it; find by `rg -l collectLockStatus test`), the `fanout-batch` case in its own test, `test/cli/fgos-lock-fence.test.mjs` (wiring only), `CHANGELOG.md` (one line: a command run from a subdirectory of a project now reads that project's store).

**Delete:** the six hand-written root lines; `dataDir`'s strict-cwd body; the `host-bin.mjs` cross-checkout loop; `fanout-batch`'s file fallback.

**Tests to retire:** the hermetic `host-bin` cases that depended on the cwd/PACKAGE_ROOT fallback are re-fixtured (owner: `test/util/host-bin-path.test.mjs`), not deleted; any `test/cli` case that asserts the strict-cwd result through a spawned CLI is replaced by the door's unit case and one wiring case.

## Red tests first

- `test/runner/paths.test.mjs`: one case per policy plus subdirectory of main, stripped worktree (no store, refused), `--dir` of another repo under `main-checkout`, a tree with `~/.fgos` above it never taken.
- `test/rust-host/` conformance table fails if any of the three readers (Node door, host walk, identity `main_root`) disagrees on a row; recorded failing rows today: subdirectory of the main checkout (Node strict cwd against the host walk) and linked worktree (host walk finds no store, Node Git readers find the main root).
- `fanout-batch`: the `root` it is given reaches the host lookup.
- `lock-status`: beacon arithmetic as a unit case (moves with the code).

## Net size

bin about -90 (six root lines -40, `dataDir` and root lines -20, lock arms -30); src +5 (door +40, `host-bin` -30, `fanout-batch` -8, `lock-status` ~0); Rust 0; tests +40.

## Steps

1. Callers by `rg` of `dataDir`, `resolveRepoRoot`, `resolveMainCheckoutRoot`, `resolveHostBin`, `resolveBinFgos` with `file:line` (list ten, give the total).
2. Ask OPC (SendMessage; same-machine peers) whether Git Inspect refuses a back-pointing-less `.git` file; record the answer.
3. Red tests; door; callers; fixture table on the Rust side reads the bounded walk landed by shim-root.
4. Subdirectory smoke on the built host: `fgos list --json` from `docs/`, `fgos init` from `docs/` (refused with the sentence naming the top level).

## Validation (focused)

FR `test/runner/paths.test.mjs test/util/host-bin-path.test.mjs test/rust-host test/cli/fgos-lock-fence.test.mjs test/cli/fgos-disconnected-worktree-guard.test.mjs` plus the `fanout-batch` and lock-status tests; `cargo test -p fgos` and `cargo test -p fgos-identity` (crate name by `Cargo.toml`) for the table's Rust side. Land gate; OPC reviews the root facts over Git Inspect.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A verb that truly needs strict cwd now walks up | M x M | `strict-cwd` policy exists; each verb's choice is listed in the report with the evidence |
| Walk bounded by the top level misses a store a user placed above a nested repo | L x M | refused with a message naming the `--dir` fix; test case |
| Door adds a Git read to a hot native route | L x M | native routes keep the Rust walk; the door serves legacy routes only |

## Rollback

Revert the merge commit; callers return to the strict cwd (the reproduced bug returns).

## Done when

Red then green; the two subdirectory commands behave; one `readRepoFacts` per invocation (counted by a spawn counter in the unit test or by a measured Git call count in the report); fixture table green on both sides.
