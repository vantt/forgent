# PLAN: heartbeat-refresh the main-checkout lock during mergeRunnerItem's verify hold

Item: `tsk-4l8`. Mode: **standard** (2 flags apply — see below; no hard-gate
flag fires despite the item's own `risk: heavy` field, which predates this
investigation).

**Lane derivation (direct-entry fallback, `fgos-routing`'s own Mode-gate
table — no Orient handoff existed in this session, this skill is the first
to decide it):**
- ✅ existing covered behavior — `main-checkout-lock.mjs`/`merge.mjs` are
  load-bearing, tested, and already carry two prior band-aids on top
  (`tsk-18a`, `tsk-2j9`).
- ✅ weak proof around the area — the underlying defect is a real-time
  race; a deterministic reproduction of the original 184.93s-verify
  scenario is impractical in a fast unit test, so the proof point below
  is a controlled-clock unit test of the mechanism, not a literal repro.
- ❌ no hard-gate flag: the observed failure mode (two `git merge
  --no-commit` interleaving on one working tree) is transient working-tree
  corruption a session's own retry/verify-fail path already surfaces — git
  objects/history are never at risk, nothing is silently lost. Calling
  this "data loss" would overstate it (2 flags → **standard**, not
  **high-risk**, per the mechanical rule: 4+ flags or a real hard-gate
  flag needed for that lane).

## Approach

**Root cause (CONTEXT.md, already locked):** `main-checkout-lock.mjs`'s
`held = pidLive && withinTtl` (`:201-205`) requires the CONTENDER's own
`ttlMs` argument to judge an existing record fresh enough — this is per-
acquire-call, not per-holder: whichever session calls
`acquireMainCheckoutLock` next decides staleness using ITS OWN `ttlMs`
against the existing record's `ts`, regardless of what `ttlMs` the
original holder used. `mergeRunnerItem` (`merge.mjs:705`) acquires once,
then holds across the ENTIRE `mergeRunnerItemLocked` call (`merge.mjs:
719-723`'s own `try { return await mergeRunnerItemLocked(...) } finally {
lock.release() }`) — which itself calls `runGoalCheck` at **two** sites
(`:877`, an early "already merged" fast path, and `:938`, the main flow
after a real `git merge --no-commit`) — with nothing touching `record.ts`
anywhere in that window. Measured worst case: 184.93s > the 180s
`DEFAULT_TTL_MS`.

**Two approaches considered:**

1. **Raise `DEFAULT_TTL_MS`, or give `merge.mjs`'s own acquire call a
   separate, larger constant.** Rejected: because staleness is judged by
   the CONTENDER's `ttlMs`, not the holder's, this only protects a
   merge-vs-merge race (both sides import the same larger constant). It
   does **not** protect a merge-vs-claim race — `claim-port.mjs`'s own
   `acquireMainCheckoutLock` call (`claim-port.mjs:98`) still passes the
   original `DEFAULT_TTL_MS`, so a `fgos take`/`pick` racing a live,
   >180s-old merge hold would still judge it stale and steal it. Any fix
   that only changes one call site's own `ttlMs` is incomplete; raising
   the *shared* `DEFAULT_TTL_MS` instead would fix it but slows
   `claim-port.mjs`'s fast self-healing of a genuinely abandoned lock for
   every caller, a real cost this approach doesn't need to pay.
2. **Heartbeat-refresh `record.ts` while `mergeRunnerItem` holds the lock
   across `runGoalCheck`.** Chosen. This keeps `record.ts` fresh
   regardless of which `ttlMs` a contender uses (as long as the heartbeat
   interval stays comfortably under the smallest `ttlMs` any caller uses,
   180s today) — a merge-vs-claim race is protected the same as a
   merge-vs-merge one, with zero change to `DEFAULT_TTL_MS`,
   `claim-port.mjs`, or the pre-commit hook's own `HOOK_TTL_MS`
   (`tsk-1d9`). The refresh path already exists and is already proven
   safe: D6 self-recognition (`main-checkout-lock.mjs:214-219`) — same
   `identity` re-acquiring rewrites `ts` via `writeAtomicReplace` — is
   exactly what the pre-commit hook's own later acquisition already
   relies on at commit time; this plan reuses the identical write path
   earlier and repeatedly, not a new mechanism.
   **Explicitly preserved:** the `pidLive`-plus-`ttlMs` AND (not `OR`)
   requirement (`main-checkout-lock.mjs`'s own design: a live PID alone is
   unsafe as a sole liveness signal because PIDs are reused by the OS — a
   dead session's PID could be reclaimed by an unrelated live process). A
   heartbeat only keeps `ts` fresh for a session that is genuinely still
   working; a session that crashes mid-verify stops heartbeating, and the
   lock still self-heals after `ttlMs` from its LAST real heartbeat —
   identical self-healing behavior to today, just measured from the last
   heartbeat instead of the original acquire.

**Files touched:**
- `src/runner/main-checkout-lock.mjs` — export a small renew/touch helper
  (or reuse `acquireMainCheckoutLock` itself with the same `identity`,
  `releaseOnExit: false` — self-recognition already returns `ACQUIRED` and
  rewrites `ts` with no other side effect); exact shape decided during
  execution, not fixed here.
- `src/runner/merge.mjs` — start a periodic renew (`setInterval`,
  `.unref()`'d so it never blocks process exit, interval well under 180s
  e.g. 45-60s) right after the lock is confirmed `ACQUIRED` (`:705-717`,
  after the `HELD`/`AMBIGUOUS` throws), clear it in the EXISTING `finally`
  at `:721-722` alongside `lock.release()` — one wrap point around the
  whole `mergeRunnerItemLocked` call (`:719-723`) covers both
  `runGoalCheck` sites (`:877`, `:938`) and the git merge/commit work
  itself, simpler than wrapping each `runGoalCheck` call individually and
  guaranteed to clear on every exit path (success, verify-fail, thrown
  exception) the same way `lock.release()` already does today.

**GitNexus impact analysis (`CLAUDE.md` gate: `present`, freshly checked
this session → **full** posture, MUST run before editing any symbol):**

| Symbol | Direction | Risk | Callers/processes | What this means for the plan |
|---|---|---|---|---|
| `mergeRunnerItem` | upstream | LOW (impactedCount 0) | none indexed | The function this plan edits inside (`mergeRunnerItemLocked`'s body) has no blast radius upstream — safe to change its internals. |
| `acquireMainCheckoutLock` | upstream | **HIGH** (impactedCount 5) | `claimAndDispatch`/`claimWork`/`retargetMember` — 3 processes, 2 direct callers | **Constraint, not a blocker**: this plan must NOT change this function's existing exported signature or behavior — only ADD a new caller (the heartbeat) reusing its already-safe self-recognition path. If execution instead needs a new export, add it alongside, never edit the existing one's contract. |
| `runGoalCheck` | upstream | **CRITICAL** (impactedCount 8) | `claimAndDispatch`/`startupReap`/`runWatch`/`dispatchClaimedItem`/`retargetMember` — 5 processes, 3 direct callers | **Hard constraint**: this plan never edits `runGoalCheck` itself. The heartbeat wraps its CALL SITE in `merge.mjs` only — `runGoalCheck`'s own signature/body stays untouched. |

**⚠ Surfaced per `CLAUDE.md`'s "MUST warn the user if impact analysis
returns HIGH or CRITICAL risk" — flagged to the user before execution
starts, even though the actual edit surface (function bodies only, no
signature/contract change to either hub symbol) is designed to stay clear
of both blast radii.**

## Shape

Concrete cases the fix must hold up against (proof points for
`fgos-coding-validating` and for `fgos-coding-implement`'s own verify):

1. **The core race, proven with a controlled clock, not a real 184.93s
   wait**: write a lock record with `pid: <live pid>, ts: <old enough to
   exceed a short test ttlMs>` directly (same pattern
   `test/runner/main-checkout-lock.test.mjs` already uses, e.g. its
   `'reclaims a lock held by a live pid whose last-touched timestamp
   exceeds ttlMs'` case), call the new renew/touch helper with the SAME
   identity, then assert a second `acquireMainCheckoutLock` call from a
   DIFFERENT identity with the same short `ttlMs` now reports `HELD` (not
   reclaimed) — proves the heartbeat is what keeps a live holder
   protected past the original `ttlMs`, the exact mechanism `RESEARCH.md`
   found missing.
