# Phase lead report: HARDEN T2 phase 9, contracts, specs, reading map, CHANGELOG

Branch `harden/t2-p09-docs` (from `harden/t2-git-terminal-control` 282662a64), worktree `/home/vantt/projects/forgent-worktrees/t2-p09-docs`. Cargo target `/home/vantt/projects/forgent-worktrees/t2-p09-target`. Docs, contracts and six code comments only; no source or test logic changed.

## Commits

| Commit | What | Git area (OPC) |
|---|---|---|
| `f06b30fa3` | specs, docs, contract text, CHANGELOG | `docs/platform/git/spec.md` and the Git rows of the registry contract: spec diff only |
| `7f8602e83` | "dormant" removed from the first-line comments of `src/git/{index,config,recovery,land}.mjs` and `packages/git/node-addon/src/git/{config,recovery}.rs` | yes, comment-only |
| last commit | census regenerated (hashes of the six comment-edited files and the payload digest; still exactly 5 unresolved sites) | no |

## Docs changed, with the code fact each now states

### `docs/platform/git/spec.md`
- Header of the "Current surface" paragraph (§3): ports pinned by `packages/git/contracts/ports.v1.json` and `test/git/native-load.test.mjs`; result codes by `packages/git/rust/tests/contracts.rs`. Remote has only `pushRefs` in Node (`src/git/remote.mjs`), Publication facade has no `fetchRefs` (`src/git/index.mjs:11`), RepositoryConfig facade has no `recover` (`src/git/config.mjs`), Checkpoint stays for `src/state/legacy-event-git-adapter.mjs:7`.
- "One remote door" (§3): `GitDriver::remote_target` `packages/git/rust/src/remote.rs:44` (raw read, pin compare, `url_has_credentials_or_controls` `:613`, `is_scp_form` `:635`, `userinfo_is_credential` `:609`); used at `remote.rs:150,220`, `sequence.rs:75,90,104,169`, `publication.rs:1284`. `redact` keeps a password-free ssh user (`driver.rs:1758-1764`). Sequence home: `sequence.rs:66-77`.
- §2: Receipt block gains the optional `warnings` (`lib.rs:190`, `receipt.v1.schema.json:154`). The result-code and outcome-kind sentence was checked against `ResultCode` (`lib.rs:166-177`, ten codes) and `publication.rs:590`; unchanged.
- §3 Land wait (was "spaced single native attempts awaited on the event loop"): `packages/git/node-addon/src/git/land.rs` state `Idle|Pending|Open`; `land-call-pending` `:49,188`, `land-session-already-open` `:50`, `land-worker-failed` `:71`, `land-wait-with-held-locks` `:146`, `land-session-closed` `:163`; facade `src/git/land.mjs` has no retry loop.
- "Dormant" gone (`rg -i dormant docs/platform/git/spec.md` empty): headings and dated lines at the old `:138,140,163,235,369,373,515,530,853`. The line `:138` "no production callers yet" is deleted (callers: `src/runner/worktree.mjs:20-22,25,470`, `src/runner/execution/commit-unit-work.mjs:4-5`). The stale "Phase 02 handoff note" is replaced by the fact that `createGitPublication` (`src/git/index.mjs:7`) has no `src`/`bin` caller. Two stale "remains for phase 07" clauses removed.
- §11: the two native-lock lines are one paragraph: inspection is Rust-only (`native_lock.rs:216` `repair_native_index_lock`, report fields `:55-64`, runbook `:69`), refusal text `native_lock.rs:65`. No Node door is named; the refusal sentence names the §11 runbook only.
- §10 "Journal implementation facts": WAL on `fgos_durable_file::FileSystem` (`wal.rs:5,69`), directory syncs `wal.rs:1050,1369`; `durable_args` forces `core.fsyncMethod=fsync` (`lib.rs:644-648`, used in remote, refs, sequence, scoped_commit, publication, land); digest kept (`wal.rs:287`); Worktree and Refs chains NOT compacted, admission reads once through `wal.active` (`refs.rs:106` shared by Worktree `worktree.rs:464`, `repository_config.rs:175`, `publication.rs:1246`); compaction callers are Land, ScopedCommit, Sync, Restore ack, Publication only (`rg "\.compact\("`); backlog `p-djrgdijd2c` (`docs/backlog.md:63`).
- §12 doctor: six-row table, four fixes, `detail`, 4 `inspectGit` calls (5 with a non-origin remote), `createDoctorRun` absent from the tree (`rg createDoctorRun src test docs` empty), so the one-call target is stated as the one implementation gap. Rows and ids from `src/setup/registrations.mjs:6348-6378` and `src/setup/git-checks.mjs`. Deferred-Land paragraph now names the journal-row warning.
- §20 "Lịch sử quyết định" (new section before Appendix A, dated 2026-10-23, pointer `plans/reports/council-261023-0402-harden-t2-arbitration.md`): D1-D9, the in-plan decisions D-T2-1..5, the two lines kept by evidence (D-T2-9, no compaction), kept-on-purpose list, publication ceremony (`tests/publication_children.rs`), named WAL answers.
- Line `:144`: `git-transport-config` -> `git-repository-config`.

