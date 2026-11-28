# Phase 4 integration and gate

All three phase branches landed on main on their own (phase 3 `e27d61b6cd`; phase 2 `00c7708f55`, `f41d1f61a1`;
phase 1 `f2279f8484`, `e8841a4eb4`). So the integrated tree is the main tip, and no merge was needed. The gate ran
on worktree `forgent-worktrees/261128-0942-session-type-submits-enter-p04` at tip `c7b3373510`. No code landed on
main between `e8841a4eb4` and that tip.

## Full gate (`fgos release check --worktree <p04>`)

| run | ticket | `npm test` | `cargo test --workspace` | red cause |
|---|---|---|---|---|
| 0 | c-26611-1795855121590 | - | - | Disk full during the cargo build (`No space left on device`, ld bus error). The supervisor removed the dead check checkout. |
| 1 | c-31274-1795858595021 | 6567 pass, 1 file failed | 1 failed | `test/runner/loop.test.mjs` hit the per-file watchdog (604 s, limit 600 s). `apps/fgos/tests/git_recover_confirm_dead.rs:141` failed with `ETXTBSY` (Text file busy). |
| 2 | c-39953-1795859962990 | stopped by the gate's time limit (2509 passed, 0 failed so far) | **green** | Machine load average 20 to 25 from parallel gates. |
| 3 | c-47183-1795862450180 | **green** (6594 tests, 6567 pass, 0 fail) | 1 failed | `packages/execution/engine/tests/transport_round.rs:1748` failed a timing check: "the handover waited on the supervisor: 579.9 ms". |

Verdict: criterion 5's gate part is met on tip `c7b3373510`. `npm test` is green in run 3, and
`cargo test --workspace` is green in run 2. All runs checked the same commit. Each red result is a different test,
each depends on timing or load, and none lies in this plan's footprint:

- `git_recover_confirm_dead` passed 3 times out of 3 when run alone on the same tree. The same panic also failed
  another plan's gate earlier today (lead 261125-1558, ticket c-73499-1795849237133).
- `loop.test.mjs` passed in every other recent gate log on this machine.
- `transport_round` passed in run 2 on the same commit. Its assertion bounds a wall-clock handover.

These three flakes are pre-existing debt. They are listed in `closing.md` for backlog rows, and are not fixed
here.

The tests this plan owns, run alone at `e8841a4eb4`: `terminal_vectors` 13 passed, `nudge_typed` 2 passed,
`typed_wake` 6 passed.

## Final gate after the live-check fixes

The p04b (`a27546744d`) and p04c (`70e53c73a2`) fixes landed code after the runs above, so the gate ran again on
worktree `forgent-worktrees/261128-0942-session-type-submits-enter-gate` at the new main tip `70e53c73a2`.

| run | ticket | `npm test` | `cargo test --workspace` | note |
|---|---|---|---|---|
| 4 | c-82657-1795871635393 | - | - | Died with the host (OOM at 20:17). Ignored. |
| 5 | c-1785-1795872019482 | **green** | 1 failed, run stopped | `git_recover_confirm_dead.rs:141` `ETXTBSY` again, load average 48. Without `--no-fail-fast`, only 13 targets ran. |
| 6 | c-6197-1795873280492 | **green** | **green** | `green: true`, 462 cargo result blocks ok, tip `70e53c73a2`. |

Verdict: criterion 5's gate part is met by one fully green run (run 6) on the final integrated tip.
