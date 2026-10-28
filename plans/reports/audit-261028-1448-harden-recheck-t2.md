# HARDEN re-check of T2 (Git, Terminal-control) at main `b4817283f`

Read-only audit, 2026-10-28. Code read in the pinned worktree `/home/vantt/projects/forgent-worktrees/harden-recheck`. Compared against the arbitration (`council-261023-0402`), the closing report (`closing-261023-2228`) and owner decisions 14, 18-23, 26-29, 46, 47.

**Verdict: DRIFT (3 small, 3 large). No High finding. No new Git spawn bypasses the door. Terminal-control is unchanged in Rust since close.**

## What held

- **One-door scan** (`node scripts/git-one-door-scan.mjs --root <pin>`, read-only): 0 undeclared sites. Class counts now: standalone-skill-script 4, hook-read-context 21, configured-binary 94, rust-test 139, argv-runner 14, production-sandbox-probe 4, uncalled-wrapper 10, git-driver 1, sandbox-door 2. The closing report states no class counts, so I compared with the committed census at the T2 merge `a01f725bf`: 5 sites then (all `unresolved-binary`, CFG's), 0 now; classes then rust-test 111, configured-binary 87, hook-read-context 21, uncalled-wrapper 20, argv-runner 13, standalone-skill-script 3, sandbox-probe 4, sandbox-door 2, git-driver 1.
  - The five CFG sites are closed: they became `configured-binary` through the config door (`60853554b`, `4f0428b81`, 10-25).
  - New entries are not Git spawns: `argv-runner` `mailbox/.../adapters/version.rs` (runs `codex`, mailbox lane); `process/.../mapped.rs` replaces `containment/linux.rs` for the bwrap runners (a move); `standalone-skill-script` `.agents/skills/instruction-audit` (declares `oneDoor: standalone`, tracked by `24f4e2a8a`, 10-25); `configured-binary` `scripts/record-mailbox-hook-fixtures.mjs` (a host-bin call).
  - `uncalled-wrapper` fell 20 to 10 because the Event Store `verbs/events/*` were deleted (`b6927cce9`).
- **Raw `git` spawn in `src bin scripts packages apps`** outside the driver and the sandbox door: none in product code. The only matches are Rust tests, `scripts/lib/sandbox-git.mjs` (the door) and a prompt-template text file.
- **Rust Git crate has no upward dependency** (`packages/git/rust/Cargo.toml`: write-scope, durable-file, holder-lock, process). `fgos-terminal-control`: durable-file, process, holder-lock. `src/git/*.mjs` import only holder-lock, `native/door.mjs` and `util/session-identity.mjs`.
- **Terminal-control**: `packages/terminal-control` has no change since `a01f725bf`. No `tmux` reference in code. The one raw herdr exec named by the spec, `worker-session-boot.mjs:167`, is unchanged (no commit on `worker-session*.mjs`, `herdr-round.mjs`, `herdr-deadlines.mjs` since close). The deleted surface (`pane-owned.sh`, `herdr-agent.mjs`, `label_tab`, `roleHint`, `reportState`, `createGitNativeLockRepair`, `fetchRefs`, `inspectRemote`) has not come back (`rg` over src bin scripts packages apps test: only unrelated name matches).
- **Node budgets**: `src/git` 216 lines in 12 files (met, same as close); `terminal-control-checks.mjs` 120 (met); `client.mjs` 235 (unchanged, missed at close).

## Findings

| id | sev | size | file:line | what drifted | introduced by | fix shape (RUL104) | owner |
|---|---|---|---|---|---|---|---|
| T2-1 | Medium | large | `packages/git/rust/src/scoped_commit.rs:1810` (`checkpoint_tracked_files`), `packages/git/node-addon/src/git/scoped_commit.rs:77`, `src/git/scoped-commit.mjs:9`, `packages/git/contracts/ports.v1.json:55`, `packages/git/rust/tests/scoped_commit_sync.rs:411,424` | The checkpoint operation has no product caller. Its last caller left in `9f23f7438` (2026-10-22); WORK's cutover is on main (`42c5a0a55`, 10-24). The arbitration said T2 deletes it when that lands, and the closing report left it open as "slice 12" because the branch was not on main. Both facts changed. | Dead since `9f23f7438` (WORK); never deleted (HARDEN) | Delete the Rust function, the addon arm, the facade method name, the `ports.v1.json` entry and its two Rust tests in one change; `test/git/native-load.test.mjs` pins the contract file. Item H28. | HARDEN decides; OPC reviews (Git files) |
| T2-2 | Medium | large | `packages/git/rust/src/grant.rs:1-99`, `scoped_commit.rs:28,1430` (`validate_cutover_seal`), `wal.rs:153`, `packages/distribution/rust/src/git_grant.rs`, `apps/fgos/src/main.rs:186`, `.githooks/pre-commit:545-552`, `packages/git/contracts/internal-route.git-grant-check.v1.json`, `wal-record.v1.schema.json:541`, `test/git/cutover-grant.test.mjs` | The cutover grant has no producer: all six product and script callers pass `cutoverGrant: null` (`src/runner/execution/commit-unit-work.mjs:125`, `scripts/knowledge-migration.mjs:303`, three scripts under `scripts/git/`), and `rg exactPaths\|legacyRefOid src bin scripts apps` is empty. The hook still shells to the host for a grant that cannot exist, and its comment (`.githooks/pre-commit:545`) still says WORK "will remove" the legacy declarations. This is the arbitration's F-3 hand-off, now ripe. | WORK cutover `42c5a0a55` (10-24) removed the last producer | Remove the grant path end to end (Rust check, WAL field, schema, route contract, hook branch, test), changing every caller in the same change (L10). WAL schema change is a version event: needs the owner. | WORK (cutover) with OPC (Git files); owner decision on the WAL field |
| T2-3 | Medium | small | `src/setup/registrations.mjs:5283-5292`, `src/setup/git-checks.mjs:25-32,50,90,95,111` | Each Git doctor row calls `checkGit` on its own and re-runs `inspectGit` (5 rows, plus a second call for a non-origin remote, `gitFloor`, and the fixes). The target was one `inspectGit` per doctor run (arbitration §2.4, hand-off H30). Its trigger, `createDoctorRun`, is on main (`src/setup/checks.mjs`, `registrations.mjs:5276`, used by the Event Store rows, landed with `26c4e166f`/`42c5a0a55`), and the Git rows were not moved onto it. | Not introduced: never done; trigger met 10-24 | Give the Git rows `check: (cwd, run = createDoctorRun()) => run.once('git-facts:'+cwd, ...)` like the Event Store loop at `:5278`. No new mechanism. | HARDEN (`registrations.mjs` is shared; one loop edit) |
| T2-4 | Medium | large | `src/state/store.mjs:514-549` (`refsGitDir`, `readBranchTip`), `src/runner/dispatch/runtime-inspection.mjs:259` (`workspace`), `src/runner/dispatch/confinement/resources.mjs:251` (`resolveWorkspaceGitMetadata`) | Three hand-written readers of `.git` files, `commondir`, loose refs and `packed-refs`, outside the Git door (Inspect and Refs ports exist and the disk-only trusted root exists: `3fb3c15e5`). `readBranchTip` is a second ref reader that does not honour reftable or git's own packed-refs rules. None is a spawn, so the census cannot see them. All three predate T2 (`1ee3cc43f` 2026-09-10, `badc2c724` 2026-09-15, `0de440773` 2026-10-17); T2's census only covered spawns. | Pre-T2; missed by T2 and by the census | Route each through the Inspect/Refs port (a trusted-root read already exists; a branch-tip read exists in Refs). Needs a decision whether the state-lock path may call the port (hot-lock rule). | Owners: state (`store.mjs`), dispatch (the other two); Git files OPC |
| T2-5 | Low | small | `src/setup/git-checks.mjs` (184 lines) | Node budget `git-checks.mjs` <= 150 was already missed at close (169); it grew to 184. The growth is `2bac54ec6` (10-25, doctor recovers ScopedCommit): Node now takes the `dispatch-cwd` custody per operation, tests `fs.existsSync(worktree)`, and picks which kinds are recoverable (`:130-165`). That is a recovery decision in the adapter. | `2bac54ec6`, 2026-10-25, doctor/Git recovery | Move the per-operation custody and "checkout gone/busy" choice into the Recovery port's `reconcile`, leaving Node to list and print. Only if the owner wants the budget honoured; otherwise record the miss. | HARDEN / OPC |
| T2-6 | Low | small | `scripts/record-mailbox-hook-fixtures.mjs:1212`, `scripts/herdr-cockpit-notify.mjs:66`, `scripts/herdr-cockpit.sh:26-51` | Raw `herdr` execs outside the port, in `scripts/` (which `package.json` `files` ships). The closing report says the worker session-server start is the only raw herdr exec left; this is not true of these scripts. The mailbox script's `herdr server stop` (added `ecdb84f3d`, 10-23, mailbox lane) pairs with `ensureWorkerSession`, the same session-server ownership as the named exception. The cockpit files are operator tooling from 2026-07/09, not terminal-control callers. | `ecdb84f3d` (mailbox, test script); cockpit pre-existing | Name them in the same exception list as the session-server start, or let the mailbox script end its session through the same boot module. No code growth. | mailbox lane (script); HARDEN (list) |

## Status of the layer's open items

| Item | State |
|---|---|
| Slice 12 / H28, delete Rust `checkpoint_tracked_files` | Trigger now met (T2-1). Open, ripe. |
| H30, one `inspectGit` per doctor run | Trigger now met (T2-3). Open, ripe. |
| F-3, `git-grant-check` after cutover, six `cutoverGrant: null` callers | Ripe (T2-2). |
| Phase 8 slices A and C (six `worktree:{root}` acceptances, v1 compact-receipt branch) | Still unmerged: `wal.rs:3230` builds a `"v":1` entry and `publication.rs:801` still handles `legacy-compact-receipt-incomplete`. Waits for the `fg-server` census; see Unverified. |
| Five `unresolved-binary` sites (CFG) | Done: census sites 5 to 0. |
| R9 lock fence final-probe race | Closed at `8a9e3fb79` per the closing report; not re-read here. |
| H29 test move-down (TEST), `p-djrgdijd2c` Worktree/Refs compaction | Open; `p-djrgdijd2c` is still `proposed` in `docs/backlog.md`. Admission cost grows with chains until then. |
| `p-txiatvrts4` (head in listing) | Done in backlog. |
| H25, H26, H27 | Recorded elsewhere (T4, T5, CFG); not re-verified here. |
| CF10 residual (parent-side fd snapshot) | Not re-checked (Process-door owner). |
| Q8c size overrun | Accepted by the owner (decision 28); no re-measure made. |

## Unverified

- **`fg-server` census zero and no workspace on a release older than `869e789d7`**: needs the board line or a `fgos` census run on that machine; decides slices A and C.
- **`client.mjs` per-group promise queue** (`:181-221`) keeps allocate/close ordering in Node while the core has no group lock (`rg lock` in `core.rs` finds nothing about groups). The file comment accepts two same-named tabs across processes. Would confirm: a two-process allocate on one group against the fake herdr. Probably accepted behaviour, so not listed as a finding.
- **One-proof overlaps** (Node and Rust proving the same behaviour, `test/git/*` 28 files vs `cargo test -p fgos-git`; `test/terminal-control/contracts.test.mjs` vs Rust `contracts.rs`): not examined; TEST's D4 move-down owns it.
- **Stale tests of removed mechanisms**: none found for the deleted surface (`group-queue.test.mjs` covers a mechanism that still exists). `test/git/cutover-grant.test.mjs` is the one that retires with T2-2.
- No test was run.

## Ideas to add (owner decides)

- **Census of hand-parsed repository files.** Problem: T2-4's three `.git`/`packed-refs` readers are invisible to the spawn-only scan. Evidence: the scan reports 0 undeclared sites while `store.mjs:514` reads `packed-refs`. Benefit: the one-door gate would cover reads as well as spawns. Cost is a scan rule, so owner's call; T2-4 can be fixed without it.

## Unresolved questions

1. T2-2 changes a WAL record field and a route contract: does the owner want the grant removed now, or kept until the next WAL version event?
2. T2-5: is the `git-checks.mjs` budget (150) still a target after Q8c, or is 184 accepted?
3. T2-6: is `scripts/` herdr use outside the port acceptable as operator or test tooling, with the spec's exception list widened?
