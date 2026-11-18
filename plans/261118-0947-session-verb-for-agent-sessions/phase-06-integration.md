# Phase 6: Integration, docs and full gate

Depends on phases 1-5.

## Inputs (read first)
- plan.md acceptance criteria; the phase branches; `CHANGELOG.md` `[Unreleased]`; `docs/reading-map.md` (~178, session line, and the `fgos head`/session-host lines secretary phase 18 added); `docs/backlog.md` rows `p-g2iprtzptz`, `p-5x37olszki`, `p-xkkoaq6eoh`.

## Files this phase may write
See the phase table footprint in plan.md.

## Steps
1. Merge the phase branches in wave order onto one integration branch.
2. CHANGELOG `[Unreleased]`: `fgos session` now starts and rotates agent head sessions (was `fgos head`, which is gone); the per-session worktree verbs (`session start|end|list|gc`) are retired, use `fgos worktree create|remove`; leftover `.fgos/sessions.json` and `<tmp>/fgos-sessions` are inert and may be deleted; `fgos identity` drops `--fgos-dir`; gateway `/v1/sessions*` answer 501; doctor row `leaf-notify-drift` removed.
3. reading-map: drop the `session.rs` line; point the head-session line at `fgos session`.
4. Backlog: `p-g2iprtzptz` done (link this plan); `p-5x37olszki` closed obsolete; `p-xkkoaq6eoh` text no longer cites `fgos session`.
5. Run every acceptance criterion and the full gate; write `reports/integration.md` with the commands and results.

## Verify
- `npm test` (read run-tests ERROR lines and the fail count) and `cargo test --workspace` green; clippy `-D warnings`; msvc and aarch64-apple-darwin checks.
- `node scripts/plan-contract-check.mjs --plan plans/261118-0947-session-verb-for-agent-sessions`.

## Rollback
Revert the integration merge set in reverse wave order.
