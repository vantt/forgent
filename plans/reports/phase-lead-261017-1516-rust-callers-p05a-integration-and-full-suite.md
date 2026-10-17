# Rust callers P05 section A: integration, full suite, review, landing readiness

Status: DONE_WITH_CONCERNS

## Result
- Merged main (30 commits, clean) into `rust-callers/integration`. Phases P00-P04 were already merged there.
- Fixed two real test failures: `docs/specs/distribution.md` row 7b (second backticked `fgctl` broke the fix-id parser; reworded, `registrations.test.mjs` 57/57) and `test/rust-host/fgctl-init.test.mjs` (asserted the old activation lock path absent; init's own doctor fix may leave a tombstone dir there, now accepted).
- Review fix: `check_main_checkout_lock` mapped a Windows `Unsupported` probe to a plain io error; now `lock-driver-unavailable: main-checkout`.
- Nothing merged to main, no fgctl installed, no activation, no fence placed (section B).

## Evidence (private release build of fgos and fgctl, `FGOS_HOST_BIN` set, session env unset)
- `cargo build --release -p fgos -p fgctl`: ok. `cargo test --workspace`: 447 pass, 0 fail. `cargo check -p fgos-distribution -p fgos-observe -p fgctl --target x86_64-pc-windows-msvc --target aarch64-apple-darwin`: ok.
- Full `npm test` (before the three fixes above): 8140 tests, 8012 pass, 39 fail, 14 skipped. Failures: 2 holder-lock (now fixed: row 7b; fgctl-init fixed after the later serial run), `skill-wrappers.test.mjs:755` (gitignored wrapper missing in worktree, environment), and 36 in `test/runner/dispatch-policy-baseline-snapshot`, `dispatch`, `provider-adapter` (agy/gemini policy and config). The runner trio fails on main too: 35 fail here, 67 on a detached main worktree (the extra come from missing gitignored files); the branch changes none of those files.
- After fixes: `test/rust-host/*`, `test/holder-lock/*`, `test/setup/holder-lock-checks`, `test/setup/registrations`, run serially: 294 tests, 290 pass at the run, the 1 failure (fgctl-init) fixed and file re-run 11/11; skipped 3. Parallel runs of these files can fail the two fence tests in `holder-lock-checks.test.mjs` when another fgOS process runs in the worktree (quiesce scan sees it); the file alone passes 13/13.
- Criterion 3 `rg`: only `DEFAULT_TTL_MS` in `lock.rs` (the intentional v1 main-checkout read branch, D2) and `create_new` in `eval_journal.rs` (journal file, not a lock).
- Not re-run after the last two commits: the full `npm test` (changes are one Rust error mapping, one doc line, one test assertion).

## Review (one Sonnet round)
No critical or high. Verified: no description leak into `run_tail` (O_CLOEXEC, std OpenOptions), D3 order (probe, install released before activation, no nesting), no v1 path except D2, snapshot write inside the observe lock, no test writes the real state root.
- M1 Windows probe mislabel: fixed.
- M2 machine-wide install tombstone placed from one workspace's `doctor --fix`, gated only by that workspace's release: covered by the landing order (all three workspaces activate the new release before any `doctor --fix`); kept, listed below as a landing rule.
- L1 `lock-fences` check/fix throw when no state root can be resolved on the bare `node bin/fgos.mjs` channel: accepted, landing uses the host/shim.
- L2 tombstone skip accepts any directory; L3 probe opens read-write (crate of the earlier lock phase, read-only fs only): accepted, no action.

## Landing readiness: stop-everything list (section C of the phase file)
1. Stop every writer in forgentX, mdview, mcp-skill-hub: agent sessions, `fgos run`, workflow runner, `fgos gateway stop`, background runner, agy/pi/omp panes. The quiesce scan blocks `doctor --fix` while any `fgos`/`fgctl` process of the workspace runs.
2. ff-merge `rust-callers/integration` into main (main checkout, no branch switch; merge main again first, main moves).
3. `cargo build --release -p fgctl`; keep old as `fgctl.pre-rust-callers`; install over the one path `which -a fgctl` returns (`~/.local/bin/fgctl`).
4. Build, stage, activate the release in all three workspaces with the new fgctl, before any `doctor --fix`.
5. Per workspace `fgos doctor --fix` for `lock-fences`; install tombstone is machine-wide, placed once by the first.
6. `fgos doctor` via the shim in all three: `active-release-matches-checkout`, `lock-fences`, `lock-kernel-semantics`, `lock-borrow-vectors`, `state-root` pass, no unknown `lock-holders`.
7. Remove `fgctl.pre-rust-callers`, reopen work, write landing report ("No component-boundary change"), tell the 4.3 lead.
- Before step 3 run section B (old fgctl/observe against the fences on a scratch workspace).

## Decisions
- Fixed the review and test issues here instead of deferring them.
- Repointed this worktree's build-output link to the phase-private build dir (fgctl fixture runs `<repo>/<build>/release/fgctl`).

## Concerns
- Full `npm test` not repeated after the final three commits; pre-existing runner failures and one missing gitignored wrapper remain red in this worktree.
- GitNexus index stale; callers cross-checked by grep and by the reviewer.

No component-boundary change.

## Unresolved questions
None.
