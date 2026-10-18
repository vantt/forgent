# Phase 08: migration and rollback export

- **Depends on:** phases 03, 06, 07 merged (strictly after 07). Import and parity need only Git 01. The commit step needs **Git 05 merged** (ScopedCommit in the main checkout under main-checkout 50 with `cutoverGrant`, the hook grant check, route `fgos internal git-grant-check`) and Git 05's release active on the workspace where it runs.
- **Branch / worktree:** `es/p08-migrate`, `.claude/worktrees/es-p08`.
- **Model / effort:** opus, rigor critical; 22h.
- **Blocks:** phase 09.

## Context

- Spec §18 (steps 1-7, rollback), §19 (tracked stale view and backups), §21 (`event-store-legacy-layout`), §23.2 items 6 and 7.
- Git spec §7 (cutover grant: borrower of main 50, WAL intent with `exactPaths` equal to the staged `.fgos` deletions, `legacyRefOid` equal to `refs/fgos/legacy`; every other `.fgos` deletion refused); Git 05 adds `sealDigest` (digest of the legacy commit's `seal.json`).
- Tracked files here: `.fgos/events.jsonl`, 90 shards, `.fgos/state.json`, two `events.jsonl.backup-*` (scout §2); `../mdview` tracks only `.fgos/events.jsonl`.
- D10, D11.

## Requirements

1. **`fgos events migrate [--check]`**, run in the main checkout of one repository with writers stopped (it runs the holder-lock quiesce scan and refuses when it is not clean). It first runs the bodies of the three setup fixes (lock dirs, machine id, refspec) so it works before any `fgos setup` of the new release (D8).
2. **Inventory.** From HEAD's tree (read through Git, never the work tree): `.fgos/events.jsonl`, `.fgos/events/*.jsonl`, every tracked `**/porting/events.jsonl` anywhere in the tree with its sibling tracked `state.json` (forgent: `docs/distillery/state/porting/`), tracked `.fgos/state.json`, `.fgos/events.jsonl.backup-*`, and the `merge=union` line for events in `.gitattributes`. Any part may be absent. More than one porting directory in one repository stops for the owner (D9). Refuse a dirty or untracked event file (step 1 of §18 not done).
3. **Import (§18 step 3).** One commit on `refs/fgos/legacy` (kind `legacy`, no parent): tree holds the event files byte for byte under their current names, porting logs under `porting/<original tracked path>` (they become stream `project:porting`), and `seal.json {v: 1, kind: "legacy", fromCommit, treeOfFgosEvents}`; CAS from Absent through the Publication port under `event-seal`, then `event-seal` is released before step 5 (rank 58 must not be held when Git takes main-checkout 50). An existing `refs/fgos/legacy` equal to the computed commit is reused; a different one refuses.
4. **Parity (§18 step 4).** Rebuild the Work and porting views through the new reader from `refs/fgos/legacy` into a temporary cache; compare byte for byte with (a) the legacy fold of today's code over the same files and (b) `.fgos/cache/state.json` written by the previous release when its snapshot anchor matches the tracked files; when `--baseline <file>` is passed (forgent's runbook, §18 step 2), compare with it too. Any difference stops before the commit and prints the entity diff.
5. **Commit (§18 step 5, D11, Q5).** One Git ScopedCommit in the main checkout with `cutoverGrant {exactPaths, legacyRefOid, sealDigest}`: `exactPaths` are the tracked `.fgos` event files, `state.json` and both backups; the authorized non-`.fgos` paths are `.gitattributes` (events line removed, file kept when other lines remain) and the tracked porting logs and views of step 2; it adds the tracked fence file `.fgos/events` `{legacyRefOid, sealDigest, fromCommit}` (D18). Under Q5's default (b) the runbook route `scripts/event-store/cutover-source-commit.mjs` (refuses outside the fgOS source repository) passes the reviewed code commit as Git's `sourceCommit` (M9), with the hook run from HEAD's tree; under (a) no code is included and the code commit lands first by the normal door. Message: `chore(events): move event truth to refs/fgos (D-ADR0055)`.
6. **`--check`.** Steps 2-4 with no ref and no commit written (the import is computed, not published); prints the plan of step 5.
7. **Before migration (D10, Q6).** In a repository with tracked legacy event files and no fence file, Work and porting reads come from the tracked files at HEAD through the phase 01 port (read-only, `readLegacyFromHead`), and writes refuse `event-store-migration-required` with the command to run. A clone with the fence file but no refspec or no legacy ref at the pinned OID refuses writes with `event-store-refspec-missing`.
8. **Doctor body `event-store-legacy-layout`:** fails when tracked event files, `.fgos/events` as a directory, tracked `state.json` or backups, tracked porting logs, or an events `merge=union` line exist after migration, or when `refs/fgos/legacy` (own or mirror) is missing, differs from the fence file's OID, or its tree differs from `seal.json.treeOfFgosEvents`.
9. **Rollback support (§18):** phase 07's `export --format legacy-layout` is the rollback path; this phase adds a fixture test that runs migrate, appends v4 events, exports legacy layout and checks the parity report.

