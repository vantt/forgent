---
title: "HARDEN T2 sub-plan: Git and terminal-control fixed, folded and made true, doctor 10+3 → 6+2"
description: "Implementation sub-plan for HARDEN layer T2: red tests first, the one remote door (scp origins, ssh user names), Worktree/Refs WAL compaction, the Git and terminal-control correctness fixes, Git cost and the Land wait in Rust, one-port-at-a-time Git consolidation, terminal-control deletes, doctor folded, census-gated drain deletes, specs; conditional phases for owner questions Q1, Q2 and Q3 A1–A5; then verify, re-measure and land on both machines."
status: pending
priority: P1
effort: "~9d lead time for phases 1–9 and 17 (P1 1d, P2 1d, P3 ∥ P4 1.5d, P5 2d, P6 ∥ P2–P5 2d, P7 ∥ P8 1d, P9 0.5d, P17 1d); conditional phases 10–16 add 0.5–3d each only if the owner answers yes"
branch: main (plan only; work runs on track branch harden/t2-git-terminal-control, one linked worktree per phase lead)
tags: [harden, foundation, rust, git, terminal-control, wal, doctor, node-addon, tests]
blockedBy: []
blocks: [261021-1118-harden-low-layers-bottom-up]
created: 2026-10-23
---

# HARDEN T2 sub-plan: Git and terminal-control

Main `576fdb076` (2026-10-23 04:15 Asia/Saigon). `git log 8ec0212d3..576fdb076` touches only plans and the board, so every `file:line` the [arbitration](../reports/council-261023-0402-harden-t2-arbitration.md) re-checked still holds. Step 4 of the per-layer loop of [the HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md) for [phase 03](../261021-1118-harden-low-layers-bottom-up/phase-03-t2-git-terminal-control.md).

**Binding inputs:**
- the arbitration's §2 target shapes, §3 verdicts, §4 decisions D1–D9 and §5 hand-offs;
- the four seat reports: [correctness](../reports/council-261022-2148-harden-t2-seat-correctness.md), [speed](../reports/council-261022-2148-harden-t2-seat-speed.md), [simplicity](../reports/council-261022-2148-harden-t2-seat-simplicity.md) and [red-team](../reports/council-261022-2148-harden-t2-seat-redteam.md).

**Owner questions.**
- **Q0** (approve the shapes and the size ceilings) is not answered yet. This plan is drafted as if the answer is **yes**. Phases 1–9 and 17 assume it.
- **Q1, Q2 and Q3 (A1–A5)** each get their own conditional phase, 10–16. No unconditional phase depends on any of them.

## Outcome

After T2:
- Git and terminal-control give no wrong answers on these findings: CF01–CF10, RT01, F-7, F-5, E-5.
- A repository with a GitHub scp-form origin (`git@github.com:org/repo.git`) or an `ssh://user@host` origin can mint ids and use both remote ports.
- Worktree and Refs WAL history stays bounded.
- A worktree add spawns fewer git children.
- Land's wait policy lives in Rust.
- The Git crate answers each recurring question once.
- Every pane access, except the named session-server start, goes through the port.
- Doctor has 6 Git rows and 2 terminal rows, and no condition is lost.
- The size ceilings below are met. Specs, contracts and CHANGELOG describe the code.

## Facts (verified on `576fdb076` unless marked)

**Remote door and sequence home**
- **CF01.** `src/runner/dispatch/worker-session-boot.mjs:33-40` maps every throw to `false`, and `:81-84` unlinks the socket on `false`.
- **RT01.** `packages/git/rust/src/sequence.rs:67-74` makes any readable origin `Remote`. Both scheme ladders accept only `/`, `file://`, `https://` and `ssh://`: `packages/git/rust/src/remote.rs:58-66` and `packages/git/rust/src/publication.rs:1426-1434`.
- **F-7.** `driver.rs:2512-2514` returns `line(&redact(&out))`. `redact` (`driver.rs:1757-1775`) replaces any `user@` after `://` with `[redacted]`. `remote.rs:54-55` checks and uses that string.
- **New, found while planning: every pinned URL is in display (redacted) form.**
  - Event Store pins `Inspect::remote_url` (`packages/event-store/rust/src/refspec.rs:45`, `sync.rs:321-324`).
  - Node pins `remoteTracking`'s URL, which comes from `inspect.rs:1133`, at `src/runner/worktree.mjs:470`.
  - The sequence counter pins the same redacted read (`sequence.rs:69-72`).
  - Config provenance records it too (`repository_config.rs:306`).
  - Publication compares its **raw** read with that redacted pin (`publication.rs:1418-1424`). So an `ssh://git@host/x` origin is refused by Publication with `remote-url-not-pinned-or-credentials-present`, and the Remote port transfers to `ssh://[redacted]@host/x`. Neither door works for an ssh URL with a user name.
  - Phase 1 reproduces both before anything is fixed.

**WAL compaction (F-C1)**
- `worktree.rs:509-535` (`finish_worktree`) appends the outcome and calls `release_pin`. It never compacts.
- `refs.rs:336-396` (`release_pin`) does not compact either.
- Admission reads every retained chain twice: `refs.rs:126` runs `scan(100_000)`, then `:130` runs `active(100_000)`.
- Publication compacts beyond `RECENT_TERMINAL = 4` (`publication.rs:203,264-309`).
- **The compact ledger already has a Worktree receipt** (`"w"`): `wal.rs:1897` writes it and `:1958` checks it, both since `8a8362712` (10-19). Worktree and Refs compaction writes ledger v2 (`wal.rs:2217`).
- **Same-id replay after compaction differs by port.**
  - Worktree answers `worktree-operation-already-exists` for an existing id and for a compacted one alike (`worktree.rs:505`).
  - Refs replays the receipt of a retained chain but answers `operation-recovery-required` for a compacted one (`refs.rs:746`).
- **RT02.** `repository_config.rs:688-690` documents "Config ownership chains stay retained" (`hooks_provenance`).

**Land wait**
- `src/git/land.mjs:5-19` holds the retry decision: `lockUnavailable` and `within`.
- The Rust side already has `prepare_land_wait` and `publish_land_wait` with a `wait_ms` (`land.rs:316,722`). The addon calls them with `waitMs: 0` (`packages/git/node-addon/src/git/land.rs:44-87`).
- The combined addon has **no async napi method today**.
- The loan guard assumes synchronous calls: `src/holder-lock/index.mjs:699-705` says "Native calls are synchronous; Externals are consumed once and closed before this guard ends", and disposes the loans in `finally`.

