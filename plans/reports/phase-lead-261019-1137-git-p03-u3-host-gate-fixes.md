# Git phase 03 host-gate fixes

Fixed all four reported branch regressions. Unreadable live same-user/unknown-owner cwds now warn on stderr with pid and comm instead of refusing remove/move; readable cwds within the checkout still refuse. Added a real Linux same-user PR_SET_DUMPABLE=0 process test that verifies unreadability, successful removal and the matching warning. Custody and status guards remain in place. Recorded the coordinator policy dated 2026-10-19 in the Git spec and changelog.

Regenerated the version vector through `node test/rust-host/generate-vectors.mjs`. Added `git-worktree-recovery` to the canonical doctor inventory (the current Data Dictionary #7 test reads that inventory). The CLI fixture now declares the checkout Node payload in its addon-bearing dev manifest, satisfying the existing payload-identity check and exercising the native port through the public CLI.

Reused the existing process scan, custody/status checks, addon fixture, dev host and vector generator. Prior art: `8a8362712` introduced the cwd refusal; unit 2 narrowed it by ownership, which still refused non-dumpable desktop services. Impact-analysis: inactive (zero providers).

Validation, all green:

- Focused Node gate: 41 passed, including Worktree/recovery, public CLI, envelope vectors and Git doctor checks; `test/setup/registrations.test.mjs`: 58 passed.
- `cargo test -p fgos-git --lib`: 37 passed; `cargo test -p fgos-git --test worktree`: 5 passed, including real-Git crash barriers.
- `cargo clippy -p fgos-git --lib -- -D warnings`; vector generator `--check`; `git diff --check`.

Logs: `/tmp/p03-u3-{focused,registry,rust,integration,clippy}.log`. No full `npm test` claim: `/var/tmp` is not writable in this sandbox, and the coordinator reruns the real desktop-host gate. Windows/macOS were not run. No env switches, test-only production branches, Cargo-target hardcoding, staging or commits. No out-of-scope edits. The program-board lane update is outside the enforced write scope and is requested via `needsWrites`. Convention returned an 11:39 path; this report uses the exact 11:37 assignment path. MDView preview failed with a read-only database.

Status: DONE_WITH_CONCERNS
Summary: All four host-gate regressions are fixed and targeted checks pass.
Concerns/Blockers: Full desktop-host gate remains for the coordinator; program-board update needs write scope.
Context refs:
- (none)