## Files

| Action | File |
|---|---|
| create | `src/verbs/events/migrate.mjs`, `scripts/event-store/cutover-source-commit.mjs` (Q5 b only), `packages/event-store/rust/src/legacy_import.rs`, `test/event-store/migrate.test.mjs`, `test/event-store/migrate-cutover-grant.test.mjs`, `test/event-store/rollback-export.test.mjs`, `test/fixtures/event-store/legacy/**` |
| edit | `src/setup/event-store-checks.mjs` (legacy-layout body) |

## Steps

1. Inventory and import with `--check`; fixtures: equal `ts`, missing `src` or `h`, mixed v3 and v4-like lines, porting log, mdview-shaped repository (baseline only).
2. Parity against the legacy fold and a recorded baseline.
3. Commit step through Git 05 in a real temporary main checkout with the real hook; grant refusals.
4. `event-store-migration-required` refusal; legacy-layout doctor body.
5. Rollback export fixture; opus review; merge (dormant: verb not registered until phase 09).

## Validation

```bash
cargo test --locked -p fgos-event-store legacy_import
node --test test/event-store/migrate.test.mjs test/event-store/migrate-cutover-grant.test.mjs test/event-store/rollback-export.test.mjs test/git/cutover-grant.test.mjs
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<p08 build> npm test
```

Vectors:
- **Legacy parity (§23.2 item 6):** import reproduces the pre-cutover Work view byte for byte on every fixture and on a copy of this repository's `.fgos` at the current main commit (copied into a temporary repository, never the real checkout).
- **Rollback (§23.2 item 7):** legacy-layout export plus parity report on a fixture with v4 events.
- **Grant:** the commit deletes exactly the listed paths once; an extra `.fgos` deletion in the same commit refuses; a replayed grant refuses; a wrong `legacyRefOid` refuses; under Q5 (b) the runbook route with a source commit whose parent is not HEAD, or that touches `.fgos/**` or `.githooks/**`, refuses, and the hook that judges the commit is HEAD's.
- A second run after success is a no-op with exit 0 and a message.
- Fresh repository where `fgos setup` never ran: migrate creates lock dirs, machine id and refspec first.
- Kill between the legacy CAS and the commit, and between ScopedCommit's TargetAttempt and its outcome: a rerun completes or names the Git record; nothing half-applied stays in the main work tree.
- Old-release fence: after the commit, creating `.fgos/events/<shard>.jsonl` fails with `ENOTDIR`.
- Porting: the tracked `docs/distillery`-shaped log is imported, its parity view is non-empty, and both files are deleted by the commit.

## Risk

| Risk | L × I | Mitigation / signal and response |
|---|---|---|
| Parity fails on the real repository | Medium × High | `--check` on a copy weeks before the cutover (phase 10); any diff is investigated before landing. |
| The previous release's cache is stale | Medium × Low | Compared only when its anchor matches; the legacy fold comparison always runs. |
| Old release writes tracked files after the commit on another machine | Low × High | Stop-everything on every machine (Q2); `event-store-legacy-layout` fails; the new hook keeps refusing `.fgos` changes on worker branches. |

## Rollback

Code: dormant until phase 09 registers the verb; revert the merge. A migration run: before the cutover commit is pushed, revert that commit (spec §18); `refs/fgos/legacy` may stay, an old release never reads it. After the push: the §18 rollback (legacy-layout export, a person decides with the parity report, writers stop, files committed, previous release activated).
