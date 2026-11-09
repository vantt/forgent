# Lead report: ownWorktree becomes tighten

Owner decision 79 Q6(c). Landed as one commit on main.

- `core/config-schema/runner.schema.yaml`: `launchConfinement.ownWorktree` gets `x-fgos-merge: tighten`.
- No Rust logic change: `lowers()` in `packages/config/rust/src/snapshot.rs` already refuses a scalar `true` turned into non-true, the same path as `confinement.strict`.
- Proof: `a_project_file_may_only_turn_own_worktree_on` in `packages/config/rust/tests/golden_snapshot.rs` (global true + project false refused `config-confinement-lowered` at line 6; global false + project true, true over true, and absent + false accepted). Red before the schema line (off-over-on accepted), green after.
- Spec section 4 (rule text, second-executor example), decision history line, CHANGELOG line.
- Check: no shipped config, main `.fgos/config.*` or `~/.fgos/config.*` sets `ownWorktree`.
- Gate: fmt, clippy -D warnings (fgos-config), cargo test fgos-config, architecture, doc-health, decision-citation-drift, config facade tests, one-door census regenerated (0 undeclared). Rust source untouched (test only), so no msvc/darwin check. Full npm test: 2 red, V7n addendum (known) and test/runner/loop.test.mjs timing out at 600 s under load; loop.test.mjs rerun alone 99/99 green. The leftover-tmpdir ERROR came from that kill.