2. **Abandoned-lock self-healing is unchanged**: a lock whose LAST
   heartbeat (or original acquire, if it never heartbeats) is older than
   `ttlMs`, with a genuinely dead pid, is still reclaimed exactly as
   today — no test regression expected in the existing `'reclaims a lock
   held by a dead pid'` case, but this plan's own new test asserts it
   explicitly for the crashed-mid-heartbeat case too (heartbeat stops,
   lock still self-heals after `ttlMs` from the last real write).
3. **Timer hygiene**: the heartbeat interval is cleared in the EXISTING
   `finally` (`merge.mjs:721-722`) on every exit path from
   `mergeRunnerItemLocked` (success, verify-fail at either `runGoalCheck`
   site, or a thrown exception) — proven by asserting no leaked timer
   keeps the test process alive past the `mergeRunnerItem` call (Node's
   own test runner already fails a suite that leaves an active handle
   open past its file's own tests).
4. **Existing merge suite stays green**: `test/runner/merge.test.mjs`'s
   own existing cases (MERGE_HEAD guards, `tsk-18a`/`tsk-2j9` scenarios)
   pass unchanged — this fix adds a heartbeat around the existing
   acquire/`try`/`finally` region, it does not change either
   `runGoalCheck` call's own arguments or return handling.

**Assumptions (implementation-only, not material to `CONTEXT.md`'s locked
D1):**
- The heartbeat interval value (45-60s) is an implementation detail sized
  for a comfortable margin under the 180s `DEFAULT_TTL_MS`, not a new
  product decision — `fgos-coding-validating` may adjust it if evidence during
  proving suggests otherwise.
- No new exported constant/env var is required; `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS`
  (the existing per-session override) is untouched and still works exactly
  as documented.

No split: this is one honest, contained piece of work — a single file
pair, no independently-workable sub-pieces.

**Verify:** `npm test` (whole suite, per this repo's own DoD — `AGENTS.md`
question 5 — and because the fix's own proof points live in
`test/runner/main-checkout-lock.test.mjs`/`test/runner/merge.test.mjs`,
already part of that suite).

## Outstanding questions

None