### `docs/platform/terminal-control/spec.md`
- §2: the core owns pane facts, limits, defaults, policy names and the 40x8 floor; Node reads defaults and policy names from `capabilities` (`route.rs` `core_config`, `src/terminal-control/config.mjs`). Exceptions named: `ensureWorkerSession` raw `herdr --session ... server` (`src/runner/dispatch/worker-session-boot.mjs:150`), and the three read-only probes that are still raw in this tree: `pane get` (`src/setup/terminal-control-checks.mjs:25`), `defaultHerdrRun` (`src/setup/registrations.mjs:4389`), `plugins/fgOS/skills/terminal/pane-owned.sh`.
- §3: the ten operations including `capabilities` and `reconcile-scan` (contract `operations` keys); `reconcile-scan` observes only; retained slot is not closed by anything past `until` (`core.rs:688,799-807`). Activity-launch sentence deleted (no `activity_start` in the crate; `activity.state` stays for `inspect`, `core.rs:619`).
- §4: group-hint sentence deleted (writer, reader and `groups/` removed).
- §9: core rules versus the two round rules (`terminalConfigProblems` `config.mjs:68-81`); `retainFailedPaneMs` only schedules a report; floor refused by the core (`route.rs:24`, contract `configRefusals`); "Directory" bullet: the store creates `<stateRoot>/terminal`, no `terminal-dir` fix (`test/setup/terminal-control-checks.test.mjs:274`); doctor table is two rows.
- §11 and §12: retained-slot row and the foreground-check sentence rewritten (`core.rs:753-766`).
- §15: dated 2026-10-23 entry (CF01-CF04, CF10, D-T2-6, D-T2-7, dead surface, kept on purpose).
- Last-reviewed date moved to 2026-10-23.

