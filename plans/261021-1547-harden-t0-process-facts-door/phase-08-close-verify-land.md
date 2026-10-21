---
phase: 08
title: "Close: independent verification, re-measure, closing report, landing on both machines"
status: done
depends_on: [06]
parallel: "sequential, last; after phase 07 when SEAT has landed, otherwise phase 07 stays open and is listed in the close report"
effort: ~1d (plus the quiet-window wait for landing)
net_size: "Node 0 / Rust 0 / tests 0; this phase measures and prints the layer's Δ table"
---

# Phase 08 — Close: verify, re-measure, land

## Context

Parent plan loop steps 6–9 and proposal §4.6 (independent verification), owner decision 7 (T0 lands when it closes: the second machine self-lands in a quiet window after telling GIT/ES; the owner machine follows a Vietnamese guide at a time the owner picks), owner decision 1 (stop-everything landing on every workspace and both machines; old data needs one read path), the [T0 baseline](../reports/research-261021-1210-harden-t0-baseline.md) §1 (call classes, machine, load class, method), the memory rules for landing (self-land here once gates pass; write the owner-machine guide and link it on the board; pull and read the board first). The big lead runs this phase, not a Sonnet lead.


## Carried from phase 5 (big lead, 2026-10-21 20:50)

- **Owner-machine canonical corpus run before activation.** Phase 5 moved `proof-helpers` and `reconciliation-planner` onto the door's `canonicalJson` after a byte-equality run over this machine's `.fgos/assignments` (12 865 documents, 4 265 981 subtrees, 0 mismatches) plus the rest of `.fgos/**` and `test/fixtures`. The owner-machine guide runs the same corpus script (its content is in the phase 5 lead report) over each of the three workspaces **before** activating; any mismatch stops the landing on that machine.
- **Steps need the door.** An attempt step process started with a bare environment now exits 70 (fail-closed); production passes every `FGOS_*` variable (`attemptStepEnv`). Smoke must run one real attempt on each workspace after activation.
- **Accepted exception for the canonical-json spec (phase 6):** `src/runner/dispatch/recovery-planner.mjs` keeps its own `stableStringify`, because `test/verbs/dispatch-recovery.test.mjs` pins its imports to `node:crypto` (a purity contract) and its stored records hold only hash outputs. Also kept with reasons: `effective-execution-contract.mjs` and the release-manifest pair (ledger H11), `trust-store.mjs` `sortedJson` (codex byte order).

## Requirements

**Independent verification (on the merged track branch, before landing)**
- A fresh linked worktree of the track branch; `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID` and `FGOS_SESSION_ID` unset in the shell; a private `CARGO_TARGET_DIR`; the host built from the tree (`npm run fgos:dev -- version` once, which stages it) and `FGOS_HOST_BIN` pointing at it.
- `cargo test --workspace` green; `npm test` green. Any failing file is re-run alone with phase 1's `runSelectedTests` one-liner (it stages the addon and the manifest into the child's env in one process; the first draft's two-process `node -e … ensureGitAddon` form left the second process without the env, red-team Scope-F5); a file that passes alone and fails in the suite is a load finding for TEST, recorded with its name, not a T0 blocker, unless it is one of this plan's files.
- `fgos doctor` on this workspace through the dev host: `process-containment` passes, `coordination-abandoned-claims` is absent, the row count is 144.
- `test/process/one-door.test.mjs` green; the `rg` lines of plan.md "Done when" hold.
- The net-size table, counted by content so Rust test code is never charged to Rust (red-team Scope-F8): Node = `-- src bin scripts`; Rust = `-- packages apps ':!packages/*/rust/tests' ':!packages/*/contracts'` minus the lines of `#[cfg(test)]` modules inside `src/` (counted by hand from the diff hunks and listed); tests = `-- test packages/*/rust/tests` plus those `#[cfg(test)]` hunks; all on HARDEN's commits only (SEAT/GIT/ES/TEST commits rebased in are excluded by listing HARDEN's commit SHAs). Expected: Node ≈ −472 (process slice ≈ −300), Rust ≈ +91, tests ≈ −82 (plan.md "Sum of the estimates"); the Rust increase is the owner-decided binding and is named as paid by the Node deletion in the close report, per the parent plan's step 9 rule ("every increase names the deletion that pays for it"); the tests figure misses the arbitration's −150 ± 30 because the seven red tests and the one-door scan are new proofs the arbitration did not count, and the report says so.

