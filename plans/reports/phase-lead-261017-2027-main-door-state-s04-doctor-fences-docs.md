# Wave S, S4: doctor, fences and docs for the state hot mutex

Status: DONE_WITH_CONCERNS. Branch `main-door-state/s04-doctor-fences-docs` (`dc8acf9bf`, `247d2d1a1`) merged into `main-door-state/integration` (`aa7568df3`). Main had not moved. F10 held: no event format, `merge=union`, `.gitattributes`, strip rule or event store registry row touched.

## What landed
- Fences: `state` (old `.fgos/events.lock` + `.fgos/runtime/claims.lock`) and `porting-events` (`.fgos/porting/events.lock`) are tombstoned like the main door locks (`MAIN_DOOR_LOCKS`; `v1PathsOf` accepts an array `v1Path`). `lock-fences` now covers 13 paths.
- Check `lock-record-unreadable` (`src/setup/lock-record-checks.mjs`, registered in `registrations.mjs`): warns when a `state`/`porting-events` hot record does not parse, or its judge answers `unknown` for over 5 min; names the path and the fence command; never fails, no auto fix. `lock-holders` lists the two `*.reclaim.lock` files (the `.hot` record is not a kernel lock file).
- `fgos lock fence state|porting-events` now works on hot records (reviewer finding: the fence only looked at the reclaim kernel lock, so an unreadable record could never be cleared). Alive holder: signalled by identity after confirm; unreadable or unjudgeable record: needs `--attest-stopped`; the record is removed under the reclaim lock only while its bytes are unchanged (`clearHotRecord` in `hot-lock.mjs`, `fenceHotRecord` in `lock-fence.mjs`).
- Docs: holder-lock spec §15 (rewritten from placeholder), §17 step 5, §18 table, history; component-boundary; work-state (RUL10 note + 5 present-tense mentions); reading-map (`hot-lock.mjs` row); runner; session-identity; event-store path fix (`state.hot`, `state.reclaim.lock`); distribution rows 5g, 7; architecture manifest row; CHANGELOG (4 Changed lines, 1 Added).

## Evidence
- Real v1 code from the base commit (`a9e48b67d`) against the tombstones: `withEventsLock` (main and porting logs) and `withClaimsLock` all throw `EISDIR`; none takes the lock (`test/holder-lock/fences-main-door.test.mjs`, 7/7). Recorded in CHANGELOG.
- Host for tests: `FGOS_HOST_BIN` = S3's private-target build (Rust untouched by S1 to S4).
- Phase files: `test/holder-lock/*`, `test/setup/*`, `test/cli/fgos-lock-fence.test.mjs`, `test/architecture.test.mjs`, `test/state/*`, `test/docs/*`, `test/convention/*`: all green except the one pre-existing red below. On the integration worktree after merge: 1002 tests, 998 pass, 3 skipped, 1 red.
- Full `npm test` on the phase branch before the last two fixes: 8149 tests, 8056 pass, 14 skipped, 4 red. Two of the four were mine and are fixed (`fences-rust-locks` doctor test needed owner 4.3; a new work-state line cited RUL10 without gloss); `state-cutover` "delivered gate retries" is load-flaky (green alone, 3/3); the last two are pre-existing.
- `fgos convention check --all` exit 0.

## Impact
GitNexus index stale. Edited symbols: `fenceLock` (callers: `bin/fgos.mjs` lock verb only), `fenceTargets`/`isCutOverLock` (callers: `holder-lock-checks.mjs`, tests), `fgosDirOf` (now exported). LOW. No HIGH/CRITICAL.

## Concerns
- Pre-existing red on integration, not from this phase: `check-decision-citation-drift` (ADR0055/ADR0003 without gloss at `docs/specs/platform-foundations.md:66`, `work-state.md:1200`), `setup/skill-wrappers` projection (missing generated `.claude/skills/instruction-audit`).
- Windows: hot record fails closed; `fgos lock fence state --attest-stopped` is the exit until the Windows judge (4.4b P05).
- `fgos doctor --fix` places the new fences only in a workspace whose activated release ships the registry with these rows; activating this release is the owner's step.

## Unresolved questions
None blocking.
