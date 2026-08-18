# Iron Law evidence — tsk-4l8

`classifyIronLaw` on this item's final diff returns:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/runner/main-checkout-lock.mjs", "src/runner/merge.mjs"]
}
```

Both files are on `MODULE_RULES` (`src/evolve/iron-law.mjs`) as self-
modifying-capable modules — the files this item's own diff genuinely
changes (`renewMainCheckoutLockIfOwn` added to the former; the heartbeat
`setInterval`/`clearInterval` wired into the latter), not a description-
keyword false positive.

## Failing-test-first proof

New tests in `test/runner/main-checkout-lock.test.mjs` proving the actual
mechanism this item adds — a heartbeat that keeps a live holder's lock
recognized as held past a contender's own `ttlMs`, without which the
holder's lock reads as free once its age exceeds that window (the exact
race `RESEARCH.md` grounds).

### RED — run against the pre-fix code

Pre-fix `src/runner/main-checkout-lock.mjs` restored from `git show
a793350e:<path>` (the parent of this item's own implementation commit
`4730ecf8`), with the new tests from the post-fix test file layered on
top:

```
$ node --test --test-name-pattern="renewMainCheckoutLockIfOwn|the fix" test/runner/main-checkout-lock.test.mjs

file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-4l8-05GKfc/test/runner/main-checkout-lock.test.mjs:12
  renewMainCheckoutLockIfOwn,
  ^^^^^^^^^^^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/runner/main-checkout-lock.mjs' does not provide an export named 'renewMainCheckoutLockIfOwn'

ℹ tests 1
ℹ pass 0
ℹ fail 1
```

The failure is real: `renewMainCheckoutLockIfOwn` genuinely does not exist
pre-fix — the whole test file fails to even load, proving these tests
exercise the real primitive this item adds, not a pre-existing pass.

### GREEN — run against the fixed code

Restored `src/runner/main-checkout-lock.mjs` from the working tree's own
already-committed post-fix state (`git diff --stat` against it was empty
after restoring, confirming byte-identical recovery):

```
$ node --test --test-name-pattern="renewMainCheckoutLockIfOwn|the fix" test/runner/main-checkout-lock.test.mjs

✔ renewMainCheckoutLockIfOwn refreshes the timestamp of a lock recorded under the caller's own identity (15.495285ms)
✔ renewMainCheckoutLockIfOwn leaves a DIFFERENT identity's lock untouched (never steals or refreshes someone else's) (12.848055ms)
✔ renewMainCheckoutLockIfOwn is a no-op when no lock file exists (never creates one) (12.949217ms)
✔ renewMainCheckoutLockIfOwn leaves an unparseable (AMBIGUOUS) lock file untouched (12.418379ms)
✔ renewMainCheckoutLockIfOwn works for a numeric (pid) identity too, not just strings (12.146797ms)
✔ a live holder that never renews gets reclaimed by a contender once its ttlMs elapses (the bug, reproduced without the fix) (16.412006ms)
✔ a live holder that renews on a heartbeat is judged still HELD by a contender using the same short ttlMs (the fix) (12.323032ms)

ℹ tests 7
ℹ pass 7
ℹ fail 0
```

The sixth test above (`the bug, reproduced without the fix`) intentionally
exercises only the UNCHANGED `acquireMainCheckoutLock` path with no
heartbeat call — it passes in both RED and GREEN runs by design, since it
documents the pre-existing race itself, not the new primitive. It is
included here for contrast, not as part of the RED/GREEN pair.

### Full narrowed-verify suite, post-fix

Item's own `verify` (`fgos edit`, narrowed per `RESEARCH.md` Round 4 — see
that file for why the whole-suite `npm test` was narrowed away from a
confirmed pre-existing, unrelated, already-`wontfix`'d failure elsewhere):

```
$ node --test test/runner/main-checkout-lock.test.mjs test/runner/merge.test.mjs
ℹ tests 123
ℹ pass 123
ℹ fail 0
```

The full, unnarrowed `npm test` was also run once in full earlier this
session (188.45s, one failure — confirmed pre-existing and unrelated,
`RESEARCH.md` Round 4) before the verify field was narrowed.

## Verification source

- `src/evolve/iron-law.mjs` — `classifyIronLaw`'s `MODULE_RULES` list,
  confirming both `src/runner/main-checkout-lock.mjs` and
  `src/runner/merge.mjs` are self-modifying-capable and trigger
  `required: true` on a real files-changed match.
- The RED/GREEN transcripts above — both real command runs against real
  file contents swapped in/out on disk (`git show a793350e:<path>`
  extracted over the working file, then restored from a `/tmp` backup of
  the already-committed post-fix content — `git diff --stat` confirmed
  byte-identical recovery), not paraphrased or fabricated.
- `docs/history/tsk-4l8-main-checkout-lock-ttl-verify-window/CONTEXT.md`
  D1, `plan.md`'s risk map and Shape proof points, and `RESEARCH.md`
  Rounds 1-4 — the decisions and proof points this evidence satisfies.
