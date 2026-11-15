# Mail hook lock-busy skip count

## Findings (before)
- CounterReason (core/src/counters.rs) lives inside the mailbox snapshot; bumping it needs the mailbox lock, which is exactly what a lock-busy skip lacks. Wrong home for this count.
- outcome_log keeps one latest outcome (`record:lock-busy`), overwritten by the next outcome; no count. Breaker explicitly does not count lock-busy. `status` showed only "last hook outcome".

## Change
- `outcome_log::record` counts a lock-busy skip into `runtime/mailbox/hook-lock-busy.json` (`{count,lastAtMs}`), same door as the outcome file: trusted dir only, no lock, failed write ignored. Lower bound under racing skips.
- `status` JSON `hookLockBusy` and one text line, only when count > 0.
- No CounterReason, no config key, lockWaitMs unchanged (100 ms). Downgrade safe: older binaries never read the new file; no snapshot schema change.
- Test: hook_shell.rs, a real held lock makes a hook call skip; skip counts, a draining call does not, status shows it.
- Checks: fgos-mailbox hook_shell + verbs tests pass; clippy -D warnings clean; msvc and aarch64-apple-darwin check clean; git-one-door scan 0 undeclared (no Git/process sites changed, census unchanged).
- Files: store/src/hook/outcome_log.rs, record/paths.rs, verbs.rs, tests/hook_shell.rs, CHANGELOG.md. No need-ack files touched.