**Terminal-control and doctor**
- `reconcile-scan` has exactly one production caller, the doctor row: `src/setup/terminal-control-checks.mjs:118`, reached through `client.mjs:212`.
- The expired-retention close (`core.rs:805-819`) is therefore reachable only from doctor (CF02).
- Terminal configuration rules:
  - The grace margin rule is "allocation grace ≥ the 30000 ms **agent** ready timeout + 30 s". That ready timeout belongs to T5 (`src/runner/dispatch/herdr-deadlines.mjs:7`; spec `docs/platform/terminal-control/spec.md` §9 table).
  - It is not the core's `shellReadyTimeoutMs` (default 10 000, `route.rs:44`).
  - `retainFailedPaneMs` is "the round's own concern" (spec §9).
- **E-3 at the native door.** `src/native/door.mjs:96` re-parses the native error itself. It is the T0 loader, and `src/git/native.mjs` imports it, so `nativeError` has to move down into `door.mjs`. `door.mjs` cannot import it from Git.
- **Doctor run sharing.**
  - Today `bin/fgos.mjs:4233-4236` calls each `check(repoRoot)` with no shared run object.
  - WORK's branch adds exactly that door: `createDoctorRun().once()` in `src/setup/registrations.mjs` and the call site in `bin/fgos.mjs` (`git diff 8189f127b..work/es-cutover`).

**Other lanes' branches**
- **WORK.** `work/es-cutover` is now `00c065295`, with `790616298` as an ancestor. Since the arbitration it also edits:
  - `src/setup/git-checks.mjs` (`checkLandRetainedCandidates` message, `:149-165`);
  - `src/setup/registrations.mjs` (≈ 455 lines, including the line above the Git doctor loop at `:6342`);
  - `packages/git/contracts/{ports.v1.json,mutation-census.v1.json}`;
  - `packages/git/rust/tests/{recovery_matrix.rs,scoped_commit_sync.rs}`;
  - besides `grant.rs`, `scoped_commit.rs`, `lib.rs` and the addon's `scoped_commit.rs`.
- **MAIL.** `origin/mailbox/v1-v3` (`b98f5ee0f`, 10-23) edits `packages/git/rust/src/driver.rs` (`:415-450`, `:1543+`), `lib.rs` and `tests/inspect.rs`.

**WAL on this machine (read-only)**
- 322 operation directories and 12 compacted receipts, all `"v":2`.
- Many scratch repositories hold WALs under `forgent-worktrees/*/.fgos/runtime/tmp/`.

## Phases

| # | Phase | Runs | Depends on | Δ Node / Rust / tests (estimate) |
|---|---|---|---|---|
| 1 | [Red tests for every not-yet-reproduced finding](phase-01-red-tests.md) | first, alone | — | 0 / 0 / +280 |
| 2 | [CF01, the one remote door (RT01, F-7, CF07), Worktree/Refs compaction (F-C1)](phase-02-remote-door-cf01-compaction.md) | after 1 | 1 | +10 / +20 / +60 |
| 3 | [Git correctness: CF05, CF06, CF08, CF09](phase-03-git-correctness.md) | ∥ 4 | 2 | 0 / +45 / +10 |
| 4 | [Git cost (F-C4, F-C5; F-C3 kept by evidence) and the Land wait in Rust](phase-04-git-cost-land-wait.md) | ∥ 3 | 2 | −18 / +45 / +10 |
| 5 | [Git consolidation, one port file per slice (leads 05A then 05B)](phase-05-git-consolidation.md) | after 3 and 4 | 3, 4 | −30 / −130 floor, −560 best / −45 floor, −80 expected |
| 6 | [Terminal-control fixes and deletes (leads 06A then 06B)](phase-06-terminal-control.md) | ∥ 2–5 | 1 | −150 / −70 / −70 floor, −280 expected |
| 7 | [Doctor: Git 10 → 6, terminal 3 → 2, one `inspectGit` per run](phase-07-doctor.md) | ∥ 8 | 5, 6 | −45 / 0 / −10 |
| 8 | [Census-gated drain deletes, Q3 spec sentence, Q4 Node arms](phase-08-census-gated-deletes.md) | ∥ 7 | 5; census-gated slices also need both censuses | −12 / −110 (−20 without the census slices) / −40 |
| 9 | [Contracts, specs, reading map, CHANGELOG](phase-09-contracts-specs-docs.md) | after 7 and 8 | 7, 8 | 0 / 0 / 0 |
| 10 | [Conditional Q1: fewer fsyncs on a worktree add](phase-10-conditional-q1-worktree-pin-fsync.md) | only if Q1 = (a) | 9 | 0 / ±15 / +10 |
| 11 | [Conditional Q2: last pane access behind the port](phase-11-conditional-q2-terminal-port-moves.md) | only if Q2 = (a) | 9 | −120 / +90 / ±0 |
| 12 | [Conditional A1: retained-chain count and age in the journal row](phase-12-conditional-a1-journal-retention.md) | only if A1 picked | 9 | +5 / +10 / +5 |
| 13 | [Conditional A2: one repository handle per process](phase-13-conditional-a2-repo-handle.md) | only if A2 picked | 9 | 0 / +40 / +15 |
| 14 | [Conditional A3: cause catalogue](phase-14-conditional-a3-cause-catalogue.md) | only if A3 picked; alone, last | 9 | 0 / large / +20 |
| 15 | [Conditional A4: `PATH` out of the floor key](phase-15-conditional-a4-floor-key-path.md) | only if A4 picked | 9 (after 13 if both run) | 0 / ±10 / +5 |
| 16 | [Conditional A5: herdr capability cache per incarnation](phase-16-conditional-a5-capability-cache.md) | only if A5 picked | 9 (after 11 if both run) | 0 / +40 / +10 |
| 17 | [Close: verify, re-measure, land both machines, rollback, report](phase-17-close-verify-land.md) | last | 9 and every conditional phase that the owner said yes to before 17 starts | 0 / 0 / 0 |

**Sum of the estimates for phases 1–9** <!-- Updated: Red Team 2026-10-23 - one owner per file delta; floors shown -->:
- **Node** ≈ −245: phases 2 +10, 4 −18, 5 −30, 6 −150, 7 −45, 8 −12.
- **Rust:**
  - floor ≈ −145: phases 2 +20, 3 +45, 4 +45, 5 −130, 6 −70, 8 −20 without the census slices, 7 and 9 at 0;
  - best ≈ −665.
- **Tests:**
  - floor ≈ +200: phases 1 +280, 2 +60, 3 +10, 4 +10, 5 −45, 6 −70, 7 −10, 8 −35;
  - expected ≈ −55 with phase 6's re-proved retirements (−210 more) and phase 5's expected −35 more.

The phase 17 closing report gives the measured Δ next to each line. It counts HARDEN commits only, per the parent size rule:
- Rust `tests/` and inline test modules count as tests;
- JSON contracts under `packages/` count as Rust by path and are shown apart;
- WORK's `legacyEvents` removal is not counted.

