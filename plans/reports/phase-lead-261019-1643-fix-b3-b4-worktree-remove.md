# B3/B4 Worktree removal fixes

2026-10-19, Asia/Saigon. Scope: Worktree safety checks and regression tests.

Verified the triage against source and history (`8a8362712`, `0568323ee`). Before the fix, the real non-dumpable-process regression emitted three warnings for one PID, and a plain linked checkout with clean tracked `.fgos` refused removal.

B3: reuse the existing Process scan and all three custody/cwd rechecks; share one PID warning set across each remove/relocate invocation. Both operations now have real-process tests asserting exactly one warning.

B4: reuse byte-safe index inspection (`ls-files -v -z`), refusing reappearing S/s paths and wholly untracked `.fgos`; existing status/ignored checks preserve other foreign bytes. Clean tracked state removes successfully. Tests cover clean and modified plain checkouts and recreated skip-worktree state with identical bytes. The existing foreign-file test now expects the precise dirty-state refusal; preservation still holds. Added the requested dated sentence in Git spec §3 and an Unreleased changelog line. No new dependency, config, setup or doctor requirement; no phase-05 files changed.

Validation: `cargo test -p fgos-git` passed (94 passed, one existing ignored crash-child harness); `cargo clippy -p fgos-git --all-targets -- -D warnings` passed; `node --test test/git/worktree*.test.mjs test/verbs/*.test.mjs` passed (63/63); `git diff --check` passed. impact-analysis: inactive (no providers registered).

All requested test gates ran in this sandbox; the coordinator still owns the full host gate/full npm suite. MDView preview failed with a read-only database error. No out-of-scope edits, git add or commit. The program board was read and left unchanged because it is outside the explicit write scope. Report path confirmed through `fgos convention path --type phase-lead --slug fix-b3-b4-worktree-remove --at 2026-10-19T16:43:00+07:00 --json`.

Status: DONE
Summary: Fixed duplicate cwd warnings and over-broad tracked `.fgos` refusal, with passing regression gates.
Context refs:
- plans/reports/debug-261019-1631-landing-bugs-triage.md (B3/B4)
- docs/platform/git/spec.md §3
