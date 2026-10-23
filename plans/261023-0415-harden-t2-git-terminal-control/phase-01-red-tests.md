---
phase: 01
title: "Red tests for every finding this plan fixes that is not yet reproduced"
status: pending
depends_on: []
parallel: "none; first and alone"
effort: ~1d
net_size: "Node 0 / Rust 0 / tests +260 (estimate; extensions of owning tests where one exists)"
---

# Phase 01 — Red tests

## Context

Arbitration D1 step 1. This phase commits one red test for each finding below that this plan fixes and that has not been reproduced yet. A finding whose test is **green** on the track branch is closed as "not reproduced" in the phase report, and its fix slice is dropped from the later phase. CF01 and F-C1 are already reproduced (arbitration header, red-team verdicts), so their tests are written test-first inside phase 2. Facts and the remote-door analysis are in [plan.md](plan.md) Facts and D-T2-1.

Each test **extends the owning proof** where one exists (design principle 8). A new test names its behaviour in plain words and says, in its body comment, why no existing test proves it. No test name carries a finding code.

## Requirements

| Finding | Owning proof to extend (file:line, verified) | Behaviour the test states | Why it is red today |
|---|---|---|---|
| RT01 scp-form origin | **One new integration-test binary** `packages/git/rust/tests/ssh_transport.rs` (new file: the fake `ssh` must be first on `PATH` before the process's first driver call, because `GIT`/`FLOOR` are process-wide `OnceLock`s computed from `PATH`, `driver.rs:22-24`, and the driver strips `GIT_SSH*` with every `GIT_*` variable, `driver.rs:193-204`; no existing test binary sets `PATH`; cases in this binary run serially). The fixture builds a bare `origin.git` and a clone whose origin is `git@example.invalid:origin.git`; the fake `ssh` runs the requested `git-upload-pack`/`git-receive-pack` against the local bare repository (git's own test-suite pattern; `core.sshCommand=ssh -oBatchMode=yes` is forced, `remote.rs:24-39`) | "a repository whose origin is in scp form claims a counter number through that origin" | `sequence_push` → `transfer_url` → `remote-protocol-not-supported` (`remote.rs:58-66`) |
| RT01, door grammar | `packages/git/rust/src/remote.rs:659` `ssh_usernames_are_not_password_credentials` (moves with the door in phase 2) | accepted: `git@host:org/r.git`, `host:org/r.git`; refused: `-oProxyCommand=x:y`, `ssh://-oProxyCommand=x@h/r`, `ext::sh -c x`, `fd::17`, `[::1]:p`, `a b@h:p`, `h:p?x`, userinfo with `%` or `:` before `@`, a tab or other control byte | No scp case exists; today scp form is not a credential question at all |
| F-7 Remote port | `tests/ssh_transport.rs` (same binary): an origin `ssh://git@example.invalid/<bare>` through the fake `ssh`, which **refuses unless its user argument is `git`**; pinned with `Inspect::remote_url` | "the Remote port hands git the URL the remote is configured with" | Remote reads `Inspect::remote_url` (redacted, `driver.rs:2512-2514`) and pushes to `ssh://[redacted]@…` |
| F-7 Publication pin | `tests/ssh_transport.rs`: same `ssh://git@…` origin, Publication grant pinned with `Inspect::remote_url` as the Event Store pins it (`refspec.rs:45`) | "Publication accepts the pin it is given for an ssh URL with a user name" | Raw read compared with a redacted pin → `remote-url-not-pinned-or-credentials-present` (`publication.rs:1418-1424`) |
| Pin binds the ssh account | `tests/refs_remote.rs:453` `pinned_remote_refuses_rewrites_and_repository_transport_config`: pin taken for `ssh://git@h/x`, then `remote.origin.url` changed to `ssh://root@h/x` | "a changed ssh account on the origin is refused" | Today refused only because every ssh-with-user URL is refused; the case keeps the refusal true after the fix (red only if the fix compares redacted forms) |
| CF02 | `packages/terminal-control/rust/tests/core_failures.rs:164` `retain_closes_only_past_until_on_the_same_incarnation`: retarget per D-T2-6 to "a scan reports an expired retained pane with its pane id and closes nothing" | doctor's scan is observation-only | `scan_record` closes it (`core.rs:805-819`) |
| CF03 | `core_failures.rs` immediate-close and retained-foreign-foreground cases (re-grep their names): a launched marker whose `pid` equals the foreground pid but whose start time differs; and an empty foreground list | "a pane whose foreground process only shares a pid with the launched one is kept"; "an empty foreground list proves no ownership" | `foreground_is_owned` compares pids with `Iterator::all` (`core.rs:772-777`) |
| CF04 | `packages/terminal-control/rust/src/store.rs:178` `errors_before_install_propagate_and_errors_after_install_keep_the_outcome`: at `parent-fsync` assert the answer is not plain success and the installed fact is kept | "a marker whose durability is unproven is not reported as plain success" | `install_result` returns `Created` (`store.rs:144-166`) |
| CF05 | `packages/git/rust/tests/repository_config.rs:145` `dead_config_writer_recovers_wal_before_and_after_effect_without_replay`: fault after `config-replaced`, before the parent sync | "config recovery finishes the parent sync before acknowledging, and never repeats the edit" | Value match alone acknowledges (`repository_config.rs:244-258`) |
| CF06 | `packages/git/rust/src/wal.rs:2825` `scan_ignores_compaction_temporaries_before_counting_the_bound`: > 32 recognised `.durable-file-*.tmp` inside an operation directory and in a pre-intent directory | "failed-write temporaries never count against the record bound" | Inner readers count before skipping (`wal.rs` inspect/pre-intent readers, seat cite `:1435,1442-1453,2332-2341`; re-grep) |
| CF07 | `tests/sequence.rs`: an origin whose URL bytes are not UTF-8 (`git config remote.origin.url` with raw bytes); asserted through `sequence_tip`/`sequence_push` (behaviour level), so the case survives phase 2's `Result` signature of `sequence_home` | "a sequence home that cannot read its origin refuses and allocates nothing locally" | `Err(_) => Local` (`sequence.rs:73`) |
| CF08 | `tests/sequence.rs`: bare origin with a rejecting `pre-receive` hook | "a push the remote refuses for another reason keeps that refusal" | Any porcelain `!` row → `Stale` (`sequence.rs:180-186`) |
| CF09 | `tests/sequence.rs`, local home | "a local claim is durable (object, then ref, then ref directory) before it is reported" | `Claimed` right after `update-ref` (`sequence.rs:135-147`) with no Git fsync or sync call. **Witness rule:** reuse an existing checkpoint seam of the sync primitives (`refs::sync_refs`, `objects.rs`) if one makes the order observable; if none exists without a new test-only seam, record "no unit witness" and phase 3's proof is OPC's reading review plus a run of the existing E1 script (`scripts/git/e1-power-cut.*`) |
| CF10 | `packages/terminal-control/rust/tests/herdr_driver_fake.rs:207` `commands_do_not_inherit_the_callers_descriptors`: add an inheritable descriptor at ≥ 2048 (`F_DUPFD`) | "no caller descriptor reaches herdr, whatever its number" | Loop stops at 1023 (`driver/herdr.rs:241-247`) |
| E-5 | `packages/git/rust/src/driver.rs` inline tests (owner of `promisor-object-unavailable`, `:2977`): one repository with alternates and a shallow boundary; read through each public read that reaches the six sites (`driver.rs:861,2152,2203,2431,2451,3415`, re-grep) | "a read failure is named by the same layout cause whichever read hits it" | Copies disagree: some omit alternates, some omit shallow |
| F-5 | `tests/publication.rs`: a WAL held busy by another writer, and a publication borrow that is unavailable | "Publication names a busy WAL like every other port (`refused`, kebab cause)"; "one failure, one cause name" | `werr` maps every `WalError` to `recovery-required` with Debug text (`publication.rs:27-31`); two spellings of borrow-unavailable |

