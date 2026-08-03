# CONTEXT: decouple explicit `--wait` from the remainingTtlMs snapshot (tsk-2rf)

## Feature boundary

`withLockRetry` (`src/runner/lock-wait.mjs`) currently freezes its wait
budget from the `remainingTtlMs` of the *first* `lock-held` error, and
`--wait` can only tighten that budget (`bin/fgos.mjs:207`: "never extends
past the lock's own remainingTtlMs"). Against a genuinely active,
continuously self-refreshing holder (self-recognition, D6,
`main-checkout-lock.mjs:161-167`), a fresh `remainingTtlMs` reading is
always near-max, so no `--wait` value and no retry count can ever outlast
it — the waiting session always fails once that first fixed budget runs
out, no matter what the caller asks for. This item makes an *explicit*
`--wait <ms>` a true wall-clock ceiling instead, so a caller who knows the
holder is a legitimate long-running session (not stale/orphaned) can
actually wait it out. The *default* (no `--wait` flag) retry behavior is
untouched.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Decoupling from the `remainingTtlMs` snapshot applies **only when the caller passes an explicit `--wait <ms>`**. Omitting `--wait` entirely keeps today's exact behavior: bounded by the first HELD error's `remainingTtlMs`, per tsk-6c2 D3's "default ON, no flag needed" baseline. No automated caller in this repo (`/fgOS:cleanup-loop`, `/fgOS:merge-loop`, etc.) passes `--wait` today — none of them are affected by this change; they keep today's fast-fail. |
| D2 | An explicit `--wait <ms>` becomes the true wall-clock ceiling for `withLockRetry`: no longer `Math.min(remainingTtlMs, waitMs)`. The retry keeps polling on the same backoff schedule (500ms → 1s → 2s cap) until either `fn()` succeeds, `--wait` elapses, or a non-`lock-held` error is thrown (`AMBIGUOUS` etc. still fails immediately — untouched, per tsk-6c2's own non-goal). |
| D3 | Explicit `--wait` is capped at **900000ms (15 minutes)**. A value above the cap is rejected with the same validation-error style `parseWaitFlags` already uses for non-positive values (`bin/fgos.mjs:211-221`). Rationale: long enough to outlast a normal active-holder execution burst; short enough that a mistyped `--wait` value doesn't hang a CLI call near-indefinitely. |
| D4 | Once elapsed wait passes the point where today's un-decoupled behavior would already have given up (i.e. past the original `remainingTtlMs` snapshot read at the first HELD error), print a periodic status line each backoff tick to stderr (e.g. holder pid, elapsed seconds) — so an extended wait past that point never looks like a silent hang. Before that point, output is unchanged (today emits nothing mid-retry). |
| D5 | Same four verbs that already carry `--wait` today — `take`, `pick`, `merge`, `approve` (`bin/fgos.mjs:1727,1782,2150,2694`) — no new verb or command surface (e.g. no separate `fgos wait <id>`). |

## Reopening an explicit non-goal — why, and what's different this time

Two prior items already decided this exact question the other way:

- `docs/history/fgos-wait-retry-main-checkout-lock/CONTEXT.md` (tsk-6c2,
  the item that built `withLockRetry` itself) — explicit non-goal: "Does
  not help a genuinely live, continuously-refreshed holder (a long
  operation that keeps touching the lock) — retry exhausts its budget and
  still fails. By design: this lock is not meant for long-running work."
- `docs/history/tsk-45y-worktree-fgos-lock-decouple-stale-premise/CONTEXT.md`
  D5 — closed **wontfix**, citing tsk-6c2's `--wait` as the full
  already-shipped mitigation for lock-contention UX pain: "No further
  mitigation is pending on this item's outcome."

What tsk-2rf brings that neither of those had: **real recurring
frequency** — the user reports hitting this often in practice (evidence:
`fgos pick tsk-27y` fail exit 7, 2026-08-03, "held 0s... waited 141528ms
before giving up" — the holder pid was genuinely alive and actively
refreshing, not stale). D1-D5 above accept this as new evidence and
scope the reversal narrowly: only the explicit opt-in `--wait` path
changes; the default-ON bounded retry tsk-6c2 shipped stays exactly as
decided.

## Pinned terms

- **wait budget** (redefined from tsk-6c2's original pin): when `--wait`
  is **omitted**, unchanged — `remainingTtlMs` read at the first HELD
  error. When `--wait` is **explicitly passed**, it is now the wait budget
  directly, with no `remainingTtlMs` cap, itself capped at 900000ms (D3).
- **self-recognition** / **HELD** / **AMBIGUOUS** / **ACQUIRED**:
  unchanged, as defined in `src/runner/main-checkout-lock.mjs`.

## Non-goals

- `AMBIGUOUS` still fails immediately on the first attempt — untouched,
  per tsk-6c2's own non-goal (D5's cap/decouple only ever applies to the
  `lock-held` retry path).
- No change to `main-checkout-lock.mjs`/`tryAcquireOnce` itself — same
  scope boundary tsk-6c2 already drew ("wraps the existing primitive...
  never edits `main-checkout-lock.mjs`").
- No fairness/queueing mechanism between multiple waiters — this item
  only lets one waiter outlast one active holder's own TTL snapshot; it
  does not order or prioritize concurrent waiters against each other.
- No change to automated-loop default behavior (D1) — this is an opt-in
  escape hatch for a human who already knows the holder is legitimate,
  not a new default for unattended callers.

## Scout paths and evidence cited

- `src/runner/lock-wait.mjs:35-62` — `withLockRetry`, the frozen
  `budgetMs` computation (line 44-47) this item changes.
- `src/runner/main-checkout-lock.mjs:161-167` — self-recognition (D6),
  why an active holder's `remainingTtlMs` never meaningfully decreases.
- `bin/fgos.mjs:205-221` (`parseWaitFlags`), `1727`/`1782`/`2150`/`2694`
  (the four `withLockRetry` call sites: take/pick/approve/sync-root(merge)).
- `docs/history/fgos-wait-retry-main-checkout-lock/CONTEXT.md` — the
  non-goal this item scopes a reversal of (D1-D3 there, non-goals
  section).
- `docs/history/tsk-45y-worktree-fgos-lock-decouple-stale-premise/CONTEXT.md`
  D5 — the wontfix closure citing `--wait` as the (previously) final
  mitigation.
- `fgos tool query --capability impact-analysis --status present` (this
  session): 1 provider (`gitnexus`, status `present`) —
  `impact-analysis: full` per `CLAUDE.md`'s gate. Informational only;
  this item makes no code change yet.

## Canonical references

- `plans/reports/research-260730-1133-cli-wait-flag-main-checkout-lock-design.md`
  (tsk-6c2's original design note)
- `plans/reports/research-260730-1133-open-lock-contention-items-survey.md`
  (tsk-45y's original survey)

## Outstanding — deferred to planning

- Exact implementation shape of the periodic status line (D4) — format,
  which stream, whether it's suppressible — implementer detail.
- Unit/integration test shape for the decoupled-budget path and the
  900000ms cap rejection — planning's job, not clarify's.
