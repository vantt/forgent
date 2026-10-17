# Phase lead report: holder-lock P05 — `fgctl` activation gate (semantics probe + borrow vectors)

- Plan: `plans/261016-1104-holder-lock-kernel-lock-foundation/plan.md`, phase file `phase-05-fgctl-activate-gate.md`
- Branch `holder-lock/p05-fgctl-activate-gate` (base `45ee0a45e`), commits `11d5842e4`, `bba74cf61`; merged into `holder-lock/integration` as `f3a3309e0` (`--no-ff`, merge tree identical to the phase tip `5093f3ba3`)
- Impact analysis: GitNexus index stale (last `b334695`, before this track). Grep: `publish_and_tail` has 3 callers, all in `init.rs` (init, upgrade, repair). `publish_activation_file` has 2 other callers, and both write only a quarantined status. Risk is LOW and nothing is HIGH or CRITICAL.
- Prior art: `git log -S'kernel-semantics'` / `-S'lockProtocol'` found only plan/design docs and the P11 spec text. No earlier gate code existed and none was removed.

## What was built

| Piece | Where |
|---|---|
| `holder_lock_gate(workspace_root, lock_root, git)` → `Passed{elapsed_ms}` / `Unsupported`. It checks the driver guarantee and runs the two-process probe for `<ws>/.fgos/locks` and `<stateRoot>/locks`, then the borrow vectors with `git` from PATH. It runs in-process through the linked crate and never under `candidate_dir` | `packages/distribution/rust/src/init.rs` |
| Called first in `publish_and_tail`, before the capsule is written. This covers init, upgrade and repair (rollback and self-verify heal) in one place. The quarantine writes and init's same-digest no-op shortcut are not gated, because they publish nothing | `init.rs` |
| `InitError::LockKernelSemanticsFailed` → `lock-kernel-semantics-failed: <dir>: <detail>`; `InitError::LockBorrowVectorsFailed` → `lock-borrow-vectors-failed: <red vectors> (<git version>)` | `init.rs` |
| A network filesystem (`exclusion none`) is refused by name: `driver flock gives exclusion none (network filesystem (nfs): …)` | `init.rs` |
| Windows: no driver, so nothing runs, the activation proceeds and stderr gets one line: `holder-lock: unsupported on Windows until its Windows driver lands` | `init.rs` |
| Two-process semantics probe: lock a fresh probe file EX, hand the description to a `sleep 60` child as fd 3 (`spawn_with_fds`), close the parent copy, probe → must be `Held`; kill and wait the child, probe → must be `Free` (≤ 500 ms for a parallel-fork copy). Probe files from a dead probe that are older than 120 s are swept. The module is reusable by P11's doctor `lock-kernel-semantics` | `packages/holder-lock/rust/src/semantics.rs` (new) |

There is no off switch.

## Decisions taken by the lead

1. **One gate site, `publish_and_tail`, at its top rather than right before `publish_activation_file`.** All three activation paths go through it. Placing it first means a refusal leaves no shims, `root.json` or pin behind. The only trace is the two lock directories the gate probed.
2. **The probe's child holds a description that the parent locked and handed over (fd 3), not a lock it takes itself.** This tests exactly what the kernel must guarantee: the lock lives on the description, is held while another live process owns it, and is gone once that process dies. It needs no helper binary (fgctl is not re-exec'd and nothing under the candidate runs), only `sleep` from PATH. A missing `sleep` is reported by name.
3. **The probe is in the holder-lock crate (new `semantics.rs`), not in `init.rs`.** The P11 spec gives doctor's `lock-kernel-semantics` the same two-process probe, so it gets one implementation.
4. **Lock root = `store_root/locks`.** `store_root` comes from `resolve_machine_release_store_root`, which is the single `state_root()` since P02, so it is the same as `fgos_holder_lock::lock_root()` and stays consistent with the store this activation uses.
5. **`apps/fgctl/Cargo.toml` not changed.** fgctl reaches the crate through `fgos-distribution`, which already depends on `fgos-holder-lock` since P02.
6. **D7 needed no code change.** `git grep lockProtocol` outside `plans/` finds nothing: no `lockProtocolFloor` and no manifest `lockProtocol` field was ever implemented.
7. **Red-vector fixture drops both `-c gc.auto=0` and `-c maintenance.auto=false`.** The phase text names only `gc.auto`. Measured: dropping only `gc.auto=0` keeps the gate green, because git ≥ 2.29 starts auto gc through `maintenance.auto`. The wrapper models "a git where the switches do not work". It is an environment fixture and changes no code path.
8. **Windows message without the plan number.** It matches the P11 spec wording ("until the Windows driver"), and plan IDs stay out of shipped strings.
9. **The two cargo gate tests are serialized by a mutex.** Same cause as P02 decision 10: a fork on a parallel test thread copies descriptions until exec. Before the mutex, 2 of 30 runs failed (`hook-background: probe after release: held`); with it, 40/40 and 15/15 passed. Production fgctl is single-threaded at this point.