**The tests ceiling is the one at risk.** If phase 6's mutation re-proofs do not let the Node route cases retire, the plan does **not** weaken a test to meet it. In this order, the big lead:
1. folds phase 1's red tests into their owning cases where a new case only restates an existing setup (the Rust binaries are the owners);
2. retires the duplicates the TEST lane's labels already mark "mirrors-Rust" in the touched files;
3. otherwise reports the overrun to the owner in the decision template, with the per-file numbers.

Phase 17 does not close silently over a ceiling.

**Ceilings (arbitration §2.5):**

| Part | Ceiling |
|---|---|
| Node `src` | ≤ −120 |
| Rust src | ≤ 0 |
| Tests | ≤ 0 (a move from Node to Rust counts as neutral) |
| Layer | ≤ −120 |

A fold that does not pay for itself is dropped, not forced. Each phase file names the folds it may drop.

**Parallel marks.**
- **6 ∥ 2–5.** Phase 6 owns only:
  - `packages/terminal-control/**`;
  - `src/terminal-control/**`;
  - `src/setup/terminal-control-checks.mjs` and its test;
  - `src/runner/dispatch/{herdr-agent.mjs,visibility-session.mjs,provider-account-probe.mjs}` and their tests, plus the one import line at `src/runner/dispatch/herdr-round.mjs:26`;
  - `test/terminal-control/**`;
  - the one `registerFix('terminal-dir')` line of `src/setup/registrations.mjs`.

  None of phases 2–5 touches these files.
- **3 ∥ 4.**
  - Phase 3 owns `repository_config.rs`, `wal.rs` (the scan readers only), `sequence.rs` and their tests.
  - Phase 4 owns `driver.rs` (`list_refs` only), `src/git/{inspect,land}.mjs`, addon `git/land.rs`, the `gitPortOptions` callers it edits and `test/git/land.test.mjs`. It does not touch the loan guard in `src/holder-lock/index.mjs`.
- **7 ∥ 8.**
  - Phase 7 owns `src/setup/{git-checks,terminal-control-checks}.mjs`, the Git and terminal rows of `src/setup/registrations.mjs`, the one `detail` line of `bin/fgos.mjs`, the comment at `src/runner/dispatch/herdr-deadlines.mjs:6`, and `test/setup/{git-checks,terminal-control-checks,checks,event-store-checks}.test.mjs`, `test/git/{native-load,worktree-recovery,recovery}.test.mjs`.
  - Phase 8 owns `scoped_commit.rs`, `sync.rs`, `land.rs` (compat fields), `restore.rs` (compat fields), `wal.rs` (the v1 branch), `publication.rs:856-861`, `src/git/{remote,index,config}.mjs`, the addon arms, `test/git/remote.test.mjs` and `docs/platform/git/spec.md` §2. Phase 7 does not touch `test/git/remote.test.mjs`; phase 8 does not touch `test/git/native-load.test.mjs`.
- **Generated-artifact rule.** Only the big lead regenerates these, on the track branch after each merge:
  - `packages/git/contracts/mutation-census.v1.json`;
  - `test/suite-baseline.json`;
  - the rendered skill surfaces.

  A phase lead never commits them.
- **Phase 2 and the identity crate.** Phase 2 also edits `packages/identity/rust/src/mint.rs:166` and `:206` (the two `sequence_home` callers: claim and give-back) and one identity test. IDENT is told before the merge (D2).

**Lead rules.**
- **Worktrees.** One Sonnet lead per phase runs ak-cook in its own linked worktree:
  - worktree `/home/vantt/projects/forgent-worktrees/t2-pNN-<slug>`;
  - branch `harden/t2-pNN-<slug>`, cut from `harden/t2-git-terminal-control`;
  - `CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/t2-pNN-target`. That is ext4, private to the lead. Never `/tmp` (a 16 GB shared tmpfs) and never a shared target.
- **Node tests.** Only through the one-file command below, which stages the addon first like `scripts/lib/git-addon-stage.mjs` `ensureGitAddon`:

  ```sh
  node --input-type=module -e "import { runSelectedTests, buildTestEnv } from './scripts/run-tests.mjs'; import { ensureGitAddon } from './scripts/lib/git-addon-stage.mjs'; const env = buildTestEnv(process.env); ensureGitAddon(env); process.exitCode = runSelectedTests(process.argv.slice(1), { env }).status;" -- <test files>
  ```

- **Every lead brief carries:**
  - the phase's Create / Modify / Delete / Tests to retire lists;
  - "find the owning test before writing a new one" (design principle 8);
  - a new test names its behaviour in plain words and says why no existing test proves it;
  - a retired test names its new owner by behaviour;
  - no plan ids, phase numbers or finding codes in code comments, test names or commit messages;
  - a Δ-lines report per language;
  - the test-cost line (tests added and retired, new CLI/host spawns);
  - `Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT`.
- **Git-area review.** Every Git-area diff is reviewed by OPC (session `forgent-35`) before it merges into the track branch (owner decision 14). Git area means:
  - `packages/git/**`, `src/git/**`, `.githooks/pre-commit`, the census;

  A phase is not "done" before OPC's verdict.
- **The big lead's run after each merge.** After each phase merges into the track branch, the big lead runs the full suite on the track branch: `npm test` and `cargo test --workspace` with `FGOS_SESSION_ID`, `CODEX_THREAD_ID`, `CLAUDE_CODE_SESSION_ID`, `FGOS_STATE_ROOT` and `FGOS_HOST_BIN` unset.
  - The big lead greps the full log for `run-tests: ERROR` and pastes each line.
  - It compares reds against the known-red list (parent plan, "Known reds on main") and the census diff before calling anything a load flake.
  - The Git crash matrices (`land_crash_matrix.rs`, `recovery_matrix.rs`, the `wal.rs` crash and compaction cases, `tests/publication.rs`) must stay green.

## Owner decisions this plan applies

- **Parent plan decisions:**
  - 1: stop-everything landing; drains live one release;
  - 7: the second machine self-lands in a quiet window, and the owner machine follows a guide;
  - 8: hand-offs are recorded by the receiver;
  - 14: OPC reviews Git-area diffs.
- **Arbitration D1–D9**, as the big lead's decisions inside the approved frame of 10-21 12:05.
- **Q0 assumed yes.** If the owner changes the ceilings, only the "Net size" lines and the fold-drop rules change. If the owner rejects a shape, the phase that carries it stops before merge.

## Decisions made inside the frame (planner; each with its evidence)