## Files

**Create**: `packages/git/rust/tests/ssh_transport.rs` (one integration-test binary; the fake `ssh` script is written by the test into its own temp directory at run time, not committed). **Modify** (tests only): `packages/git/rust/tests/{sequence.rs,refs_remote.rs,publication.rs,repository_config.rs}`, `packages/git/rust/src/{wal.rs,driver.rs,remote.rs}` (inline `#[cfg(test)]` modules only), `packages/terminal-control/rust/tests/{core_failures.rs,herdr_driver_fake.rs}`, `packages/terminal-control/rust/src/store.rs` (inline test only). **Delete**: none. **Tests to retire**: none.

## Steps

1. Branch `harden/t2-p01-red-tests` from `harden/t2-git-terminal-control` (cut from main `576fdb076` or later).
2. Write each test; run it alone; confirm it fails **for the stated reason** (assert on the cause string, not just "an error").
3. A test that passes → record "not reproduced: <finding>" with the run output; keep the test only if it adds an owning proof that did not exist (principle 8), else drop it.
4. Commit per crate (`test(git): ...`, `test(terminal-control): ...`), messages naming behaviours, no finding codes.
5. Report: table finding → test → red/green → failing assertion text; Δ lines; the fake-ssh feasibility result. If the fake `ssh` cannot run, the RT01/F-7 witnesses fall back to door-level inline tests that assert the `(url, scheme)` answer **and** the report says the end-to-end acceptance ("an scp-form origin can mint ids") is not closed by a test: phase 17 then records one manual transfer against a real scp-form remote as its evidence.

## Verification (exact)

```sh
export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/t2-p01-target
cargo test -p fgos-git --test sequence --test refs_remote --test publication --test repository_config --test ssh_transport
cargo test -p fgos-git --lib -- wal:: driver:: remote::
cargo test -p fgos-terminal-control --test core_failures --test herdr_driver_fake
cargo test -p fgos-terminal-control --lib -- store::
```

Expected: exactly the new cases fail, each with the cause in the table; every pre-existing case passes. No Node test changes in this phase.

## Net size

Node 0 / Rust 0 / tests +260 (≈ 15 cases × 15–20 lines; the CF02 retarget is ±0).

## Test-cost line

Added ≈ 15 cases (Rust only), retired 0; no new CLI/host spawn; the fake `ssh` adds 1–2 git children per new sequence/remote case.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| The fake `ssh` cannot run because the driver scrubs `PATH` or containment hides the temp dir | M × M | Door-level fallback (step 5); report which witness was used |
| A red test is red for an unrelated reason (fixture bug) | M × M | Assert the exact cause; a reviewer re-reads each failing assertion against the Facts |
| Committed red tests make the track branch red until phases 2–6 | H × L | Expected; the big lead's run after this phase lists exactly these reds |

## Rollback

Revert this phase's commits on the track branch. Nothing outside tests changes.

## Done when

Every row above is either red for its stated reason (committed) or closed as "not reproduced" with evidence; the report is linked from plan.md; no non-test file changed.
