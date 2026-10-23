# WORK lane: main merged in, holder-lock door and the hot-lock release fix

Merge `3bf66cb97` of `origin/main` (tip `c56f1eae3`) into `work/es-cutover`. Merge, not rebase: `790616298` is still an ancestor with its hash.

## Conflicts (18) and what was done

- `src/state/hot-lock.mjs`: main's header, record and acquire code and its depth counter (`hotLockDepth`, no `noteLockHeld`/`noteLockReleased`); WORK's staging (`tx.append`/commit, in-gate `tx.view`, read guards, no `tx.eventStore`) on top.
- Deleted by WORK, edited by main, kept deleted: the three one-shot migrate scripts and `main-fgos-checkpoint.mjs` (main only added `ensureGitAddon()` and a `fgosDirFromRoot` call; no new caller), `test/git/legacy-event-adapter.test.mjs` (main only dropped an argument).
- Deleted by main, edited by WORK, deletion accepted: `identity-before-lock.test.mjs` (owners: identity golden vectors, `hot-lock-guard.test.mjs`, `seat-binding/client.test.mjs`, named in main's commit) and `hot-lock-known-exec-sites.test.mjs` (owner: `hot-lock-guard.test.mjs`). WORK's edits to them were fixture adaptations to the removed event files.
- Tests: `hot-lock-tx`, `subcommand-flag-drift` (both sides: `events` and `identity`), `store`, `dispatch`, `checks` (main's file with WORK's event-store rows, `EVENT_STORE_DEFAULTS`, the work-repository fixtures, no `checkpoint`/`lock` default).
- Docs: CHANGELOG both sides; `setup-doctor-registry.md` and `distribution.md` rows 7/7b main's text with WORK's check and fix ids applied.
- Census and `test/suite-baseline.json` regenerated with their tools (`--write-census`; `test-proof-inventory.mjs --write-baseline`: 594 files, 7977 calls, 0 clones, same as main's 0).

## Hot-lock release fix, redone

`withStateTx` does not call the facade `release()`; its own release is `releaseRecord` (unlink), which still throws `hot-lock-release-stuck` on a Windows sharing block. The facade `release()` (never throws, returns `settled`) is used only in `reclaimDeadHolder` and `clearHotRecord`, which ignore the settle. So the rule is applied to `releaseRecord`:
- callback returned: committed result kept, the failure is not thrown;
- callback threw: its own error is rethrown, carrying the failure as `releaseFailure`;
- the record stays; the next acquirer waits out `hot-lock-timeout` pointing at `fgos lock fence`, the same way T1 leaves a stuck `release()` settle to `lock-holders` and `fence`.

Changed: `src/state/hot-lock.mjs`; spec section 15 "Release limit" (it said the error replaces the callback result); `test/holder-lock/windows-hot-lock.test.mjs` (Windows only, not run here) now expects the committed result and the record left. Owning proof on Linux: `test/state/hot-lock-tx.test.mjs` "a record that cannot be released never replaces the callback result or its error" (non-retryable unlink; the retryable `EPERM`/`EBUSY` branch shares the same catch).

## Counts (focused runs, one at a time, rebuilt release host, fgctl and addon)

| Set | Tests | Fail |
|---|---|---|
| `test/state test/event-store test/cli test/intake test/config` | 2664 (2598 pass) | 0 |
| `test/setup` | 920 (919 pass) | 0 |
| `test/runner` (`FGOS_TEST_FILE_TIMEOUT_MS=900000`) | 3013 (3011 pass) | 0 |
| `test/git test/architecture.test.mjs` | 198 (197 pass) | 0 |
| `test/rust-host` | 147 (146 pass) | 0 |
| `test/holder-lock` | 76 (56 pass, 20 skipped: Windows) | 0 |

`cargo test --locked -p fgos-git -p fgos -p fgos-holder-lock`: green. Census `--check`: five `unresolved-binary` sites (`bin/fgos.mjs:3484,3628`, `merge.mjs:1216,1246`, `worktree.mjs:146`), the same five as plain main; none added. Nothing was red, so no plain-main comparison worktree was needed.

## Notes for the owner

1. A cleared skip-worktree flag on `.fgos/config.json` (content equal to HEAD) was needed for the merge; it is not set again.
2. `test/setup` is 920 tests now (was 1509 with `test/scripts`): main retired the lock-fence and identity-cache suites.
3. Impact analysis: no provider registered, inactive; blast radius by `rg` only.
