# Gates — plan 261127-1220-confined-rust-offline

Integrated tree: worktree `261127-1220-confined-rust-offline-p03`, tip `f5dc9b1cff` (main `9840b971a4` plus the
two live-check commits). Run as `fgos release check --worktree` (ticket `c-21665-1795830747349`, started
2026-11-28 01:52 UTC), which runs the project's release `checks` unconfined on the committed tip.

| Gate | Result |
|---|---|
| `npm test -- --test-concurrency=6` | exit 0: 6594 tests, 6567 pass, 0 fail, 27 skipped, 810.8 s |
| `cargo test --workspace` | exit 0: 462 test binaries, 4810 passed, 0 failed, 14 ignored |
| `cargo test -p fgos-execution-engine --test confinement_policy` (inside the workspace run) | 22 passed, incl. `a_confined_launch_reads_the_owners_cargo_and_rustup_caches_read_only_and_runs_cargo_offline` |
| `cargo test -p fgos-execution-engine --test confinement_driver` (inside the workspace run) | 29 passed |
| `packages/execution/contracts` unchanged | no commit of this plan (`2646ea88ac..f5dc9b1cff`) touches it; the vector tests pass unchanged |
| `node scripts/plan-contract-check.mjs --plan plans/261127-1220-confined-rust-offline` | `ok` |

Release check result: `{"green": true, "tip": "f5dc9b1cff…"}`. Land gates of each branch land also passed
(`a2eb3be936` fix, `2241dc7fa3` live-check record).
