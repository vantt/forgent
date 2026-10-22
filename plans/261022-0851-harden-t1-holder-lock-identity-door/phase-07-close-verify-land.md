---
phase: 07
title: "Close: independent verify, re-measure against the baseline, land on both machines, rollback plan, closing report"
status: pending
depends_on: [06]
parallel: "none; last"
effort: ~1d plus the owner's landing slot on the owner machine
net_size: "Node 0 / Rust 0 / tests 0"
---

# Phase 07 — Close

> **Merge rule for `packages/process/rust/src/containment/linux.rs` (OPC, 2026-10-22 19:05):** OPC carries T1's bwrap stderr capture on `opc/phase-a` (`ae3b3fa78` test, `14381b0f0` the linux.rs hunk from `fc0cceec5`) with one reshape: `refusal_line` gets its own doc above `end_failed_spawn`'s untouched doc. When T1 merges main after OPC lands, **take OPC's version of those lines** (and OPC's A3 classification on top). Confirm `a_refused_mount_is_named_in_the_containment_error` still passes.

## Context

Parent plan [per-layer loop](../261021-1118-harden-low-layers-bottom-up/plan.md#the-per-layer-loop) steps 6–9, owner decisions 1 and 7 (stop-everything landing; the second machine self-lands in a quiet window after telling GIT/ES and TEST; the owner machine follows a guide at a time the owner picks), [plan.md](plan.md) D-T1-9 (the fence precondition) and Rollback. The [T1 baseline](../reports/research-261022-0138-harden-t1-baseline.md) is the "before" table. The [SEAT landing report](../reports/landing-261022-0904-harden-seat-release-this-machine.md) is the procedure template for this machine.

## Requirements

### Independent verify (proposal §4.6)

- A fresh clone of the track branch on this machine under `/home/vantt/projects/forgent-worktrees/t1-verify`, private `CARGO_TARGET_DIR` on ext4, session variables unset (`FGOS_SESSION_ID`, `CODEX_THREAD_ID`, `CLAUDE_CODE_SESSION_ID`, `FGOS_STATE_ROOT`, `FGOS_HOST_BIN`): `cargo build --locked --release --workspace`, `cargo test --workspace`, `cargo clippy --workspace --all-targets -- -D warnings`, `cargo fmt --check`, `npm test`; every `run-tests: ERROR` line read (leak and clone checks count), every failing file re-run alone with the one-file command.
- The cross-platform workflow (`.github/workflows/holder-lock-cross-platform.yml`, `push` and `workflow_dispatch`) green on the track branch for the Windows cases (`windows-hot-lock`, `windows_lockfileex.rs`, `windows_lock_hold_route.rs`, `windows-doctor`).
- Gates 1–9 of the proposal re-checked by the big lead with a source for each; no High-or-above finding unreproduced; every arbitration §3 row names its owning proof (green) in the closing report's table.
- The Δ-lines table, HARDEN commits only (`git log --numstat <merge-base>..harden/t1-holder-lock-identity-door -- src bin scripts packages apps test`, Rust test code counted as tests), next to the phase estimates; T0 + T1 ≤ 0 shown.

### Re-measure (loop step 8)

Same machine, same load class, on the activated release, the baseline's script shape: `acquireSync`+`release` uncontended (was 1.36 ms), `acquire` async one try (1.44), `probe` (1.28), `lockHolders` (5.5 ms), `collectLockStatus` (10.2), `withStateTx` empty body (19.6 µs), `resolveWriterIdentity` (0.9 µs cached / 1.41 ms first), `door.canonicalJson(obj200)` (80.9 µs), `fgos convention name` route (1.38 ms, unchanged), plus the fence verb on a free lock (0.2 s). Expected: every lock call class ≤ 100 µs; identity ≤ 10 µs; canonical ≈ 48 µs; `collectLockStatus` ≈ one fdinfo scan per existing lock file.

### Landing

1. **Merge** the track branch to main (one merge commit; the revert target), build the release from main (`npm run build` → `fgctl stage`), record the digest.
2. **This machine** (self-landing under the standing approval): tell GIT/ES (`Điểm yếu…`) and TEST (`forgent-f8`) the quiet window; confirm nothing fgOS runs and no file under `.fgos` or the state root is open; back up `.fgos/distribution.json`, both `config.json` files (global mode 600), refspecs and instruction hashes to `.fgos/runtime/tmp/landing-harden-t1-here/`; `fgctl upgrade`; restore `distribution.json`; `fgctl verify`; `fgos doctor --fix`; `fgos setup` (expect: no `lock` key added, no refspec change); `fgos doctor` (expect: the five T1 rows pass, `git-operation-journal` passes, `lock-holders` counts `repo-config`, no `lock-fences`/`state-root`/`lock-record-unreadable`/`lock-predecessor-kill-wait` rows); smoke: `fgos dispatch decide`, `fgos gateway start/status/stop`, `fgos lock fence gateway --yes`, `fgos lock-status --json`, a read-only `fgos run`, a writing `fgos run` on a scratch worktree committed through ScopedCommit (the hook runs as a host client), `git commit` in the main checkout; landing report at `fgos convention name --type landing --slug harden-t1-this-machine`.
2a. **Fence precondition on this machine too** (D-T1-9): inside the quiet window, before `fgctl upgrade`, run the previous release's `fgos doctor --fix` (it places the remaining tombstones once nothing runs; today 55 paths here), then `fgos doctor` must show `lock-fences` green (`all N legacy lock path(s) fenced`) and `git-operation-journal` passing; an `old lock still present` or a fix refused "waits for activation" stops the landing until it is resolved.
3. **Owner machine** (forgentX, mdview, mcp-skill-hub): a guide in Vietnamese at `fgos convention name --type guide --slug harden-t1-owner-machine-landing`, modelled on GIT's [owner-machine guide](../reports/guide-261022-0011-owner-machine-git-durability-and-t0.md), with: (a) the **fence precondition line** of plan.md D-T1-9 as a hard step before activation, per workspace, in the quiet window: run the current (pre-T1) release's `fgos doctor --fix`, then `fgos doctor` must show `lock-fences` **green** (`all N legacy lock path(s) fenced`) and `git-operation-journal` passing; `old lock still present` or a fix that "waits for activation" (an activation older than the 4.4 registry) stops the landing on that workspace; this is the arbitration's "green on the three workspaces", and it is checkable because the fix's refusal names its reason; (b) the note that **building from main brings every lane landed on main after T1's merge** (any later HARDEN, GIT, TEST, SEAT-TRIM commits), so the owner reads main's log since the T1 merge before building and the guide lists the merges present at writing time; (c) the canonical corpus check of T0's guide (step 6) stays mandatory on the three workspaces; (d) backups, `fgctl upgrade`, `fgctl verify`, `doctor --fix`, `setup`, `doctor`, smoke per workspace, in the order forgentX → mdview → mcp-skill-hub; (e) the global `~/.fgos/config.json` is left as is (older releases on that machine may still read it); (f) the rollback block below. H15's pattern: the guide is linked from the board and the parent plan's phase 02 row.

### Rollback (both machines)

Stop everything, then: `fgctl upgrade --from ~/.local/state/fgos/releases/<previous digest>` (this machine: `d241ec95…`; owner machine: the digest the guide records at writing time); restore `.fgos/distribution.json` and `.fgos/config.json` from the landing backup folder; `cp fgctl.prev ~/.local/bin/fgctl` if `fgctl` was reinstalled; on main, `git revert -m 1 <T1 merge sha>` only before T2 merges (after that, roll forward); record the revert SHA on the board. No on-disk format needs conversion back (plan.md Rollback).

### Closing

- Closing report at `fgos convention name --type closing --slug harden-t1-holder-lock-identity-door` with: the before/after table; the Δ table per phase and the sum; the arbitration §3 rows with their owning proofs; the doctor table 9 → 5; what was reused (the Git loan precedent, `semantics.rs`, `names_payload`, `fgos_process::facts`) and what was deleted; the test-cost totals (H1); the open items handed on: H17 (T9), H20 (T5), H21 (TEST, landed?), H22 (WORK), plan.md's unresolved questions as answered by the big lead; the measured call classes.
- Update: the parent plan's phase 02 row and its "Received from other lanes" (T0 debt, R1, R3, HL-N8/N9 closed; HL-F1 → TEST), the hand-off ledger rows H16, H18, H19 (T1 half), R1, R3; T0's phase 7 file (done line); the board's HARDEN row and `log.md` one line; `docs/backlog.md` if a PBI row tracks T1; the WORK board row's H22 line unchanged.
- T2's council may open only after this close (proposal §4.2).

## Files

**Create**: the landing report, the guide, the closing report (names from `fgos convention name`). **Modify**: `plans/261021-1118-harden-low-layers-bottom-up/{plan.md,phase-02-t1-holder-lock-identity-convention.md,phase-01-t0-process-facts-and-leaf-crates.md}`, `plans/261021-1547-harden-t0-process-facts-door/phase-07-post-seat-carry-list.md`, `plans/261017-1313-fgos-platform-program-board/{plan.md,log.md}`, `.fgos/installation/activation.json` (by `fgctl`). **Delete**: none. **Tests to retire**: none.

## Steps

1. Verify (above); fix regressions on the track branch, never by weakening a test.
2. Re-measure; write the before/after table.
3. Merge; build; land here; landing report.
4. Guide for the owner machine; board and plan updates; closing report; message to the lanes (GIT/ES, TEST, DOC, MAIL, WORK).

## Verification (exact)

- `npm test` and `cargo test --workspace` green on the fresh clone; the cross-platform workflow green.
- `fgos doctor --json` on the activated release here lists the five T1 rows and no retired row; `fgos --version` names the new digest; `git commit` in this checkout succeeds through the hook.
- The closing report's Δ table sums to ≤ 0 for T0 + T1, HARDEN commits only.

## Net size

0 / 0 / 0 (measurement and documents).

## Test-cost line

The suite totals before and after T1 from `node scripts/test-proof-inventory.mjs --cli-cost` on the same machine, pasted in the closing report.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| Another lane's merge between verify and merge changes a shared file | M × M | Rebase the track branch on main right before the merge; re-run the focused files of the shared-file phases. |
| The owner machine still runs a pre-cutover release on one workspace | L × H | The precondition line; the guide refuses to proceed on that workspace until it is activated on a post-cutover release first. |
| A hidden `run-tests: ERROR` (leak or clone check) passes unread | M × M | The big lead greps the full log for `ERROR` and pastes the lines. |

## Rollback

The block above.

## Done when

Landed on this machine with its report; the guide delivered and linked; the closing report linked from the parent plan's phase 02 with the layer marked closed; the ledger rows updated; T2 may open.
