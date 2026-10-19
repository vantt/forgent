# Git phase 06: operation-local preflight

ScopedCommit/Sync now reuse config and format facts within one port call. No facts survive into the next call. Publication/CAS preflight is unchanged.

The repetition came from `checkout_call`: explicit preflight followed by full `resolve_repo` before every child; resolution itself preflighted its format commands and reread config. Prior art: `dc6c91249` introduced format/layout detection; `0074f94ae` added the per-child checkout re-resolution. Those safety checks were intentional. This change reuses the existing topology resolver, config parser/trust policy, format probes and spawn door, separating disk topology from Git facts rather than adding another cache service.

Every ScopedCommit/Sync entry (preflight, commit, checkpoint, recovery, start/inspect/continue/abort) creates an internal handle with freshly validated config and formats. The port's persistent handle contains no config snapshot. Every child still checks reciprocal topology and custody. Hook-path selection uses the same config records. After a hook-bearing command returns, including rejection/transport failure, facts are invalidated and checked once again. Failed refresh fences observation and cleanup, preserving WAL for recovery. Config records are excluded from Debug output. Raw external Git remains outside cooperative exclusion.

## Exec evidence

The existing E3 script now has a narrow `scoped-census` mode: a selected Git wrapper logs argv and execs real Git, through normal containment and the real Node loan. No ptrace, driver switch or test-only production branch. Constructor/floor setup is outside the counted interval.

Same fixture, original HEAD sources versus final sources:

| Calls per preflight + commit | Before | After |
|---|---:|---:|
| Preflight | 48 | 9 |
| Commit | 165 | 28 |
| Total | 213 | 37 |
| Config origin/list | 133 | 3 |
| Object format | 26 | 3 |
| Ref format | 26 | 3 |

Reduction: 176 execs (82.6%). Original sources were temporarily restored from HEAD for the baseline, then the implementation restored. The host report's ~193 is a different fixture; these are exec counts, not host timing acceptance.

## Verification

- `cargo test --locked -p fgos-git`: 115 passed, one existing ignored crash-child helper.
- `cargo clippy --locked -p fgos-git --all-targets -- -D warnings`: passed.
- `node --test test/git/scoped-commit.test.mjs test/git/sync.test.mjs test/git/commit-parent-death.test.mjs test/git/lock-handover.test.mjs test/git/cutover-grant.test.mjs`: 43 passed. Includes exact census, between-call freshness, post-hook config changes on success/rejection, format changes, parent death, descendant drain and custody handover.
- `git diff --check`: passed. Impact-analysis: inactive (zero providers).

E3 and full `npm test` were intentionally left for the host coordinator. The budget file assigns 150/250 ms to changing CAS; ScopedCommit uses the relative typed-operation budget. Neither timing gate is claimed here. No git add/commit. No setup defaults, dependencies or environment switches added. Program-board updates are outside this assignment's write scope and remain with the coordinator. MDView preview was attempted but its database is read-only in this environment.

Status: DONE_WITH_CONCERNS
Summary: Reduced same-fixture ScopedCommit execs from 213 to 37 while retaining operation-entry and post-hook safety checks.
Concerns/Blockers: Host E3/full-suite acceptance remains pending; coordinator must update the program board outside this write scope.
Context refs:
- (none)