## Evidence

| # | Phase test | Where | Result |
|---|---|---|---|
| 1 | gate runs on init, upgrade, repair; real tmp mount passes | cargo `holder_lock_gate_passes_on_a_local_mount_with_the_real_git`; node `init with the real git passes the gate…`, plus every existing fgctl init/upgrade/repair test now passing through the gate | pass |
| 2 | red vector: gc-leaking git on PATH → refuse; real git → pass | cargo `holder_lock_gate_refuses_when_a_borrowed_git_leaves_a_background_gc`; node init refusal (no `activation.json`/shim/`root.json`/pin), node upgrade + repair refusal (activation byte-identical), then green upgrade with real git | pass |
| 3 | semantics probe | cargo `semantics::tests::a_live_child_holds_the_lock_and_its_death_frees_it` | pass |

- `cargo test --no-fail-fast -p fgos-process -p fgos-holder-lock -p fgos -p fgos-distribution -p fgctl`: **193 passed, 0 failed** in the phase worktree, and again in the integration worktree after the merge.
- `cargo check -p fgos-holder-lock -p fgos-distribution -p fgctl` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`: clean. Clippy shows no warnings in the new code.
- `node --test test/rust-host/fgctl-*.test.mjs` (release `fgos` + `fgctl` from a phase-private target `.fgos/runtime/tmp/cargo-p05`, env without session ids): **66 tests, 65 pass, 0 fail, 1 skipped** (the Windows cmd launcher test). After the review fixes, the 3 gate tests were re-run: 3/3. The node suite was not re-run in the integration worktree because its `target` symlink points at P02's build; the merge tree is identical to the tested phase tip.
- **Gate time:** 0.17–0.24 s (release, 5 runs), of which the borrow vectors take ~0.2 s and the two probes a few ms. A refused `fgctl init` run took 0.34–0.48 s end to end. The target is < 1 s, and the cargo test now asserts < 1000 ms.
- Full `npm test` was not run, because that is P12's gate. The "S1 live probe" failure was not seen in the suites run here.

## Review (code-reviewer, Sonnet)

No Critical or High findings. Applied:

- Assert the < 1 s target.
- Name a missing `sleep` in the error.
- Sweep stale probe files.
- Make the comment exact about the lock directories.
- Quote the git path in the Rust wrapper.

Not applied:

- ETXTBSY risk on the Rust wrapper. It is a theoretical race with forks on other test threads during the write, and 55 serialized runs showed none.
- The sibling-failure branch of the vector error text has no test. It is formatting only.

## Concerns

- On a machine without `sleep` on PATH, every activation is refused (`lock-kernel-semantics-failed: … holder child program \`sleep\` could not be started`). That is acceptable on Linux and macOS. Windows never runs the probe.
- The gate adds ~0.2–0.5 s to every activation, and it runs while the activation lock is held.
- The macOS path is compiled but not executed here. Passing the probe and vectors on a real Mac is what enables the macOS driver (A2). P12 or the owner's Mac run is the first real execution.
- `plan.md` status was not touched, because the controller owns it. Journal skipped.

## Unresolved questions

None.
