# Iron Law evidence — tsk-2tm

`classifyIronLaw` on this item's final diff returns:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/runner/main-checkout-lock.mjs"]
}
```

`src/runner/main-checkout-lock.mjs` is on `MODULE_RULES`
(`src/evolve/iron-law.mjs`) as a self-modifying-capable module (the file
this item's own diff genuinely changes — no false positive here, unlike
`docs/history/context-md-enforcement-scope/iron-law-evidence.md`'s
description-keyword case).

## Why the race couldn't be reproduced by real concurrent processes

The bug (D-decisions in `CONTEXT.md`) is a TOCTOU window between
`fs.openSync(lockPath, 'wx')` and the later `fs.writeSync` — nanosecond-scale
under normal OS scheduling. A first attempt at a failing-test-first proof
used two real child processes racing `acquireMainCheckoutLock` on a fresh
lock path (10 rounds, string identities, `ttlMs: 60_000`); it **passed
against the pre-fix code every round** — OS scheduling luck, not evidence of
correctness. That test still exists
(`test/runner/main-checkout-lock.test.mjs`, "two processes racing to create
a genuinely NEW lock...") as a real proof of the mutual-exclusion invariant
(D3) under genuine concurrency, but it is not the failing-test-first proof
for the torn-read bug itself.

## The actual failing-test-first proof: deterministic syscall interception

Two new tests instead structurally detect the exact vulnerable pattern the
bug report named, by monkey-patching the shared `node:fs` singleton (both
`main-checkout-lock.mjs` and the test import the same `fs` module object) to
observe what the lock file contains at the precise instant the pre-fix code
would have exposed it mid-write:

- `deterministic: the create path never makes lockPath observable via
  fs.openSync(path, "wx") before its content is fully written (tsk-2tm)`
- `deterministic: the self-recognition refresh path never truncates
  lockPath in place via a direct fs.writeFileSync(lockPath, ...) (tsk-2tm)`

### RED — run against the pre-fix code

Pre-fix `src/runner/main-checkout-lock.mjs` restored from
`git show eda082b^:src/runner/main-checkout-lock.mjs` (the parent of this
item's own implementation commit), with the new tests from the post-fix
`test/runner/main-checkout-lock.test.mjs` layered on top:

```
$ node --test --test-name-pattern="deterministic" test/runner/main-checkout-lock.test.mjs

✖ deterministic: the create path never makes lockPath observable via fs.openSync(path, "wx") before its content is fully written (tsk-2tm) (18.236529ms)
  AssertionError [ERR_ASSERTION]: the create path must never call fs.openSync(lockPath, 'wx') directly -- doing so is exactly the two-step create/write pattern that leaves lockPath observable with incomplete content ("") before the record is fully written

  '' !== undefined

✖ deterministic: the self-recognition refresh path never truncates lockPath in place via a direct fs.writeFileSync(lockPath, ...) (tsk-2tm) (13.721914ms)
  AssertionError [ERR_ASSERTION]: the refresh path must never call fs.writeFileSync directly on the lock path -- that truncates in place, leaving the file observably empty/partial mid-write

  true !== false

ℹ tests 2
ℹ pass 0
ℹ fail 2
```

The first failure's actual value is the empty string `""` — a real,
directly-observed read of the lock file at the exact instant between
`fs.openSync(lockPath, 'wx')` (which creates a 0-byte file) and the later
`fs.writeSync` populating it. This is the production bug (tsk-3lx's false
AMBIGUOUS), reproduced deterministically rather than by timing luck.

### GREEN — run against the fixed code

```
$ node --test --test-name-pattern="deterministic" test/runner/main-checkout-lock.test.mjs

✔ deterministic: the create path never makes lockPath observable via fs.openSync(path, "wx") before its content is fully written (tsk-2tm) (17.407433ms)
✔ deterministic: the self-recognition refresh path never truncates lockPath in place via a direct fs.writeFileSync(lockPath, ...) (tsk-2tm) (13.551641ms)

ℹ tests 2
ℹ pass 2
ℹ fail 0
```

### Full suite, post-fix

```
$ node --test test/runner/main-checkout-lock.test.mjs
ℹ tests 44
ℹ pass 44
ℹ fail 0

$ node --test test/e2e/main-checkout-lock-hook.test.mjs
ℹ tests 10
ℹ pass 10
ℹ fail 0

$ npm test
ℹ tests 2381
ℹ pass 2376
ℹ fail 0
ℹ skipped 5
```

## Verification source

- `src/evolve/iron-law.mjs` — `classifyIronLaw`'s `MODULE_RULES` list,
  confirming `src/runner/` (and this file specifically) is self-modifying-
  capable and triggers `required: true` on a real files-changed match, not
  a description-keyword false positive.
- The RED/GREEN transcripts above — both real command runs against real
  file contents swapped in/out on disk (`/tmp/main-checkout-lock-pre-fix.mjs`,
  extracted via `git show`), not paraphrased or fabricated.
- `docs/history/main-checkout-lock-toctou-race/CONTEXT.md` D1-D4 and
  `plan.md`'s risk map — the decisions and proof points this evidence
  satisfies.
