# Owner machine: what changed on main from the Git and Event Store lanes

Written 2026-10-18 15:15 (Asia/Saigon) by the big lead of the GIT and ES lanes (session `ac420727`, second machine). For every session on the owner's machine, especially the 6.3 lead (`forgentx-95`).

## Nothing to activate now

Main at `7162365bb` contains Git phase 01 Lane A and Event Store phases 01-02 (merge `611d3aa44`, `58a7b6f3b`) and the Git read operations (`7162365bb`). Plain `fgos` keeps running the activated release, so nothing changes until a landing. No landing is requested for this; the Git lane will ask for one stop-everything landing when phase 01 is complete.

Gate before the merge (on the second machine): Rust 214 pass, 1 known failure (below); clippy clean; `npm test` 8091 pass with no failure introduced by the merge (81 were a missing release build in the scratch worktree and passed after building; 1 load-timing flake; 3 fail identically on clean main).

## What the next landing will change at runtime

- **Holder-lock borrow cleanup (Rust and Node, one rule).** After `run_borrowed`, cleanup kills the borrowed command, its process group and any other holder of the lock description (only an escaped descendant can hold it). It no longer kills the lock holder's own unrelated children that are between fork and exec; it waits for them. Before, Node killed every description holder. `src/holder-lock/index.mjs` now delegates the sweep to the Rust rule. Holder-lock spec §5/§8 record it (dated 2026-10-18).
- **Borrow refuses a replaced lock file** (`lock-resource-replaced`).
- **`fgos-process` containment:** a short command that exits before its identity is read is no longer `spawn-failed`; a gate that already exited counts as an empty domain.
- New dormant crates and files: `packages/git/rust` (fgos-git), `packages/durable-file/rust`, `packages/event-store/rust`, `packages/canonical-json/rust`; lock rows `event-seal` (58) and `event-append` (70) in the registry. No production caller yet.

## For the 6.3 lead (`terminal-mode/integration`)

1. **Merge main into your integration branch before your next phase.** Expected overlaps: `src/setup/registrations.mjs` and `docs/architecture-manifest.json` (Git lane B will add a few rows; keep both sides), `packages/holder-lock/contracts/lock-registry*.json` (main added the two event rows), `packages/process/rust/src/platform/windows_job.rs` (both sides made the same `is_none_or` lint fix).
2. **Failing test, pre-existing on main:** `fgos-process` `tests/containment_bwrap.rs:167` `containment_terminal_gate_dies_with_a_killed_supervisor` fails on a real host with bwrap (it fails identically on main before these merges). It belongs to terminal mode.
3. **Holder-lock behavior change above** may change expectations in tests that assumed every description holder is killed; the Git lane updated the Rust test `borrow_git.rs` and added a pre-exec vector in `test/holder-lock/`.
4. **Deferred to after 6.3 lands (do not do it in 6.3):** moving `packages/run-supervisor/rust/src/publish.rs` (`publish_once`) and `packages/terminal-control/rust/src/store.rs` onto `fgos-durable-file`, and `packages/run-supervisor/rust/src/envelope.rs` onto `fgos-canonical-json`. The Git/ES lanes will do these moves after you land.
5. **The runner-commit cwd lease (N7) belongs to the Git plan, phase 04,** not to 6.4. It extends the `dispatch-cwd` lease that `src/run-supervisor/direct-launch.mjs` holds during the attempt; it starts only after 6.3 lands.

## Where the lanes are

Program board rows GIT and ES; branches `git/integration` and `event-store/integration` (both at main), worktrees on the second machine under `.claude/worktrees/`. Next for GIT: phase 01 Lane B (release manifest, registry, `fgctl` C5, doctor, setup), review, E3 against the owner-set budgets, then the stop-everything landing on both machines. Next for ES: phase 03 (reader, order, cursor) is running.
