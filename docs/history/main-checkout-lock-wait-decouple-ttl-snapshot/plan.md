# plan: decouple explicit `--wait` from the remainingTtlMs snapshot (tsk-2rf)

Status: shaped, pending approval
Depends on: `docs/history/main-checkout-lock-wait-decouple-ttl-snapshot/CONTEXT.md` (D1-D5, approved)

## Mode

Flags counted:
- **public contract** — yes. `--wait <ms>` is an existing, documented CLI
  flag on `take`/`pick`/`merge`/`approve`; this changes its behavior (D2)
  from "tighten only" to "true ceiling when explicit."
- **existing covered behavior** — yes.
  `test/runner/lock-wait.test.mjs:79-91` and
  `test/cli/fgos.test.mjs:7931` both assert today's tighten-only semantics
  directly. Both must keep passing (they only exercise `waitMs <
  remainingTtlMs`, which is unchanged by D2 — a smaller explicit `waitMs`
  still wins either way) — the new behavior only shows up when explicit
  `waitMs > remainingTtlMs`, a case neither test hits today.
- auth / authorization / data model / audit-security / external systems /
  cross-platform / multi-domain / weak proof — none apply.

2 flags, no hard-gate flag (no auth, no data loss, no audit/security, no
external provider, no validation removed) → **standard** — matches the
item's own recorded `tier: standard`.

## Approach

Single-piece item, no split. `fgos graph tsk-2rf --json`: `deps: []`, isolated
component of size 1 — nothing else in the graph depends on or blocks this,
so there is no unblock-ordering question to weigh.

Chosen path: extend `withLockRetry`'s own budget computation to accept an
"unbounded relative to remainingTtlMs" mode when the caller explicitly
supplies `waitMs`, rather than adding a second retry helper or a new CLI
verb (honors CONTEXT.md D1/D5: same four verbs, no new surface).

Alternative rejected: a separate `fgos wait <id>` blocking command
(considered during clarify, see CONTEXT.md's original option set) —
rejected by D5, since it would duplicate `withLockRetry`'s own retry/backoff
loop under a second name for no behavioral gain over extending the existing
one.

### Risk map

| Component | Risk | Proof point (→ fgos-coding-validating) |
|---|---|---|
| `withLockRetry` budget formula (`src/runner/lock-wait.mjs:35-62`) | Medium — the exact line that both existing tests pin (`waitMs` vs `remainingTtlMs` interplay) | Confirm both existing tests (`lock-wait.test.mjs:79`, `fgos.test.mjs:7931`) still pass unmodified, and add a new case for `waitMs > remainingTtlMs` extending past it |
| `parseWaitFlags` cap (`bin/fgos.mjs:205-221`) | Low — additive validation branch, same shape as the existing non-positive check | New cap-rejection test parallel to the existing `--wait must be a positive number` test |
| Progress status line (D4) | Low — cosmetic, stderr-only, no state effect | Manual/inspection check in validating; not a correctness-bearing proof point |

Impact-analysis capability gate (`fgos tool query --capability
impact-analysis --status present`, already run during clarify): 1 provider
(`gitnexus`, `present`) → **impact-analysis: full** per `CLAUDE.md`'s gate.
`fgos-coding-validating` should run real `impact`/`detect_changes` against
`withLockRetry` and `parseWaitFlags` before this item is treated as proven,
per the MUST rules in `CLAUDE.md`/`AGENTS.md`.

## Files touched

- `src/runner/lock-wait.mjs` — `withLockRetry`'s budget computation (lines
  35-62): when `waitMs` is explicitly passed AND exceeds `remainingTtlMs`,
  use `waitMs` as the true ceiling instead of `Math.min(remainingTtlMs,
  waitMs)`. Omitted `waitMs` unchanged (falls back to `remainingTtlMs`
  alone, D1). Add the periodic stderr status line (D4) once elapsed time
  passes the original `remainingTtlMs` snapshot.
- `bin/fgos.mjs` — `parseWaitFlags` (lines 205-221): reject an explicit
  `--wait` value above 900000ms (D3), same validation-error shape as the
  existing non-positive check.
- `test/runner/lock-wait.test.mjs` — new case(s) for `waitMs >
  remainingTtlMs` extending the wait past the snapshot; confirm the two
  existing tests (immediate-fail-message tests, tighten-below-remainingTtlMs
  test) are unaffected.
- `test/cli/fgos.test.mjs` — new case for the 900000ms cap rejection,
  parallel to the existing `--wait` validation tests near line 7931.

## Order

1. `lock-wait.mjs` budget formula + its unit tests (self-contained, no CLI
   dependency).
2. `parseWaitFlags` cap + its CLI test (independent of #1, can run in
   parallel with it, but sequencing #1 first keeps the CLI-layer test able
   to exercise the real extended-wait behavior underneath the cap check).
3. Progress status line (D4) — smallest, cosmetic, last.

## Verify

Item-level (already set by discover's clear verdict): `npm test`. No split
— this is the one verify command for the whole item.

## Assumptions

- The periodic status line (D4) writes to stderr, not stdout — keeps
  scripts parsing stdout JSON output unaffected. (Not material enough to
  send back to `fgos-coding-exploring`; implementer detail, flagged here per
  step 7's own filter.)
- "Elapsed passes the original remainingTtlMs snapshot" (D4's trigger point)
  is measured from the same `start = Date.now()` `withLockRetry` already
  tracks, compared against the first-caught error's `remainingTtlMs` — no
  new clock source needed.
