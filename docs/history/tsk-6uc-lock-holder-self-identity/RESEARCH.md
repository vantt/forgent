# RESEARCH: tsk-6uc — main-checkout.lock holder-identity self-vs-other ambiguity

## Round 1 — 2026-08-21 (discovery stage, via fgos-coding-discovering)

**Asked:** locate the exact source of the "still waiting on main-checkout
lock (holder pid <id>, Ns elapsed)" poll line; confirm what holder-identity
value it prints; determine whether the calling session's own identity is
already accessible at that print site for a self-vs-other comparison;
check `fgos-unlock`'s contract for any existing identity comparison; check
`tsk-6ci` for scope overlap.

**Checked (repo):**
- `src/runner/lock-wait.mjs:90-93` — the exact print site:
  `` `still waiting on main-checkout lock (holder pid ${err.holderPid}, ...)` ``.
  `err.holderPid` is whatever the throwing call attached (`claim-port.mjs`/
  `merge.mjs`), which is itself `record.pid` off the on-disk lock file
  (`main-checkout-lock.mjs`'s `tryAcquireOnce`, `HELD` branch, line
  296-300).
- `src/runner/main-checkout-lock.mjs:166-192` — `record.pid` ("the on-disk
  field name stays literally `pid`") is deliberately typed as EITHER a
  positive integer (`isUsableIdentity`) OR a non-empty opaque string
  session id — both are real, live shapes today, not a hypothetical.
- `src/runner/claim-port.mjs:105`, `src/runner/merge.mjs:772,889` — the
  three call sites that ACQUIRE `main-checkout.lock` today all pass
  `identity: process.pid` (numeric), each with an explicit comment
  (tsk-70l, tsk-18k) explaining this was a deliberate fix away from
  `resolveWriterIdentity()`'s string session id, specifically to avoid two
  independent OS processes wrongly self-recognizing each other under a
  shared env session id.
- `src/runner/main-checkout-lock.mjs:133-146` (`HOLDER_PID_ENV_VAR`) —
  `.githooks/pre-commit`'s own lock re-check/refresh is the ONE remaining
  call site that still falls back to `resolveWriterIdentity()` (a STRING
  session id) whenever the parent process didn't thread
  `FGOS_MAIN_LOCK_HOLDER_PID` through to the `git commit` child. This is
  the live path that can still write a string identity into
  `main-checkout.lock` today — confirmed by a second, already-`done` item
  built on the same fact (next bullet).
- `docs/history/tsk-24t-unlock-honest-string-identity-message/CONTEXT.md`
  (item `tsk-24t`, status `done`) — an already-shipped, narrowly-scoped
  fix for `bin/fgos.mjs`'s `unlock` case: when `holderPid` is a `string`,
  `main-checkout-lock.mjs`'s own design (D5) never actually probes
  liveness for it (TTL-only judged) — `unlock`'s old message dishonestly
  claimed "live session" regardless of shape. tsk-24t's fix is
  message-wording only, scoped to `unlock`'s own `HELD` branch — it never
  touches `lock-wait.mjs`'s poll line, and never compares the recorded
  identity against the CALLING session's own identity. **No scope overlap
  with tsk-6uc** — tsk-24t answers "is this claim of liveness honest",
  tsk-6uc asks "is this holder ME or someone else", a different
  comparison entirely.
- `test/runner/lock-wait.test.mjs` — existing coverage of the poll line;
  ran green (10/10) as a baseline: `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1
  node --test test/runner/lock-wait.test.mjs`.
- `.agents/skills/fgos-unlock/SKILL.md` — the unlock recovery skill's own
  flow (steps 1-4) never compares the reported holder identity against the
  caller's own; it only reads `unlock`'s cleared/live-held result verbatim.
  No existing self-vs-other mechanism anywhere in the lock stack.
- `data.work['tsk-6ci']` (`fgos list --id tsk-6ci --json`) — confirmed
  distinct scope: tsk-6ci is about opaque-wait UX (no ETA/progress/queue
  position), explicitly already distinguished in both items' own
  description text as "a different angle on the same lock". No overlap.

**Found:**
1. The print site (`lock-wait.mjs:92`) has no access today to the calling
   process's own identity — it only has `err.holderPid`. The caller's own
   identity, when needed, is cheaply re-derivable at that same call site
   with the exact same primitives already used elsewhere in this module
   (`process.pid` for the numeric case; `resolveWriterIdentity(fgosDir)`
   from `src/util/session-identity.mjs` for the string case) — no new
   primitive required.
2. Both shapes (numeric pid, string session id) are real and reachable
   today, not a stale/pre-fix artifact: the numeric shape via the three
   explicit acquirers (tsk-70l/tsk-18k), the string shape via the
   pre-commit hook's own fallback identity resolution whenever
   `HOLDER_PID_ENV_VAR` isn't threaded through a given commit path. This
   resolves what initially looked like a discrepancy between the item's
   own reported evidence (a UUID-format holder identity) and the two
   numeric-pid call sites — the UUID came from the hook's own fallback
   path, not from claim-port.mjs/merge.mjs's explicit acquirers.
3. No existing code anywhere in the lock stack (`lock-wait.mjs`,
   `bin/fgos.mjs`'s `unlock` case, `fgos-unlock`'s own skill contract)
   does a self-vs-other identity comparison. The gap the item describes is
   real and currently unaddressed.

**Verdict: clear.** Verify (item had none real yet — `"chưa xác định — P15
bổ sung"`): `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test
test/runner/lock-wait.test.mjs` — ran green (10/10) as the pre-fix
baseline; a planning-stage implementation extends this same file with a
self-identity-match case.
