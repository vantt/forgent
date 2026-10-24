# Work → Event Store cutover: design-lap, forgentX

Done 2026-10-24 21:32–21:45 (Asia/Saigon) by `SEAT` (`claude-lcpq@design-lap`, `lead:SEAT`), following WORK's [guide for the other machines](guide-261024-1500-work-cutover-other-machines.md). The owner said "go, land forgentX đi em" at 21:31. DOC (`claude-4c3b@design-lap`) was parked for the whole run. mdview and mcp-skill-hub were not touched; each needs its own "go".

## Result

- **Release** `sha256:6f6df0f1ca62a7bf971696cf8f61695d9a8c37d92b64737b82bbf27c3bfd81bb` (858 files, the same count as machine A), built from `origin/main` `902fe7852` in a clean detached worktree (`.fgos/runtime/landing-261024-es/wt`) with its own Cargo dir. `fgctl` was reinstalled from the same tree. The previous release was `a970a7e6…`.
- **Checkout:** fast-forwarded to `902fe7852`, then to `95a1b1f9b` after activation. The fence `.fgos/events` is a tracked file, and no tracked `.fgos/events/`, `events.jsonl` or `state.json` remains.
- **History:** `fgos rebuild` Work consumer `revision` = `af617cb5602a82d8c1ff844a7fc0d79b1836866cead655a7380b8d46cc4b6747` = `REV`, counts `work` 1195 and `decisions` 5545 (equal to machine A). `refs/fgos/remotes/origin/legacy` = `7e456df67…` = the fence's `legacyRefOid`.
- **Doctor:** 139 of 148 rows pass. `active-release-matches-checkout` passes. Every `event-store-*` row passes except `event-store-legacy-layout` (see Findings). The other 8 red rows were red before the land: `tool-registry-configured`, `work-step-vocabulary`, `root-drift`, `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings`, `git-worktree-recovery`, `git-mutation-one-door`. `fgos events status`: `refspecMissing` false, `integrityErrors` and `missing` empty.

## Steps (guide numbering)

1. **Stop check.** Not clean.
   - Eight untracked shards sat in `.fgos/events/`. They were never committed, so they are not part of the imported history: `tsk-1xy`, `tsk-177` and 21 decisions (09-23 to 10-20), three `executor.dispatch`-only files, and SEAT's own smoke item `tsk-6nbuxb46ts`. They were moved, not deleted, to `.fgos/runtime/tmp/landing-es-cutover-261024/untracked-events/`. WORK decides whether any of them is merged by hand (board 21:55).
   - `quiesce-scan` of the old release listed 36 processes with cwd in forgentX: the SEAT and DOC sessions, codex daemons, the mdview and gitnexus MCP servers, and the owner's shells. None of them was a Work writer: DOC was parked, and SEAT ran the pull and the activation in one shell command, with no `fgos` call between them. `fgctl upgrade` passed on the first try, without `git-predecessor-writer-live`.
2. **Fetch.** `origin/main` contained `MAIN` `51bee6b53`.
3. **Build** (release build plus distribution staging).
4. **Backups** in `.fgos/runtime/tmp/landing-es-cutover-261024/`: distribution, activation, project config, global config (mode 600), refspecs, hashes, HEAD and `fgctl.prev`.
5. **Pull.** No tracked local edits; `merge --ff-only 902fe7852`.
6. **Activate.** `fgctl stage` and `upgrade`: exit 0 on the first try. `distribution.json` restored, `fgctl verify` exit 0. The hashes are unchanged except `.fgos/config.json`, which the pull changed.
7. **Setup.**
   - `fgos setup`: `configAddedKeys` empty; `globalConfigAddedKeys` = `eventStore.seal`, `eventStore.sync` and `eventStore.rebuild`, as the guide expects. Both event refspecs were added.
   - `fgos events sync`: exit 0.
   - `fgos rebuild`: `revision` = `REV`.
8. **Doctor:** as above.
9. **Resume:** writers on forgentX resume. Board line 21:45.

## Findings

- **`event-store-legacy-layout` is red on every machine except machine A.** The check (`packages/event-store/rust/src/legacy_import.rs` `verify_legacy_tree`) compares the legacy commit's tree, minus `seal.json`, with the tree object named by `seal.json` `treeOfFgosEvents` (`2e99db8e0fb60dbe3d0739936162047263ef9e4f`).
  - That tree object is not reachable from any ref, so `fetch` never brings it to another machine, and the check fails with "legacy ref missing or differs from fence".
  - SEAT computed the hash of `7e456df67`'s tree without `seal.json`, writing nothing to the repo: it equals `2e99db8e…` exactly. The data is right; only the check is wrong.
  - SEAT did not write the object locally to make the row pass. The fix belongs to WORK: either compute the expected tree hash without needing the object, or make the object reachable from the legacy ref.
- **`fgos internal quiesce-scan` from `/tmp` refuses** ("no .fgos/installation found"), so the guide's step 1 must run with cwd inside the workspace (DOC's note).

## Rollback

Spec §18 (`fgos events export --format legacy-layout`; a person decides). Backups are in `.fgos/runtime/tmp/landing-es-cutover-261024/`.
