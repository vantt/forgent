# CONTEXT: verb-timeout-fallback (tsk-3vo)

## Feature boundary

`fgos return`, `fgos approve`, and `fgos catchup` each run the item's own
`verify` command through `runGoalCheck` (`src/runner/goal-check.mjs`).
`runGoalCheck` only arms a timeout when `timeoutMs` is truthy
(`goal-check.mjs:42`, `if (timeoutMs) { timer = setTimeout(...) }`). Today
the three CLI verbs only set `timeoutMs` from an explicit `--timeout` flag
(`bin/fgos.mjs:1428-1432` return, `1680-1684` approve, `2062-2066`
catchup) — omitted, `timeoutMs` stays `undefined`, and verify can hang the
calling session forever. The runner loop's own call to the same primitive
(`src/runner/loop.mjs:689`) never has this gap: it always passes
`config.timeoutMs`, read from `.fgos-runner.json` (`timeoutMs: 900000`
today).

This item covers making the three CLI verbs share the runner loop's
default instead of silently diverging from it, while preserving an
explicit way to opt into a genuinely unbounded verify run. It does not
cover changing `runGoalCheck`'s own timer semantics, the runner loop's
config resolution, or the main-checkout-lock TTL interaction (noted below
as a known consequence, not something this item resolves).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix all three verbs (`return`, `approve`, `catchup`) in one item — same root cause, same fix shape, same error-text change. Not split per verb. |
| D2 | When `--timeout` is omitted, fall back to `.fgos-runner.json`'s `timeoutMs` (900000ms today) — the same value and same primitive (`runGoalCheck`) the runner loop already uses at `loop.mjs:689`, rather than a new independent default. |
| D3 | Add an explicit `--no-timeout` flag as the opt-out for a genuinely unbounded verify run. Omitting `--timeout` no longer means unbounded — it means "use the fallback." |
| D4 | Update the error text at `bin/fgos.mjs:1428`, `1680`, `2062` (currently `"omit --timeout entirely for no timeout"`) to reflect the new default+opt-out behavior — the current wording promises the opposite of the new behavior and must not ship stale. |
| D5 | Passing `--timeout` and `--no-timeout` together on the same invocation is a validation error that rejects both, rather than either flag silently winning. |

## Pinned terms

- **"fallback timeout"** — the value used when `--timeout` is absent and
  `--no-timeout` is absent: `.fgos-runner.json`'s `timeoutMs`, read the
  same way the runner loop already reads it for the same `runGoalCheck`
  call.
- **"no timeout"** — only reachable now via the explicit `--no-timeout`
  flag, never via omission.

## Scout evidence

- `src/runner/goal-check.mjs:42` — `runGoalCheck` skips the timer entirely
  when `timeoutMs` is falsy; a timeout resolves (never rejects)
  `{passed:false, status:null,...}`, the same contract every caller
  already relies on.
- `bin/fgos.mjs:1428-1432` (return), `1680-1684` (approve), `2062-2066`
  (catchup) — each verb's `timeoutFlag` parsing, currently the only
  source of `timeoutMs` for these three verbs.
- `bin/fgos.mjs:1428` / `1680` / `2062` — the three identical error strings
  `"... requires a numeric millisecond value (omit --timeout entirely for
  no timeout)"`, the text D4 requires updating.
- `src/runner/loop.mjs:689` — the runner loop's own `runGoalCheck` call,
  passing `config.timeoutMs` unconditionally; this is the existing
  behavior D2 aligns the CLI verbs to.
- `.fgos-runner.json` — `"timeoutMs": 900000`, the concrete fallback value
  under D2 today (a config value, so the fallback tracks the file, not a
  literal `900000` baked into the CLI verbs).
- `bin/fgos.mjs:1558`, `1576`, `2384` — `releaseMainCheckoutLockIfOwn` /
  `releaseMainCheckoutLock` calls in `return`/`catchup`, confirming the
  item description's claim that the main-checkout lock is only released
  after `runGoalCheck` resolves — a hung verify holds the lock until its
  TTL, which this item's fallback timeout directly bounds (a consequence
  of D2, not a separate decision).

## Canonical references

- `src/runner/goal-check.mjs` — the shared goal-check primitive.
- `bin/fgos.mjs` — CLI verb implementations for `return`, `approve`,
  `catchup`.
- `src/runner/loop.mjs` — the runner loop's own (already-correct) call
  site, the reference behavior D2 aligns to.
- `.fgos-runner.json` — the config file holding the fallback `timeoutMs`.

## Outstanding questions deferred to planning

- Exact mechanics of reading `.fgos-runner.json`'s `timeoutMs` from the
  three CLI verb call sites (shared helper vs. inline read; behavior if
  the config file is missing/unreadable) — implementer's call, not a
  product decision.
- Exact validation error message/exit code for the D5 conflict case —
  wording is implementation detail, only the "both rejected" behavior is
  locked.
- Whether `--no-timeout`'s absence of an argument needs special flag-
  parsing handling (boolean flag) vs. the existing `--timeout <ms>`
  value-flag pattern — implementer's call.
