# Iron Law evidence — tsk-6ci

`classifyIronLaw` result on this item's committed diff (commit `9b06831f`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/runner/lock-wait.mjs"]
}
```

## Test command

`node --test test/runner/lock-wait.test.mjs`

## Failing-before proof

Temporarily reverted `src/runner/lock-wait.mjs` to its pre-fix content
(`git checkout HEAD~1 -- src/runner/lock-wait.mjs`), keeping the new
tests from commit `9b06831f`, and ran the suite:

```
✖ withLockRetry: renders remaining-TTL phrase and holder qualifier when remainingTtlMs > 0 (tsk-6ci) (751.097305ms)
  AssertionError [ERR_ASSERTION]: printed line must include both holder qualifier and remaining TTL phrase when remainingTtlMs > 0
✖ withLockRetry: renders stale/fgos-unlock hint when remainingTtlMs === 0 (tsk-6ci) (751.597671ms)
  AssertionError [ERR_ASSERTION]: printed line must include stale hint when remainingTtlMs === 0
ℹ tests 16
ℹ pass 14
ℹ fail 2
```

## Verification proof

Restored the real fix (`git checkout HEAD -- src/runner/lock-wait.mjs`,
back to commit `9b06831f`'s committed state) and re-ran:

```
✔ withLockRetry: renders remaining-TTL phrase and holder qualifier when remainingTtlMs > 0 (tsk-6ci) (750.597238ms)
✔ withLockRetry: renders stale/fgos-unlock hint when remainingTtlMs === 0 (tsk-6ci) (750.567558ms)
✔ withLockRetry: renders sanely with no fabricated duration claim when remainingTtlMs is undefined (tsk-6ci) (750.133123ms)
ℹ tests 16
ℹ pass 16
ℹ fail 0
```

All 16 tests in the file pass, 0 failures, including the 3 new tests
proving the remaining-TTL phrase, the stale/`fgos-unlock` hint, and the
no-fabricated-value fallback.