**Re-measure (same machine and load class as the baseline: second machine, ext4, 1-minute load recorded before and after)**
- The same call classes with the same method (300 warm calls after 5 warm-ups; 30 fresh processes for cold; routes as whole `spawnSync` calls): liveness judge live/dead, `resolveHolderLiveness`, `selfRecord` (replaces `pidExists`), `signalByIdentity`, first door load (dlopen plus verification, per OQ-1's outcome), atomic replace with fsync (now `replaceDurably`), create-only (`installOnce`), the no-fsync class (unchanged), canonical JSON small and 200 keys through the door, `fgos internal process-observe` (now absent: write "removed"). The route-spawn line stays as a reference only.
- Rust-side: `judge_here` p50/p95 before and after S1 (phase 4's bench), `install_once` loser path before and after RT-M7.
- Test wall time for the T0 files of baseline §3 and `cargo test -p fgos-process` (S-C1).
- Doctor wall time for the whole run (per-row timing is phase 07 of the parent plan, owner decision 6).

**Closing report** (`fgos convention name --json` for the name, under `plans/reports/`): the before/after table; the net-size table (expected next to measured, per phase); the findings table of arbitration §3 with the commit that closed each; the retired tests with their owners; the on-disk formats changed and whether the previous release reads them (gateway registry `record` tuple: yes, through `pid`/`port`; an old pid-only entry: `IdentityUnknown`, never signalled; `activation.json` optional field `nativeAddonIdentity` under OQ-1 (a) unless OQ-3 reverses it: ignored by the previous release; the `process-observe` route and the doctor row: no data); open items (phase 7 if SEAT has not landed; canonical twins handed to phase 07 with their counts); the list of hand-offs this layer confirmed (H8 implemented or decided, H11, H12). Link it from the parent plan's phase 01 and the Phases table.

**Landing (owner decision 7, order written here)**
1. Pull main, read the board's owner-machine lines, then merge the track branch to main (one merge commit; record its SHA) once every gate above is green.
2. Tell GIT/ES on the board: addon namespaces and `versions()` fields, the `activation.json` field (if OQ-1 (a)), the quiet window.
3. Second machine, in the quiet window: stop check (`fgos session`/`fgos run` idle, no lead running; `ps` for fgos hosts and gateways; `fgos gateway stop` if one runs), build the release (`scripts/build-rust-distribution.mjs`), stage and activate on `~/projects/forgent`, `fgos doctor`, smoke (`fgos version`, `fgos lock fence` on a free lock, `fgos gateway start && fgos gateway status && fgos gateway stop`, one `withStateTx` write through a verb that uses it).
4. Owner machine: a Vietnamese guide (`fgos convention name --json`, kind guide) with the same stop check, build, stage, activate on forgentX, mdview and mcp-skill-hub, doctor and smoke per workspace, and the rollback line; link it on the board; the owner picks the time.
5. Re-measure (above) on the activated release on the second machine; finish the closing report; update the board row (lane T0 closed, phase 7 status) and add one line at the top of its `log.md`; update the parent plan's Phases table status through the plan CLI.

**Rollback (recorded in the report)**: before T1 merges, revert the merge commit on main (record the revert SHA; a later re-merge must revert the revert first) and re-activate the previous release on all three workspaces of the owner machine and on the second machine (the previous `artifactDigest` is in each `activation.json` `previousArtifactDigest`). Gateways started by the new release are stopped before re-activation (stop-everything). After T1 has merged on top: roll forward, never revert underneath.

## Files

**Modify**: `plans/261021-1118-harden-low-layers-bottom-up/plan.md` (Phases table, hand-off ledger H8/H11/H12 status), `plans/261021-1118-harden-low-layers-bottom-up/phase-01-t0-process-facts-and-leaf-crates.md` (link to the closing report, carry-list status), the board plan and its `log.md` (one line), `docs/backlog.md` only if a new item is opened (canonical twin hand-off, load findings for TEST). **Create**: the closing report and the owner-machine guide under `plans/reports/`. **Delete**: none. **Tests to retire**: none.

## Steps

As the requirement sections, in order: verify, re-measure on the tree host (cold numbers), land on the second machine, re-measure on the activated release, guide for the owner machine, report, board.

## Verification (exact)

- `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID CARGO_TARGET_DIR=$HOME/.cache/fgos-work/t0-close-target npm test`
- `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID CARGO_TARGET_DIR=$HOME/.cache/fgos-work/t0-close-target cargo test --workspace`
- `npm run fgos:dev -- doctor --json` → 144 rows, `process-containment` pass.
- After activation on the second machine: `fgos doctor` through the installed shim; `active-release-matches-checkout` is expected to fail only if main moved after activation (baseline §4).

## Net size

0 / 0 / 0 for this phase; it prints the layer's table.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| Another lane's test lead loads the machine during the measurement | H × M | Record load before and after; if the 1-minute load differs from the baseline's class (≈ 8), note it and re-run the warm classes in a quieter minute. |
| The owner machine's three workspaces have gateways or sessions running at landing | M × H | The guide's stop check comes first and names the commands. |
| SEAT has not landed, phase 7 open | M × L | The close report lists it; T0 closes (the re-exports keep callers working); parent phase 02 waits. |
| OQ-1 (a) requires re-activation to take effect and the owner machine lands later | L × L | Until then the owner machine hashes per process, exactly as today. |

## Rollback

As written above.

## Done when

The closing report is linked from the parent plan, the before/after and net-size tables are measured, both machines (or the second machine plus the linked guide) run the release, the board carries the close line and the open items, and the parent plan's phase 01 status is set through the plan CLI.

## Lead brief essentials

This phase is the big lead's own work. Report only what you saw yourself: every number in the report comes from a command whose output is kept in `.fgos/runtime/tmp/` (not committed) and quoted. Δ-lines measured on HARDEN's commits only. Report and guide names from `fgos convention name --json`.