- **D-T2-1. Display form equals raw form for every URL the door accepts.** <!-- Updated: Red Team 2026-10-23 -->
  - Every pin in the system and the on-disk fetch-mapping provenance are display strings (Facts).
  - Comparing `redact(raw)` with the pin would drop the ssh account from the pin, because `redact` masks a password-free ssh user (`driver.rs:1757-1778`).
  - So `redact` instead masks only userinfo that `url_has_credentials_or_controls` refuses (passwords, `%`, https userinfo) and keeps truncating a query. The door refuses `?`, `#`, `::`, whitespace, controls and a leading `-` in user or host.
  - For every accepted URL the display form is the raw form. The door therefore compares raw with the pin, refuses credentials on the raw string, and transfers to it.
  - `https` and `file` pins are unchanged. Old `ssh://[redacted]@…` provenance, held only by origins Publication already refused, answers Event Store's existing `remote URL changed; rerun setup` once. There is no migration code.
  - The shared door is **read-and-classify only**. The two call halves (Remote under the caller's `LockScope`, Publication under its borrow) stay separate because they carry different authorities. Both build their argv with `transfer_argv`.
- **D-T2-2. CF07 moves into phase 2.** It is the same function as RT01 (`sequence_home`), and the arbitration's §2.1 remote-door shape names it. Editing that function twice in two phases would be churn.
- **D-T2-3. The remote-door half of E-24 is phase 2.** "RT01 + F-7 via the one remote door" *is* E-24's "two remote doors" item. Phase 5's E-24 keeps the rest: `byte_path`, the zero-OID literal, the branch-in-use scan, the config readers, the dead `cfg(not(unix))` arms. The "dormant" labels go to phase 9.
- **D-T2-4. F-C6 runs in phase 7, not phase 4.**
  - Sharing one `inspectGit` per doctor run needs a per-run object, and the rows that share it are rewritten in phase 7. The door for a per-run object is WORK's `createDoctorRun().once()`, on `work/es-cutover`.
  - If WORK is on main when phase 7 starts, the Git rows use it.
  - If not, the 6-row fold alone takes the run from 9–10 `inspectGit` calls to 4, and no second memo is built (one door). The last step to 1 call is a **named follow-up owned by the HARDEN big lead**, recorded on the board and in the parent ledger the same turn, with the trigger "WORK merged". Phase 17 lists it.
  - E-4 and the E-3 site in `git-checks.mjs` also go to phase 7, because that file is phase 7's.
  - Phase 7 also edits the one `detail` line in `bin/fgos.mjs` (arbitration §2.4). That is the only T2 edit of that file.
- **D-T2-5. Land's async wait takes no loans and holds an explicit port state.** <!-- Updated: Red Team 2026-10-23 -->
  - The addon's `prepare` and `publish` return promises. They run the existing `prepare_land_wait`/`publish_land_wait` loop off the JS thread, using napi `AsyncTask` or a deferred promise. The `napi8` feature includes `napi4`, so no Cargo change is needed.
  - `GitLand` holds `Idle | Pending | Open`. A second call while `Pending` refuses by name. `close()` while `Pending` cancels on settle, so no slot is left held.
  - No production caller passes held handles to Land (`src/runner/merge.mjs:907,951`, `src/workflow/runner.mjs:605,611`). With held handles the call stays a synchronous single attempt, and with a non-zero `waitMs` it refuses. So the loan guard (`src/holder-lock/index.mjs:683-705`) and its synchronous invariant are **not touched**.
  - **Stop rule:** a step-0 spike proves the session, the handles and the driver can cross threads. If they cannot, the lead stops with `BLOCKED`. The big lead then asks the owner, in the decision template, with this alternative: keep a Node spacer that obeys a Rust-owned `retryable` flag and budget.
- **D-T2-6. CF02 removes the doctor-driven expiry close.**
  - `reconcile-scan` observes only. The finding carries the pane id and names how to close it.
  - The core's expiry-close branch, reachable from nothing else (Facts), is deleted with its test retargeted to "scan reports `retain-expired` and closes nothing".
  - User-visible effect: a positive `terminal.retainFailedPaneMs` now means "eligible to close after N ms; a person closes it", which the default `null` already means. CHANGELOG line.
  - The alternative, a terminal `--fix`, contradicts the arbitration's "2 rows, 0 fixes". It is listed in Unresolved questions in case the owner wants it.
- **D-T2-7. E-14 moves what the core owns, nothing more.**
  - Moving to the core: the policy registry, the defaults, the positive-limit rules and the 40×8 floor. They are read by Node from `capabilities`, and the core refuses a sub-floor envelope with a named cause.
  - Staying where their inputs live: the grace-vs-agent-ready rule and the `retainFailedPaneMs` shape. They stay in the Node config adapter and read the T5 constant from its owner module.
  - This is reported to T5 as an input (the arbitration's "grace margin" item is this rule; its input is T5's).
- **D-T2-8. Census timing and scope (D8).** <!-- Updated: Red Team 2026-10-23 -->
  - The owner-machine census answer is in hand **before phase 8's census-gated slices merge**. It is a read-only command the big lead puts into the owner batch, together with every workspace's activated release and any repository on another mount.
  - The census-gated slices merge as **their own merge commit**, so they can be reverted alone.
  - The census can go dirty only through a release older than `869e789d7` (10-19 18:15) acting on a repository. The census therefore also checks the activated releases.
  - Slice B (compat fields) is gated by a code proof, not by a census.
  - The guide re-runs the census only as a confirmation.
- **D-T2-9. F-C3 is kept by evidence (reported to the big lead as a reversal of an arbitration line).** <!-- Updated: Red Team 2026-10-23 -->
  - The two `git var` children exist so that an absent global or system config file that appears later invalidates the floor record and the repository config cache (`driver.rs:636-660`).
  - The `--show-origin` listing cannot name absent files.
  - A hand derivation would have to copy git's lookup and the driver's `GIT_*` scrub (`driver.rs:193-204`). It would also lose the fail-closed `git-config-paths-unavailable`.
  - The saving is one or two children once per process (`CONFIG_SOURCES`).
- **D-T2-10. The digest half of E-22 is kept by evidence (D7 applied without a run).** The T0 canonical-JSON leaf writes numbers as `f64` and orders keys by UTF-16 (`packages/canonical-json/rust/src/lib.rs:28-33,43-46`). The WAL digest writes exact integers and orders keys by UTF-8 (`wal.rs:286-318`). The encoders differ by construction, so no run over today's records could make the switch safe for every future record. The other WAL folds onto T0 leaves (the checkpoint trait, `sync_directories`) proceed.

## Kept on purpose (never deleted in T2)

| Item | Why it stays (evidence) |
|---|---|
| `Policy::LocalMutation` | Live callers `remote.rs:493`, `sequence.rs:200` (red-team) |
| `WalReader::read_ref` (`driver.rs:1859-1914`) | Compaction's `RecoveryReader` for Land, ScopedCommit and Restore (`land.rs:1721`, `scoped_commit.rs:488`, `restore.rs:1227`). It already passes the name. |
| `herdrSpawnAdapter` (`src/runner/dispatch/transport.mjs:676-707`) | Its refusal `herdr-spawn-supervised-only` is the contract of a direct call. Goes to T5. |
| `packages/terminal-control/rust/tests/herdr_driver_live.rs` | The only live-server witness |
| `plugins/fgOS/skills/terminal/pane-owned.sh` | The only "is this pane mine" check until `attach` checks ownership (phase 11 only) |
| Simplicity's INFERRED test retirements (`land-vs-manual-commit.test.mjs:209`, `repo-locks-multiprocess.test.mjs:61,75`, e2e hook overlaps) | Not proved to have another owner (principle 8, arbitration verdict 10) |
| `wal.rs:346-355` live `worktree:{path}` resource form | Current Worktree admission. Not the six legacy acceptances. |
| ConfigChange chains retained | `hooks_provenance` reads them (`repository_config.rs:688-714`, RT02) |
| `Outcome::AbandonedBeforeAttempt`, `Outcome::ConfigApproved` | Spec §10 rules 4b and 4c are the protocol (D8 Q3) |
| Activation tombstone, Rust native-lock inspection | T1 evidence; inspection-only per spec §11 |
| The worker session-server start (`worker-session-boot.mjs:90`) | Process lifecycle, not a pane op. T4 decides (H25). Named in the spec. |
| `checkpoint_tracked_files` until WORK merges | WORK's caller is live on main (`src/state/legacy-event-git-adapter.mjs:7`) |

## Dependencies on other lanes

| Lane | Bite | Handling |
|---|---|---|
| WORK (`work/es-cutover` `00c065295`) | Edits `grant.rs`, `scoped_commit.rs`, `lib.rs`, addon `scoped_commit.rs`, `ports.v1.json`, the census, `recovery_matrix.rs`, `scoped_commit_sync.rs`, `git-checks.mjs` and `registrations.mjs`; brings `createDoctorRun` | Phases 5, 7 and 8 name the overlap in their files list. Whoever lands second rebases and resolves, checking semantics. If WORK is on main at phase 5, delete Rust `checkpoint_tracked_files` there; otherwise the big lead makes it a one-commit follow-up on main after WORK merges (H28). |
| MAIL (`origin/mailbox/v1-v3`) | Edits `driver.rs:415-450,1543+`, `lib.rs`, `tests/inspect.rs` | Board note before phases 4 and 5 merge. Phase 4's `driver.rs` hunks (`:636-660`, `:2294-2377`) do not overlap. |
| IDENT | `mint.rs` calls `sequence_home` | Phase 2 changes the signature and moves the caller (L10). IDENT is told before the merge (D2). |
| T4 / T5 / CFG / TEST | Hand-offs H25–H29 are recorded (parent ledger) | Phase 6 adds one input to T5: D-T2-7's grace rule. Phase 17 re-checks the rows. |
| OPC | Reviews every Git-area diff | The lead pings `forgent-35` with the diff range. OPC's verdict goes into the phase report. |
| DOC (`forgentx-5f`) | Spec files changed | Phase 9 messages the file list before merge. |

## Shared files (lane that also touches them)

`src/setup/registrations.mjs` (WORK, SEAT, every layer), `src/setup/git-checks.mjs` (WORK), `packages/git/contracts/{ports.v1.json,mutation-census.v1.json}` (WORK), `packages/git/rust/src/{driver.rs,lib.rs}` (MAIL, WORK), `packages/git/rust/src/{scoped_commit.rs,grant.rs}` and addon `scoped_commit.rs` (WORK), `CHANGELOG.md`, `docs/platform/{git,terminal-control}/spec.md` (DOC), `docs/specs/reading-map.md`, `test/suite-baseline.json` (TEST), `bin/fgos.mjs` (WORK's doctor loop; T2 edits only the one `detail` line, phase 7).

## Risks (plan-wide; each phase lists its own)

| Risk | L × I | Mitigation |
|---|---|---|
| The remote-door change breaks Event Store sync or `pushRefs` for `https`/`file` origins | L × H | D-T2-1: display equals raw for every accepted URL, so `https`/`file` pins are unchanged. Phase 1 witnesses. `tests/publication.rs` and Event Store `sync_support` stay green. |
| The scp grammar opens a helper or option injection | M × H | The door refuses `::`, a leading `-` in user or host (both forms), brackets, whitespace and controls. Unit cases include `ext::sh -c x` and `ssh://-oProxyCommand=x@h/r`. |
| CF01 unlinks a socket of a server that is still starting | M × H | `dead` needs two refused connects on the same inode across an interval; the post-start poll never unlinks. |
| Compaction changes a same-id replay answer (Refs `Begin::Compacted` → recovery-required today) | M × H | Phase 2 makes a compacted Refs id replay its receipt from the ledger, and keeps the recent tail of 4. Red test first. |
| The Land async wait leaves a slot held or blocks the libuv pool | M × H | D-T2-5: no loans on the async path, explicit port state with cancel-on-settle, step-0 spike, pool-starvation proof or a dedicated thread. Witnesses `test/git/land.test.mjs:179,236` plus the pending-state case. |
| A digest switch silently changes WAL bytes (E-22) | — | Not done: D-T2-10 keeps the twin by evidence. |
| D8 deletes a drain some repository still needs | L × H | Census on both machines plus activated-release check before the census slices merge; those slices are their own merge commit, revertable alone. |
| The doctor fold loses a condition | M × M | Phase 7 condition table; every condition keeps one wiring case. |
| A sub-floor terminal config that runs today is refused at runtime after E-14 | L × M | Named refusal; `fgos doctor` already fails such a config today; the guide checks `terminal-config` before activation; CHANGELOG line. |
| WORK or MAIL lands mid-T2 and conflicts | M × M | Rebase rule; the big lead re-runs focused files of the touched phases. |
| The tests ceiling is missed (red tests added, retirements not proved) | M × M | Red tests are written as extensions of owning tests where one exists. The big lead checks the Δ after phase 6 and before phase 17; folds that do not pay are dropped. |

## Rollback

Before T3 merges:
- revert the T2 merge commit on main;
- re-activate the previous release on this machine and on the owner machine's three workspaces;
- restore `.fgos/distribution.json` and both `config.json` files from the landing backup folder;
- record the revert SHA on the board.

After T3 merges: roll forward. The phase 17 file holds the exact commands.

On-disk formats T2 touches, and whether the previous release reads them:

- **Compacted Worktree and Refs chains:** ledger v2 receipts `"w"`, `"s"`, `"l"` and `"x"`.
  - Every release since 10-19 parses them (`wal.rs:1947-1972`), skips them in `scan`/`active`, and treats the id as bound (`wal.rs:1338-1342`).
  - Under the previous release, a Worktree same-id replay answers as today: `worktree-operation-already-exists`.
  - A Refs same-id replay of a compacted id answers `operation-recovery-required`. That fails closed and never repeats the effect. The 4 newest chains per kind stay whole.
- **WAL record digest:** unchanged (D-T2-10).
- **Terminal store:** the group hint file stops being written. The old release writes it and never reads it (`store.rs:119` has no production reader). No record shape changes.
- **Config:** no key is added or removed. D-T2-6 changes the meaning of a positive `retainFailedPaneMs` (CHANGELOG).
- **Remote pins:** `redact` now keeps a password-free ssh user name. Event Store provenance recorded under the previous release as `ssh://[redacted]@…` asks for one `fgos setup` rerun. After a rollback, provenance re-recorded with the user answers `remote URL changed` under the old release, so the user reruns `fgos setup` there too. That affects only ssh-with-user origins, which Publication refused before T2.

## Done when

- Phase 17's close criteria hold:
  - the parent plan's loop step 9;
  - no High-or-above finding left unreproduced: CF01 and RT01 reproduced and fixed with their proofs green;
  - every arbitration §3/§4 item fixed, closed as "not reproduced" (its red test was green), or "kept by evidence", each with its owning proof named;
  - the ceilings met on the measured Δ;
  - `npm test` and `cargo test --workspace` green;
  - re-measured against the R2 figures;
  - landed on both machines;
  - board, parent plan phase 03 and ledger updated.
- `rg -n "lockUnavailable|function within" src/git` finds nothing.
- `rg -n "herdr" src/setup/terminal-control-checks.mjs` finds no `execFileSync`. This holds only if Q2 = (a); otherwise the spec names the exception.
- `rg -n "remote-protocol-not-supported" packages/git/rust/src` finds one scheme ladder.
- An scp-form origin mints a counter number through that origin, proven by `tests/ssh_transport.rs` or, failing the fake `ssh`, by one recorded manual transfer.
- `fgos doctor --json` lists the 6 Git and 2 terminal rows.
- `src/git/*` ≤ 225 lines in ≤ 12 files.
- `src/setup/git-checks.mjs` ≤ 150.
- `src/terminal-control/client.mjs` ≤ 200 and `config.mjs` ≤ 100.
- `src/setup/terminal-control-checks.mjs` ≤ 140 (≤ 120 if Q2 = (a)).

## Red Team Review

### Session — 2026-10-23 05:00–05:30 (four reviewers in parallel: failure modes, assumptions, security, scope; returned in-session, no report files)

**Findings:** 34 raw, 17 after deduplication: 15 accepted (3 of them modified), 2 rejected. Evidence filter: every finding cited `file:line`, so none was auto-rejected.

**Severity:** 1 Critical, 9 High, 7 Medium.

| # | Finding (reviewers) | Severity | Disposition | Applied to |
|---|---|---|---|---|
| 1 | Phase 11 `attach` ownership trusted a pid the caller sends (security) | Critical | Accept: the caller comes from the OS (the host's parent tuple); the check runs before the idempotent return; `pane-owned.sh` goes only after a sibling-refusal case | Phase 11 |
| 2 | Comparing pins in display form drops the ssh account from the pin (security, assumptions, failure) | High | Accept (modified): `redact` keeps a password-free ssh user name, so display == raw for every accepted URL and the compare is raw (D-T2-1) | plan.md, phases 1, 2, 9 |
| 3 | "One door = Publication's `remote_call`" merges two authority paths (assumptions) | High | Accept: the door is read-and-classify only; both call halves stay and share `transfer_argv` | Phase 2 |
| 4 | The scp grammar admits `ext::`, `fd::`, brackets, `ssh://-o…` and whitespace (security, failure) | High | Accept: the door refuses them; unit cases added | Phases 1, 2 |
| 5 | CF01: "dead = ECONNREFUSED" races a server between `bind` and `listen`; the poll loop's use is undefined (security) | High | Accept: two refusals on the same inode; the poll loop never unlinks | Phase 2 |
| 6 | `sequence_home` has 8 callers, not 1: `mint.rs:206` (give-back) and 5 test sites (scope, security, assumptions) | High | Accept: all listed; the give-back's error behaviour is stated and tested | Phase 2, plan.md |
| 7 | Compaction: the authority is unnamed, a chain stopped before its pin release is never reached, `finish_worktree` has no warning channel (failure) | High | Accept: a shared release-and-compact helper (Publication's) under the operation's own scope; a deferral is named in the receipt; a test for a stopped chain | Phase 2 |
| 8 | Compacted same-id replay covered only `"s"`; callers and rollback not listed (failure, scope) | Medium | Accept: a replay table per outcome; callers listed in the commit | Phase 2 |
| 9 | Async Land: `&mut self` session, no single-flight guard, `close()` races, the loan guard is shared by six ports (failure, assumptions, scope) | High | Accept (modified): explicit `Idle/Pending/Open` state, cancel-on-settle, a step-0 spike; the async path takes **no loans**, so the loan guard is untouched (no production caller passes held handles) | Phase 4, plan.md D-T2-5 |
| 10 | F-C3's hand derivation ignores the driver's `GIT_*` scrub and drops a fail-closed refusal (security, assumptions, failure) | High | Accept: F-C3 is kept by evidence (D-T2-9); the big lead carries the reversal to the owner | Phase 4, plan.md |
| 11 | The digest switch: the encoders differ by construction (f64, UTF-16 key order), so a run over today's records proves nothing (assumptions) | Medium | Accept: E-22's digest half is kept by evidence now (D-T2-10); the run and the golden vector are removed | Phase 5, plan.md |
| 12 | CF03 needs a recorded shell tuple that does not exist; ordinary closes would stop (failure, security) | High | Accept: the launched process is checked by its recorded tuple, read before and after; the shell by herdr's live `shell_pid`; tests for "command finished" and "never launched" | Phase 6 |
| 13 | Census: the mtime heuristic, Land/Restore counted as legacy, "cannot go dirty", `-xdev` blind spot, one merge for all slices (failure, assumptions) | High | Accept: the mtime key is gone; slice B is gated by a code proof; the activated-release check; other mounts named by the owner; per-slice rule; the census slices are their own merge; the owner census comes before their merge | Phases 8, 17, plan.md D-T2-8 |
| 14 | Size: one file counted in two phases; the tests ceiling depends on conditional retirements (scope) | High | Accept: one phase owns each file's Δ; floors and expected values shown; an ordered fallback, with no test weakened | plan.md, phases 5, 6, 7 |
| 15 | New contract members (`paneId`, `capabilities.defaults/policies`, the new refusal cause, doctor `detail`) not listed; `bin/fgos.mjs` contradiction (scope, assumptions) | High | Accept (modified): the members stay (arbitration §2.2 and §2.4 bind them) but are listed in the contracts and docs; the shared-files sentence is corrected | Phases 6, 7, 9, plan.md |
| 16 | CF10: `spawn_with_fds` closes a parent-side snapshot, not at fork (security) | Medium | Reject the change: arbitration verdict 4 chose Process's door, and the door documents the window (`packages/process/rust/src/control.rs:86-90`). Recorded as a named residual and a board input to the Process owner | Phase 6 |
| 17 | CF02: no closer remains for expired retention, so phase 6 should be gated on the owner (failure) | Medium | Reject the gate: arbitration §2.2 binds "observes and never closes". The owner question stays in Unresolved question 2 | — |

Also applied:
- **Fake `ssh`.** It now lives in one new serial test binary (`tests/ssh_transport.rs`), and the fallback is said to leave the end-to-end acceptance open (assumptions 7).
- **Grep gates.** They lost their quote anchors (scope 7).
- **Lead size.** Phases 5 and 6 are split into two sequential leads each (scope 6).
- **Ports pin.** It is a runtime check against the loaded addon, not a parse of Rust source (scope 6).
- **F-C6.** The follow-up has a named owner (assumptions 8).

Rejected sub-claim, with evidence: "the addon lacks the napi feature for async". `napi8` includes `napi4` (`AsyncTask`, deferred promises) in napi-rs 2.16, so `packages/git/node-addon/Cargo.toml:11` needs no change.

### Whole-Plan Consistency Sweep

**Decision delta:**
- D-T2-1 revised: display == raw.
- D-T2-4 gained a named owner.
- D-T2-5 revised: no loans on the async path, explicit state.
- D-T2-8 revised: the census is per slice, has its own merge, and runs before the merge.
- D-T2-9 reversed: F-C3 is kept by evidence.
- D-T2-10 new: the digest twin is kept.

**Terms searched across all files:**

| Term | Result |
|---|---|
| `byte-equality` | Only in D7 context and the closure note |
| `golden` | Gone |
| `registerNativeHandover`, `lock-handover` | Only "not touched" mentions and phase 4's verification run |
| `compactedCommitBeforeCustody`, `retainedLandOrRestore` | Gone |
| `cannot go dirty` | Gone |
| `GIT_CONFIG_GLOBAL` | Only D-T2-9's evidence |
| `display form` | Consistent with D-T2-1 |

**Also reconciled:**
- the size lines in the phases table against each phase header (2, 4, 5, 6, 7, 8);
- the parallel-mark file lists against each phase's Files list (phase 4 no longer owns the guard; phase 7 owns the `detail` line and the `herdr-deadlines.mjs` comment; phase 8 owns `test/git/remote.test.mjs`).

**Open contradictions:** none. **Still open:** owner questions Q0–Q3 and Unresolved questions 2–6.

## Validation Log

### Verification Results
- **Tier:** Full (17 phases). Roles: Fact Checker, Flow Tracer, Scope Auditor, Contract Verifier. The four red-team reviewers carried them, and the planner re-checked every claim a decision rests on.
- **Claims checked:** 64.
- **Verified:** 61. Examples:
  - `worker-session-boot.mjs:33-40,81-84,106-115`
  - `sequence.rs:67-74,180-186`; `sequence_home` 8 sites
  - `remote.rs:24-39,41-90,620-632`; `publication.rs:203,1405-1454,1800`; `driver.rs:193-204,619-660,1757-1778,2294-2377,2512-2514`
  - `refs.rs:336-396,725-746`; `worktree.rs:476,505,509-535`; `wal.rs:1338-1342,1888-1972,2096-2140,2181-2217,2480`
  - `repository_config.rs:688-690`
  - `core.rs:752-819`; `store.rs:124-166`; `driver/herdr.rs:229-274`; `port.rs:203-207`; `record.rs:12-23,53-58`
  - `control.rs:30,86-94,236-264`
  - `src/holder-lock/index.mjs:680-707`; `src/git/land.mjs:5-19`; `src/setup/git-checks.mjs:27-66,135,171`
  - `registrations.mjs:4476-4494,6354-6392`; `bin/fgos.mjs:4233-4236`
  - `canonical-json/rust/src/lib.rs:28-46`
  - the `createGitLand` callers (6); the WORK branch diff `8189f127b..00c065295`; the MAIL branch's `driver.rs` hunks; the census script run on this machine (565 WALs, 0 blockers)
- **Failed and corrected in the plan:**
  - the `sequence_home` caller count;
  - the F-C3 derivation;
  - "closes every inheritable fd at fork".
- **Unverified (left for the lead to re-grep, as each phase file says):**
  - the simplicity seat's line numbers for E-6, E-8, E-9, E-20, E-21 and E-24;
  - the `restore.rs:75-83` compat fields' writer commits;
  - `herdr.rs` incarnation reads at `:480,489`.

### Questions (to the big lead, batched)

The planner runs as a subagent and cannot ask the owner. These go into the owner batch with Q0–Q3:
1. **Census answer (D-T2-8).** Run phase 8's read-only census on the owner machine. Paste every activated workspace release and any repository on another mount.
2. **Reversed arbitration lines (D-T2-9, D-T2-10).** Carry them as notes: two `git var` children stay, and the digest twin stays.
3. **Retention expiry (D-T2-6).** Is the loss of the doctor-driven close accepted? Recommendation: yes.
4. **Grace rule (D-T2-7).** Is it confirmed as T5's input?

**Recommendation:** proceed to phase 1 once Q0 is answered. Phase 1 needs none of the others.

### Whole-Plan Consistency Sweep (validation)

The validation answers changed no plan text beyond the red-team pass above. The questions are recorded here and in Unresolved questions. No contradiction remains.

## Big-lead answers (2026-10-23 04:55, `forgent-a8`)

The big lead re-checked the evidence for every deviation before answering.

1. **D-T2-9 (two `git var` children stay) and D-T2-10 (the WAL digest twin stays): accepted; nothing goes back to the owner.**
   - Verified in the code: the comment at `driver.rs:636-639` says origin records cannot reveal a system or global file that appears later.
   - The T0 leaf `packages/canonical-json/rust/src/lib.rs:28-46` prints every number through f64 (`ryu_js`) and sorts keys by UTF-16 order. `wal.rs:286-318` keeps integers exact and sorts keys by byte order. So the two encoders are not byte-compatible for future records.
   - Both lines close in the arbitration as "kept by evidence". The owner sees them as a note in the T2 closing report.
2. **D-T2-6 (doctor no longer closes expired retained panes): accepted. No terminal `--fix` is added.**
   - A doctor run without `--fix` must not mutate.
   - The default retention already never closes a pane on its own.
   - The behaviour change is a CHANGELOG line in phase 9.
3. **D-T2-7 (grace versus agent-ready stays in the Node adapter): confirmed as T5 input.** It is recorded in the parent plan's phase-06 "Received" list in the same commit as this answer.
4. **D-T2-4 (F-C6): do not wait for WORK.** Phase 7 lands with the row fold (4 calls). Sharing the call through `createDoctorRun` is a follow-up, done when WORK's branch lands.
5. **Conditional phases answered after phase 17 starts** become separate follow-up landings and do not block T3. The exception is Q2, as the planner recommends.
6. **The census on the owner machine (D-T2-8)** goes into the T2 owner-machine guide. Phase 8's census-gated commits merge only after it reads zero.

7. **After phase 1 (2026-10-23 05:20).** The big lead re-ran the phase verification with `--no-fail-fast`. Exactly the 16 new cases are red and every existing case passes.
   - **CF07 closes as "not reproduced".** `redact` reads through `from_utf8_lossy`, so `remote_url` cannot fail on non-UTF-8, and nothing can inject a read timeout without a new seam.
     - Phase 2 keeps the `sequence_home` restructure anyway, because RT01 needs it: the home is decided from the config listing, and a refusal is returned before any claim.
     - It adds no CF07 test.
     - The "absent versus error" half is a property of that shape, not a separate fix.
   - **CF09 has no unit witness** (`sync_refs` and `sync_loose_objects` have no checkpoint seam). Phase 3's proof is OPC's reading review plus a `scripts/git/e1-power-cut.*` run where root is available. It adds no new seam.
   - **The account-change red case** spawns one real `ssh` to `example.invalid` while it is red. Phase 2's fix makes the port refuse before ssh runs, and phase 2's report confirms that the spawn is gone.

8. **F-C1 changes shape (2026-10-23 06:05).** Worktree/Refs compaction leaves T2. Commits 8e1ecbf63, 7bac1c05f and 004807272 are reverted.
   - **Evidence:**
     - OPC's second and third rounds on the compaction found new defects: a compacted Remove replay answered `Ok(())` for a different worktree; starvation was moved, not removed; auto-resume never reached `resume_compaction`. Each fix needed new mechanism: a registration-independent request digest (a v4 receipt that old releases refuse), a durable skip marker, a ledger-based resume.
     - At steady state, compaction costs about 4 fsyncs (≈ 30–47 ms, the lead's measured ≈ 47 ms per chain) on every add, to save about 0.09 ms per retained chain. That works against priority 1.
     - Counsel by kongming (Fable) and OPC agreed on this direction.
   - **Instead:** Refs admission (`refs.rs` `admission_with_land`) and `repository_config.rs` admission drop `wal.scan` and keep only `wal.active`, the same shape as Publication's `admit_pending`.
     - Every retained chain is still fully inspected, once instead of twice. The ledger term is gone, and so is a latent refusal at 100 000 ledger entries.
     - Proofs extend `historical_ledger_over_admission_bound_does_not_block_new_publication` and `remote_unknown_recovery_never_resends_and_corrupt_backlog_never_clears_admission`.
     - A tail-peek step is not done in T2. If it is ever done, OPC's five conditions apply: a gap-free listing; a fully valid last record plus its link to the previous record; the pin check; one rule for unknown artifacts shared with doctor; no cache that turns unknown into terminal.
   - **Backlog item `p-djrgdijd2c`** (minted 2026-10-23 09:05, `docs/backlog.md`): "Compact finished Worktree/Refs WAL chains off the hot path."
     - It runs through a doctor `--fix` or the guarded prune door, never on every add.
     - A create chain is kept while its registration or checkout exists.
     - A compacted Worktree replay answers recovery-required. Refs replay is as in the reverted 8e1ecbf63.
     - The spec sentence comes before the code.
     - Reason: retained chains grow about 80 a day on a busy repository, and admission stays O(chains). Its visibility is owner pick A1.
     - Trigger (OPC, 10-23): admission's own cost stays O(retained chains) × one `inspect` each. `retained_bytes` and the chain count (doctor's `git-operation-journal`) are the signal to schedule the item.
   - **Result:** the phase 2 delta (`3a655a8b3`, `3f1a7ef3c`) got OPC's merge verdict. Admission read p50 at 322 chains went from 32.3 to 15.8 ms, and the tail peek was not done. Phases 1 and 2 were merged into the track branch, and the census was regenerated (`9d935588c`). Only CFG's 5 known `unresolved-binary` sites remain.

9. **Phases 3 and 6A merged into the track branch (2026-10-23 06:55, `e6d1471f7`).** OPC approved every Git commit.
   - **Phase 6A (terminal-control):** only CF02, CF03, CF04 and CF10. The rest of phase 6 waits for Q0.
   - **Phase 3:**
     - CF05, CF06 and CF08. CF08's two commits merge as a pair: the remote's own lost-lease spellings count as stale, and hook or policy refusals keep their stderr.
     - CF09 widened under OPC's review. Every `core.fsync=all` site in the crate (17 of them) now goes through `lib.rs::durable_args`, which also forces `core.fsyncMethod=fsync`. A repository or global `writeout-only` can no longer turn a reported durable effect into one a power cut rolls back. Before this, E1's power-cut proof held only on the default method.
   - **Limits recorded by OPC:**
     - `compaction_suffix` and `compact_inner` still count temporaries.
     - The CF05 negative case injects at the checkpoint, not as an fsync EIO.
     - The test wrapper directories are not removed: the fake ssh bin dir and `fgos-sequence-git-<pid>`.

## Unresolved questions

1. **Q0–Q3** are not yet answered (arbitration §6). Q0 is assumed yes.
2. **D-T2-6, the retention expiry.** With CF02, a positive `retainFailedPaneMs` no longer closes a pane on its own. Is that acceptable, or does the owner want a terminal `--fix`? The `--fix` reverses "0 fixes". Recommendation: accept; the default `null` already behaves so.
3. **D-T2-9 and D-T2-10.** Two arbitration lines are reversed by evidence: the two `git var` children stay, and the WAL digest twin stays. Does the big lead carry both to the owner as notes, or does it want either re-opened?
4. **D-T2-7, the grace rule.** The grace-vs-agent-ready rule stays in the Node adapter and goes to T5 as an input. Does the big lead confirm that this reading of "the grace margin" is right?
5. **D-T2-4, F-C6.** Should phase 7 wait for WORK so the `inspectGit` call is shared through `createDoctorRun` at once, or land with 4 calls and a follow-up? Recommendation: do not wait.
6. **Timing of conditional phases.** If the owner answers Q1, Q2 or A1–A5 after phase 17 starts, do they become separate follow-up landings that do not block T3? Recommendation: yes, except Q2, which changes the terminal spec's raw-herdr exception and is better landed before T3 opens.
