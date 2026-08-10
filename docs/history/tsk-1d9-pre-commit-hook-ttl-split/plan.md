# Plan: split the main-checkout-lock TTL, hook-specific default

Item: `tsk-1d9`. Mode: **small** — one new constant, one call-site swap,
one doc comment, tests. No design question left open after `CONTEXT.md`
D0-D4; no split.

## Approach

1. `src/runner/main-checkout-lock.mjs`: add `export const HOOK_TTL_MS = 20
   * 1000;` next to `DEFAULT_TTL_MS`, with a doc comment citing this item
   and `CONTEXT.md` D0/D4 — why it's short, why it's separate from
   `DEFAULT_TTL_MS`, and the accepted same-session-pause tradeoff. Leave
   `DEFAULT_TTL_MS` itself byte-unchanged (still 180s) — `claim-port.mjs`
   and `merge.mjs` keep reading it directly, untouched.
2. `.githooks/pre-commit`: import `HOOK_TTL_MS` alongside the existing
   `HELD`/`AMBIGUOUS`/`DEFAULT_TTL_MS` import (drop `DEFAULT_TTL_MS` from
   that import only if nothing else in the file still needs it — checked:
   nothing else does). `resolveTtlMs()`'s fallback (when
   `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS` is unset) changes from
   `DEFAULT_TTL_MS` to `HOOK_TTL_MS`. The explicit-env-var path is
   byte-unchanged — every existing e2e test that sets the env var directly
   keeps passing without modification.
3. Tests: add one assertion each to
   `test/runner/main-checkout-lock.test.mjs` (the new constant exists, is
   a positive number, and is strictly less than `DEFAULT_TTL_MS`) and
   `test/e2e/main-checkout-lock-hook.test.mjs` (hook falls back to the new
   short default — not the old 180s one — when
   `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS` is unset; a lock older than the new
   default but younger than 180s is correctly treated as free).

## Risk map

| Component | Risk | Proof |
|---|---|---|
| New `HOOK_TTL_MS` constant | low — additive, no existing symbol renamed/moved | grep confirms `DEFAULT_TTL_MS` has exactly 4 call sites (`claim-port.mjs:103`, `merge.mjs:660`, `bin/fgos.mjs:4104`, and its own `main-checkout-lock.mjs` declaration) — none of the first three touched |
| `resolveTtlMs()` fallback swap | medium — changes the hook's real-world default hold time, the whole point of this item | e2e test asserts the new default takes effect when the env var is unset; existing explicit-env-var tests (`100`, `15*60*1000`) stay byte-identical, proving the override path is unaffected |
| Same-session pause > 20s narrows self-recognition protection (CONTEXT.md D4) | low-medium, accepted and named, not hidden | no proof possible beyond citing the tradeoff plainly — this is a judgment call about an acceptable risk level, not a bug to fix away; env var remains the escape hatch if 20s proves too short in practice |

Impact-analysis posture: `degraded` — `fgos tool query --capability
impact-analysis --status present` returns GitNexus `present`, but its
index is stale (hook-reported: last indexed `4ce7a96`, well behind current
HEAD) and repo-name lookups against it failed outright this session.
Cross-checked with `grep -rn "acquireMainCheckoutLock(" src .githooks bin`
instead (4 call sites, all read in full) per `CLAUDE.md`'s own guidance to
cross-check a degraded/failing impact-analysis answer rather than trust it
blind.

## Outstanding questions

None
