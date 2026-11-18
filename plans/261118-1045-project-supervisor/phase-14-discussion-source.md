# Phase 14 — Discussion status source

Produces `fgos.discussion.status`: one record each time a discussion's `discussion: <state>` marker flips on `main`
(PS-15). It reads `main`'s git history through the Git component door, the same way ops-metrics phase 11 reads the
`status` of a plan, so there is no second history reader. Rust, in `fgos-supervision`; registered in the host by
phase 16.

## Inputs
- Waits: ops-metrics phase 1 (`RecordSource`, kind registry) and phase 5 (query reads the source). Re-read their landed
  trait in Step 0; the signature below is a sketch.
- Marker sites at the current tree: line 3 in `docs/discussions/ops-metrics/DISCUSSION.md:3` and
  `plans/reports/shaping-261118-1045-supervisor-owner-questions.md:3`; line 6 in `docs/discussions/windows-plain-path-fold/DISCUSSION.md:6`; most older discussions carry none (see
  `rg -n "^discussion:" docs/discussions plans/reports/shaping-*`). So the marker is found in the first 12 lines, as
  `^discussion:\s*(\w+)\s*$`. Values seen: `settled`; a file with no marker has no state.
- ops-metrics phase 11 (`plans/261118-0936-ops-metrics/phase-11-head-and-plan-sources.md`, step 2) and the Git
  door it landed for reading a path at each commit of `main`. Locate it in Step 0
  (`rg -n "plan.md|first.parent|read_objects|path.*history" apps/fgos/src/wiring/observe_sources packages/git/rust/src`).
  The Git crate today has `read_objects` (`packages/git/rust/src/inspect.rs:664`) and `resolve_commit_ref` (`:989`)
  but no path-history walk of its own.
- Kind shape from phase 3 `observe-kinds.json`: `fgos.discussion.status` (attrs for `from`, `to`, the path).

- Dependencies are already in the crate (phase 3 declares `fgos-observe`, `fgos-git` and the Git test support).
- Trunk: `packages/git/rust/src/inspect.rs:237` (`resolve_trunk`); the watcher fetches before each full tick (phase 11), so the source reads the trunk's remote-tracking ref when it is ahead of local `main`, else local `main`.

## Footprint
`packages/supervision/rust/src/discussion_source.rs`, `packages/supervision/rust/tests/discussion_source.rs`.

## Steps
0. Re-grep inputs. If ops-metrics phase 11 did not land a reusable history read, or the Git door has none, stop with
   `NEEDS_CONTEXT`: a new history reader is a new mechanism and needs the owner's choice, not a copy here.
1. `discussion_source.rs`: a trait `DiscussionHistory` (`commits(paths_glob) -> Vec<Commit>` oldest first,
   `blob(commit, path) -> Option<String>`) satisfied by the one door found in Step 0, plus
   `DiscussionSource::records(window) -> Vec<Record>`.
2. Paths: `docs/discussions/*/DISCUSSION.md` and `plans/reports/shaping-*.md`, on the trunk only (see Inputs). A branch that has not
   landed has no discussion state.
3. For each path, walk its commits in order, read the marker of each blob, and emit a record when the state differs
   from the previous commit's (the first commit's `from` is `none`). Record `ts` is the commit time; `ref` is the
   discussion dir (or the report file stem); attrs `from`, `to`, `path`. Id is deterministic: `<path>@<commit>`, so a
   replay is idempotent.
4. A commit that deletes or renames the file emits nothing. A marker that is unreadable or absent in a later commit
   keeps the previous state (no flip is invented). The window filters by `ts`.
5. Tests with a fixture repo (built with the Git test support), one behaviour each:
   - draft -> settled across two commits gives one record `none->draft` and one `draft->settled`;
   - an edit that leaves the marker alone gives no record;
   - a commit on a side branch not merged to `main` gives no record;
   - both marker sites (`docs/discussions` and `plans/reports/shaping-*`) are read;
   - a replay over the same window gives the same ids;
   - with a fetched remote-tracking ref ahead of local `main`, a flip pushed from another clone is read.

## Verify
- `cargo test -p fgos-supervision --test discussion_source` passes; clippy `-D warnings` clean.
- Phase 13's `discussion-settled` fixture uses this source's record shape; run
  `cargo test -p fgos-supervision --test definitions` after both land.

## Rollback
Revert the phase commit. Phase 16 then has no source to register; `discussion-settled` raises nothing.
