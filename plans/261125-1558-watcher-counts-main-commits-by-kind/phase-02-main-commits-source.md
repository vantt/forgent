# Phase 2: A main-commits Observe source

Capability: `code:implement`

## Inputs

- `apps/fgos/src/wiring/observe_sources/plan_history.rs`: the pattern to copy (opening the Git
  door, `walk_changes`, `read_paths_at_many`, record shape, `inside` window check, the
  test-only `with_state_root`).
- `apps/fgos/src/wiring/observe_sources/plan_text.rs`: `plan_fields`, reused for the
  plan-status test.
- `apps/fgos/src/wiring/observe_sources/mod.rs`, `apps/fgos/src/wiring/metrics_sources.rs`
  (about line 69, where `PlanHistorySource` is registered), and `apps/fgos/observe-kinds.json`.
- `packages/supervision/rust/src/land.rs` `target_branch` (about line 696): how the trunk is
  resolved through `resolve_trunk`. Read only.
- `packages/git/rust/src/walk_changes.rs`: `WalkChanges` (about line 28) and `walk_changes`
  (about line 72). Check whether an empty `paths` means every path.
- `packages/git/rust/src/inspect.rs` `resolve_trunk` (about line 268) and
  `packages/git/rust/src/lib.rs` `read_paths_at_many` (about line 492).
- The plan's "Decisions taken in this plan" section, for the kind order.

## Files this phase may write

- `apps/fgos/src/wiring/observe_sources/main_commits.rs` (new)
- `apps/fgos/src/wiring/observe_sources/mod.rs`
- `apps/fgos/src/wiring/observe_sources/tests/mod.rs`
- `apps/fgos/src/wiring/metrics_sources.rs`
- `apps/fgos/observe-kinds.json`

## Steps

1. Add `MAIN_COMMIT_KIND = "fgos.main.commit"` to `mod.rs` and declare it in
   `observe-kinds.json`:
   - subjects `["branch"]`;
   - attrs `fgos.main.commit.kind` (values `code`, `plan-status`, `backlog`, `discussion`,
     `report`, `plan-note`) and `fgos.git.commit`;
   - measures `fgos.main.commit.note` and `fgos.main.commit.<kind>` (one per kind, each `1` on
     the matching record), so a definition can `sum:` each count and the note share.

   Update the module doc comments to say that `mod.rs` now has four kinds.
2. `MainCommitsSource` (source id `main-commits`):
   - Resolve the trunk with `resolve_trunk`. Accept it only when it is known from an explicit
     or remote-default source, the same rule as `land.rs` `target_branch`. With no known trunk,
     or no repository, return no records and no error.
   - Resolve the local branch tip of the trunk.
   - Walk it with `walk_changes`, using `first_parent: true`, `since` from the window, all
     paths, a small `max_commits` bound (for example 2000), and a byte bound.
   - Emit one record per commit. Its subject is `branch:<trunk name>`, its id is
     `main-commit:<sha>`, and its `ts` is the committer time in UTC. Keep it only if `ts` is
     inside the window.
3. Kind of a commit: walk its changed paths in the plan's kind order and take the first match.
   For `plan-status`, read the parent and commit sides of each changed `plans/<dir>/plan.md` in
   one `read_paths_at_many` batch and compare `plan_fields(..).status`, as `plan_history.rs`
   does. A changed `plan.md` whose status did not change is a `plan-note`. Set
   `fgos.main.commit.note` to `1` for `plan-note`, `report` and `discussion`, and to `0`
   otherwise.
4. Register the source in `metrics_sources.rs` next to `PlanHistorySource`.
5. Tests in `observe_sources/tests/mod.rs`. Build a temporary repository with a remote HEAD set
   and these first-parent commits: code, plan status flip, plan note, report, discussion,
   backlog row, a mixed code+report commit, and a merge. Assert:
   - one record per commit, each with its kind;
   - the mixed commit is `code`;
   - the merge commit is sorted by its first-parent diff;
   - the window bounds are honored;
   - no trunk means no records.

   One test owns all of this, "the main-commits source sorts each trunk commit by the most
   durable kind it touched". No existing test proves it, because the source is new.
6. Time the source on this repository's main over a 2-hour window and put the time in the
   phase result summary (the lead copies it into the plan's report at close). It must be
   under 1 s.

## Verify

```bash
cargo test -p fgos --lib observe_sources
npm run fgos:dev -- metrics query --kind fgos.main.commit --since -2h --json
```

Pass: the tests are green, and the query lists this repository's recent main commits with a
kind on each.

## Rollback

Revert the phase commit. Nothing reads the kind until phase 4.