### Other docs
- `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`: row shape `{id, description, passed, message, detail?}` (`bin/fgos.mjs` doctor loop); the Git check paragraph now names `git-repository-config`, the journal's retained-Land warning, and the fix id `git-publication-refspecs` as a fix.
- `docs/specs/distribution.md`: rows 5h, 7, 7b and the setup side-effects bullet lose `terminal-dir` and `terminal-config`; dated 2026-10-23 history entry added.
- `docs/how-to/install-fgos-in-a-project-and-use-doctor.md`: `terminal-config` merged into the `terminal-control` row; `herdr-diagnosis.json` (nothing writes it: `rg herdr-diagnosis src bin packages plugins scripts` finds only the account probe's read) removed from the file table and the two troubleshooting steps.
- `docs/platform/component-boundary.md`, `docs/platform/event-store/spec.md` (`git-publication-refspecs` row -> `git-repository-config`), `docs/specs/runner.md` (doctor row names; `retainFailedPaneMs` no longer "24 hours by default", the default is `null` and nothing closes a retained pane).
- `docs/specs/reading-map.md:55-56`: both entries updated (no path moved).
- `packages/terminal-control/contracts/terminal-control.port.v1.json`: the `release` effect and the `reconcile-scan` rule no longer say a scan closes an expired retained pane (`core.rs:733-807`). `test/terminal-control/contracts.test.mjs` green.
- `CHANGELOG.md [Unreleased]`: 8 T2 lines kept (each change once), 2 lines added (durable Git writes and the sequence/config/journal fixes; named Git answers), floor-refusal line fixed to name `terminal-control`, remote line gains the URL refusal grammar. Phase 4/5C/8 speedups and the Node-arm deletions are not user-visible and have no line.

## Decisions I made against the brief
- No LOC budgets written into the specs (`src/git/*` <= 225 in 12 files, `git-checks.mjs` <= 150, `client.mjs` <= 200, `config.mjs` <= 100, `terminal-control-checks.mjs` <= 140): the docs rule says never to hand-maintain counts. Measured now: `src/git` 216 lines in 12 files (met), `git-checks.mjs` 167 (not met), `terminal-control-checks.mjs` 138 (met), `client.mjs` 235 (not met), `config.mjs` 111 (not met). The reports of phases 6B and 7 already name the misses.
- The terminal spec's raw-herdr exceptions list three probes beyond the worker session-server start, because phase 11 is not in this tree and the code still has them. Phase 11 must delete those three sentences when it lands.
- The git spec history entry says the census-gated drains (six legacy `worktree:{root}` acceptances, v1 ledger arm) are separate commits and not yet part of this tree (branch `harden/t2-p08-census-slices`); `scoped_commit.rs` and `sync.rs` still hold `legacy_resource`/`compact_matches`. If that branch lands before this one, one sentence in §20 needs "deleted".
- The brief's "§10: compaction now covers Worktree and Refs chains" is not written: the big lead's answer 8 reversed it.

## Left because they need code or are outside the docs
1. `packages/git/rust/src/land.rs:1` still says "Dormant Land transaction" (outside the file list of this phase).
2. `packages/git/rust/src/lib.rs:602` "stay dormant" is true (kept as the brief says).
3. `packages/terminal-control/rust/src/core.rs:688` refusal text "already retained; the pane closes when its retain expires" is false since the scan stopped closing; one word of user-visible text.
4. `src/runner/dispatch/provider-account-probe.mjs:122-125` reads `herdr-diagnosis.json`, which nothing writes (phase 6B named it for T5).
5. `docs/platform/run-supervisor/spec.md` still says the pane is retained "until `terminal.retainFailedPaneMs`"; correct as a window for the report, left unchanged.
6. The Node git/terminal doctor follow-up (shared `inspectGit` through `createDoctorRun`) is recorded in §12 and needs the Work lane.
7. DOC lane message (`forgentx-5f`) with the changed paths was not sent from this worktree: `docs/platform/git/spec.md`, `docs/platform/terminal-control/spec.md`, `docs/specs/distribution.md`, `docs/specs/runner.md`, `docs/specs/reading-map.md`, `docs/platform/component-boundary.md`, `docs/platform/event-store/spec.md`, `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`, `docs/how-to/install-fgos-in-a-project-and-use-doctor.md`, `CHANGELOG.md`. The big lead relays it.

## Verification
- Node one-file command (addon staged, session variables unset): `test/terminal-control/contracts.test.mjs test/git/native-load.test.mjs test/setup/registrations.test.mjs test/architecture.test.mjs test/setup/checks.test.mjs test/setup/doctor-fresh-run.test.mjs test/scripts/prepare-release.test.mjs test/docs/decisions-corpus-retired.test.mjs test/runner/dead-vocabulary-guard.test.mjs test/scripts/check-decision-citation-drift.test.mjs`: tests 228, pass 227, fail 0, skipped 1; no `run-tests: ERROR` line. (Tests chosen by `rg -l` for the changed doc basenames.)
- `cargo test -p fgos-git --test contracts`: 4 passed.
- `node scripts/git-one-door-scan.mjs`: 5 unresolved-binary sites (`bin/fgos.mjs:3472,3616`, `merge.mjs:938,968`, `worktree.mjs:146`); census regenerated in the last commit, same five.
- `rg -n -i "dormant" src/git packages/git/node-addon/src/git`: empty. `rg "git-transport-config|git-trust-topology|git-durability-capability|terminal-dir|terminal-config\b" docs src test`: history entries and the core refusal code `terminal-config-below-floor` only.
- Links added point to `plans/reports/council-261023-0402-harden-t2-arbitration.md` (exists) and `docs/backlog.md` item `p-djrgdijd2c` (exists).
- No MDView preview opened from this worktree.

Status: DONE_WITH_CONCERNS
