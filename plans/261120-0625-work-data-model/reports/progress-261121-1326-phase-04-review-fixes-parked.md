# Progress: phase 4 built, reviewed and fixed; parked on `q-b3acdzi4ur`

Lead: head:lead-forgent-261120-0625-work-d-ce9f6. Date: 2026-11-21, Asia/Saigon.

## What ran

- The footprint gained `packages/run-supervisor/rust/{src,tests}/head_request.rs` (3f009686d), so phase 4 left its park.
- Unit `c-2083-1795241647579` (`unit-run-1795241648319-9f4d4d2a`, claude, outcome `pass`) worked in worktree `261120-0625-work-data-model-p04b`. It carried over the earlier uncommitted draft from `-p04` and added the `/*` directory grant to `head_request.rs`. The runner committed `45a30de38` on branch `work-data-model/p04b`.
- The lead ran verify with `CARGO_TARGET_DIR` in its scratch space, because the worktree's `target/` is read-only for the lead. Results: `head_request` 47 passed; `session_write_publish` 4 passed and 1 failed; `head-grants` 6 passed. The failing step expected `git status --porcelain` to be empty, but the scene always has an untracked `.fgos/`.
- A code-reviewer subagent ran on `main...HEAD`. It found three blocking issues:
  1. The `plans/backlog/*` grant reaches the sandbox policy: `src/runner/dispatch/session-attempt.mjs:47` copies `grant.writes`, and `confinement/workspace-paths.mjs:44` refuses glob characters. Secretary and supervisor heads would be refused at launch. The lead confirmed this by reading both files. `session-attempt.mjs` is outside the footprint.
  2. The grants dropped `docs/backlog.md` and `docs/discussions` before phase 5 moves the data.
  3. The index was built from the working tree, a refused item stayed on disk (a retry was then refused `write-path-dirty`), and `report.errors` was ignored.
- Fix unit `c-25941-1795242174838` (`unit-run-1795242178400-c51a990a`, outcome `pass`) committed `479749b58`:
  - It keeps the docs grants beside the new ones. Phase 5 removes the docs entries.
  - It builds the index only from tracked items plus the item being written.
  - It refuses on report errors and on a duplicate id.
  - It removes a file the request itself created when publish refuses it before committing.
  - It refuses a `base` given for a missing file as `write-base-stale`.
  - It retires the duplicated exact-grant test.
  - It fixes the `.fgos/` assertion.
- The lead re-ran verify on `479749b58`: `head_request` 47/47, `session_write_publish` 5/5, `head-grants` 6/6, and `cargo clippy -p fgos -p fgos-run-supervisor --all-targets -D warnings` clean.

## Why parked

Blocking finding 1 needs a change outside the footprint, or a different grant design. It is asked as `q-b3acdzi4ur`. The recommendation is to add `session-attempt.mjs` to the footprint and map `<dir>/*` to `<dir>` for the sandbox in `requirementOf`. Branch `work-data-model/p04b` is not landed until the answer arrives. Phases 5, 6 and 7 wait on phase 4.

## Non-blocking findings left for later (outside this phase's files)

- `head_request.rs` creates a file through `Dir::replace`, whose `renameat` would overwrite a file created by another process in the race window. Fixing this needs a no-replace create in `packages/durable-file`. Ids come from the mint, so a collision is unlikely.
- `session_write_publish.rs` pulls `portfolio.rs` in with `#[path]` and `#[allow(dead_code)]`. It belongs in `wiring/mod.rs`, which is outside the footprint.
- Discussions sit two levels deep (`<id>/DISCUSSION.md`), so session write cannot create them. The shaper writes them through its sandbox grant and `land --paths`. Acceptance criterion 4's wording about `plans/discussions/` should read that way.
